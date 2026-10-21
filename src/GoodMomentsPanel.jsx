import React, { useRef, useState } from "react";
import { Mic, Square, Trash2, Shuffle } from "lucide-react";
import { recentGoodMoments, pickRandomGoodMoment } from "./goodMoments";

const DATE_FMT = { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };

function formatWhen(iso) {
  return new Date(iso).toLocaleString("es-MX", DATE_FMT);
}

// Reconocimiento de voz del propio navegador (Web Speech API) — a
// propósito NO usa api/quick-capture.js ni ningún servicio de IA: aquí la
// persona ya sabe que es un momento bueno, no hay nada que clasificar. Si
// el navegador no lo soporta (ej. Safari de iPhone), simplemente no
// aparece el botón de voz y queda el texto, que siempre funciona.
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// "Banco de momentos buenos" — guarda un momento positivo del día (voz o
// texto) tal cual se escribió, sin IA de por medio, solo para poder
// volver a verlo después.
export default function GoodMomentsPanel({ C, goodMoments, onAdd, onRemove }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [revisiting, setRevisiting] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition = getSpeechRecognition();

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-MX";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  const recent = recentGoodMoments(goodMoments, 10);

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.6 }}>
        Un momento bueno de hoy, en pocas palabras — nada que resolver, solo para volver a verlo
        cuando quieras.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Algo que te sacó una sonrisa hoy..."
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "6px",
          padding: "10px 12px",
          color: C.text,
          fontSize: "14px",
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: "10px",
        }}
      />

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {SpeechRecognition && (
          <button
            onClick={listening ? stopListening : startListening}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: listening ? C.rose : C.surfaceAlt,
              color: listening ? C.roseText : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {listening ? <Square size={14} /> : <Mic size={14} />}
            {listening ? "Detener" : "Grabar por voz"}
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            background: C.rose,
            color: C.roseText,
            border: "none",
            borderRadius: "6px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Guardar momento
        </button>
      </div>

      {revisiting && (
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            padding: "14px",
            marginTop: "16px",
          }}
        >
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>
            Revisitando — {formatWhen(revisiting.createdAt)}
          </p>
          <p style={{ fontSize: "14px", color: C.text, margin: 0, lineHeight: 1.5 }}>{revisiting.text}</p>
        </div>
      )}

      {recent.length === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "16px 0 0" }}>
          Todavía no guardas ningún momento bueno.
        </p>
      ) : (
        <div style={{ marginTop: "18px" }}>
          <button
            onClick={() => setRevisiting(pickRandomGoodMoment(goodMoments))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              fontSize: "12px",
              cursor: "pointer",
              padding: 0,
              marginBottom: "10px",
            }}
          >
            <Shuffle size={13} /> Revisitar uno al azar
          </button>
          {recent.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
                padding: "8px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div>
                <p style={{ fontSize: "13px", color: C.text, margin: 0, lineHeight: 1.5 }}>{m.text}</p>
                <p style={{ fontSize: "11px", color: C.textMuted, margin: "2px 0 0" }}>{formatWhen(m.createdAt)}</p>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", flexShrink: 0 }}
                aria-label="Borrar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
