// Guarda qué quiere sincronizar el paciente (pasos del desglosador,
// sesiones de Modo Enfoque, o ambos) sin tocar el refresh_token guardado.
import { supabaseAdmin } from "../_googleCalendar.js";
import { requireUser } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  // Parche de seguridad (27 de noviembre de 2026): el usuario sale del
  // token de sesión verificado (ver api/_auth.js), no del cuerpo.
  const authUser = await requireUser(req, res);
  if (!authUser) return;
  const userId = authUser.id;

  const { syncSteps, syncFocusSessions } = req.body || {};

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
