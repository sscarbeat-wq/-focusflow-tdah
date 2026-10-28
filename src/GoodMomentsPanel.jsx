import React, { useRef, useState } from "react";
import { Mic, Square, Trash2, Shuffle } from "lucide-react";
import { recentGoodMoments, pickRandomGoodMoment } from "./goodMoments";

const DATE_FMT = { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" };

// Mismo locale de formato de fecha por idioma de la app que usa
// ClinicalReportPanel.jsx.
const DATE_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };
// El reconocimiento de voz del navegador (Web Speech API) necesita un BCP-47
// completo, no solo el código de 2 letras.
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function formatWhen(iso, lang) {
  return new Date(iso).toLocaleString(DATE_LOCALES[lang] || DATE_LOCALES.es, DATE_FMT);
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
export default function GoodMomentsPanel({ C, t, lang, goodMoments, onAdd, onRemove }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [revisiting, setRevisiting] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition = getSpeechRecognition();

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
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
        {t.goodMoments.intro}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.goodMoments.placeholder}
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
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
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {listening ? <Square size={14} /> : <Mic size={14} />}
            {listening ? t.goodMoments.stop : t.goodMoments.recordVoice}
          </button>
        )}
        <button
          onClick={handleSave}
          style={{
            background: C.rose,
            color: C.roseText,
            border: "none",
            borderRadius: "12px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.goodMoments.saveButton}
        </button>
      </div>

      {revisiting && (
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "14px",
            marginTop: "16px",
          }}
        >
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>
            {t.goodMoments.revisiting(formatWhen(revisiting.createdAt, lang))}
          </p>
          <p style={{ fontSize: "14px", color: C.text, margin: 0, lineHeight: 1.5 }}>{revisiting.text}</p>
        </div>
      )}

      {recent.length === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "16px 0 0" }}>
          {t.goodMoments.empty}
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
            <Shuffle size={13} /> {t.goodMoments.revisitRandom}
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
                <p style={{ fontSize: "11px", color: C.textMuted, margin: "2px 0 0" }}>{formatWhen(m.createdAt, lang)}</p>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", flexShrink: 0 }}
                aria-label={t.goodMoments.delete}
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
