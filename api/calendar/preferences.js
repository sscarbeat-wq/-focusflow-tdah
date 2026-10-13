// Guarda qué quiere sincronizar el paciente (pasos del desglosador,
// sesiones de Modo Enfoque, o ambos) sin tocar el refresh_token guardado.
import { supabaseAdmin } from "../_googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { userId, syncSteps, syncFocusSessions } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Falta userId." });
  }

  const update = { updated_at: new Date().toISOString() };
  if (typeof syncSteps === "boolean") update.sync_steps = syncSteps;
  if (typeof syncFocusSessions === "boolean") update.sync_focus_sessions = syncFocusSessions;

  const { error } = await supabaseAdmin.from("calendar_connections").update(update).eq("user_id", userId);
  if (error) {
    console.error("Error en calendar/preferences:", error);
    return res.status(500).json({ error: "No se pudo guardar la preferencia." });
  }
  res.status(200).json({ ok: true });
}
