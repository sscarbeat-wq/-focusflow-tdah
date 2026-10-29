import React, { useState } from "react";
import { ArrowRight, PartyPopper, ChevronDown, ChevronUp } from "lucide-react";
import { buildTodayItems } from "./todayView";
import { tint } from "./theme";

// Vista "Hoy" — resume en una sola pantalla lo que está pendiente ahora
// mismo, en vez de obligar a revisar cada panel suelto uno por uno. Cada
// renglón enlaza directo a la herramienta correspondiente (mismo mecanismo
// de scroll que ya usa el Compañero de apoyo). Si no hay nada pendiente, lo
// dice de forma positiva — nunca una lista vacía que se sienta como un error.
//
// Fase 2 (Inicio simplificado, 29 de octubre de 2026): a petición de la
// doctora, después de que su esposo (usuario real con TDAH) probó la app y
// dijo que no sabía "qué hacer" al entrar. Antes esta lista mostraba todos
// los pendientes exactamente igual (mismo tamaño, mismo peso visual) — ahora
// el primero (buildTodayItems() ya los devuelve en orden de prioridad, ver
// todayView.js) se destaca como "tu próximo paso" en una tarjeta grande, y
// el resto queda abajo como lista compacta, limitada a 3 a la vez con un
// botón para ver el resto — para no volver a caer en "muchas cosas juntas".
// buildTodayItems() y sus props NO cambiaron en nada: esto es solo una
// forma distinta de presentar los mismos datos.
export default function TodayPanel({
  C,
  t,
  accent,
  steps,
  moodLog,
  energyLog,
  medications,
  medicationDoseLog,
  payments,
  paymentPaidLog,
  cbtProgram,
  habits,
  quickNotes,
  routines,
  onNavigate,
}) {
  const [showAll, setShowAll] = useState(false);
  const items = buildTodayItems({
    steps,
    moodLog,
    energyLog,
    medications,
    medicationDoseLog,
    payments,
    paymentPaidLog,
    cbtProgram,
    habits,
    quickNotes,
    routines,
    t,
  });

  const itemStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    width: "100%",
    textAlign: "left",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "11px 14px",
    color: C.text,
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "8px",
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: C.surfaceAlt,
          borderRadius: "12px",
          padding: "14px",
          color: C.text,
          fontSize: "13px",
        }}
      >
        <PartyPopper size={18} style={{ color: C.mint, flexShrink: 0 }} />
        <span>{t.today.empty}</span>
      </div>
    );
  }

  const [mainItem, ...rest] = items;
  const VISIBLE_REST = 3;
  const visibleRest = showAll ? rest : rest.slice(0, VISIBLE_REST);
  const hiddenCount = rest.length - visibleRest.length;

  return (
    <div>
      <button
        onClick={() => onNavigate?.(mainItem.sectionRef)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          width: "100%",
          textAlign: "left",
          background: `linear-gradient(135deg, ${tint(accent, 0.22)}, ${tint(accent, 0.08)})`,
          border: `2px solid ${tint(accent, 0.55)}`,
          borderRadius: "16px",
          padding: "16px 18px",
          color: C.text,
          cursor: "pointer",
          marginBottom: rest.length > 0 ? "16px" : "0",
          minHeight: "64px",
        }}
      >
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "4px" }}>
            {t.today.mainTaskLabel}
          </span>
          <span style={{ display: "block", fontSize: "15px", fontWeight: 700 }}>{mainItem.label}</span>
          {mainItem.detail && (
            <span style={{ display: "block", fontSize: "12px", color: C.textMuted, marginTop: "3px" }}>
              {mainItem.detail}
            </span>
          )}
        </span>
        <ArrowRight size={20} style={{ flexShrink: 0, color: accent }} />
      </button>

      {rest.length > 0 && (
        <>
          <p style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.03em", margin: "0 0 8px" }}>
            {t.today.nextUpLabel}
          </p>
          {visibleRest.map((item) => (
            <button key={item.id} onClick={() => onNavigate?.(item.sectionRef)} style={itemStyle}>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block" }}>{item.label}</span>
                {item.detail && (
                  <span style={{ display: "block", fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>
                    {item.detail}
                  </span>
                )}
              </span>
              <ArrowRight size={14} style={{ flexShrink: 0, color: C.textMuted }} />
            </button>
          ))}
          {rest.length > VISIBLE_REST && (
            <button
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                width: "100%",
                minHeight: "36px",
                background: "transparent",
                border: "none",
                color: C.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "4px",
              }}
            >
              {showAll ? (
                <>
                  {t.today.showLess} <ChevronUp size={14} />
                </>
              ) : (
                <>
                  {t.today.showMore(hiddenCount)} <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
