// Registro de hora de inicio de sueño — lógica pura, mismo patrón que
// moodLog.js/energyLog.js: una sola entrada por día, la hora "HH:MM" (24
// horas) a la que la persona se durmió esa noche, tal como ella la recuerda
// y la escribe — no un sensor, no algo medido automáticamente.
//
// Por qué esto y no "calidad de sueño" o "horas dormidas": el consenso
// clínico de 2025 (Delphi, 212 especialistas del Reino Unido, Frontiers in
// Psychiatry) señala el sueño retrasado (acostarse mucho más tarde de lo
// que la persona querría) como una pieza central y manejable del manejo
// del TDAH en adultos — más simple de registrar de forma honesta que
// "calidad" o "horas", que dependen de percepción.
import { todayKey } from "./streak.js";

export const DEFAULT_SLEEP_LOG = {};

// Mismo formato "HH:MM" de 24 horas que ya usa medicationLog.js para los
// horarios de dosis. Se valida aquí mismo, sin importarlo de ahí, porque
// son conceptos distintos (hora de dormir vs. hora de una dosis) que no
// deberían quedar acoplados solo porque comparten el formato de texto.
export function isValidSleepTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

// Guarda o actualiza la hora de dormir de HOY (una sola entrada por día,
// igual que ánimo/energía — si ya había una, la reemplaza en vez de
// duplicarla).
export function recordBedtime(log, time, now = new Date()) {
  if (!isValidSleepTime(time)) return log || {};
  const key = todayKey(now);
  return {
    ...(log || {}),
    [key]: { time, at: now.toISOString() },
  };
}

export function todayBedtime(log, now = new Date()) {
  return (log || {})[todayKey(now)] || null;
}

// Últimos `days` días (el más antiguo primero, hoy al final), con
// entry:null en los días sin registro — misma forma que recentEntries() de
// moodLog.js, pensada para una tira de historial o para alimentar un
// resumen semanal.
export function recentBedtimes(log, days = 7, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ date: key, entry: (log || {})[key] || null });
  }
  return out;
}

// Una hora se considera "tardía" si cae entre la medianoche y antes del
// mediodía (00:00–11:59) — cubre dormirse pasada la medianoche, la 1 a.m.,
// las 3 a.m., etc. Es una regla simple a propósito: no distingue 00:05 de
// 04:30, y no sabe si la persona de verdad se durmió a esa hora o solo
// registró tarde — es solo una señal para conversar con el médico, nunca
// un diagnóstico automático.
const LATE_UPPER_BOUND_HOUR = 12;

export function isLateBedtime(time, lateHour = 0) {
  if (!isValidSleepTime(time)) return false;
  const hour = parseInt(time.slice(0, 2), 10);
  return hour >= lateHour && hour < LATE_UPPER_BOUND_HOUR;
}
