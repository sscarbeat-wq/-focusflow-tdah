import React, { useEffect, useRef, useState } from "react";
import { Wind, X } from "lucide-react";
import { useDraggableBubble } from "./useDraggableBubble";
import { computeAnchoredPanelPosition } from "./draggableBubblePure";

// "Burbuja de enfoque" (respiración) — nueva burbuja flotante, ADITIVA.
//
// El panel de respiración que ya existe dentro de la pestaña "Herramientas"
// (ref breathingSectionRef, estado breathingOn/phase/count/breathRef/
// cyclesRef, función startBreathing) se queda exactamente igual — esto NO
// lo reemplaza. Es una entrada adicional, igual que se hizo con Memoria
// ANRO: un botón flotante nuevo con su propio modal y su propio estado de
// respiración, para poder arrancar un ciclo desde cualquier punto del
// scroll sin tener que ir primero a Herramientas.
//
// Ciclo: inhala 4s, retén 4s, exhala 4s = 12s por ciclo × 5 ciclos = 60s —
// EXACTAMENTE la misma duración de fase y el mismo número de ciclos que ya
// usa el panel inline original (FocusFlowTDAH.jsx: breathingOn/phase/count,
// setInterval de 1000ms con count inicial en 4, 3 fases por ciclo, 5 ciclos
// completos hasta volver a phase===0 y llamar grantXp) — no un número
// inventado: así el "minuto de respiración" de la etiqueta de XP
// (t.app.xpLabels.breathingCompleted) dura lo mismo arranque desde donde se
// arranque. Misma escala visual también (1.3 / 1.3 / 0.85) que el círculo
// original.
//
// Misma burbuja arrastrable/persistida por dispositivo que Memoria ANRO y
// "Ir a..." (useDraggableBubble → localStorage, nunca Supabase, nunca
// progreso clínico).
const BUBBLE_SIZE = { w: 52, h: 52 };
const INHALE_MS = 4000;
const HOLD_MS = 4000;
const EXHALE_MS = 4000;
const TOTAL_CYCLES = 5;

export default function BreathingBubbleLauncher({ C, t, accent, grantXp, bottomOffset = 0 }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("ready"); // ready | inhale | hold | exhale | done
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const timeoutRef = useRef(null);

  const getDefaultPosition = (vw, vh) => ({
    // Apilada arriba de la burbuja de "Ir a..." para no nacer encima de
    // ella — una vez movida, la posición queda guardada y ya no importa.
    x: vw - BUBBLE_SIZE.w - 16,
    y: vh - BUBBLE_SIZE.h - (20 + bottomOffset + 68),
  });
  const { pos, dragHandlers, wasDragged } = useDraggableBubble(
    "anro-bubble-pos-breathing",
    getDefaultPosition,
    BUBBLE_SIZE
  );

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Limpia el timer si el componente se desmonta, o si se cierra el modal
  // mientras un ciclo está en curso (no queremos un setTimeout corriendo
  // en segundo plano sin UI que lo muestre).
  useEffect(() => {
    if (!open) {
      clearTimer();
      setRunning(false);
      setPhase("ready");
      setCycle(0);
    }
    return clearTimer;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const runPhase = (nextPhase, nextCycle, durationMs) => {
    setPhase(nextPhase);
    setCycle(nextCycle);
    timeoutRef.current = setTimeout(() => stepCycle(nextPhase, nextCycle), durationMs);
  };

  const stepCycle = (currentPhase, currentCycle) => {
    if (currentPhase === "inhale") {
      runPhase("hold", currentCycle, HOLD_MS);
    } else if (currentPhase === "hold") {
      runPhase("exhale", currentCycle, EXHALE_MS);
    } else if (currentPhase === "exhale") {
      if (currentCycle >= TOTAL_CYCLES) {
        setPhase("done");
        setRunning(false);
        grantXp?.(t.app.xpLabels.breathingCompleted);
      } else {
        runPhase("inhale", currentCycle + 1, INHALE_MS);
      }
    }
  };

  const handleStart = () => {
    clearTimer();
    setRunning(true);
    runPhase("inhale", 1, INHALE_MS);
  };

  const handleStop = () => {
    clearTimer();
    setRunning(false);
    setPhase("ready");
    setCycle(0);
  };

  const handleButtonClick = () => {
    if (wasDragged()) return;
    setOpen((v) => !v);
  };

  const buttonStyle = pos
    ? { position: "fixed", left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" }
    : {
        position: "fixed",
        right: "16px",
        bottom: `${20 + bottomOffset + 68}px`,
        left: "auto",
        top: "auto",
      };

  const panelStyle = (() => {
    if (!pos) {
      return { right: "16px", bottom: `${84 + bottomOffset + 68}px`, left: "auto", top: "auto" };
    }
    const panelW = Math.min(300, typeof window !== "undefined" ? window.innerWidth - 32 : 300);
    const panelH = Math.min(typeof window !== "undefined" ? window.innerHeight * 0.6 : 360, 400);
    const { top, left } = computeAnchoredPanelPosition(
      pos,
      BUBBLE_SIZE,
      { w: panelW, h: panelH },
      typeof window !== "undefined" ? window.innerWidth : 360,
      typeof window !== "undefined" ? window.innerHeight : 640
    );
    return { top: `${top}px`, left: `${left}px`, right: "auto", bottom: "auto" };
  })();

  const phaseLabel = {
    ready: t.app.breathing.ready,
    inhale: t.app.breathing.inhale,
    hold: t.app.breathing.hold,
    exhale: t.app.breathing.exhale,
    done: t.app.xpLabels.breathingCompleted,
  }[phase];

  const circleScale = prefersReducedMotion
    ? 1
    : phase === "inhale"
    ? 1.3
    : phase === "hold"
    ? 1.3
    : phase === "exhale"
    ? 0.85
    : 1;
  const circleDuration = phase === "inhale" ? INHALE_MS : phase === "exhale" ? EXHALE_MS : 400;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.app.panels.breathing.title}
          style={{
            position: "fixed",
            ...panelStyle,
            width: "min(300px, calc(100vw - 32px))",
            maxHeight: "min(60vh, 400px)",
            overflowY: "auto",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            padding: "16px",
            zIndex: 60,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
              {t.app.panels.breathing.title}
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.common.close}
              style={{
                width: "32px",
                height: "32px",
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
              <X size={16} />
            </button>
          </div>
          {t.app.panels.breathing.subtitle && (
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
              {t.app.panels.breathing.subtitle}
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0 16px",
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                background: accent,
                opacity: phase === "ready" ? 0.5 : 0.85,
                transform: `scale(${circleScale})`,
                transition: `transform ${circleDuration}ms ease-in-out, opacity 300ms ease`,
                marginBottom: "14px",
              }}
            />
            <span style={{ fontSize: "15px", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
              {phaseLabel}
            </span>
            {running && (
              <span style={{ fontSize: "11px", color: C.textMuted }}>{cycle} / {TOTAL_CYCLES}</span>
            )}
          </div>

          <button
            onClick={running ? handleStop : handleStart}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              minHeight: "44px",
              background: running ? "transparent" : accent,
              border: running ? `1px solid ${C.border}` : "none",
              borderRadius: "12px",
              color: running ? C.text : "#fff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {running ? t.app.breathing.stop : t.app.breathing.start}
          </button>
        </div>
      )}

      <button
        onClick={handleButtonClick}
        onPointerDown={(e) => {
          if (open) setOpen(false);
          dragHandlers.onPointerDown(e);
        }}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
        aria-label={open ? t.common.close : t.app.panels.breathing.title}
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
        {open ? <X size={22} /> : <Wind size={22} />}
      </button>
    </>
  );
}
