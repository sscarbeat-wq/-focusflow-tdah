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
// 10 de noviembre de 2026 — mascotas nuevas con ilustración real: tercer
// tipo de recompensa, "species" (ver IMAGE_SPECIES en mascotLogic.js),
// intercalado con los accesorios y colores que ya existían para que la
// recompensa nunca sea siempre del mismo tipo. Los 6 personajes de siempre
// siguen gratis. Los primeros llegan rápido (5, 15, 35 puntos) para que
// la paciente vea pronto que sumar puntos sí desbloquea algo; los más
// "imponentes" (tigre, león, águila) quedan al final. Son solo datos: se
// pueden ajustar sin tocar ninguna lógica. Debe quedar en orden
// ascendente (nextMilestone lo asume).
//
// Lógica pura (sin DOM ni React) para poder probarla con Node, mismo
// patrón que mascotLogic.js.
// 10 de noviembre de 2026 ("¿podrías poner más premios?" y luego "¿puedes
// poner más accesorios?"): de 18 premios a 36
// premios — 11 accesorios nuevos y 4 colores nuevos intercalados entre las
// mascotas, para que entre un premio y el siguiente nunca haya un hueco
// largo (al principio cada 5–10 XP; después cada 25–100), y una meta
// final de 1000 XP (trofeo) para quien lleve meses usando la app.
// Mismo día, más tarde: las 9 mascotas después del Koala pasaron a ser de
// ANRO Plus (ver PLUS_SPECIES en mascotLogic.js) — con Plus se usan todas
// al instante, así que ya no son premios por XP y salen de esta lista.
export const XP_MILESTONES = [
  { xp: 5, kind: "species", key: "panda" },
  { xp: 10, kind: "accessory", key: "sparkle" },
  { xp: 15, kind: "species", key: "zorro" },
  { xp: 20, kind: "accessory", key: "bow" },
  { xp: 25, kind: "accent", key: "gold" },
  { xp: 30, kind: "species", key: "pez" },
  { xp: 35, kind: "species", key: "koala" },
  { xp: 40, kind: "accessory", key: "glasses" },
  { xp: 45, kind: "species", key: "dragon" },
  { xp: 50, kind: "accessory", key: "crown" },
  { xp: 55, kind: "accessory", key: "balloon" },
  { xp: 60, kind: "accessory", key: "flower" },
  { xp: 75, kind: "accessory", key: "clover" },
  { xp: 90, kind: "accessory", key: "cap" },
  { xp: 100, kind: "accent", key: "jade" },
  { xp: 115, kind: "accent", key: "ocean" },
  { xp: 130, kind: "accessory", key: "music" },
  { xp: 160, kind: "accessory", key: "sunflower" },
  { xp: 175, kind: "accessory", key: "headphones" },
  { xp: 200, kind: "accessory", key: "scarf" },
  { xp: 225, kind: "accent", key: "violet" },
  { xp: 250, kind: "accessory", key: "backpack" },
  { xp: 275, kind: "accessory", key: "star" },
  { xp: 300, kind: "accessory", key: "lollipop" },
  { xp: 350, kind: "accessory", key: "rainbow" },
  { xp: 400, kind: "accent", key: "ruby" },
  { xp: 450, kind: "accessory", key: "medal" },
  { xp: 500, kind: "accessory", key: "kite" },
  { xp: 550, kind: "accent", key: "sunset" },
  { xp: 600, kind: "accessory", key: "art" },
  { xp: 650, kind: "accessory", key: "ball" },
  { xp: 700, kind: "accessory", key: "wand" },
  { xp: 800, kind: "accessory", key: "cupcake" },
  { xp: 850, kind: "accent", key: "forest" },
  { xp: 900, kind: "accessory", key: "gem" },
  { xp: 1000, kind: "accessory", key: "trophy" },
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
