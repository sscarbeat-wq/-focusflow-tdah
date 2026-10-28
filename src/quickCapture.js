// "Captura rápida" (inspirado en el mecanismo de Eco, de Bitblocks SAS) —
// una forma de dejar una idea suelta (por voz o texto) sin tener que
// decidir primero en qué panel va. Lógica pura: la lista de notas en sí
// mismas (DEFAULT_QUICK_NOTES, addQuickNote, resolveQuickNote,
// removeQuickNote, pendingQuickNotes) y el mecanismo de "nota olvidada que
// resurge sola" (oldForgottenNote), inspirado en "El Regreso" de Eco.
//
// A propósito NO intenta clasificar nada aquí — eso lo hace la IA del
// servidor (ver api/quick-capture.js), y la clasificación solo se usa para
// PROPONER agregar un medicamento/pago/paso ya existente; este archivo solo
// se encarga de la lista de notas en sí, que es la que persiste sin
// importar qué haya sugerido la IA.
import { todayKey, daysBetween } from "./streak.js";

export const DEFAULT_QUICK_NOTES = [];

// Cuántos días tiene que tener una nota pendiente, sin resolver, para
// considerarse "olvidada" y poder resurgir sola en la vista "Hoy" (inspirado
// en "El Regreso" de Eco). No tan corto que resurja algo de ayer, no tan
// largo que la persona sienta que Senda "guardó en secreto" algo por semanas.
export const FORGOTTEN_NOTE_MIN_DAYS = 3;

export function addQuickNote(list, text, now = new Date()) {
  const cleanText = String(text || "").trim().slice(0, 300);
  if (!cleanText) return list || [];
  const note = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    text: cleanText,
    createdAt: now.toISOString(),
    status: "pending",
  };
  return [...(list || []), note];
}

export function resolveQuickNote(list, id) {
  return (list || []).map((n) => (n.id === id ? { ...n, status: "resolved" } : n));
}

export function removeQuickNote(list, id) {
  return (list || []).filter((n) => n.id !== id);
}

// Pendientes, más recientes primero — para mostrarlas en su propio panel.
export function pendingQuickNotes(list) {
  return (list || [])
    .filter((n) => n.status !== "resolved")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Reutiliza daysBetween() de streak.js (misma convención de fecha local que
// ya usa toda la app) en vez de reinventar el cálculo de días aquí.
function daysSince(isoDate, now) {
  return daysBetween(todayKey(new Date(isoDate)), todayKey(now));
}

// La nota pendiente MÁS VIEJA que ya lleva FORGOTTEN_NOTE_MIN_DAYS días o
// más sin resolverse — o null si no hay ninguna así. Determinista: no
// cambia entre renders del mismo día salvo que la persona resuelva/borre
// la nota que estaba resurgiendo, igual que el resto de "Hoy" nunca
// inventa nada que no pueda respaldar con datos reales.
export function oldForgottenNote(list, now = new Date(), minDays = FORGOTTEN_NOTE_MIN_DAYS) {
  const candidates = (list || [])
    .filter((n) => n.status !== "resolved" && daysSince(n.createdAt, now) >= minDays)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return candidates[0] || null;
}

// --- Compartido entre QuickCapturePanel.jsx y BrainDumpPanel.jsx (Módulo 3
// de ANRO TDAH 2.0, 8 de noviembre de 2026) ---
// Las dos pantallas muestran la MISMA tarjeta de confirmación por cada
// sugerencia que propone la IA de api/quick-capture.js (una sola nota en
// Captura rápida, varias a la vez en Descarga mental) — estas dos funciones
// puras viven aquí para que ninguna de las dos reimplemente "¿esta
// sugerencia trae lo mínimo para agregarla directo?" ni "¿qué texto le
// muestro a la paciente?" por su cuenta.

// Solo se ofrece el botón de "agregar directo" cuando la IA entendió lo
// mínimo necesario para que el dato sea útil de verdad (ej. una hora de
// medicamento, o un día de vencimiento de pago) — si faltó algo, la tarjeta
// solo ofrece guardarlo como nota, nunca intenta adivinar.
export function canConfirmQuickCaptureSuggestion(suggestion, canAddStep) {
  if (!suggestion) return false;
  const f = suggestion.fields || {};
  if (suggestion.type === "medicamento") {
    return Boolean(f.name) && /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(f.time || ""));
  }
  if (suggestion.type === "pago") {
    const day = Number(f.dueDay);
    return (
      Boolean(f.name) && Number.isInteger(day) && day >= 1 && day <= 31 && (f.frequency === "mensual" || f.frequency === "anual")
    );
  }
  if (suggestion.type === "paso") {
    return Boolean(f.text) && canAddStep !== false;
  }
  return false;
}

// El texto que se muestra en la tarjeta de confirmación de cada sugerencia
// — mismas 4 plantillas de traducción (t.quickCapture.suggestX) sin
// importar si viene de Captura rápida o de una Descarga mental.
export function describeQuickCaptureSuggestion(suggestion, t) {
  if (!suggestion) return "";
  if (suggestion.type === "medicamento") {
    return t.quickCapture.suggestMedication(
      suggestion.fields?.name || t.quickCapture.defaultMedicationName,
      suggestion.fields?.time || ""
    );
  }
  if (suggestion.type === "pago") {
    return t.quickCapture.suggestPayment(
      suggestion.fields?.name || "",
      suggestion.fields?.amount ? `, ${suggestion.fields.amount}` : "",
      suggestion.fields?.dueDay ? `, ${t.quickCapture.dueDayPart(suggestion.fields.dueDay)}` : ""
    );
  }
  if (suggestion.type === "paso") {
    return t.quickCapture.suggestStep(
      suggestion.fields?.text || suggestion.noteText,
      suggestion.fields?.min ? ` (~${suggestion.fields.min} min)` : ""
    );
  }
  return t.quickCapture.noteLabel(suggestion.noteText);
}
