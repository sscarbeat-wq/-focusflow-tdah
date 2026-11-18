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
//
// 3 de noviembre de 2026 — a petición explícita de la doctora ("quiero que
// cuando se acaben se muestren nuevas cápsulas"), esta lista queda abierta a
// crecer con el tiempo, igual que ya se hizo con el programa de TCC
// (cbtProgram.js): como capsuleIndexForKey() ya calcula el índice con
// `SCIENCE_CAPSULES.length`, simplemente agregar más entradas aquí (con su
// contenido correspondiente en scienceCapsuleContent[id] en los 4 i18n) hace
// que el ciclo de rotación sea más largo antes de repetirse — quien ya vio
// las primeras 15 empieza a ver cápsulas nuevas en los días siguientes, en
// vez de repetir desde el día 1. Primera tanda (15 cápsulas originales):
// genética → ejercicio → medicación y mortalidad → sueño → mindfulness →
// perimenopausia → redes sociales → cuerpo doble → comorbilidad con
// ansiedad/depresión → disforia de sensibilidad al rechazo → omega-3 →
// mujeres y diagnóstico tardío → "no es falta de voluntad" → prevalencia en
// adultos → hiperfoco. Segunda tanda (7 cápsulas nuevas, revisadas y
// aprobadas por la doctora el 3 de noviembre de 2026): cafeína (no es
// tratamiento) → accidentes de tránsito → riesgo cardiovascular de
// estimulantes a largo plazo → neurofeedback (evidencia floja) → brecha
// económica de un TDAH no tratado → TDAH y adicciones → coaching de TDAH
// (evidencia floja). La cápsula de riesgo cardiovascular es contenido
// clínicamente sensible (podría preocupar a alguien o hacer que suspenda su
// medicación sin consultar) — fue marcada aparte para revisión y aprobada
// con ese encuadre explícito.
//
// 17 de noviembre de 2026 ("quiero que sean incluso más de 22 notas sobre
// tdah que no se repitan, y si quiero mejores imagenes"): tercera tanda (10
// cápsulas nuevas, todas investigadas con fuentes reales — ver i18n para
// title/text/source completos): funciones ejecutivas (no solo atención) →
// noradrenalina y corteza prefrontal → maduración cortical tardía (Shaw et
// al., neuroimagen) → TDAH y CI (no están relacionados) → medicación y
// menor riesgo de repetir un episodio de mal uso de sustancias →
// no-estimulantes como alternativa → percepción del tiempo ("ceguera al
// tiempo") → desregulación emocional → dietas de eliminación y colorantes
// (evidencia mixta) → impulsividad financiera. Cada cápsula ahora también
// trae `diagram` (qué ilustración de scienceDiagrams.jsx usar) y `evidence`
// (nivel honesto de evidencia, traducido en t.scienceCapsule.evidenceLabels
// — ver ScienceCapsulePanel.jsx). El campo `tldr` ("idea clave") vive junto
// al resto del contenido en i18n, no aquí.
export const SCIENCE_CAPSULES = [
  { id: "herencia-genetica", diagram: "dna-helix", evidence: "strong" },
  { id: "ejercicio-control-inhibitorio", diagram: "running-figure", evidence: "moderate" },
  { id: "medicacion-mortalidad", diagram: "pill-balance", evidence: "strong" },
  { id: "sueno-tdah", diagram: "moon-sleep", evidence: "moderate" },
  { id: "mindfulness-evidencia", diagram: "breath-wave", evidence: "strong" },
  { id: "perimenopausia", diagram: "cycle-ring", evidence: "single" },
  { id: "redes-sociales-atencion", diagram: "phone-wave", evidence: "moderate" },
  { id: "body-doubling-ojo-con-la-evidencia", diagram: "puzzle-mind", evidence: "weak" },
  { id: "comorbilidad-ansiedad-depresion", diagram: "puzzle-mind", evidence: "moderate" },
  { id: "disforia-rechazo-honestidad", diagram: "puzzle-mind", evidence: "weak" },
  { id: "omega-3-modesto", diagram: "pill-balance", evidence: "mixed" },
  { id: "tdah-mujeres-diagnostico-tardio", diagram: "puzzle-mind", evidence: "single" },
  { id: "tdah-no-es-falta-de-voluntad", diagram: "brain-dopamine", evidence: "consensus" },
  { id: "tdah-adultos-prevalencia", diagram: "puzzle-mind", evidence: "strong" },
  { id: "hiperfoco-fortaleza", diagram: "brain-dopamine", evidence: "weak" },
  { id: "cafeina-no-tratamiento", diagram: "pill-balance", evidence: "moderate" },
  { id: "accidentes-transito", diagram: "alert-sign", evidence: "strong" },
  { id: "estimulantes-riesgo-cardiovascular", diagram: "heart-pulse", evidence: "moderate" },
  { id: "neurofeedback-evidencia", diagram: "brain-wave", evidence: "strong" },
  { id: "tdah-brecha-economica", diagram: "coin-scale", evidence: "single" },
  { id: "tdah-adicciones", diagram: "brain-dopamine", evidence: "strong" },
  { id: "coaching-tdah-evidencia", diagram: "puzzle-mind", evidence: "weak" },
  { id: "funcion-ejecutiva-no-solo-atencion", diagram: "puzzle-mind", evidence: "consensus" },
  { id: "noradrenalina-corteza-prefrontal", diagram: "brain-norepinephrine", evidence: "consensus" },
  { id: "maduracion-cortical-tardia", diagram: "brain-timeline", evidence: "strong" },
  { id: "tdah-no-es-cuestion-de-inteligencia", diagram: "puzzle-mind", evidence: "moderate" },
  { id: "medicacion-reduce-riesgo-adicciones", diagram: "pill-balance", evidence: "moderate" },
  { id: "no-estimulantes-alternativa", diagram: "pill-balance", evidence: "moderate" },
  { id: "percepcion-del-tiempo", diagram: "clock-blur", evidence: "moderate" },
  { id: "desregulacion-emocional", diagram: "puzzle-mind", evidence: "strong" },
  { id: "dietas-eliminacion-colorantes", diagram: "food-plate", evidence: "mixed" },
  { id: "impulsividad-financiera", diagram: "coin-scale", evidence: "moderate" },
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
