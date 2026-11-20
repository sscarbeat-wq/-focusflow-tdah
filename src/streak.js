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

// 20 de noviembre de 2026 ("el animalito puede decir otras frases?" →
// frases nuevas según lo que pasa con la racha/XP, no solo las genéricas
// del día): números de racha que se festejan con una frase especial de la
// mascota (no un modal, solo el globito de siempre — ver `streakEvent` en
// FocusFlowTDAH.jsx y las frases nuevas en i18n `mascot.streakMilestone*`).
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100, 150, 200, 365];

// Dado el estado de racha justo ANTES de actualizarse (prevStreak) y el
// estado justo DESPUÉS (nextStreak, el resultado de llamar nextStreak()
// arriba), decide si hay algo que vale la pena que la mascota comente —
// nunca más de un evento a la vez, en orden de qué tan especial es.
// Pensado para llamarse solo el día en que `lastDate` de verdad cambió
// (una sola vez al día, la primera acción que cuenta ese día) — así nunca
// se repite con solo recargar la página. Nunca regaña: el caso de "volver
// después de una ausencia" es una bienvenida cálida, nunca menciona
// cuántos días faltaron de forma que se sienta un reclamo.
export function streakEventFor(prevStreak, nextStreakState) {
  const prev = { ...DEFAULT_STREAK, ...(prevStreak || {}) };
  const next = nextStreakState;
  if (!next || !next.lastDate) return null;
  // ¿Volvió después de una ausencia real? Solo cuenta si YA había una
  // fecha previa (si no, es la primerísima vez que usa la app — eso no
  // es "volver a nada") y el hueco fue de más de un día.
  if (prev.lastDate) {
    const gap = daysBetween(prev.lastDate, next.lastDate);
    if (gap > 1) return { type: "welcomeBack", gapDays: gap };
  }
  // ¿Récord personal? La racha actual superó el mejor histórico de antes
  // (y no es solo el primerísimo día, donde "superar" un 0 no dice nada).
  if (next.current > 1 && next.longest > (prev.longest || 0)) {
    return { type: "record", value: next.current };
  }
  // ¿Hito redondo de racha?
  if (STREAK_MILESTONES.includes(next.current)) {
    return { type: "milestone", value: next.current };
  }
  return null;
}
