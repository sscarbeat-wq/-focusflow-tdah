import React, { useState } from "react";
import MoveFigure from "./MoveFigure";

// Ilustración de cada movimiento de la Pausa activa (12 de noviembre de
// 2026, "¿puedes hacer mejor los dibujos en Gemini?"). Las 18 imágenes se
// generaron con Gemini (mismo personaje en todas), se recortaron y viven
// sueltas en /public como `pausa-<movimiento>.webp`, igual que las
// mascotas.
//
// Como son imágenes fijas, cada una lleva un movimiento suave por CSS
// (rebota, se inclina, respira…) según el ejercicio, para que no se vea
// congelada. Si la imagen no carga (por ejemplo, si todavía no se subió a
// /public), se muestra en su lugar el muñequito animado de MoveFigure.jsx.
const MOTION = {
  armsUp: ["lift", 4],
  shoulders: ["lift", 2.4],
  shouldersBack: ["lift", 2.4],
  sideBend: ["sway", 5],
  twist: ["sway", 3],
  chairTwist: ["sway", 3.4],
  neck: ["sway", 4.5],
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

const KEYFRAMES = `
@keyframes anro-art-lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
@keyframes anro-art-sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes anro-art-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes anro-art-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4%)}}
@keyframes anro-art-dip{0%,100%{transform:translateY(0)}50%{transform:translateY(4%)}}
@keyframes anro-art-jab{0%,100%{transform:translateX(-2%)}50%{transform:translateX(2%)}}
@keyframes anro-art-jitter{0%,100%{transform:translateX(-1.2%)}50%{transform:translateX(1.2%)}}
`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MoveArt({ moveKey, fig, seated, color, running = true, size = 180 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MoveFigure type={fig} seated={seated} color={color} running={running} size={size} />;
  const [motion, dur] = MOTION[moveKey] || ["breathe", 6];
  const animate = !prefersReducedMotion();
  return (
    <>
      <style>{KEYFRAMES}</style>
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
          animation: animate ? `anro-art-${motion} ${dur}s ease-in-out infinite` : "none",
          animationPlayState: running ? "running" : "paused",
          userSelect: "none",
        }}
      />
    </>
  );
}
