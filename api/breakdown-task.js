// Endpoint que desglosa una tarea grande en pasos accionables usando IA.
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
import { DEFAULT_AI_USAGE, nextAiUsage, AI_BREAKDOWN_MONTHLY_LIMIT } from "../src/aiUsage.js";

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

  const { userId, task, granularity } = req.body || {};
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
            'México, una frase corta y accionable, sin numerarla) y "min" (minutos estimados, un entero entre ' +
            "2 y 20). No incluyas nada más que ese objeto JSON.",
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
    }))
    .filter((s) => s.text);

  if (!steps.length) {
    throw new Error("La IA no devolvió pasos utilizables.");
  }

  return steps;
}
