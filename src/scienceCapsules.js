// Cápsulas informativas breves sobre TDAH adulto, basadas en evidencia real —
// sin IA, contenido fijo investigado y redactado por Claude (misma disciplina
// que el resto del contenido clínico de Senda: nunca inventar un dato ni una
// fuente). Una cápsula distinta por día, rotando de forma determinista con la
// fecha local del dispositivo — mismo patrón de "drip" que ya usa el
// programa de TCC, pero aquí es solo lectura (no hay progreso que guardar,
// por eso no se sincroniza con Supabase).
//
// La tarjeta de perimenopausia (antes un componente aparte,
// PerimenopauseCard.jsx) se fusionó aquí como una cápsula más, a petición
// explícita de la usuaria — ver la cápsula "perimenopausia" abajo.
//
// Cada cápsula es honesta sobre la fuerza real de su evidencia: algunas son
// metaanálisis grandes, otras son un solo estudio o una encuesta sin grupo
// control, y eso se dice explícitamente en vez de presentarlas todas con el
// mismo peso — mismo estándar que ya se aplicó al cuestionar el marketing de
// "validado científicamente" de Inflow en el análisis competitivo.
// El contenido traducible de cada cápsula (title/text/source) vive en los
// diccionarios de i18n, bajo scienceCapsuleContent[id] — así los 4 idiomas
// están en un solo lugar por idioma. Este archivo solo guarda el orden/id
// para la rotación determinista por fecha.
export const SCIENCE_CAPSULES = [
  { id: "herencia-genetica" },
  { id: "ejercicio-control-inhibitorio" },
  { id: "medicacion-mortalidad" },
  { id: "sueno-tdah" },
  { id: "mindfulness-evidencia" },
  { id: "perimenopausia" },
  { id: "redes-sociales-atencion" },
  { id: "body-doubling-ojo-con-la-evidencia" },
  { id: "comorbilidad-ansiedad-depresion" },
  { id: "disforia-rechazo-honestidad" },
  { id: "omega-3-modesto" },
  { id: "tdah-mujeres-diagnostico-tardio" },
  { id: "tdah-no-es-falta-de-voluntad" },
  { id: "tdah-adultos-prevalencia" },
  { id: "hiperfoco-fortaleza" },
];

// Índice de "día" determinista a partir de una fecha YYYY-MM-DD local
// (reutiliza daysBetween de streak.js con una fecha de referencia fija, para
// no depender de epoch/UTC). No se guarda en ningún lado — se recalcula cada
// vez a partir de la fecha del dispositivo, igual para cualquiera que abra
// la app el mismo día.
const REFERENCE_DATE_KEY = "2026-01-01";

export function capsuleIndexForKey(todayKeyStr, daysBetweenFn) {
  const offset = daysBetweenFn(REFERENCE_DATE_KEY, todayKeyStr);
  const len = SCIENCE_CAPSULES.length;
  // Por si alguna fecha del dispositivo quedara antes de la referencia.
  return ((offset % len) + len) % len;
}

export function capsuleForKey(todayKeyStr, daysBetweenFn) {
  return SCIENCE_CAPSULES[capsuleIndexForKey(todayKeyStr, daysBetweenFn)];
}
