// "Línea de tiempo visual" — arma, con el tarro de logros (jar) que ya
// existe, una línea de tiempo de HOY: a qué hora pasó cada cosa que
// hiciste en Senda, agrupada por momento del día. No agrega ninguna
// fuente de datos nueva — el tarro ya guarda un id=Date.now() (hora real)
// y una etiqueta por cada acción que suma XP en toda la app (ánimo,
// energía, medicamento, pasos del desglosador, Modo Enfoque, freno de
// impulsividad, hábitos, etc., ver grantXp() en FocusFlowTDAH.jsx); esto
// solo lo reorganiza por hora en vez de mostrarlo como la lista plana de
// "los logros más recientes" que ya usan el tarro y los Insights.
//
// Por qué esto y no una agenda por horas de verdad: los pasos del
// desglosador no tienen una hora planeada (son una lista de pendientes,
// no un calendario), así que una línea de tiempo con horas INVENTADAS
// sería fabricar un dato que la persona nunca dio. Esta línea de tiempo
// muestra solo lo que de verdad pasó, a la hora en que de verdad pasó —
// pensada para la dificultad de "sentir" cómo se fue pasando el día
// (a veces llamada "organización en el tiempo"), no para planear nada.
import { todayKey } from "./streak.js";

export const DAY_PARTS = [
  { key: "madrugada", label: "Madrugada", startHour: 0, endHour: 6 },
  { key: "manana", label: "Mañana", startHour: 6, endHour: 12 },
  { key: "tarde", label: "Tarde", startHour: 12, endHour: 19 },
  { key: "noche", label: "Noche", startHour: 19, endHour: 24 },
];

function dayPartFor(hour) {
  return DAY_PARTS.find((p) => hour >= p.startHour && hour < p.endHour) || DAY_PARTS[DAY_PARTS.length - 1];
}

// Entradas del tarro que cayeron HOY, de la más vieja a la más nueva (el
// tarro normal se lee más reciente primero; para una línea de tiempo del
// día tiene más sentido leerlo en el orden en que pasaron de verdad).
export function todayTimelineItems(jar, now = new Date()) {
  const todayStr = todayKey(now);
  const list = jar || [];
  const items = list
    .filter((j) => j && typeof j.id === "number" && todayKey(new Date(j.id)) === todayStr)
    .map((j) => {
      const d = new Date(j.id);
      const hour = d.getHours();
      const minute = d.getMinutes();
      return {
        id: j.id,
        label: j.label,
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        hour,
        part: dayPartFor(hour).key,
      };
    })
    .sort((a, b) => a.id - b.id);

  // El tarro completo solo guarda las últimas 12 acciones EN TOTAL (no 12
  // por día) — en un día muy activo, algo de temprano en la mañana puede
  // ya no estar ahí. `capped` avisa esto, mismo principio que
  // weekAchievements() de weeklyInsights.js: nunca subestimar sin decirlo.
  const capped = list.length >= 12 && items.length === list.length;

  return { items, capped };
}

// Agrupa los items de hoy por momento del día, en el orden Madrugada →
// Mañana → Tarde → Noche, para pintarlos como bloques en la línea de
// tiempo. Incluye los momentos del día aunque no tengan nada (el
// componente decide si los oculta cuando están vacíos).
export function groupByDayPart(items) {
  return DAY_PARTS.map((part) => ({
    ...part,
    items: (items || []).filter((i) => i.part === part.key),
  }));
}
