// Lógica pura de la mascota — separada de Mascot.jsx para poder probarla
// con Node sin pasar por JSX, mismo patrón que el resto de la lógica pura
// del proyecto (streak.js, choosePick.js, etc.).
//
// 27 de octubre de 2026 — se agregó la elección de especie (la paciente
// puede elegir entre varios personajes distintos, ver SPECIES_OPTIONS). Las
// etapas (umbrales de días y los textos de label/hint en el diccionario de
// idioma, ej. `stageEggLabel`) se quedaron exactamente igual que antes —
// son genéricas sobre el avance de la racha ("3+ días seguidos", "¡Una
// semana completa!"), nunca mencionan al animal en sí, así que sirven para
// cualquier especie sin tener que traducir contenido nuevo. Lo único que
// cambia por especie es el emoji de cada etapa.
//
// Misma fecha, segunda pasada — la doctora pidió más animales y que "se
// vean mejor". Se agregaron 2 especies más (perro, pez) y se corrigieron
// dos etapas finales que no tenían sentido: "ave" terminaba en 🐉 (un
// dragón, no un ave — error de cuando se escribió este archivo por primera
// vez, probablemente de copiar/pegar la fila de "dragon") y "dragon"
// terminaba en 🔥 (fuego, no una criatura — rompía la idea de "ver crecer a
// tu mascota" justo en el momento más importante, la etapa máxima). También
// se le agregó un "✨" a la etapa final de las 6 especies, a manera de
// adorno visual consistente que marque claramente "esta es la forma
// máxima" — no cambia el emoji base de cada una, solo le suma el brillo.

// Metadatos de cada etapa — iguales para las 4 especies. El nombre interno
// de las claves (Egg/Hatchling/Chick/...) viene de cuando solo existía la
// especie "ave"; se quedó así a propósito para no tener que tocar los 4
// diccionarios de idioma solo por un renombre sin ningún cambio de texto.
const STAGE_META = [
  { min: 0, labelKey: "stageEggLabel", hintKey: "stageEggHint" },
  { min: 1, labelKey: "stageHatchlingLabel", hintKey: "stageHatchlingHint" },
  { min: 3, labelKey: "stageChickLabel", hintKey: "stageChickHint" },
  { min: 7, labelKey: "stageBirdLabel", hintKey: "stageBirdHint" },
  { min: 14, labelKey: "stageOwlLabel", hintKey: "stageOwlHint" },
  { min: 30, labelKey: "stageDragonLabel", hintKey: "stageDragonHint" },
];

// Un emoji por etapa, en el mismo orden que STAGE_META, para cada especie.
export const SPECIES_EMOJI = {
  ave: ["🥚", "🐣", "🐥", "🐦", "🦜", "🦚✨"],
  gato: ["🐾", "🐱", "🐈", "🐯", "🦁", "🐆✨"],
  planta: ["🌰", "🌱", "🌿", "🪴", "🌳", "🌺✨"],
  dragon: ["🥚", "🦎", "🐍", "🐲", "🐉", "🐉✨"],
  perro: ["🐾", "🐶", "🐕", "🐕‍🦺", "🦮", "🐺✨"],
  pez: ["🥚", "🐟", "🐠", "🐡", "🦈", "🐋✨"],
};

export const SPECIES_OPTIONS = Object.keys(SPECIES_EMOJI);
export const DEFAULT_SPECIES = "ave";

// El emoji "maduro" de cada especie (última etapa) — se usa en el selector
// para mostrar de una vez a dónde llega cada personaje, no solo cómo
// empieza.
export function matureEmoji(species) {
  const emojis = SPECIES_EMOJI[species] || SPECIES_EMOJI[DEFAULT_SPECIES];
  return emojis[emojis.length - 1];
}

function emojiFor(species, stageIndex) {
  const emojis = SPECIES_EMOJI[species] || SPECIES_EMOJI[DEFAULT_SPECIES];
  return emojis[stageIndex];
}

// Mensaje cuando la racha se acaba de reiniciar (current en 0 pero longest
// > 0, es decir, ya había tenido una racha antes) — a propósito distinto del
// de "nunca empezó" (longest también en 0): reiniciar una racha no es lo
// mismo que no haber empezado nunca, y no hay razón para que se sienta
// igual. Nada de lenguaje de "perdiste" o "rompiste" — eso alimenta el
// rechazo a la sensibilidad al rechazo (RSD) común en TDAH, que ya está
// documentado como consideración de diseño en otras partes de la app
// (Compañero de apoyo, Ayuda con mensajes). El emoji de reinicio es el de
// la propia etapa inicial de la especie elegida (huellas para gato, semilla
// para planta, etc.), no siempre un huevo.
//
// 8 de noviembre de 2026 — revisión de voz clínica: la doctora aprobó
// varias redacciones distintas para este mensaje (todas con el mismo
// principio sin culpa) y pidió que se alternen en vez de mostrar siempre la
// misma — primero 2, ampliado el mismo día a 5 a petición suya (mismo
// patrón de "solo contenido nuevo, sin lógica nueva" ya usado con el
// programa de TCC y las cápsulas científicas). El llamador (Mascot.jsx)
// decide cuál tocó mostrar y lo manda aquí como `resetVariant` (0 a
// RESET_VARIANT_COUNT-1) — esta función se queda pura, solo traduce esa
// decisión a la llave de i18n correspondiente (variante 0 usa
// "resetLabel"/"resetHint" tal cual, por compatibilidad con el nombre
// original; las siguientes usan "resetLabel2"/"resetHint2",
// "resetLabel3"/"resetHint3", etc.).
export const RESET_VARIANT_COUNT = 5;
export const RESET_VARIANT_STORAGE_KEY = "anro-reset-variant";

export function getStoredResetVariant() {
  if (typeof window === "undefined") return 0;
  try {
    const stored = Number(window.localStorage.getItem(RESET_VARIANT_STORAGE_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < RESET_VARIANT_COUNT) return stored;
  } catch (err) {
    // localStorage no disponible — se queda con el valor por defecto.
  }
  return 0;
}

export function storeResetVariant(variant) {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(variant) || variant < 0 || variant >= RESET_VARIANT_COUNT) return;
  try {
    window.localStorage.setItem(RESET_VARIANT_STORAGE_KEY, String(variant));
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

export function stageFor(current, longest, species = DEFAULT_SPECIES, resetVariant = 0) {
  if (current === 0 && longest > 0) {
    // Módulo "seguro" (nunca negativo) por si algún día llega un valor
    // fuera de rango — variante 0 usa las llaves originales sin sufijo
    // ("resetLabel"/"resetHint"), 1 en adelante usa "resetLabel2"/
    // "resetHint2", "resetLabel3"/"resetHint3", etc.
    const variant = ((resetVariant % RESET_VARIANT_COUNT) + RESET_VARIANT_COUNT) % RESET_VARIANT_COUNT;
    const suffix = variant === 0 ? "" : String(variant + 1);
    return {
      emoji: emojiFor(species, 0),
      labelKey: `resetLabel${suffix}`,
      hintKey: `resetHint${suffix}`,
    };
  }
  let stageIndex = 0;
  for (let i = 0; i < STAGE_META.length; i++) {
    if (current >= STAGE_META[i].min) stageIndex = i;
  }
  const meta = STAGE_META[stageIndex];
  return { emoji: emojiFor(species, stageIndex), labelKey: meta.labelKey, hintKey: meta.hintKey };
}

// Qué tan avanzada está la racha actual dentro de su etapa (0 a 1), para
// dibujar el anillo de progreso alrededor de la mascota. Racha recién
// reiniciada: anillo vacío (0), mismo principio de "no se ve como un
// castigo" que ya tenía el resto del mensaje de reinicio. Última etapa
// (30+ días): anillo lleno, porque ya no hay una siguiente etapa que marque
// el 100%. No depende de la especie — es solo aritmética sobre los
// umbrales de STAGE_META.
export function progressFraction(current, longest) {
  if (current === 0 && longest > 0) return 0;
  let stageIndex = 0;
  for (let i = 0; i < STAGE_META.length; i++) {
    if (current >= STAGE_META[i].min) stageIndex = i;
  }
  const stage = STAGE_META[stageIndex];
  const next = STAGE_META[stageIndex + 1];
  if (!next) return 1;
  const span = next.min - stage.min;
  if (span <= 0) return 1;
  return Math.max(0, Math.min(1, (current - stage.min) / span));
}

export const STAGES = STAGE_META;

// --- Especie elegida ---------------------------------------------------
//
// Mismo patrón que el tema claro/oscuro y el acento personal (theme.js):
// preferencia de DISPOSITIVO guardada en localStorage, no en el progreso
// clínico sincronizado con Supabase.
export const SPECIES_STORAGE_KEY = "anro-species";

export function getStoredSpecies() {
  if (typeof window === "undefined") return DEFAULT_SPECIES;
  try {
    const stored = window.localStorage.getItem(SPECIES_STORAGE_KEY);
    if (SPECIES_OPTIONS.includes(stored)) return stored;
  } catch (err) {
    // localStorage no disponible — se queda con el valor por defecto.
  }
  return DEFAULT_SPECIES;
}

export function storeSpecies(speciesKey) {
  if (typeof window === "undefined") return;
  if (!SPECIES_OPTIONS.includes(speciesKey)) return;
  try {
    window.localStorage.setItem(SPECIES_STORAGE_KEY, speciesKey);
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

// --- Accesorio cosmético desbloqueable por puntos -----------------------
//
// 8 de noviembre de 2026: a diferencia de la especie de arriba (libre desde
// el inicio), estos se desbloquean al llegar a ciertos puntos de "foco
// acumulado" — ver XP_MILESTONES en xpMilestones.js, que referencia estas
// mismas llaves por nombre (sin importar este archivo, para no crear una
// dependencia circular entre los dos). "none" siempre está disponible, sin
// necesidad de ningún punto. Se dibuja como una insignia chica encima de la
// mascota (ver Mascot.jsx) — mismo patrón de preferencia de DISPOSITIVO en
// localStorage que la especie y el acento personal, nunca progreso clínico.
export const ACCESSORY_EMOJI = {
  none: null,
  sparkle: "✨",
  crown: "👑",
  scarf: "🧣",
};
export const ACCESSORY_OPTIONS = Object.keys(ACCESSORY_EMOJI);
export const DEFAULT_ACCESSORY = "none";
export const ACCESSORY_STORAGE_KEY = "anro-mascot-accessory";

export function getStoredAccessory() {
  if (typeof window === "undefined") return DEFAULT_ACCESSORY;
  try {
    const stored = window.localStorage.getItem(ACCESSORY_STORAGE_KEY);
    if (ACCESSORY_OPTIONS.includes(stored)) return stored;
  } catch (err) {
    // localStorage no disponible — se queda con el valor por defecto.
  }
  return DEFAULT_ACCESSORY;
}

export function storeAccessory(accessoryKey) {
  if (typeof window === "undefined") return;
  if (!ACCESSORY_OPTIONS.includes(accessoryKey)) return;
  try {
    window.localStorage.setItem(ACCESSORY_STORAGE_KEY, accessoryKey);
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}
