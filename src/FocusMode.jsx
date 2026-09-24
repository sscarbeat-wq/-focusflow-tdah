import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

// Modo Enfoque: Pomodoro + ruido blanco generado con Web Audio API.
// No usa archivos de audio externos ni dependencias nuevas — el ruido blanco
// se genera en tiempo real con un buffer de muestras aleatorias, así que no
// hay nada que descargar ni licenciar.

const WORK_OPTIONS = [15, 20, 25, 30, 45];
const BREAK_OPTIONS = [3, 5, 10, 15];

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FocusMode({ C, onSessionComplete }) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [cyclesDone, setCyclesDone] = useState(0);
  const [noiseOn, setNoiseOn] = useState(false);

  const tickRef = useRef(null);

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

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setMode("work");
    setSecondsLeft(workMin * 60);
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
    borderRadius: "6px",
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
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontSize: "12px", color: C.textMuted }}>Enfoque</label>
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
        <label style={{ fontSize: "12px", color: C.textMuted }}>Descanso</label>
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

      <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "38px", fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmt(secondsLeft)}
          </div>
          <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "4px" }}>
            {mode === "work" ? "Sesión de enfoque" : "Descanso"} · {cyclesDone} completadas hoy
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {!running ? (
            <button onClick={start} aria-label="Iniciar" style={btnPrimary(C.mint, C.mintText)}>
              <Play size={18} />
            </button>
          ) : (
            <button onClick={pause} aria-label="Pausar" style={btnPrimary(C.amber, C.amberText)}>
              <Pause size={18} />
            </button>
          )}
          <button onClick={reset} aria-label="Reiniciar" style={btnGhost}>
            <RotateCcw size={16} />
          </button>
          <button
            onClick={toggleNoise}
            aria-label={noiseOn ? "Apagar ruido blanco" : "Encender ruido blanco"}
            style={noiseOn ? btnPrimary(C.lavender, C.lavenderText) : btnGhost}
            title="Ruido blanco de fondo"
          >
            {noiseOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
        El ruido blanco se genera en el dispositivo, sin descargar nada. Al terminar cada sesión de enfoque suena una
        campana suave.
      </p>
    </div>
  );
}

