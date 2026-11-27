// Llamadas a los endpoints propios de ANRO TDAH (/api/...) con la sesión
// de la paciente adjunta (27 de noviembre de 2026 — parche de seguridad).
//
// Antes cada llamada mandaba solo el `userId` en el cuerpo y el servidor
// le creía sin comprobar nada. Ahora el servidor exige el token de sesión
// que Supabase ya le dio al navegador al iniciar sesión, y saca de AHÍ
// quién es la paciente (ver api/_auth.js). Esta función es idéntica a
// `fetch`, solo que agrega esa cabecera ("Authorization: Bearer <token>")
// — por eso en el resto del código basta cambiar `fetch("/api/...")` por
// `apiFetch("/api/...")`, sin tocar nada más de cada llamada.
//
// `supabase.auth.getSession()` regresa la sesión guardada y, si el token
// ya venció, lo renueva solo antes de regresarlo — así no hay que
// preocuparse aquí por tokens caducos.
import { supabase } from "./supabaseClient";

export async function sessionAuthHeaders() {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data && data.session ? data.session.access_token : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (err) {
    // Sin sesión legible no se manda cabecera: el servidor responderá 401
    // con un mensaje claro, igual que si la sesión hubiera vencido.
    return {};
  }
}

export async function apiFetch(url, options = {}) {
  const authHeaders = await sessionAuthHeaders();
  return fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders } });
}
