import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { tint } from "./theme";
import HabitsInfoSheet from "./HabitsInfoSheet";
import { HABIT_EMOJIS, CUSTOM_HABIT_MAX_LENGTH, MAX_CUSTOM_HABITS } from "./customHabits";

// Emoji con el que arranca un hábito nuevo: el neutro (✨), no la pastilla.
const DEFAULT_EMOJI = HABIT_EMOJIS[HABIT_EMOJIS.length - 1];

// Lista de "Mis hábitos de hoy" (11 de noviembre de 2026): los 4 hábitos
// fijos más los que la paciente agregue (máximo 3 — ver customHabits.js).
// Los propios traen un lápiz para cambiarles el nombre/emoji o quitarlos;
// los fijos no se pueden editar. `items` viene armado desde
// FocusFlowTDAH.jsx (misma lista que la franja de Inicio).
export default function HabitsList({ C, t, isNarrow, items, canAdd, onAdd, onUpdate, onRemove, openAddSignal = 0, onFormOpenChange }) {
  const h = t.app.habits;
  // null = nada abierto · "new" = agregando · id = editando ese hábito
  const [editing, setEditing] = useState(null);
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [label, setLabel] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const doneCount = items.filter((it) => it.checked).length;
  const existing = new Set(items.map((it) => it.label));
  const suggestions = (h.suggestions || []).filter((sg) => !existing.has(sg.label));

  const openNew = () => {
    setEmoji(DEFAULT_EMOJI);
    setLabel("");
    setEditing("new");
  };
  const openEdit = (it) => {
    setEmoji(it.emoji);
    setLabel(it.label);
    setEditing(it.id);
  };
  const close = () => setEditing(null);
  // Llegando desde el "＋ Agregar un hábito mío" de Inicio: el formulario
  // ya viene abierto (openAddSignal cambia en cada toque).
  // Avisa cuando el formulario está abierto: FocusFlowTDAH.jsx esconde
  // mientras tanto los botones flotantes, que en el teléfono tapaban
  // "Guardar".
  useEffect(() => {
    onFormOpenChange?.(editing !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);
  useEffect(() => {
    if (openAddSignal && canAdd) openNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddSignal]);
  const save = () => {
    if (!label.trim()) return;
    if (editing === "new") onAdd({ emoji, label });
    else onUpdate(editing, { emoji, label });
    close();
  };

  const smallBtn = (primary) => ({
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "12px",
    border: primary ? "none" : `1px solid ${C.border}`,
    background: primary ? C.mint : "transparent",
    color: primary ? C.mintText || "#fff" : C.text,
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  });

  const form = (
    <div
      style={{
        gridColumn: "1 / -1",
        padding: "14px",
        borderRadius: "16px",
        border: `1px dashed ${tint(C.mint, 0.6)}`,
        background: tint(C.mint, 0.07),
      }}
    >
      <p style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 10px" }}>
        {editing === "new" ? h.addTitle : h.editTitle}
      </p>
      {/* Ideas para tocar (11 nov 2026): con TDAH es más fácil elegir de
          una lista que inventar desde cero. La doctora aprobó estas 12. Al
          tocar una se llenan el nombre y el dibujito (se pueden cambiar
          antes de guardar). No salen las que ya tiene agregadas. */}
      {editing === "new" && suggestions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "0 0 6px" }}>{h.suggestTitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {suggestions.map((sg) => {
              const active = label === sg.label;
              return (
                <button
                  key={sg.label}
                  type="button"
                  onClick={() => {
                    setLabel(sg.label);
                    setEmoji(sg.emoji);
                  }}
                  aria-pressed={active}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    minHeight: "36px",
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: active ? `2px solid ${C.mint}` : `1px solid ${C.border}`,
                    background: active ? tint(C.mint, 0.2) : "transparent",
                    color: C.text,
                    fontSize: "13px",
                    fontWeight: active ? 700 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span aria-hidden="true">{sg.emoji}</span>
                  {sg.label}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "12px 0 0" }}>{h.orWriteYours}</p>
        </div>
      )}
      <input
        type="text"
        value={label}
        maxLength={CUSTOM_HABIT_MAX_LENGTH}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        placeholder={h.namePlaceholder}
        aria-label={h.nameLabel}
        autoFocus={editing !== "new"}
        style={{
          width: "100%",
          boxSizing: "border-box",
          minHeight: "46px",
          padding: "0 14px",
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          background: C.surfaceAlt,
          color: C.text,
          fontSize: "16px",
          fontFamily: "inherit",
          marginBottom: "4px",
        }}
      />
      {/* Contador de letras: para que se vea cuánto queda antes del tope. */}
      <p aria-hidden="true" style={{ fontSize: "11.5px", color: C.textMuted, margin: "0 0 8px", textAlign: "right" }}>
        {label.length}/{CUSTOM_HABIT_MAX_LENGTH}
      </p>
      <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "0 0 6px" }}>{h.chooseEmoji}</p>
      <div role="radiogroup" aria-label={h.chooseEmoji} style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {HABIT_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={emoji === e}
            onClick={() => setEmoji(e)}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              border: emoji === e ? `2px solid ${C.mint}` : `1px solid ${C.border}`,
              background: emoji === e ? tint(C.mint, 0.2) : "transparent",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            {e}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={save} disabled={!label.trim()} style={{ ...smallBtn(true), opacity: label.trim() ? 1 : 0.5 }}>
          {t.common.save}
        </button>
        <button type="button" onClick={close} style={smallBtn(false)}>
          {t.common.cancel}
        </button>
        {editing !== "new" && (
          <button
            type="button"
            onClick={() => {
              onRemove(editing);
              close();
            }}
            style={{ ...smallBtn(false), border: "none", color: C.textMuted, textDecoration: "underline", marginLeft: "auto" }}
          >
            {h.removeHabit}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={{ fontSize: "14px", fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>{h.countToday(doneCount, items.length)}</span>
        <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: C.border, overflow: "hidden" }}>
          <div style={{ width: `${(doneCount / items.length) * 100}%`, height: "100%", background: C.mint, borderRadius: "4px", transition: "width 0.3s" }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setInfoOpen(true)}
        style={{ background: "transparent", border: "none", padding: "0 0 12px", color: C.text, fontSize: "13.5px", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
      >
        ⓘ {t.habitsInfo.button}
      </button>
      {infoOpen && <HabitsInfoSheet C={C} t={t} onClose={() => setInfoOpen(false)} />}

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "8px" }}>
        {items.map((it) =>
          it.custom && editing === it.id ? (
            <React.Fragment key={it.key}>{form}</React.Fragment>
          ) : (
            <div key={it.key} style={{ display: "flex", gap: "6px", minWidth: 0 }}>
              <button
                type="button"
                onClick={it.onToggle}
                aria-pressed={it.checked}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  minHeight: "58px",
                  padding: "10px 14px",
                  borderRadius: "16px",
                  border: `1px solid ${it.checked ? tint(C.mint, 0.5) : C.border}`,
                  background: it.checked ? tint(C.mint, 0.14) : "transparent",
                  color: C.text,
                  fontSize: "14.5px",
                  fontWeight: it.checked ? 700 : 500,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: "22px" }}>{it.emoji}</span>
                <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  {it.label}
                  {/* En qué consiste (solo los 4 fijos; el porqué completo
                      está en "¿Para qué sirven?"). */}
                  {it.hint && (
                    <span style={{ display: "block", fontSize: "12.5px", fontWeight: 400, color: C.textMuted, lineHeight: 1.4, marginTop: "2px" }}>{it.hint}</span>
                  )}
                </span>
                {it.checked ? <CheckCircle2 size={22} color={C.mint} /> : <Circle size={22} color={C.textMuted} />}
              </button>
              {it.custom && (
                <button
                  type="button"
                  onClick={() => openEdit(it)}
                  aria-label={h.editHabitAria(it.label)}
                  title={h.editHabitAria(it.label)}
                  style={{
                    width: "44px",
                    flexShrink: 0,
                    borderRadius: "14px",
                    border: `1px solid ${C.border}`,
                    background: "transparent",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  ✏️
                </button>
              )}
            </div>
          )
        )}
        {editing === "new" && form}
      </div>

      {editing === null &&
        (canAdd ? (
          <button
            type="button"
            onClick={openNew}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              minHeight: "48px",
              marginTop: "10px",
              borderRadius: "16px",
              border: `1px dashed ${C.textMuted}`,
              background: "transparent",
              color: C.text,
              fontSize: "14.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "18px" }}>＋</span> {h.addHabit}
          </button>
        ) : (
          <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>{h.maxNote(MAX_CUSTOM_HABITS)}</p>
        ))}
      <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>{h.resetNote}</p>
    </div>
  );
}
