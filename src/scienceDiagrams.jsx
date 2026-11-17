import React from "react";
import { tint } from "./theme";
import { ANATOMY_IMAGES } from "./scienceAnatomyImages.js";

// 17 de noviembre de 2026 ("si quiero mejores imagenes"): antes del "Dato
// del día" solo existía un bloque de texto, sin ninguna ilustración. Este
// archivo junta un pequeño set de diagramas originales y simples — ninguno
// es una ilustración médica real, son esquemas pensados para explicar una
// idea en la app (mismo criterio que ya usa MoveArt.jsx con los
// movimientos de pausa activa) — para que cada grupo de cápsulas tenga una
// imagen distinta en vez de reutilizar siempre el mismo dibujo. Cada
// cápsula elige su diagrama por `diagram` en scienceCapsules.js; el mapa
// DIAGRAMS al final de este archivo conecta esa clave con el componente.
//
// 17 de noviembre de 2026, más tarde ("las imagenes no me gustan, puedes
// hacerlas en gemini, que se vean anatomicas de verdad"): la doctora
// rechazó estos íconos para los temas de biología/anatomía (cerebro, ADN,
// corazón) — los quiere realistas. Para esos 10 temas ahora se usa una
// foto/ilustración real generada con Gemini (ver scienceAnatomyImages.js,
// `ANATOMY_IMAGES`, con la misma clave `diagram`) en vez del dibujo SVG.
// Los 7 conceptos no-anatómicos (dinero, reloj, pastillas, teléfono,
// ciclo, alerta vial, plato de comida) siguen como ícono SVG simple —
// "realista" no aplica a un reloj o una balanza de monedas, y los íconos
// ya se veían bien ahí.

function DiagramFrame({ C, children, legend }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0 16px" }}>
      <svg width="220" height="140" viewBox="0 0 220 140" aria-hidden="true">
        {children}
      </svg>
      {legend && legend.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "14px", marginTop: "6px" }}>
          {legend.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                aria-hidden="true"
                style={{
                  width: "11px",
                  height: "11px",
                  borderRadius: item.round ? "50%" : "3px",
                  background: item.color,
                  border: item.border ? `1.5px solid ${item.border}` : "none",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "11.5px", color: C.textMuted }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoinScale({ C }) {
  const accent = C.amber;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Costo económico acumulado" }]}>
      <g transform="translate(40,14)">
        <line x1="70" y1="10" x2="70" y2="90" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="30" x2="120" y2="30" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M20 30 L8 58 Q20 68 32 58 Z" fill={tint(accent, 0.35)} stroke={accent} strokeWidth="1.5" />
        <path d="M120 30 L108 66 Q120 76 132 66 Z" fill={tint(accent, 0.35)} stroke={accent} strokeWidth="1.5" />
        <path d="M70 10 L56 0 L84 0 Z" fill={accent} />
        <rect x="56" y="90" width="28" height="8" rx="2" fill={accent} />
      </g>
    </DiagramFrame>
  );
}

function ClockBlur({ C }) {
  const accent = C.sky;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: '"Ceguera al tiempo"' }]}>
      <g transform="translate(60,10)">
        <circle cx="50" cy="55" r="42" fill={tint(accent, 0.12)} stroke={accent} strokeWidth="2" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 50 + Math.sin(rad) * 36;
          const y1 = 55 - Math.cos(rad) * 36;
          const x2 = 50 + Math.sin(rad) * 40;
          const y2 = 55 - Math.cos(rad) * 40;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="1.5" opacity="0.5" />;
        })}
        {/* manecillas "borrosas": una nítida y dos copias translúcidas desfasadas */}
        <line x1="50" y1="55" x2="50" y2="26" stroke={accent} strokeWidth="2.4" strokeLinecap="round" opacity="0.25" transform="rotate(-18 50 55)" />
        <line x1="50" y1="55" x2="50" y2="26" stroke={accent} strokeWidth="2.4" strokeLinecap="round" opacity="0.45" transform="rotate(-9 50 55)" />
        <line x1="50" y1="55" x2="50" y2="26" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="50" y1="55" x2="72" y2="55" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </DiagramFrame>
  );
}

function PillBalance({ C }) {
  const accent = C.mint;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Efecto del tratamiento" }]}>
      <g transform="translate(60,24)">
        <rect x="18" y="26" width="64" height="28" rx="14" fill={tint(accent, 0.35)} stroke={accent} strokeWidth="2" />
        <line x1="50" y1="26" x2="50" y2="54" stroke={accent} strokeWidth="2" />
        <circle cx="34" cy="40" r="3" fill={accent} opacity="0.8" />
        <circle cx="66" cy="40" r="3" fill={accent} opacity="0.5" />
        <path d="M10 78 C30 66 70 66 90 78" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="2 4" />
      </g>
    </DiagramFrame>
  );
}

function PhoneWave({ C }) {
  const accent = C.coral;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Scroll de redes sociales" }]}>
      <g transform="translate(78,8)">
        <rect x="10" y="4" width="44" height="80" rx="10" fill={tint(accent, 0.18)} stroke={accent} strokeWidth="2" />
        <rect x="18" y="14" width="28" height="48" rx="3" fill={tint(accent, 0.3)} />
        <circle cx="32" cy="72" r="3" fill={accent} />
        <path d="M58 20 C70 28 70 42 58 50" fill="none" stroke={accent} strokeWidth="2" opacity="0.6" />
        <path d="M58 32 C66 36 66 44 58 48" fill="none" stroke={accent} strokeWidth="2" opacity="0.9" />
      </g>
    </DiagramFrame>
  );
}

function CycleRing({ C }) {
  const accent = C.rose;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Ciclo hormonal" }]}>
      <g transform="translate(70,14)">
        <path
          d="M50 6 A44 44 0 1 1 10 36"
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M10 36 L2 26 L18 24 Z" fill={accent} />
        <path
          d="M10 70 A44 44 0 1 1 50 100"
          fill="none"
          stroke={tint(accent, 0.5)}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M50 100 L58 110 L42 112 Z" fill={tint(accent, 0.5)} />
        <circle cx="30" cy="53" r="9" fill={tint(accent, 0.35)} stroke={accent} strokeWidth="1.5" />
      </g>
    </DiagramFrame>
  );
}

function AlertSign({ C }) {
  const accent = C.coral;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Atención al volante" }]}>
      <g transform="translate(70,8)">
        <path d="M40 4 L76 70 H4 Z" fill={tint(accent, 0.3)} stroke={accent} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="37" y="26" width="6" height="22" rx="2" fill={accent} />
        <rect x="37" y="54" width="6" height="7" rx="2" fill={accent} />
        <g transform="translate(0,78)">
          <rect x="6" y="6" width="68" height="16" rx="8" fill={tint(accent, 0.25)} stroke={accent} strokeWidth="1.8" />
          <circle cx="20" cy="24" r="6" fill={accent} />
          <circle cx="60" cy="24" r="6" fill={accent} />
        </g>
      </g>
    </DiagramFrame>
  );
}

function FoodPlate({ C }) {
  const accent = C.amber;
  return (
    <DiagramFrame C={C} legend={[{ color: accent, round: true, label: "Dieta / colorantes" }]}>
      <g transform="translate(70,10)">
        <circle cx="40" cy="45" r="38" fill={tint(accent, 0.12)} stroke={accent} strokeWidth="2" />
        <circle cx="40" cy="45" r="24" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
        <g transform="translate(26,31)">
          <circle cx="14" cy="14" r="11" fill={tint(accent, 0.45)} stroke={accent} strokeWidth="1.8" />
          <line x1="5" y1="5" x2="23" y2="23" stroke={accent} strokeWidth="2.2" />
        </g>
      </g>
    </DiagramFrame>
  );
}

export const DIAGRAMS = {
  "coin-scale": CoinScale,
  "clock-blur": ClockBlur,
  "pill-balance": PillBalance,
  "phone-wave": PhoneWave,
  "cycle-ring": CycleRing,
  "alert-sign": AlertSign,
  "food-plate": FoodPlate,
};

// Imagen anatómica real (foto/ilustración generada con Gemini, ver más
// arriba) — mismo tamaño de marco que DiagramFrame (220x140) para que no
// "salte" el layout entre cápsulas con diagrama SVG y cápsulas con foto.
function AnatomyImage({ src }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "4px 0 16px" }}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{ width: "220px", height: "140px", objectFit: "cover", borderRadius: "14px" }}
      />
    </div>
  );
}

export default function ScienceDiagram({ C, diagram }) {
  const photo = ANATOMY_IMAGES[diagram];
  if (photo) return <AnatomyImage src={photo} />;
  const Comp = DIAGRAMS[diagram];
  if (!Comp) return null;
  return <Comp C={C} />;
}
