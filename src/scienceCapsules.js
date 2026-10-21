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
export const SCIENCE_CAPSULES = [
  {
    id: "herencia-genetica",
    title: "TDAH y genética",
    text: "El TDAH es uno de los trastornos psiquiátricos con mayor carga genética conocida: estudios de gemelos estiman que la heredabilidad ronda el 70-80%. Esto no significa que esté \"escrito\" sin remedio — el ambiente y las estrategias de manejo sí hacen una diferencia real — pero ayuda a entender por qué el TDAH suele aparecer en varias generaciones de una misma familia.",
    source: "Estudios de gemelos, revisados en Faraone & Larsson, Molecular Psychiatry (2019) — cifra ampliamente replicada desde entonces.",
  },
  {
    id: "ejercicio-control-inhibitorio",
    title: "El ejercicio sí ayuda — pero no cualquiera por igual",
    text: "Un metaanálisis de 2025 con 14 estudios encontró que la actividad física mejora de forma medible el control inhibitorio (la capacidad de frenar un impulso) en adultos con TDAH. El ejercicio sostenido en el tiempo mostró más beneficio que una sola sesión aislada — la consistencia importa más que la intensidad de un día en particular.",
    source: "Metaanálisis, Journal of Global Health (2025) — 8 artículos, 14 estudios, ~372 participantes.",
  },
  {
    id: "medicacion-mortalidad",
    title: "Lo que un estudio sueco encontró sobre la medicación",
    text: "Un estudio con casi 150,000 personas en Suecia encontró que empezar tratamiento farmacológico para el TDAH se asoció con 25% menos muertes por causas no naturales (como accidentes) en los dos años siguientes al diagnóstico. Es un estudio observacional — no prueba causa y efecto al 100% — pero es uno de los más grandes hechos sobre el tema hasta ahora.",
    source: "Estudio poblacional sueco, Nature Mental Health (2024) — ~150,000 personas, seguimiento de 2 años.",
  },
  {
    id: "sueno-tdah",
    title: "El sueño y el TDAH van más conectados de lo que parece",
    text: "En un estudio con 3,691 adultos con TDAH en clínicas de los Países Bajos, casi dos de cada tres dieron positivo en un cribado de algún problema de sueño — los más comunes fueron el retraso de fase del sueño (acostarse tarde de forma crónica), el insomnio y el síndrome de piernas inquietas. Si duermes mal, vale la pena platicarlo en consulta — no es \"solo\" cansancio.",
    source: "Estudio en 46 clínicas de TDAH, Países Bajos, 2018-2020 — 3,691 adultos (cribado, no diagnóstico clínico confirmado).",
  },
  {
    id: "mindfulness-evidencia",
    title: "Por qué Senda tiene una práctica de atención plena",
    text: "Un metaanálisis en red de 113 ensayos clínicos encontró que, entre las intervenciones psicológicas para TDAH, mindfulness fue la única con beneficio tanto en síntomas centrales como en velocidad de procesamiento a las 12 semanas. Por eso la práctica guiada de Senda no es un añadido genérico de bienestar — tiene evidencia propia dentro del tratamiento de TDAH.",
    source: "Metaanálisis en red, The Lancet Psychiatry (2025) — 113 ensayos clínicos.",
  },
  {
    id: "perimenopausia",
    title: "TDAH y perimenopausia",
    text: "La relación va en los dos sentidos: los cambios hormonales de la perimenopausia pueden hacer que los síntomas de TDAH se sientan más fuertes, y en algunas mujeres un TDAH que nunca se había reconocido se vuelve mucho más notorio justo en esta etapa. Un estudio en Islandia con más de 5,000 mujeres encontró que, en quienes tienen TDAH, los síntomas de la perimenopausia suelen empezar antes (hasta 10 años) y se sienten con más intensidad. Es un solo estudio en una población distinta a la nuestra — tómalo como una pista a considerar, no como una regla general. Esto no es un diagnóstico: si notas cambios de ánimo, sueño o bochornos distintos a lo de siempre, vale la pena platicarlo con tu médico o médica.",
    source: "Cohorte SAGA, European Psychiatry (2025) — 5,392 mujeres, Islandia.",
  },
  {
    id: "redes-sociales-atencion",
    title: "Redes sociales vs. videojuegos: no es lo mismo para la atención",
    text: "Un estudio que siguió a más de 8,300 niños durante 4 años encontró que más tiempo en redes sociales predecía un aumento gradual de síntomas de falta de atención — pero jugar videojuegos o ver TV no mostró ese mismo efecto. Es un estudio en niños, no en adultos, pero el patrón (redes sociales específicamente, no pantallas en general) es interesante para cualquiera que note que su atención empeora en temporadas de más scroll.",
    source: "Estudio longitudinal, 8,324 niños en EE. UU. (Karolinska Institutet, difundido en 2025).",
  },
  {
    id: "body-doubling-ojo-con-la-evidencia",
    title: "Cuerpo doble: resultados prometedores, pero léelos con cuidado",
    text: "Una encuesta con 117 adultos con TDAH que usaron sesiones de \"cuerpo doble\" virtual durante 12 semanas reportó mejoras en concentración sostenida (69% dijo que le costaba mucho menos concentrarse) y menos ansiedad autorreportada. Pero ojo: fue una encuesta antes/después, sin grupo de control, financiada por la misma plataforma que ofrece el servicio — prometedora, no una prueba definitiva. Por eso la sala de cuerpo doble de Senda es gratuita y anónima, no una promesa de resultado garantizado.",
    source: "Encuesta de FLOWN (Reino Unido), 117 usuarios, 12 semanas, sin grupo control — financiada por el propio proveedor.",
  },
  {
    id: "comorbilidad-ansiedad-depresion",
    title: "El TDAH casi nunca viene solo",
    text: "Una revisión sistemática encontró que la ansiedad y la depresión son muy comunes junto al TDAH en adultos — aunque las cifras varían mucho entre estudios (de 4% a más de 80%, según la población y la herramienta usada), casi todos coinciden en que es la regla, no la excepción. Si además de TDAH sientes ansiedad o ánimo bajo, no es \"que exageras\" — es lo esperable, y vale la pena tratarlo también.",
    source: "Revisión sistemática, PLOS ONE (2023) — rangos muy variables por heterogeneidad metodológica entre estudios.",
  },
  {
    id: "disforia-rechazo-honestidad",
    title: "Sobre la \"disforia por sensibilidad al rechazo\" — con honestidad",
    text: "Es un término muy usado en comunidades de TDAH para describir un dolor emocional intenso ante el rechazo o la crítica, real y validado por muchas experiencias — pero, hasta ahora, no es un diagnóstico formal ni tiene el mismo nivel de evidencia científica controlada que otros hallazgos de esta lista. Eso no le quita valor a la experiencia: solo significa que conviene no tratarlo todavía como un hecho médico establecido.",
    source: "Revisión informal de literatura (2025-2026) — sin consenso diagnóstico formal (DSM) sobre el término.",
  },
  {
    id: "omega-3-modesto",
    title: "Omega-3: ayuda modesta, no magia",
    text: "Varios metaanálisis de ensayos controlados encuentran que la suplementación con ácidos grasos omega-3 tiene un efecto pequeño pero real sobre los síntomas centrales del TDAH — mucho menor que el de la medicación estimulante. Puede valer la pena como complemento, platicado con tu médico o médica, pero no como sustituto de un tratamiento ya establecido.",
    source: "Metaanálisis de ensayos controlados aleatorizados sobre omega-3 y TDAH (varios, 2015-2024).",
  },
  {
    id: "tdah-mujeres-diagnostico-tardio",
    title: "Por qué tantas mujeres se diagnostican de adultas",
    text: "La investigación reciente describe que, en mujeres, el TDAH frecuentemente no encaja con el estereotipo infantil de hiperactividad visible, y el camino hacia el diagnóstico suele ser distinto y más largo. Un estudio cualitativo de 2025 con mujeres diagnosticadas en la adultez documentó años sintiéndose \"diferentes\" sin saber por qué — un diagnóstico tardío no significa que el TDAH haya \"aparecido\" de repente.",
    source: "Estudio cualitativo (2025) — muestra pequeña, 14 mujeres; no permite estimar qué tan comunes son estas experiencias.",
  },
  {
    id: "tdah-no-es-falta-de-voluntad",
    title: "Por qué \"solo esfuérzate más\" no funciona",
    text: "La evidencia de neuroimagen muestra diferencias medibles en cómo el cerebro con TDAH regula la dopamina en los circuitos de atención y motivación — no es un problema de \"fuerza de voluntad\", es una diferencia real en cómo el cerebro prioriza y sostiene el esfuerzo. Entender esto no es una excusa para no intentar estrategias — es el motivo por el que las estrategias correctas funcionan mejor que la autocrítica.",
    source: "Consenso de la literatura en neurociencia de la dopamina y TDAH, revisado ampliamente en estudios de neuroimagen.",
  },
  {
    id: "tdah-adultos-prevalencia",
    title: "El TDAH en adultos no es raro",
    text: "Las estimaciones actuales ubican la prevalencia de TDAH en adultos alrededor del 2.5% a nivel global usando criterios estrictos, pero las cifras suben considerablemente al incluir a quienes cumplen criterios pero nunca fueron diagnosticados en la infancia. Si te diagnosticaron de adulto, no eres un caso raro — eres parte de una población que apenas en los últimos años ha empezado a ser bien reconocida.",
    source: "Estimaciones de prevalencia global en adultos, revisadas en múltiples metaanálisis (p. ej. Song et al. 2021, actualizadas por literatura posterior).",
  },
  {
    id: "hiperfoco-fortaleza",
    title: "El hiperfoco también es parte del TDAH",
    text: "No todo en el TDAH es dificultad para prestar atención — muchas personas describen episodios de hiperfoco, donde la concentración en algo que de verdad engancha se vuelve intensa y sostenida, a veces por horas. La investigación todavía está definiendo bien este fenómeno, pero reconocerlo como parte real de cómo funciona tu atención (no solo como \"déficit\") ayuda a diseñar tu día alrededor de tus propios patrones, en vez de en contra de ellos.",
    source: "Fenómeno descrito de forma creciente en la literatura sobre TDAH adulto; aún sin una definición operacional única consensuada.",
  },
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
