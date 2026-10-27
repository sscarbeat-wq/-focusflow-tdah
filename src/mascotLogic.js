// Lógica pura de la mascota — separada de Mascot.jsx para poder probarla
// con Node sin pasar por JSX, mismo patrón que el resto de la lógica pura
// del proyecto (streak.js, choosePick.js, etc.).
//
// 27 de octubre de 2026 — se agregó la elección de especie (la paciente
// puede elegir entre 4 personajes distintos, ver SPECIES_OPTIONS). Las
// etapas (umbrales de días y los textos de label/hint en el diccionario de
// idioma, ej. `stageEggLabel`) se quedaron exactamente igual que antes —
// son genéricas sobre el avance de la racha ("3+ días seguidos", "¡Una
// semana completa!"), nunca mencionan al animal en sí, así que sirven para
// cualquier especie sin tener que traducir contenido nuevo. Lo único que
// cambia por especie es el emoji de cada etapa.

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
  ave: ["🥚", "🐣", "🐥", "🦜", "🦉", "🐉"],
  gato: ["🐾", "🐱", "🐈", "🐯", "🦁", "🐆"],
  planta: ["🌰", "🌱", "🌿", "🪴", "🌳", "🌺"],
  dragon: ["🥚", "🦎", "🐍", "🐲", "🐉", "🔥"],
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
export function stageFor(current, longest, species = DEFAULT_SPECIES) {
  if (current === 0 && longest > 0) {
    return { emoji: emojiFor(species, 0), labelKey: "resetLabel", hintKey: "resetHint" };
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
