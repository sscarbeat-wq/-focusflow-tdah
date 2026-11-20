// Prácticas breves de atención plena guiada — ver justificación clínica
// completa más abajo. Generado/leído en el dispositivo, sin IA y sin ningún
// costo ni dependencia nueva — mismo principio que la Burbuja de enfoque
// (respiración guiada). El componente visual solo avisa cuando se completa
// una práctica (para que se otorgue XP), nunca guarda ningún dato nuevo.
//
// El metaanálisis de red de 113 ensayos publicado en The Lancet Psychiatry
// (2025), que comparó intervenciones farmacológicas, psicológicas y
// neuroestimulatorias para TDAH en adultos, encontró que mindfulness fue la
// única intervención psicológica con beneficio tanto en síntomas centrales
// (evaluación clínica) como en velocidad de procesamiento a las 12 semanas
// — por encima de TCC sola, remediación cognitiva o psicoeducación sola en
// ese punto. Los dos ensayos de TCC digital con mejor evidencia encontrados
// en esa misma investigación (MyADHD y attexis) también incluyen un módulo
// explícito de "atención consciente" dentro de su secuencia.
//
// 20 de noviembre de 2026 ("puedes... añadir otros ejercicios de
// mindfulness"): lo que antes era un solo guion fijo (MINDFULNESS_STEPS) se
// volvió un MENÚ de ejercicios (MINDFULNESS_PROGRAMS), cada uno con su
// propia lista de pasos y duración — misma estructura de siempre (id +
// segundos), solo que ahora agrupada por programa. El texto guiado de cada
// paso vive en los diccionarios de i18n, bajo mindfulnessSteps[programId]
// [stepId] — este archivo solo guarda el orden y la duración de cada paso,
// que es estructural y no se traduce.
export const MINDFULNESS_PROGRAMS = [
  {
    id: "clasica",
    steps: [
      { id: "llegar", seconds: 25 },
      { id: "cuerpo", seconds: 35 },
      { id: "respiracion", seconds: 40 },
      { id: "mente", seconds: 45 },
      { id: "cierre", seconds: 20 },
    ],
  },
  {
    id: "rapida",
    steps: [
      { id: "llegar", seconds: 15 },
      { id: "respiracion", seconds: 30 },
      { id: "cierre", seconds: 15 },
    ],
  },
  {
    id: "escaneo",
    steps: [
      { id: "llegar", seconds: 15 },
      { id: "piesPiernas", seconds: 30 },
      { id: "torsoManos", seconds: 30 },
      { id: "hombrosCuello", seconds: 30 },
      { id: "caraCabeza", seconds: 30 },
      { id: "cuerpoCompleto", seconds: 30 },
      { id: "cierre", seconds: 15 },
    ],
  },
  {
    // Respiración 4-7-8: inhalar 4s, sostener 7s, exhalar 8s, repetido 4
    // veces — los pasos "inhala"/"sostiene"/"exhala" se repiten a propósito
    // (reutilizan el mismo texto cada vuelta, como en una respiración real),
    // el motor de pasos ya soporta ids repetidos sin ningún cambio.
    id: "respiracion478",
    steps: [
      { id: "intro", seconds: 15 },
      { id: "inhala", seconds: 4 },
      { id: "sostiene", seconds: 7 },
      { id: "exhala", seconds: 8 },
      { id: "inhala", seconds: 4 },
      { id: "sostiene", seconds: 7 },
      { id: "exhala", seconds: 8 },
      { id: "inhala", seconds: 4 },
      { id: "sostiene", seconds: 7 },
      { id: "exhala", seconds: 8 },
      { id: "inhala", seconds: 4 },
      { id: "sostiene", seconds: 7 },
      { id: "exhala", seconds: 8 },
      { id: "cierre", seconds: 15 },
    ],
  },
  {
    id: "dormir",
    steps: [
      { id: "llegar", seconds: 30 },
      { id: "cuerpo", seconds: 45 },
      { id: "respiracion", seconds: 45 },
      { id: "soltarDia", seconds: 45 },
      { id: "cuerpoPesado", seconds: 45 },
      { id: "cierre", seconds: 30 },
    ],
  },
];

export function programTotalSeconds(program) {
  return program.steps.reduce((sum, s) => sum + s.seconds, 0);
}

// Dado un programa y cuántos segundos han pasado desde que empezó, regresa
// el índice del paso que debe mostrarse ahora mismo (null si ya terminaron
// todos los pasos de ESE programa).
export function stepIndexAt(program, elapsedSeconds) {
  let acc = 0;
  for (let i = 0; i < program.steps.length; i++) {
    acc += program.steps[i].seconds;
    if (elapsedSeconds < acc) return i;
  }
  return null;
}

export function isFinished(program, elapsedSeconds) {
  return elapsedSeconds >= programTotalSeconds(program);
}

// Segundos restantes dentro del paso actual de ESE programa (para mostrar
// una cuenta regresiva por paso, no solo el total transcurrido).
export function secondsLeftInStep(program, elapsedSeconds) {
  let acc = 0;
  for (let i = 0; i < program.steps.length; i++) {
    const stepEnd = acc + program.steps[i].seconds;
    if (elapsedSeconds < stepEnd) return stepEnd - elapsedSeconds;
    acc = stepEnd;
  }
  return 0;
}
