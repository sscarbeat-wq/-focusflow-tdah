import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { POST_DIAGNOSIS_SECTIONS } from "./postDiagnosisGuide";

const DISMISS_KEY = "ff_postdx_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Tarjeta descartable, autoidentificada (nadie en Senda tiene guardada una
// fecha de diagnóstico) — mismo patrón que InstallBanner.jsx y la cápsula
// de perimenopausia. Contenido en ./postDiagnosisGuide.js.
export default function PostDiagnosisCard({ C, t }) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Si localStorage no está disponible, la tarjeta se vuelve a mostrar
      // en la próxima visita — no es un dato crítico.
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "8px",
        padding: "14px 16px",
        marginBottom: "20px",
        position: "relative",
        fontSize: "13px",
        color: C.text,
        lineHeight: 1.6,
      }}
    >
      <button
        onClick={dismiss}
        aria-label={t.postDiagnosis.closeAria}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          border: "none",
          color: C.textMuted,
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, marginBottom: "6px" }}>
        <Sparkles size={16} color={C.amber} /> {t.postDiagnosis.title}
      </div>
      <p style={{ margin: "0 0 10px" }}>
        {t.postDiagnosis.intro}
      </p>
      {POST_DIAGNOSIS_SECTIONS.map((section) => {
        const content = t.postDiagnosisSections[section.id];
        return (
          <div key={section.id} style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>{content.title}</div>
            <p style={{ margin: 0 }}>{content.text}</p>
          </div>
        );
      })}
      <p style={{ margin: 0, color: C.textMuted }}>
        {t.postDiagnosis.footer}
      </p>
    </div>
  );
}
