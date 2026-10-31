import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, EyeOff, Lock } from "lucide-react";
import {
  resetTracker,
  recordLeave,
  recordReturn,
  formatDistractionSummary,
  formatReturnToast,
} from "./distractionTracker";
import { PlusUpsellBadge } from "./PlusUpsellCard";

// Modo Enfoque: Pomodoro + sonidos de fondo generados con Web Audio API.
// No usa archivos de audio externos ni dependencias nuevas — los 4 sonidos
// (ruido blanco, ruido rosa, ruido marrón y un tono de enfoque binaural) se
// generan en tiempo real, así que no hay nada que descargar ni licenciar.
//
// También incluye el "bloqueador de apps distractoras" (versión web): Senda
// no puede bloquear de verdad otras apps del celular/computadora desde el
// navegador, así que en vez de prometer algo que no puede cumplir, se limita
// a avisar dentro del navegador — usa la Page Visibility API para notar
// cuándo el paciente deja esta pestaña mientras una sesión de enfoque está
// corriendo, y le avisa al volver cuánto tiempo estuvo fuera.

const WORK_OPTIONS = [15, 20, 25, 30, 45];
const BREAK_OPTIONS = [3, 5, 10, 15];

// Fase 4 (sonidos de enfoque, 30 de octubre de 2026) — el ruido blanco
// original se queda gratis (es lo que ya tenía la app); los otros 3 son la
// función Plus nueva "focusAudioTracks" (ver PLUS_FEATURE_KEYS en plans.js).
const NOISE_TRACKS = ["white", "pink", "brown", "binaural"];
const PLUS_NOISE_TRACKS = ["pink", "brown", "binaural"];

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
// Fase 3+4 del sistema de planes (30 de octubre de 2026) — "distractionBlocker"
// (el aviso de apps distractoras) y "focusAudioTracks" (los 3 sonidos
// nuevos) son las únicas partes de este panel que son Plus; el Pomodoro, el
// ruido blanco original y la campana siguen funcionando igual sin importar
// el plan. isPlus=true por default: OneThingPanel.jsx usa este mismo
// componente (variante minimal, sin selector de sonido) y no pasa esta prop
// todavía — así se queda exactamente como estaba antes de este cambio, sin
// bloquear nada ahí.
export default function FocusMode({ C, t, onSessionComplete, onSessionStart, minimal = false, isPlus = true, onRequestUpgrade }) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [cyclesDone, setCyclesDone] = useState(0);
  const [noiseOn, setNoiseOn] = useState(false);
  const [noiseType, setNoiseType] = useState("white");
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

  // --- Audio: sonidos de fondo + campana de fin de sesión (Web Audio API, sin archivos) ---
  const audioCtxRef = useRef(null);
  const noiseNodesRef = useRef(null); // array de nodos activos (buffer+gain, u osciladores+paneo+gain para el binaural)

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
      noiseNodesRef.current.forEach((node) => {
        try {
          node.stop?.();
        } catch (e) {
          /* ya estaba detenido */
        }
        node.disconnect?.();
      });
      noiseNodesRef.current = null;
    }
  }, []);

  // Ruido blanco (gratis, ya existía), rosa y marrón (Plus): los tres se
  // precalculan en un buffer de 2s que se repite en loop — mismo patrón que
  // ya usaba el ruido blanco, nada nuevo que aprender. El rosa usa el filtro
  // de Paul Kellett (aproximación estándar a partir de ruido blanco); el
  // marrón es un paseo aleatorio (integración de ruido blanco) con fuga para
  // que no se vaya a los extremos.
  const makeNoiseBuffer = (ctx, kind) => {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (kind === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (kind === "brown") {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5; // compensa el volumen que se pierde al integrar
      }
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1; // "white"
    }
    return buffer;
  };

  const startBufferTrack = useCallback((kind) => {
    const ctx = getCtx();
    if (!ctx) return;
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, kind);
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.05; // volumen bajo, pensado como fondo suave

    source.connect(gain).connect(ctx.destination);
    source.start();
    noiseNodesRef.current = [source, gain];
  }, [getCtx]);

  // Tono de enfoque binaural (Plus): dos tonos puros, uno por oído, con una
  // diferencia de 6Hz entre ambos (banda alfa, asociada con un estado
  // relajado pero despierto) — el cerebro percibe esa diferencia como un
  // "latido" solo si se escucha con audífonos, así que el aviso en pantalla
  // lo menciona. Nada nuevo: dos osciladores + paneo estéreo, parte estándar
  // de Web Audio API.
  const startBinauralTrack = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const baseFreq = 200;
    const beatFreq = 6;

    const gain = ctx.createGain();
    gain.gain.value = 0.06;
    gain.connect(ctx.destination);

    const canPan = typeof ctx.createStereoPanner === "function";
    const nodes = [gain];

    const oscLeft = ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.value = baseFreq;
    if (canPan) {
      const panLeft = ctx.createStereoPanner();
      panLeft.pan.value = -1;
      oscLeft.connect(panLeft).connect(gain);
      nodes.push(panLeft);
    } else {
      oscLeft.connect(gain);
    }
    oscLeft.start();
    nodes.push(oscLeft);

    const oscRight = ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.value = baseFreq + beatFreq;
    if (canPan) {
      const panRight = ctx.createStereoPanner();
      panRight.pan.value = 1;
      oscRight.connect(panRight).connect(gain);
      nodes.push(panRight);
    } else {
      oscRight.connect(gain);
    }
    oscRight.start();
    nodes.push(oscRight);

    noiseNodesRef.current = nodes;
  }, [getCtx]);

  const startTrack = useCallback(
    (kind) => {
      if (kind === "binaural") startBinauralTrack();
      else startBufferTrack(kind);
    },
    [startBinauralTrack, startBufferTrack]
  );

  const toggleNoise = () => {
    const ctx = getCtx();
    if (!ctx) return; // navegador sin soporte de Web Audio
    if (ctx.state === "suspended") ctx.resume();
    if (noiseOn) {
      stopNoise();
      setNoiseOn(false);
    } else {
      startTrack(noiseType);
      setNoiseOn(true);
    }
  };

  // Fase 4: elegir un sonido Plus sin ser Plus abre el Paywall en vez de
  // cambiar el sonido — el ruido blanco (gratis) siempre se puede elegir.
  const selectNoiseTrack = (kind) => {
    if (PLUS_NOISE_TRACKS.includes(kind) && !isPlus) {
      onRequestUpgrade?.();
      return;
    }
    if (kind === noiseType) return;
    setNoiseType(kind);
    if (noiseOn) {
      stopNoise();
      startTrack(kind);
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
      {/* Fase 4 (sonidos de enfoque, 30 de octubre de 2026) — selector de
          sonido; oculto en la variante minimal (OneThingPanel) para no
          sumarle ruido visual a ese panel, igual que los selectores de
          duración de arriba. El ruido blanco siempre está disponible; los
          otros 3 muestran el candado si la cuenta no es Plus. */}
      {!minimal && (
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>{t.focusMode.noiseTitle}</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {NOISE_TRACKS.map((kind) => {
              const active = noiseType === kind;
              const locked = PLUS_NOISE_TRACKS.includes(kind) && !isPlus;
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => selectNoiseTrack(kind)}
                  title={locked ? t.upsell.focusAudioTracks : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "6px 10px",
                    borderRadius: "12px",
                    border: `1px solid ${active ? C.lavender : C.border}`,
                    background: active ? C.lavender : "transparent",
                    color: active ? C.lavenderText : C.textMuted,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {locked && <Lock size={11} />}
                  {t.focusMode.noiseTracks[kind]}
                  {locked && <PlusUpsellBadge C={C} t={t} />}
                </button>
              );
            })}
          </div>
          {noiseType === "binaural" && (
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>
              {t.focusMode.binauralHeadphonesNote}
            </p>
          )}
        </div>
      )}
      {!minimal && (
        <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
          {t.focusMode.footerNote}
        </p>
      )}
    </div>
  );
}
