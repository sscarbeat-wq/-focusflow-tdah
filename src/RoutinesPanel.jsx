import React, { useState } from "react";
import { Play, Plus, Trash2, ChevronUp, ChevronDown, Pencil, CheckCircle2, LogOut, X } from "lucide-react";
import { currentRoutineStep, MAX_ROUTINE_TEMPLATES, MAX_STEPS_PER_ROUTINE } from "./routines";
import { tint } from "./theme";

// "Rutinas visuales guiadas" — Módulo 5 de ANRO TDAH 2.0 (8 de noviembre de
// 2026), inspirado en las rutinas de Tiimo. Dos vistas completamente
// distintas en el mismo panel:
//   1) Sin sesión activa: lista de rutinas guardadas (crear, editar su
//      nombre/ícono y sus pasos, empezar una).
//   2) Con sesión activa: SOLO el paso de ahorita, grande, sin la lista
//      completa a la vista — el mismo principio de "menos ruido a la vez"
//      que ya usa "Solo una cosa" (OneThingPanel.jsx), aplicado aquí a una
//      secuencia de pasos en vez de a una sola tarea.
//
// Fase 2F (plantillas editables, 29 de octubre de 2026): hasta ahora solo
// se podía agregar/quitar/reordenar pasos, pero no corregir uno ya
// agregado (había que borrarlo y volver a escribirlo, perdiendo su lugar
// en el orden), ni cambiar el nombre/ícono de la rutina después de
// creada. Ambas cosas ya existían en routines.js (renameRoutineTemplate
// nunca se usaba desde aquí) o se agregaron ahora (updateRoutineStep) —
// este componente solo les da una interfaz. El nombre/ícono de la rutina
// se edita con el mismo patrón de "cambia y se guarda al toque" que ya usa
// el editor de bloques de la Agenda visual (ScheduleAgendaPanel.jsx): sin
// botón de "guardar" aparte, cada cambio llama directo al callback. Editar
// un paso sí usa un botón "Listo" para cerrar su mini-formulario, porque
// tiene tres campos (texto/ícono/duración) y cerrar accidentalmente a
// medio escribir sería más molesto que útil.
//
// Todo el estado (plantillas + sesión + historial de completadas) vive en
// routines.js (lógica pura) — este componente solo renderiza ese estado y
// llama a los callbacks que le pasa FocusFlowTDAH.jsx, que es quien de
// verdad aplica cada cambio y decide cuándo otorgar XP (al completar una
// rutina completa, no al editarla).
const ROUTINE_ICONS = ["☀️", "🌙", "🧘", "🏃", "🍽️", "🧹", "📚", "🚿", "🪥", "💊", "🎒", "✅"];
const STEP_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function RoutinesPanel({
  C,
  t,
  routines,
  onAddTemplate,
  onUseTemplate,
  onRemoveTemplate,
  onRenameTemplate,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onMoveStep,
  onStartSession,
  onAdvanceSession,
  onExitSession,
}) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(ROUTINE_ICONS[0]);
  const [expandedId, setExpandedId] = useState(null);
  const [stepDraft, setStepDraft] = useState("");
  const [stepIcon, setStepIcon] = useState(ROUTINE_ICONS[0]);
  const [newStepMin, setNewStepMin] = useState(""); // duración del paso NUEVO que se está armando abajo
  const [editingStepId, setEditingStepId] = useState(null); // id del paso con su mini-formulario abierto

  const current = currentRoutineStep(routines);

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%), ${C.mint}`,
    border: "none",
    borderRadius: "999px",
    padding: "12px 20px",
    minHeight: "44px",
    color: C.mintText,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: `0 4px 10px ${tint(C.mint, 0.35)}`,
  };

  const btnGhost = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "11px 18px",
    minHeight: "44px",
    color: C.text,
    fontSize: "14px",
    cursor: "pointer",
  };

  const iconBtnGhost = {
    background: "transparent",
    border: "none",
    color: C.textMuted,
    cursor: "pointer",
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const inputStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    minHeight: "40px",
    boxSizing: "border-box",
  };

  const iconPicker = (value, onPick) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {ROUTINE_ICONS.map((icon) => {
        const selected = icon === value;
        return (
          <button
            key={icon}
            type="button"
            onClick={() => onPick(icon)}
            aria-label={icon}
            aria-pressed={selected}
            style={{
              width: "40px",
              height: "40px",
              fontSize: "18px",
              borderRadius: "12px",
              background: selected ? tint(C.lavender, 0.22) : tint(C.textMuted, 0.06),
              border: selected ? `2px solid ${C.lavender}` : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );

  const durationSelect = (value, onChange, ariaLabel) => (
    <select
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      aria-label={ariaLabel}
      style={{ ...inputStyle, minHeight: "40px" }}
    >
      <option value="">{t.routines.stepDurationUnset}</option>
      {STEP_DURATION_OPTIONS.map((min) => (
        <option key={min} value={min}>
          {t.routines.durationOption(min)}
        </option>
      ))}
    </select>
  );

  // --- Vista guiada: hay una sesión activa, solo se ve el paso de ahorita ---
  if (current) {
    return (
      <div>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {current.template.icon} {current.template.name}
        </p>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 20px" }}>
          {t.routines.stepProgress(current.stepIndex + 1, current.totalSteps)}
        </p>

        <div style={{ textAlign: "center", padding: "20px 10px 28px" }}>
          <div style={{ fontSize: "60px", lineHeight: 1, marginBottom: "14px" }} aria-hidden="true">
            {current.step.icon}
          </div>
          <h3 style={{ fontSize: "21px", fontWeight: 700, margin: "0 0 6px", color: C.text, lineHeight: 1.3 }}>
            {current.step.text}
          </h3>
          {current.step.min && (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>{t.routines.aboutMinutes(current.step.min)}</p>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onAdvanceSession} style={btnPrimary}>
            <CheckCircle2 size={16} />
            {current.isLastStep ? t.routines.finishRoutine : t.routines.nextStep}
          </button>
          <button onClick={onExitSession} style={btnGhost}>
            <LogOut size={15} />
            {t.routines.exitSession}
          </button>
        </div>
      </div>
    );
  }

  // --- Vista de lista: crear/editar rutinas, elegir cuál empezar ---
  return (
    <div>
      {routines.templates.length === 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
            {t.routines.emptyState}
          </p>

          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>
            {t.routines.presetsLabel}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {t.routines.presets.map((preset) => (
              <div
                key={preset.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }} aria-hidden="true">
                  {preset.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>{preset.name}</div>
                  <div style={{ fontSize: "11px", color: C.textMuted }}>{t.routines.stepCount(preset.steps.length)}</div>
                </div>
                <button
                  onClick={() => onUseTemplate(preset)}
                  style={{ ...btnGhost, padding: "9px 14px", minHeight: "40px", flexShrink: 0 }}
                >
                  <Plus size={14} />
                  {t.routines.useTemplateButton}
                </button>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>
            {t.routines.orCreateFromScratch}
          </p>
        </div>
      )}

      {routines.templates.map((tpl) => {
        const expanded = expandedId === tpl.id;
        return (
          <div
            key={tpl.id}
            style={{ background: C.surfaceAlt, borderRadius: "14px", padding: "12px 14px", marginBottom: "10px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "22px" }} aria-hidden="true">
                {tpl.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>{tpl.name}</div>
                <div style={{ fontSize: "11px", color: C.textMuted }}>{t.routines.stepCount(tpl.steps.length)}</div>
              </div>
              <button
                onClick={() => onStartSession(tpl.id)}
                disabled={tpl.steps.length === 0}
                title={tpl.steps.length === 0 ? t.routines.needsStepsNotice : t.routines.startButton}
                style={{ ...btnPrimary, padding: "9px 14px", minHeight: "40px", opacity: tpl.steps.length === 0 ? 0.5 : 1 }}
              >
                <Play size={14} />
                {t.routines.startButton}
              </button>
              <button
                onClick={() => {
                  setExpandedId(expanded ? null : tpl.id);
                  setEditingStepId(null);
                }}
                aria-label={t.routines.editTitle}
                aria-expanded={expanded}
                style={iconBtnGhost}
              >
                <Pencil size={16} />
              </button>
              <button onClick={() => onRemoveTemplate(tpl.id)} aria-label={t.routines.deleteRoutineTitle} style={iconBtnGhost}>
                <Trash2 size={16} />
              </button>
            </div>

            {expanded && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: "14px" }}>
                  <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>
                    {t.routines.editNameLabel}
                  </p>
                  <div style={{ marginBottom: "8px" }}>{iconPicker(tpl.icon, (icon) => onRenameTemplate(tpl.id, { icon }))}</div>
                  <input
                    type="text"
                    value={tpl.name}
                    onChange={(e) => onRenameTemplate(tpl.id, { name: e.target.value })}
                    style={{ ...inputStyle, width: "100%" }}
                    maxLength={60}
                  />
                </div>

                {tpl.steps.map((st, idx) => {
                  const isEditingStep = editingStepId === st.id;
                  if (isEditingStep) {
                    return (
                      <div
                        key={st.id}
                        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "10px", marginBottom: "8px" }}
                      >
                        <div style={{ marginBottom: "8px" }}>{iconPicker(st.icon, (icon) => onUpdateStep(tpl.id, st.id, { icon }))}</div>
                        <input
                          type="text"
                          value={st.text}
                          onChange={(e) => onUpdateStep(tpl.id, st.id, { text: e.target.value })}
                          style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
                          maxLength={120}
                        />
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: C.textMuted }}>{t.routines.stepDurationLabel}</span>
                            {durationSelect(st.min, (val) => onUpdateStep(tpl.id, st.id, { min: val }), t.routines.stepDurationLabel)}
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingStepId(null)}
                            style={{ ...btnGhost, padding: "8px 14px", minHeight: "36px" }}
                          >
                            {t.routines.doneEditingStep}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
                      <span style={{ fontSize: "16px" }} aria-hidden="true">
                        {st.icon}
                      </span>
                      <span style={{ fontSize: "13px", color: C.text, flex: 1 }}>
                        {st.text}
                        {st.min ? ` (~${st.min} min)` : ""}
                      </span>
                      <button
                        onClick={() => setEditingStepId(st.id)}
                        aria-label={t.routines.editStepTitle}
                        style={{ ...iconBtnGhost, width: "28px", height: "28px" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onMoveStep(tpl.id, st.id, "up")}
                        disabled={idx === 0}
                        aria-label={t.routines.moveStepUp}
                        style={{ ...iconBtnGhost, width: "28px", height: "28px", opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => onMoveStep(tpl.id, st.id, "down")}
                        disabled={idx === tpl.steps.length - 1}
                        aria-label={t.routines.moveStepDown}
                        style={{ ...iconBtnGhost, width: "28px", height: "28px", opacity: idx === tpl.steps.length - 1 ? 0.3 : 1 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => {
                          onRemoveStep(tpl.id, st.id);
                          if (editingStepId === st.id) setEditingStepId(null);
                        }}
                        aria-label={t.routines.deleteStepTitle}
                        style={{ ...iconBtnGhost, width: "28px", height: "28px" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}

                {tpl.steps.length < MAX_STEPS_PER_ROUTINE && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ marginBottom: "8px" }}>{iconPicker(stepIcon, setStepIcon)}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={stepDraft}
                        onChange={(e) => setStepDraft(e.target.value)}
                        placeholder={t.routines.stepPlaceholder}
                        style={{ ...inputStyle, flex: "1 1 180px" }}
                        maxLength={120}
                      />
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: C.textMuted }}>{t.routines.stepDurationLabel}</span>
                        {durationSelect(newStepMin || null, (val) => setNewStepMin(val === null ? "" : String(val)), t.routines.stepDurationLabel)}
                      </label>
                      <button
                        onClick={() => {
                          if (!stepDraft.trim()) return;
                          onAddStep(tpl.id, { text: stepDraft, icon: stepIcon, min: newStepMin || undefined });
                          setStepDraft("");
                          setNewStepMin("");
                        }}
                        disabled={!stepDraft.trim()}
                        style={{ ...btnGhost, padding: "9px 14px", minHeight: "40px" }}
                      >
                        <Plus size={14} />
                        {t.routines.addStepButton}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {routines.templates.length < MAX_ROUTINE_TEMPLATES && (
        <div style={{ background: C.surfaceAlt, borderRadius: "14px", padding: "14px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>
            {t.routines.newRoutineLabel}
          </p>
          <div style={{ marginBottom: "10px" }}>{iconPicker(newIcon, setNewIcon)}</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.routines.newRoutinePlaceholder}
              style={{ ...inputStyle, flex: "1 1 180px" }}
              maxLength={60}
            />
            <button
              onClick={() => {
                if (!newName.trim()) return;
                onAddTemplate({ name: newName, icon: newIcon });
                setNewName("");
              }}
              disabled={!newName.trim()}
              style={{ ...btnPrimary, padding: "9px 14px", minHeight: "40px" }}
            >
              <Plus size={14} />
              {t.routines.createButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
