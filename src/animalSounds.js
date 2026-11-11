// Soniditos de cada animal (10 de noviembre de 2026, "que los animales
// hagan soniditos"). Igual que el resto de los sonidos de la mascota
// (mascotSounds.js): generados en el momento con Web Audio, sin archivos de
// audio ni licencias. Son "voces de caricatura" cortas (menos de 1
// segundo) y a volumen bajo — un pío, un miau, un guau, burbujas — no
// grabaciones realistas, a propósito: la mascota se oye muchas veces al
// día y no debe sobresaltar.
//
// Cuándo suenan (ver Mascot.jsx): al tocar a la mascota ("hola"), con
// doble toque (juega: la misma voz, más aguda y dos veces), cuando come
// (un "ñam ñam" igual para todos) y cuando crece de etapa. Siempre con el
// mismo botón de silencio de la mascota.

import { getSharedAudioContext } from "./mascotSounds";

const MASTER = 0.9; // un poco más bajito que los demás sonidos de la app

function ctxReady() {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state === "suspended") return null;
  return ctx;
}

function envGain(ctx, at, peak, attack, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * MASTER), at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  return g;
}

// Un tono que se desliza por varias frecuencias (pares [segundos, Hz]).
function glide(ctx, { at, points, dur, type = "sine", peak = 0.1, attack = 0.02, filter, vibrato }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(points[0][1], at);
  points.slice(1).forEach(([t, f]) => osc.frequency.exponentialRampToValueAtTime(f, at + t));
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = vibrato.rate;
    depth.gain.value = vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(at);
    lfo.stop(at + dur + 0.05);
  }
  const g = envGain(ctx, at, peak, attack, dur);
  let node = osc;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type || "lowpass";
    f.frequency.setValueAtTime(filter.freq, at);
    if (filter.to) f.frequency.exponentialRampToValueAtTime(filter.to, at + dur);
    f.Q.value = filter.q || 1;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

// Ruido filtrado (hojas, gruñido, mordida).
function noise(ctx, { at, dur, peak = 0.08, freq = 1000, q = 1, type = "bandpass", attack = 0.01 }) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = envGain(ctx, at, peak, attack, dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(at);
  src.stop(at + dur + 0.02);
}

// p = multiplicador de tono (1 normal; >1 más agudo, para "jugar").
const VOICES = {
  ave: (ctx, at, p) => {
    [0, 0.11, 0.22].forEach((d, i) =>
      glide(ctx, { at: at + d, points: [[0, 2300 * p], [0.05, 3300 * p + i * 150]], dur: 0.08, peak: 0.07 })
    );
  },
  aguila: (ctx, at, p) =>
    glide(ctx, {
      at,
      points: [[0, 1900 * p], [0.12, 2300 * p], [0.45, 1300 * p]],
      dur: 0.5,
      type: "sawtooth",
      peak: 0.09,
      filter: { type: "bandpass", freq: 2200, q: 2 },
      vibrato: { rate: 28, depth: 60 },
    }),
  buho: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 430 * p], [0.18, 400 * p]], dur: 0.22, peak: 0.12, attack: 0.04, vibrato: { rate: 6, depth: 6 } });
    glide(ctx, { at: at + 0.3, points: [[0, 410 * p], [0.3, 360 * p]], dur: 0.36, peak: 0.12, attack: 0.05, vibrato: { rate: 6, depth: 6 } });
  },
  mariposa: (ctx, at, p) =>
    [1568, 2093, 2637].forEach((f, i) => glide(ctx, { at: at + i * 0.08, points: [[0, f * p], [0.2, f * p]], dur: 0.25, type: "triangle", peak: 0.05 })),
  gato: (ctx, at, p) =>
    glide(ctx, {
      at,
      points: [[0, 480 * p], [0.15, 780 * p], [0.45, 430 * p]],
      dur: 0.5,
      type: "sawtooth",
      peak: 0.06,
      attack: 0.05,
      filter: { type: "lowpass", freq: 900, to: 1800, q: 4 },
      vibrato: { rate: 7, depth: 12 },
    }),
  tigre: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 120 * p], [0.5, 90 * p]], dur: 0.6, type: "sawtooth", peak: 0.08, attack: 0.08, filter: { freq: 500 }, vibrato: { rate: 22, depth: 15 } });
    noise(ctx, { at, dur: 0.55, peak: 0.04, freq: 300, type: "lowpass" });
  },
  leon: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 170 * p], [0.25, 200 * p], [0.7, 95 * p]], dur: 0.75, type: "sawtooth", peak: 0.09, attack: 0.06, filter: { freq: 700, to: 400 }, vibrato: { rate: 18, depth: 18 } });
    noise(ctx, { at, dur: 0.6, peak: 0.05, freq: 500, type: "lowpass" });
  },
  perro: (ctx, at, p) => {
    [0, 0.2].forEach((d) => {
      glide(ctx, { at: at + d, points: [[0, 330 * p], [0.1, 230 * p]], dur: 0.13, type: "square", peak: 0.05, attack: 0.008, filter: { freq: 1300 } });
      noise(ctx, { at: at + d, dur: 0.06, peak: 0.04, freq: 1500 });
    });
  },
  zorro: (ctx, at, p) =>
    [0, 0.16].forEach((d) =>
      glide(ctx, { at: at + d, points: [[0, 900 * p], [0.05, 1450 * p], [0.12, 750 * p]], dur: 0.13, type: "triangle", peak: 0.08, attack: 0.01 })
    ),
  koala: (ctx, at, p) =>
    glide(ctx, { at, points: [[0, 190 * p], [0.25, 150 * p]], dur: 0.3, type: "sawtooth", peak: 0.06, attack: 0.03, filter: { freq: 600 } }),
  panda: (ctx, at, p) =>
    glide(ctx, { at, points: [[0, 250 * p], [0.15, 340 * p], [0.35, 280 * p]], dur: 0.4, type: "triangle", peak: 0.1, attack: 0.05 }),
  pez: (ctx, at, p) =>
    [0, 0.12, 0.26].forEach((d, i) =>
      glide(ctx, { at: at + d, points: [[0, (300 + i * 120) * p], [0.07, (850 + i * 150) * p]], dur: 0.09, peak: 0.09, attack: 0.005 })
    ),
  pulpo: (ctx, at, p) =>
    [0, 0.18].forEach((d) =>
      glide(ctx, { at: at + d, points: [[0, 220 * p], [0.1, 620 * p]], dur: 0.14, peak: 0.1, attack: 0.01, filter: { freq: 900 } })
    ),
  ajolote: (ctx, at, p) =>
    glide(ctx, { at, points: [[0, 1400 * p], [0.07, 2000 * p], [0.16, 1600 * p]], dur: 0.18, peak: 0.07, attack: 0.01 }),
  tortuga: (ctx, at, p) =>
    glide(ctx, { at, points: [[0, 230 * p], [0.4, 195 * p]], dur: 0.45, type: "triangle", peak: 0.1, attack: 0.08 }),
  dragon: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 150 * p], [0.15, 210 * p], [0.5, 110 * p]], dur: 0.55, type: "sawtooth", peak: 0.07, attack: 0.04, filter: { freq: 900, to: 500 }, vibrato: { rate: 26, depth: 14 } });
    noise(ctx, { at: at + 0.05, dur: 0.4, peak: 0.035, freq: 700, type: "lowpass" });
  },
  dinosaurio: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 210 * p], [0.12, 260 * p], [0.45, 130 * p]], dur: 0.5, type: "sawtooth", peak: 0.07, attack: 0.03, filter: { freq: 1100, to: 600 }, vibrato: { rate: 20, depth: 16 } });
    noise(ctx, { at, dur: 0.35, peak: 0.03, freq: 800, type: "lowpass" });
  },
  planta: (ctx, at, p) => {
    noise(ctx, { at, dur: 0.25, peak: 0.05, freq: 3500, q: 0.8, attack: 0.03 });
    glide(ctx, { at: at + 0.12, points: [[0, 1320 * p], [0.15, 1760 * p]], dur: 0.2, type: "triangle", peak: 0.05 });
  },
};

// "Ñam ñam" — dos mordiditas cortas, igual para todos.
function chomp(ctx, at) {
  [0, 0.16].forEach((d) => {
    noise(ctx, { at: at + d, dur: 0.07, peak: 0.07, freq: 900, q: 1.5, attack: 0.005 });
    glide(ctx, { at: at + d, points: [[0, 180], [0.06, 120]], dur: 0.08, type: "triangle", peak: 0.06, attack: 0.005 });
  });
}

let lastPlayed = 0;
let lastKind = null;

// kind: "greet" | "play" | "eat" | "evolve"
export function playAnimalSound(species, kind = "greet") {
  try {
    const ctx = ctxReady();
    if (!ctx) return;
    const now = Date.now();
    // Nunca la misma voz dos veces encimada (varias señales juntas); un
    // doble toque sí cambia de "hola" a "jugar" al momento.
    if (kind === lastKind && now - lastPlayed < 350) return;
    lastPlayed = now;
    lastKind = kind;
    const at = ctx.currentTime + 0.01;
    if (kind === "eat") {
      chomp(ctx, at);
      return;
    }
    const voice = VOICES[species] || VOICES.ave;
    if (kind === "play") {
      voice(ctx, at, 1.2);
      return;
    }
    if (kind === "evolve") {
      voice(ctx, at, 1.12);
      [1046.5, 1318.5, 1568].forEach((f, i) => glide(ctx, { at: at + 0.55 + i * 0.08, points: [[0, f], [0.15, f]], dur: 0.18, type: "triangle", peak: 0.05 }));
      return;
    }
    voice(ctx, at, 1);
  } catch (err) {
    /* sin Web Audio — la mascota simplemente no suena */
  }
}
