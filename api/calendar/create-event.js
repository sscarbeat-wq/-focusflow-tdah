// Crea un evento de bloqueo de tiempo en el Google Calendar del paciente.
// El llamador (desglosador, Modo Enfoque) llama aquí SIEMPRE, sin
// preguntarse primero si el calendario está conectado o si ese tipo de
// sincronización está activada — toda esa lógica vive aquí, del lado del
// servidor, y responde con un "skipped" silencioso (200, no error) cuando no
// aplica. Así nunca hay que duplicar el estado de conexión en el navegador,
// y un error real de Google tampoco debe tumbar el desglosador ni el Modo
// Enfoque, que deben seguir funcionando igual aunque el calendario falle.
import { supabaseAdmin, getFreshAccessToken } from "../_googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { userId, title, minutes, startTime, kind } = req.body || {};
  if (!userId || !title || !minutes) {
    return res.status(400).json({ error: "Faltan datos del evento." });
  }

  try {
    const { data: row, error: readErr } = await supabaseAdmin
      .from("calendar_connections")
      .select("refresh_token, sync_steps, sync_focus_sessions")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row?.refresh_token) {
      return res.status(200).json({ ok: true, skipped: true, reason: "not_connected" });
    }
    if (kind === "step" && row.sync_steps === false) {
      return res.status(200).json({ ok: true, skipped: true, reason: "pref_off" });
    }
    if (kind === "focus" && row.sync_focus_sessions === false) {
      return res.status(200).json({ ok: true, skipped: true, reason: "pref_off" });
    }

    const accessToken = await getFreshAccessToken(row.refresh_token);

    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + Math.max(1, Number(minutes)) * 60000);

    const eventRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        summary: title,
        description: "Creado automáticamente por Senda.",
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    });

    if (!eventRes.ok) {
      throw new Error(await eventRes.text());
    }

    const event = await eventRes.json();
    res.status(200).json({ ok: true, eventUrl: event.htmlLink });
  } catch (err) {
    console.error("Error en calendar/create-event:", err);
    res.status(500).json({ error: "No se pudo crear el evento en tu calendario." });
  }
}
