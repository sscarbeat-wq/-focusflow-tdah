import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { tint } from "./theme";

const DISMISS_KEY = "anro-onboarding-seen";

function readSeen() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

// Fase 2 (29 de octubre de 2026): la doctora reportó que su esposo —usuario
// real con TDAH— entró a la app y no supo "qué hacer" ni por dónde
// empezar. Esta es la bienvenida breve que se agregó para eso: 3 pantallas
// cortas, SOLO la primera vez que se abre la app en este dispositivo (igual
// que PostDiagnosisCard.jsx/InstallBanner.jsx, es una preferencia de
// dispositivo en localStorage, no un dato clínico — nunca se guarda en el
// progreso de Supabase), que se pueden saltar en cualquier momento y nunca
// vuelven a aparecer después de cerrarse.
//
// Accesibilidad: es un diálogo modal (role="dialog" aria-modal="true"), se
// cierra con Escape o tocando fuera, el foco entra al diálogo al abrirse y
// queda atrapado adentro mientras está abierto (Tab/Shift+Tab solo se
// mueve entre los controles del diálogo), y al cerrarse el foco regresa a
// donde estaba antes de que se abriera.
export default function OnboardingTour({ C, t, accent }) {
  const [open, setOpen] = useState(() => !readSeen());
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const steps = t.onboarding.steps;
  const isLast = step === steps.length - 1;

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const toFocus = dialogRef.current?.querySelector("[data-autofocus]") || dialogRef.current;
    toFocus?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      /* localStorage no disponible (modo privado, etc.) — la bienvenida
         simplemente se volvería a mostrar en la próxima visita, no es un
         dato crítico. */
    }
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px",
        zIndex: 100,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="anro-onboarding-title"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{
          background: C.surface,
          borderRadius: "22px",
          padding: "26px 24px 20px",
          width: "min(420px, 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
          <button
            onClick={close}
            aria-label={t.onboarding.skip}
            style={{
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              borderRadius: "8px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          style={{ width: "48px", height: "48px", display: "block", margin: "0 auto 14px" }}
        />

        <h2
          id="anro-onboarding-title"
          data-autofocus
          tabIndex={-1}
          style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: C.text, textAlign: "center", outline: "none" }}
        >
          {steps[step].title}
        </h2>
        <p style={{ fontSize: "13.5px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
          {steps[step].body}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "20px" }}>
          {steps.map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: i === step ? accent : tint(C.textMuted, 0.3),
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1,
                minHeight: "44px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                color: C.text,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t.onboarding.back}
            </button>
          )}
          <button
            onClick={() => (isLast ? close() : setStep((s) => s + 1))}
            style={{
              flex: 2,
              minHeight: "44px",
              background: accent,
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isLast ? t.onboarding.start : t.onboarding.next}
          </button>
        </div>

        {!isLast && (
          <button
            onClick={close}
            style={{
              display: "block",
              margin: "14px auto 0",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              fontSize: "12px",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {t.onboarding.skip}
          </button>
        )}
      </div>
    </div>
  );
}
