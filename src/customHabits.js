// Hábitos propios y reinicio diario (11 de noviembre de 2026, "¿podría el
// paciente añadir hábitos?"). Funciones puras, sin React.
//
// 1) Reinicio diario. Las palomitas de "Mis hábitos de hoy" antes NO se
//    borraban al cambiar de día (ver la nota vieja en weeklyInsights.js):
//    lo marcado hoy seguía marcado mañana. Ahora cada palomita pertenece a
//    un "día de hábitos" (habitDayKey) y al cambiar ese día se apagan todas.
//    El día de hábitos cambia a las 4 am, no a medianoche: "Apagué las
//    pantallas" y "Preparé mi cuarto" se palomean justo antes de dormir, y
//    quien se acuesta a las 12:30 todavía está cerrando SU día.
//
// 2) Hábitos propios. Hasta MAX_CUSTOM_HABITS (3), además de los 4 fijos:
//    con TDAH una lista larga se abandona, y 7 en total todavía caben en la
//    franja de Inicio. Cada uno: { id, emoji, label, done }.
import { todayKey } from "./streak.js";

export const HABIT_DAY_START_HOUR = 4;
export const MAX_CUSTOM_HABITS = 3;
// 60 letras: con 30 no cabía "Cerrar las puertas por la noche" (lo reportó
// la doctora al probarlo). En la franja de Inicio el nombre largo se corta
// con "…" a 2 renglones; en la lista se ve completo.
export const CUSTOM_HABIT_MAX_LENGTH = 60;
export const DEFAULT_CUSTOM_HABITS = [];
// El último (✨) es el neutro con el que arranca un hábito nuevo.
export const HABIT_EMOJIS = ["💊", "📖", "🚶", "🏃", "🧘", "🦷", "🧴", "📝", "📅", "⏰", "🎒", "🔑", "🍳", "☕", "🎵", "🌱", "🌳", "☀️", "🐶", "🔒", "🧹", "🛁", "🍎", "✨"];

export function habitDayKey(now = new Date()) {
  return todayKey(new Date(now.getTime() - HABIT_DAY_START_HOUR * 60 * 60 * 1000));
}

function cleanLabel(label) {
  return String(label || "").replace(/\s+/g, " ").trim().slice(0, CUSTOM_HABIT_MAX_LENGTH);
}

function cleanEmoji(emoji) {
  return HABIT_EMOJIS.includes(emoji) ? emoji : HABIT_EMOJIS[HABIT_EMOJIS.length - 1];
}

// Lo que venga guardado (o nada) → una lista válida.
export function normalizeCustomHabits(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((h) => h && typeof h.id === "string" && cleanLabel(h.label))
    .slice(0, MAX_CUSTOM_HABITS)
    .map((h) => ({ id: h.id, emoji: cleanEmoji(h.emoji), label: cleanLabel(h.label), done: !!h.done }));
}

export function canAddCustomHabit(list) {
  return (list || []).length < MAX_CUSTOM_HABITS;
}

export function addCustomHabit(list, { emoji, label }, now = Date.now()) {
  const text = cleanLabel(label);
  if (!text || !canAddCustomHabit(list)) return list || [];
  const id = `h${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return [...(list || []), { id, emoji: cleanEmoji(emoji), label: text, done: false }];
}

export function updateCustomHabit(list, id, { emoji, label }) {
  const text = cleanLabel(label);
  if (!text) return list || [];
  return (list || []).map((h) => (h.id === id ? { ...h, emoji: cleanEmoji(emoji), label: text } : h));
}

export function removeCustomHabit(list, id) {
  return (list || []).filter((h) => h.id !== id);
}

export function toggleCustomHabit(list, id) {
  return (list || []).map((h) => (h.id === id ? { ...h, done: !h.done } : h));
}

export function resetCustomHabits(list) {
  return (list || []).map((h) => (h.done ? { ...h, done: false } : h));
}
