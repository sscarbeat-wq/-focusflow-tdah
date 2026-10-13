// Utilidades de límite de uso mensual para el desglosador con IA — puras,
// sin dependencias externas, siguiendo el mismo patrón que streak.js y
// moodLog.js. Hoy solo las usa el endpoint del servidor
// (api/breakdown-task.js), nunca el navegador del paciente directamente,
// pero viven aquí junto a la demás lógica de progreso por consistencia.

export const DEFAULT_AI_USAGE = { month: null, count: 0 };

// Límite mensual de usos del desglosador con IA por paciente. Es una
// barrera de seguridad ante un error o un uso fuera de lo normal, no un
// límite real de negocio — con el modelo económico que usa este endpoint,
// el costo real de cada uso es una fracción de centavo, así que aunque un
// paciente llegue al tope todos los meses el gasto sigue siendo mínimo.
export const AI_BREAKDOWN_MONTHLY_LIMIT = 40;

// "2026-10" a partir de una fecha — el tope es mensual, no diario.
export function monthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// Dado el uso previo guardado, regresa { usage, allowed }: el siguiente
// estado de uso (lo que hay que guardar) y si este intento debe permitirse.
// Si cambió el mes desde la última vez, reinicia el contador en vez de
// seguir sumando sobre un mes que ya pasó.
export function nextAiUsage(prev, now = new Date()) {
  const key = monthKey(now);
  const current = prev && prev.month === key ? prev : { month: key, count: 0 };

  if (current.count >= AI_BREAKDOWN_MONTHLY_LIMIT) {
    return { usage: current, allowed: false };
  }

  return { usage: { month: key, count: current.count + 1 }, allowed: true };
}
