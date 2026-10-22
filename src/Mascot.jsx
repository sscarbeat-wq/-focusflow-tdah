import React from "react";
import { Flame, Trophy } from "lucide-react";

// Mascota simple basada en emoji + CSS — sin dependencias nuevas ni assets
// externos. Evoluciona según la racha actual. Pensada para poder cambiarse
// después por ilustraciones propias sin tocar la lógica del resto de la app.
// Los textos (label/hint) viven en el diccionario de idioma (t.mascot) — acá
// solo queda el emoji y el umbral de días, que no cambian con el idioma.
const STAGES = [
  { min: 0, emoji: "🥚", labelKey: "stageEggLabel", hintKey: "stageEggHint" },
  { min: 1, emoji: "🐣", labelKey: "stageHatchlingLabel", hintKey: "stageHatchlingHint" },
  { min: 3, emoji: "🐥", labelKey: "stageChickLabel", hintKey: "stageChickHint" },
  { min: 7, emoji: "🦜", labelKey: "stageBirdLabel", hintKey: "stageBirdHint" },
  { min: 14, emoji: "🦉", labelKey: "stageOwlLabel", hintKey: "stageOwlHint" },
  { min: 30, emoji: "🐉", labelKey: "stageDragonLabel", hintKey: "stageDragonHint" },
];

// Mensaje cuando la racha se acaba de reiniciar (current en 0 pero longest
// > 0, es decir, ya había tenido una racha antes) — a propósito distinto del
// de "nunca empezó" (longest también en 0): reiniciar una racha no es lo
// mismo que no haber empezado nunca, y no hay razón para que se sienta
// igual. Nada de lenguaje de "perdiste" o "rompiste" — eso alimenta el
// rechazo a la sensibilidad al rechazo (RSD) común en TDAH, que ya está
// documentado como consideración de diseño en otras partes de la app
// (Compañero de apoyo, Ayuda con mensajes).
const RESET_STAGE = { emoji: "🥚", labelKey: "resetLabel", hintKey: "resetHint" };

function stageFor(current, longest) {
  if (current === 0 && longest > 0) return RESET_STAGE;
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (current >= s.min) stage = s;
  }
  return stage;
}

export default function Mascot({ streak, C, t }) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const stage = stageFor(current, longest);
  const label = t.mascot[stage.labelKey];
  const hint = t.mascot[stage.hintKey];

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
        flexWrap: "wrap",
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
        <div style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>{label}</div>
        <div style={{ fontSize: "12px", color: C.textMuted }}>{hint}</div>
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
        <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.dayWord(current)}</span>
      </div>
      {longest > 0 && (
        <div
          title={t.mascot.bestStreakTitle}
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
          <Trophy size={16} color={C.lavender} />
          <span style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{longest}</span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.bestStreakLabel}</span>
        </div>
      )}
    </div>
  );
}
