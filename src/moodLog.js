// Utilidades de registro de ánimo diario — puras, sin dependencias externas.
// Reutiliza todayKey() de streak.js para mantener la misma lógica de "día"
// basada en la zona horaria local del dispositivo (evita bugs de UTC).
import { todayKey } from "./streak";

export const DEFAULT_MOOD_LOG = {};

// Guarda o actualiza la entrada de HOY. `mood` es un número del 1 (muy mal)
// al 5 (muy bien). Si el usuario ya había registrado su ánimo hoy, esto
// simplemente actualiza esa misma entrada (no crea duplicados).
export function recordMood(log, mood, note = "", now = new Date()) {
  const key = todayKey(now);
  return {
    ...(log || {}),
    [key]: { mood, note: String(note || "").slice(0, 200), at: now.toISOString() },
  };
}

// Entrada de hoy, o null si el usuario todavía no registra nada hoy.
export function todayEntry(log, now = new Date()) {
  return (log || {})[todayKey(now)] || null;
}

// Últimos `days` días (el más antiguo primero, hoy al final), con entry:null
// en los días sin registro — pensado para dibujar una tira de historial.
export function recentEntries(log, days = 7, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ date: key, entry: (log || {})[key] || null });
  }
  return out;
}
