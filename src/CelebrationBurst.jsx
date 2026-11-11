import React, { useEffect, useRef, useState } from "react";

// Estallido de festejo (10 de noviembre de 2026, "más interactiva" —
// celebraciones): confeti y estrellitas que salen del centro de la mascota
// y se apagan solos en ~1.3s. Dos tamaños:
//   - "small": al ganar puntos (terminar un paso, registrar ánimo...).
//     Pocas chispitas, rápido — puede pasar muchas veces al día.
//   - "big": al subir la racha del día o cuando la mascota crece de etapa.
// `signal` es un contador que el padre incrementa (mismo patrón que
// tapSignal/eatSignal en MascotSprite.jsx): cada número nuevo = un
// estallido nuevo; el primer valor (al montar) nunca festeja.
// Sin dependencias: cada partícula es un <span> con su ángulo/distancia en
// variables CSS. Con prefers-reduced-motion no se dibuja nada (es puro
// movimiento; el festejo ya se nota por el sonido y el texto de puntos).

const DEFAULT_COLORS = ["#FF6B57", "#F5A524", "#1FAF7A", "#2E90FA", "#9B5CF6", "#EC4899"];

function makeParticles(size, colors) {
  const count = size === "big" ? 30 : 12;
  const reach = size === "big" ? [70, 150] : [45, 90];
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = reach[0] + Math.random() * (reach[1] - reach[0]);
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - (size === "big" ? 20 : 10),
      rot: Math.round(Math.random() * 540 - 270),
      color: colors[i % colors.length],
      star: i % 3 === 0,
      delay: Math.random() * 0.12,
      w: 6 + Math.random() * 5,
    };
  });
}

export default function CelebrationBurst({ signal = 0, size = "small", colors = DEFAULT_COLORS }) {
  const [bursts, setBursts] = useState([]);
  const first = useRef(true);
  const reduced =
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (reduced) return undefined;
    const id = `${Date.now()}-${Math.random()}`;
    setBursts((prev) => [...prev, { id, particles: makeParticles(size, colors) }]);
    const tm = setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1500);
    return () => clearTimeout(tm);
  }, [signal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bursts.length) return null;
  return (
    <span
      aria-hidden="true"
      className="anro-burst"
      style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, pointerEvents: "none", zIndex: 6 }}
    >
      <style>{`
        .anro-burst-p { position: absolute; left: 0; top: 0; border-radius: 2px; opacity: 0;
          animation: anroBurstFly 1.25s cubic-bezier(.15,.7,.3,1) forwards; }
        .anro-burst-star { border-radius: 0; background: transparent !important; font-size: 14px; line-height: 1; }
        @keyframes anroBurstFly {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(.4) rotate(0deg); }
          12% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 26px)) scale(1) rotate(var(--rot)); }
        }
      `}</style>
      {bursts.map((b) =>
        b.particles.map((p) => (
          <span
            key={`${b.id}-${p.id}`}
            className={`anro-burst-p${p.star ? " anro-burst-star" : ""}`}
            style={{
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}s`,
              width: p.star ? "auto" : `${p.w}px`,
              height: p.star ? "auto" : `${p.w * 0.55}px`,
              background: p.color,
              color: p.color,
            }}
          >
            {p.star ? "★" : null}
          </span>
        ))
      )}
    </span>
  );
}
