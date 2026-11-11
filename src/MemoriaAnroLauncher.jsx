import React, { useEffect } from "react";
import { Brain, X } from "lucide-react";
import CaptureHubPanel from "./CaptureHubPanel";
import { useDraggableBubble } from "./useDraggableBubble";

// "Memoria ANRO" (3 de noviembre de 2026) — versión chica del "Prompt
// maestro" que la doctora compartió (inspirado en una app que le llamó la
// atención), decidida junto con ella en vez de construir el documento
// completo: en lugar de un sistema paralelo de captura universal con IA
// conversacional libre (lo que el documento pedía, y que choca con la
// decisión clínica ya tomada en este mismo proyecto de NUNCA ofrecer un
// chat de IA de formato libre a esta población), esto es solo un acceso
// más visible y memorable al mecanismo que YA existía (CaptureHubPanel,
// que fusiona Captura rápida + Descarga mental con IA) — ahora alcanzable
// con un botón flotante desde cualquier pantalla, sin tener que navegar
// primero a la pestaña "Herramientas". El botón de la pestaña sigue
// existiendo tal cual (ver FocusFlowTDAH.jsx) — esto es una puerta de
// entrada ADICIONAL, no un reemplazo, para no romper el hábito de quien ya
// usa la pestaña.
//
// 2026-11 — igual que QuickNavMenu, la doctora pidió que este botón se
// pueda arrastrar a cualquier parte de la pantalla (a veces el punto fijo
// tapaba contenido). La posición ahora vive en useDraggableBubble
// (persistida por dispositivo en localStorage, nunca progreso clínico) en
// vez de un left/bottom fijo. Mientras `pos` es `null` (justo antes de
// montar) se usa el mismo lugar de siempre como resguardo, para no mostrar
// nada "saltando" al cargar — ese lugar de siempre (izquierda, porque
// QuickNavMenu ya ocupa la derecha) sigue siendo también la posición
// inicial por defecto una vez montado, hasta que se arrastre por primera
// vez.
// 10 de noviembre de 2026 ("las burbujas de acceso rápido también más
// grandes"): 52→64px, igual que las otras 2 burbujas (BreathingBubble,
// QuickNavMenu) — mismo tamaño entre las 3 a propósito.
const BUBBLE_SIZE = { w: 64, h: 64 };

export default function MemoriaAnroLauncher({
  C,
  t,
  lang,
  userId,
  accent,
  quickNotes,
  oldForgottenNoteId,
  canAddStep,
  onAddNote,
  onResolveNote,
  onRemoveNote,
  onConfirmMedication,
  onConfirmPayment,
  onConfirmStep,
  onSetReminder,
  bottomOffset = 0,
}) {
  const [open, setOpen] = React.useState(false);

  const getDefaultPosition = (vw, vh) => ({
    x: 16,
    y: vh - BUBBLE_SIZE.h - (20 + bottomOffset),
  });
  const { pos, dragHandlers, wasDragged } = useDraggableBubble(
    "anro-bubble-pos-memoria",
    getDefaultPosition,
    BUBBLE_SIZE
  );

  // Mismo gesto de cerrar con Escape que ya usa QuickNavMenu — solo
  // escucha mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleButtonClick = () => {
    if (wasDragged()) return; // ese click fue el final de un arrastre, se ignora
    setOpen((v) => !v);
  };

  const buttonStyle = pos
    ? { position: "fixed", left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" }
    : {
        position: "fixed",
        left: "16px",
        bottom: `${20 + bottomOffset}px`,
        right: "auto",
        top: "auto",
      };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.captureHub.fabLabel}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 70,
            padding: "0",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "88vh",
              overflowY: "auto",
              background: C.surface,
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 28px rgba(0,0,0,0.28)",
              padding: "18px 18px 28px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={20} color={accent} />
                <span style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>{t.captureHub.modalTitle}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t.common.close}
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
                }}
              >
                <X size={18} />
              </button>
            </div>

            <CaptureHubPanel
              C={C}
              t={t}
              lang={lang}
              userId={userId}
              quickNotes={quickNotes}
              oldForgottenNoteId={oldForgottenNoteId}
              canAddStep={canAddStep}
              onAddNote={onAddNote}
              onResolveNote={onResolveNote}
              onRemoveNote={onRemoveNote}
              onConfirmMedication={onConfirmMedication}
              onConfirmPayment={onConfirmPayment}
              onConfirmStep={onConfirmStep}
              onSetReminder={onSetReminder}
            />
          </div>
        </div>
      )}

      <button
        // id usado por el recorrido de bienvenida (OnboardingTour.jsx) para
        // señalar este botón con un spotlight — se mantiene igual aunque el
        // botón ya se pueda arrastrar: el spotlight lee la posición real
        // del elemento en el DOM (getBoundingClientRect), no una coordenada
        // fija, así que sigue encontrándolo donde sea que se haya movido.
        id="anro-tour-memoria-anro"
        onClick={handleButtonClick}
        onPointerDown={dragHandlers.onPointerDown}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
        aria-label={open ? t.common.close : t.captureHub.fabLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          ...buttonStyle,
          width: `${BUBBLE_SIZE.w}px`,
          height: `${BUBBLE_SIZE.h}px`,
          borderRadius: "50%",
          background: accent,
          color: "#fff",
          border: "none",
          boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          touchAction: "none",
          zIndex: 60,
        }}
      >
        {open ? <X size={26} /> : <Brain size={26} />}
      </button>
    </>
  );
}
