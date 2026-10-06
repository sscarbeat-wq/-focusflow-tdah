// Endpoint que dispara el Cron Job de Vercel una vez al día (ver vercel.json).
// Revisa a quién le falta su check-in de ánimo hoy, o a quién se le va a
// romper la racha, y le manda una notificación push.
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:sscarbeat@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Aproximación de "hoy" en hora de Ciudad de México (UTC-6, sin horario de
// verano desde 2022). Debe coincidir con el formato YYYY-MM-DD que ya usan
// streak.js y moodLog.js en el cliente (basado en la fecha local del
// dispositivo). Si en el futuro hay usuarios en otra zona horaria, esto
// tendría que volverse por-usuario.
function todayKeyMX() {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

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
