// Desconecta el Google Calendar del paciente: le avisa a Google que revoque
// el permiso (mejor esfuerzo) y borra nuestro registro de todos modos, para
// que en Senda quede "desconectado" aunque la revocación en Google falle o
// tarde.
import { supabaseAdmin } from "../_googleCalendar.js";
import { requireUser } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  // Parche de seguridad (27 de noviembre de 2026): el usuario sale del
  // token de sesión verificado (ver api/_auth.js) — antes cualquiera podía
  // desconectarle el calendario a otra persona mandando su `userId`.
  const authUser = await requireUser(req, res);
  if (!authUser) return;
  const userId = authUser.id;

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
