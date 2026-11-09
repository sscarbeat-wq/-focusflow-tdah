import React, { useEffect, useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";

// "✏️ Editar" de la brújula de Inicio (9 de noviembre de 2026) — el botón
// que estaba en el mockup original ("Opción K") pero había quedado fuera
// de la primera entrega del rediseño. Deja que la paciente arme sus
// propios 6 accesos en vez de los 6 por defecto, eligiendo de la misma
// lista de secciones que ya usa el menú flotante "Ir a..." (`pool`, ver
// COMPASS_POOL en FocusFlowTDAH.jsx) — así no hay un segundo catálogo de
// destinos que mantener aparte.
//
// Se eligen EXACTAMENTE los que caben en la rueda (hasta 6) con un check
// simple, sin arrastrar para reordenar: el orden final en la rueda sigue
// el mismo orden fijo que ya tiene `pool` (igual que el menú "Ir a..."),
// no el orden en que se van marcando — más predecible para la paciente y
// evita construir un drag-and-drop solo para esto.
export default function CompassEditSheet({ C, t, accent, pool, selectedKeys, defaultKeys, onSave, onClose }) {
  const [draft, setDraft] = useState(selectedKeys);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggle = (key) => {
    setDraft((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 6) return prev;
      return [...prev, key];
    });
  };

  const reset = () => setDraft(defaultKeys);
  const canSave = draft.length > 0;
  // El orden en que se van marcando NO es el orden final de la rueda — eso
  // dependería de en qué orden la paciente hizo clic, nada predecible. El
  // orden final sigue siempre el mismo orden fijo del catálogo (`pool`,
  // igual que ya ordena el menú "Ir a..."), para que la rueda se vea igual
  // de estable sea cual sea el orden en que se fueron marcando las casillas.
  const handleSave = () => {
    const ordered = pool.filter((p) => draft.includes(p.key)).map((p) => p.key);
    onSave(ordered);
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.today.editCompassTitle}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "440px",
          maxHeight: "85vh",
          background: C.surface,
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 28px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px 10px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: C.text }}>{t.today.editCompassTitle}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.textMuted }}>
              {t.today.editCompassCount(draft.length)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.today.editCompassClose}
            style={{
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "8px 10px", flex: 1 }}>
          {pool.map((item) => {
            const checked = draft.includes(item.key);
            const disabled = !checked && draft.length >= 6;
            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                disabled={disabled}
                aria-pressed={checked}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  minHeight: "48px",
                  textAlign: "left",
                  background: checked ? `${accent}18` : "transparent",
                  border: "none",
                  borderRadius: "12px",
                  padding: "8px 10px",
                  color: disabled ? C.textMuted : C.text,
                  fontSize: "13px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                <span style={{ flexShrink: 0, display: "flex", color: checked ? accent : C.textMuted }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    border: `1.5px solid ${checked ? accent : C.border}`,
                    background: checked ? accent : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {checked && <Check size={13} color="#fff" />}
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "12px 18px 18px",
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "10px 14px",
              color: C.textMuted,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} /> <span>{t.today.editCompassReset}</span>
          </button>
          <button
            onClick={() => canSave && handleSave()}
            disabled={!canSave}
            style={{
              flex: 1,
              background: canSave ? accent : C.border,
              border: "none",
              borderRadius: "12px",
              padding: "10px 14px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            {t.today.editCompassSave}
          </button>
        </div>
      </div>
    </div>
  );
}
