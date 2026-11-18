import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { todayKey, daysBetween } from "./streak.js";
import { capsuleForKey } from "./scienceCapsules.js";
import { tint } from "./theme";

// 17 de noviembre de 2026 ("los datos sobre TDAH quiero que este más a la
// vista"): la cápsula completa seguía viviendo hasta el fondo de Progreso →
// "Mi semana", después del tarro de logros y de los insights de Plus — lo
// último que alguien ve, si llega a verlo. Se probaron dos mockups
// (tarjeta completa en Inicio vs. chip-resumen en Inicio + contenido
// completo en Progreso) y la doctora eligió el chip ("opción 3"): este
// componente es ESE chip — vive arriba en Inicio, muestra solo el título
// del día, y al tocarlo lleva a la cápsula completa en Progreso (ver
// `onOpen`, conectado a scrollToCompanionSection("insights") en
// FocusFlowTDAH.jsx). No duplica el diagrama ni el texto largo — eso
// vive una sola vez, en ScienceCapsulePanel.jsx.
export default function ScienceCapsuleTeaser({ C, t, onOpen }) {
  const capsule = capsuleForKey(todayKey(), daysBetween);
  if (!capsule) return null;
  const content = t.scienceCapsuleContent[capsule.id];
  if (!content) return null;
  const accent = C.amber;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        textAlign: "left",
        background: `linear-gradient(135deg, ${tint(accent, 0.16)}, ${tint(accent, 0.05)})`,
        border: `1px solid ${tint(accent, 0.3)}`,
        borderRadius: "16px",
        padding: "12px 14px",
        marginTop: "10px",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "11px",
          flexShrink: 0,
          background: `linear-gradient(135deg, ${tint(accent, 0.35)}, ${tint(accent, 0.15)})`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BookOpen size={17} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "11.5px", fontWeight: 700, color: accent, marginBottom: "2px" }}>{t.scienceCapsule.title}</div>
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 700,
            color: C.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {content.title}
        </div>
      </div>
      <ChevronRight size={16} color={C.textMuted} style={{ flexShrink: 0 }} />
    </button>
  );
}
