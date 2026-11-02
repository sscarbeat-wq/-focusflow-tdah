// Registro de sesiones de Modo Enfoque completas — lógica pura, mismo
// patrón que medicationLog.js/impulseBrakeLog.js: varias entradas por día
// (a diferencia de ánimo/sueño/energía, que son una sola entrada diaria,
// aquí una persona puede completar más de una sesión de enfoque el mismo
// día, y cada una se guarda por separado).
//
// Se registra UNA entrada por cada vez que el temporizador de Modo Enfoque
// (FocusMode.jsx) llega a 0 en modo "trabajo" — nunca al pausar ni al
// reiniciar antes de terminar, el mismo criterio que ya usaba el XP que se
// otorga solo al completar una sesión. Pensado para la función #6 de la
// Fase 4 (inspirada en Pomodone): un reporte más profundo en Insights
// Semanales con tiempo total enfocado, promedio por sesión y el patrón día
// por día — ver weekFocusSummary() en weeklyInsights.js, que consume este
// log igual que weekSleepPattern() ya consume sleepLog.js.
import { todayKey } from "./streak.js";

export const DEFAULT_FOCUS_SESSION_LOG = {};

// `distractionTracked` — honestidad: el bloqueador de distracciones (salir
// de la pestaña y volver) solo corre mientras `isPlus` está activo en
// FocusMode.jsx (o siempre, en la variante "Solo una cosa", ver el
// comentario en FocusMode.jsx). Si una sesión se completó sin ese
// rastreo activo, `distractionCount` sería siempre 0 no porque no hubiera
// distracciones, sino porque no se midieron — por eso se guarda esta
// bandera junto con cada sesión, y el resumen semanal nunca suma como
// "cero distracciones" una sesión que en realidad no se rastreó.
export function logFocusSession(
  log,
  { durationMin, distractionCount = 0, distractionAwayMs = 0, distractionTracked = false } = {},
  now = new Date()
) {
  const key = todayKey(now);
  const prevEntries = (log || {})[key] || [];
  const entry = {
    durationMin: Math.max(0, Math.round(durationMin || 0)),
    distractionCount: Math.max(0, Math.round(distractionCount || 0)),
    distractionAwayMs: Math.max(0, Math.round(distractionAwayMs || 0)),
    distractionTracked: !!distractionTracked,
    completedAt: now.toISOString(),
  };
  return {
    ...(log || {}),
    [key]: [...prevEntries, entry],
  };
}

// Últimos `days` días (el más antiguo primero, hoy al final), con
// entries:[] en los días sin ninguna sesión — mismo patrón que
// recentBedtimes()/recentEntries(), pensado para alimentar
// weekFocusSummary() en weeklyInsights.js.
export function recentFocusSessions(log, days = 7, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ date: key, entries: (log || {})[key] || [] });
  }
  return out;
}
