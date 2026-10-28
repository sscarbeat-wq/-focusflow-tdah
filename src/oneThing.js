// "Solo una cosa" — un lugar minimalista para enfocarse en UNA sola tarea a
// la vez, sin la lista completa de pendientes a la vista (que para muchas
// personas con TDAH es justo lo que paraliza antes de empezar: "tengo 12
// cosas por hacer" bloquea más que ayuda). No duplica el desglosador ni el
// Modo Enfoque — OneThingPanel.jsx envuelve a los dos; este archivo solo
// lleva el estado puro de "qué tarea está activa ahora" y "cuántas se han
// terminado así hoy", exactamente con el mismo patrón que streak.js y
// choosePick.js (funciones puras, sin DOM, fáciles de probar con Node).

// current: null | { id, text, stepId, startedAt } — stepId no-nulo cuando la
// tarea activa viene de un paso ya existente del desglosador (ver
// FocusFlowTDAH.jsx: steps), para no duplicar el XP al terminarla (se marca
// el paso como hecho, que ya otorga su propio XP) en vez de otorgar XP
// aparte.
// history: [{ id, text, completedAt }] — solo tareas tecleadas a mano
// (stepId null) que se terminaron aquí; limitado a las últimas 30, nada más
// para poder mostrar "cuántas cosas completaste hoy con Solo una cosa".
export const DEFAULT_ONE_THING = { current: null, history: [] };

function clean(state) {
  return { ...DEFAULT_ONE_THING, ...(state || {}) };
}

// Empieza (o cambia a) una tarea activa. "Cambiar de tarea" en la UI usa
// esta misma función — cambiar de foco no es un fracaso, así que nunca deja
// rastro en el historial de la tarea que se deja atrás, igual que "Elige
// por mí" en choosePick.js no castiga no usar el paso elegido.
export function startOneThing(state, text, stepId = null, now = new Date()) {
  const label = String(text || "").trim().slice(0, 200);
  if (!label) return clean(state);
  return {
    ...clean(state),
    current: { id: Date.now(), text: label, stepId: stepId || null, startedAt: now.toISOString() },
  };
}

// Termina la tarea activa. Si venía de un paso del desglosador (stepId no
// nulo), quien llama debe además marcar ese paso como hecho por su cuenta
// (toggleStep) — aquí solo se limpia "current", sin tocar el historial, para
// no contar la misma tarea dos veces.
export function finishOneThing(state, now = new Date()) {
  const s = clean(state);
  if (!s.current) return s;
  if (s.current.stepId) {
    return { ...s, current: null };
  }
  const entry = { id: s.current.id, text: s.current.text, completedAt: now.toISOString() };
  return { current: null, history: [entry, ...s.history].slice(0, 30) };
}

// Salir sin terminar: limpia la tarea activa sin registrar nada, ni de
// terminada ni de abandonada.
export function exitOneThing(state) {
  return { ...clean(state), current: null };
}

// Cuántas tareas (tecleadas a mano) se completaron aquí HOY — mismo criterio
// de "mismo día local" que todayKey() en streak.js, pero sin esa dependencia
// para mantener este archivo mínimo.
export function completedTodayCount(state, now = new Date()) {
  const s = clean(state);
  const todayStr = now.toDateString();
  return s.history.filter((h) => new Date(h.completedAt).toDateString() === todayStr).length;
}
