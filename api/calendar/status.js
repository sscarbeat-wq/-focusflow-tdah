// Le dice al navegador si este paciente ya conectó su Google Calendar, y
// qué prefiere sincronizar — nunca regresa el refresh_token (ese se queda
// siempre del lado del servidor).
import { supabaseAdmin } from "../_googleCalendar.js";
import { requireUser } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  // Parche de seguridad (27 de noviembre de 2026): el usuario sale del
  // token de sesión verificado (ver api/_auth.js) — ya no se acepta un
  // `userId` en la URL.
  const authUser = await requireUser(req, res);
  if (!authUser) return;
  const userId = authUser.id;

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
