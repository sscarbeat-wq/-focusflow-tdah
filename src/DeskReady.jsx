import React, { useState } from "react";
import { tint } from "./theme";

// "Fuera de la vista, fuera de la mente" (11 de noviembre de 2026). Antes
// era una palomita suelta en el Rastreador de estilo de vida y no se
// entendía para qué servía. Ahora vive en Modo enfoque, como paso de
// "Antes de empezar", y explica en qué consiste: con TDAH lo que está a la
// vista compite por la atención, así que es más fácil guardarlo antes que
// resistirse a mirarlo durante la sesión. Usa el mismo `deskCleared` de
// siempre (cuenta para XP, Insights y el reporte de consulta).
export default function DeskReady({ C, t, done, onDone }) {
  const dr = t.deskReady;
  const [open, setOpen] = useState(false);
  const accent = C.mint;

  if (done) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "14px",
          background: tint(accent, 0.12),
          marginBottom: "18px",
          fontSize: "13.5px",
          color: C.text,
        }}
      >
        <span aria-hidden="true">✅</span>
        <span>{dr.doneToday}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "16px",
        border: `1px dashed ${tint(accent, 0.6)}`,
        background: tint(accent, 0.07),
        marginBottom: "18px",
      }}
    >
      <p style={{ fontSize: "12px", fontWeight: 800, color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {dr.before}
      </p>
      <p style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: "0 0 6px" }}>🧹 {dr.title}</p>
      <p style={{ fontSize: "13.5px", color: C.text, margin: 0, lineHeight: 1.55 }}>{dr.why}</p>

      {open && (
        <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
          {dr.steps.map((s) => (
            <li key={s.text} style={{ display: "flex", gap: "10px", fontSize: "13.5px", color: C.text, lineHeight: 1.5, padding: "4px 0" }}>
              <span aria-hidden="true">{s.emoji}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginTop: "12px" }}>
        <button
          type="button"
          onClick={onDone}
          style={{
            minHeight: "42px",
            padding: "0 16px",
            borderRadius: "12px",
            border: "none",
            background: accent,
            color: C.mintText || "#fff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {dr.doneButton}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{ background: "transparent", border: "none", color: C.text, fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: "8px 4px", textDecoration: "underline" }}
        >
          {open ? dr.hideHow : dr.showHow}
        </button>
      </div>
    </div>
  );
}
