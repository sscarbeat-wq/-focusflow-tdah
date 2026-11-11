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

// "% de enfoque de hoy" (rediseño "estilo K" de Inicio, 9 de noviembre de
// 2026) — la doctora pidió un número REAL en el anillo de la mascota, no
// uno inventado ni reciclado del progreso de racha (ese mide otra cosa: qué
// tan cerca está la racha actual de subir de etapa, no cuánto se enfocó
// hoy). Este sí viene directo de las sesiones de Modo Enfoque realmente
// completadas hoy — mismo principio que el resto de la app ("nunca inventa
// un pendiente que la app no pueda respaldar con datos reales", ver
// todayView.js).
//
// No existe (todavía) una meta diaria configurable por paciente/doctora en
// ningún lugar del código — se buscó y no hay `dailyGoal`/`metaDiaria`/
// `focusGoal`/`goalMinutes` en ninguna parte. Mientras no exista esa
// pantalla, se usa una meta fija de referencia: 2 sesiones del tamaño por
// default de Modo Enfoque (WORK_OPTIONS en FocusMode.jsx, default 25 min) =
// 50 min. No es un número clínico ni una receta de cuánto "debería"
// enfocarse alguien con TDAH — es solo el punto de referencia para que el
// % tenga un denominador real y no quede siempre en 0% ni en un número
// arbitrario. Fácil de encontrar y ajustar después si se agrega una meta
// configurable de verdad.
export const DAILY_FOCUS_GOAL_MIN = 50;

// Minutos reales enfocados HOY (suma de `durationMin` de las sesiones ya
// completadas hoy, nunca negativa).
export function todayFocusMinutes(log, now = new Date()) {
  const key = todayKey(now);
  const entries = (log || {})[key] || [];
  return entries.reduce((sum, entry) => sum + (entry.durationMin || 0), 0);
}

// % de hoy contra la meta de referencia — siempre 0 a 100, redondeado al
// entero más cercano (no tiene sentido mostrar decimales de minutos). Un
// día sin ninguna sesión completada da 0%, honestamente — nunca se
// inventa un número de relleno.
export function todayFocusPercent(log, goalMin = DAILY_FOCUS_GOAL_MIN, now = new Date()) {
  if (!goalMin || goalMin <= 0) return 0;
  const minutes = todayFocusMinutes(log, now);
  return Math.max(0, Math.min(100, Math.round((minutes / goalMin) * 100)));
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
