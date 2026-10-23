// Guía breve para quien recibió su diagnóstico de TDAH hace poco, como
// adulto — contenido fijo, sin IA, redactado por Claude a partir de guías
// de psicoeducación ya establecidas (p. ej. CHADD, sobre si contarlo o no)
// y del conocimiento clínico general sobre titulación de medicación en
// TDAH. Mismo principio que el resto del contenido clínico de Senda:
// informativo, nunca prescriptivo, siempre remite al médico o médica tratante
// para decisiones concretas sobre el caso de cada quien.
//
// Senda no guarda cuándo fue diagnosticada cada cuenta, así que esta guía
// no se puede disparar sola — se muestra como una tarjeta descartable que
// cualquiera puede abrir si le aplica, mismo principio de autoidentificación
// ya usado en la cápsula de perimenopausia.
// El contenido traducible de cada sección (title/text) vive en los
// diccionarios de i18n, bajo postDiagnosisSections[id] — este archivo solo
// guarda el orden de las secciones.
export const POST_DIAGNOSIS_SECTIONS = [
  { id: "primeras-semanas" },
  { id: "no-es-magia" },
  { id: "errores-comunes" },
  { id: "hablarlo-con-tu-gente" },
  { id: "cuando-contactar" },
];
