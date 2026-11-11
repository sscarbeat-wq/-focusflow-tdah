import React, { useEffect, useRef, useState } from "react";
import { tint } from "./theme";
import { tapFeedback } from "./celebrate";
import MoveArt from "./MoveArt";
import { voiceSupported, getStoredVoicePref, storeVoicePref, speak, stopSpeaking } from "./breakVoice";

// Pausa activa guiada.
//
// Historia: nació el 11 de noviembre de 2026 como una sola rutina de 5
// movimientos con un emoji cada uno y un botón "Siguiente →". La doctora la
// probó y pidió tres cosas (12 de noviembre): dibujos menos sencillos,
// varios tipos de pausa para elegir, y no tener que tocar "siguiente".
// Ahora:
//   - 4 tipos de pausa (ROUTINES): estirarme, activarme, sin levantarme de
//     la silla y descansar la vista. Duran de 2 a 5 minutos.
//   - Cada movimiento tiene su ilustración (MoveArt.jsx: imágenes hechas
//     con Gemini; si no cargan, el muñequito animado de MoveFigure.jsx).
//   - Avanza SOLO: al acabarse el tiempo de un movimiento pasa al
//     siguiente con un sonidito, y siempre se ve cuál sigue. El anillo
//     alrededor del personaje es la cuenta regresiva. "Saltar" queda como
//     botón chico por si un movimiento molesta, pero no hace falta tocarlo.
//   - Los XP se dan al terminar solo si de verdad se hizo al menos la mitad
//     del tiempo (saltarse todo no cuenta).
// Se ofrece sola al terminar una sesión de Modo enfoque, en "Te puede
// servir ahora" y en la pestaña de hábitos de Inicio.
export const ROUTINES = [
  {
    key: "stretch",
    color: "#2FA37C",
    emoji: "🙆",
    stepSec: 60,
    moves: [
      { key: "armsUp", fig: "armsUp" },
      { key: "shoulders", fig: "shoulders" },
      { key: "sideBend", fig: "sideBend" },
      { key: "twist", fig: "twist" },
      { key: "breathe", fig: "breathe" },
    ],
  },
  {
    key: "energy",
    color: "#E8703A",
    emoji: "⚡",
    stepSec: 60,
    moves: [
      { key: "march", fig: "march" },
      { key: "squat", fig: "squat" },
      { key: "jacks", fig: "jacks" },
      { key: "punches", fig: "punches" },
      { key: "coolDown", fig: "breathe" },
    ],
  },
  {
    key: "chair",
    color: "#6C7BE0",
    emoji: "🪑",
    stepSec: 45,
    seated: true,
    moves: [
      { key: "neck", fig: "neck" },
      { key: "shouldersBack", fig: "shoulders" },
      { key: "chairTwist", fig: "twist" },
      { key: "seatedLegs", fig: "seatedLegs" },
    ],
  },
  {
    key: "eyes",
    color: "#2E9BD6",
    emoji: "👀",
    stepSec: 30,
    moves: [
      { key: "eyesFar", fig: "eyesFar" },
      { key: "eyesClosed", fig: "eyesClosed" },
      { key: "wrists", fig: "wrists" },
      { key: "shake", fig: "shake" },
    ],
  },
];

// Fondo claro fijo detrás del personaje (en tema claro y oscuro), para que
// siempre se vea igual de bien.
const stage = (color) => `color-mix(in srgb, ${color} 12%, #fff)`;

const routineMinutes = (r) => Math.round((r.stepSec * r.moves.length) / 60);

export default function ActiveBreak({ C, t, lang = "es", autoStart = 0, onComplete, onActiveChange, isNarrow }) {
  const ab = t.activeBreak;
  const [routineKey, setRoutineKey] = useState(null); // null = eligiendo
  const [step, setStep] = useState(0);
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const activeSecRef = useRef(0); // segundos realmente transcurridos
  const completedRef = useRef(false);
  const routine = ROUTINES.find((r) => r.key === routineKey) || null;
  // Mientras se hace una pausa, FocusFlowTDAH.jsx esconde los botones
  // flotantes (en el teléfono tapaban "Saltar este" y "Terminar").
  const inProgress = !!routine && !done;
  useEffect(() => {
    onActiveChange?.(inProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress]);

  // ---- Guía con voz (opcional, apagada de inicio; ver breakVoice.js) ----
  const canSpeak = voiceSupported();
  const [voiceOn, setVoiceOn] = useState(() => canSpeak && getStoredVoicePref());
  const sayMove = (r, index) => {
    const m = r.moves[index];
    speak(`${ab.moves[m.key].title}. ${ab.moves[m.key].text}`, lang);
  };
  const toggleVoice = () => {
    const nextOn = !voiceOn;
    setVoiceOn(nextOn);
    storeVoicePref(nextOn);
    if (!nextOn) stopSpeaking();
    else if (routine && !done) sayMove(routine, step); // al encenderla a media pausa, dice el movimiento actual
    else speak(ab.voiceTest, lang); // para que se oiga cómo suena
  };
  // Al salir de la herramienta (o cerrar la app) la voz se calla.
  useEffect(() => stopSpeaking, []);

  const toPicker = () => {
    stopSpeaking();
    setRunning(false);
    setRoutineKey(null);
    setDone(false);
  };
  // Llegando desde el aviso de Modo enfoque o la pestaña de hábitos: se
  // empieza siempre en la pantalla para elegir.
  useEffect(() => {
    if (autoStart) toPicker();
  }, [autoStart]);

  const begin = (r) => {
    setRoutineKey(r.key);
    setStep(0);
    setSec(r.stepSec);
    setDone(false);
    activeSecRef.current = 0;
    completedRef.current = false;
    setRunning(true);
    tapFeedback("pick");
    // Dentro del toque de la persona: así los teléfonos permiten la voz.
    if (voiceOn) sayMove(r, 0);
  };

  const finish = () => {
    setRunning(false);
    setDone(true);
    if (voiceOn) speak(`${ab.doneTitle} ${ab.doneText}`, lang);
    const total = routine.stepSec * routine.moves.length;
    if (!completedRef.current && activeSecRef.current >= total / 2) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const next = () => {
    if (!routine) return;
    if (step >= routine.moves.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
    setSec(routine.stepSec);
    tapFeedback("drop");
    if (voiceOn) sayMove(routine, step + 1);
  };

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      activeSecRef.current += 1;
      setSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Al llegar a 0:00 pasa SOLA al siguiente movimiento (o termina).
  useEffect(() => {
    if (running && routine && sec === 0) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sec, running]);

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

  const voiceToggle = canSpeak && (
    <button
      type="button"
      role="switch"
      aria-checked={voiceOn}
      onClick={toggleVoice}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minHeight: "40px",
        padding: "0 14px",
        borderRadius: "999px",
        border: `1px solid ${voiceOn ? C.mint : C.border}`,
        background: voiceOn ? tint(C.mint, 0.16) : "transparent",
        color: C.text,
        fontSize: "13.5px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      <span aria-hidden="true">{voiceOn ? "🔊" : "🔇"}</span>
      {ab.voiceLabel}: {voiceOn ? ab.voiceOn : ab.voiceOff}
    </button>
  );

  // ---------- 1) Elegir el tipo de pausa ----------
  if (!routine) {
    return (
      <div>
        <p style={{ fontSize: "14px", color: C.text, margin: "0 0 14px", lineHeight: 1.6 }}>{ab.intro}</p>
        {voiceToggle && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 16px" }}>
            {voiceToggle}
            <span style={{ fontSize: "12.5px", color: C.textMuted, lineHeight: 1.4 }}>{ab.voiceHint}</span>
          </div>
        )}
        <p style={{ fontSize: "16px", fontWeight: 800, color: C.text, margin: "0 0 10px" }}>{ab.pickTitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "10px" }}>
          {ROUTINES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => begin(r)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px 10px 8px",
                borderRadius: "18px",
                border: `1px solid ${tint(r.color, 0.4)}`,
                background: tint(r.color, 0.09),
                color: C.text,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ flexShrink: 0, borderRadius: "16px", background: stage(r.color) }}>
                <MoveArt moveKey={r.moves[0].key} fig={r.moves[0].fig} seated={r.seated} color={r.color} size={84} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800 }}>{ab.routines[r.key].title}</span>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: C.textMuted }}>{ab.minutes(routineMinutes(r))}</span>
                </span>
                <span style={{ display: "block", fontSize: "13px", color: C.textMuted, lineHeight: 1.45, marginTop: "2px" }}>{ab.routines[r.key].desc}</span>
              </span>
              <span aria-hidden="true" style={{ fontSize: "20px", fontWeight: 800, color: C.textMuted }}>›</span>
            </button>
          ))}
        </div>
        <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "14px 0 0", lineHeight: 1.5 }}>{ab.safety}</p>
      </div>
    );
  }

  // ---------- 3) Terminó ----------
  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div aria-hidden="true" style={{ fontSize: "46px" }}>🎉</div>
        <p style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: "8px 0 4px" }}>{ab.doneTitle}</p>
        <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>{ab.doneText}</p>
        <button type="button" onClick={toPicker} style={btn(C.surfaceAlt, C.text, { border: `1px solid ${C.border}` })}>
          {ab.again}
        </button>
      </div>
    );
  }

  // ---------- 2) Haciendo la pausa ----------
  const move = routine.moves[step];
  const nextMove = routine.moves[step + 1];
  const totalLeft = (routine.moves.length - 1 - step) * routine.stepSec + sec;
  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, "0");
  const figSize = isNarrow ? 190 : 210;
  const ringSize = figSize + 28;
  const radius = ringSize / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const progress = sec / routine.stepSec; // 1 → 0
  const accent = routine.color;

  return (
    <div>
      {/* Avance: una rayita por movimiento */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }} aria-hidden="true">
        {routine.moves.map((m, i) => (
          <div key={m.key} style={{ flex: 1, height: "6px", borderRadius: "3px", background: i < step ? accent : i === step ? tint(accent, 0.55) : C.border }} />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isNarrow ? "column" : "row",
          alignItems: "center",
          gap: isNarrow ? "12px" : "28px",
          padding: isNarrow ? "16px 14px" : "20px 24px",
          borderRadius: "22px",
          background: tint(accent, 0.09),
          marginBottom: "16px",
        }}
      >
        {/* El personaje, dentro del anillo de cuenta regresiva */}
        <div style={{ position: "relative", width: `${ringSize}px`, height: `${ringSize}px`, flexShrink: 0 }}>
          <svg width={ringSize} height={ringSize} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden="true">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill={stage(accent)} stroke={tint(accent, 0.25)} strokeWidth="6" />
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke={accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MoveArt key={move.key} moveKey={move.key} fig={move.fig} seated={routine.seated} color={accent} running={running} size={figSize - 6} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, textAlign: isNarrow ? "center" : "left" }}>
          <p style={{ fontSize: "12.5px", fontWeight: 700, color: C.textMuted, margin: 0 }}>
            {!isNarrow && `${ab.routines[routine.key].title} · `}
            {ab.stepOf(step + 1, routine.moves.length)} · {ab.totalLeft(Math.ceil(totalLeft / 60))}
          </p>
          <p style={{ fontSize: isNarrow ? "21px" : "24px", fontWeight: 800, color: C.text, margin: "2px 0 6px", lineHeight: 1.2 }}>{ab.moves[move.key].title}</p>
          <p style={{ fontSize: "15.5px", color: C.text, margin: "0 0 12px", lineHeight: 1.55 }}>{ab.moves[move.key].text}</p>
          <p aria-live="off" style={{ fontSize: "34px", fontWeight: 800, color: C.text, margin: 0, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {mm}:{ss}
          </p>
          <p style={{ fontSize: "13.5px", color: C.textMuted, margin: "8px 0 0", lineHeight: 1.4 }}>
            {nextMove ? (
              <>
                {ab.autoNext} <strong style={{ color: C.text }}>{ab.moves[nextMove.key].title}</strong>
              </>
            ) : (
              ab.lastOne
            )}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => {
            if (running) stopSpeaking();
            setRunning((r) => !r);
          }}
          style={btn(running ? C.surfaceAlt : accent, running ? C.text : "#fff", running ? { border: `1px solid ${C.border}` } : null)}
        >
          {running ? ab.pause : ab.resume}
        </button>
        {voiceToggle}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={next} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "13px", fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: "10px 6px" }}>
          {ab.skip}
        </button>
        <button type="button" onClick={toPicker} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "13px", fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: "10px 6px" }}>
          {ab.stop}
        </button>
      </div>
    </div>
  );
}
