// Motor de idioma de Senda — mismo patrón que theme.js: preferencia de
// DISPOSITIVO guardada en localStorage, nunca en el progreso de Supabase
// (igual que el tema claro/oscuro). Así funciona también en Auth.jsx y
// Paywall.jsx, antes de que exista una sesión.
//
// Por qué no es una preferencia de cuenta: el tema ya sentó el precedente de
// que "cómo se ve/siente la app en este aparato" vive en localStorage, no en
// el progreso clínico que viaja con la cuenta. El idioma es del mismo tipo
// (una preferencia de la persona frente al aparato que tiene enfrente, no un
// dato clínico), así que se guarda igual — simple, sin cambios de esquema en
// Supabase, y consistente con el único patrón de preferencias que ya existe
// en esta base de código.
import es from "./i18n/es.js";
import en from "./i18n/en.js";
import fr from "./i18n/fr.js";
import pt from "./i18n/pt.js";

export const LANGUAGE_STORAGE_KEY = "senda-lang";

export const SUPPORTED_LANGUAGES = ["es", "en", "fr", "pt"];

export const LANGUAGE_NAMES = {
  es: "Español",
  en: "English",
  fr: "Français",
  pt: "Português",
};

const DICTIONARIES = { es, en, fr, pt };

const DEFAULT_LANGUAGE = "es";

// Si no hay nada guardado todavía, intenta adivinar a partir del idioma del
// navegador — igual de "best effort" que el detector de tema claro/oscuro
// (prefers-color-scheme). Si el navegador dice "en-US", "fr-FR", "pt-BR",
// etc., usamos esa base; si no es ninguno de los 4 idiomas que ofrece Senda,
// nos quedamos en español.
function detectBrowserLanguage() {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const raw = nav?.language || nav?.languages?.[0] || "";
    const base = raw.slice(0, 2).toLowerCase();
    return SUPPORTED_LANGUAGES.includes(base) ? base : DEFAULT_LANGUAGE;
  } catch (e) {
    return DEFAULT_LANGUAGE;
  }
}

export function getStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  } catch (e) {
    // localStorage no disponible (modo privado, etc.) — seguimos al
    // detector del navegador, igual que theme.js.
  }
  return detectBrowserLanguage();
}

export function storeLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.includes(lang)) return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    // Si no se puede guardar, la app sigue funcionando solo con el estado
    // en memoria durante esta sesión — nunca truena por esto.
  }
}

// Devuelve siempre un diccionario completo y usable — si por lo que sea
// piden un idioma no soportado, cae a español en vez de tronar.
export function getTranslations(lang) {
  return DICTIONARIES[lang] || DICTIONARIES[DEFAULT_LANGUAGE];
}
