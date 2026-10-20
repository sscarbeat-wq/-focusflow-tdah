// "Captura rápida" (inspirado en el mecanismo de Eco, de Bitblocks SAS) —
// deja una idea suelta por voz o texto sin tener que decidir primero en qué
// panel va. El navegador manda audio (base64) o texto ya escrito; este
// endpoint 1) transcribe el audio si hace falta, 2) revisa el filtro de
// palabras de riesgo sobre el texto (mismo filtro que ya usa el Compañero
// de apoyo y "Ayuda con mensajes" — una nota de voz es texto libre real,
// mismo tratamiento de seguridad), y 3) le pide a la IA que proponga a qué
// categoría pertenece (medicamento / pago / paso del desglosador / nota
// general), con los datos que haya mencionado la persona.
//
// IMPORTANTE, decisión de diseño clínica: este endpoint nunca escribe nada
// por sí mismo en medicamentos, pagos ni pasos — solo PROPONE una
// clasificación con los datos que entendió. Es el navegador el que, con la
// confirmación explícita de la paciente (un toque en "Sí, agrégalo"), llama
// a las funciones que ya existían para agregar cada cosa (addMedication,
// addPayment, el paso del desglosador) — mismo principio que el resto de
// Senda: la IA sugiere, la persona confirma, nunca se escribe solo un dato
// clínico a partir de una transcripción que pudo haberse entendido mal.
//
// Import con extensión ".js" explícita a propósito en todos los imports de
// src/ — este archivo es una función serverless de Vercel, y un import
// relativo sin extensión puede resolverse bien en el navegador (Vite) pero
// tronar el empacador de funciones de Vercel (ver la lección del 20 de
// octubre de 2026 en el roadmap).
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_QUICK_CAPTURE_AI_USAGE,
  nextQuickCaptureAiUsage,
  QUICK_CAPTURE_AI_MONTHLY_LIMIT,
} from "../src/aiUsage.js";
import { containsRiskLanguage } from "../src/companionSituations.js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CHAT_MODEL = "gpt-4o-mini";
const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const QUICK_CAPTURE_TYPES = ["medicamento", "pago", "paso", "nota"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId, audioBase64, mimeType, text } = req.body || {};
  if (!userId || (!audioBase64 && !String(text || "").trim())) {
    return res.status(400).json({ error: "Falta el audio, el texto o el usuario." });
  }

  try {
    // 1) Leer y actualizar el contador de uso mensual ANTES de llamar a la
    // IA, para no gastar nunca si el paciente ya llegó al límite.
    const { data: row, error: readErr } = await supabaseAdmin
      .from("progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;

    const progressData = row?.data || {};
    const { usage, allowed } = nextQuickCaptureAiUsage(progressData.quickCaptureAiUsage || DEFAULT_QUICK_CAPTURE_AI_USAGE);

    if (!allowed) {
      return res.status(429).json({
        error: `Llegaste al límite de ${QUICK_CAPTURE_AI_MONTHLY_LIMIT} capturas rápidas con IA este mes.`,
      });
    }

    // 2) Transcribir el audio si vino por voz; si ya vino como texto
    // escrito (la persona usó el teclado en vez del micrófono), se usa tal
    // cual.
    const rawText = audioBase64 ? await transcribeAudio(audioBase64, mimeType) : String(text || "").trim();
    const cleanText = rawText.trim().slice(0, 500);
    if (!cleanText) {
      return res.status(200).json({ error: "No se entendió ninguna palabra. Intenta de nuevo." });
    }

    // 3) Filtro de seguridad — mismo que "Ayuda con mensajes": si el texto
    // (transcrito o escrito) ya toca autolesión/crisis, nunca se manda a la
    // IA a "clasificarlo" como si fuera un pago o un medicamento. Se
    // consume el uso del mes de todas formas (ya se gastó en la
    // transcripción si venía de audio), pero nunca se llega a clasificar.
    if (containsRiskLanguage(cleanText)) {
      await saveUsage(userId, progressData, usage);
      return res.status(200).json({ unsafe: true });
    }

    // 4) Clasificar con IA.
    const suggestion = await classifyNote(cleanText);

    await saveUsage(userId, progressData, usage);

    res.status(200).json({ noteText: suggestion.noteText || cleanText, type: suggestion.type, fields: suggestion.fields });
  } catch (err) {
    console.error("Error en quick-capture:", err);
    res.status(500).json({ error: "No se pudo procesar la nota. Intenta de nuevo en un momento." });
  }
}

async function saveUsage(userId, progressData, usage) {
  const { error: writeErr } = await supabaseAdmin
    .from("progress")
    .upsert({
      user_id: userId,
      data: { ...progressData, quickCaptureAiUsage: usage },
      updated_at: new Date().toISOString(),
    });
  if (writeErr) throw writeErr;
}

async function transcribeAudio(audioBase64, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const buffer = Buffer.from(audioBase64, "base64");
  const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
  const form = new FormData();
  form.append("file", blob, "nota.webm");
  form.append("model", TRANSCRIBE_MODEL);
  form.append("language", "es");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error de OpenAI (transcripción):", errText);
    throw new Error("Error al transcribir el audio.");
  }

  const data = await response.json();
  return String(data.text || "").trim();
}

async function classifyNote(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Alguien con TDAH acaba de dictar o escribir una nota rápida en una app de salud mental. Tu trabajo " +
            'es proponer a qué categoría pertenece, SIN inventar datos que la persona no dijo. Responde SOLO ' +
            'con un objeto JSON de la forma {"type": "...", "fields": {...}, "noteText": "..."}.\n\n' +
            '"type" es uno de estos 4 valores exactos:\n' +
            '- "medicamento": quiere que le recuerden TOMAR (ingerir) una dosis de un medicamento, a una hora ' +
            'del día, de forma repetida — una dosis nueva para agregar a su lista de medicamentos. Usa este ' +
            'tipo SOLO cuando el verbo es tomar/tomarse/ingerir (o claramente equivalente). Si lo que pide es ' +
            'COMPRAR, surtir, recoger, pedir, renovar una receta, o investigar sobre un medicamento, eso NO es ' +
            'una dosis diaria — es un pendiente de una sola vez, así que va en "paso", nunca en "medicamento". ' +
            'fields: {"name": string, "time": "HH:MM" en formato 24 horas si mencionó una hora, o null si no ' +
            "la mencionó}.\n" +
            '- "pago": quiere un recordatorio de un pago o suscripción recurrente. fields: {"name": string, ' +
            '"amount": string o null (tal cual lo dijo, ej. "$219"), "frequency": "mensual" o "anual", ' +
            '"dueDay": entero 1-31 si lo mencionó, o null}.\n' +
            '- "paso": un pendiente, mandado, trámite o tarea de una sola vez que quiere que no se le olvide ' +
            '(ej. "comprar medicamento", "surtir la receta", "llamar al banco", "recoger algo"), o un paso de ' +
            'una tarea que está desglosando ahora mismo. fields: {"text": string, "min": entero entre 2 y 20, ' +
            'estimado si no lo dijo}.\n' +
            '- "nota": cualquier otra cosa — una idea, un pensamiento, algo para llevar un diario, sin acción ' +
            "concreta pendiente. fields: {} (vacío).\n\n" +
            'Ejemplo para no confundir medicamento con paso: "recuérdame tomar mi pastilla a las 8am" es ' +
            '"medicamento"; "recuérdame comprar mi medicamento" o "tengo que surtir mi receta" es "paso", NO ' +
            '"medicamento", porque es comprar/surtir, no tomar una dosis.\n\n' +
            'Si tienes cualquier duda de la categoría, usa "nota" — es la opción segura por default. ' +
            '"noteText" siempre lleva una versión breve y limpia (sin relleno) de lo que la persona dijo, en ' +
            "español de México, sin importar el type elegido — es lo que se guarda como la nota en sí.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error de OpenAI (clasificación):", errText);
    throw new Error("Error al conectar con el servicio de IA.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  //
