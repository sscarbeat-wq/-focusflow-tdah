import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { todayKey, daysBetween } from "./streak.js";
import { capsuleForKey } from "./scienceCapsules.js";

// Cápsula informativa del día sobre TDAH adulto — sin IA, contenido fijo
// investigado por Claude, rotando una por día de forma determinista (mismo
// patrón de "drip" que el programa de TCC, pero sin progreso que guardar:
// cualquiera que abra la app el mismo día ve la misma cápsula). No es
// descartable como el banner de instalación, porque el contenido ya cambia
// solo — no tendría sentido "cerrarla" para siempre.
//
// 11 de noviembre de 2026 ("no me gusta cómo se ve" Progreso): ahora tiene
// el mismo estilo de tarjeta que las demás (antes era una caja plana con
// letra chica) y el texto largo se corta a 4 renglones con "Leer más" —
// un bloque de 10 renglones de golpe es justo lo que con TDAH se salta.
export default function ScienceCapsulePanel({ C, t }) {
  const [open, setOpen] = useState(false);
  const capsule = capsuleForKey(todayKey(), daysBetween);
  if (!capsule) return null;
  const content = t.scienceCapsuleContent[capsule.id];
  const long = (content.text || "").length > 220;
  const accent = C.amber;

  // Segunda versión (mismo día, "son demasiados cuadros"): ya no es una
  // tarjeta aparte — va como la última sección dentro de "Mi semana".
  return (
    <div style={{ color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <BookOpen size={15} color={accent} />
        <span style={{ fontSize: "13px", fontWeight: 700 }}>{t.scienceCapsule.title}</span>
      </div>
      <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", lineHeight: 1.4 }}>{content.title}</p>
      <p
        style={{
          fontSize: "14px",
          lineHeight: 1.6,
          margin: 0,
          color: C.text,
          ...(long && !open
            ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }
            : null),
        }}
      >
        {content.text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            background: "transparent",
            border: "none",
            padding: "8px 0 0",
            color: accent,
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {open ? t.scienceCapsule.readLess : t.scienceCapsule.readMore}
        </button>
      )}
      {(open || !long) && (
        <p style={{ margin: "10px 0 0", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.5 }}>
          {t.scienceCapsule.sourceLabel(content.source)}
        </p>
      )}
    </div>
  );
}
