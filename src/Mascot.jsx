import React from "react";
import { Flame } from "lucide-react";

// Mascota simple basada en emoji + CSS — sin dependencias nuevas ni assets
// externos. Evoluciona según la racha actual. Pensada para poder cambiarse
// después por ilustraciones propias sin tocar la lógica del resto de la app.
const STAGES = [
  { min: 0, emoji: "🥚", label: "Listo para empezar", hint: "Completa algo hoy para incubar tu racha." },
  { min: 1, emoji: "🐣", label: "Recién nacido", hint: "Día 1 — vuelve mañana para que siga creciendo." },
  { min: 3, emoji: "🐥", label: "Creciendo", hint: "3+ días seguidos." },
  { min: 7, emoji: "🦜", label: "Tomando vuelo", hint: "¡Una semana completa!" },
  { min: 14, emoji: "🦉", label: "Enfocado y sabio", hint: "2 semanas de constancia." },
  { min: 30, emoji: "🐉", label: "Imparable", hint: "30+ días — nivel leyenda." },
];

function stageFor(count) {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (count >= s.min) stage = s;
  }
  return stage;
}

export default function Mascot({ streak, C }) {
  const current = streak?.current || 0;
  const stage = stageFor(current);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "6px",
        padding: "14px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          fontSize: "38px",
          lineHeight: 1,
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {stage.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>{stage.label}</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>{stage.hint}</div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          padding: "8px 12px",
          flexShrink: 0,
        }}
      >
        <Flame size={16} color={C.amber} />
        <span style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{current}</span>
        <span style={{ fontSize: "11px", color: C.textMuted }}>{current === 1 ? "día" : "días"}</span>
      </div>
    </div>
  );
}
