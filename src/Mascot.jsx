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

const RING_SIZE = 68;
const RING_RADIUS = 28;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  // festejar justo cuando se perdió la racha).
  const prevEmojiRef = useRef(stage.emoji);
  const isReset = current === 0 && longest > 0;
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (prevEmojiRef.current !== stage.emoji) {
      prevEmojiRef.current = stage.emoji;
      if (!isReset) {
        setCelebrate(true);
        const timeout = setTimeout(() => setCelebrate(false), 900);
        return () => clearTimeout(timeout);
      }
    }
  }, [stage.emoji, isReset]);

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`,
        borderRadius: "24px",
        padding: "18px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
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
        .anro-mascot-emoji {
          display: inline-block;
          animation: anroMascotFloat 3.6s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.18));
        }
        .anro-mascot-emoji.anro-mascot-celebrate {
          animation: anroMascotLevelUp 0.9s ease-in-out;
        }
        .anro-mascot-glow {
          animation: anroMascotGlow 2.8s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .anro-mascot-emoji,
          .anro-mascot-emoji.anro-mascot-celebrate,
          .anro-mascot-glow {
            animation: none !important;
          }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: `${RING_SIZE}px`,
          height: `${RING_SIZE}px`,
          flexShrink: 0,
        }}
      >
        <div
          className="anro-mascot-glow"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
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
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          <span
            className={`anro-mascot-emoji${celebrate ? " anro-mascot-celebrate" : ""}`}
          >
            {stage.emoji}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{label}</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>{hint}</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: tint(C.amber, 0.16),
          borderRadius: "999px",
          padding: "8px 14px",
          flexShrink: 0,
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
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: tint(ringColor, 0.16),
            borderRadius: "999px",
            padding: "8px 14px",
            flexShrink: 0,
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
