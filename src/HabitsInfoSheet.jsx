import React, { useEffect } from "react";

// "¿Para qué sirven?" (11 de noviembre de 2026). La doctora vio la franja
// de hábitos en Inicio y notó que no decía para qué sirve ni por qué es
// necesario cada hábito ("y eso de cuarto, ¿qué es?"). Esta hoja lo explica
// uno por uno: en qué consiste y por qué ayuda con el TDAH. Se abre desde la
// franja de Inicio (TodayHabitsStrip.jsx) y desde "Mis hábitos de hoy"
// (HabitsList.jsx). Los textos viven en t.habitsInfo.
const ORDER = [
  { key: "screensOff", emoji: "📵" },
  { key: "sleepEnv", emoji: "🛏️" },
  { key: "ateWell", emoji: "🥗" },
  { key: "hydrated", emoji: "💧" },
  { key: "desk", emoji: "🧹" },
  { key: "activeBreak", emoji: "🚶" },
];

export default function HabitsInfoSheet({ C, t, onClose }) {
  const hi = t.habitsInfo;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(10, 12, 24, 0.55)",
        display: "flex",
        // Teléfono: sube desde abajo. Computadora: centrada.
        alignItems: typeof window !== "undefined" && window.innerWidth >= 760 ? "center" : "flex-end",
        justifyContent: "center",
        padding: "12px",
        boxSizing: "border-box",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={hi.title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: "86vh",
          overflowY: "auto",
          boxSizing: "border-box",
          background: C.surface,
          color: C.text,
          borderRadius: "22px",
          padding: "22px 20px 18px",
          boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
          textAlign: "left",
        }}
      >
        <h2 style={{ fontSize: "19px", fontWeight: 800, margin: "0 0 8px", color: C.text }}>{hi.title}</h2>
        <p style={{ fontSize: "14px", lineHeight: 1.6, margin: "0 0 16px", color: C.text }}>{hi.intro}</p>

        {ORDER.map(({ key, emoji }) => (
          <div
            key={key}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px 0",
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "26px", lineHeight: 1.1 }}>{emoji}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 3px", color: C.text }}>{hi.items[key].title}</p>
              <p style={{ fontSize: "14px", lineHeight: 1.55, margin: "0 0 4px", color: C.text }}>{hi.items[key].what}</p>
              <p style={{ fontSize: "13.5px", lineHeight: 1.55, margin: 0, color: C.textMuted }}>
                <strong style={{ color: C.text }}>{hi.whyLabel}</strong> {hi.items[key].why}
              </p>
            </div>
          </div>
        ))}

        <p style={{ fontSize: "13px", lineHeight: 1.55, margin: "4px 0 14px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, color: C.textMuted }}>
          {hi.footer}
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            minHeight: "48px",
            borderRadius: "14px",
            border: "none",
            background: C.mint,
            color: C.mintText || "#fff",
            fontSize: "15px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t.common.understood}
        </button>
      </div>
    </div>
  );
}
