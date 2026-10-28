import React, { useEffect, useRef, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { tint } from "./theme";
import { stageFor, progressFraction, DEFAULT_SPECIES } from "./mascotLogic";

// Mascota simple basada en emoji + CSS — sin dependencias nuevas ni assets
// externos. Evoluciona según la racha actual. Pensada para poder cambiarse
// después por ilustraciones propias sin tocar la lógica del resto de la app.
// Los textos (label/hint) viven en el diccionario de idioma (t.mascot) — acá
// solo queda el componente visual; las etapas y el cálculo de progreso
// viven en mascotLogic.js (26 de octubre de 2026, para poder probarlos con
// Node sin pasar por JSX). `species` (27 de octubre de 2026): qué personaje
// eligió la paciente — "ave" si no se manda nada, el mismo que ya veían
// todas las pacientes antes de que existiera la elección.
//
// Animación (27 de octubre de 2026, a petición de la doctora: "más
// estilizados, que hagan movimientos"): sin un generador de ilustraciones
// disponible en este espacio de trabajo, el camino es CSS puro sobre el
// mismo emoji — nada de assets nuevos. Dos movimientos, pensados para no
// sobrecargar (la mascota se ve todo el día, en cada visita a la pantalla
// principal):
//   1. Flotación/respiración constante, muy sutil (3px, ~3.6s) — da
//      sensación de "viva" sin llamar la atención de más.
//   2. Festejo breve de "subió de nivel" (rotación + escala, ~0.9s) que se
//      dispara SOLO cuando el emoji de etapa cambia hacia adelante (nunca en
//      el reset — ahí no tiene sentido festejar). Coincide con el patrón ya
//      usado en el resto de la app: base calmada el día a día, explosión
//      breve en el momento de logro.
// Ambas respetan `prefers-reduced-motion: reduce` (se desactivan por
// completo), igual que la sensibilidad a sobreestimulación que ya se tomó
// en cuenta para el resto del diseño.
//
// Segunda pasada (27 de octubre de 2026, a petición de la doctora: "diseño
// bonito, que no se vea tan plana, y la mascota más grande, y que [la
// mascota] salga de un huevo"):
//   - Mascota más grande: el anillo pasó de 68px a 112px y el emoji de 32px
//     a 56px — sigue siendo el mismo componente, solo más protagonista.
//   - "Que no se vea tan plana": la tarjeta ya tenía un degradado sutil;
//     ahora suma una mancha de luz de color (el acento de racha, difuminada
//     de fondo), una sombra de dos capas para que se sienta "levantada" en
//     vez de pegada a la pantalla, y una sombra de "piso" debajo del
//     círculo para que la mascota se sienta apoyada en algo, no flotando
//     sobre la nada.
//   - "Que salga de un huevo": todas las especies que empiezan en huevo
//     (ave, dragón, pez — el pez es el que termina en 🐋) ya llegaban ahí
//     por lógica (mascotLogic.js), pero el cambio de huevo a la siguiente
//     etapa pasaba exactamente igual que cualquier otro festejo de racha,
//     sin distinguirse. Ahora ese momento específico (huevo → algo vivo)
//     tiene su propia animación de "eclosión": el huevo tiembla, se
//     encoge como si se rompiera, y el animal aparece con un rebote y un
//     par de chispitas — en vez de solo el festejo genérico de subir de
//     nivel. Las especies que no empiezan en huevo (gato, planta, perro)
//     conservan el festejo genérico de siempre.
// Todo lo nuevo respeta `prefers-reduced-motion: reduce` igual que antes.

const RING_SIZE = 112;
const RING_RADIUS = 46;
const RING_STROKE = 8;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const EGG_EMOJI = "🥚";

export default function Mascot({ streak, C, t, accent, species }) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const stage = stageFor(current, longest, species || DEFAULT_SPECIES);
  const label = t.mascot[stage.labelKey];
  const hint = t.mascot[stage.hintKey];
  const ringColor = accent || C.lavender;
  const fraction = progressFraction(current, longest);
  const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);

  // Festejo de "subió de nivel" — se dispara solo cuando el emoji de la
  // etapa cambia de un render al siguiente (no en cada render), y nunca en
  // el reset de racha (ahí el emoji también cambia, pero sería raro
  // festejar justo cuando se perdió la racha). Si la etapa anterior era un
  // huevo, el festejo es la animación de eclosión en vez de la genérica.
  const prevEmojiRef = useRef(stage.emoji);
  const isReset = current === 0 && longest > 0;
  const [celebrate, setCelebrate] = useState(false);
  const [hatching, setHatching] = useState(false);

  useEffect(() => {
    if (prevEmojiRef.current !== stage.emoji) {
      const wasEgg = prevEmojiRef.current === EGG_EMOJI;
      prevEmojiRef.current = stage.emoji;
      if (!isReset) {
        if (wasEgg) {
          setHatching(true);
          const timeout = setTimeout(() => setHatching(false), 1100);
          return () => clearTimeout(timeout);
        }
        setCelebrate(true);
        const timeout = setTimeout(() => setCelebrate(false), 900);
        return () => clearTimeout(timeout);
      }
    }
  }, [stage.emoji, isReset]);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`,
        borderRadius: "24px",
        padding: "20px 22px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <style>{`
        @keyframes anroMascotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes anroMascotGlow {
          0%, 100% { opacity: 0.32; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes anroMascotLevelUp {
          0% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.32) rotate(-8deg); }
          55% { transform: scale(0.95) rotate(6deg); }
          80% { transform: scale(1.08) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes anroMascotHatch {
          0% { transform: scale(1) rotate(0deg); }
          14% { transform: scale(0.92) rotate(-10deg); }
          28% { transform: scale(0.94) rotate(9deg); }
          42% { transform: scale(0.88) rotate(-7deg); }
          54% { transform: scale(0.25) rotate(0deg); opacity: 0.35; }
          70% { transform: scale(1.4) rotate(5deg); opacity: 1; }
          85% { transform: scale(0.93) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes anroMascotSparkA {
          0%, 54% { transform: translate(0, 0) scale(0); opacity: 0; }
          68% { transform: translate(-24px, -20px) scale(1); opacity: 1; }
          100% { transform: translate(-38px, -34px) scale(0.3); opacity: 0; }
        }
        @keyframes anroMascotSparkB {
          0%, 54% { transform: translate(0, 0) scale(0); opacity: 0; }
          68% { transform: translate(26px, -16px) scale(1); opacity: 1; }
          100% { transform: translate(42px, -30px) scale(0.3); opacity: 0; }
        }
        .anro-mascot-emoji {
          display: inline-block;
          animation: anroMascotFloat 3.6s ease-in-out infinite;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
        }
        .anro-mascot-emoji.anro-mascot-celebrate {
          animation: anroMascotLevelUp 0.9s ease-in-out;
        }
        .anro-mascot-emoji.anro-mascot-hatch {
          animation: anroMascotHatch 1.1s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .anro-mascot-glow {
          animation: anroMascotGlow 2.8s ease-in-out infinite;
        }
        .anro-mascot-spark {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: 20px;
          opacity: 0;
          pointer-events: none;
        }
        .anro-mascot-spark-a {
          animation: anroMascotSparkA 1.1s ease-out;
        }
        .anro-mascot-spark-b {
          animation: anroMascotSparkB 1.1s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .anro-mascot-emoji,
          .anro-mascot-emoji.anro-mascot-celebrate,
          .anro-mascot-emoji.anro-mascot-hatch,
          .anro-mascot-glow,
          .anro-mascot-spark-a,
          .anro-mascot-spark-b {
            animation: none !important;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint(ringColor, 0.22)} 0%, transparent 70%)`,
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          width: `${RING_SIZE}px`,
          height: `${RING_SIZE + 10}px`,
          flexShrink: 0,
        }}
      >
        <div
          className="anro-mascot-glow"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${RING_SIZE}px`,
            height: `${RING_SIZE}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tint(ringColor, 0.35)} 0%, transparent 70%)`,
          }}
        />
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={C.surfaceAlt}
            strokeWidth={RING_STROKE}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${RING_SIZE}px`,
            height: `${RING_SIZE}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "56px",
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          <span
            className={`anro-mascot-emoji${celebrate ? " anro-mascot-celebrate" : ""}${
              hatching ? " anro-mascot-hatch" : ""
            }`}
          >
            {stage.emoji}
          </span>
          {hatching && (
            <>
              <span className="anro-mascot-spark anro-mascot-spark-a" aria-hidden="true">
                ✨
              </span>
              <span className="anro-mascot-spark anro-mascot-spark-b" aria-hidden="true">
                ✨
              </span>
            </>
          )}
        </div>
        {/* Sombra de "piso" — sensación de que la mascota está apoyada en
            algo, no flotando en el vacío. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "0px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "58%",
            height: "10px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.28), transparent 72%)",
            filter: "blur(1px)",
          }}
        />
      </div>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{label}</div>
        <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "2px" }}>{hint}</div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: tint(C.amber, 0.16),
          borderRadius: "999px",
          padding: "8px 14px",
          flexShrink: 0,
          boxShadow: `0 3px 8px ${tint(C.amber, 0.25)}`,
        }}
      >
        <Flame size={16} color={C.amber} />
        <span style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{current}</span>
        <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.dayWord(current)}</span>
      </div>
      {longest > 0 && (
        <div
          title={t.mascot.bestStreakTitle}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: tint(ringColor, 0.16),
            borderRadius: "999px",
            padding: "8px 14px",
            flexShrink: 0,
            boxShadow: `0 3px 8px ${tint(ringColor, 0.25)}`,
          }}
        >
          <Trophy size={16} color={ringColor} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{longest}</span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.bestStreakLabel}</span>
        </div>
      )}
    </div>
  );
}
