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

export const LESSONS = [
  {
    id: "sobrecarga",
    day: 1,
    title: "¿Qué es la sobrecarga ejecutiva?",
    minutes: 3,
    body: [
      'Cuando tienes TDAH, el cerebro no filtra la información de la misma forma que el de alguien sin TDAH — todo pide atención al mismo tiempo: el ruido de fondo, la notificación que llegó, la tarea pendiente, el pensamiento que se te atravesó. A eso se le llama sobrecarga ejecutiva, y no es falta de voluntad ni de disciplina: es que las funciones ejecutivas (las que organizan, priorizan y filtran) trabajan con menos margen.',
      'Reconocerla a tiempo evita que se convierta en parálisis total — ese momento en el que hay tanto que hacer que terminas sin hacer nada.',
    ],
    exercise:
      'Hoy, la próxima vez que sientas que "todo es demasiado", detente 10 segundos y nombra en voz baja (o por escrito) las 3 cosas que están pidiendo tu atención al mismo tiempo. Nombrarlas no las resuelve, pero le quita presión a tu cabeza.',
  },
  {
    id: "evitacion",
    day: 2,
    title: "Por qué cuesta tanto empezar",
    minutes: 3,
    body: [
      "Evitar una tarea importante no es flojera — con TDAH, el cerebro necesita más estímulo o urgencia real para activarse. Entre más grande o aburrida se vea una tarea, más cuesta arrancar, aunque sepas perfectamente que es importante.",
      "Por eso el desglosador de Senda no es solo una lista de pasos: el primer paso siempre debe ser tan pequeño que dé casi pena no hacerlo. Empezar genera su propio impulso.",
    ],
    exercise:
      'Toma una tarea que llevas evitando. Escribe el primer paso tan chiquito que puedas hacerlo en menos de 2 minutos (ej. no "organizar el clóset", sino "sacar 5 prendas del clóset"). Hazlo ahora si puedes.',
  },
  {
    id: "ceguera-tiempo",
    day: 3,
    title: "La ceguera del tiempo",
    minutes: 3,
    body: [
      'Mucha gente con TDAH vive el tiempo en solo dos categorías: "ahora" y "no ahora" — por eso cuesta tanto sentir que algo que es "la próxima semana" en realidad empieza a importar ya. A esto se le conoce como ceguera del tiempo, y explica por qué una tarea se siente urgente de la nada, justo cuando ya casi no hay tiempo.',
      "No es un defecto de carácter — es que el reloj interno no avisa con la misma anticipación que el de otras personas.",
    ],
    exercise:
      "Elige algo que tengas que hacer esta semana. Ponle una alarma HOY, con el nombre de la tarea, para 2 días antes de la fecha límite real — no para el día mismo. Esa alarma de más tiempo es tu reloj interno pidiendo refuerzo.",
  },
  {
    id: "pausa-impulsividad",
    day: 4,
    title: "La pausa de 10 segundos",
    minutes: 3,
    body: [
      "La impulsividad en el TDAH no es \"actuar sin pensar\" en el sentido moral — es que el impulso llega y se ejecuta antes de que la parte reflexiva del cerebro alcance a opinar. La buena noticia es que ese margen, aunque sea chiquito, se puede entrenar.",
      "Senda ya tiene una herramienta para esto — el freno de impulsividad — pensada justo para insertar una pausa real antes de actuar.",
    ],
    exercise:
      "La próxima vez que sientas el impulso de mandar un mensaje, comprar algo o reaccionar fuerte, usa el freno de impulsividad de Senda antes. Si no lo tienes a la mano, cuenta hasta 10 respirando lento — es el mismo principio.",
  },
  {
    id: "regular-emocion",
    day: 5,
    title: "Regular la emoción antes de la tarea",
    minutes: 3,
    body: [
      "Antes de poder concentrarte en una tarea, muchas veces hay que bajarle a la emoción que trae encima — frustración por no haber empezado antes, ansiedad por lo que falta, vergüenza por sentir que \"debería poder sola\". Intentar concentrarte sin atender esa emoción primero suele fallar, porque el cerebro sigue ocupado con lo emocional.",
      "Por eso el ejercicio de respiración guiada de Senda no es un extra — es, muchas veces, el paso cero antes de cualquier tarea.",
    ],
    exercise:
      'Antes de tu próxima sesión de Modo Enfoque, dedica 1 minuto a la respiración guiada de Senda ("Burbuja de enfoque"), aunque sientas que "no tienes tiempo". Nota si después te cuesta menos empezar.',
  },
  {
    id: "rutinas-sostenibles",
    day: 6,
    title: "Construir rutinas que sí se sostienen",
    minutes: 3,
    body: [
      "Las rutinas rígidas (despertar a las 6:00 en punto, todo en el mismo orden siempre) suelen fallar rápido en TDAH, porque un solo día distinto las rompe por completo y se siente como un fracaso. Las rutinas que sí duran son flexibles por diseño: tienen un orden general, no horarios exactos, y permiten saltarse un paso sin que se caiga toda la estructura.",
      "Tu racha en Senda funciona así a propósito — lo que cuenta es volver, no ser perfecta.",
    ],
    exercise:
      'Elige UNA rutina tuya que se haya roto varias veces. Reescríbela quitándole un horario exacto (cámbialo por "en la mañana" o "antes de dormir") y quitándole un paso que no sea esencial.',
  },
  {
    id: "revisar-sin-autocritica",
    day: 7,
    title: "Revisar la semana sin autocrítica",
    minutes: 3,
    body: [
      "Cerrar la semana juzgándote por lo que no lograste casi nunca ayuda a hacer más la próxima — generalmente solo suma vergüenza, y la vergüenza no es combustible sostenible. La revisión que sí funciona es descriptiva, no evaluativa: ver qué pasó, sin ponerle una calificación moral.",
      "Tus Insights semanales en Senda están diseñados para esto — muestran patrones reales, nunca una \"nota\" de qué tan bien hiciste la semana.",
    ],
    exercise:
      'Abre tus Insights semanales y léelos como si describieras el clima, no como una boleta de calificaciones. Elige UNA cosa que notaste, sin la palabra "debería" en la frase.',
  },
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
