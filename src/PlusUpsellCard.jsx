import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { tint } from "./theme";

// Fase 3 del sistema de planes (30 de octubre de 2026) — hasta ahora toda
// cuenta sin Plus se quedaba fuera de la app por completo (Paywall de
// pantalla completa en App.jsx), así que nunca existió un "candado" dentro
// de una herramienta. Ahora que el plan Gratis entra de verdad, estos dos
// componentes son el reemplazo: PlusLockedPanel envuelve una herramienta
// completa (atenuada, sin poder interactuar con ella, con este aviso
// encima) y PlusUpsellInline es la versión chica para una sola función
// dentro de un panel que por lo demás es gratis (p. ej. "crear rutina
// nueva" dentro de RoutinesPanel). Ninguno de los dos redirige solo — el
// botón llama a onRequestUpgrade, que App.jsx usa para abrir Paywall con un
// botón de cerrar (ver Fase 3 en App.jsx y Paywall.jsx), nunca un checkout
// directo: la paciente decide si quiere ver los planes o no.
//
// Mismo lenguaje visual que PostDiagnosisCard.jsx (esquinas de 22px, sombra
// suave, ícono en placa tintada) para que se sienta parte de la misma app y
// no como un bloqueo ajeno/agresivo.

export function PlusUpsellBadge({ C, t }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.02em",
        color: C.amberText || C.amber,
        background: tint(C.amber, 0.18),
        borderRadius: "999px",
        padding: "2px 7px",
        lineHeight: 1.4,
      }}
    >
      <Sparkles size={10} />
      {t.upsell.badge}
    </span>
  );
}

// Envuelve una herramienta Plus completa: se ve atenuada y no-interactiva
// detrás, con la tarjeta de aviso centrada encima. children se sigue
// montando normal (mismo patrón de "nunca desmontar" que el resto de la
// app) — solo se le quita la interacción visualmente. `locked` decide si de
// verdad se bloquea (plan Gratis) o se deja pasar sin ningún envoltorio
// extra (Plus/trial) — así quien lo usa no necesita un if/ternario propio
// en cada panel, solo envolver siempre y pasar `locked={!isPlus}`.
export function PlusLockedPanel({ C, t, onRequestUpgrade, locked = true, children }) {
  if (!locked) return children;
  return (
    <div style={{ position: "relative" }}>
      <div
        aria-hidden="true"
        style={{
          opacity: 0.35,
          pointerEvents: "none",
          userSelect: "none",
          filter: "blur(1.5px)",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{
            background: C.surface,
            borderRadius: "22px",
            padding: "22px 20px",
            maxWidth: "320px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
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
              margin: "0 auto 12px",
            }}
          >
            <Lock size={20} />
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 6px", color: C.text }}>
            {t.upsell.overlayTitle}
          </h3>
          <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5, margin: "0 0 16px" }}>
            {t.upsell.overlayBody}
          </p>
          <button
            type="button"
            onClick={onRequestUpgrade}
            style={{
              background: C.mint,
              border: "none",
              borderRadius: "12px",
              padding: "11px 18px",
              color: C.mintText,
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {t.upsell.overlayButton}
          </button>
        </div>
      </div>
    </div>
  );
}

// Aviso chico para una sola función dentro de un panel que por lo demás es
// gratis — no oculta nada, solo reemplaza el control de esa función con una
// línea + botón. `label` es el texto específico de esa función
// (t.upsell.focusDistractionBlocker / companionAiReply / routinesCustom).
export function PlusUpsellInline({ C, t, label, onRequestUpgrade }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        background: tint(C.amber, 0.1),
        border: `1px solid ${tint(C.amber, 0.3)}`,
        borderRadius: "14px",
        padding: "12px 14px",
      }}
    >
      <Lock size={15} color={C.amber} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: "13px", color: C.text, flex: 1, minWidth: "140px" }}>{label}</span>
      <button
        type="button"
        onClick={onRequestUpgrade}
        style={{
          background: "transparent",
          border: `1px solid ${C.amber}`,
          borderRadius: "10px",
          padding: "7px 12px",
          color: C.amberText || C.amber,
          fontWeight: 600,
          fontSize: "12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {t.upsell.inlineButton}
      </button>
    </div>
  );
}
