// Endpoint que genera, con IA, una respuesta breve de apoyo para una
// situación fija elegida por la paciente en el Compañero de apoyo. A
// diferencia del desglosador de tareas (api/breakdown-task.js), aquí el
// "tema" nunca lo escribe la paciente — siempre es uno de los 5 ids fijos de
// SITUATIONS — así que la IA nunca reacciona a texto libre, solo redacta
// variaciones de un mensaje de apoyo sobre un tema que ya conocemos y
// aprobamos de antemano.
//
// El botón de crisis NUNCA pasa por aquí: su mensaje es 100% fijo en el
// navegador (ver src/companionSituations.js) y este endpoint rechaza
// explícitamente cualquier intento de pedir una respuesta de IA para
// "crisis" o para cualquier id que no esté en la lista fija de SITUATIONS.
//
// Salvaguarda adicional: antes de regresar el texto generado, se revisa con
// containsRiskLanguage(). Si por cualquier motivo toca temas de
// autolesión/suicidio, se regresa { unsafe: true } y nunca el texto — el
// cliente muestra el mensaje fijo de crisis en su lugar.
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_COMPANION_AI_USAGE, nextCompanionAiUsage, COMPANION_AI_MONTHLY_LIMIT } from "../src/aiUsage.js";
import { getSituation, containsRiskLanguage } from "../src/companionSituations.js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OPENAI_MODEL = "gpt-4o-mini";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId, situationId, avoid } = req.body || {};
  const situation = typeof situationId === "string" ? getSituation(situationId) : null;
  if (!userId || !situation) {
    // Esto también bloquea situationId === "crisis": getSituation() solo
    // busca dentro de SITUATIONS, nunca regresa CRISIS.
    return res.status(400).json({ error: "Situación no válida." });
  }

  try {
    // 1) Leer y actualizar el contador de uso mensual ANTES de llamar a la
    // IA, para no gastar nunca si la paciente ya llegó al límite.
    const { data: row, error: readErr } = await supabaseAdmin
      .from("progress")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;

    const progressData = row?.data || {};
    const { usage, allowed } = nextCompanionAiUsage(progressData.companionAiUsage || DEFAULT_COMPANION_AI_USAGE);

    if (!allowed) {
      return res.status(429).json({
        error: `Llegaste al límite de ${COMPANION_AI_MONTHLY_LIMIT} respuestas de apoyo con IA este mes.`,
      });
    }

    // 2) Llamar a la IA.
    const text = await callOpenAiCompanion(situation, typeof avoid === "string" ? avoid.slice(0, 500) : "");

    // 3) Guardar el nuevo contador solo si la llamada a la IA funcionó.
    const { error: writeErr } = await supabaseAdmin
      .from("progress")
      .upsert({
        user_id: userId,
        data: { ...progressData, companionAiUsage: usage },
        updated_at: new Date().toISOString(),
      });
    if (writeErr) throw writeErr;

    if (containsRiskLanguage(text)) {
      return res.status(200).json({ unsafe: true });
    }

    res.status(200).json({ response: text });
  } catch (err) {
    console.error("Error en companion-response:", err);
    res.status(500).json({ error: "No se pudo generar una respuesta con IA." });
  }
}

async function callOpenAiCompanion(situation, avoid) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta configurar OPENAI_API_KEY en Vercel.");
  }

  const avoidLine = avoid
    ? ` No repitas este mensaje que ya se mostró antes — dilo de otra forma: "${avoid}"`
    : "";

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
            "Eres parte de Senda, una app para personas con TDAH. Da un mensaje breve de apoyo " +
            "(2 a 4 frases, español de México) sobre la situación exacta que se te describe — nunca " +
            "cambies de tema ni inventes otra situación distinta a la dada. Valida lo que siente la " +
            "persona, explica en una frase por qué pasa esto con TDAH, y termina con algo concreto que " +
            "pueda hacer ahora mismo. No diagnostiques, no sugieras medicamentos, no prometas resultados, " +
            "no hagas preguntas ni invites a seguir platicando — es un mensaje de una sola vía, la persona " +
            'ya va a dar clic en un botón después para ir a una herramienta de la app. Responde SOLO con ' +
            'un objeto JSON de la forma {"response": "..."}.',
        },
        {
          role: "user",
          content: `Situación: ${situation.promptContext}${avoidLine}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
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

  const text = String(parsed?.response || "").trim().slice(0, 600);
  if (!text) throw new Error("La IA no devolvió una respuesta utilizable.");
  return text;
}
