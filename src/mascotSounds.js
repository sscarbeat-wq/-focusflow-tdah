// Sonidos de la mascota — generados en tiempo real con Web Audio API,
// mismo principio que los sonidos de Modo Enfoque (FocusMode.jsx): nada de
// archivos de audio externos ni dependencias nuevas, así no hay nada que
// descargar ni licenciar. Son efectos CORTOS y puntuales (nunca un loop de
// fondo) para los momentos en que la mascota ya reacciona visualmente:
// nacer de un huevo, subir de etapa, empezar/retomar una sesión de
// enfoque, y volver de una distracción. Pensado para acompañar esos
// gestos, no para sonar todo el tiempo — la mascota se ve todo el día, en
// cada visita a la pantalla principal, así que un sonido constante sería
// justo el tipo de sobreestimulación que el resto del diseño evita.
//
// 31 de octubre de 2026, a petición de la doctora: "más bonitas, que
// tengan movimiento y sonidos".
//
// El AudioContext es un singleton a nivel de módulo (mismo patrón que
// audioCtxRef en FocusMode.jsx, pero compartido aquí porque solo hace
// falta uno). Los navegadores no dejan que un AudioContext reproduzca nada
// hasta que haya una interacción real de la persona (click, tecla, toque)
// en la página — por eso unlockMascotAudio() se llama tanto desde el botón
// de silenciar/activar como desde un listener genérico de "primera
// interacción" en Mascot.jsx. Si todavía no hubo esa interacción, las
// funciones de abajo simplemente no suenan esa vez (no truenan ni
// acumulan sonidos en cola) — la siguiente reacción, después de que la
// persona ya haya tocado algo, sí sonará.

let sharedCtx = null;

function getSharedAudioContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
}

export function unlockMascotAudio() {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {
      // Nada que hacer — simplemente se queda silenciado hasta la próxima interacción.
    });
  }
}

// Un solo tono corto, con envolvente simple (ataque rápido, caída
// exponencial) para que nunca truene ni se sienta como un beep plano.
function tone(ctx, { freq, startAt, duration, type = "sine", peakGain = 0.09 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

// Acorde roto ascendente y alegre ("ding ding ding ding") — subir de etapa.
export function playLevelUpSound() {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state === "suspended") return;
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(ctx, { freq, startAt: now + i * 0.09, duration: 0.22, type: "triangle", peakGain: 0.08 });
  });
}

// Más chispeante y rápido que el de subir de etapa — para el momento
// específico de salir del huevo, que ya tiene su propia animación distinta
// (eclosión) y por eso merece su propio sonido distinto también.
export function playHatchSound() {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state === "suspended") return;
  const now = ctx.currentTime;
  [392, 587.33, 880, 1318.5].forEach((freq, i) => {
    tone(ctx, { freq, startAt: now + i * 0.07, duration: 0.18, type: "sine", peakGain: 0.07 });
  });
}

// Dos notas suaves ascendentes, ni urgentes ni llamativas — acompaña la
// píldora "Enfocando" cuando arranca o retoma una sesión de Modo Enfoque.
export function playFocusStartSound() {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state === "suspended") return;
  const now = ctx.currentTime;
  tone(ctx, { freq: 440, startAt: now, duration: 0.35, type: "sine", peakGain: 0.06 });
  tone(ctx, { freq: 587.33, startAt: now + 0.1, duration: 0.3, type: "sine", peakGain: 0.05 });
}

// Un "boop" de dos notas muy breve — nunca un sonido de error ni de alarma
// (nada de tonos graves o disonantes): es un gesto de "ah, ahí estás", el
// mismo principio de no regañar que ya usa el texto "¡Volviste!" en vez de
// algo como "perdiste el enfoque".
export function playDistractionReturnSound() {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state === "suspended") return;
  const now = ctx.currentTime;
  tone(ctx, { freq: 660, startAt: now, duration: 0.14, type: "sine", peakGain: 0.07 });
  tone(ctx, { freq: 523.25, startAt: now + 0.09, duration: 0.18, type: "sine", peakGain: 0.07 });
}

// --- Preferencia de silenciar ---------------------------------------
//
// Mismo patrón que species/accent (preferencia de DISPOSITIVO guardada en
// localStorage, no en el progreso clínico sincronizado con Supabase).
// Default: sonido activado (la doctora pidió sonidos), con un botón visible
// para silenciar por si a alguna paciente le resulta de más.
export const MASCOT_SOUND_STORAGE_KEY = "anro-mascot-sound";

export function getStoredMascotSoundPref() {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(MASCOT_SOUND_STORAGE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  } catch (err) {
    // localStorage no disponible — se queda con el valor por defecto (activado).
  }
  return true;
}

export function storeMascotSoundPref(on) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MASCOT_SOUND_STORAGE_KEY, on ? "on" : "off");
  } catch (err) {
    // No pasa nada si no se pudo guardar — solo no se recuerda la próxima vez.
  }
}
