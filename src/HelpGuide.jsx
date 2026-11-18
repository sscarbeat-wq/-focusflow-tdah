import React from "react";
import { X } from "lucide-react";

// 18 de noviembre de 2026 ("hay un link de ayuda que diga todo lo que
// dicen esos cuadros iniciales"): ADEMÁS del recorrido de bienvenida de
// siempre (OnboardingTour.jsx — una tarjeta a la vez, con "Siguiente"/
// "Atrás", y que algunos pasos señalan un elemento real de la pantalla),
// esta es una página sencilla con el MISMO contenido (t.onboarding.steps)
// pero todo junto, para leerlo de corrido sin dar clic varias veces. No
// duplica el texto en los 4 idiomas: usa el mismo arreglo de siempre, solo
// cambia cómo se presenta (una lista con separadores en vez de tarjetas
// una por una). Se abre desde Perfil → el botón nuevo junto a "Ver
// recorrido de nuevo" (ver FocusFlowTDAH.jsx).
//
// Mismo patrón de modal centrado que ya usan OnboardingTour.jsx,
// ScienceCapsulePanel (en Inicio) y activeUnlock: fondo oscuro, tarjeta
// blanca centrada, se cierra tocando fuera, la X, o Escape.
export default function HelpGuide({ C, t, onClose }) {
  const steps = (t.onboarding && t.onboarding.steps) || [];

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anro-help-guide-title"
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px",
        zIndex: 95,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        tabIndex={-1}
        style={{
          background: C.surface,
          borderRadius: "20px",
          padding: "18px 20px 22px",
          width: "min(460px, 100%)",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <span id="anro-help-guide-title" style={{ fontSize: "17px", fontWeight: 800, color: C.text, lineHeight: 1.3 }}>
            {t.app.settingsCard.helpGuide}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            style={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
          {steps.map((step, i) => (
            <div key={i}>
              {i > 0 && <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: "14px" }} />}
              <div style={{ fontSize: "14.5px", fontWeight: 800, color: C.text, marginBottom: "4px" }}>{step.title}</div>
              <div style={{ fontSize: "13.5px", color: C.textMuted, lineHeight: 1.5 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
