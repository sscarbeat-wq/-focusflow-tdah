// Endpoint que dispara los Cron Jobs de Vercel (ver vercel.json). Un solo
// archivo atiende DOS crons distintos — igual que api/breakdown-task.js
// fusionó dos funciones de IA en un solo archivo para no pasarse del límite
// de funciones serverless del plan gratuito, aquí usamos el mismo patrón
// pero distinguiendo por query param en vez de por campo del body, porque
// un Cron Job de Vercel solo puede mandar GET, sin cuerpo (body):
//   - sin "?check=..." (el cron diario, "0 1 * * *"): revisa a quién le
//     falta su check-in de ánimo hoy, o a quién se le va a romper la racha.
//   - "?check=medication" (cron cada 15 min — requiere Vercel Pro, ya que
//     Hobby solo permite crons de una vez al día): revisa si algún
//     medicamento de alguien tiene una dosis programada justo en esta
//     ventana de 15 minutos y todavía no se marcó como tomada.
// Si en algún momento se baja de Pro a Hobby, el cron de cada 15 minutos
// rompe el deploy completo (Vercel lo rechaza en build, no solo en
// ejecución) — hay que quitar esa entrada de vercel.json (o volverla a una
// vez al día) antes de bajar de plan. Ver roadmap para más detalle.
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:sscarbeat@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Aproximación de "hoy"/"ahora" en hora de Ciudad de México (UTC-6, sin
// horario de verano desde 2022). Debe coincidir con el formato YYYY-MM-DD
// que ya usan streak.js y moodLog.js en el cliente (basado en la fecha
// local del dispositivo). Si en el futuro hay usuarios en otra zona
// horaria, esto tendría que volverse por-usuario.
function mxNow(now = new Date()) {
  return new Date(now.getTime() - 6 * 60 * 60 * 1000);
}
function todayKeyMX(now = new Date()) {
  return mxNow(now).toISOString().slice(0, 10);
}
function minutesNowMX(now = new Date()) {
  const mx = mxNow(now);
  return mx.getUTCHours() * 60 + mx.getUTCMinutes();
}
function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }
  if (req.query && req.query.check === "medication") {
    return handleMedicationCheck(req, res);
  }
  return handleDailyCheck(req, res);
}

async function handleDailyCheck(req, res) {
  try {
    const { data: subs, error: subsErr } = await supabaseAdmin.from("push_subscriptions").select("*");
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, total: 0 });
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: rows, error: progErr } = await supabaseAdmin
      .from("progress")
      .select("user_id, data")
      .in("user_id", userIds);
    if (progErr) throw progErr;

    const progressByUser = Object.fromEntries((rows || []).map((r) => [r.user_id, r.data || {}]));
    const today = todayKeyMX();

    let sent = 0;
    const toRemove = [];

    for (const sub of subs) {
      const progress = progressByUser[sub.user_id] || {};
      const streak = progress.streak || {};
      const moodToday = progress.moodLog ? progress.moodLog[today] : null;

      const streakAtRisk = streak.lastDate && streak.lastDate !== today && (streak.current || 0) >= 2;

      let title = null;
      let body = null;

      if (streakAtRisk) {
        title = "Tu racha te está esperando 🔥";
        body = `Llevas ${streak.current} días seguidos en Senda — completa algo hoy para no perderla.`;
      } else if (!moodToday) {
        title = "¿Cómo te sientes hoy?";
        body = "Tómate 10 segundos para registrar tu ánimo en Senda.";
      }

      if (!title) continue; // ya hizo su check-in hoy y su racha no corre riesgo — no lo molestamos

      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, url: "/" }));
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          toRemove.push(sub.endpoint); // el navegador ya no existe / se desinstaló
        } else {
          console.error("Error enviando push a", sub.endpoint, err.message);
        }
      }
    }

    if (toRemove.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    res.status(200).json({ sent, total: subs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// Ventana de tolerancia alrededor de cada dosis programada: un poco más
// ancha que los 15 minutos entre llamadas del cron, para no dejar huecos
// si una ejecución se retrasa unos segundos. Con el módulo 1440 (minutos en
// un día) esto también cubre el caso de una dosis cerca de la medianoche
// (ej. 23:50), que de otro modo el siguiente "tick" (00:00, ya del día
// siguiente) nunca alcanzaría a detectar.
const MEDICATION_WINDOW_MIN = 16;

async function handleMedicationCheck(req, res) {
  try {
    const { data: subs, error: subsErr } = await supabaseAdmin.from("push_subscriptions").select("*");
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, total: 0 });
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: rows, error: progErr } = await supabaseAdmin
      .from("progress")
      .select("user_id, data")
      .in("user_id", userIds);
    if (progErr) throw progErr;

    const progressByUser = Object.fromEntries((rows || []).map((r) => [r.user_id, r.data || {}]));
    const today = todayKeyMX();
    const nowMin = minutesNowMX();

    let sent = 0;
    const toRemove = [];

    for (const sub of subs) {
      const progress = progressByUser[sub.user_id] || {};
      const medications = progress.medications || [];
      if (medications.length === 0) continue;
      const doseLog = progress.medicationDoseLog || {};
      const takenToday = doseLog[today] || [];

      for (const med of medications) {
        if (med.active === false) continue;
        for (const time of med.doseTimes || []) {
          const diff = ((nowMin - timeToMinutes(time)) % 1440 + 1440) % 1440;
          if (diff >= MEDICATION_WINDOW_MIN) continue; // no es la hora de esta dosis
          const alreadyTaken = takenToday.some((e) => e.medicationId === med.id && e.time === time);
          if (alreadyTaken) continue;

          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({
                title: "Es hora de tu medicamento 💊",
                body: `${med.name} — ${time}`,
                url: "/",
              })
            );
            sent += 1;
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              toRemove.push(sub.endpoint);
            } else {
              console.error("Error enviando push de medicamento a", sub.endpoint, err.message);
            }
          }
        }
      }
    }

    if (toRemove.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    res.status(200).json({ sent, total: subs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
