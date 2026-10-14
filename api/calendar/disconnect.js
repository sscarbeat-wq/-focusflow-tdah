// Desconecta el Google Calendar del paciente: le avisa a Google que revoque
// el permiso (mejor esfuerzo) y borra nuestro registro de todos modos, para
// que en Senda quede "desconectado" aunque la revocación en Google falle o
// tarde.
import { supabaseAdmin } from "../_googleCalendar.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Falta userId." });
  }

  const { data: row } = await supabaseAdmin
    .from("calendar_connections")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (row?.refresh_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(row.refresh_token)}`, {
        method: "POST",
      });
    } catch (err) {
      console.error("No se pudo revocar el token en Google (no bloquea la desconexión):", err);
    }
  }

  const { error } = await supabaseAdmin.from("calendar_connections").delete().eq("user_id", userId);
  if (error) {
    console.error("Error en calendar/disconnect:", error);
    return res.status(500).json({ error: "No se pudo desconectar el calendario." });
  }
  res.status(200).json({ ok: true });
}
