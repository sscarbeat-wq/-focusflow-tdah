import React, { useEffect, useRef } from "react";
import { Pill } from "lucide-react";
import { tint } from "./theme";

// Alarma activa de medicamentos — función #5 de Fase 4 (inspirada en
// Alarmy, de la lista "10 aplicaciones para el TDAH"). GRATIS, decisión
// confirmada con la doctora el 31 de octubre de 2026 ("ok está bien" a la
// propuesta de que fuera gratis por ser seguridad clínica, no un extra de
// conveniencia).
//
// Honestidad igual que el bloqueador de distracciones de Modo Enfoque: la
// app NO puede hacer sonar una alarma de verdad con la pestaña cerrada —
// eso requiere desarrollo nativo. Lo que SÍ puede hacer es esto: mientras
// la pestaña está abierta, cuando llega (o ya pasó, hasta 4 horas) la hora
// de una dosis sin marcar, FocusFlowTDAH.jsx dispara esta pantalla
// completa — suena un tono en loop (Web Audio API, sin archivos externos,
// mismo principio que el resto de los sonidos del proyecto) y a propósito
// NO tiene botón de cerrar, ni se cierra tocando afuera ni con Escape:
// solo "Ya la tomé" (marca la dosis) o "Posponer 5 min" (vuelve a sonar en
// 5 minutos — nunca "ignorar para siempre", eso es justo lo que la vuelve
// activa y no un aviso pasivo más, ver FocusFlowTDAH.jsx). El push normal
// (api/send-reminders.js) sigue siendo el respaldo para cuando la app está
// cerrada — esta pantalla no lo reemplaza, solo mejora el caso en que la
// paciente ya tiene la app abierta.
function beep(ctx, startAt, freq = 880, duration = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(0.1, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export default function MedicationAlarm({ C, t, medicationName, time, onTaken, onSnooze }) {
  const a = t.medication.alarm;
  const takenButtonRef = useRef(null);

  // Tono en loop (dos beeps + pausa, cada 1.4s) mientras esta pantalla está
  // montada — se detiene solo al desmontarse (es decir, al tomar o
  // posponer), nunca por su cuenta, para no convertirse en un aviso que se
  // calla solo y se vuelve ignorable.
  useEffect(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return undefined;
    const ctx = new AC();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {
        // Si el navegador no deja reanudar el audio todavía, la pantalla
        // sigue funcionando en silencio — no es razón para no mostrarla.
      });
    }
    const playPattern = () => {
      const now = ctx.currentTime;
      beep(ctx, now, 880, 0.15);
      beep(ctx, now + 0.22, 880, 0.15);
    };
    playPattern();
    const interval = setInterval(playPattern, 1400);
    return () => {
      clearInterval(interval);
      ctx.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    takenButtonRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={a.ariaLabel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: `linear-gradient(160deg, ${C.surfaceAlt}, ${C.bg})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <style>{`
        @keyframes anroAlarmPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .anro-alarm-ring { animation: anroAlarmPulse 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anro-alarm-ring { animation: none !important; }
        }
      `}</style>
      <div
        className="anro-alarm-ring"
        aria-hidden="true"
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint(C.coral, 0.4)} 0%, transparent 70%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "28px",
          flexShrink: 0,
        }}
      >
        <Pill size={52} color={C.coral} />
      </div>
      <p
        style={{
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.textMuted,
          fontWeight: 700,
          margin: "0 0 8px",
        }}
      >
        {a.headline}
      </p>
      <p style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>{medicationName}</p>
      <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 36px" }}>{a.doseAt(time)}</p>
      <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          ref={takenButtonRef}
          type="button"
          onClick={onTaken}
          style={{
            background: C.mint,
            color: C.mintText,
            border: "none",
            borderRadius: "16px",
            padding: "16px",
            fontSize: "15px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {a.takenButton}
        </button>
        <button
          type="button"
          onClick={onSnooze}
          style={{
            background: "transparent",
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            padding: "14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {a.snoozeButton}
        </button>
      </div>
      <p style={{ marginTop: "28px", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.5, maxWidth: "340px" }}>
        {a.footnote}
      </p>
    </div>
  );
}
