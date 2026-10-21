// Lógica pura del "cuerpo doble virtual" — sin React ni Supabase, para que
// se pueda probar directo en Node antes de subir el cambio.

const AVATARS = ["🌱", "🪴", "🌾", "🍃", "🦋", "🐢", "🐝", "🦔", "🐌", "🌙", "⭐", "🔵", "🟢", "🟣", "🟠"];

// Hash simple y determinístico: la misma cuenta siempre cae en el mismo
// emoji anónimo (para poder distinguir "cuántas personas distintas" hay en
// la sala), pero no hay forma de ir del emoji de vuelta al userId.
export function avatarFor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length];
}

// Convierte el objeto crudo que regresa channel.presenceState() de Supabase
// (agrupado por key) en la lista plana que pinta el panel, marcando cuál
// es "yo".
export function participantsFromPresenceState(state, userId) {
  return Object.values(state)
    .flat()
    .map((p) => ({ avatar: p.avatar, status: p.status, isMe: p.userId === userId }));
}

// Reacciones sin texto dentro de la sala — vocabulario fijo y pequeño, a
// propósito, para no abrir la puerta a texto libre ni a nada que necesite
// moderación. Se transmiten por un broadcast efímero de Supabase Realtime
// (nunca se guardan), igual de anónimo que la presencia: solo viaja el
// emoji de reacción junto con el avatar anónimo de quien la mandó.
export const REACTIONS = [
  { emoji: "👋", label: "Aquí contigo" },
  { emoji: "💪", label: "Ánimo" },
  { emoji: "🎉", label: "¡Lo logré!" },
];

export function isValidReaction(emoji) {
  return REACTIONS.some((r) => r.emoji === emoji);
}
