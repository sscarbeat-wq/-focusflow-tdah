// Soniditos de cada animal (10 de noviembre de 2026, "que los animales
// hagan soniditos"; rediseñados el 19 de noviembre de 2026 — "pues son
// sonidos bien raros" / "tienen que ser propios del animal" — para que
// cada uno se parezca más a su sonido real, dentro de lo que se puede
// generar con código). Igual que el resto de los sonidos de la mascota
// (mascotSounds.js): generados en el momento con Web Audio, sin archivos
// de audio ni licencias — nunca grabaciones reales. Son "voces de
// caricatura" cortas (menos de 1 segundo) y a volumen bajo — no deben
// sobresaltar a quien las oye muchas veces al día.
//
// Nota honesta sobre "que se parezcan al sonido real": para los animales
// que SÍ hacen un sonido reconocible (perro, gato, león, tigre, koala,
// zorro, búho, águila) se afinó la forma de onda para acercarse a ese
// sonido real (ladrido, maullido, rugido, bramido grave, chillido, ulular,
// grito agudo). Para los que en la vida real son mudos o casi mudos para
// el oído humano (pez, pulpo, ajolote, tortuga, mariposa, planta) no
// existe un "sonido real" al que acercarse — ahí se dejó (o se afinó un
// poco) el sonido inventado y juguetón de siempre, porque inventar un
// sonido "real" para un pez sería al revés de honesto. Dragón y dinosaurio
// son fantásticos, así que su "realismo" es el de cine/videojuego (rugido
// grave con gruñido), no uno biológico.
//
// Cuándo suenan (ver Mascot.jsx): al tocar a la mascota ("hola"), con
// doble toque (juega: la misma voz, más aguda y dos veces), cuando come
// (un "ñam ñam" igual para todos), cuando crece de etapa, y en los gestos
// espontáneos de reposo (brinco contento, estirón, mirada de curiosidad).
// Siempre con el mismo botón de silencio de la mascota.

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

// Ruido filtrado (hojas, gruñido, mordida, resuello).
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

// Rugido/bramido grave: tono principal + un segundo oscilador una octava
// abajo (le da "cuerpo de pecho" que un solo tono no tiene) + ruido
// filtrado grave encima (la parte "sucia"/gutural). Usado por los
// animales grandes y guturales (león, tigre, koala, dragón, dinosaurio).
function growl(ctx, { at, points, dur, type = "sawtooth", peak = 0.09, attack = 0.05, filter, vibrato, noisePeak = 0.04, noiseFreq = 500 }) {
  glide(ctx, { at, points, dur, type, peak, attack, filter, vibrato });
  const subPoints = points.map(([t, f]) => [t, f / 2]);
  glide(ctx, { at, points: subPoints, dur, type: "sine", peak: peak * 0.6, attack: attack * 1.2 });
  noise(ctx, { at, dur: dur * 0.85, peak: noisePeak, freq: noiseFreq, type: "lowpass", attack: attack * 0.6 });
}

// p = multiplicador de tono (1 normal; >1 más agudo, para "jugar").
const VOICES = {
  // Pájaro genérico: trino agudo repetido, ataque muy rápido — así suena
  // un pío real, no un tono largo y limpio.
  ave: (ctx, at, p) => {
    [0, 0.1, 0.2].forEach((d, i) =>
      glide(ctx, { at: at + d, points: [[0, 2600 * p], [0.045, 3600 * p + i * 180], [0.09, 2900 * p]], dur: 0.09, peak: 0.07, attack: 0.006 })
    );
  },
  // Águila real: no es un "águila grito de película" — es un chillido
  // agudo y fino repetido, "kee-kee-kee", que decae cada vez. Se armó como
  // 3 chillidos cortos descendentes en vez de un solo barrido largo.
  aguila: (ctx, at, p) =>
    [0, 0.22, 0.42].forEach((d, i) =>
      glide(ctx, {
        at: at + d,
        points: [[0, 2700 * p], [0.05, 3100 * p], [0.16, 1900 * p]],
        dur: 0.18,
        type: "sawtooth",
        peak: 0.085 - i * 0.015,
        attack: 0.01,
        filter: { type: "bandpass", freq: 2600, q: 3 },
        vibrato: { rate: 32, depth: 70 },
      })
    ),
  // Búho: "uu-uuú" grave y hueco — dos tonos bajos con filtro pasa-bajos
  // marcado (la resonancia "hueca" de un hoot real) y ataque lento.
  buho: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 390 * p], [0.2, 340 * p]], dur: 0.26, peak: 0.13, attack: 0.05, filter: { type: "lowpass", freq: 700, q: 2 }, vibrato: { rate: 5, depth: 8 } });
    glide(ctx, { at: at + 0.34, points: [[0, 370 * p], [0.34, 300 * p]], dur: 0.42, peak: 0.13, attack: 0.06, filter: { type: "lowpass", freq: 650, q: 2 }, vibrato: { rate: 5, depth: 8 } });
  },
  // Mariposa: en la vida real no hace ningún sonido audible — se deja el
  // "tintineo" inventado y juguetón de siempre, solo un poco más ligero.
  mariposa: (ctx, at, p) =>
    [1568, 2093, 2637].forEach((f, i) => glide(ctx, { at: at + i * 0.07, points: [[0, f * p], [0.18, f * p]], dur: 0.22, type: "triangle", peak: 0.045 })),
  // Gato: maullido — barrido de tono suave con un formante nasal (filtro
  // pasabanda en vez de pasabajos) y un toque de aspereza (ruido muy
  // bajito encima) para que no suene a silbido limpio.
  gato: (ctx, at, p) => {
    glide(ctx, {
      at,
      points: [[0, 440 * p], [0.18, 760 * p], [0.5, 410 * p]],
      dur: 0.55,
      type: "sawtooth",
      peak: 0.065,
      attack: 0.07,
      filter: { type: "bandpass", freq: 1500, q: 3 },
      vibrato: { rate: 7, depth: 14 },
    });
    noise(ctx, { at: at + 0.05, dur: 0.4, peak: 0.012, freq: 1800, type: "bandpass", attack: 0.08 });
  },
  // Tigre: gruñido/"chuff" grave, con mucho ruido de pecho (más sucio que
  // tonal) y un sub-armónico para que se sienta grande, no agudo.
  tigre: (ctx, at, p) =>
    growl(ctx, { at, points: [[0, 100 * p], [0.55, 68 * p]], dur: 0.65, peak: 0.085, attack: 0.09, filter: { freq: 450, to: 280 }, vibrato: { rate: 20, depth: 14 }, noisePeak: 0.055, noiseFreq: 350 }),
  // León: rugido — el mismo tratamiento que el tigre pero más largo, más
  // grave al final y con más ruido (la parte "rasposa" del rugido real).
  leon: (ctx, at, p) =>
    growl(ctx, { at, points: [[0, 150 * p], [0.22, 185 * p], [0.8, 72 * p]], dur: 0.85, peak: 0.095, attack: 0.07, filter: { freq: 650, to: 320 }, vibrato: { rate: 16, depth: 18 }, noisePeak: 0.065, noiseFreq: 450 }),
  // Perro: ladrido — ataque casi instantáneo, estallido de ruido ancho al
  // inicio (el "golpe" de un ladrido real) y caída de tono rápida y
  // marcada, no un tono limpio. Dos ladridos cortos.
  perro: (ctx, at, p) => {
    [0, 0.19].forEach((d) => {
      noise(ctx, { at: at + d, dur: 0.05, peak: 0.075, freq: 2200, q: 1, type: "bandpass", attack: 0.002 });
      glide(ctx, { at: at + d, points: [[0, 420 * p], [0.09, 190 * p]], dur: 0.12, type: "square", peak: 0.065, attack: 0.003, filter: { type: "lowpass", freq: 1500, to: 700 } });
    });
  },
  // Zorro: el grito-"yip" agudo y un poco ronco de un zorro real, no un
  // trino limpio — ataque muy rápido y una capa de ruido fino para la
  // aspereza del chillido.
  zorro: (ctx, at, p) =>
    [0, 0.15].forEach((d) => {
      glide(ctx, { at: at + d, points: [[0, 1000 * p], [0.04, 1600 * p], [0.13, 700 * p]], dur: 0.15, type: "triangle", peak: 0.085, attack: 0.004 });
      noise(ctx, { at: at + d, dur: 0.08, peak: 0.02, freq: 2200, type: "bandpass", attack: 0.004 });
    }),
  // Koala: el bramido grave y ronco de un koala macho real — muy grave,
  // áspero (casi un ronquido de motor), nada que ver con el silbido
  // agudo de antes. Tono muy bajo + mucho ruido + vibrato lento e
  // irregular para la aspereza.
  koala: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 85 * p], [0.3, 60 * p], [0.55, 50 * p]], dur: 0.6, type: "sawtooth", peak: 0.09, attack: 0.1, filter: { type: "lowpass", freq: 320, to: 180 }, vibrato: { rate: 9, depth: 10 } });
    noise(ctx, { at, dur: 0.55, peak: 0.05, freq: 220, type: "lowpass", attack: 0.08 });
  },
  // Panda: balido/gruñido corto y suave — se deja parecido, es ya una
  // forma razonable del sonido real (no es un rugido, es más un berrido).
  panda: (ctx, at, p) =>
    glide(ctx, { at, points: [[0, 230 * p], [0.16, 330 * p], [0.38, 260 * p]], dur: 0.42, type: "triangle", peak: 0.1, attack: 0.05 }),
  // Pez: no hace sonido audible para nosotros — burbujas inventadas, se
  // dejan igual (es la broma a propósito, no un intento de realismo).
  pez: (ctx, at, p) =>
    [0, 0.12, 0.26].forEach((d, i) =>
      glide(ctx, { at: at + d, points: [[0, (300 + i * 120) * p], [0.07, (850 + i * 150) * p]], dur: 0.09, peak: 0.09, attack: 0.005 })
    ),
  // Pulpo: tampoco tiene voz — burbujas, igual que el pez.
  pulpo: (ctx, at, p) =>
    [0, 0.18].forEach((d) =>
      glide(ctx, { at: at + d, points: [[0, 220 * p], [0.1, 620 * p]], dur: 0.14, peak: 0.1, attack: 0.01, filter: { freq: 900 } })
    ),
  // Ajolote: tampoco tiene voz — se le agrega un puntito de ruido de agua
  // ("blub") al chirrido inventado, para que se sienta más acuático.
  ajolote: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 1400 * p], [0.07, 2000 * p], [0.16, 1600 * p]], dur: 0.18, peak: 0.07, attack: 0.01 });
    noise(ctx, { at: at + 0.02, dur: 0.1, peak: 0.015, freq: 500, type: "lowpass", attack: 0.02 });
  },
  // Tortuga: casi muda en la vida real — a lo mucho un resuello/gruñido
  // suave. Se le agrega un resuello (ruido tenue) junto al tono grave de
  // siempre, para que no suene a silbido puro.
  tortuga: (ctx, at, p) => {
    glide(ctx, { at, points: [[0, 230 * p], [0.4, 195 * p]], dur: 0.45, type: "triangle", peak: 0.09, attack: 0.09 });
    noise(ctx, { at: at + 0.05, dur: 0.3, peak: 0.02, freq: 450, type: "lowpass", attack: 0.1 });
  },
  // Dragón (fantástico): rugido de cine — mismo tratamiento "growl" que
  // león/tigre, con un filtro que baja más (más metálico/fantástico).
  dragon: (ctx, at, p) =>
    growl(ctx, { at, points: [[0, 160 * p], [0.18, 220 * p], [0.6, 90 * p]], dur: 0.65, peak: 0.08, attack: 0.05, filter: { freq: 900, to: 400 }, vibrato: { rate: 26, depth: 16 }, noisePeak: 0.045, noiseFreq: 600 }),
  // Dinosaurio (fantástico): igual, un poco más corto y seco.
  dinosaurio: (ctx, at, p) =>
    growl(ctx, { at, points: [[0, 220 * p], [0.14, 270 * p], [0.5, 110 * p]], dur: 0.55, peak: 0.08, attack: 0.035, filter: { freq: 1100, to: 550 }, vibrato: { rate: 21, depth: 18 }, noisePeak: 0.04, noiseFreq: 750 }),
  // Planta: no tiene voz — se sube un poco el ruido (más "hojas", menos
  // tono) para que se sienta más vegetal que musical.
  planta: (ctx, at, p) => {
    noise(ctx, { at, dur: 0.3, peak: 0.065, freq: 3200, q: 0.7, attack: 0.04 });
    glide(ctx, { at: at + 0.14, points: [[0, 1320 * p], [0.15, 1760 * p]], dur: 0.2, type: "triangle", peak: 0.045 });
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
