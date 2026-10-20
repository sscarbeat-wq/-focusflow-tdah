// Endpoint que desglosa una tarea grande en pasos accionables usando IA, Y
// TAMBIÉN la lógica de "Ayuda con mensajes" (reescribir tono / leer un
// mensaje recibido) — viven en el mismo archivo, con un solo campo
// "action" en el body para distinguir cuál función pidió el navegador.
//
// Por qué están juntos: el plan gratuito de Vercel (Hobby) solo permite 12
// funciones serverless por deployment — cada archivo dentro de api/ cuenta
// como una. Senda ya estaba justo en el límite de 12 antes de esta ronda,
// así que agregar "Ayuda con mensajes" como archivo nuevo (api/message-tone.js)
// rompía el deploy. En vez de pagar el plan Pro de Vercel, juntamos las dos
// funciones de IA más nuevas en un solo endpoint — misma cantidad de
// archivos en api/ que antes, cero costo extra. Cada una mantiene su propio
// contador de uso mensual independiente (aiUsage / messageToneAiUsage), así
// que esto no cambia ningún límite ni comportamiento para la paciente.
//
// Vive en el servidor porque necesita la llave de OpenAI, que nunca debe
// llegar al navegador del paciente. Usa un modelo económico (gpt-4o-mini)
// a propósito: el costo real de cada uso es una fracción de centavo.
//
// `granularity` (inspirado en el control de "picante" de Magic ToDo, de
// Goblin Tools) deja elegir qué tan desglosado quiere el paso a paso la
// paciente en este momento — un día difícil puede pedir más pasos, más
// chiquitos; un día más llevadero puede pedir menos. "normal" mantiene el
// comportamiento de siempre (3-5 pasos), así que un cliente viejo que nunca
// mande este campo sigue funcionando exactamente igual.
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_AI_USAGE,
  nextAiUsage,
  AI_BREAKDOWN_MONTHLY_LIMIT,
  DEFAULT_MESSAGE_TONE_AI_USAGE,
  nextMessageToneAiUsage,
  MESSAGE_TONE_AI_MONTHLY_LIMIT,
} from "../src/aiUsage.js";
import { containsRiskLanguage } from "../src/companionSituations.js";
import { MODES, isValidMode, isValidTone, cleanMessageText, toneHint } from "../src/messageToneOptions.js";
import { ENERGY_LEVELS } from "../src/energyLog.js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OPENAI_MODEL = "gpt-4o-mini";

const GRANULARITY_PRESETS = {
  pocos: { range: "2 a 3", maxSteps: 3, hint: "pasos grandes, lo menos desglosado posible" },
  normal: { range: "3 a 5", maxSteps: 5, hint: "el tamaño normal de paso" },
  muchos: { range: "6 a 8", maxSteps: 8, hint: "pasos muy chiquitos y concretos, para un día difícil" },
};

function resolveGranularity(granularity) {
  return GRANULARITY_PRESETS[granularity] ? granularity : "normal";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body = req.body || {};
  if (body.action === "message-tone") {
    return handleMessageTone(req, res, body);
  }
  return handleBreakdown(req, res, body);
}

// ---------------------------------------------------------------------
// El desglosador (comportamiento original, sin cambios de lógica — solo
// se movió dentro de esta función para compartir archivo con el de abajo).
// ---------------------------------------------------------------------
async function handleBreakdown(req, res, body) {
  const { userId, task, granularity } = body;
  if (!userId || typeof task !== "string" || !task.trim()) {
    return res.status(400).json({ error: "Falta la tarea o el usuario." });
  }
  const cleanTask = task.trim().slice(0, 300);
  const granularityKey = resolveGranularity(granularity);

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
    const { usage, allowed } = nextAiUsage(progressData.aiUsage || DEFAULT_AI_USAGE);

    if (!allowed) {
      return res.status(429).json({
        error: `Llegaste al límite de ${AI_BREAKDOWN_MONTHLY_LIMIT} desgloses con IA este mes. Mientras tanto puedes seguir usando el desglosador manual, aquí mismo.`,
      });
    }

    // 2) Llamar a la IA.
    const steps = await callOpenAiBreakdown(cleanTask, granularityKey);

    // 3) Guardar el nuevo contador solo si la llamada a la IA funcionó.
    const { error: writeErr } = await supabaseAdmin
      .from("progress")
      .upsert({
        user_id: userId,
        data: { ...progressData, aiUsage: usage },
        updated_at: new Date().toISOString(),
      });
    if (writeErr) throw writeErr;

    res.status(200).json({ steps });
  } catch (err) {
    console.error("Error en breakdown-task:", err);
    res.status(500).json({ error: "No se pudo desglosar la tarea con IA. Intenta de nuevo en un momento." });
  }
}

async function callOpenAiBreakdown(task, granularityKey) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const preset = GRANULARITY_PRESETS[granularityKey];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            'Ayudas a personas con TDAH a desglosar una tarea grande en pasos pequeños y concretos. ' +
            `Responde SOLO con un objeto JSON de la forma {"steps": [...]}, donde "steps" es un arreglo de ` +
            `${preset.range} objetos (${preset.hint}). Cada objeto debe tener "text" (el paso, en español de ` +
            'México, una frase corta y accionable, sin numerarla), "min" (minutos estimados, un entero entre ' +
            '2 y 20) y "energy" (qué tanta energía física/mental pide ese paso en concreto: "baja", "media" o ' +
            '"alta" — por ejemplo, "junta tus papeles en un montón" es energía baja, y "redacta el primer ' +
            'párrafo" es energía alta; varía el nivel entre los pasos cuando tenga sentido, no pongas el mismo ' +
            "en todos). No incluyas nada más que ese objeto JSON.",
        },
        { role: "user", content: `Tarea: ${task}` },
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error de OpenAI:", errText);
    throw new Error("Error al conectar con el servicio de IA.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Respuesta de IA no válida.");
  }

  const rawSteps = Array.isArray(parsed) ? parsed : parsed.steps;
  if (!Array.isArray(rawSteps)) {
    throw new Error("Respuesta de IA no válida.");
  }

  const steps = rawSteps
    .slice(0, preset.maxSteps)
    .map((s) => ({
      text: String(s?.text || "").trim().slice(0, 120),
      min: Math.max(2, Math.min(20, Math.round(Number(s?.min) || 10))),
      // Si la IA manda algo que no sea uno de los 3 niveles válidos, se
      // queda sin etiqueta (null) en vez de fallar todo el desglose — el
      // paso simplemente no se sugiere por energía, pero sigue funcionando.
      energy: ENERGY_LEVELS.includes(s?.energy) ? s.energy : null,
    }))
    .filter((s) => s.text);

  if (!steps.length) {
    throw new Error("La IA no devolvió pasos utilizables.");
  }

  return steps;
}

// ---------------------------------------------------------------------
// "Ayuda con mensajes" (inspirado en Formalizer/Judge de Goblin Tools):
// reescribe el tono de un mensaje que la paciente está por mandar, o la
// ayuda a leer con más calma uno que ya recibió. A diferencia del
// desglosador, aquí la paciente SÍ pega texto libre real — por eso la
// revisión de seguridad es doble: se revisa el texto que la paciente pega
// ANTES de mandarlo a la IA (nunca se le pide a la IA que "arregle el
// tono" de algo que describe autolesión/crisis) y también la respuesta
// que regresa la IA.
// ---------------------------------------------------------------------
async function handleMessageTone(req, res, body) {
  const { userId, mode, text, tone } = body;
  const cleanText = cleanMessageText(text);
  if (!userId || !isValidMode(mode) || !cleanText) {
    return res.status(400).json({ error: "Falta el mensaje, el modo o el usuario." });
  }
  if (mode === MODES.REWRITE && !isValidTone(tone)) {
    return res.status(400).json({ error: "Falta elegir a qué tono reescribir el mensaje." });
  }

  // Salvaguarda: si el mensaje que la paciente pegó (propio o recibido) ya
  // toca autolesión/crisis, nunca se manda a la IA a "arreglarle el tono" —
  // se trata directo como una señal de crisis.
  if (containsRiskLanguage(cleanText)) {
    return res.status(200).json({ unsafe: true });
  }

  try {
    const { data: row, error: readErr } = await supabaseAdmin
      .from("progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;

    const progressData = row?.data || {};
    const { usage, allowed } = nextMessageToneAiUsage(progressData.messageToneAiUsage || DEFAULT_MESSAGE_TONE_AI_USAGE);

    if (!allowed) {
      return res.status(429).json({
        error: `Llegaste al límite de ${MESSAGE_TONE_AI_MONTHLY_LIMIT} usos de ayuda con mensajes este mes.`,
      });
    }

    const result = await callOpenAiMessageTone(mode, cleanText, tone);

    const { error: writeErr } = await supabaseAdmin
      .from("progress")
      .upsert({
        user_id: userId,
        data: { ...progressData, messageToneAiUsage: usage },
        updated_at: new Date().toISOString(),
      });
    if (writeErr) throw writeErr;

    if (containsRiskLanguage(result)) {
      return res.status(200).json({ unsafe: true });
    }

    res.status(200).json({ result });
  } catch (err) {
    console.error("Error en message-tone:", err);
    res.status(500).json({ error: "No se pudo procesar el mensaje con IA." });
  }
}

async function callOpenAiMessageTone(mode, text, tone) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const systemPrompt =
    mode === MODES.REWRITE
      ? "Reescribes un mensaje que la persona está por mandar, en español de México, manteniendo la idea " +
        `y los datos tal cual (fechas, nombres, números), pero con un tono ${toneHint(tone)}. Nunca agregues ` +
        "información nueva ni cambies lo que la persona quiere decir. Responde SOLO con un objeto JSON de " +
        'la forma {"result": "..."} con el mensaje reescrito, nada más.'
      : "Te dan un mensaje que la persona ya recibió de alguien más, y tu trabajo es ayudarla a leerlo con " +
        "más calma — no confirmes la lectura más catastrófica ni asegures que sabes la intención real de " +
        "quien lo escribió (eso nadie puede saberlo con certeza). En 2 a 4 frases, en español de México: " +
        "describe 2 o 3 formas distintas y razonables en que ese mensaje se pudo haber querido decir — " +
        "incluyendo al menos una lectura neutral o benigna, no solo la más alarmante — y evita afirmar cuál " +
        "es la correcta. No analices a la otra persona, no la diagnostiques, no sugieras cómo responder a " +
        'menos que se pida. Responde SOLO con un objeto JSON de la forma {"result": "..."}.';

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Mensaje: ${text}` },
      ],
      temperature: 0.4,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Error de OpenAI:", errText);
    throw new Error("Error al conectar con el servicio de IA.");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Respuesta de IA no válida.");
  }

  const result = String(parsed?.result || "").trim().slice(0, 800);
  if (!result) throw new Error("La IA no devolvió un resultado utilizable.");
  return result;
}
