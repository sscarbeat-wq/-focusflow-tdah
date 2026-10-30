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
        // Fase 2G (pulido de accesibilidad, 29 de octubre de 2026): antes
        // role="listitem" vivía directo en el <button>, lo cual pisaba su
        // rol nativo de "button" — un lector de pantalla lo habría anunciado
        // como elemento de lista, no como algo que se puede activar. Ahora
        // "listitem" va en un contenedor aparte y el botón conserva su rol
        // real, sin cambiar nada del look (mismo <button> con los mismos
        // estilos de antes, solo que ahora es hijo de ese contenedor).
        <div key={item.key} role="listitem">
          <button
            onClick={() => onSelect(item.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "10px",
              width: "100%",
              minHeight: "110px",
              padding: "14px",
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              color: C.text,
              cursor: "pointer",
              textAlign: "left",
              boxSizing: "border-box",
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
              <span style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{item.label}</span>
                {/* Fase 3 del sistema de planes (30 de octubre de 2026) —
                    badge opcional para que la paciente sepa, antes de abrir
                    la herramienta, que es parte de Plus (ver
                    LOCKED_TOOL_KEYS en FocusFlowTDAH.jsx). Las herramientas
                    gratis o con solo una función interna bloqueada no
                    traen badge. */}
                {item.badge}
              </span>
              {item.description && (
                <span style={{ display: "block", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.4 }}>
                  {item.description}
                </span>
              )}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
