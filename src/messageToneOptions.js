// Opciones y utilidades puras para "Ayuda con mensajes" (inspirado en
// Formalizer/Judge de Goblin Tools) — reescribir el tono de un mensaje que
// la paciente está por mandar, o leer con más calma uno que ya recibió.
// Vive aparte de MessageTonePanel.jsx para poder probarse sin React, mismo
// patrón que companionSituations.js.

export const MODES = {
  REWRITE: "reescribir",
  READ: "leer",
};

// Tonos a los que se puede pedir que se reescriba un mensaje. `label` es lo
// que ve la paciente en el botón; `hint` es la frase que se le manda a la
// IA para describir ese tono (vive aquí, junto a label, para que nunca se
// desincronicen).
export const TONE_OPTIONS = [
  { id: "amable", label: "Más amable", hint: "más amable, sin perder claridad" },
  { id: "breve", label: "Más breve", hint: "más breve y directo, sin relleno" },
  { id: "formal", label: "Más formal", hint: "más formal y profesional" },
  { id: "directo", label: "Más directo, sin rodeos", hint: "más directo, sin rodeos ni disculpas de más" },
];

export const MAX_MESSAGE_LENGTH = 1000;

export function isValidMode(mode) {
  return mode === MODES.REWRITE || mode === MODES.READ;
}

export function isValidTone(toneId) {
  return TONE_OPTIONS.some((t) => t.id === toneId);
}

export function toneHint(toneId) {
  const match = TONE_OPTIONS.find((t) => t.id === toneId);
  return match ? match.hint : TONE_OPTIONS[0].hint;
}

// Limpia y acota el texto que la paciente pega, antes de mandarlo al
// servidor — mismo principio que cleanTask en el desglosador.
export function cleanMessageText(text) {
  return String(text || "").trim().slice(0, MAX_MESSAGE_LENGTH);
}
