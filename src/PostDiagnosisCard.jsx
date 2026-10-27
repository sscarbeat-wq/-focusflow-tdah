import React, { useState } from "react";
import { Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { POST_DIAGNOSIS_SECTIONS } from "./postDiagnosisGuide";
import { tint } from "./theme";

const DISMISS_KEY = "ff_postdx_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Tarjeta descartable, autoidentificada (nadie en ANRO TDAH tiene guardada
// una fecha de diagnóstico) — mismo patrón que InstallBanner.jsx y la
// cápsula de perimenopausia. Contenido en ./postDiagnosisGuide.js.
//
// 27 de octubre de 2026 — la doctora dijo que no le gustaba cómo se veía
// ("el cuadro del principio... hazlo como un apartado"). Antes era una caja
// plana (borde de 1px, esquinas casi cuadradas) que mostraba las 5
// secciones completas siempre abiertas — un bloque largo de texto que
// recibía a la paciente antes de que viera nada más de la app, y que además
// ya no combinaba con el resto del rediseño (paneles redondeados, con
// sombra suave e ícono en una placa de color). Ahora: mismo lenguaje visual
// que Panel() en FocusFlowTDAH.jsx (esquinas de 22px, sombra, ícono en
// placa tintada), y colapsado por defecto — se ve solo el título y una
// línea de resumen, con una flecha para abrir el contenido completo cuando
// la paciente quiera leerlo. El botón de cerrar (descartar del todo) se
// queda aparte, arriba a la derecha, para no confundirlo con el de
// abrir/cerrar la guía.
export default function PostDiagnosisCard({ C, t }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [expanded, setExpanded] = useState(false);

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
        borderRadius: "22px",
        padding: "18px 20px",
        marginBottom: "20px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        position: "relative",
      }}
    >
      <button
        onClick={dismiss}
        aria-label={t.postDiagnosis.closeAria}
        title={t.postDiagnosis.closeAria}
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          background: "transparent",
          border: "none",
          color: C.textMuted,
          cursor: "pointer",
          zIndex: 1,
        }}
      >
        <X size={16} />
      </button>

      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          width: "100%",
          marginRight: "28px",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "13px",
            background: tint(C.amber, 0.16),
            color: C.amber,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: C.text }}>
              {t.postDiagnosis.title}
            </h2>
            {expanded ? (
              <ChevronUp size={16} color={C.textMuted} style={{ flexShrink: 0 }} />
            ) : (
              <ChevronDown size={16} color={C.textMuted} style={{ flexShrink: 0 }} />
            )}
          </div>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: "5px 0 0", lineHeight: 1.5 }}>
            {t.postDiagnosis.intro}
          </p>
        </div>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: `1px solid ${C.border}`,
            fontSize: "13px",
            color: C.text,
            lineHeight: 1.6,
          }}
        >
          {POST_DIAGNOSIS_SECTIONS.map((section) => {
            const content = t.postDiagnosisSections[section.id];
            return (
              <div key={section.id} style={{ marginBottom: "10px" }}>
                <div style={{ fontWeight: 600, marginBottom: "2px" }}>{content.title}</div>
                <p style={{ margin: 0 }}>{content.text}</p>
              </div>
            );
          })}
          <p style={{ margin: 0, color: C.textMuted }}>{t.postDiagnosis.footer}</p>
        </div>
      )}
    </div>
  );
}
