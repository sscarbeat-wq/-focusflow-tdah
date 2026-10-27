// Paletas de color para ANRO TDAH — modo oscuro (el original) y modo claro.
// Tienen exactamente las mismas claves para que cualquier componente que
// reciba `C` como prop funcione igual sin importar cuál esté activo.
//
// 26 de octubre de 2026 — se agregaron dos colores nuevos (coral y sky) para
// poder tener un color fijo por categoría de panel (antes solo había 4
// acentos —mint/lavender/amber/rose— repartidos de forma más o menos
// arbitraria entre 24 paneles distintos, sin ningún criterio de categoría).
// También se agregó el sistema de "acento personal" (ACCENT_OPTIONS +
// getStoredAccent/storeAccent, mismo patrón que el tema claro/oscuro): la
// paciente elige uno de los 6 colores de la paleta para que se use en los
// elementos que no pertenecen a ninguna categoría fija (la mascota, el
// panel "Hoy"), en vez de que todos los pacientes vean el mismo lavanda fijo
// sin poder cambiarlo — justo lo que la investigación de diseño encontró:
// no hay un color único mejor para TDAH, la sensibilidad a estímulos
// visuales varía mucho de persona a persona, así que lo que más ayuda es
// dejar elegir, no imponer un color "correcto".

export const DARK_THEME = {
  bg: "#141B2E",
  surface: "#1D2740",
  surfaceAlt: "#24304D",
  border: "#34405F",
  text: "#E8EAF0",
  textMuted: "#8E96AC",
  mint: "#8FCBB0",
  mintDark: "#5FA085",
  mintText: "#12261E",
  lavender: "#B3A6D9",
  lavenderDark: "#8B7CBF",
  lavenderText: "#201A33",
  amber: "#D9A15C",
  amberText: "#2E2008",
  rose: "#D98CA6",
  roseText: "#33121F",
  coral: "#E8A87C",
  coralDark: "#C9824F",
  coralText: "#2E1A08",
  sky: "#8FB8D9",
  skyDark: "#5F90B8",
  skyText: "#0D2238",
  gray: "#9BA7C2",
  grayText: "#1B2133",
  white: "#F2F4FA",
  whiteText: "#1E2433",
  black: "#5B6478",
  blackText: "#F2F4FA",
};

export const LIGHT_THEME = {
  bg: "#F6F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F7",
  border: "#DADFEA",
  text: "#1E2433",
  textMuted: "#656D85",
  mint: "#3F9C82",
  mintDark: "#2F7D68",
  mintText: "#FFFFFF",
  lavender: "#7C6BAE",
  lavenderDark: "#634F92",
  lavenderText: "#FFFFFF",
  amber: "#B06B13",
  amberText: "#FFFFFF",
  rose: "#B23D68",
  roseText: "#FFFFFF",
  coral: "#B0631F",
  coralDark: "#8F4E17",
  coralText: "#FFFFFF",
  sky: "#3F7FB0",
  skyDark: "#326690",
  skyText: "#FFFFFF",
  gray: "#6B7390",
  grayText: "#FFFFFF",
  white: "#C9CEDC",
  whiteText: "#1E2433",
  black: "#1E2433",
  blackText: "#FFFFFF",
};

export const THEME_STORAGE_KEY = "senda-theme";

// Lee el tema guardado. Si el paciente nunca lo cambió, respeta la
// preferencia del sistema operativo/navegador; si tampoco se puede saber,
// usa oscuro (el que ya tenía la app).
export function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (err) {
    // localStorage no disponible (modo privado, etc.) — seguimos con la
    // preferencia del sistema o el valor por defecto.
  }
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch (err) {
    /* ignorar */
  }
  return "dark";
}

export function storeTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

// --- Acento personal -------------------------------------------------
//
// Las claves son las mismas que ya existen en DARK_THEME/LIGHT_THEME — a
// propósito, para no inventar una paleta aparte: el componente que use el
// acento personal solo necesita leer `C[accentKey]`, que ya cambia solo
// entre modo claro/oscuro igual que el resto de los colores.
//
// 27 de octubre de 2026 — se agregaron gray/white/black a petición de la
// doctora. Ojo con un detalle de contraste que vale la pena tener presente:
// "white" y "black" no pueden ser un blanco/negro puro en los dos temas a
// la vez, porque el fondo de la app YA es casi blanco en modo claro y casi
// negro en modo oscuro — un acento literalmente blanco sería invisible
// sobre un fondo claro, y uno literalmente negro sería invisible sobre un
// fondo oscuro. Por eso cada uno usa un tono distinto por tema (igual que
// ya hacían lavender/mint/etc., que tampoco son el mismo hex en los dos
// temas): "white" es un blanco casi puro en modo oscuro pero un gris perla
// en modo claro, y "black" es lo opuesto — así siempre se alcanza a ver
// contra el fondo, sea cual sea el tema activo.
export const ACCENT_OPTIONS = ["lavender", "mint", "coral", "rose", "amber", "sky", "gray", "white", "black"];
export const DEFAULT_ACCENT = "lavender";
export const ACCENT_STORAGE_KEY = "anro-accent";

export function getStoredAccent() {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (ACCENT_OPTIONS.includes(stored)) return stored;
  } catch (err) {
    // localStorage no disponible — se queda con el valor por defecto.
  }
  return DEFAULT_ACCENT;
}

export function storeAccent(accentKey) {
  if (typeof window === "undefined") return;
  if (!ACCENT_OPTIONS.includes(accentKey)) return;
  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accentKey);
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}

// Convierte un color hexadecimal ("#B3A6D9") a rgba con la opacidad que se
// le pida — para los fondos de tarjeta con un lavado suave del color de
// acento (el look más redondeado/tipo Tiimo) en vez de un borde plano.
// Si el hex no es válido (no debería pasar, los únicos que se usan vienen
// de DARK_THEME/LIGHT_THEME de este mismo archivo), regresa transparente
// en vez de tronar.
export function tint(hex, alpha) {
  if (typeof hex !== "string") return "rgba(0,0,0,0)";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "rgba(0,0,0,0)";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "rgba(0,0,0,0)";
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
