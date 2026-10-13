// Utilidades de integración con Google Calendar, del lado del navegador.
// Nunca manejan tokens directamente (eso vive solo en el servidor) — solo
// llaman a los endpoints de /api/calendar/* y /api/auth/google/*.

// Manda al paciente a la pantalla de permiso de Google. Navegación real de
// página completa (no un fetch) porque así funciona OAuth.
export function startGoogleAuth(userId) {
  window.location.href = `/api/auth/google/start?userId=${encodeURIComponent(userId)}`;
}

export async function fetchCalendarStatus(userId) {
  const res = await fetch(`/api/calendar/status?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("No se pudo consultar el estado del calendario.");
  return res.json();
}

export async function updateCalendarPreferences(userId, prefs) {
  const res = await fetch("/api/calendar/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...prefs }),
  });
  if (!res.ok) throw new Error("No se pudo guardar la preferencia.");
  return res.json();
}

export async function disconnectCalendar(userId) {
  const res = await fetch("/api/calendar/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("No se pudo desconectar el calendario.");
  return res.json();
}

async function createCalendarEvent(userId, title, minutes, startTime, kind) {
  const res = await fetch("/api/calendar/create-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, minutes, startTime, kind }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo crear el evento.");
  }
  return res.json();
}

// Agenda uno o varios bloques de tiempo de forma SECUENCIAL a partir de
// ahora (o de `startOffsetMinutes` minutos a partir de ahora, útil cuando ya
// hay pasos agendados antes de este). Se puede — y se debe — llamar siempre,
// sin preguntar antes si el calendario está conectado o si ese tipo de
// sincronización ("step" o "focus") está activada: esa decisión la toma el
// servidor (/api/calendar/create-event) y responde en silencio si no aplica.
// Nunca truena hacia afuera: si el calendario falla de verdad, el
// desglosador o el Modo Enfoque deben poder seguir usándose con
// normalidad — por eso cada error se traga aquí y solo se reporta por
// consola.
export async function scheduleStepsOnCalendar(userId, steps, { startOffsetMinutes = 0, kind = "step" } = {}) {
  let offset = startOffsetMinutes;
  for (const step of steps) {
    const minutes = Math.max(1, Number(step.min) || 5);
    const startTime = new Date(Date.now() + offset * 60000).toISOString();
    try {
      await createCalendarEvent(userId, step.text, minutes, startTime, kind);
    } catch (err) {
      console.error("No se pudo agendar un paso en el calendario:", err);
    }
    offset += minutes;
  }
}
