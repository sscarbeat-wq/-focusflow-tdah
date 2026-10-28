// "Rutinas visuales guiadas" — Módulo 5 de ANRO TDAH 2.0 (8 de noviembre de
// 2026). El único de los 5 módulos del plan que no tenía ninguna pieza
// reutilizable en la app (ver claude/anro-tdah-2.0-plan-de-accion.md) —
// nada aquí envuelve un servicio existente, pero sí sigue exactamente el
// mismo patrón de lógica pura que ya usan streak.js, oneThing.js y
// choosePick.js: sin DOM, sin efectos secundarios, fácil de probar con
// Node, y pensado para guardarse como una llave más dentro del mismo JSON
// de progreso (ver la decisión de arquitectura del plan — nunca se migró a
// tablas relacionales).
//
// Una "rutina" es una lista corta y ordenada de pasos con su propio ícono
// (emoji, mismo patrón visual que ya usa la mascota y el resto de la app —
// cero dependencias nuevas de íconos), pensada para caminarse UN PASO A LA
// VEZ en modo guiado (inspirado en las rutinas visuales de Tiimo) — nunca
// se ve la lista completa durante una sesión activa, solo el paso de
// ahorita, para no abrumar.
//
// state: {
//   templates: [{ id, name, icon, steps: [{ id, text, icon, min }] }],
//   session: null | { templateId, stepIndex, startedAt },
//   completions: [{ id, templateId, templateName, completedAt }],
// }
export const DEFAULT_ROUTINES = { templates: [], session: null, completions: [] };

// Topes defensivos — mismo espíritu que steps.length < 5 en el desglosador:
// una rutina con demasiados pasos deja de ser "rápida de seguir" y una
// lista con demasiadas rutinas deja de ser "fácil de elegir".
export const MAX_ROUTINE_TEMPLATES = 8;
export const MAX_STEPS_PER_ROUTINE = 10;

function clean(state) {
  return { ...DEFAULT_ROUTINES, ...(state || {}) };
}

function newId() {
  return Date.now() + Math.random().toString(36).slice(2, 7);
}

// --- Plantillas (crear/editar rutinas, fuera de una sesión activa) ---

export function addRoutineTemplate(state, { name, icon } = {}) {
  const s = clean(state);
  const cleanName = String(name || "").trim().slice(0, 60);
  if (!cleanName || s.templates.length >= MAX_ROUTINE_TEMPLATES) return s;
  const template = { id: newId(), name: cleanName, icon: icon || "✅", steps: [] };
  return { ...s, templates: [...s.templates, template] };
}

export function removeRoutineTemplate(state, templateId) {
  const s = clean(state);
  // Si se borra la rutina que está corriendo ahora mismo, también se sale
  // de la sesión — nunca se deja una sesión activa apuntando a una rutina
  // que ya no existe.
  const session = s.session && s.session.templateId === templateId ? null : s.session;
  return { ...s, templates: s.templates.filter((r) => r.id !== templateId), session };
}

export function renameRoutineTemplate(state, templateId, { name, icon } = {}) {
  const s = clean(state);
  return {
    ...s,
    templates: s.templates.map((r) => {
      if (r.id !== templateId) return r;
      const cleanName = name !== undefined ? String(name || "").trim().slice(0, 60) : r.name;
      return { ...r, name: cleanName || r.name, icon: icon || r.icon };
    }),
  };
}

export function addRoutineStep(state, templateId, { text, icon, min } = {}) {
  const s = clean(state);
  const cleanText = String(text || "").trim().slice(0, 120);
  if (!cleanText) return s;
  const cleanMin = Number.isFinite(Number(min)) && Number(min) > 0 ? Math.round(Number(min)) : null;
  return {
    ...s,
    templates: s.templates.map((r) => {
      if (r.id !== templateId || r.steps.length >= MAX_STEPS_PER_ROUTINE) return r;
      const step = { id: newId(), text: cleanText, icon: icon || "▫️", min: cleanMin };
      return { ...r, steps: [...r.steps, step] };
    }),
  };
}

export function removeRoutineStep(state, templateId, stepId) {
  const s = clean(state);
  return {
    ...s,
    templates: s.templates.map((r) =>
      r.id === templateId ? { ...r, steps: r.steps.filter((st) => st.id !== stepId) } : r
    ),
  };
}

// Reordena un paso dentro de su rutina (subir/bajar) — el orden es lo que
// define en qué secuencia se recorre en modo guiado, así que poder
// ajustarlo sin borrar y volver a agregar importa para una rutina real
// (ej. "cepillarme los dientes" antes que "lavarme la cara").
export function moveRoutineStep(state, templateId, stepId, direction) {
  const s = clean(state);
  return {
    ...s,
    templates: s.templates.map((r) => {
      if (r.id !== templateId) return r;
      const idx = r.steps.findIndex((st) => st.id === stepId);
      const targetIdx = idx + (direction === "up" ? -1 : 1);
      if (idx < 0 || targetIdx < 0 || targetIdx >= r.steps.length) return r;
      const steps = [...r.steps];
      [steps[idx], steps[targetIdx]] = [steps[targetIdx], steps[idx]];
      return { ...r, steps };
    }),
  };
}

// --- Sesión guiada (caminar la rutina un paso a la vez) ---

export function startRoutineSession(state, templateId, now = new Date()) {
  const s = clean(state);
  const template = s.templates.find((r) => r.id === templateId);
  if (!template || template.steps.length === 0) return s;
  return { ...s, session: { templateId, stepIndex: 0, startedAt: now.toISOString() } };
}

// Avanza al siguiente paso. Si el paso que se acaba de marcar era el
// último, la sesión se termina sola y queda un registro en "completions"
// (para poder mostrar, por ejemplo, "completaste tu rutina de la mañana
// hoy") — quien llama decide si otorga XP usando el flag `completed` que
// regresa, en vez de que este archivo sepa nada de XP (mismo principio que
// oneThing.js: la lógica pura nunca decide la recompensa, solo el estado).
export function advanceRoutineSession(state, now = new Date()) {
  const s = clean(state);
  if (!s.session) return { state: s, completed: false };
  const template = s.templates.find((r) => r.id === s.session.templateId);
  if (!template) return { state: { ...s, session: null }, completed: false };

  const nextIndex = s.session.stepIndex + 1;
  if (nextIndex >= template.steps.length) {
    const entry = { id: newId(), templateId: template.id, templateName: template.name, completedAt: now.toISOString() };
    return {
      state: { ...s, session: null, completions: [entry, ...s.completions].slice(0, 30) },
      completed: true,
    };
  }
  return { state: { ...s, session: { ...s.session, stepIndex: nextIndex } }, completed: false };
}

// Salir de una rutina a medio camino no es un fracaso — mismo principio
// que "cambiar de tarea" en oneThing.js: nunca se registra como abandono,
// solo se limpia la sesión.
export function exitRoutineSession(state) {
  const s = clean(state);
  return { ...s, session: null };
}

// El paso actual listo para renderizar (o null si no hay sesión activa, o
// si la rutina que estaba corriendo ya no existe) — centraliza esta
// búsqueda para que el componente no tenga que repetirla.
export function currentRoutineStep(state) {
  const s = clean(state);
  if (!s.session) return null;
  const template = s.templates.find((r) => r.id === s.session.templateId);
  if (!template) return null;
  const step = template.steps[s.session.stepIndex];
  if (!step) return null;
  return {
    template,
    step,
    stepIndex: s.session.stepIndex,
    totalSteps: template.steps.length,
    isLastStep: s.session.stepIndex === template.steps.length - 1,
  };
}

// Cuántas rutinas (de cualquier tipo) se completaron HOY — mismo criterio
// de "mismo día local" que completedTodayCount() en oneThing.js.
export function completedRoutinesToday(state, now = new Date()) {
  const s = clean(state);
  const todayStr = now.toDateString();
  return s.completions.filter((c) => new Date(c.completedAt).toDateString() === todayStr).length;
}

// Rutinas que todavía NO se completaron hoy — para la vista "Hoy" (ver
// todayView.js, Módulo 1). Una plantilla sin pasos nunca cuenta como
// pendiente (no hay nada que caminar todavía todavía), mismo criterio
// defensivo que ya usa startRoutineSession.
export function pendingRoutineTemplates(state, now = new Date()) {
  const s = clean(state);
  const todayStr = now.toDateString();
  const completedTemplateIdsToday = new Set(
    s.completions.filter((c) => new Date(c.completedAt).toDateString() === todayStr).map((c) => c.templateId)
  );
  return s.templates.filter((r) => r.steps.length > 0 && !completedTemplateIdsToday.has(r.id));
}
