import React, { useEffect, useRef, useState } from "react";
import { parseImageVisual, mascotSheetPath, mascotFrame, posesFor, SHEET_COLUMNS, SHEET_ROWS } from "./mascotLogic";

// Mascotas con ilustración real (10 de noviembre de 2026) — ver
// IMAGE_SPECIES en mascotLogic.js.
//
// Dos piezas:
//   - <MascotArt>: dibujo ESTÁTICO de cualquier mascota (emoji o
//     ilustración) — para el selector, el botón del encabezado, la vista
//     previa de etapas. Recibe el mismo STRING que ya viaja por todo el
//     código (stage.emoji / matureEmoji): si es un emoji lo imprime tal
//     cual; si es "img:<especie>:<etapa>" dibuja la imagen.
//   - <MascotSprite>: la mascota VIVA del centro de la brújula. Replica el
//     comportamiento de los prototipos "<animal>-movimiento-real.html" que
//     la doctora ya vio y aprobó: respira en reposo y parpadea (cambia un
//     instante a la imagen de ojos cerrados), camina sola de vez en cuando
//     (alterna las 2 imágenes de paso), se duerme si nadie la toca en un
//     rato (imagen dormida + "Zzz"), saluda al tocarla (salto + chispitas),
//     juega con un doble toque, y come cada vez que la paciente gana
//     puntos — así ganar "foco acumulado" se ve, no solo se cuenta.
//     Todo respeta prefers-reduced-motion: sin saltos ni caminatas, solo
//     cambia de imagen (dormida, comiendo...), que no es movimiento.

export function MascotArt({ visual, size = 40, pose = "a", style, alt = "" }) {
  const parsed = parseImageVisual(visual);
  if (parsed) {
    // Un cuadro de la imagen-cuadrícula del personaje (ver mascotSheetPath
    // en mascotLogic.js): la imagen completa escalada a size×columnas y
    // desplazada para que solo se vea el cuadro de esta etapa y pose.
    const { row, col } = mascotFrame(parsed.group, pose);
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : "true"}
        className="anro-mascot-frame"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: "block",
          backgroundImage: `url(${mascotSheetPath(parsed.species)})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${size * SHEET_COLUMNS}px ${size * SHEET_ROWS}px`,
          backgroundPosition: `${-col * size}px ${-row * size}px`,
          ...style,
        }}
      />
    );
  }
  return (
    // Sin el "✨" de la etapa final: en tamaño chico (selector, encabezado)
    // se veía amontonado junto al emoji. En el centro de la brújula se
    // sigue viendo (ahí lo dibuja <MascotSprite>, no esta función).
    <span aria-hidden={alt ? undefined : "true"} style={{ fontSize: `${size * 0.6}px`, lineHeight: 1, whiteSpace: "nowrap", ...style }}>
      {typeof visual === "string" ? visual.replace(/✨/g, "") : visual}
    </span>
  );
}

const IDLE_TO_SLEEP_MS = 45000;
const GREET_MS = 800;
const GESTURE_MS = 2200;
const WALK_MS = 3200;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

// tapSignal / playSignal / eatSignal: números que el padre incrementa para
// pedir "saluda", "juega", "come" — un contador en vez de un booleano para
// que dos pedidos seguidos iguales también se noten.
export function MascotSprite({ visual, size = 80, tapSignal = 0, playSignal = 0, eatSignal = 0, walking = false }) {
  const parsed = parseImageVisual(visual);
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState("idle"); // idle | walk | sleep | greet | eat | play
  const [blink, setBlink] = useState(false);
  const timers = useRef({});
  // Un personaje de emoji no tiene poses, pero sí puede "comer" (aparece
  // la fresita junto a él) — ver la rama `!parsed` del render.
  const poses = parsed ? posesFor(parsed.group) : ["eat"];
  const has = (p) => poses.includes(p);

  const clear = (name) => {
    if (timers.current[name]) {
      clearTimeout(timers.current[name]);
      timers.current[name] = null;
    }
  };
  const later = (name, ms, fn) => {
    clear(name);
    timers.current[name] = setTimeout(() => {
      timers.current[name] = null;
      fn();
    }, ms);
  };
  // Cualquier interacción reinicia la cuenta para dormirse.
  const scheduleSleep = () => later("sleep", IDLE_TO_SLEEP_MS, () => setMode("sleep"));
  const backToIdle = (ms) =>
    later("gesture", ms, () => {
      setMode("idle");
      scheduleSleep();
    });
  // Las caminatas espontáneas NO cuentan como interacción: si contaran,
  // reiniciarían la cuenta para dormirse y nunca llegaría a dormir.
  const walkBackToIdle = (ms) => later("gesture", ms, () => setMode((m) => (m === "walk" ? "idle" : m)));

  // (Todas las poses viven en la misma imagen del personaje, así que en
  // cuanto carga una ya están todas: cambiar de pose nunca parpadea.)

  // Arranque / cambio de personaje o etapa: despierta y empieza a contar.
  useEffect(() => {
    setMode("idle");
    scheduleSleep();
    return () => Object.keys(timers.current).forEach(clear);
  }, [visual]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parpadeo en reposo (no con movimiento reducido: es un destello).
  useEffect(() => {
    if (!parsed || reducedMotion || mode !== "idle") return undefined;
    let t1;
    let t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => {
          setBlink(false);
          loop();
        }, 150);
      }, 2600 + Math.random() * 2600);
    };
    loop();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      setBlink(false);
    };
  }, [mode, visual, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Caminata espontánea de vez en cuando, para que se sienta viva.
  useEffect(() => {
    if (!parsed || reducedMotion || mode !== "idle" || !has("b")) return undefined;
    const t = setTimeout(() => {
      setMode("walk");
      walkBackToIdle(WALK_MS);
    }, 16000 + Math.random() * 14000);
    return () => clearTimeout(t);
  }, [mode, visual, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras hay una sesión de Modo Enfoque, camina "contigo".
  useEffect(() => {
    if (!parsed || !has("b")) return;
    if (walking) {
      clear("gesture");
      clear("sleep");
      setMode("walk");
    } else if (mode === "walk") {
      setMode("idle");
      scheduleSleep();
    }
  }, [walking]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) return;
    setMode("greet");
    backToIdle(GREET_MS);
  }, [tapSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (firstRender.current) return;
    setMode(has("play") ? "play" : "greet");
    backToIdle(has("play") ? GESTURE_MS : GREET_MS);
  }, [playSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (firstRender.current) return;
    setMode(has("eat") ? "eat" : "greet");
    backToIdle(has("eat") ? GESTURE_MS : GREET_MS);
  }, [eatSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    firstRender.current = false;
  }, []);

  // Personajes de siempre (emoji): mismo saludo/comer, sin cambio de
  // imagen (un emoji no tiene "ojos cerrados" ni poses).
  if (!parsed) {
    return (
      <span className={`anro-sprite anro-sprite-${mode}`} style={{ position: "relative", display: "inline-block" }}>
        <SpriteStyles />
        <span style={{ display: "inline-block" }} className="anro-sprite-body">
          {visual}
        </span>
        {mode === "greet" && <Sparkles />}
        {mode === "eat" && <span className="anro-sprite-nom">🍓</span>}
        {mode === "sleep" && <span className="anro-sprite-zzz">Zzz</span>}
      </span>
    );
  }

  let pose = "a";
  if (mode === "sleep") pose = "sleep";
  else if (mode === "eat") pose = "eat";
  else if (mode === "play") pose = "play";
  else if (mode === "idle" && blink) pose = "sleep";

  return (
    <span
      className={`anro-sprite anro-sprite-${mode}${reducedMotion ? " anro-sprite-still" : ""}`}
      style={{ position: "relative", display: "inline-block", width: `${size}px`, height: `${size}px` }}
    >
      <SpriteStyles />
      {mode === "walk" ? (
        <>
          <MascotArt visual={visual} size={size} pose="a" style={{ position: "absolute", inset: 0 }} />
          <MascotArt visual={visual} size={size} pose="b" style={{ position: "absolute", inset: 0 }} />
        </>
      ) : (
        <MascotArt visual={visual} size={size} pose={pose} style={{ position: "absolute", inset: 0 }} />
      )}
      {mode === "sleep" && <span className="anro-sprite-zzz">Zzz</span>}
      {mode === "greet" && <Sparkles />}
      {mode === "eat" && <span className="anro-sprite-nom">🍓</span>}
      {mode === "play" && <span className="anro-sprite-ball">🎾</span>}
    </span>
  );
}

function Sparkles() {
  return (
    <>
      <span className="anro-sprite-spark anro-sprite-spark-1">✨</span>
      <span className="anro-sprite-spark anro-sprite-spark-2">✨</span>
    </>
  );
}

// Mismas animaciones que los prototipos aprobados (bob, greetPulse,
// floatZ, nomBob, playWiggle...), adaptadas a clases con prefijo propio.
function SpriteStyles() {
  return (
    <style>{`
      .anro-sprite .anro-mascot-frame { transform-origin: center bottom; }
      .anro-sprite-idle .anro-mascot-frame { animation: anroSpriteBob 2.6s ease-in-out infinite; }
      /* hijo 1 = <style>, hijo 2 = pose "a", hijo 3 = pose "b" (segundo paso) */
      .anro-sprite-walk .anro-mascot-frame:nth-child(2) { animation: anroSpriteShowA 0.6s steps(1) infinite, anroSpriteStepA 0.6s steps(1) infinite; }
      .anro-sprite-walk .anro-mascot-frame:nth-child(3) { animation: anroSpriteShowB 0.6s steps(1) infinite, anroSpriteStepB 0.6s steps(1) infinite; }
      .anro-sprite-sleep .anro-mascot-frame { animation: anroSpriteBobSlow 4s ease-in-out infinite; }
      .anro-sprite-greet .anro-mascot-frame, .anro-sprite-greet .anro-sprite-body { animation: anroSpriteGreet 0.8s cubic-bezier(.36,.07,.19,.97); }
      .anro-sprite-eat .anro-mascot-frame, .anro-sprite-eat .anro-sprite-body { animation: anroSpriteNom 0.5s ease-in-out infinite; }
      .anro-sprite-play .anro-mascot-frame { animation: anroSpriteWiggle 0.5s ease-in-out infinite; }
      .anro-sprite-zzz { position: absolute; top: 0; right: 4%; font-weight: 800; font-size: 13px; color: #7C6BAE; pointer-events: none; animation: anroSpriteZ 2.4s ease-in infinite; }
      .anro-sprite-spark { position: absolute; font-size: 14px; pointer-events: none; animation: anroSpriteSpark 0.8s ease-out forwards; }
      .anro-sprite-spark-1 { top: 2%; left: -6%; }
      .anro-sprite-spark-2 { top: -6%; right: 2%; }
      .anro-sprite-nom { position: absolute; bottom: 4%; left: 50%; font-size: 14px; pointer-events: none; animation: anroSpriteNomPop 1.8s ease-in-out infinite; }
      .anro-sprite-ball { position: absolute; top: 0; right: -8%; font-size: 14px; pointer-events: none; animation: anroSpriteBall 1.8s ease-in-out infinite; }
      @keyframes anroSpriteBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5%); } }
      @keyframes anroSpriteBobSlow { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(2%) rotate(-3deg); } }
      @keyframes anroSpriteShowA { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
      @keyframes anroSpriteShowB { 0%,49% { opacity: 0; } 50%,100% { opacity: 1; } }
      @keyframes anroSpriteStepA { 0% { transform: translateY(0); } 50% { transform: translateY(-3%); } }
      @keyframes anroSpriteStepB { 0% { transform: translateY(-3%); } 50% { transform: translateY(0); } }
      @keyframes anroSpriteGreet {
        0% { transform: scale(1) rotate(0deg); }
        15% { transform: scale(1.18) rotate(-7deg); }
        35% { transform: scale(1.08) rotate(6deg); }
        55% { transform: scale(1.14) rotate(-4deg); }
        75% { transform: scale(1.04) rotate(2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      @keyframes anroSpriteNom { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3%) rotate(2deg); } }
      @keyframes anroSpriteWiggle { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
      @keyframes anroSpriteZ { 0% { transform: translate(0,0) scale(0.6); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(8px,-20px) scale(1.1); opacity: 0; } }
      @keyframes anroSpriteSpark { 0% { opacity: 0; transform: scale(0.4) translateY(6px); } 40% { opacity: 1; transform: scale(1.15) translateY(-6px); } 100% { opacity: 0; transform: scale(0.9) translateY(-18px); } }
      @keyframes anroSpriteNomPop { 0%,100% { opacity: 0; transform: translate(-50%,0) scale(0.8); } 50% { opacity: 1; transform: translate(-50%,-6px) scale(1.1); } }
      @keyframes anroSpriteBall { 0%,100% { opacity: 0.6; transform: rotate(0deg) scale(1); } 50% { opacity: 1; transform: rotate(25deg) scale(1.15); } }
      @media (prefers-reduced-motion: reduce) {
        .anro-sprite .anro-mascot-frame, .anro-sprite .anro-sprite-body, .anro-sprite-zzz, .anro-sprite-spark, .anro-sprite-nom, .anro-sprite-ball { animation: none !important; }
        .anro-sprite-walk .anro-mascot-frame:nth-child(3) { opacity: 0; }
      }
    `}</style>
  );
}
