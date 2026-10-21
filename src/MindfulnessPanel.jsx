import React, { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2 } from "lucide-react";
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

// Práctica breve de atención plena guiada — ver mindfulness.js para la
// evidencia detrás de esta función y el guion completo. Autocontenido,
// mismo patrón que FocusMode.jsx: lleva su propio temporizador y solo
// avisa al padre cuando la práctica se completa (`onComplete`) para que
// ahí se otorgue el XP — este componente nunca toca el progreso guardado.
export default function MindfulnessPanel({ C, onComplete }) {
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

  const start = () => {
    setJustFinished(false);
    setElapsed(0);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    clearInterval(tickRef.current);
  };

  const stepIndex = running ? stepIndexAt(elapsed) : null;
  const step = stepIndex === null ? null : MINDFULNESS_STEPS[stepIndex];
  const secondsLeft = running ? secondsLeftInStep(elapsed) : 0;

  const speak = () => {
    if (!speechSynthesis || !step || typeof window === "undefined" || !window.SpeechSynthesisUtterance) return;
    speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(step.text);
    utterance.lang = "es-MX";
    speechSynthesis.speak(utterance);
  };

  const minutes = Math.round(MINDFULNESS_TOTAL_SECONDS / 60);

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.6 }}>
        Unos {minutes} minutos de atención plena guiada — entre todo lo investigado para TDAH en adultos,
        es la práctica no farmacológica con más respaldo directo en un metaanálisis reciente.
      </p>

      {!running && justFinished && (
        <p style={{ fontSize: "13px", color: C.mint, margin: "0 0 12px" }}>
          Listo — practicaste {minutes} minutos de atención plena.
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
            borderRadius: "6px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Play size={16} /> Empezar
        </button>
      ) : (
        <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "18px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: C.text, margin: "0 0 10px", lineHeight: 1.6, minHeight: "48px" }}>
            {step?.text}
          </p>
          <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 14px" }}>{secondsLeft}</p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {speechSynthesis && (
              <button
                onClick={speak}
                aria-label="Escuchar"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  padding: "8px 12px",
                  color: C.text,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Volume2 size={14} /> Escuchar
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
                borderRadius: "6px",
                padding: "8px 12px",
                color: C.textMuted,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <Square size={14} /> Detener
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
