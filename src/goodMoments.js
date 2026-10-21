// "Banco de momentos buenos" — captura rápida (voz o texto) de un momento
// positivo del día. A diferencia de Captura rápida (api/quick-capture.js),
// que manda el texto a un modelo de IA para proponer en qué categoría va,
// aquí la persona ya sabe que es un momento bueno — así que se guarda
// directo, sin IA, sin clasificar nada. El único propósito es poder
// volver a verlo después ("revisitarlo"), nunca analizarlo ni actuar
// sobre él.
//
// Inspirado en un hallazgo (un solo estudio, no concluyente — se trata con
// cautela): "saborear" un momento positivo durante unos segundos podría
// amortiguar la sensibilidad al rechazo. Por eso el texto se guarda tal
// cual, sin resumen ni reescritura de ningún tipo.
export const DEFAULT_GOOD_MOMENTS = [];

// Más reciente primero, para que revisar la lista muestre lo último que se
// guardó arriba.
export function addGoodMoment(list, text, now = new Date()) {
  const cleanText = String(text || "").trim().slice(0, 200);
  if (!cleanText) return list || [];
  const moment = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    text: cleanText,
    createdAt: now.toISOString(),
  };
  return [moment, ...(list || [])];
}

export function removeGoodMoment(list, id) {
  return (list || []).filter((m) => m.id !== id);
}

export function recentGoodMoments(list, limit = 10) {
  return (list || []).slice(0, limit);
}

// Elige uno al azar de TODA la lista (no solo de los recientes visibles)
// para "revisitar" — mismo espíritu que pickRandomStep() de choosePick.js,
// pero aquí no hay nada que desempatar: cualquier momento bueno sirve.
export function pickRandomGoodMoment(list) {
  const items = list || [];
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}
