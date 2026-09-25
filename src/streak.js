// Utilidades de racha diaria — puras, sin dependencias externas, fáciles de probar.

// Fecha de HOY como string YYYY-MM-DD en la zona horaria local del dispositivo
// (evitamos toISOString() porque usa UTC y puede "cambiar de día" antes de tiempo).
export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Diferencia en días completos entre dos strings YYYY-MM-DD.
export function daysBetween(aKey, bKey) {
  const a = new Date(`${aKey}T00:00:00`);
  const b = new Date(`${bKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export const DEFAULT_STREAK = { current: 0, longest: 0, lastDate: null };

// Dado el estado previo de racha, regresa el siguiente estado si el usuario
// hizo algo "trackeable" ahora mismo. Si ya se contó hoy, no cambia nada
// (evita que múltiples acciones en el mismo día sumen de más).
export function nextStreak(prev, now = new Date()) {
  const streak = { ...DEFAULT_STREAK, ...(prev || {}) };
  const today = todayKey(now);
  if (streak.lastDate === today) return streak;

  let current;
  if (!streak.lastDate) {
    current = 1;
  } else {
    const gap = daysBetween(streak.lastDate, today);
    current = gap === 1 ? streak.current + 1 : 1; // gap 1 = ayer -> continúa; si no, se rompió
  }
  return {
    current,
    longest: Math.max(streak.longest || 0, current),
    lastDate: today,
  };
}

// Racha "efectiva" para mostrar en la UI: si ya pasó más de un día desde la
// última actividad, la racha ya se rompió aunque el registro guardado no se
// haya actualizado todavía (el usuario no ha abierto la app hoy).
export function effectiveStreak(streak, now = new Date()) {
  const s = { ...DEFAULT_STREAK, ...(streak || {}) };
  if (!s.lastDate) return s;
  const gap = daysBetween(s.lastDate, todayKey(now));
  if (gap > 1) return { ...s, current: 0 };
  return s;
}
