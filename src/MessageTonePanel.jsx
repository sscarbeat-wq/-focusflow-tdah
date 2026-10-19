import React, { useState } from "react";
import { Wand2, AlertTriangle } from "lucide-react";
import { CRISIS } from "./companionSituations";
import { MODES, TONE_OPTIONS, cleanMessageText } from "./messageToneOptions";

// "Ayuda con mensajes" (inspirado en Formalizer/Judge de Goblin Tools) —
// reescribir el tono de un mensaje que vas a mandar, o leer con más calma
// uno que ya recibiste. A diferencia de las demás funciones con IA de
// Senda, aquí SÍ se pega texto libre real — por eso api/message-tone.js
// revisa el texto antes y después de pasar por la IA; si toca algo de
// riesgo, este panel muestra el mismo mensaje fijo de crisis que el
// Compañero de apoyo, nunca el resultado generado.
export default function MessageTonePanel({ C, userId }) {
  const [mode, setMode] = useState(MODES.REWRITE);
  const [text, setText] = useState("");
  const [tone, setTone] = useState(TONE_OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [unsafe, setUnsafe] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setText("");
    setResult(null);
    setError("");
    setUnsafe(false);
    setCopied(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setResult(null);
    setError("");
  };

  const handleSubmit = async () => {
    const cleanText = cleanMessageText(text);
    if (!cleanText || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/message-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mode,
          text: cleanText,
          tone: mode === MODES.REWRITE ? tone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo procesar el mensaje.");
      if (data.unsafe) {
        setUnsafe(true);
        return;
      }
      setResult(data.result);
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* clipboard no disponible — no es crítico, la paciente puede seleccionar el texto a mano */
    }
  };

  const modeBtn = (active) => ({
    flex: 1,
    padding: "8px 10px",
    borderRadius: "6px",
    border: `1px solid ${active ? C.lavender : C.border}`,
    background: active ? C.lavender : "transparent",
    color: active ? C.lavenderText : C.text,
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  });

  const toneBtn = (active) => ({
    padding: "6px 10px",
    borderRadius: "6px",
    border: `1px solid ${active ? C.lavender : C.border}`,
    background: active ? C.lavender : C.surfaceAlt,
    color: active ? C.lavenderText : C.text,
    fontSize: "12px",
    cursor: "pointer",
  });

  const textareaStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "10px",
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.lavender,
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    color: C.lavenderText,
    fontSize: "13px",
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };

  if (unsafe) {
    return (
      <div>
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.rose}`,
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "10px",
          }}
        >
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: 0 }}>
            <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: "6px", color: C.rose }} />
            {CRISIS.message}
          </p>
        </div>
        <button onClick={reset} style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", cursor: "pointer", padding: 0 }}>
          Entendido
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => switchMode(MODES.REWRITE)} style={modeBtn(mode === MODES.REWRITE)}>
          Reescribir un mensaje mío
        </button>
        <button onClick={() => switchMode(MODES.READ)} style={modeBtn(mode === MODES.READ)}>
          Leer uno que recibí
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          mode === MODES.REWRITE
            ? "Pega aquí el mensaje que estás por mandar..."
            : "Pega aquí el mensaje que recibiste..."
        }
        rows={4}
        style={textareaStyle}
      />

      {mode === MODES.REWRITE && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {TONE_OPTIONS.map((t) => (
            <button key={t.id} onClick={() => setTone(t.id)} style={toneBtn(tone === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} disabled={!text.trim() || loading} style={btnPrimary}>
        <Wand2 size={14} /> {loading ? "Pensando..." : mode === MODES.REWRITE ? "Reescribir" : "Ayúdame a leerlo"}
      </button>

      {error && <p style={{ fontSize: "12px", color: C.amber, margin: "10px 0 0" }}>{error}</p>}

      {result && (
        <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "14px", marginTop: "14px" }}>
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
            {result}
          </p>
          {mode === MODES.REWRITE && (
            <button
              onClick={handleCopy}
              style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 10px", color: C.text, fontSize: "12px", cursor: "pointer" }}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
