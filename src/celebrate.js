// Micro-recompensa de sonido + vibración al ganar XP (completar un paso del
// desglosador, terminar una sesión de enfoque, registrar ánimo, usar el
// freno de impulsividad, etc.) — refuerzo inmediato y breve, pensado para
// sonar muchas veces seguidas sin cansar. Generado 100% en el dispositivo
// (Web Audio API + Vibration API), sin archivos de audio ni dependencias
// nuevas — mismo patrón ya usado por el ruido blanco y la campana de Modo
// Enfoque en FocusMode.jsx.

let audioCtx = null;

function getCtx() {
  if (audioCtx) return audioCtx;
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

// "Pop" corto y ascendente — distinto de la campana de fin de sesión
// (dos tonos largos) a propósito, para que no se confundan: este suena
// muchas veces por sesión, la campana solo una vez al terminar.
function playSound() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

// Vibración breve — solo hace algo en dispositivos/navegadores que
// soportan la Vibration API (típicamente Android; iOS Safari y escritorio
// la ignoran sin error, no truena en ningún caso).
function vibrate() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(15);
    }
  } catch (e) {
    /* algunos navegadores truenan si se llama sin interacción reciente del usuario — se ignora */
  }
}

// Punto de entrada único. Nunca truena la acción que la llama (ganar XP),
// pase lo que pase con el audio o la vibración del dispositivo — mismo
// principio que scheduleStepsOnCalendar / bodyDouble.setStatus: se puede
// llamar siempre sin preguntar antes.
export function celebrate(enabled = true) {
  if (!enabled) return;
  try {
    playSound();
  } catch (e) {
    /* navegador sin soporte de Web Audio */
  }
  vibrate();
}
