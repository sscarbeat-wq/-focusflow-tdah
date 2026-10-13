// Le dice al navegador si este paciente ya conectó su Google Calendar, y
// qué prefiere sincronizar — nunca regresa el refresh_token (ese se queda
// siempre del lado del servidor).
import { supabaseAdmin } from "../_googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "Falta userId." });
  }

  const { data, error } = await supabaseAdmin
    .from("calendar_connections")
    .select("sync_steps, sync_focus_sessions")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error en calendar/status:", error);
    return res.status(500).json({ error: "No se pudo consultar el estado del calendario." });
  }

  res.status(200).json({
    connected: !!data,
    syncSteps: data?.sync_steps ?? true,
    syncFocusSessions: data?.sync_focus_sessions ?? true,
  });
}
