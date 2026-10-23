// Programa breve de TCC (TDAH) — "Semana 1". Contenido psicoeducativo breve
// y genérico, pensado como punto de partida: la usuaria (psiquiatra, autora
// clínica de Senda) puede revisarlo/ajustarlo con su propia voz antes de
// publicarlo a pacientes reales — igual que el resto del contenido clínico
// que ya existe en la app (freno de impulsividad, reestructuración de
// pensamientos, respiración guiada).
//
// Entrega UNA lección como máximo por día (mismo principio que Inflow: un
// programa que se recorre poco a poco, no un libro para leer de un jalón) —
// reutiliza todayKey()/daysBetween() de streak.js, igual que moodLog.js,
// para decidir "ya pasó un día" con la fecha local del dispositivo.
import { todayKey, daysBetween } from "./streak.js";

// El contenido traducible de cada lección (title/body/exercise) vive en los
// diccionarios de i18n, bajo cbtLessons[id] — así los 4 idiomas están en un
// solo lugar por idioma, en vez de mezclados aquí. Este archivo solo guarda
// la estructura/orden del programa (id, día, minutos de lectura).
export const LESSONS = [
  { id: "sobrecarga", day: 1, minutes: 3 },
  { id: "evitacion", day: 2, minutes: 3 },
  { id: "ceguera-tiempo", day: 3, minutes: 3 },
  { id: "pausa-impulsividad", day: 4, minutes: 3 },
  { id: "regular-emocion", day: 5, minutes: 3 },
  { id: "rutinas-sostenibles", day: 6, minutes: 3 },
  { id: "revisar-sin-autocritica", day: 7, minutes: 3 },
];

export const DEFAULT_CBT_PROGRAM = { completed: {} };

function completedCount(program) {
  return Object.keys((program || DEFAULT_CBT_PROGRAM).completed || {}).length;
}

// Estado completo del programa para esta persona en este momento: cuál es
// la siguiente lección, si ya puede tomarla hoy o tiene que esperar a
// mañana (si ya completó una lección hoy mismo), y si ya terminó todas.
export function programStatus(program, now = new Date()) {
  const p = { ...DEFAULT_CBT_PROGRAM, ...(program || {}) };
  const done = completedCount(p);
  const total = LESSONS.length;

  if (done >= total) {
    return { completedCount: done, total, finished: true, nextLesson: null, availableNow: false };
  }

  const nextLesson = LESSONS[done];

  if (done === 0) {
    return { completedCount: done, total, finished: false, nextLesson, availableNow: true };
  }

  const prevLesson = LESSONS[done - 1];
  const completedOnKey = p.completed[prevLesson.id];
  const availableNow = !completedOnKey || daysBetween(completedOnKey, todayKey(now)) >= 1;

  return { completedCount: done, total, finished: false, nextLesson, availableNow };
}

// Marca una lección como completada HOY. Solo acepta completar la lección
// que de verdad toca ahora mismo (defensivo: ignora cualquier otro id, por
// si el componente visual llegara a desincronizarse) y solo si ya está
// disponible — nunca permite "adelantar" el programa ni duplicar un día.
export function markLessonComplete(program, lessonId, now = new Date()) {
  const p = { ...DEFAULT_CBT_PROGRAM, ...(program || {}) };
  const status = programStatus(p, now);
  if (status.finished || !status.availableNow || !status.nextLesson || status.nextLesson.id !== lessonId) {
    return p;
  }
  return { completed: { ...p.completed, [lessonId]: todayKey(now) } };
}
