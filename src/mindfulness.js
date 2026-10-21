// Práctica breve de atención plena guiada (mindfulness) — la pieza con más
// respaldo directo entre la evidencia reciente investigada sobre TDAH en
// adultos: en el metaanálisis de red de 113 ensayos publicado en The Lancet
// Psychiatry (2025) que comparó intervenciones farmacológicas, psicológicas
// y neuroestimulatorias, mindfulness fue la única intervención psicológica
// con beneficio tanto en síntomas centrales (evaluación clínica) como en
// velocidad de procesamiento a las 12 semanas — por encima de TCC sola,
// remediación cognitiva o psicoeducación sola en ese punto. Los dos ensayos
// de TCC digital con mejor evidencia encontrados en esa misma investigación
// (MyADHD y attexis) también incluyen un módulo explícito de "atención
// consciente" dentro de su secuencia.
//
// Guion fijo, sin IA — mismo principio que la Burbuja de enfoque
// (respiración guiada, ya existente en Senda): generado/leído en el
// dispositivo, sin ningún costo ni dependencia nueva, y sin guardar ningún
// dato nuevo (el componente visual solo avisa cuando se completa, para que
// se otorgue XP, igual que la respiración).
export const MINDFULNESS_STEPS = [
  {
    id: "llegar",
    seconds: 25,
    text: "Siéntate cómodo. No hace falta cerrar los ojos si no quieres — solo deja de hacer lo que estabas haciendo por un momento.",
  },
  {
    id: "cuerpo",
    seconds: 35,
    text: "Nota cómo se siente tu cuerpo ahora mismo, sin cambiar nada todavía. Los pies en el piso, la espalda apoyada.",
  },
  {
    id: "respiracion",
    seconds: 40,
    text: "Lleva tu atención a la respiración, sin forzarla. Solo nota el aire entrando y saliendo.",
  },
  {
    id: "mente",
    seconds: 45,
    text: "Es normal que la mente se vaya — con TDAH, más seguido. Cuando lo notes, regresa a la respiración, sin juzgarte por haberte ido.",
  },
  {
    id: "cierre",
    seconds: 20,
    text: "Antes de terminar, nota cómo te sientes ahora comparado con hace un momento. Lo que sea que notes está bien.",
  },
];

export const MINDFULNESS_TOTAL_SECONDS = MINDFULNESS_STEPS.reduce((sum, s) => sum + s.seconds, 0);

// Dado cuántos segundos han pasado desde que empezó la práctica, regresa el
// índice del paso que debe mostrarse ahora mismo (null si ya terminaron
// todos los pasos).
export function stepIndexAt(elapsedSeconds) {
  let acc = 0;
  for (let i = 0; i < MINDFULNESS_STEPS.length; i++) {
    acc += MINDFULNESS_STEPS[i].seconds;
    if (elapsedSeconds < acc) return i;
  }
  return null;
}

export function isFinished(elapsedSeconds) {
  return elapsedSeconds >= MINDFULNESS_TOTAL_SECONDS;
}

// Segundos restantes dentro del paso actual (para mostrar una cuenta
// regresiva por paso, no solo el total transcurrido).
export function secondsLeftInStep(elapsedSeconds) {
  let acc = 0;
  for (let i = 0; i < MINDFULNESS_STEPS.length; i++) {
    const stepEnd = acc + MINDFULNESS_STEPS[i].seconds;
    if (elapsedSeconds < stepEnd) return stepEnd - elapsedSeconds;
    acc = stepEnd;
  }
  return 0;
}
