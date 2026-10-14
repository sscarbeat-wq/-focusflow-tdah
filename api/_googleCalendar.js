// Funciones compartidas para hablar con la API de Google Calendar y con la
// tabla `calendar_connections` de Supabase. Vive en `_lib` (con guion bajo)
// a propósito: Vercel no convierte en endpoint público ningún archivo o
// carpeta que empiece con "_" — solo lo importan los demás archivos de /api.
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Construye la URL base de ESTE despliegue (producción o preview) a partir
// de la petición entrante, en vez de tenerla fija en el código. Así el
// mismo endpoint funciona igual en focusflow-tdah.vercel.app y en una URL
// de Preview, siempre que esa URL también esté dada de alta como "URI de
// redireccionamiento autorizado" en Google Cloud.
export function getAppUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

// Intercambia un refresh_token guardado por un access_token nuevo y
// vigente. Se llama cada vez que vamos a crear un evento en vez de confiar
// en el access_token guardado, porque esos expiran a la hora.
export async function getFreshAccessToken(refreshToken) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo refrescar el token de Google: ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}
