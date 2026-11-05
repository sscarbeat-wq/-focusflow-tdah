// Hitos de recompensa por puntos de "foco acumulado" (XP) — 8 de noviembre
// de 2026, a petición explícita de la doctora tras ver el ícono de
// información nuevo ("es que un número sin recompensa como que no dice
// nada"): antes de esto, el contador de XP solo subía sin que llegar a
// ningún número en particular significara nada. Decidido con
// `AskUserQuestion`: la recompensa más grande de las 3 ofrecidas
// ("desbloqueables reales"), y dentro de esa, dos tipos combinados —
// accesorios cosméticos para la mascota (ver ACCESSORY_EMOJI en
// mascotLogic.js) y colores de acento especiales (ver
// UNLOCKABLE_ACCENT_OPTIONS en theme.js) — alternados, para que la
// recompensa no sea siempre del mismo tipo.
//
// A propósito, esto NO toca ni le pone candado a nada que ya era libre
// desde el inicio: ni la especie de mascota (SPECIES_OPTIONS,
// mascotLogic.js) ni los 9 colores de acento de siempre (ACCENT_OPTIONS,
// theme.js). Es una capa nueva que se suma encima, sin restringir lo que
// ya existía.
//
// Lógica pura (sin DOM ni React) para poder probarla con Node, mismo
// patrón que mascotLogic.js.
export const XP_MILESTONES = [
  { xp: 10, kind: "accessory", key: "sparkle" },
  { xp: 25, kind: "accent", key: "gold" },
  { xp: 50, kind: "accessory", key: "crown" },
  { xp: 100, kind: "accent", key: "jade" },
  { xp: 200, kind: "accessory", key: "scarf" },
  { xp: 400, kind: "accent", key: "ruby" },
];

// Todos los hitos ya alcanzados con este total de XP (orden ascendente,
// igual que XP_MILESTONES).
export function unlockedMilestones(xp) {
  return XP_MILESTONES.filter((m) => xp >= m.xp);
}

// Solo las llaves de un tipo (kind) ya desbloqueadas — lo que necesitan los
// selectores de accesorio/acento para saber qué mostrar habilitado.
export function unlockedKeys(xp, kind) {
  return unlockedMilestones(xp)
    .filter((m) => m.kind === kind)
    .map((m) => m.key);
}

export function isUnlocked(key, kind, xp) {
  return unlockedKeys(xp, kind).includes(key);
}

// El próximo hito todavía no alcanzado (o null si ya se desbloquearon
// todos) — incluye `remaining`, cuántos puntos faltan, redondeado igual
// que el propio contador de XP (2 decimales) para que nunca se vean
// cifras como "14.299999999999999".
export function nextMilestone(xp) {
  const next = XP_MILESTONES.find((m) => xp < m.xp);
  if (!next) return null;
  return { ...next, remaining: Math.round((next.xp - xp) * 100) / 100 };
}

// Dado el XP ANTES y DESPUÉS de una ganancia (grantXp), ¿se cruzó algún
// hito justo en este momento? Regresa el arreglo de hitos recién cruzados
// (0 o 1 en la práctica, ya que cada ganancia es +0.85 y los hitos están
// más separados que eso — pero se regresan todos por si acaso, nunca solo
// el primero, para no perder un desbloqueo). Se usa para disparar la
// celebración de "¡desbloqueaste algo!" SOLO en el instante exacto en que
// se cruza, no en cada render mientras ya se tiene desbloqueado desde antes.
export function justCrossedMilestones(prevXp, nextXp) {
  return XP_MILESTONES.filter((m) => prevXp < m.xp && nextXp >= m.xp);
}
