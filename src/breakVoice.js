// Guía narrada de la Pausa activa (12 de noviembre de 2026, "¿puedes poner
// la guía narrada opcional?"). Usa la voz del propio teléfono o
// computadora (Web Speech API, `speechSynthesis`): no hay archivos de
// audio ni servicios externos, y funciona sin internet en la mayoría de
// los dispositivos. La voz y su calidad dependen del dispositivo.
//
// Es OPCIONAL y arranca apagada: se enciende con el interruptor "Guía con
// voz" y se recuerda en este dispositivo (localStorage).
const VOICE_KEY = "anro-break-voice";
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

export function voiceSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

export function getStoredVoicePref() {
  try {
    return window.localStorage.getItem(VOICE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function storeVoicePref(on) {
  try {
    if (on) window.localStorage.setItem(VOICE_KEY, "1");
    else window.localStorage.removeItem(VOICE_KEY);
  } catch (e) {
    /* solo no se recuerda */
  }
}

// Elige la mejor voz disponible para el idioma: primero la del país exacto
// (es-MX), luego cualquiera del mismo idioma (es-ES, es-US…).
function pickVoice(locale) {
  const voices = window.speechSynthesis.getVoices() || [];
  const lang = locale.slice(0, 2).toLowerCase();
  const norm = (v) => String(v.lang || "").replace("_", "-").toLowerCase();
  return voices.find((v) => norm(v) === locale.toLowerCase()) || voices.find((v) => norm(v).startsWith(lang)) || null;
}

export function stopSpeaking() {
  if (!voiceSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    /* nada que callar */
  }
}

// Dice `text` en voz alta, cortando lo que se estuviera diciendo. Un poco
// más lento de lo normal, para que dé tiempo de seguir la instrucción.
export function speak(text, lang = "es") {
  if (!voiceSupported() || !text) return;
  try {
    const locale = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    window.speechSynthesis.cancel();
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = locale;
    const voice = pickVoice(locale);
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {
    /* sin voz: la pausa sigue igual, solo en silencio */
  }
}
