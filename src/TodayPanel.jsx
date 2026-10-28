import React from "react";
import { ArrowRight, PartyPopper } from "lucide-react";
import { buildTodayItems } from "./todayView";

// Vista "Hoy" — resume en una sola pantalla lo que está pendiente ahora
// mismo, en vez de obligar a revisar cada panel suelto uno por uno. Cada
// renglón enlaza directo a la herramienta correspondiente (mismo mecanismo
// de scroll que ya usa el Compañero de apoyo). Si no hay nada pendiente, lo
// dice de forma positiva — nunca una lista vacía que se sienta como un error.
export default function TodayPanel({
  C,
  t,
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

  return (
    <div>
      {items.map((item) => (
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
    </div>
  );
}
