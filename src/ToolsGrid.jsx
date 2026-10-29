import React from "react";
import { tint } from "./theme";

// Fase 2B (29 de octubre de 2026): Herramientas es la pestaña con más
// paneles (20 de 28) — antes de esto, entrar ahí seguía siendo la misma
// página larga de siempre, solo que confinada a su propia pestaña. Esto la
// reemplaza por una cuadrícula de tarjetas: cada una tiene su ícono, su
// nombre y la misma frase corta que ya usa el encabezado de su panel
// (`items` ya viene armado con esa descripción desde FocusFlowTDAH.jsx) —
// tocar una abre SOLO esa herramienta.
//
// Útil en particular para Desglosador vs. Rutinas visuales guiadas, que la
// doctora notó que se ven parecidas (comparten el patrón "un paso a la
// vez"): al verlas una junto a la otra con su descripción real a la vista
// ("tarea puntual que cuesta empezar" vs. "secuencia que se repite,
// camínala paso a paso"), la diferencia queda clara sin tener que abrir
// ninguna de las dos primero.
export default function ToolsGrid({ C, t, accent, items, onSelect }) {
  return (
    <div
      role="list"
      aria-label={t.tools.gridLabel}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "12px",
      }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          role="listitem"
          onClick={() => onSelect(item.key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "10px",
            minHeight: "110px",
            padding: "14px",
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            color: C.text,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tint(accent, 0.2),
              color: accent,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </span>
          <span>
            <span style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "3px" }}>
              {item.label}
            </span>
            {item.description && (
              <span style={{ display: "block", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.4 }}>
                {item.description}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
