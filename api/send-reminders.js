// Endpoint que dispara los Cron Jobs de Vercel (ver vercel.json). Un solo
// archivo atiende CUATRO crons distintos — igual que api/breakdown-task.js
// fusionó dos funciones de IA en un solo archivo, aquí usamos el mismo
// patrón pero distinguiendo por query param en vez de por campo del body,
// porque un Cron Job de Vercel solo puede mandar GET, sin cuerpo (body):
//   - sin "?check=..." (el cron diario de la noche, "0 1 * * *" = 7pm hora
//     de Ciudad de México): revisa a quién le falta su check-in de ánimo
//     hoy, a quién se le va a romper la racha, y pagos por vencer.
//   - "?check=medication" (cron cada 15 min): revisa si algún medicamento
//     de alguien tiene una dosis programada justo en esta ventana de 15
//     minutos y todavía no se marcó como tomada.
//   - "?check=schedule" (cron cada 15 min, agregado para avisar de la
//     Agenda visual — Módulo 2 de ANRO TDAH 2.0): revisa si algún bloque
//     de la agenda de alguien empieza en los próximos ~15 minutos.
//   - "?check=digest" (cron diario de la mañana, "0 14 * * *" = 8am hora
//     de Ciudad de México, agregado a petición de la doctora): un resumen
//     de "esto tienes pendiente hoy" — rutinas sin completar y bloques de
//     la Agenda visual. Deliberadamente NO incluye pasos del desglosador:
//     esos nunca se guardan en el servidor (viven solo en memoria del
//     navegador mientras la pestaña está abierta, ver FocusFlowTDAH.jsx),
//     así que este cron no tiene forma de saber si hay alguno pendiente —
//     mismo principio de "nunca inventar un pendiente sin dato real" que
//     ya sigue todayView.js en el cliente.
// Estos crons cada 15 minutos requieren Vercel Pro (la doctora subió de
// plan el 20 de octubre de 2026 — ver el roadmap). Si en algún momento se
// baja de Pro a Hobby, el deploy completo se rompe (Vercel lo rechaza en
// build) — hay que quitar esas entradas de vercel.json (o volverlas a una
// vez al día) antes de bajar de plan.
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
// Import con extensión ".js" explícita a propósito — este archivo es parte
// de una función serverless de Vercel, y un import relativo sin extensión
// puede resolverse bien en el navegador (Vite) pero tronar el empacador de
// funciones de Vercel (ver la lección del 20 de octubre de 2026 en el
// roadmap, encontrada justo con este mismo patrón en energyLog.js).
import { paymentsDueSoon } from "../src/paymentsLog.js";
import { scheduleBlocksForDay } from "../src/scheduleBlocks.js";
import { pendingRoutineTemplates } from "../src/routines.js";

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
  if (req.query && req.query.check === "schedule") {
    return handleScheduleCheck(req, res);
  }
  if (req.query && req.query.check === "digest") {
    return handleDigestCheck(req, res);
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
        body = `Llevas ${streak.current} días seguidos en ANRO TDAH — completa algo hoy para no perderla.`;
      } else if (!moodToday) {
        title = "¿Cómo te sientes hoy?";
        body = "Tómate 10 segundos para registrar tu ánimo en ANRO TDAH.";
      }

      if (title) {
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
      } // si no hay título, ya hizo su check-in hoy y su racha no corre riesgo — no lo molestamos con esto

      // Pagos/suscripciones próximos a vencer (3 días antes o el mismo día,
      // ver src/paymentsLog.js) — independiente del aviso de racha/ánimo de
      // arriba, así que puede mandar su propio push aunque el de arriba no
      // haya aplicado hoy.
      const userPayments = progress.payments || [];
      if (userPayments.length > 0) {
        const duePayments = paymentsDueSoon(userPayments, progress.paymentPaidLog || {}, mxNow());
        for (const p of duePayments) {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({
                title: "Pago próximo a vencer 💳",
                body: `${p.name}${p.amount ? ` — ${p.amount}` : ""} — ${
                  p.daysUntil === 0 ? "vence hoy" : `vence en ${p.daysUntil} día${p.daysUntil === 1 ? "" : "s"}`
                }`,
                url: "/",
              })
            );
            sent += 1;
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              toRemove.push(sub.endpoint);
            } else {
              console.error("Error enviando push de pago a", sub.endpoint, err.message);
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

// Avisa ANTES de que empiece un bloque de la Agenda visual (Módulo 2),
// nunca después — por eso la ventana se compara contra "cuánto falta para
// que empiece" (diff > 0), al revés de MEDICATION_WINDOW_MIN que compara
// contra "cuánto ha pasado desde que debió tomarse". Mismo ancho (16
// minutos) y mismo motivo: tolerar que el cron de 15 minutos se retrase
// unos segundos sin dejar un bloque sin avisar.
const SCHEDULE_REMINDER_WINDOW_MIN = 16;

async function handleScheduleCheck(req, res) {
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
    const now = mxNow();
    const nowMin = minutesNowMX();

    let sent = 0;
    const toRemove = [];

    for (const sub of subs) {
      const progress = progressByUser[sub.user_id] || {};
      const todaysBlocks = scheduleBlocksForDay(progress.scheduleBlocks, now);

      for (const block of todaysBlocks) {
        const diff = block.startMin - nowMin;
        if (diff <= 0 || diff > SCHEDULE_REMINDER_WINDOW_MIN) continue; // no es su momento de avisar (ya empezó, o falta mucho)

        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: `En ${diff} min: ${block.icon} ${block.text}`,
              body: "Según tu Agenda visual en ANRO TDAH.",
              url: "/",
            })
          );
          sent += 1;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            toRemove.push(sub.endpoint);
          } else {
            console.error("Error enviando push de agenda a", sub.endpoint, err.message);
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

// Resumen matutino de "esto tienes pendiente hoy" — rutinas sin completar
// (Módulo 5) y bloques de la Agenda visual (Módulo 2). A propósito NO
// incluye pasos del desglosador: esos viven solo en memoria del navegador
// mientras la pestaña está abierta (nunca se guardan en Supabase, ver
// FocusFlowTDAH.jsx), así que este cron no tiene forma de saber si hay
// alguno pendiente. Mismo criterio que todayView.js en el cliente: nunca
// se manda un aviso si no hay ningún dato real que lo respalde — un día
// sin rutinas pendientes ni bloques de agenda no manda nada.
async function handleDigestCheck(req, res) {
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
    const now = mxNow();

    let sent = 0;
    const toRemove = [];

    for (const sub of subs) {
      const progress = progressByUser[sub.user_id] || {};
      const pendingRoutines = pendingRoutineTemplates(progress.routines, now);
      const todaysBlocks = scheduleBlocksForDay(progress.scheduleBlocks, now);

      const parts = [];
      if (pendingRoutines.length > 0) {
        parts.push(
          pendingRoutines.length === 1 ? "1 rutina sin completar" : `${pendingRoutines.length} rutinas sin completar`
        );
      }
      if (todaysBlocks.length > 0) {
        parts.push(
          todaysBlocks.length === 1 ? "1 bloque en tu agenda" : `${todaysBlocks.length} bloques en tu agenda`
        );
      }
      if (parts.length === 0) continue; // nada real que avisar hoy

      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: "Tu plan de hoy en ANRO TDAH ☀️",
            body: `Tienes ${parts.join(" y ")}.`,
            url: "/",
          })
        );
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          toRemove.push(sub.endpoint);
        } else {
          console.error("Error enviando push de resumen matutino a", sub.endpoint, err.message);
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
