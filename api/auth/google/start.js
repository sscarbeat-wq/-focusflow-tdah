// Inicia el flujo de OAuth con Google: arma la dirección de la pantalla de
// consentimiento de Google y se la regresa al navegador, que es quien
// navega hacia allá. Solo usa el client_id (no es secreto, es seguro que
// viaje en una URL); el client_secret nunca sale del servidor.
//
// Parche de seguridad (27 de noviembre de 2026): antes esto era una
// navegación directa a /api/auth/google/start?userId=..., y le creía al
// `userId` de la URL sin comprobar nada. Ahora:
//   1) El navegador llama aquí con POST y su token de sesión (ver
//      startGoogleAuth en src/calendarSync.js); el usuario sale de ese
//      token verificado (api/_auth.js).
//   2) El "state" que viaja a Google va firmado y vence en 10 minutos (ver
//      signOAuthState en api/_googleCalendar.js), para que el regreso
//      (/api/auth/google/callback) solo acepte flujos que empezaron aquí.
//   3) Se responde con la dirección en JSON en vez de redirigir, porque
//      una navegación de página completa no puede llevar el token.
import { getAppUrl, signOAuthState } from "../../_googleCalendar.js";
import { requireUser } from "../../_auth.js";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    // Una versión vieja de la app (guardada en el celular antes de este
    // parche) todavía navega aquí directo con GET. En vez de dejarla en
    // una página de error en blanco, se le regresa a la app con el mismo
    // aviso de "no se pudo conectar" que ya sabe mostrar.
    res.writeHead(302, { Location: `${getAppUrl(req)}/?calendar=error` });
    return res.end();
  }

  const authUser = await requireUser(req, res);
  if (!authUser) return;

  try {
    const redirectUri = `${getAppUrl(req)}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline", // para que Google nos dé un refresh_token
      prompt: "consent", // fuerza a Google a regresar refresh_token también al reconectar
      state: signOAuthState(authUser.id),
    });
    res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  } catch (err) {
    console.error("Error en google/start:", err);
    res.status(500).json({ error: "No se pudo iniciar la conexión con Google Calendar." });
  }
}
