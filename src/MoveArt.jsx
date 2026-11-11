import React, { useState } from "react";
import MoveFigure from "./MoveFigure";

// Ilustración de cada movimiento de la Pausa activa (12–13 de noviembre de
// 2026). Las 18 imágenes se generaron con Gemini y viven en /public como
// `pausa-<movimiento>.webp`. Los movimientos que van de un lado al otro
// (cuello, giros…) se voltean como espejo, y los que tienen dos poses
// distintas (brazos arriba/abajo, sentadilla…) alternan entre la imagen A
// y la B (`pausa-<movimiento>-b.webp`). Para respirar/enfriar se añade un
// círculo que crece y se encoge detrás de la figura.

// ---- MOTION: leve movimiento CSS por defecto (single-frame) ----
const MOTION = {
  armsUp: ["lift", 4],
  shoulders: ["lift", 2.4],
  shouldersBack: ["lift", 2.4],
  sideBend: ["sway", 5],
  twist: ["sway", 3],
  chairTwist: ["sway", 3.4],
  neck: ["breathe", 7],
  wrists: ["sway", 2.4],
  seatedLegs: ["sway", 3.2],
  breathe: ["breathe", 6.5],
  coolDown: ["breathe", 6.5],
  eyesClosed: ["breathe", 6],
  eyesFar: ["breathe", 5],
  march: ["bounce", 0.7],
  jacks: ["bounce", 0.85],
  squat: ["dip", 2.6],
  punches: ["jab", 0.55],
  shake: ["jitter", 0.24],
};

// ---- FLIP: espejo de lado a lado (13 nov, "se queda en el mismo hombro") ----
const FLIP = {
  neck: 7,
  sideBend: 6,
  twist: 3.5,
  chairTwist: 4.5,
  seatedLegs: 5,
  wrists: 7,
  march: 0.7,
  punches: 0.55,
};

// ---- FRAMES: dos imágenes que se alternan (13 nov, "procura que se muevan
// con lo que dice la instrucción"). La -b.webp es el frame neutro. ----
// [duración del ciclo completo en segundos]
const FRAMES = {
  armsUp: 3.2,     // brazos arriba ↔ abajo
  shoulders: 2.6,  // hombros encogidos ↔ relajados
  squat: 2.8,      // sentadilla ↔ de pie
  jacks: 1.0,      // abierto ↔ cerrado (rápido)
  eyesClosed: 5,   // ojos cerrados ↔ abiertos (lento, parpadeo)
  shouldersBack: 2.8, // sentado hombros atrás ↔ relajado
};

// ---- CIRCLE: círculo de respiración ("mientras el círculo crece…") ----
const CIRCLE = { breathe: 6.5, coolDown: 6.5 };

const KEYFRAMES = `
@keyframes anro-art-flipfade{0%{transform:scaleX(1);opacity:0}4%,46%{transform:scaleX(1);opacity:1}50%{transform:scaleX(1);opacity:0}50.01%{transform:scaleX(-1);opacity:0}54%,96%{transform:scaleX(-1);opacity:1}100%{transform:scaleX(-1);opacity:0}}
@keyframes anro-art-flipstep{0%,49.99%{transform:scaleX(1)}50%,100%{transform:scaleX(-1)}}
@keyframes anro-art-lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
@keyframes anro-art-sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes anro-art-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes anro-art-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4%)}}
@keyframes anro-art-dip{0%,100%{transform:translateY(0)}50%{transform:translateY(4%)}}
@keyframes anro-art-jab{0%,100%{transform:translateX(-2%)}50%{transform:translateX(2%)}}
@keyframes anro-art-jitter{0%,100%{transform:translateX(-1.2%)}50%{transform:translateX(1.2%)}}
@keyframes anro-art-swapA{0%,42%{opacity:1}50%,92%{opacity:0}100%{opacity:1}}
@keyframes anro-art-swapB{0%,42%{opacity:0}50%,92%{opacity:1}100%{opacity:0}}
@keyframes anro-art-circle{0%,100%{transform:translate(-50%,-50%) scale(0.55);opacity:0.5}50%{transform:translate(-50%,-50%) scale(1.1);opacity:0.18}}
`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MoveArt({ moveKey, fig, seated, color, running = true, size = 180 }) {
  const [failed, setFailed] = useState(false);
  const [bFailed, setBFailed] = useState(false);
  if (failed) return <MoveFigure type={fig} seated={seated} color={color} running={running} size={size} />;

  const [motion, dur] = MOTION[moveKey] || ["breathe", 6];
  const animate = !prefersReducedMotion();
  const side = FLIP[moveKey];
  const frameDur = FRAMES[moveKey];
  const circleDur = CIRCLE[moveKey];
  const hasFrames = frameDur && !bFailed;

  const flipName = side && side >= 2 && animate ? "anro-art-flipfade" : "anro-art-flipstep";
  const playState = running ? "running" : "paused";

  // Imagen A (la pose del movimiento)
  const imgA = (
    <img
      src={`/pausa-${moveKey}.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      style={{
        display: "block",
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        transformOrigin: "50% 100%",
        position: hasFrames ? "absolute" : "relative",
        top: 0,
        left: 0,
        animation: hasFrames
          ? `anro-art-swapA ${frameDur}s ease-in-out infinite`
          : animate ? `anro-art-${motion} ${dur}s ease-in-out infinite` : "none",
        animationPlayState: playState,
        userSelect: "none",
      }}
    />
  );

  // Imagen B (la pose neutra, solo para los que tienen FRAMES)
  const imgB = frameDur && (
    <img
      src={`/pausa-${moveKey}-b.webp`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      onError={() => setBFailed(true)}
      style={{
        display: bFailed ? "none" : "block",
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        transformOrigin: "50% 100%",
        position: "absolute",
        top: 0,
        left: 0,
        opacity: 0,
        animation: `anro-art-swapB ${frameDur}s ease-in-out infinite`,
        animationPlayState: playState,
        userSelect: "none",
      }}
    />
  );

  // Círculo de respiración para breathe / coolDown
  const circle = circleDur && animate && (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: `${size * 0.7}px`,
        height: `${size * 0.7}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color || "#3F9C82"}44, ${color || "#3F9C82"}11)`,
        border: `2px solid ${color || "#3F9C82"}33`,
        animation: `anro-art-circle ${circleDur}s ease-in-out infinite`,
        animationPlayState: playState,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );

  return (
    <>
      <style>{KEYFRAMES}</style>
      <span
        style={{
          display: "block",
          width: `${size}px`,
          height: `${size}px`,
          position: "relative",
          animation: side ? `${flipName} ${side * 2}s linear infinite` : "none",
          animationPlayState: playState,
        }}
      >
        {circle}
        {imgA}
        {imgB}
      </span>
    </>
  );
}
