import React, { useState } from "react";
import { ArrowRight, AlertTriangle, RotateCcw } from "lucide-react";
import { SITUATIONS, CRISIS, getSituation, nextResponseIndex } from "./companionSituations";

// Compañero de apoyo situacional — SOLO botones de entrada rápida, nunca
// texto libre (decisión explícita de la usuaria, para acotar el riesgo
// clínico/legal: el paciente nunca puede escribirle a una IA algo que no
// esperamos). El botón de crisis vive separado del resto, con su propio
// estilo, y su mensaje nunca se genera ni se continúa — es texto fijo con
// recursos reales.
export default function CompanionPanel({ C, onNavigate }) {
  const [activeId, setActiveId] = useState(null); // id de SITUATIONS, "crisis", o null
  const [responseIndexBySituation, setResponseIndexBySituation] = useState({});

  const openSituation = (situationId) => {
    setResponseIndexBySituation((prev) => ({
      ...prev,
      [situationId]: nextResponseIndex(situationId, prev[situationId]),
    }));
    setActiveId(situationId);
  };

  const goBack = () => setActiveId(null);

  const btnOption = {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "11px 14px",
    color: C.text,
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "8px",
  };

  const btnCrisis = {
    ...btnOption,
    background: "transparent",
    border: `1px solid ${C.rose}`,
    color: C.rose,
    marginTop: "6px",
    marginBottom: 0,
  };

  const btnLink = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.mint,
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    color: C.mintText,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnBack = {
    background: "transparent",
    border: "none",
    color: C.textMuted,
    fontSize: "12px",
    cursor: "pointer",
    padding: "8px 0 0",
    display: "block",
  };

  // --- Vista de crisis: mensaje fijo, sin continuar la conversación ---
  if (activeId === "crisis") {
    return (
      <div>
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.rose}`,
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "4px",
          }}
        >
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: 0 }}>{CRISIS.message}</p>
        </div>
        <button onClick={goBack} style={btnBack}>
          Volver
        </button>
      </div>
    );
  }

  // --- Vista de una situación normal: respuesta fija + enlace a la herramienta ---
  if (activeId) {
    const situation = getSituation(activeId);
    if (!situation) {
      // Defensivo: si por algo el id no existe, no se queda atorado.
      setActiveId(null);
      return null;
    }
    const idx = responseIndexBySituation[activeId] || 0;
    const text = situation.responses[idx] || situation.responses[0];
    return (
      <div>
        <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>{text}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => onNavigate?.(situation.linkRef)} style={btnLink}>
            {situation.linkLabel} <ArrowRight size={14} />
          </button>
          <button onClick={() => openSituation(activeId)} style={{ ...btnBack, padding: 0 }}>
            <RotateCcw size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
            Otra idea para esto
          </button>
        </div>
        <button onClick={goBack} style={btnBack}>
          Elegir otra situación
        </button>
      </div>
    );
  }

  // --- Menú principal: solo botones, nunca texto libre ---
  return (
    <div>
      {SITUATIONS.map((s) => (
        <button key={s.id} onClick={() => openSituation(s.id)} style={btnOption}>
          {s.label}
        </button>
      ))}
      <button onClick={() => setActiveId("crisis")} style={btnCrisis}>
        <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
        {CRISIS.label}
      </button>
    </div>
  );
}
