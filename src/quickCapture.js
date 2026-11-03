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

// "Memoria ANRO" (3 de noviembre de 2026) — bucket de Supabase Storage para
// las fotos que se adjuntan a una nota de Captura rápida. A propósito solo
// almacenamiento: nunca se procesa la imagen (sin OCR, sin IA de visión),
// nunca se guardan los bytes dentro de esta misma fila de `progress` (ese
// JSON se reenvía completo en cada autoguardado, así que meter ahí una foto
// en base64 lo haría cada vez más pesado) — cada nota solo guarda la RUTA
// dentro del bucket (`photoPath`), nunca la URL pública, porque el bucket es
// privado y cada URL para mostrarla se pide al momento (ver supabase/
// schema.sql para las políticas RLS: cada paciente solo puede subir/ver/
// borrar dentro de su propia carpeta `${userId}/...`).
export const QUICK_NOTE_PHOTOS_BUCKET = "quick-note-photos";

// `photoPath` (string o null) — la ruta dentro de QUICK_NOTE_PHOTOS_BUCKET
// si la nota lleva una foto adjunta, o null si es solo texto/voz. Nunca se
// valida el formato aquí (eso ya lo hizo quien subió el archivo a Storage
// antes de llamar a esta función) — mismo principio del resto de este
// archivo: la lista de notas no sabe nada de cómo se originó cada una.
export function addQuickNote(list, text, now = new Date(), photoPath = null) {
  const cleanText = String(text || "").trim().slice(0, 300);
  if (!cleanText && !photoPath) return list || [];
  const note = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    text: cleanText,
    createdAt: now.toISOString(),
    status: "pending",
    photoPath: photoPath || null,
  };
  return [...(list || []), note];
}

// Búsqueda de texto simple (Fase "Memoria ANRO", 3 de noviembre de 2026) —
// a propósito NO es semántica ni usa IA: solo coincidencia de subcadena,
// sin distinguir mayúsculas/minúsculas, sobre TODAS las notas (pendientes Y
// resueltas, al revés de pendingQuickNotes, que solo muestra las
// pendientes) — la idea es poder encontrar algo que ya se guardó hace
// tiempo, sin importar si ya se marcó como resuelto. Más recientes primero,
// igual que pendingQuickNotes. Un query vacío o solo espacios regresa lista
// vacía en vez de "todas las notas", para que el panel sepa distinguir
// "todavía no buscaste nada" de "buscaste y no hay resultado".
export function searchQuickNotes(list, query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return [];
  return (list || [])
    .filter((n) => n.text.toLowerCase().includes(cleanQuery))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
