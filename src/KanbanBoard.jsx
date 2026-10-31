import React from "react";
import { Play, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { tint } from "./theme";

// Tablero visual tipo Kanban — función #3 de Fase 4 (inspirada en Trello,
// de la lista "10 aplicaciones para el TDAH"). GRATIS para todas las
// cuentas, decisión confirmada con la doctora el 31 de octubre de 2026:
// esto es solo OTRA FORMA de ver los mismos pasos que ya existen en el
// desglosador — no genera, sugiere ni calcula nada nuevo (eso sí sigue
// siendo Plus, ver aiButton/pickForMe en FocusFlowTDAH.jsx), así que no
// hay nada nuevo que valga cobrar.
//
// "Haciendo" se arma con el mismo concepto que ya usa "Solo una cosa"
// (oneThing.current.stepId, Módulo 4) — mover una tarjeta a esa columna
// ES empezar ese paso en "Solo una cosa", no un estado paralelo nuevo que
// haya que mantener sincronizado. Por eso este componente no tiene estado
// propio: solo lee `steps` y `activeStepId` tal cual se los pasa
// FocusFlowTDAH.jsx, y llama a los mismos callbacks que ya existían
// (toggleStep, removeStep, handleOneThingStart, handleOneThingSwitch).
//
// Vive junto a (no en vez de) la lista de siempre — un botón "Lista" /
// "Tablero" en el desglosador decide cuál se ve; ambas leen y escriben
// exactamente el mismo arreglo `steps`, así que cambiar de vista a medio
// camino nunca pierde nada.
export default function KanbanBoard({ C, t, steps, activeStepId, onStart, onStopActive, onToggleStep, onRemoveStep }) {
  const k = t.app.dismantler.kanban;
  const doing = steps.filter((s) => !s.done && s.id === activeStepId);
  const todo = steps.filter((s) => !s.done && s.id !== activeStepId);
  const done = steps.filter((s) => s.done);

  const columnStyle = {
    background: C.surfaceAlt,
    borderRadius: "16px",
    padding: "12px",
    minHeight: "72px",
  };

  const cardStyle = (accentColor) => ({
    background: C.surface,
    borderRadius: "12px",
    padding: "10px 11px",
    marginBottom: "8px",
    fontSize: "13px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    borderLeft: `3px solid ${accentColor}`,
  });

  const iconBtnStyle = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: C.textMuted,
    padding: "2px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: 700,
  };

  const Header = ({ label, count, dotColor }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
        fontSize: "12px",
        fontWeight: 700,
        color: C.text,
        marginBottom: "10px",
        padding: "0 2px",
      }}
    >
      <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
      {label}
      <span
        style={{
          marginLeft: "auto",
          fontSize: "10px",
          fontWeight: 700,
          color: C.textMuted,
          background: tint(dotColor, 0.18),
          borderRadius: "999px",
          padding: "1px 7px",
        }}
      >
        {count}
      </span>
    </div>
  );

  const RemoveButton = ({ id }) => (
    <button type="button" onClick={() => onRemoveStep(id)} aria-label={t.app.dismantler.removeStepAria} style={{ ...iconBtnStyle, color: C.textMuted }}>
      <Trash2 size={13} />
    </button>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "10px",
      }}
    >
      <div style={columnStyle}>
        <Header label={k.todoColumn} count={todo.length} dotColor={C.textMuted} />
        {todo.length === 0 && <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>{k.emptyTodo}</p>}
        {todo.map((s) => (
          <div key={s.id} style={cardStyle(C.border)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ flex: 1, color: C.text }}>{s.text}</span>
              <RemoveButton id={s.id} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: C.textMuted }}>{s.min} min</span>
              {s.energy && (
                <span
                  title={t.app.dismantler.energyTagTitle(s.energy)}
                  style={{
                    fontSize: "10px",
                    color: C.textMuted,
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: "9px",
                    padding: "1px 6px",
                  }}
                >
                  {s.energy}
                </span>
              )}
              <button type="button" onClick={() => onStart(s)} style={{ ...iconBtnStyle, marginLeft: "auto", color: C.coral }}>
                <Play size={12} /> {k.startButton}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={columnStyle}>
        <Header label={k.doingColumn} count={doing.length} dotColor={C.coral} />
        {doing.length === 0 && <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>{k.emptyDoing}</p>}
        {doing.map((s) => (
          <div key={s.id} style={cardStyle(C.coral)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ flex: 1, fontWeight: 600, color: C.text }}>{s.text}</span>
              <RemoveButton id={s.id} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: C.textMuted }}>{s.min} min</span>
              <button type="button" onClick={onStopActive} style={iconBtnStyle}>
                <RotateCcw size={12} /> {k.backButton}
              </button>
              <button type="button" onClick={() => onToggleStep(s.id)} style={{ ...iconBtnStyle, marginLeft: "auto", color: C.mintText }}>
                <CheckCircle2 size={12} /> {k.doneButton}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={columnStyle}>
        <Header label={k.doneColumn} count={done.length} dotColor={C.mint} />
        {done.length === 0 && <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>{k.emptyDone}</p>}
        {done.map((s) => (
          <div key={s.id} style={{ ...cardStyle(C.mint), opacity: 0.72 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <span style={{ flex: 1, textDecoration: "line-through", color: C.textMuted }}>{s.text}</span>
              <RemoveButton id={s.id} />
            </div>
            <button type="button" onClick={() => onToggleStep(s.id)} style={{ ...iconBtnStyle, marginTop: "6px" }}>
              <RotateCcw size={12} /> {k.undoButton}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
