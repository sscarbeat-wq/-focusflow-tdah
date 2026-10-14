// Google manda al paciente de vuelta aquí después de que da (o niega) el
// permiso. Intercambiamos el "code" por tokens, guardamos el refresh_token
// en Supabase (nunca llega al navegador del paciente), y lo regresamos a la
// app con un mensaje de éxito/error en la URL.
import { supabaseAdmin, getAppUrl } from "../../_googleCalendar.js";

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const appUrl = getAppUrl(req);

  if (error) {
    // El paciente le dio "Cancelar" a Google, o Google rechazó la solicitud.
    res.writeHead(302, { Location: `${appUrl}/?calendar=denied` });
    return res.end();
  }

  if (!code || !state) {
    res.writeHead(302, { Location: `${appUrl}/?calendar=error` });
    return res.end();
  }

  try {
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: String(code),
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) throw new Error(await tokenRes.text());
    const tokens = await tokenRes.json();

    let refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      // Con prompt=consent esto casi nunca debería pasar, pero por si Google
      // decide no regresar uno nuevo, no sobreescribimos el que ya
      // teníamos guardado de una conexión anterior.
      const { data: existing } = await supabaseAdmin
        .from("calendar_connections")
        .select("refresh_token")
        .eq("user_id", state)
        .maybeSingle();
      refreshToken = existing?.refresh_token;
    }
    if (!refreshToken) throw new Error("Google no regresó un refresh_token.");

    const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from("calendar_connections").upsert({
      user_id: state,
      refresh_token: refreshToken,
      access_token: tokens.access_token,
      access_token_expiry: expiry,
      updated_at: new Date().toISOString(),
    });
    if (dbError) throw dbError;

    res.writeHead(302, { Location: `${appUrl}/?calendar=connected` });
    res.end();
  } catch (err) {
    console.error("Error en google/callback:", err);
    res.writeHead(302, { Location: `${appUrl}/?calendar=error` });
    res.end();
  }
}
