import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2, Sparkles, Activity, Wind, Brain, CheckCircle2 } from "lucide-react";
import {
  MINDFULNESS_STEPS,
  MINDFULNESS_TOTAL_SECONDS,
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

// Un ícono por paso, para que la tarjeta se sienta guiada y no solo un
// cronómetro — 20 de noviembre de 2026 ("que se vea bonita"). Reutiliza
// íconos que la app ya usa en otras herramientas (Wind en la burbuja de
// enfoque, Brain en varias pantallas) para no introducir un lenguaje visual
// nuevo.
const STEP_ICONS = {
  llegar: Sparkles,
  cuerpo: Activity,
  respiracion: Wind,
  mente: Brain,
  cierre: CheckCircle2,
};

// Práctica breve de atención plena guiada — ver mindfulness.js para la
// evidencia detrás de esta función y el guion completo. Autocontenido,
// mismo patrón que FocusMode.jsx: lleva su propio temporizador y solo
// avisa al padre cuando la práctica se completa (`onComplete`) para que
// ahí se otorgue el XP — este componente nunca toca el progreso guardado.
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

export default function MindfulnessPanel({ C, t, lang, onComplete }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const tickRef = useRef(null);
  const finishedTimeout = useRef(null);
  const speechSynthesis = getSpeechSynthesis();

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        if (isFinished(next)) {
          clearInterval(tickRef.current);
          setRunning(false);
          setJustFinished(true);
          // 20 de noviembre de 2026 ("cuando le pongo detener no se detiene
          // la voz"): si la práctica termina sola mientras seguía hablando
          // (por ejemplo, alguien le dio "Escuchar" al último paso), también
          // hay que cortar el audio aquí, no solo al tocar "Detener" a mano.
          speechSynthesis?.cancel();
          onComplete?.();
          if (finishedTimeout.current) clearTimeout(finishedTimeout.current);
          finishedTimeout.current = setTimeout(() => setJustFinished(false), 5000);
          return MINDFULNESS_TOTAL_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => () => finishedTimeout.current && clearTimeout(finishedTimeout.current), []);

  // 20 de noviembre de 2026: si la persona sale de esta herramienta (cambia
  // de pantalla) mientras la voz sigue hablando, cortarla también — antes
  // no había ninguna limpieza al desmontar y la voz podía seguir sola de
  // fondo sin que hubiera ya ninguna práctica visible en pantalla.
  useEffect(() => () => speechSynthesis?.cancel(), [speechSynthesis]);

  const start = () => {
    setJustFinished(false);
    setElapsed(0);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    clearInterval(tickRef.current);
    // 20 de noviembre de 2026 ("cuando le pongo detener no se detiene la
    // voz"): esto faltaba — "Detener" paraba el cronómetro y la cuenta
    // regresiva, pero no el audio del navegador, así que la voz seguía
    // leyendo el paso aunque la pantalla ya hubiera regresado a "Empezar".
    speechSynthesis?.cancel();
  };

  const stepIndex = running ? stepIndexAt(elapsed) : null;
  const step = stepIndex === null ? null : MINDFULNESS_STEPS[stepIndex];
  const secondsLeft = running ? secondsLeftInStep(elapsed) : 0;

  const stepText = step ? t.mindfulnessSteps[step.id] : null;
  const StepIcon = step ? STEP_ICONS[step.id] || Sparkles : null;

  const speak = () => {
    if (!speechSynthesis || !stepText || typeof window === "undefined" || !window.SpeechSynthesisUtterance) return;
    speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(stepText);
    utterance.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    speechSynthesis.speak(utterance);
  };

  const minutes = Math.round(MINDFULNESS_TOTAL_SECONDS / 60);

  // Progreso dentro del paso actual (para el anillo) y del total (para la
  // barra de abajo) — 20 de noviembre de 2026, parte del rediseño visual.
  const stepFraction = step ? 1 - secondsLeft / step.seconds : 0;
  const totalFraction = Math.min(1, elapsed / MINDFULNESS_TOTAL_SECONDS);
  const RING_R = 52;
  const RING_CIRC = 2 * Math.PI * RING_R;

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.6 }}>
        {t.mindfulness.intro(minutes)}
      </p>

      {!running && justFinished && (
        <p style={{ fontSize: "13px", color: C.mint, margin: "0 0 12px" }}>
          {t.mindfulness.justFinished(minutes)}
        </p>
      )}

      {!running ? (
        <button
          onClick={start}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: C.lavender,
            color: C.lavenderText,
            border: "none",
            borderRadius: "12px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Play size={16} /> {t.mindfulness.start}
        </button>
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
            {t.mindfulness.stepProgress(stepIndex + 1, MINDFULNESS_STEPS.length)}
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
                onClick={speak}
                aria-label={t.mindfulness.listenAria}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "999px",
                  padding: "9px 16px",
                  color: C.text,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Volume2 size={14} /> {t.mindfulness.listenButton}
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
