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
// "multiple": true (Módulo 3 de ANRO TDAH 2.0 — "Descarga mental con IA",
// 8 de noviembre de 2026): mismo endpoint, mismo flujo de transcripción +
// filtro de seguridad + clasificación de arriba, pero para un texto más
// largo donde la paciente "vacía la cabeza" de varios pendientes a la vez
// en vez de dictar una sola nota — la respuesta entonces es una LISTA de
// sugerencias (una por cada pendiente que la IA distinguió en el texto) en
// vez de una sola, y se cuenta contra un límite mensual aparte
// (brainDumpAiUsage) porque cada uso aquí hace más trabajo de clasificación
// que una nota suelta. NO se creó un archivo nuevo en api/ para esto a
// propósito — el plan de Vercel de este proyecto ya está muy cerca del
// máximo de funciones serverless permitidas (ver la nota en
// api/breakdown-task.js), así que extender este mismo endpoint evita
// arriesgar el deploy por una función más.
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
  DEFAULT_BRAIN_DUMP_AI_USAGE,
  nextBrainDumpAiUsage,
  BRAIN_DUMP_AI_MONTHLY_LIMIT,
} from "../src/aiUsage.js";
import { containsRiskLanguage } from "../src/companionSituations.js";
import { aiLanguageName, whisperLanguageCode, aiErrorMessages } from "../src/aiLanguage.js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CHAT_MODEL = "gpt-4o-mini";
const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const QUICK_CAPTURE_TYPES = ["medicamento", "pago", "paso", "nota"];
// Tope de pendientes que regresa una sola descarga mental — una lista
// interminable de tarjetas por confirmar sería justo el tipo de "ruido"
// que esta app intenta reducir en vez de agregar.
const BRAIN_DUMP_MAX_ITEMS = 8;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId, audioBase64, mimeType, text, language, multiple } = req.body || {};
  if (!userId || (!audioBase64 && !String(text || "").trim())) {
    return res.status(400).json({ error: "Falta el audio, el texto o el usuario." });
  }

  const usageField = multiple ? "brainDumpAiUsage" : "quickCaptureAiUsage";

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
    const { usage, allowed } = multiple
      ? nextBrainDumpAiUsage(progressData.brainDumpAiUsage || DEFAULT_BRAIN_DUMP_AI_USAGE)
      : nextQuickCaptureAiUsage(progressData.quickCaptureAiUsage || DEFAULT_QUICK_CAPTURE_AI_USAGE);

    if (!allowed) {
      return res.status(429).json({
        error: multiple
          ? aiErrorMessages(language).brainDumpLimit(BRAIN_DUMP_AI_MONTHLY_LIMIT)
          : aiErrorMessages(language).quickCaptureLimit(QUICK_CAPTURE_AI_MONTHLY_LIMIT),
      });
    }

    // 2) Transcribir el audio si vino por voz; si ya vino como texto
    // escrito (la persona usó el teclado en vez del micrófono), se usa tal
    // cual. Una descarga mental puede traer varios pendientes juntos, así
    // que se permite un texto más largo que una nota suelta.
    const rawText = audioBase64 ? await transcribeAudio(audioBase64, mimeType, language) : String(text || "").trim();
    const cleanText = rawText.trim().slice(0, multiple ? 1500 : 500);
    if (!cleanText) {
      return res.status(200).json({
        error: multiple ? aiErrorMessages(language).brainDumpEmpty : aiErrorMessages(language).quickCaptureEmpty,
      });
    }

    // 3) Filtro de seguridad — mismo que "Ayuda con mensajes": si el texto
    // (transcrito o escrito) ya toca autolesión/crisis, nunca se manda a la
    // IA a "clasificarlo" como si fuera un pago o un medicamento. Se
    // consume el uso del mes de todas formas (ya se gastó en la
    // transcripción si venía de audio), pero nunca se llega a clasificar.
    if (containsRiskLanguage(cleanText)) {
      await saveUsage(userId, progressData, usage, usageField);
      return res.status(200).json({ unsafe: true });
    }

    // 4) Clasificar con IA — una sola sugerencia, o una lista si es
    // descarga mental.
    if (multiple) {
      const items = await classifyBrainDump(cleanText, language);
      await saveUsage(userId, progressData, usage, usageField);
      return res.status(200).json({ items });
    }

    const suggestion = await classifyNote(cleanText, language);
    await saveUsage(userId, progressData, usage, usageField);
    res.status(200).json({ noteText: suggestion.noteText || cleanText, type: suggestion.type, fields: suggestion.fields });
  } catch (err) {
    console.error("Error en quick-capture:", err);
    res.status(500).json({
      error: multiple ? aiErrorMessages(language).brainDumpFailed : aiErrorMessages(language).quickCaptureFailed,
    });
  }
}

async function saveUsage(userId, progressData, usage, usageField) {
  const { error: writeErr } = await supabaseAdmin
    .from("progress")
    .upsert({
      user_id: userId,
      data: { ...progressData, [usageField]: usage },
      updated_at: new Date().toISOString(),
    });
  if (writeErr) throw writeErr;
}

async function transcribeAudio(audioBase64, mimeType, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const buffer = Buffer.from(audioBase64, "base64");
  const blob = new Blob([buffer], { type: mimeType || "audio/webm" });
  const form = new FormData();
  form.append("file", blob, "nota.webm");
  form.append("model", TRANSCRIBE_MODEL);
  // El idioma que la paciente eligió en la app — nunca se detecta del
  // audio, porque forzarlo evita que Whisper "adivine mal" con acentos o
  // palabras sueltas en otro idioma (ver src/aiLanguage.js).
  form.append("language", whisperLanguageCode(language));

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

async function classifyNote(text, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const languageName = aiLanguageName(language);

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
            `${languageName}, sin importar el type elegido — es lo que se guarda como la nota en sí (tradúcela ` +
            `a ${languageName} si el texto original vino en otro idioma). El valor de "type" SIEMPRE se queda ` +
            "en uno de los 4 valores exactos de arriba (medicamento/pago/paso/nota), nunca se traduce.",
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

  // Validación defensiva: si la IA manda un type inválido o campos raros,
  // esto cae a "nota" en vez de fallar todo — y el navegador, de todas
  // formas, nunca escribe un medicamento/pago/paso sin que la persona lo
  // confirme con un toque, así que un campo mal formado aquí nunca llega a
  // guardarse solo.
  const type = QUICK_CAPTURE_TYPES.includes(parsed?.type) ? parsed.type : "nota";
  const fields = parsed && typeof parsed.fields === "object" && parsed.fields !== null ? parsed.fields : {};
  const noteText = String(parsed?.noteText || "").trim().slice(0, 300);

  return { type, fields, noteText };
}

// Misma idea que classifyNote, pero para un texto que puede traer VARIOS
// pendientes mezclados (Módulo 3 — "Descarga mental con IA"): se le pide a
// la IA que separe el texto en una lista de pendientes, cada uno con
// exactamente el mismo esquema de "type"/"fields"/"noteText" que ya usa
// classifyNote — a propósito las mismas 4 categorías y las mismas reglas,
// para que el navegador pueda mostrar cada item con la MISMA tarjeta de
// confirmación que ya usa Captura rápida, sin ningún código nuevo de
// interpretación de categorías.
async function classifyBrainDump(text, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const languageName = aiLanguageName(language);

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
            "Alguien con TDAH acaba de 'vaciar la cabeza' por voz o por texto en una app de salud mental — uno " +
            "o varios pendientes sueltos, mezclados, como le fueron viniendo a la mente, sin ningún orden. Tu " +
            "trabajo es separarlos en una LISTA de pendientes individuales y proponer a qué categoría pertenece " +
            "cada uno, SIN inventar datos que la persona no dijo y SIN inventar pendientes que no estén en el " +
            'texto. Responde SOLO con un objeto JSON de la forma {"items": [ {"type": "...", "fields": {...}, ' +
            '"noteText": "..."}, ... ]}. Cada elemento de "items" sigue EXACTAMENTE las mismas reglas que a ' +
            "continuación (son las 4 categorías posibles):\n\n" +
            '- "medicamento": quiere que le recuerden TOMAR (ingerir) una dosis de un medicamento, a una hora ' +
            'del día, de forma repetida. Usa este tipo SOLO cuando el verbo es tomar/tomarse/ingerir (o ' +
            'claramente equivalente). Si lo que pide es COMPRAR, surtir, recoger, pedir o renovar una receta, ' +
            'eso NO es una dosis diaria — va en "paso". fields: {"name": string, "time": "HH:MM" en formato 24 ' +
            "horas si mencionó una hora, o null si no la mencionó}.\n" +
            '- "pago": quiere un recordatorio de un pago o suscripción recurrente. fields: {"name": string, ' +
            '"amount": string o null (tal cual lo dijo, ej. "$219"), "frequency": "mensual" o "anual", ' +
            '"dueDay": entero 1-31 si lo mencionó, o null}.\n' +
            '- "paso": un pendiente, mandado, trámite o tarea de una sola vez (ej. "comprar medicamento", ' +
            '"llamar al banco", "recoger algo"). fields: {"text": string, "min": entero entre 2 y 20, ' +
            'estimado si no lo dijo}.\n' +
            '- "nota": cualquier otra cosa — una idea, un pensamiento, algo para llevar un diario, sin acción ' +
            "concreta pendiente. fields: {} (vacío).\n\n" +
            "Si tienes cualquier duda de la categoría de un pendiente, usa \"nota\" para ese — es la opción " +
            'segura por default. "noteText" de cada elemento lleva una versión breve y limpia (sin relleno) de ' +
            `ESE pendiente en particular, en ${languageName} (tradúcelo si el texto original vino en otro ` +
            'idioma). El valor de "type" SIEMPRE se queda en uno de los 4 valores exactos de arriba, nunca se ' +
            `traduce. Regresa como máximo ${BRAIN_DUMP_MAX_ITEMS} elementos — si hay más pendientes distintos ` +
            "en el texto, quédate con los más claros y deja el resto fuera en vez de forzar una lista enorme. " +
            "Si el texto completo es en realidad un solo pendiente (no varios), regresa \"items\" con un solo " +
            "elemento — no lo dividas de forma artificial.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error de OpenAI (descarga mental):", errText);
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

  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];

  // Misma validación defensiva que classifyNote, aplicada a cada elemento
  // de la lista — un campo mal formado en un solo item nunca tira toda la
  // respuesta, y el navegador de todas formas nunca escribe nada sin que
  // la persona confirme cada tarjeta por separado.
  return rawItems.slice(0, BRAIN_DUMP_MAX_ITEMS).map((parsedItem) => {
    const type = QUICK_CAPTURE_TYPES.includes(parsedItem?.type) ? parsedItem.type : "nota";
    const fields =
      parsedItem && typeof parsedItem.fields === "object" && parsedItem.fields !== null ? parsedItem.fields : {};
    const noteText = String(parsedItem?.noteText || "").trim().slice(0, 300);
    return { type, fields, noteText };
  });
}
