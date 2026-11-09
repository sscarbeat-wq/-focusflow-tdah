// Paleta automática por hora del día para la sección de Inicio (9 de
// noviembre de 2026) — nuevo, independiente del sistema de tema claro/
// oscuro + acento personal que ya existe en theme.js (DARK_THEME/
// LIGHT_THEME, getStoredTheme/getStoredAccent). Ese sistema sigue
// intacto y lo sigue eligiendo la paciente a mano para TODA la app; esta
// paleta nueva es automática (no se guarda, se recalcula con la hora
// actual) y solo pinta el fondo decorativo + textos del encabezado y la
// brújula de Inicio — el resto de la app (barra de navegación, botones
// flotantes, las demás 4 pestañas) se queda exactamente con el tema de
// siempre. La doctora confirmó "automático por hora del día" (no un
// selector manual) al revisar los 3 mockups de Opción K.
//
// Colores exactos tomados de los 3 mockups originales
// (VarianteK.dc.html / VarianteK-Tarde.dc.html / VarianteK-Noche.dc.html).
// `accent` es el mismo azul-verde en las 3 franjas (es el color "ancla" de
// la marca); lo que cambia con la hora es `accent2` (el color secundario,
// más cálido de tarde y dorado de noche) y el fondo/texto.
export const TIME_OF_DAY_PALETTES = {
  morning: {
    bg: "#F4F8FA",
    accent: "#1F6E91",
    accent2: "#C98A2E",
    text: "#3A3428",
    textMuted: "#7C8A90",
  },
  afternoon: {
    bg: "#FFD9A8",
    accent: "#1F6E91",
    accent2: "#D9683A",
    text: "#4A2E22",
    textMuted: "#9C7259",
  },
  night: {
    bg: "#140E29",
    accent: "#1F6E91",
    accent2: "#E3A857",
    text: "#EDEAF7",
    textMuted: "#8A8AA8",
  },
};

// Límites de hora (no vienen especificados en el mockup — se eligieron
// siguiendo la convención más común de apps de hábitos/bienestar: mañana
// empieza cuando la mayoría ya despertó, tarde cuando empieza a bajar el
// sol, noche cubre el resto incluyendo la madrugada).
export function timeOfDayPeriod(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 13) return "morning";
  if (hour >= 13 && hour < 19) return "afternoon";
  return "night";
}

export function timeOfDayPalette(now = new Date()) {
  return TIME_OF_DAY_PALETTES[timeOfDayPeriod(now)];
}

// Fondo del contenedor de Inicio: sólido de mañana, degradado suave hacia
// el acento de tarde/noche (igual que los mockups: `linear-gradient(180deg,
// {{bg}} 0%, color-mix(in srgb, {{bg}} X%, {{accent}}) 100%)`).
// color-mix() nativo de CSS ya tiene buen soporte (Chrome/Edge 111+,
// Safari 16.2+, Firefox 113+) — todos muy por debajo de lo que ya pide el
// resto de la app, así que no se arma un mezclador de colores en JS aparte.
export function timeOfDayBackground(period) {
  if (period === "morning") return TIME_OF_DAY_PALETTES.morning.bg;
  const mixPct = period === "afternoon" ? 45 : 70;
  const { bg, accent } = TIME_OF_DAY_PALETTES[period];
  return `linear-gradient(180deg, ${bg} 0%, color-mix(in srgb, ${bg} ${mixPct}%, ${accent}) 100%)`;
}
