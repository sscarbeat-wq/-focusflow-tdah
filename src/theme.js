// Paletas de color para Senda — modo oscuro (el original) y modo claro
// (nuevo). Tienen exactamente las mismas claves para que cualquier
// componente que reciba `C` como prop funcione igual sin importar cuál
// esté activo.

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
