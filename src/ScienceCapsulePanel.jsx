import React from "react";
import { BookOpen } from "lucide-react";
import { todayKey, daysBetween } from "./streak.js";
import { capsuleForKey } from "./scienceCapsules.js";

// Cápsula informativa del día sobre TDAH adulto — sin IA, contenido fijo
// investigado por Claude, rotando una por día de forma determinista (mismo
// patrón de "drip" que el programa de TCC, pero sin progreso que guardar:
// cualquiera que abra Senda el mismo día ve la misma cápsula). No es
// descartable como el banner de instalación, porque el contenido ya cambia
// solo — no tendría sentido "cerrarla" para siempre.
export default function ScienceCapsulePanel({ C, t }) {
  const capsule = capsuleForKey(todayKey(), daysBetween);
  if (!capsule) return null;
  const content = t.scienceCapsuleContent[capsule.id];

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "14px 16px",
        marginBottom: "20px",
        fontSize: "13px",
        color: C.text,
        lineHeight: 1.6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, marginBottom: "6px" }}>
        <BookOpen size={16} color={C.amber} /> {t.scienceCapsule.title}
      </div>
      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{content.title}</div>
      <p style={{ margin: "0 0 8px" }}>{content.text}</p>
      <p style={{ margin: 0, fontSize: "11px", color: C.textMuted }}>{t.scienceCapsule.sourceLabel(content.source)}</p>
    </div>
  );
}
