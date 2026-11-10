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

// 10 de noviembre de 2026 — mascotas nuevas con ilustración real.
// La doctora generó en Gemini 12 personajes nuevos con estilo de
// "sticker" y varias poses por etapa (en reposo, segundo paso para
// caminar, dormido/ojos cerrados, comiendo, jugando) — ver los prototipos
// "<animal>-movimiento-real.html". Cada personaje es UNA sola imagen
// /public/mascots/<animal>.webp (~170 KB) con todas sus poses en
// cuadrícula — 4 filas (etapas) × 5 columnas (en reposo, segundo paso,
// dormida, comiendo, jugando), cada cuadro de 256×256 con el dibujo pegado
// abajo y centrado. Una sola imagen por animal en vez de 204 sueltas: se
// descarga una vez, cambiar de pose nunca parpadea, y se suben 12 archivos
// a GitHub en vez de 204 (la subida web acepta máx. 100 a la vez).
//
// Las ilustraciones vienen en 4 etapas ("Recién nacida", "Pequeña",
// "Juvenil", "Adulta"), pero la racha sigue usando las mismas 6 etapas
// internas de siempre (textos clínicos ya aprobados, sin tocar) — se
// agrupan así: 0 días → recién nacida; 1–6 días → pequeña; 7–29 días →
// juvenil; 30+ días → adulta (ver STAGE_GROUP_BY_INDEX).
//
// Desbloqueo: decisión ya aprobada por la doctora en la propuesta de
// expansión de mascotas — los 6 de siempre siguen gratis; los nuevos se
// desbloquean con puntos de "foco acumulado" (nunca con la racha, para que
// perder una racha jamás quite un personaje). Los puntos de cada uno viven
// en xpMilestones.js.
//
// El conejo todavía no entra: sus imágenes tienen otro estilo (acuarela,
// no sticker) y le faltan las poses de comer y jugar.
export const IMAGE_SPECIES = [
  "panda",
  "zorro",
  "koala",
  "pulpo",
  "ajolote",
  "buho",
  "tortuga",
  "dinosaurio",
  "mariposa",
  "tigre",
  "leon",
  "aguila",
];
const IMAGE_SPECIES_SET = new Set(IMAGE_SPECIES);

// Los 6 de siempre también ya tienen ilustración (10 de noviembre de 2026,
// "se ven feas, hazlas como las otras"): se generaron en Gemini con el
// mismo estilo de sticker y las mismas 5 poses, y viven igual en
// /public/mascots/<especie>.webp. Siguen GRATIS — solo cambia cómo se
// dibujan, no el desbloqueo. SPECIES_EMOJI se queda como respaldo (y como
// referencia de qué es cada etapa). Las que todavía no tienen su imagen
// (Dragón, Perro, Pez) siguen con emoji hasta que se agreguen aquí.
const ILLUSTRATED_FREE_SPECIES = ["ave", "gato", "planta"];
const ART_SPECIES_SET = new Set([...IMAGE_SPECIES, ...ILLUSTRATED_FREE_SPECIES]);

export const SPECIES_OPTIONS = [...Object.keys(SPECIES_EMOJI), ...IMAGE_SPECIES];
export const FREE_SPECIES_OPTIONS = Object.keys(SPECIES_EMOJI);
export const DEFAULT_SPECIES = "ave";

// ¿Se dibuja con ilustración (imagen) en vez de emoji?
export function isImageSpecies(species) {
  return ART_SPECIES_SET.has(species);
}

// ¿Es de las que se desbloquean con puntos? (los 6 de siempre nunca).
export function isUnlockableSpecies(species) {
  return IMAGE_SPECIES_SET.has(species);
}

// 6 etapas internas → 4 grupos de ilustración.
export const STAGE_GROUP_KEYS = ["reciennacida", "pequena", "juvenil", "adulta"];
const STAGE_GROUP_BY_INDEX = ["reciennacida", "pequena", "pequena", "juvenil", "juvenil", "adulta"];
export function stageGroupFor(stageIndex) {
  return STAGE_GROUP_BY_INDEX[stageIndex] || "reciennacida";
}

// Poses disponibles por grupo — la recién nacida solo tiene "en reposo" y
// "dormida" (no camina, no come, no juega todavía).
export function posesFor(group) {
  return group === "reciennacida" ? ["a", "sleep"] : ["a", "b", "sleep", "eat", "play"];
}

const SHEET_POSES = ["a", "b", "sleep", "eat", "play"];
export const SHEET_COLUMNS = SHEET_POSES.length;
export const SHEET_ROWS = STAGE_GROUP_KEYS.length;

export function mascotSheetPath(species) {
  return `/mascots/${species}.webp`;
}

// Fila/columna del cuadro de una etapa+pose dentro de la imagen del
// personaje (una pose que esa etapa no tiene cae en "en reposo").
export function mascotFrame(group, pose = "a") {
  const safePose = posesFor(group).includes(pose) ? pose : "a";
  return { row: Math.max(0, STAGE_GROUP_KEYS.indexOf(group)), col: SHEET_POSES.indexOf(safePose) };
}

// Igual que con los emoji, lo que viaja por el resto del código (stage.emoji,
// matureEmoji) sigue siendo un STRING — "img:<especie>:<grupo>" — para que
// las comparaciones por valor que ya existían (p. ej. Mascot.jsx detecta un
// cambio de etapa comparando ese valor con el anterior) sigan funcionando
// igual. Ver MascotSprite.jsx para cómo se dibuja.
const IMAGE_PREFIX = "img:";
export function imageVisualKey(species, group) {
  return `${IMAGE_PREFIX}${species}:${group}`;
}
export function parseImageVisual(value) {
  if (typeof value !== "string" || !value.startsWith(IMAGE_PREFIX)) return null;
  const [species, group] = value.slice(IMAGE_PREFIX.length).split(":");
  if (!ART_SPECIES_SET.has(species) || !STAGE_GROUP_KEYS.includes(group)) return null;
  return { species, group };
}

// El emoji "maduro" de cada especie (última etapa) — se usa en el selector
// para mostrar de una vez a dónde llega cada personaje, no solo cómo
// empieza. Para los personajes con ilustración, es la marca de su imagen
// adulta.
export function matureEmoji(species) {
  if (ART_SPECIES_SET.has(species)) return imageVisualKey(species, "adulta");
  const emojis = SPECIES_EMOJI[species] || SPECIES_EMOJI[DEFAULT_SPECIES];
  return emojis[emojis.length - 1];
}

export function emojiFor(species, stageIndex) {
  if (ART_SPECIES_SET.has(species)) return imageVisualKey(species, stageGroupFor(stageIndex));
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

// Acceso rápido "fijado arriba" de la brújula de Inicio (rediseño "estilo
// K", 9 de noviembre de 2026 — ver el footnote del mockup original,
// "mantén presionado para fijar uno arriba"). Preferencia de dispositivo,
// mismo patrón que la especie elegida, el sonido de la mascota y la
// variante de reinicio de racha: se guarda la `key` del acceso (una de
// `quickAccessItems`, ver FocusFlowTDAH.jsx) y QuickAccessCompass.jsx la
// saca de la rueda que gira para dejarla fija arriba; null = nada fijado
// (todos giran, como siempre).
export const PINNED_ACCESS_STORAGE_KEY = "anro-compass-pinned-access";

export function getStoredPinnedAccess() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PINNED_ACCESS_STORAGE_KEY) || null;
  } catch (err) {
    return null;
  }
}

export function storePinnedAccess(key) {
  if (typeof window === "undefined") return;
  try {
    if (key) window.localStorage.setItem(PINNED_ACCESS_STORAGE_KEY, key);
    else window.localStorage.removeItem(PINNED_ACCESS_STORAGE_KEY);
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

// Selección editable de los 6 accesos de la brújula (9 de noviembre de
// 2026 — botón "✏️ Editar" del mockup original, que había quedado fuera de
// la primera entrega). Mismo patrón que lo fijado arriba: preferencia de
// DISPOSITIVO en localStorage, nunca progreso clínico. Se guarda un array
// JSON de hasta 6 `key` (de COMPASS_POOL, ver FocusFlowTDAH.jsx); null/
// ausente/corrupto = usar los 6 por defecto.
export const COMPASS_SELECTION_STORAGE_KEY = "anro-compass-selection";

export function getStoredCompassSelection() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COMPASS_SELECTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    if (!parsed.every((k) => typeof k === "string")) return null;
    return parsed.slice(0, 6);
  } catch (err) {
    return null;
  }
}

export function storeCompassSelection(keys) {
  if (typeof window === "undefined") return;
  try {
    if (Array.isArray(keys) && keys.length > 0) {
      window.localStorage.setItem(COMPASS_SELECTION_STORAGE_KEY, JSON.stringify(keys.slice(0, 6)));
    } else {
      window.localStorage.removeItem(COMPASS_SELECTION_STORAGE_KEY);
    }
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

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
