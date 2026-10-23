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

// El contenido traducible de cada situación (label/linkLabel/fallbackResponses,
// lo que ve la paciente) vive en los diccionarios de i18n, bajo
// companionSituationContent[id] — este archivo solo guarda lo estructural
// (linkRef, y promptContext, que es instrucción PARA la IA y se queda
// siempre en español a propósito, igual en los 4 idiomas: ver nota en
// api/companion-response.js sobre por qué el prompt interno no se traduce).
export const SITUATIONS = [
  {
    id: "no-puedo-empezar",
    linkRef: "desglosador",
    promptContext:
      "La persona siente que no puede empezar una tarea — está en lo que se " +
      "conoce como parálisis de tarea por TDAH. No es flojera: el cerebro " +
      "necesita que la tarea se sienta mucho más chica antes de poder arrancar.",
  },
  {
    id: "cabeza-llena",
    linkRef: "burbuja",
    promptContext:
      "La persona siente la cabeza llena y no puede pensar con claridad porque " +
      "todo pide su atención al mismo tiempo — es sobrecarga ejecutiva, típica " +
      "del TDAH, no falta de esfuerzo.",
  },
  {
    id: "ceguera-tiempo",
    linkRef: "auditor",
    promptContext:
      "La persona perdió la noción de cuánto tiempo lleva haciendo algo — es " +
      "ceguera del tiempo, un fenómeno real y común en TDAH donde el reloj " +
      "interno no avisa igual que en otras personas.",
  },
  {
    id: "impulso",
    linkRef: "freno",
    promptContext:
      "La persona tuvo un impulso que no quiere seguir y se dio cuenta antes de " +
      "actuar — quiere sostener la pausa entre sentir el impulso y decidir qué " +
      "hacer, sin juzgarse por haberlo sentido.",
  },
  {
    id: "autocritica",
    linkRef: "reestructuracion",
    promptContext:
      "La persona se siente mal consigo misma por un error que cometió o una " +
      "crítica que recibió. La reacción emocional se siente más grande de lo " +
      "que el momento en realidad fue — sensibilidad al rechazo, algo común en " +
      "TDAH — y no es que esté exagerando.",
  },
  {
    id: "varias-tareas",
    linkRef: "desglosador",
    promptContext:
      "La persona tiene más de dos tareas pendientes al mismo tiempo y se " +
      "siente abrumada sosteniéndolas todas en la cabeza a la vez — necesita " +
      "permiso para elegir solo una ahora y dejar que las demás esperen " +
      "anotadas en algún lado.",
  },
];

// Crisis: deliberadamente separada de SITUATIONS (nunca se mezcla con el
// menú normal), nunca pasa por la IA, y con un mensaje fijo que NO continúa
// la conversación — solo da recursos reales. Números verificados el 16 de
// octubre de 2026: Línea de la Vida (CONADIC, gobierno federal) y SAPTEL,
// ambas líneas nacionales, gratuitas y disponibles las 24 horas en México.
// El texto (label/message) vive en los diccionarios de i18n, bajo crisis.* —
// ver nota pendiente para la usuaria sobre cómo tratar los números de
// emergencia mexicanos cuando la app está en inglés/francés/portugués
// (quedó un borrador razonable por idioma, a revisar con ella).
export const CRISIS = { id: "crisis" };

export function getSituation(situationId) {
  return SITUATIONS.find((s) => s.id === situationId) || null;
}

// Elige la siguiente respuesta de apoyo FIJA de una situación (usada solo
// como respaldo cuando la IA no está disponible), rotando sin repetir la
// misma dos veces seguidas — puro y determinístico (no usa random()), para
// que sea fácil de probar. Recibe `total` (cuántas respuestas fijas hay)
// en vez de leerlo de SITUATIONS, porque fallbackResponses ahora vive en
// los diccionarios de i18n (companionSituationContent[id].fallbackResponses),
// no en este archivo.
export function nextResponseIndex(total, previousIndex) {
  if (!total || total <= 1) return 0;
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
