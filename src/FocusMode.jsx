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

// Arreglo de robustez del 2 de noviembre de 2026 — NO es una de las 6
// funciones de Fase 4, es un bug real encontrado probando la #6: una sesión
// de trabajo corriendo vivía solo en la memoria de React, así que CUALQUIER
// recarga real de la pestaña (el service worker actualizándose, Chrome
// descargando la pestaña por memoria al estar mucho rato en segundo plano,
// un F5 sin querer) la borraba por completo — el reloj, el sonido, todo.
// Arreglar el auto-update silencioso del service worker (ver
// UpdatePrompt.jsx) quita UNA causa, pero no todas: nada que corra en un
// sitio web puede evitar que el navegador decida recargar una pestaña.
//
// Por eso, además, el inicio real de la sesión (hora + duración) se guarda
// en localStorage — a diferencia del estado de React, sobrevive una
// recarga real — y al volver a montar este componente, si encuentra una
// sesión sin terminar reciente, reanuda el reloj desde el tiempo que de
// verdad transcurrió en vez de reiniciar como si nada hubiera corrido. Si
// el tiempo de trabajo ya se habría completado mientras no estábamos, la
// sesión se registra igual (honesto: si pasaron los 25 minutos, pasaron),
// aunque sin el conteo de distracciones de antes de la recarga — eso sí se
// pierde, porque solo vivía en memoria; es una limitación que queda, pero
// ya no se pierde la sesión completa. Solo se activa si el panel que usa
// este componente pasa un `storageKey` (ver FocusFlowTDAH.jsx) — sin eso,
// se comporta exactamente igual que antes.
function readPersistedSession(storageKey) {
  if (!storageKey || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.startedAt !== "number" || typeof parsed.workMin !== "number") return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function writePersistedSession(storageKey, session) {
  if (!storageKey || typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(storageKey, JSON.stringify(session));
    else window.localStorage.removeItem(storageKey);
  } catch (e) {
    // localStorage puede no estar disponible (modo incógnito estricto,
    // almacenamiento lleno, etc.) — no es razón para romper el
    // temporizador, solo no se va a poder reanudar si la pestaña se
    // recarga.
  }
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
// Fase 4, función #2 (31 de octubre de 2026 — "la mascota reacciona en vivo
// durante el enfoque"): `onFocusStatusChange` es un callback OPCIONAL y
// GRATIS (no forma parte del sistema de planes, a diferencia de
// "distractionBlocker" arriba) que avisa al padre "focusing" mientras una
// sesión de trabajo está corriendo, "idle" cuando no, y "distracted" un
// instante cada vez que el paciente deja esta pestaña y vuelve — reutiliza
// el mismo evento de Page Visibility que ya usa el bloqueador de apps
// distractoras, pero en un efecto aparte que NO depende de `isPlus`, para
// que la mascota reaccione igual sin importar el plan. Nadie llama este
// componente con este prop todavía fuera de FocusFlowTDAH.jsx, así que por
// default (undefined) no cambia nada para quien no lo use.
export default function FocusMode({
  C,
  t,
  onSessionComplete,
  onSessionStart,
  minimal = false,
  isPlus = true,
  onRequestUpgrade,
  onFocusStatusChange,
  storageKey,
}) {
  // Se lee UNA sola vez al montar (useState perezoso) — ver el comentario
  // grande arriba de readPersistedSession() para el porqué de todo esto.
  const [persisted] = useState(() => readPersistedSession(storageKey));
  const resumedElapsedSec = persisted ? Math.max(0, Math.floor((Date.now() - persisted.startedAt) / 1000)) : 0;
  const resumedCompleted = !!persisted && resumedElapsedSec >= persisted.workMin * 60;
  const resumedInProgress = !!persisted && !resumedCompleted;

  const [workMin, setWorkMin] = useState(persisted ? persisted.workMin : 25);
  const [breakMin, setBreakMin] = useState(persisted ? persisted.breakMin : 5);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(() =>
    resumedInProgress ? Math.max(1, persisted.workMin * 60 - resumedElapsedSec) : (persisted ? persisted.workMin : 25) * 60
  );
  const [running, setRunning] = useState(resumedInProgress);
  const [cyclesDone, setCyclesDone] = useState(0);
  // noiseOn arranca siempre en false, incluso al reanudar una sesión con
  // ruido de fondo guardado (persisted.noiseOn) — el navegador no deja
  // arrancar audio automáticamente sin que la persona haya interactuado
  // primero en ESTA carga de página, así que decirlo en true de entrada
  // mentiría si el intento automático de más abajo no lo logra. Ese efecto
  // lo pone en true SOLO si de verdad logra que empiece a sonar.
  const [noiseOn, setNoiseOn] = useState(false);
  const [noiseType, setNoiseType] = useState(persisted && persisted.noiseType ? persisted.noiseType : "white");
  const [distraction, setDistraction] = useState(resetTracker());
  const [distractionToast, setDistractionToast] = useState(null);

  const tickRef = useRef(null);
  const distractionToastTimeout = useRef(null);
  const mascotAwaySinceRef = useRef(null);
  // Fase 4, función #6 (2 de noviembre de 2026 — "reportes de enfoque más
  // profundos en Insights Semanales"): el efecto del temporizador de abajo
  // no depende de `distraction` (solo de running/mode/breakMin/workMin, ver
  // el arreglo de dependencias), así que su cierre tendría un valor
  // desactualizado de `distraction` si lo leyera directo. Este ref se
  // mantiene al día en cada cambio, para que el aviso de "sesión completa"
  // siempre reporte el conteo real de distracciones de ESTA sesión.
  const distractionRef = useRef(distraction);
  useEffect(() => {
    distractionRef.current = distraction;
  }, [distraction]);

  // Si al montar encontramos una sesión guardada cuyo tiempo de trabajo ya
  // se habría completado mientras la pestaña estuvo recargándose, la
  // registramos de inmediato — una sola vez — igual que si el temporizador
  // hubiera llegado a 0 normalmente, pero sin conteo de distracciones (se
  // perdió con la recarga) ni campana (no hay nadie frente a la pantalla
  // en este instante exacto).
  const completedOnMountRef = useRef(false);
  useEffect(() => {
    if (resumedCompleted && persisted && !completedOnMountRef.current) {
      completedOnMountRef.current = true;
      writePersistedSession(storageKey, null);
      onSessionComplete?.({
        durationMin: persisted.workMin,
        distractionCount: 0,
        distractionAwayMs: 0,
        distractionTracked: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda (o borra) el "inicio real" de la sesión en localStorage cada vez
  // que arranca o se detiene el reloj de trabajo — tanto un inicio nuevo
  // como reanudar después de pausar recalculan `startedAt` hacia atrás a
  // partir de `secondsLeft` actual, así que siempre queda consistente con
  // lo que de verdad falta por correr.
  useEffect(() => {
    if (!storageKey) return;
    if (running && mode === "work") {
      const elapsedSoFarMs = Math.max(0, workMin * 60 - secondsLeft) * 1000;
      writePersistedSession(storageKey, {
        startedAt: Date.now() - elapsedSoFarMs,
        workMin,
        breakMin,
        noiseOn,
        noiseType,
      });
    } else {
      writePersistedSession(storageKey, null);
    }
    // noiseOn/noiseType se agregan a las dependencias a propósito — si la
    // persona prende o cambia el sonido de fondo a medio camino, queremos
    // que la próxima recarga intente reanudar CON ese sonido, no con el que
    // estaba sonando cuando arrancó el reloj.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, noiseOn, noiseType]);

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
          // Fase 4, función #6: se manda el detalle de la sesión que recién
          // terminó (duración real en minutos, no solo "completó algo") para
          // que FocusFlowTDAH.jsx pueda registrarla en focusSessionLog.js.
          // distractionTracked = isPlus porque el bloqueador de
          // distracciones (recordLeave/recordReturn más arriba) solo corre
          // mientras isPlus es verdadero — ver el comentario de
          // distractionTracked en focusSessionLog.js.
          onSessionComplete?.({
            durationMin: workMin,
            distractionCount: distractionRef.current.count,
            distractionAwayMs: distractionRef.current.totalAwayMs,
            distractionTracked: isPlus,
          });
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

  // --- Mascota en vivo (gratis, sin relación con el plan): avisa al padre
  // si está "focusing" o "idle" según el temporizador, y manda "distracted"
  // un instante cada vez que el paciente vuelve de haber dejado la pestaña
  // (mismo umbral de 2s que ya usa formatReturnToast, para no reaccionar a
  // un parpadeo accidental de la ventana) ---
  useEffect(() => {
    if (!onFocusStatusChange) return;
    if (!running || mode !== "work") {
      onFocusStatusChange("idle");
      return;
    }
    onFocusStatusChange("focusing");
    let backTimeout = null;
    const onVisibilityChange = () => {
      if (document.hidden) {
        mascotAwaySinceRef.current = Date.now();
      } else if (mascotAwaySinceRef.current != null) {
        const awayMs = Date.now() - mascotAwaySinceRef.current;
        mascotAwaySinceRef.current = null;
        if (awayMs >= 2000) {
          onFocusStatusChange("distracted");
          backTimeout = setTimeout(() => onFocusStatusChange("focusing"), 1600);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (backTimeout) clearTimeout(backTimeout);
    };
  }, [running, mode, onFocusStatusChange]);

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
    // Entrada suave (rampa de 0 al volumen final en 120ms) en vez de un
    // salto directo: evita el "click"/corte audible que se oía justo al
    // reanudar el sonido después de volver a la pestaña (2 de noviembre
    // de 2026, pulido de la reanudación de audio).
    const target = 0.05; // volumen bajo, pensado como fondo suave
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.12);

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
    // Misma entrada suave que startBufferTrack, por la misma razón: sin
    // esto el tono binaural también "chasqueaba" al reanudar.
    const target = 0.06;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.12);
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

  // Intento automático (best effort) de volver a prender el sonido de
  // fondo al reanudar una sesión con ruido guardado — solo se marca
  // noiseOn en true si el navegador de verdad lo deja correr. Muchos
  // navegadores bloquean que un sonido arranque solo sin que la persona
  // haya hecho clic en algo primero en ESTA carga de página (política de
  // autoplay) — si eso pasa aquí, el intento falla en silencio y el botón
  // de "Ruido blanco" se queda apagado (honesto con lo que de verdad está
  // sonando); un clic normal en ese botón sí lo prende, porque ESE clic sí
  // cuenta como la interacción que el navegador pedía.
  useEffect(() => {
    if (!resumedInProgress || !persisted || !persisted.noiseOn) return;
    const kind = PLUS_NOISE_TRACKS.includes(persisted.noiseType) && !isPlus ? "white" : persisted.noiseType || "white";
    const ctx = getCtx();
    if (!ctx) return;
    startTrack(kind);
    const ready = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    ready
      .then(() => {
        if (ctx.state === "running") {
          setNoiseType(kind);
          setNoiseOn(true);
        } else {
          stopNoise();
        }
      })
      .catch(() => stopNoise());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
