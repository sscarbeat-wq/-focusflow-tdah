// Registro de uso del freno de impulsividad — lógica pura. A diferencia de
// moodLog.js/energyLog.js (una sola entrada por día), aquí puede haber
// varios usos el mismo día, porque el freno se puede usar las veces que
// haga falta. `context` distingue un uso general de uno específico para
// una compra no planeada — mismo mecanismo de 4 pasos (Alto/Respira/
// Evalúa/Actúa) en los dos casos, solo cambia la pregunta de la etapa
// "Evalúa"; esto solo cuenta cuántas veces se usó cada uno, para poder
// mostrarlo después en el Reporte para tu consulta.
import { todayKey } from "./streak.js";

export const DEFAULT_IMPULSE_BRAKE_LOG = {};
export const IMPULSE_BRAKE_CONTEXTS = ["general", "compra"];

export function recordImpulseBrakeUse(log, context = "general", now = new Date()) {
  const cleanContext = IMPULSE_BRAKE_CONTEXTS.includes(context) ? context : "general";
  const key = todayKey(now);
  const prev = (log || {})[key] || [];
  return {
    ...(log || {}),
    [key]: [...prev, { context: cleanContext, at: now.toISOString() }],
  };
}

// Totales en los últimos `days` días, separados por contexto — pensado
// para el Reporte para tu consulta ("usaste el freno X veces, Y de ellas
// antes de una compra no planeada").
export function weekImpulseBrakeCounts(log, days = 7, now = new Date()) {
  let total = 0;
  let purchase = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const entries = (log || {})[key] || [];
    total += entries.length;
    purchase += entries.filter((e) => e.context === "compra").length;
  }
  return { total, purchase };
}
