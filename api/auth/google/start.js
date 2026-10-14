// Inicia el flujo de OAuth con Google: manda al paciente a la pantalla de
// consentimiento de Google. Solo usa el client_id (no es secreto, es seguro
// que viaje en una URL); el client_secret nunca sale de /api/auth/google/callback.
import { getAppUrl } from "../../_googleCalendar.js";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export default function handler(req, res) {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).send("Falta userId.");
    return;
  }

  const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // para que Google nos dé un refresh_token
    prompt: "consent", // fuerza a Google a regresar refresh_token también al reconectar
    state: String(userId),
  });

  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  res.end();
}
