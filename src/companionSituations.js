// Compañero de apoyo situacional — a diferencia del programa de TCC (contenido
// progresivo por semana) o las herramientas sueltas, esto da un mensaje breve
// de apoyo en el momento, elegido por la propia paciente entre un menú fijo
// de situaciones (nunca texto libre, a propósito, para acotar el riesgo
// clínico/legal de esta función), y enlaza directo a la herramienta de Senda
// que ya existe para esa situación. Respuestas 100% fijas, sin IA — primer
// borrador de Claude, pensado para que la usuaria (psiquiatra, autora
// clínica de Senda) las revise/ajuste con su propia voz antes de publicarlas
// a pacientes reales, igual que el resto del contenido clínico de la app.
//
// Set de situaciones elegido con la usuaria después de investigar qué
// reportan con más frecuencia personas con TDAH (ADDitude, Understood.org,
// literatura sobre "parálisis del TDAH"): parálisis de tarea, sobrecarga/
// parálisis mental, ceguera del tiempo, impulsividad, y sensibilidad al
// rechazo/autocrítica.

export const SITUATIONS = [
  {
    id: "no-puedo-empezar",
    label: "No puedo empezar",
    linkLabel: "Ir al desglosador",
    linkRef: "desglosador",
    responses: [
      "Que no puedas arrancar no es flojera — con TDAH el cerebro necesita que la tarea se sienta mucho más chica antes de poder empezar. No intentes atacarla completa.",
      "Arrancar es casi siempre la parte más difícil, no el resto de la tarea. Busca el paso más pequeño posible — uno que puedas hacer en menos de 2 minutos — y empieza solo por ahí.",
    ],
  },
  {
    id: "cabeza-llena",
    label: "Tengo la cabeza llena, no puedo pensar",
    linkLabel: "Ir a la burbuja de enfoque",
    linkRef: "burbuja",
    responses: [
      "Cuando todo pide atención al mismo tiempo, el cerebro se satura — no es que estés fallando, es sobrecarga ejecutiva. Antes de intentar resolver algo, baja la intensidad un momento.",
      "No hace falta resolver todo ahora mismo. Un minuto de respiración antes de seguir casi siempre le quita presión a la cabeza, aunque sientas que no tienes tiempo para pausar.",
    ],
  },
  {
    id: "ceguera-tiempo",
    label: "No sé cuánto tiempo llevo en esto",
    linkLabel: "Ir al auditor de tiempo",
    linkRef: "auditor",
    responses: [
      "La ceguera del tiempo es real en TDAH — el reloj interno no avisa igual que en otras personas. No es que no te importe, es que cuesta más sentirlo.",
      "Si perdiste la noción del tiempo, no te juzgues por eso — mejor ponle un número real enfrente la próxima vez, para que deje de ser una sensación y se vuelva un dato.",
    ],
  },
  {
    id: "impulso",
    label: "Tuve un impulso que no quiero seguir",
    linkLabel: "Ir al freno de impulsividad",
    linkRef: "freno",
    responses: [
      "Que el impulso haya llegado no significa que tengas que seguirlo. El margen entre sentirlo y actuar se puede entrenar, aunque sea chiquito.",
      "Bien hecho en darte cuenta antes de actuar — esa es la parte más difícil. Dale una pausa real antes de decidir qué hacer.",
    ],
  },
  {
    id: "autocritica",
    label: "Me siento mal conmigo misma por un error o una crítica",
    linkLabel: "Ir a reestructuración de pensamientos",
    linkRef: "reestructuracion",
    responses: [
      'Una crítica o un error no define lo que vales — con TDAH es común que la reacción emocional se sienta más grande de lo que el momento en realidad fue. Eso tiene nombre (sensibilidad al rechazo) y no es que estés exagerando.',
      'Antes de creerte al pie de la letra el pensamiento de "soy un desastre", vale la pena ponerlo a prueba — casi nunca resiste la evidencia real.',
    ],
  },
  {
    id: "varias-tareas",
    label: "Tengo más de dos tareas pendientes al mismo tiempo",
    linkLabel: "Ir al desglosador",
    linkRef: "desglosador",
    responses: [
      "Con TDAH, tener varias tareas pendientes a la vez puede sentirse como si todas gritaran al mismo tiempo — eso hace casi imposible elegir una. No se trata de resolverlas todas ahora: elige solo una para los próximos minutos y deja que las demás esperen anotadas en algún lado.",
      "Sostener varias tareas en la cabeza al mismo tiempo gasta energía antes de siquiera empezar una. Anótalas todas donde no se te vayan a olvidar, y elige nada más una para enfocarte ahora — el resto sigue ahí, no desaparece.",
    ],
  },
];

// Crisis: deliberadamente separada de SITUATIONS (nunca se mezcla con el
// menú normal) y con un mensaje fijo que NO continúa la conversación — solo
// da recursos reales. Números verificados el 16 de octubre de 2026: Línea
// de la Vida (CONADIC, gobierno federal) y SAPTEL, ambas líneas nacionales,
// gratuitas y disponibles las 24 horas en México.
export const CRISIS = {
  id: "crisis",
  label: "Tengo pensamientos de hacerme daño",
  message:
    "Lo que describes es serio, y mereces ayuda de una persona real ahora mismo, no de una app. Si estás en peligro inmediato, llama al 911. También puedes marcar, gratis y las 24 horas en todo México: Línea de la Vida 800 911 2000, o SAPTEL 55 5259 8121. Si tienes un médico o terapeuta, contáctalo directamente también.",
};

export function getSituation(situationId) {
  return SITUATIONS.find((s) => s.id === situationId) || null;
}

// Elige la siguiente respuesta de una situación, rotando entre las
// disponibles sin repetir la misma dos veces seguidas (si hay más de una) —
// puro y determinístico (no usa random()), para que sea fácil de probar.
export function nextResponseIndex(situationId, previousIndex) {
  const situation = getSituation(situationId);
  if (!situation) return 0;
  const total = situation.responses.length;
  if (total <= 1) return 0;
  const prev = previousIndex == null ? -1 : previousIndex;
  return (((prev + 1) % total) + total) % total;
}
