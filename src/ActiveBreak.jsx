import React, { useEffect, useRef, useState } from "react";
import { tint } from "./theme";

// Pausa activa guiada (11 de noviembre de 2026). Antes era solo un botón
// "Pausa activa de 5 min" con un reloj, metido en el Rastreador de estilo
// de vida — la paciente no sabía qué hacer durante esos 5 minutos ni
// cuándo usarla. Ahora:
//   - Es su propia herramienta (grupo "Concentrarme").
//   - Guía UN movimiento a la vez, 1 minuto cada uno (5 en total), con
//     emoji e instrucción corta. Se puede saltar cualquiera.
//   - Se ofrece sola al terminar una sesión de Modo enfoque (ver
//     `breakPrompt` en FocusFlowTDAH.jsx) y en "Te puede servir ahora".
// Movimientos suaves, sin equipo, que se pueden hacer en casa u oficina.
const STEP_SEC = 60;
const MOVES = [
  { key: "stretch", emoji: "🙆" },
  { key: "shoulders", emoji: "🔄" },
  { key: "walk", emoji: "🚶" },
  { key: "legs", emoji: "🦵" },
  { key: "breathe", emoji: "🌬️" },
];

export default function ActiveBreak({ C, t, accent, autoStart = 0, onComplete }) {
  const ab = t.activeBreak;
  const [step, setStep] = useState(0);
  const [sec, setSec] = useState(STEP_SEC);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const completedRef = useRef(false);

  // autoStart cambia (un número nuevo) cuando se llega aquí desde el aviso
  // de Modo enfoque: arranca sola, sin otro toque.
  useEffect(() => {
    if (autoStart) {
      setStep(0);
      setSec(STEP_SEC);
      setDone(false);
      completedRef.current = false;
      setRunning(true);
    }
  }, [autoStart]);

  const finish = () => {
    setRunning(false);
    setDone(true);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const next = () => {
    if (step >= MOVES.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
    setSec(STEP_SEC);
  };

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Al llegar a 0:00 pasa sola al siguiente movimiento (o termina).
  useEffect(() => {
    if (running && sec === 0) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec, running]);

  const restart = () => {
    setStep(0);
    setSec(STEP_SEC);
    setDone(false);
    completedRef.current = false;
    setRunning(true);
  };

  const move = MOVES[step];
  const totalLeft = (MOVES.length - 1 - step) * STEP_SEC + sec;
  const mm = String(Math.floor(sec / 60)).padStart(1, "0");
  const ss = String(sec % 60).padStart(2, "0");

  const btn = (bg, fg, extra) => ({
    minHeight: "46px",
    padding: "0 20px",
    borderRadius: "14px",
    border: "none",
    background: bg,
    color: fg,
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    ...extra,
  });

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div aria-hidden="true" style={{ fontSize: "46px" }}>🎉</div>
        <p style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: "8px 0 4px" }}>{ab.doneTitle}</p>
        <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>{ab.doneText}</p>
        <button type="button" onClick={restart} style={btn(C.surfaceAlt, C.text, { border: `1px solid ${C.border}` })}>
          {ab.again}
        </button>
      </div>
    );
  }

  const started = running || step > 0 || sec < STEP_SEC;

  return (
    <div>
      {!started && (
        <p style={{ fontSize: "14px", color: C.text, margin: "0 0 16px", lineHeight: 1.6 }}>{ab.intro}</p>
      )}

      {/* Puntitos de avance: uno por movimiento */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }} aria-hidden="true">
        {MOVES.map((m, i) => (
          <div
            key={m.key}
            style={{
              flex: 1,
              height: "6px",
              borderRadius: "3px",
              background: i < step ? accent : i === step && started ? tint(accent, 0.55) : C.border,
            }}
          />
        ))}
      </div>

      <div
        style={{
          padding: "16px 18px",
          borderRadius: "18px",
          background: tint(accent, 0.1),
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <span aria-hidden="true" style={{ fontSize: "42px", lineHeight: 1 }}>{move.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: C.textMuted, margin: 0 }}>{ab.stepOf(step + 1, MOVES.length)}</p>
            <p style={{ fontSize: "18px", fontWeight: 800, color: C.text, margin: "2px 0 0", lineHeight: 1.25 }}>{ab.moves[move.key].title}</p>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
            {mm}:{ss}
          </div>
        </div>
        <p style={{ fontSize: "15px", color: C.text, margin: 0, lineHeight: 1.55 }}>{ab.moves[move.key].text}</p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => setRunning((r) => !r)} style={btn(running ? C.surfaceAlt : accent, running ? C.text : "#fff", running ? { border: `1px solid ${C.border}` } : null)}>
          {running ? ab.pause : started ? ab.resume : ab.start}
        </button>
        {started && (
          <button type="button" onClick={next} style={btn("transparent", C.textMuted, { border: `1px solid ${C.border}`, fontSize: "14px" })}>
            {ab.skip}
          </button>
        )}
        <span style={{ fontSize: "12.5px", color: C.textMuted }}>{ab.totalLeft(Math.ceil(totalLeft / 60))}</span>
      </div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "14px 0 0", lineHeight: 1.5 }}>{ab.safety}</p>
    </div>
  );
}
