// Compañero de apoyo situacional — a diferencia del programa de TCC (contenido
// progresivo por semana) o las herramientas sueltas, esto da un mensaje breve
// de apoyo en el momento, elegido por la propia paciente entre un menú fijo
// de situaciones (nunca texto libre, a propósito, para acotar el riesgo
// clínico/legal de esta función), y enlaza directo a la herramienta de Senda
// que ya existe para esa situación.
//
// Las 5 situaciones normales usan IA (api/companion-response.js, gpt-4o-mini)
// para variar el mensaje cada vez — pero la IA nunca reacciona a texto libre
// de la paciente: el "tema" siempre es uno de estos 5 ids fijos, que ya
// aprobamos de antemano (promptContext abajo). fallbackResponses son textos
// 100% fijos, usados solo si la IA no responde (límite mensual alcanzado,
// error de red, etc.) para que la paciente nunca se quede sin apoyo.
//
// El botón de crisis (CRISIS, abajo) es la excepción: NUNCA pasa por la IA,
// bajo ninguna circunstancia — su mensaje es fijo y no continúa la
// conversación. api/companion-response.js además revisa cada respuesta de
// la IA con containsRiskLanguage() antes de mostrarla: si por cualquier
// motivo toca temas de autolesión/suicidio, el cliente muestra el mensaje
// fijo de crisis en su lugar, nunca el texto generado.
//
// Set de situaciones elegido con la usuaria después de investigar qué
// reportan con más frecuencia personas con TDAH (ADDitude, Understood.org,
// literatura sobre "parálisis del TDAH"): parálisis de tarea, sobrecarga/
// parálisis mental, ceguera del tiempo, impulsividad, sensibilidad al
// rechazo/autocrítica, y sostener varias tareas a la vez.

export const SITUATIONS = [
  {
    id: "no-puedo-empezar",
    label: "No puedo empezar",
    linkLabel: "Ir al desglosador",
    linkRef: "desglosador",
    promptContext:
      "La persona siente que no puede empezar una tarea — está en lo que se " +
      "conoce como parálisis de tarea por TDAH. No es flojera: el cerebro " +
      "necesita que la tarea se sienta mucho más chica antes de poder arrancar.",
    fallbackResponses: [
      "Que no puedas arrancar no es flojera — con TDAH el cerebro necesita que la tarea se sienta mucho más chica antes de poder empezar. No intentes atacarla completa.",
      "Arrancar es casi siempre la parte más difícil, no el resto de la tarea. Busca el paso más pequeño posible — uno que puedas hacer en menos de 2 minutos — y empieza solo por ahí.",
    ],
  },
  {
    id: "cabeza-llena",
    label: "Tengo la cabeza llena, no puedo pensar",
    linkLabel: "Ir a la burbuja de enfoque",
    linkRef: "burbuja",
    promptContext:
      "La persona siente la cabeza llena y no puede pensar con claridad porque " +
      "todo pide su atención al mismo tiempo — es sobrecarga ejecutiva, típica " +
      "del TDAH, no falta de esfuerzo.",
    fallbackResponses: [
      "Cuando todo pide atención al mismo tiempo, el cerebro se satura — no es que estés fallando, es sobrecarga ejecutiva. Antes de intentar resolver algo, baja la intensidad un momento.",
      "No hace falta resolver todo ahora mismo. Un minuto de respiración antes de seguir casi siempre le quita presión a la cabeza, aunque sientas que no tienes tiempo para pausar.",
    ],
  },
  {
    id: "ceguera-tiempo",
    label: "No sé cuánto tiempo llevo en esto",
    linkLabel: "Ir al auditor de tiempo",
    linkRef: "auditor",
    promptContext:
      "La persona perdió la noción de cuánto tiempo lleva haciendo algo — es " +
      "ceguera del tiempo, un fenómeno real y común en TDAH donde el reloj " +
      "interno no avisa igual que en otras personas.",
    fallbackResponses: [
      "La ceguera del tiempo es real en TDAH — el reloj interno no avisa igual que en otras personas. No es que no te importe, es que cuesta más sentirlo.",
      "Si perdiste la noción del tiempo, no te juzgues por eso — mejor ponle un número real enfrente la próxima vez, para que deje de ser una sensación y se vuelva un dato.",
    ],
  },
  {
    id: "impulso",
    label: "Tuve un impulso que no quiero seguir",
    linkLabel: "Ir al freno de impulsividad",
    linkRef: "freno",
    promptContext:
      "La persona tuvo un impulso que no quiere seguir y se dio cuenta antes de " +
      "actuar — quiere sostener la pausa entre sentir el impulso y decidir qué " +
      "hacer, sin juzgarse por haberlo sentido.",
    fallbackResponses: [
      "Que el impulso haya llegado no significa que tengas que seguirlo. El margen entre sentirlo y actuar se puede entrenar, aunque sea chiquito.",
      "Bien hecho en darte cuenta antes de actuar — esa es la parte más difícil. Dale una pausa real antes de decidir qué hacer.",
    ],
  },
  {
    id: "autocritica",
    label: "Me siento mal conmigo misma por un error o una crítica",
    linkLabel: "Ir a reestructuración de pensamientos",
    linkRef: "reestructuracion",
    promptContext:
      "La persona se siente mal consigo misma por un error que cometió o una " +
      "crítica que recibió. La reacción emocional se siente más grande de lo " +
      "que el momento en realidad fue — sensibilidad al rechazo, algo común en " +
      "TDAH — y no es que esté exagerando.",
    fallbackResponses: [
      'Una crítica o un error no define lo que vales — con TDAH es común que la reacción emocional se sienta más grande de lo que el momento en realidad fue. Eso tiene nombre (sensibilidad al rechazo) y no es que estés exagerando.',
      'Antes de creerte al pie de la letra el pensamiento de "soy un desastre", vale la pena ponerlo a prueba — casi nunca resiste la evidencia real.',
    ],
  },
  {
    id: "varias-tareas",
    label: "Tengo más de dos tareas pendientes al mismo tiempo",
    linkLabel: "Ir al desglosador",
    linkRef: "desglosador",
    promptContext:
      "La persona tiene más de dos tareas pendientes al mismo tiempo y se " +
      "siente abrumada sosteniéndolas todas en la cabeza a la vez — necesita " +
      "permiso para elegir solo una ahora y dejar que las demás esperen " +
      "anotadas en algún lado.",
    fallbackResponses: [
      "Con TDAH, tener varias tareas pendientes a la vez puede sentirse como si todas gritaran al mismo tiempo — eso hace casi imposible elegir una. No se trata de resolverlas todas ahora: elige solo una para los próximos minutos y deja que las demás esperen anotadas en algún lado.",
      "Sostener varias tareas en la cabeza al mismo tiempo gasta energía antes de siquiera empezar una. Anótalas todas donde no se te vayan a olvidar, y elige nada más una para enfocarte ahora — el resto sigue ahí, no desaparece.",
    ],
  },
];

// Crisis: deliberadamente separada de SITUATIONS (nunca se mezcla con el
// menú normal), nunca pasa por la IA, y con un mensaje fijo que NO continúa
// la conversación — solo da recursos reales. Números verificados el 16 de
// octubre de 2026: Línea de la Vida (CONADIC, gobierno federal) y SAPTEL,
// ambas líneas nacionales, gratuitas y disponibles las 24 horas en México.
export const CRISIS = {
  id: "crisis",
  label: "Tengo pensamientos de hacerme daño",
  message:
    "Lo que describes es serio, y mereces ayuda de una persona real ahora mismo, no de una app. Si estás en peligro inmediato, llama al 911. También puedes marcar, gratis y las 24 horas en todo México: Línea de la Vida 800 911 2000, o SAPTEL 55 5259 8121. Si tienes un médico o terapeuta, contáctalo directamente también.",
};

export function getSituation(situationId) {
  return SITUATIONS.find((s) => s.id === situationId) || null;
}

// Elige la siguiente respuesta de apoyo FIJA de una situación (usada solo
// como respaldo cuando la IA no está disponible), rotando sin repetir la
// misma dos veces seguidas — puro y determinístico (no usa random()), para
// que sea fácil de probar.
export function nextResponseIndex(situationId, previousIndex) {
  const situation = getSituation(situationId);
  if (!situation) return 0;
  const total = situation.fallbackResponses.length;
  if (total <= 1) return 0;
  const prev = previousIndex == null ? -1 : previousIndex;
  return (((prev + 1) % total) + total) % total;
}

// Palabras/frases que, si aparecen en una respuesta generada por IA, hacen
// que esa respuesta nunca se muestre — se trata como señal de crisis en su
// lugar (ver api/companion-response.js). Comparación sin acentos ni
// mayúsculas para que capture variantes comunes.
const RISK_KEYWORDS = [
  "suicid",
  "autolesion",
  "quitarme la vida",
  "terminar con mi vida",
  "acabar con mi vida",
  "no quiero vivir",
  "no vale la pena vivir",
  "hacerme dano",
  "lastimarme",
  "cortarme",
  "matarme",
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function containsRiskLanguage(text) {
  const normalized = normalize(text);
  return RISK_KEYWORDS.some((kw) => normalized.includes(normalize(kw)));
}
