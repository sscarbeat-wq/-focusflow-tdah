import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2, VolumeX, Sparkles, Activity, Wind, Brain, CheckCircle2, Timer, Moon } from "lucide-react";
import {
  MINDFULNESS_PROGRAMS,
  programTotalSeconds,
  stepIndexAt,
  secondsLeftInStep,
  isFinished,
} from "./mindfulness";

// Síntesis de voz nativa del navegador (Web Speech API) para "escuchar" el
// paso actual — a propósito NO usa ningún servicio de IA, el texto ya está
// escrito de antemano (ver mindfulness.js). Si el navegador no la soporta,
// el botón simplemente no aparece y el texto en pantalla siempre funciona.
function getSpeechSynthesis() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
}

// Un ícono por programa (para el menú) y por paso (para la tarjeta en
// curso) — 20 de noviembre de 2026 ("que se vea bonita" + varios ejercicios
// nuevos). Reutiliza íconos que la app ya usa en otras herramientas, nunca
// introduce un lenguaje visual nuevo.
const PROGRAM_ICONS = {
  clasica: Sparkles,
  rapida: Timer,
  escaneo: Activity,
  respiracion478: Wind,
  dormir: Moon,
};

const STEP_ICONS = {
  llegar: Sparkles,
  cuerpo: Activity,
  respiracion: Wind,
  mente: Brain,
  cierre: CheckCircle2,
  piesPiernas: Activity,
  torsoManos: Activity,
  hombrosCuello: Activity,
  caraCabeza: Activity,
  cuerpoCompleto: Activity,
  intro: Wind,
  inhala: Wind,
  sostiene: Wind,
  exhala: Wind,
  soltarDia: Moon,
  cuerpoPesado: Moon,
};

// Prácticas breves de atención plena guiada — ver mindfulness.js para la
// evidencia clínica detrás de esta herramienta y el guion completo de cada
// programa. Autocontenido, mismo patrón que FocusMode.jsx: lleva su propio
// temporizador y solo avisa al padre cuando una práctica se completa
// (`onComplete`) para que ahí se otorgue el XP — este componente nunca toca
// el progreso guardado.
//
// 20 de noviembre de 2026 ("añadir otros ejercicios de mindfulness"): lo
// que era un solo ejercicio fijo ahora es un menú (MINDFULNESS_PROGRAMS) —
// la pantalla de inicio pasó de un botón "Empezar" a una lista de tarjetas,
// una por programa; todo lo demás (cronómetro, voz, "Detener") es el mismo
// motor de antes, solo que ahora parametrizado por el programa elegido en
// vez de un guion fijo.
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

export default function MindfulnessPanel({ C, t, lang, onComplete }) {
  const [programId, setProgramId] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [justFinishedMinutes, setJustFinishedMinutes] = useState(0);
  // 20 de noviembre de 2026 ("al ponerle escuchar se apaga la voz al pasar
  // al siguiente paso"): "Escuchar" leía el paso UNA sola vez y se quedaba
  // ahí — al avanzar de paso había que volver a tocarlo a mano, lo que se
  // sentía como que "la voz se apagaba sola". Ahora es un interruptor: una
  // vez activado, sigue narrando cada paso nuevo solo, hasta que se apague
  // o termine la práctica.
  const [voiceOn, setVoiceOn] = useState(false);
  const tickRef = useRef(null);
  const finishedTimeout = useRef(null);
  const speechSynthesis = getSpeechSynthesis();

  const program = programId ? MINDFULNESS_PROGRAMS.find((p) => p.id === programId) : null;

  useEffect(() => {
    if (!running || !program) return;
    tickRef.current = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (isFinished(program, next)) {
          clearInterval(tickRef.current);
          setRunning(false);
          setJustFinished(true);
          setJustFinishedMinutes(Math.max(1, Math.round(programTotalSeconds(program) / 60)));
          // 20 de noviembre de 2026 ("cuando le pongo detener no se detiene
          // la voz"): si la práctica termina sola mientras seguía hablando
          // (por ejemplo, alguien le dio "Escuchar" al último paso), también
          // hay que cortar el audio aquí, no solo al tocar "Detener" a mano.
          speechSynthesis?.cancel();
          onComplete?.();
          if (finishedTimeout.current) clearTimeout(finishedTimeout.current);
          finishedTimeout.current = setTimeout(() => setJustFinished(false), 5000);
          setProgramId(null);
          return programTotalSeconds(program);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, program]);

  useEffect(() => () => finishedTimeout.current && clearTimeout(finishedTimeout.current), []);

  // 20 de noviembre de 2026: si la persona sale de esta herramienta (cambia
  // de pantalla) mientras la voz sigue hablando, cortarla también — antes
  // no había ninguna limpieza al desmontar y la voz podía seguir sola de
  // fondo sin que hubiera ya ninguna práctica visible en pantalla.
  useEffect(() => () => speechSynthesis?.cancel(), [speechSynthesis]);

  const start = (id) => {
    setJustFinished(false);
    setElapsed(0);
    setProgramId(id);
    setRunning(true);
    setVoiceOn(false);
  };

  const stop = () => {
    setRunning(false);
    setProgramId(null);
    setVoiceOn(false);
    clearInterval(tickRef.current);
    // 20 de noviembre de 2026 ("cuando le pongo detener no se detiene la
    // voz"): esto faltaba — "Detener" paraba el cronómetro y la cuenta
    // regresiva, pero no el audio del navegador, así que la voz seguía
    // leyendo el paso aunque la pantalla ya hubiera regresado al menú.
    speechSynthesis?.cancel();
  };

  const stepIndex = running && program ? stepIndexAt(program, elapsed) : null;
  const step = stepIndex === null || !program ? null : program.steps[stepIndex];
  const secondsLeft = running && program ? secondsLeftInStep(program, elapsed) : 0;

  const stepText = step && program ? t.mindfulnessSteps[program.id][step.id] : null;
  const StepIcon = step ? STEP_ICONS[step.id] || Sparkles : null;

  // Narra el paso actual en automático cada vez que cambia (stepIndex, no
  // el texto — con la respiración 4-7-8 varios pasos no consecutivos
  // repiten exactamente el mismo texto, y dependiendo del texto el efecto
  // no se volvería a disparar entre ellos). Se dispara también al activar
  // el interruptor a medio paso, para leer el paso actual de inmediato.
  useEffect(() => {
    if (!voiceOn || !running || !program) return;
    if (!speechSynthesis || !stepText || typeof window === "undefined" || !window.SpeechSynthesisUtterance) return;
    speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(stepText);
    utterance.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    speechSynthesis.speak(utterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, voiceOn, running, program]);

  const toggleVoice = () => {
    if (voiceOn) {
      speechSynthesis?.cancel();
      setVoiceOn(false);
    } else {
      setVoiceOn(true);
    }
  };

  // Progreso dentro del paso actual (para el anillo) y del total del
  // programa (para la barra de abajo) — 20 de noviembre de 2026, parte del
  // rediseño visual.
  const stepFraction = step ? 1 - secondsLeft / step.seconds : 0;
  const totalFraction = program ? Math.min(1, elapsed / programTotalSeconds(program)) : 0;
  const RING_R = 52;
  const RING_CIRC = 2 * Math.PI * RING_R;

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.6 }}>
        {t.mindfulness.intro}
      </p>

      {!running && justFinished && (
        <p style={{ fontSize: "13px", color: C.mint, margin: "0 0 12px" }}>
          {t.mindfulness.justFinished(justFinishedMinutes)}
        </p>
      )}

      {!running || !program ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MINDFULNESS_PROGRAMS.map((p) => {
            const Icon = PROGRAM_ICONS[p.id] || Sparkles;
            const info = t.mindfulnessPrograms[p.id];
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => start(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left",
                  width: "100%",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: `${C.lavender}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={C.lavender} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{info.title}</p>
                  <p style={{ fontSize: "11.5px", color: C.textMuted, margin: 0, lineHeight: 1.4 }}>{info.blurb}</p>
                </div>
                <Play size={16} color={C.lavender} style={{ flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            background: `linear-gradient(180deg, ${C.lavender}14, ${C.surfaceAlt} 55%)`,
            border: `1px solid ${C.border}`,
            borderRadius: "20px",
            padding: "26px 20px 20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: C.lavender,
              margin: "0 0 16px",
            }}
          >
            {t.mindfulness.stepProgress(stepIndex + 1, program.steps.length)}
          </p>

          {/* Anillo de progreso del paso actual — SVG simple, sin librería
              nueva, mismo principio del resto del proyecto. */}
          <div style={{ position: "relative", width: "128px", height: "128px", margin: "0 auto 18px" }}>
            <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="64" cy="64" r={RING_R} fill="none" stroke={C.border} strokeWidth="8" />
              <circle
                cx="64"
                cy="64"
                r={RING_R}
                fill="none"
                stroke={C.lavender}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={RING_CIRC * (1 - stepFraction)}
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
              }}
            >
              {StepIcon && <StepIcon size={20} color={C.lavender} />}
              <p style={{ fontSize: "26px", fontWeight: 700, color: C.text, margin: 0, fontVariantNumeric: "tabular-nums" }}>
                {secondsLeft}
              </p>
            </div>
          </div>

          <p style={{ fontSize: "14px", color: C.text, margin: "0 0 18px", lineHeight: 1.6, minHeight: "48px", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
            {stepText}
          </p>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "18px" }}>
            {speechSynthesis && (
              <button
                onClick={toggleVoice}
                aria-label={voiceOn ? t.mindfulness.muteAria : t.mindfulness.listenAria}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: voiceOn ? C.lavender : C.surface,
                  border: `1px solid ${voiceOn ? C.lavender : C.border}`,
                  borderRadius: "999px",
                  padding: "9px 16px",
                  color: voiceOn ? C.lavenderText : C.text,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {voiceOn ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {voiceOn ? t.mindfulness.muteButton : t.mindfulness.listenButton}
              </button>
            )}
            <button
              onClick={stop}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: "999px",
                padding: "9px 16px",
                color: C.textMuted,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Square size={14} /> {t.mindfulness.stopButton}
            </button>
          </div>

          {/* Barra de progreso de toda la práctica (no solo del paso) —
              chiquita, discreta, abajo de los botones. */}
          <div style={{ height: "4px", borderRadius: "999px", background: C.border, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${totalFraction * 100}%`,
                background: C.lavender,
                borderRadius: "999px",
                transition: "width 0.9s linear",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
