import React, { useState } from "react";
import { todayEntry, recentEntries } from "./moodLog";

// Registro de ánimo + journaling diario — 5 emojis + nota corta opcional,
// más una tira de los últimos 7 días. Sin dependencias nuevas. Las
// etiquetas visibles viven en t.moodLog — acá solo quedan los valores
// internos (1-5) y los emojis, que no cambian con el idioma.
const MOOD_VALUES = [1, 2, 3, 4, 5];
const MOOD_EMOJIS = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };

export default function MoodLog({ C, t, moodLog, onSave }) {
  const existing = todayEntry(moodLog);
  const [mood, setMood] = useState(existing?.mood || 0);
  const [note, setNote] = useState(existing?.note || "");
  const [justSaved, setJustSaved] = useState(false);

  const history = recentEntries(moodLog, 7);
  const labelFor = (value) =>
    ({ 1: t.moodLog.veryBad, 2: t.moodLog.bad, 3: t.moodLog.regular, 4: t.moodLog.good, 5: t.moodLog.veryGood }[value]);

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
        {MOOD_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setMood(value)}
            aria-label={labelFor(value)}
            title={labelFor(value)}
            style={chipStyle(mood === value)}
          >
            {MOOD_EMOJIS[value]}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.moodLog.notePlaceholder}
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
        {justSaved ? t.moodLog.saved : existing ? t.moodLog.updateButton : t.moodLog.saveButton}
      </button>

      <div style={{ display: "flex", gap: "6px", marginTop: "16px" }}>
        {history.map(({ date, entry }) => {
          const emoji = entry?.mood ? MOOD_EMOJIS[entry.mood] : null;
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
              {emoji || "·"}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>{t.moodLog.last7Days}</p>
    </div>
  );
}
