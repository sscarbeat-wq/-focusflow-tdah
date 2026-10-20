// Check-in rápido de nivel de energía — lógica pura, mismo patrón que
// moodLog.js. Tres niveles (inspirado en el campo "Energy Level"/"Brain
// State" de Toodledo): baja, media, alta. Se usa junto con las etiquetas de
// energía de los pasos del desglosador (ver todayView.js) para sugerir qué
// conviene intentar primero según cómo se siente la persona hoy — nunca
// para bloquear ni esconder nada, solo para sugerir.
import { todayKey } from "./streak.js";

export const ENERGY_LEVELS = ["baja", "media", "alta"];

export const DEFAULT_ENERGY_LOG = {};

export function isValidEnergyLevel(level) {
  return ENERGY_LEVELS.includes(level);
}

// Guarda o actualiza el check-in de energía de HOY (una sola entrada por
// día, igual que el de ánimo).
export function recordEnergy(log, level, now = new Date()) {
  if (!isValidEnergyLevel(level)) return log || {};
  const key = todayKey(now);
  return {
    ...(log || {}),
    [key]: { level, at: now.toISOString() },
  };
}

export function todayEnergyEntry(log, now = new Date()) {
  return (log || {})[todayKey(now)] || null;
}

// Últimos `days` días (el más antiguo primero, hoy al final), con
// entry:null en los días sin registro — misma forma que recentEntries() de
// moodLog.js, pensada para una tira de historial.
export function recentEnergyEntries(log, days = 7, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ date: key, entry: (log || {})[key] || null });
  }
  return out;
}
