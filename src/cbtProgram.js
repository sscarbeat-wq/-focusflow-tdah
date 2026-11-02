// Programa breve de TCC (TDAH) — rotación continua, nunca un "curso cerrado".
// Contenido psicoeducativo breve y genérico, pensado como punto de partida:
// la usuaria (psiquiatra, autora clínica de ANRO TDAH) puede revisarlo/
// ajustarlo con su propia voz antes de publicarlo a pacientes reales — igual
// que el resto del contenido clínico que ya existe en la app (freno de
// impulsividad, reestructuración de pensamientos, respiración guiada).
//
// 2 de noviembre de 2026 — a petición explícita de la doctora ("que se vayan
// añadiendo más cápsulas distintas, esas 7 serían repetitivas"), el programa
// dejó de ser un "Semana 1" fijo de 7 lecciones para convertirse en una lista
// que simplemente sigue creciendo con el tiempo (misma idea que ya usan las
// cápsulas científicas, pero sin repetirse hasta terminarse — una vez
// completada una lección nunca se repite dentro de esta lista). Agregar una
// tanda nueva es tan simple como seguir agregando entradas a `LESSONS` con el
// siguiente número de día y su contenido correspondiente en `cbtLessons[id]`
// dentro de los 4 diccionarios de i18n — `programStatus`/`markLessonComplete`
// abajo ya trabajan sobre `LESSONS.length`, así que no necesitan ningún
// cambio cuando la lista crece. Primera tanda (7 lecciones, "Semana 1"
// original): sobrecarga → evitación → ceguera del tiempo → pausa de
// impulsividad → regular la emoción → rutinas sostenibles → revisar sin
// autocrítica. Segunda tanda (7 lecciones nuevas, revisadas y aprobadas por
// la doctora el 2 de noviembre de 2026): perfeccionismo/parálisis →
// hiperfoco → transiciones entre tareas → sobreestimulación sensorial →
// miedo al fracaso → recuperar el hilo tras una interrupción →
// autocompasión. 3 de las 7 de la segunda tanda están marcadas en los
// comentarios de i18n como observación clínica más que hallazgo de
// investigación aislado en TDAH (perfeccionismo, miedo al fracaso,
// interrupciones) — mismo principio de honestidad sobre calidad de
// evidencia que ya usan las cápsulas científicas y la disforia de
// sensibilidad al rechazo del Compañero de apoyo.
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
  { id: "perfeccionismo-paralisis", day: 8, minutes: 3 },
  { id: "hiperfoco", day: 9, minutes: 3 },
  { id: "transiciones-tareas", day: 10, minutes: 3 },
  { id: "sobreestimulacion-sensorial", day: 11, minutes: 3 },
  { id: "miedo-al-fracaso", day: 12, minutes: 3 },
  { id: "recuperar-el-hilo", day: 13, minutes: 3 },
  { id: "autocompasion", day: 14, minutes: 3 },
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
