import React from "react";
import { tint } from "./theme";

// Fase 2 (Inicio simplificado, 29 de octubre de 2026): los "cuatro accesos
// rápidos" que pidió la doctora — un atajo directo a las 4 herramientas que
// más se usan "en el momento" (desglosador, compañero de apoyo, freno de
// impulsividad, burbuja de enfoque), elegidas por ella misma. `items` las
// recibe ya armadas desde FocusFlowTDAH.jsx ({ key, icon, label }) para
// reutilizar exactamente los mismos íconos que ya usan sus paneles y el
// menú "Ir a..." (mismo patrón que quickNavSections) — así nunca se
// desincroniza un ícono de acceso rápido del ícono real del panel.
// onSelect(key) es scrollToCompanionSection, que ya sabe cambiar de pestaña
// sola si la herramienta vive en otra (ver FocusFlowTDAH.jsx) — todos los
// accesos de aquí viven en Herramientas, así que siempre van a cambiar de
// pestaña desde Inicio, y eso está bien.
export default function QuickAccessGrid({ C, t, accent, items, onSelect }) {
  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          margin: "0 0 8px",
        }}
      >
        {t.today.quickAccessLabel}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minHeight: "52px",
              padding: "10px 12px",
              background: tint(accent, 0.08),
              border: `1px solid ${tint(accent, 0.3)}`,
              borderRadius: "12px",
              color: C.text,
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: tint(accent, 0.22),
                color: accent,
              }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
