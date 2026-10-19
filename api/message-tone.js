// Endpoint de "Ayuda con mensajes" (inspirado en Formalizer/Judge de Goblin
// Tools): reescribe el tono de un mensaje que la paciente está por mandar,
// o la ayuda a leer con más calma uno que ya recibió. A diferencia del
// desglosador y el compañero de apoyo, aquí la paciente SÍ pega texto libre
// real (un mensaje propio o de alguien más) — por eso la revisión de
// seguridad es doble: se revisa el texto que la paciente pega ANTES de
// mandarlo a la IA (nunca se le pide a la IA que "arregle el tono" de algo
// que describe autolesión/crisis) y también la respuesta que regresa la IA,
// igual que en api/companion-response.js.
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_MESSAGE_TONE_AI_USAGE,
  nextMessageToneAiUsage,
  MESSAGE_TONE_AI_MONTHLY_LIMIT,
} from "../src/aiUsage.js";
import { containsRiskLanguage } from "../src/companionSituations.js";
import { MODES, isValidMode, isValidTone, cleanMessageText, toneHint } from "../src/messageToneOptions.js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OPENAI_MODEL = "gpt-4o-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId, mode, text, tone } = req.body || {};
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
