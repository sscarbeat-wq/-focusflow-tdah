import React from "react";
import { tint } from "./theme";
import { stageFor } from "./mascotLogic";

// 8 de noviembre de 2026 — reemplaza a la antigua `QuickAccessGrid.jsx`
// (cuadrícula rectangular) como parte del rediseño "estilo K" de Inicio.
// La doctora pidió específicamente "los accesos rápidos en círculo
// alrededor de la mascota, como la brújula de K, pero fijos — sin la
// animación de giro real" que sí tenía el mockup (ver VarianteK.dc.html,
// que gira sola con @keyframes). Por eso este componente es un dial
// ESTÁTICO: mismos 4 accesos de siempre (Desglosador, Compañero de apoyo,
// Freno de impulsividad, Burbuja de enfoque, decididos por la doctora el
// 28 de octubre), mismo `onSelect`/`items` que ya mandaba FocusFlowTDAH.jsx
// — solo cambia la presentación, de cuadrícula a 4 puntos cardinales
// alrededor de un centro decorativo.
//
// El centro NO es una copia interactiva de <Mascot> (que se queda arriba,
// sin tocar, con todo su sonido/animación/accesorio tal cual) — es solo un
// eco visual decorativo (el emoji de la etapa actual, vía `stageFor`, la
// misma función pura que ya usa Mascot.jsx) para que el conjunto se lea
// como "la mascota en el centro de su brújula", sin duplicar lógica
// interactiva ni el anillo de progreso (que ya se ve justo arriba, en la
// tarjeta de Mascot). Si no se manda `streak`/`species`, el centro muestra
// un ícono genérico en vez de tronar.
//
// Geometría en píxeles fijos (no proporcional al viewport) — mismo criterio
// que ya usa Mascot.jsx (RING_SIZE=112 fijo): 240px de diámetro le entra
// con margen de sobra incluso al teléfono más angosto que soporta la app
// (320px, menos el padding de 18px por lado del contenedor principal).
const DIAL_SIZE = 240;
const CENTER_SIZE = 104;
const BUTTON_SIZE = 56;
const RADIUS = DIAL_SIZE / 2 - BUTTON_SIZE / 2 - 4; // 88px del centro a cada botón

// 4 puntos cardinales — top/right/bottom/left, en ese orden (mismo orden en
// que ya venían los 4 `items` desde FocusFlowTDAH.jsx: Desglosador,
// Compañero, Freno, Burbuja — no se reordenan, solo se reacomodan).
const POSITIONS = [
  { x: 0, y: -RADIUS }, // arriba
  { x: RADIUS, y: 0 }, // derecha
  { x: 0, y: RADIUS }, // abajo
  { x: -RADIUS, y: 0 }, // izquierda
];

export default function QuickAccessCompass({ C, t, accent, items, onSelect, streak, species }) {
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const centerEmoji = species ? stageFor(current, longest, species).emoji : null;

  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          margin: "0 0 14px",
        }}
      >
        {t.today.quickAccessLabel}
      </p>
      <div
        style={{
          position: "relative",
          width: `${DIAL_SIZE}px`,
          height: `${DIAL_SIZE}px`,
          margin: "0 auto",
          // Espacio de sobra para que las etiquetas de texto debajo de los
          // 4 botones (arriba/abajo del dial) no queden recortadas — el
          // dial en sí ocupa DIAL_SIZE, pero cada etiqueta le agrega ~28px
          // más hacia afuera en el eje vertical.
          padding: "26px 0",
        }}
      >
        {/* Dial punteado decorativo — mismo motivo que VarianteK.dc.html */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${DIAL_SIZE}px`,
            height: `${DIAL_SIZE}px`,
            transform: "translate(-50%, -50%)",
            border: `1.5px dashed ${tint(accent, 0.3)}`,
            borderRadius: "50%",
          }}
        />

        {/* Centro decorativo — eco visual de la mascota, no interactivo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${CENTER_SIZE}px`,
            height: `${CENTER_SIZE}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 38%, ${C.surface} 0%, ${C.surfaceAlt} 100%)`,
            boxShadow: `0 6px 16px ${tint(accent, 0.22)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
          }}
        >
          {centerEmoji || "🧭"}
        </div>

        {/* 4 accesos rápidos, en los 4 puntos cardinales */}
        {items.map((item, i) => {
          const pos = POSITIONS[i % POSITIONS.length];
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              aria-label={item.label}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                // "+ -88px" también es CSS válido, pero se escribe con el
                // signo correcto para que quede legible en las devtools.
                transform: `translate(calc(-50% ${pos.x >= 0 ? "+" : "-"} ${Math.abs(pos.x)}px), calc(-50% ${
                  pos.y >= 0 ? "+" : "-"
                } ${Math.abs(pos.y)}px))`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                width: "84px",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: `${BUTTON_SIZE}px`,
                  height: `${BUTTON_SIZE}px`,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: tint(accent, 0.16),
                  border: `1.5px solid ${tint(accent, 0.35)}`,
                  color: accent,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              >
                {item.icon}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
