import React, { useState } from "react";
import { todayEntry, recentEntries } from "./moodLog";

// Registro de ánimo + journaling diario — 5 emojis + nota corta opcional,
// más una tira de los últimos 7 días. Sin dependencias nuevas.
const MOODS = [
  { value: 1, emoji: "😞", label: "Muy mal" },
  { value: 2, emoji: "😕", label: "Mal" },
  { value: 3, emoji: "😐", label: "Regular" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 5, emoji: "😄", label: "Muy bien" },
];

export default function MoodLog({ C, moodLog, onSave }) {
  const existing = todayEntry(moodLog);
  const [mood, setMood] = useState(existing?.mood || 0);
  const [note, setNote] = useState(existing?.note || "");
  const [justSaved, setJustSaved] = useState(false);

  const history = recentEntries(moodLog, 7);

  const handleSave = () => {
    if (!mood) return;
    onSave(mood, note);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const chipStyle = (active) => ({
    fontSize: "26px",
    background: active ? C.surfaceAlt : "transparent",
    border: `1px solid ${active ? C.border : "transparent"}`,
    borderRadius: "8px",
    padding: "6px 8px",
    cursor: "pointer",
    lineHeight: 1,
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMood(m.value)}
            aria-label={m.label}
            title={m.label}
            style={chipStyle(mood === m.value)}
          >
            {m.emoji}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="¿Qué influyó en tu ánimo hoy? (opcional)"
        rows={2}
        style={{
          width: "100%",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "6px",
          padding: "8px 10px",
          color: C.text,
          fontSize: "13px",
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: "10px",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={handleSave}
        disabled={!mood}
        style={{
          background: mood ? C.rose : C.surfaceAlt,
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          color: mood ? C.roseText : C.textMuted,
          fontWeight: 600,
          fontSize: "13px",
          cursor: mood ? "pointer" : "not-allowed",
        }}
      >
        {justSaved ? "Guardado ✓" : existing ? "Actualizar registro de hoy" : "Guardar registro de hoy"}
      </button>

      <div style={{ display: "flex", gap: "6px", marginTop: "16px" }}>
        {history.map(({ date, entry }) => {
          const m = MOODS.find((x) => x.value === entry?.mood);
          return (
            <div
              key={date}
              title={date}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: "18px",
                background: C.surfaceAlt,
                borderRadius: "6px",
                padding: "6px 0",
                opacity: entry ? 1 : 0.3,
              }}
            >
              {m ? m.emoji : "·"}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>Últimos 7 días</p>
    </div>
  );
}
