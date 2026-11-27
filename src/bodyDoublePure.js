// Lógica pura del "cuerpo doble virtual" — sin React ni Supabase, para que
// se pueda probar directo en Node antes de subir el cambio.

const AVATARS = ["🌱", "🪴", "🌾", "🍃", "🦋", "🐢", "🐝", "🦔", "🐌", "🌙", "⭐", "🔵", "🟢", "🟣", "🟠"];

// 15 de noviembre de 2026 ("quisiera que los dibujos de las personas
// pudieran elegirlos ellos... podría ser el animal que elija"): antes el
// avatar de la sala era SIEMPRE el hash anónimo de arriba (un emoji fijo
// de una lista genérica, sin relación con el personaje elegido — por eso
// "solo sale una planta"). Ahora, si la paciente ya tiene una mascota
// elegida (species, lo mismo que ve en su propia brújula), el avatar en
// la sala es ese animal — un vistazo reconoce "ah, alguien con dragón está
// aquí" en vez de un emoji sin sentido. Nota de diseño para la doctora:
// esto baja un poco el anonimato de antes (alguien que conozca qué
// mascota eligió otra paciente podría reconocerla en la sala por el
// animal, aunque nunca su nombre ni nada identificable) — si en algún
// momento prefieres volver al anónimo puro, es solo cambiar
// `avatarFor(userId, species)` de vuelta a `avatarFor(userId)` donde se
// llama, en bodyDouble.js.
const SPECIES_AVATARS = {
  ave: "🐦",
  gato: "🐱",
  planta: "🌱",
  dragon: "🐉",
  perro: "🐶",
  pez: "🐠",
  panda: "🐼",
  zorro: "🦊",
  koala: "🐨",
  pulpo: "🐙",
  ajolote: "🦎",
  buho: "🦉",
  tortuga: "🐢",
  dinosaurio: "🦖",
  mariposa: "🦋",
  tigre: "🐯",
  leon: "🦁",
  aguila: "🦅",
};

// Hash simple y determinístico: la misma cuenta siempre cae en el mismo
// emoji anónimo (para poder distinguir "cuántas personas distintas" hay en
// la sala), pero no hay forma de ir del emoji de vuelta al userId. Sigue
// siendo el respaldo cuando no hay `species` (cuenta nueva, sin mascota
// elegida todavía) o cuando la especie no está en SPECIES_AVATARS.
function anonymousAvatarFor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length];
}

export function avatarFor(userId, species) {
  return (species && SPECIES_AVATARS[species]) || anonymousAvatarFor(userId);
}

// Parche de seguridad (27 de noviembre de 2026): identificador ANÓNIMO de
// presencia. Antes, lo que cada persona transmitía a la sala incluía su
// `userId` real de la cuenta (como "key" de presencia y dentro del
// mensaje) — y todo el que abre la sala recibe eso de todos los demás. El
// `userId` no se ve en pantalla, pero sí viajaba, y era justo el dato que
// hacía falta para molestar a otra persona desde fuera de la app. Ahora
// cada vez que se abre la sala se inventa un identificador al azar, que
// solo sirve para saber "cuál de estos avatares soy yo" y no tiene
// ninguna relación con la cuenta.
export function newPresenceId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `p-${crypto.randomUUID()}`;
    }
  } catch (err) {
    // sigue al respaldo de abajo
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// Convierte el objeto crudo que regresa channel.presenceState() de Supabase
// (agrupado por key) en la lista plana que pinta el panel, marcando cuál
// es "yo". `selfPresenceId` es el identificador anónimo de arriba (campo
// `pid` de lo que se transmite), ya no el userId de la cuenta.
export function participantsFromPresenceState(state, selfPresenceId) {
  return Object.values(state)
    .flat()
    .map((p) => ({ avatar: p.avatar, status: p.status, isMe: !!p.pid && p.pid === selfPresenceId }));
}

// 15 de noviembre de 2026 — mismo texto de estatus corto para el chip del
// encabezado de Inicio y la pestañita junto a "Mis hábitos" (ver
// HomeHeader.jsx y BodyDoubleStrip.jsx), para no repetir la misma lógica
// en dos componentes. `bd` es `t.bodyDouble` (las cadenas de ese idioma).
// Desde que el canal se abre en modo "solo mirar" sin unirse (ver
// bodyDouble.js), `count` puede ser mayor a 0 incluso sin haberte unido.
export function bodyDoublePresenceText(bd, joined, count) {
  if (joined) return count <= 1 ? bd.tabAlone : bd.tabCount(count);
  return count > 0 ? bd.tabCount(count) : bd.tabEmpty;
}

export function bodyDoubleHintText(bd, joined, count) {
  if (joined) return "";
  return count > 0 ? bd.tabIdle : bd.tabEmptyHint;
}

// Reacciones sin texto dentro de la sala — vocabulario fijo y pequeño, a
// propósito, para no abrir la puerta a texto libre ni a nada que necesite
// moderación. Se transmiten por un broadcast efímero de Supabase Realtime
// (nunca se guardan), igual de anónimo que la presencia: solo viaja el
// emoji de reacción junto con el avatar anónimo de quien la mandó.
//
// 17 de noviembre de 2026 ("añade más reacciones"): de 3 a 6 — se eligieron
// para no repetir el sentido de ninguna de las 3 originales (saludo,
// ánimo, celebración) en vez de solo variar el dibujo: cariño/apoyo
// emocional, racha/energía, y calma — así cubren registros distintos en
// vez de 3 formas distintas de decir lo mismo.
export const REACTIONS = [
  { emoji: "👋", label: "Aquí contigo" },
  { emoji: "💪", label: "Ánimo" },
  { emoji: "🎉", label: "¡Lo logré!" },
  { emoji: "❤️", label: "Con cariño" },
  { emoji: "🔥", label: "¡Qué racha!" },
  { emoji: "😌", label: "Con calma" },
];

export function isValidReaction(emoji) {
  return REACTIONS.some((r) => r.emoji === emoji);
}
