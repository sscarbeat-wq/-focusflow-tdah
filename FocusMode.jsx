import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, EyeOff, Lock } from "lucide-react";
import {
  resetTracker,
  recordLeave,
  recordReturn,
  formatDistractionSummary,
  formatReturnToast,
} from "./distractionTracker";

// Modo Enfoque: Pomodoro + ruido blanco generado con Web Audio API.
// No usa archivos de audio externos ni dependencias nuevas — el ruido blanco
// se genera en tiempo real con un buffer de muestras aleatorias, así que no
// hay nada que descargar ni licenciar.
//
// También incluye el "bloqueador de apps distractoras" (versión web): Senda
// no puede bloquear de verdad otras apps del celular/computadora desde el
// navegador, así que en vez de prometer algo que no puede cumplir, se limita
// a avisar dentro del navegador — usa la Page Visibility API para notar
// cuándo el paciente deja esta pestaña mientras una sesión de enfoque está
// corriendo, y le avisa al volver cuánto tiempo estuvo fuera.

const WORK_OPTIONS = [15, 20, 25, 30, 45];
const BREAK_OPTIONS = [3, 5, 10, 15];

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// minimal: 8 de noviembre de 2026 — para el nuevo panel "Solo una cosa"
// (Módulo 4 de ANRO TDAH 2.0), que necesita el mismo temporizador de
// siempre pero SIN los selectores de duración ni el contador de ciclos a la
// vista — esa información es justo el tipo de "ruido" extra que ese panel
// está diseñado para esconder. No es un componente nuevo: es este mismo
// FocusMode, reutilizado, con esa sola parte oculta — el temporizador,
// Play/Pausa/Reiniciar y el ruido blanco siguen funcionando exactamente
// igual que en el panel "Modo Enfoque" normal.
// Fase 3 del sistema de planes (30 de octubre de 2026) — "distractionBlocker"
// (el aviso de apps distractoras dentro de Modo Enfoque) es la única parte
// de este panel que es Plus; el Pomodoro, el ruido blanco y la campana
// siguen funcionando igual sin importar el plan. isPlus=true por default:
// OneThingPanel.jsx usa este mismo componente (variante minimal) y no pasa
// esta prop todavía — así se queda exactamente como estaba antes de este
// cambio, sin bloquear nada ahí.
export default function FocusMode({ C, t, onSessionComplete, onSessionStart, minimal = false, isPlus = true, onRequestUpgrade }) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [cyclesDone, setCyclesDone] = useState(0);
  const [noiseOn, setNoiseOn] = useState(false);
  const [distraction, setDistraction] = useState(resetTracker());
  const [distractionToast, setDistractionToast] = useState(null);

  const tickRef = useRef(null);
  const distractionToastTimeout = useRef(null);

  // --- Temporizador ---
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // Terminó el ciclo actual
        clearInterval(tickRef.current);
        if (mode === "work") {
          setCyclesDone((c) => c + 1);
          onSessionComplete?.();
          playChime();
          setMode("break");
          return breakMin * 60;
        } else {
          playChime();
          setMode("work");
          setRunning(false);
          return workMin * 60;
        }
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, breakMin, workMin]);

  // --- Bloqueador de apps distractoras (versión web): aviso al dejar/volver
  // a la pestaña, solo mientras una sesión de enfoque está realmente
  // corriendo (no durante el descanso ni con el temporizador pausado) ---
  useEffect(() => {
    if (!isPlus || !running || mode !== "work") return;
    const onVisibilityChange = () => {
      if (document.hidden) {
        setDistraction((s) => recordLeave(s, Date.now()));
      } else {
        setDistraction((s) => {
          const { state, awayMs } = recordReturn(s, Date.now());
          const toast = formatReturnToast(awayMs, t.focusMode);
          if (toast) {
            setDistractionToast(toast);
            if (distractionToastTimeout.current) clearTimeout(distractionToastTimeout.current);
            distractionToastTimeout.current = setTimeout(() => setDistractionToast(null), 4000);
          }
          return state;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isPlus, running, mode]);

  useEffect(() => {
    return () => {
      if (distractionToastTimeout.current) clearTimeout(distractionToastTimeout.current);
    };
  }, []);

  // Solo avisamos al padre cuando arranca una sesión NUEVA (secondsLeft
  // todavía en el total completo), no al reanudar después de una pausa —
  // así no se agenda un bloque de calendario duplicado cada vez que el
  // paciente le da play/pausa varias veces a la misma sesión. Por el mismo
  // motivo, el contador de distracciones también se reinicia solo aquí: una
  // sesión nueva empieza con el contador en cero, pero pausar y reanudar la
  // misma sesión no lo borra.
  const start = () => {
    if (mode === "work" && secondsLeft === workMin * 60) {
      onSessionStart?.(workMin);
      setDistraction(resetTracker());
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setMode("work");
    setSecondsLeft(workMin * 60);
    setDistraction(resetTracker());
    setDistractionToast(null);
  };

  const changeWork = (min) => {
    setWorkMin(min);
    if (!running && mode === "work") setSecondsLeft(min * 60);
  };
  const changeBreak = (min) => {
    setBreakMin(min);
    if (!running && mode === "break") setSecondsLeft(min * 60);
  };

  // --- Audio: ruido blanco + campana de fin de sesión (Web Audio API, sin archivos) ---
  const audioCtxRef = useRef(null);
  const noiseNodesRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  }, []);

  const stopNoise = useCallback(() => {
    if (noiseNodesRef.current) {
      try {
        noiseNodesRef.current.source.stop();
      } catch (e) {
        /* ya estaba detenido */
      }
      noiseNodesRef.current.source.disconnect();
      noiseNodesRef.current.gain.disconnect();
      noiseNodesRef.current = null;
    }
  }, []);

  const startNoise = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.05; // volumen bajo, pensado como fondo suave

    source.connect(gain).connect(ctx.destination);
    source.start();
    noiseNodesRef.current = { source, gain };
  }, [getCtx]);

  const toggleNoise = () => {
    const ctx = getCtx();
    if (!ctx) return; // navegador sin soporte de Web Audio
    if (ctx.state === "suspended") ctx.resume();
    if (noiseOn) {
      stopNoise();
      setNoiseOn(false);
    } else {
      startNoise();
      setNoiseOn(true);
    }
  };

  const playChime = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.4);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCtx]);

  useEffect(() => {
    return () => {
      stopNoise();
      audioCtxRef.current?.close?.();
    };
  }, [stopNoise]);

  const inputStyle = {
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "6px 10px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
  };
  const btnPrimary = (bg, textColor) => ({
    background: bg,
    border: "none",
    borderRadius: "50%",
    width: "46px",
    height: "46px",
    color: textColor,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "50%",
    width: "46px",
    height: "46px",
    color: C.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div>
      {!minimal && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: "12px", color: C.textMuted }}>{t.focusMode.workLabel}</label>
          <select
            value={workMin}
            onChange={(e) => changeWork(Number(e.target.value))}
            disabled={running}
            style={inputStyle}
          >
            {WORK_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
          <label style={{ fontSize: "12px", color: C.textMuted }}>{t.focusMode.breakLabel}</label>
          <select
            value={breakMin}
            onChange={(e) => changeBreak(Number(e.target.value))}
            disabled={running}
            style={inputStyle}
          >
            {BREAK_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "14px" }}>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "38px", fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(secondsLeft)}
          </div>
          <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>
            {mode === "work" ? t.focusMode.focusSession : t.focusMode.breakLabel}
            {!minimal && (
              <>
                {" "}
                · {t.focusMode.completedToday(cyclesDone)}
              </>
            )}
          </div>
          {isPlus && mode === "work" && formatDistractionSummary(distraction, t.focusMode) && (
            <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>
              {formatDistractionSummary(distraction, t.focusMode)}
            </div>
          )}
          {/* Fase 3: aviso breve en vez del rastreador real — no se oculta
              nada más del Modo Enfoque (Pomodoro/ruido siguen funcionando),
              solo esta función específica. onRequestUpgrade puede faltar
              (p. ej. OneThingPanel no la pasa) — en ese caso el botón no
              hace nada en vez de romper. */}
          {!isPlus && !minimal && mode === "work" && (
            <button
              type="button"
              onClick={onRequestUpgrade}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "4px",
                background: "transparent",
                border: "none",
                color: C.amberText || C.amber,
                fontSize: "12px",
                cursor: onRequestUpgrade ? "pointer" : "default",
                padding: 0,
              }}
            >
              <Lock size={12} /> {t.upsell.focusDistractionBlocker}
            </button>
          )}
          {distractionToast && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                marginBottom: "6px",
                background: C.mintDark,
                color: "#fff",
                fontSize: "12px",
                padding: "6px 10px",
                borderRadius: "12px",
                width: "240px",
                lineHeight: 1.4,
                zIndex: 1,
              }}
            >
              <EyeOff size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
              {distractionToast}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {!running ? (
            <button onClick={start} aria-label={t.focusMode.start} style={btnPrimary(C.mint, C.mintText)}>
              <Play size={18} />
            </button>
          ) : (
            <button onClick={pause} aria-label={t.focusMode.pause} style={btnPrimary(C.amber, C.amberText)}>
              <Pause size={18} />
            </button>
          )}
          <button onClick={reset} aria-label={t.focusMode.reset} style={btnGhost}>
            <RotateCcw size={16} />
          </button>
          <button
            onClick={toggleNoise}
            aria-label={noiseOn ? t.focusMode.noiseOff : t.focusMode.noiseOn}
            style={noiseOn ? btnPrimary(C.lavender, C.lavenderText) : btnGhost}
            title={t.focusMode.noiseTitle}
          >
            {noiseOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
      {!minimal && (
        <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
          {t.focusMode.footerNote}
        </p>
      )}
    </div>
  );
}
