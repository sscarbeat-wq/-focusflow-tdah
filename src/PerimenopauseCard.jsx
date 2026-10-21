import React, { useState } from "react";
import { Info, X } from "lucide-react";

const DISMISS_KEY = "ff_perimenopausia_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

// Tarjeta informativa (nunca diagnóstica) sobre el solapamiento entre TDAH
// y perimenopausia — evidencia: estudio poblacional con 5,392 mujeres de la
// cohorte islandesa SAGA (European Psychiatry, 2025) que encontró que, en
// mujeres con TDAH, los síntomas de perimenopausia suelen empezar hasta 10
// años antes y son más del doble de frecuentes en su forma incapacitante
// (54.2% vs. ~33% en mujeres sin TDAH).
//
// Se dirige a quien se identifique con el perfil descrito en el propio
// texto, porque Senda no guarda género ni edad de nadie — no hay ningún
// dato de la cuenta que la dispare ni que la oculte, es la persona quien
// decide si le aplica. Dismissible por dispositivo (localStorage), mismo
// patrón que el banner de instalación (InstallBanner.jsx).
export default function PerimenopauseCard({ C }) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Si localStorage no está disponible, la tarjeta simplemente se
      // vuelve a mostrar en la próxima visita — no es un dato crítico.
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
        <Info size={16} color={C.amber} /> TDAH y perimenopausia
      </div>
      <p style={{ margin: "0 0 8px" }}>
        ¿Por qué aparece esto en una app de TDAH? Porque la relación va en los dos sentidos: los cambios
        hormonales de la perimenopausia pueden hacer que los síntomas de TDAH se sientan más fuertes, y en
        algunas mujeres un TDAH que nunca se había reconocido se vuelve mucho más notorio justo en esta
        etapa.
      </p>
      <p style={{ margin: "0 0 8px" }}>
        Si eres mujer y tienes entre 35 y 55 años: un estudio reciente con más de 5,000 mujeres encontró que,
        en quienes tienen TDAH, los síntomas de la perimenopausia suelen empezar antes (hasta 10 años) y se
        sienten con más intensidad que en mujeres sin TDAH.
      </p>
      <p style={{ margin: 0, color: C.textMuted }}>
        Esto no es un diagnóstico ni reemplaza una consulta — si notas cambios de ánimo, sueño o bochornos
        que se sienten distintos a lo de siempre, vale la pena platicarlo con tu médica.
      </p>
    </div>
  );
}
