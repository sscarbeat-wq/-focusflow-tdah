// Utilidades de límite de uso mensual para funciones con IA — puras, sin
// dependencias externas, siguiendo el mismo patrón que streak.js y
// moodLog.js. Las usan los endpoints del servidor (api/breakdown-task.js,
// api/companion-response.js, api/quick-capture.js — "Ayuda con mensajes"
// vive fusionada dentro de api/breakdown-task.js), nunca el navegador del
// paciente directamente, pero viven aquí junto a la demás lógica de
// progreso por consistencia.

export const DEFAULT_AI_USAGE = { month: null, count: 0 };

// Límite mensual de usos del desglosador con IA por paciente. Es una
// barrera de seguridad ante un error o un uso fuera de lo normal, no un
// límite real de negocio — con el modelo económico que usa este endpoint,
// el costo real de cada uso es una fracción de centavo, así que aunque un
// paciente llegue al tope todos los meses el gasto sigue siendo mínimo.
export const AI_BREAKDOWN_MONTHLY_LIMIT = 40;

export const DEFAULT_COMPANION_AI_USAGE = { month: null, count: 0 };

// Límite mensual de respuestas con IA del Compañero de apoyo. Más bajo que
// el del desglosador: esta función da apoyo puntual en el momento, no se
// espera el mismo volumen de uso repetido que el desglosador de tareas.
export const COMPANION_AI_MONTHLY_LIMIT = 30;

// "2026-10" a partir de una fecha — el tope es mensual, no diario.
export function monthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Dado el uso previo guardado y un límite, regresa { usage, allowed }: el
// siguiente estado de uso (lo que hay que guardar) y si este intento debe
// permitirse. Si cambió el mes desde la última vez, reinicia el contador en
// vez de seguir sumando sobre un mes que ya pasó. Puro — cualquier contador
// de uso de IA (desglosador, compañero de apoyo, futuros) puede reutilizarla.
export function nextLimitedUsage(prev, limit, now = new Date()) {
  const key = monthKey(now);
  const current = prev && prev.month === key ? prev : { month: key, count: 0 };

  if (current.count >= limit) {
    return { usage: current, allowed: false };
  }

  return { usage: { month: key, count: current.count + 1 }, allowed: true };
}

export function nextAiUsage(prev, now = new Date()) {
  return nextLimitedUsage(prev, AI_BREAKDOWN_MONTHLY_LIMIT, now);
}

export function nextCompanionAiUsage(prev, now = new Date()) {
  return nextLimitedUsage(prev, COMPANION_AI_MONTHLY_LIMIT, now);
}

export const DEFAULT_MESSAGE_TONE_AI_USAGE = { month: null, count: 0 };

// Límite mensual de usos de "Ayuda con mensajes" (reescribir tono / leer un
// mensaje recibido). Mismo orden de magnitud que el del compañero de apoyo.
export const MESSAGE_TONE_AI_MONTHLY_LIMIT = 30;

export function nextMessageToneAiUsage(prev, now = new Date()) {
  return nextLimitedUsage(prev, MESSAGE_TONE_AI_MONTHLY_LIMIT, now);
}

export const DEFAULT_QUICK_CAPTURE_AI_USAGE = { month: null, count: 0 };

// Límite mensual de usos de "Captura rápida" (transcripción de voz +
// clasificación con IA). Mismo orden de magnitud que el desglosador: cada
// nota es corta (unos segundos de audio), así que el costo real por uso es
// mínimo incluso en el tope.
export const QUICK_CAPTURE_AI_MONTHLY_LIMIT = 40;

export function nextQuickCaptureAiUsage(prev, now = new Date()) {
  return nextLimitedUsage(prev, QUICK_CAPTURE_AI_MONTHLY_LIMIT, now);
}

export const DEFAULT_BRAIN_DUMP_AI_USAGE = { month: null, count: 0 };

// Límite mensual de usos de "Descarga mental con IA" (Módulo 3 de ANRO TDAH
// 2.0, 8 de noviembre de 2026) — la variante de Captura rápida que acepta
// un texto largo y lo separa en VARIOS pendientes de un solo golpe, en vez
// de una nota a la vez. Cuenta aparte de quickCaptureAiUsage (mismo
// principio que el resto de este archivo: cada función con IA lleva su
// propio contador) porque cada uso aquí hace más trabajo de clasificación
// que una nota suelta — más bajo que el de Captura rápida por eso mismo,
// aunque sigue siendo una fracción de centavo por uso con gpt-4o-mini.
export const BRAIN_DUMP_AI_MONTHLY_LIMIT = 20;

export function nextBrainDumpAiUsage(prev, now = new Date()) {
  return nextLimitedUsage(prev, BRAIN_DUMP_AI_MONTHLY_LIMIT, now);
}
