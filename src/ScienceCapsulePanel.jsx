import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import { todayKey, daysBetween } from "./streak.js";
import { capsuleForKey } from "./scienceCapsules.js";
import ScienceDiagram from "./scienceDiagrams.jsx";
import { tint } from "./theme";

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
//
// 17 de noviembre de 2026 ("quiero que sean incluso más de 22 notas sobre
// tdah que no se repitan, y si quiero mejores imagenes"): rediseño
// "didáctico" — cada cápsula ahora trae un diagrama simple y original
// (scienceDiagrams.jsx, distinto según el tema: dopamina, sueño, genética,
// etc. — ya no un solo dibujo reciclado), una "idea clave" destacada antes
// del texto largo (content.tldr, pensada para quien no vaya a leer el
// párrafo completo) y una etiqueta honesta de qué tan fuerte es la
// evidencia (t.scienceCapsule.evidenceLabels[capsule.evidence] — nunca
// presenta un estudio aislado con el mismo peso que un metaanálisis
// grande, mismo estándar que ya pedía la doctora). El chip-resumen en
// Inicio (ver ScienceCapsuleTeaser.jsx) enlaza aquí para la versión
// completa.
export default function ScienceCapsulePanel({ C, t, size }) {
  const [open, setOpen] = useState(false);
  const capsule = capsuleForKey(todayKey(), daysBetween);
  if (!capsule) return null;
  const content = t.scienceCapsuleContent[capsule.id];
  if (!content) return null;
  const long = (content.text || "").length > 220;
  const accent = C.amber;
  const evidenceLabel = t.scienceCapsule.evidenceLabels && t.scienceCapsule.evidenceLabels[capsule.evidence];

  return (
    <div style={{ color: C.text }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <BookOpen size={15} color={accent} />
        <span style={{ fontSize: "13px", fontWeight: 700 }}>{t.scienceCapsule.title}</span>
      </div>
      <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 4px", lineHeight: 1.4 }}>{content.title}</p>

      {size !== "compact" && capsule.diagram && <ScienceDiagram C={C} diagram={capsule.diagram} />}

      {content.tldr && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            background: tint(accent, 0.1),
            border: `1px solid ${tint(accent, 0.3)}`,
            borderRadius: "12px",
            padding: "10px 12px",
            marginBottom: "12px",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "15px", lineHeight: 1.3 }}>💡</span>
          <span style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.5 }}>{content.tldr}</span>
        </div>
      )}

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
      {(open || !long) && evidenceLabel && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "12px 0 0" }}>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 800,
              color: C.sky,
              background: tint(C.sky, 0.14),
              border: `1px solid ${tint(C.sky, 0.35)}`,
              borderRadius: "999px",
              padding: "3px 9px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {evidenceLabel}
          </span>
        </div>
      )}
      {(open || !long) && (
        <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.5 }}>
          {t.scienceCapsule.sourceLabel(content.source)}
        </p>
      )}
    </div>
  );
}
