// Verificación de identidad para los endpoints de /api (27 de noviembre de
// 2026 — parche de seguridad).
//
// El problema que arregla: antes, cada endpoint le creía al `userId` que
// mandaba el navegador en el cuerpo de la petición, sin comprobar nada. Como
// todos usan la llave de servicio de Supabase (que se salta las reglas de
// seguridad por fila), cualquiera que llamara directo a /api/... con el
// identificador de otra persona — o con uno inventado — podía gastar su
// cuota de IA, crear eventos en su Google Calendar, desconectárselo, o usar
// la IA sin límite y sin tener cuenta.
//
// Cómo lo arregla: el navegador ahora manda, en cada llamada, el token de
// sesión que Supabase ya le dio al iniciar sesión (cabecera
// "Authorization: Bearer <token>" — ver src/apiFetch.js). Aquí se le
// pregunta a Supabase "¿de quién es este token?" y se usa ESE usuario —
// nunca más el `userId` que venga en el cuerpo, que ahora se ignora. Sin
// token válido, la respuesta es 401 y no se ejecuta nada.
//
// Vive en un archivo con guion bajo a propósito (igual que
// _googleCalendar.js): Vercel no convierte en endpoint público ningún
// archivo que empiece con "_", así que no cuenta como función extra.
import { createClient } from "@supabase/supabase-js";

const supabaseAuth = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Mensaje para la paciente cuando la sesión no se pudo verificar. El caso
// más común NO es un ataque: es alguien con una versión vieja de la app
// guardada en el celular (que todavía no manda el token) o con la sesión
// vencida — por eso el texto dice qué hacer en vez de sonar a regaño.
const AUTH_MESSAGES = {
  es: "No pudimos verificar tu sesión. Cierra ANRO TDAH, vuelve a abrirla (si te ofrece actualizar, acepta) e inténtalo de nuevo.",
  en: "We couldn't verify your session. Close ANRO TDAH, open it again (accept the update if it offers one) and try again.",
  fr: "Nous n'avons pas pu vérifier ta session. Ferme ANRO TDAH, rouvre-la (accepte la mise à jour si elle la propose) et réessaie.",
  pt: "Não conseguimos verificar sua sessão. Feche o ANRO TDAH, abra de novo (aceite a atualização se aparecer) e tente outra vez.",
};

export function authErrorMessage(language) {
  return AUTH_MESSAGES[language] || AUTH_MESSAGES.es;
}

function bearerToken(req) {
  const header = (req.headers && (req.headers.authorization || req.headers.Authorization)) || "";
  const match = /^Bearer\s+(\S+)\s*$/i.exec(String(header));
  return match ? match[1] : null;
}

// Regresa el usuario de Supabase dueño del token, o null si no hay token,
// si está vencido/alterado, o si Supabase no pudo confirmarlo. Nunca truena.
export async function getAuthUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data || !data.user || !data.user.id) return null;
    return data.user;
  } catch (err) {
    console.error("No se pudo verificar el token de sesión:", err && err.message);
    return null;
  }
}

// Para usar al inicio de un endpoint:
//   const authUser = await requireUser(req, res);
//   if (!authUser) return;            // ya se respondió 401
//   const userId = authUser.id;       // el único userId en el que se confía
export async function requireUser(req, res) {
  const user = await getAuthUser(req);
  if (!user) {
    const language = req.body && typeof req.body === "object" ? req.body.language : undefined;
    res.status(401).json({ error: authErrorMessage(language), code: "auth_required" });
    return null;
  }
  return user;
}
