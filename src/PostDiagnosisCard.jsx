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
export default function PostDiagnosisCard({ C }) {
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
        aria-label="Cerrar"
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
        <Sparkles size={16} color={C.amber} /> ¿Te diagnosticaron hace poco?
      </div>
      <p style={{ margin: "0 0 10px" }}>
        Si tu diagnóstico de TDAH es reciente, esta guía breve es para ti — no reemplaza a tu médico o médica, pero puede
        ayudarte a entender qué esperar en esta primera etapa.
      </p>
      {POST_DIAGNOSIS_SECTIONS.map((section) => (
        <div key={section.id} style={{ marginBottom: "10px" }}>
          <div style={{ fontWeight: 600, marginBottom: "2px" }}>{section.title}</div>
          <p style={{ margin: 0 }}>{section.text}</p>
        </div>
      ))}
      <p style={{ margin: 0, color: C.textMuted }}>
        Esto es información general, no un plan de tratamiento — cualquier duda sobre tu caso específico,
        coméntala con tu médico o médica.
      </p>
    </div>
  );
}
