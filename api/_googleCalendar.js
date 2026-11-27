// Funciones compartidas para hablar con la API de Google Calendar y con la
// tabla `calendar_connections` de Supabase. Vive en `_lib` (con guion bajo)
// a propósito: Vercel no convierte en endpoint público ningún archivo o
// carpeta que empiece con "_" — solo lo importan los demás archivos de /api.
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

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

// ---------------------------------------------------------------------
// Parche de seguridad (27 de noviembre de 2026) — "state" firmado para el
// permiso de Google.
//
// Cuando la paciente va a la pantalla de permiso de Google, viaja con ella
// un dato llamado "state" que Google nos regresa intacto al volver; con él
// sabemos a qué cuenta de ANRO TDAH pertenece el calendario recién
// conectado. Antes ese "state" era el `userId` tal cual, sin protección:
// alguien que conociera el identificador de otra persona podía terminar el
// flujo con SU propio Google y dejar su calendario ligado a la cuenta
// ajena (y así recibir los títulos de los pasos y sesiones de esa persona).
//
// Ahora el "state" lleva: el usuario (ya verificado por token en
// /api/auth/google/start), una hora de vencimiento (10 minutos) y una
// firma que solo este servidor puede producir. Al volver de Google
// (/api/auth/google/callback) se comprueba la firma y el vencimiento; si
// algo no cuadra, no se guarda nada. Se firma con GOOGLE_CLIENT_SECRET —
// un secreto que ya existe en Vercel y nunca llega al navegador — para no
// tener que dar de alta ninguna variable de entorno nueva.
// ---------------------------------------------------------------------
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function signaturePart(payload) {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("Falta configurar GOOGLE_CLIENT_SECRET en Vercel.");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signOAuthState(userId, now = Date.now()) {
  const payload = `${userId}.${now + OAUTH_STATE_TTL_MS}`;
  return `${payload}.${signaturePart(payload)}`;
}

// Regresa el userId si el "state" es auténtico y sigue vigente; si no, null.
export function verifyOAuthState(state, now = Date.now()) {
  if (typeof state !== "string") return null;
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  if (!userId || !/^\d+$/.test(expiresAt)) return null;
  let expected;
  try {
    expected = signaturePart(`${userId}.${expiresAt}`);
  } catch (err) {
    console.error(err.message);
    return null;
  }
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expiresAt) < now) return null;
  return userId;
}
