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
//
// 11 de noviembre de 2026 — la doctora pidió registrar también la hora de
// DESPERTAR para contar el tiempo de sueño. Se agrega como dato opcional de
// la misma entrada (`wake`, mismo formato "HH:MM"); la hora de dormir sigue
// siendo el dato principal y todo lo anterior funciona igual sin `wake`.
// El tiempo que sale de restar las dos horas es APROXIMADO (lo que la
// persona recuerda, incluye el rato que tardó en dormirse y los
// despertares) — por eso en pantalla y en el reporte siempre dice
// "aproximado", nunca se presenta como una medición.
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
// `wake` (opcional): hora de despertar. Si no se manda, se conserva la que
// ya estuviera guardada hoy; si se manda vacía (""), se borra.
export function recordBedtime(log, time, now = new Date(), wake) {
  if (!isValidSleepTime(time)) return log || {};
  const key = todayKey(now);
  const prev = (log || {})[key];
  const entry = { time, at: now.toISOString() };
  const nextWake = wake === undefined ? prev?.wake : wake;
  if (isValidSleepTime(nextWake)) entry.wake = nextWake;
  return {
    ...(log || {}),
    [key]: entry,
  };
}

// Minutos entre la hora de dormir y la de despertar de una entrada. Si la
// de despertar es "menor" (se durmió a las 23:30 y despertó a las 07:00) se
// entiende que es del día siguiente. Regresa null si falta la hora de
// despertar o si el resultado no es creíble (menos de 1 hora o más de 16):
// casi seguro fue un error al anotar, y es mejor no contarlo que promediar
// un dato falso.
export const MIN_SLEEP_MINUTES = 60;
export const MAX_SLEEP_MINUTES = 16 * 60;

export function sleepDurationMinutes(entry) {
  if (!entry || !isValidSleepTime(entry.time) || !isValidSleepTime(entry.wake)) return null;
  const toMin = (v) => parseInt(v.slice(0, 2), 10) * 60 + parseInt(v.slice(3, 5), 10);
  let diff = toMin(entry.wake) - toMin(entry.time);
  if (diff <= 0) diff += 24 * 60;
  if (diff < MIN_SLEEP_MINUTES || diff > MAX_SLEEP_MINUTES) return null;
  return diff;
}

// Resumen del tiempo de sueño aproximado en los últimos `days` días: solo
// cuenta las noches que tienen las dos horas. nights = 0 → sin datos.
export function sleepDurationSummary(log, days = 7, now = new Date()) {
  const minutes = recentBedtimes(log, days, now)
    .map((e) => sleepDurationMinutes(e.entry))
    .filter((m) => m != null);
  if (minutes.length === 0) return { nights: 0, averageMinutes: null, minMinutes: null, maxMinutes: null };
  const total = minutes.reduce((a, b) => a + b, 0);
  return {
    nights: minutes.length,
    averageMinutes: Math.round(total / minutes.length),
    minMinutes: Math.min(...minutes),
    maxMinutes: Math.max(...minutes),
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
