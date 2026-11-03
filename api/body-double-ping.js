// "Memoria ANRO" (3 de noviembre de 2026) — avisa por push a las DEMÁS
// personas (nunca a quien acaba de entrar) que alguien está ahora mismo en
// la sala del Cuerpo doble virtual (ver src/bodyDouble.js), para que quien
// no tenga la app abierta en ese momento se entere de que hay compañía
// disponible AHORA, no solo quien ya está mirando la pantalla.
//
// Decisión de arquitectura importante: la sala sigue siendo 100% efímera
// (Supabase Realtime Presence/Broadcast, sin tabla, sin historial — ver
// bodyDouble.js) y A PROPÓSITO no se construyó ninguna infraestructura de
// servidor que "escuche" el canal en vivo (una función serverless de
// Vercel no puede quedarse corriendo para eso). En vez de eso, el propio
// navegador de quien se UNE a la sala llama a este endpoint una sola vez,
// justo después de entrar (ver join() en bodyDouble.js) — así que "alguien
// entró" se detecta en el momento exacto en que pasa, sin que el servidor
// tenga que vigilar nada. body_double_pings (una sola fila, ver
// supabase/schema.sql) evita que esto manden un push cada vez que alguien
// entra/sale si varias personas van y viniendo en pocos minutos: como
// máximo un push cada BODY_DOUBLE_PING_COOLDOWN_MIN minutos.
//
// Import con extensión ".js" explícita a propósito en todos los imports de
// src/ — este archivo es una función serverless de Vercel (ver la lección
// del 20 de octubre de 2026 en el roadmap, y la del 3 de noviembre de 2026
// con scheduleBlocks.js, encontrada justo por faltar esta extensión).
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:sscarbeat@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Minutos mínimos entre dos avisos de "hay alguien en el Cuerpo doble" —
// generoso a propósito: la idea es "avisar de que hay compañía disponible
// de vez en cuando", no un push cada vez que alguien entra o sale de la
// sala, lo que se sentiría como ruido en vez de una invitación.
const BODY_DOUBLE_PING_COOLDOWN_MIN = 20;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { userId } = req.body || {};
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Falta el usuario." });
  }

  try {
    const now = new Date();
    const { data: pingRow, error: pingReadErr } = await supabaseAdmin
      .from("body_double_pings")
      .select("last_ping_at")
      .eq("id", 1)
      .maybeSingle();
    if (pingReadErr) throw pingReadErr;

    const lastPingAt = pingRow?.last_ping_at ? new Date(pingRow.last_ping_at) : null;
    const minutesSinceLastPing = lastPingAt ? (now.getTime() - lastPingAt.getTime()) / 60000 : Infinity;

    if (minutesSinceLastPing < BODY_DOUBLE_PING_COOLDOWN_MIN) {
      // Ya se avisó hace poco — no es un error, solo no hay nada nuevo que
      // avisar todavía. El navegador que llamó esto nunca muestra el
      // resultado a la paciente (es un aviso para LOS DEMÁS), así que no
      // hace falta distinguir este caso de un envío exitoso.
      return res.status(200).json({ sent: 0, throttled: true });
    }

    // Se guarda el cooldown ANTES de mandar los pushes (no después), para
    // que dos personas entrando casi al mismo tiempo no alcancen a mandar
    // dos avisos dobles mientras el primero todavía está enviando — el
    // peor caso de una carrera aquí es, como mucho, un aviso de más, nunca
    // uno de menos, y esta función no tiene nada más crítico que proteger.
    const { error: upsertErr } = await supabaseAdmin
      .from("body_double_pings")
      .upsert({ id: 1, last_ping_at: now.toISOString() });
    if (upsertErr) throw upsertErr;

    // Nunca se avisa a quien acaba de entrar sobre su propia llegada.
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .neq("user_id", userId);
    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, total: 0 });
    }

    let sent = 0;
    const toRemove = [];
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: "Hay compañía en el Cuerpo doble 🧑‍🤝‍🧑",
            body: "Alguien está en la sala ahora mismo — entra a ANRO TDAH si quieres enfocarte acompañada.",
            url: "/",
          })
        );
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          toRemove.push(sub.endpoint); // el navegador ya no existe / se desinstaló
        } else {
          console.error("Error enviando push de cuerpo doble a", sub.endpoint, err.message);
        }
      }
    }

    if (toRemove.length) {
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", toRemove);
    }

    res.status(200).json({ sent, total: subs.length });
  } catch (err) {
    console.error("Error en body-double-ping:", err);
    res.status(500).json({ error: "No se pudo avisar de la actividad en el Cuerpo doble." });
  }
}
