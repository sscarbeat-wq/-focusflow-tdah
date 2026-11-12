// ScheduleAgendaPanel.jsx — Agenda visual v8
// Diseño "Tarjetas apiladas" con tarjeta hero para la siguiente actividad
// y barra de progreso del día. Rediseño completo (nov 2026).
//
// Props: C, t, lang, scheduleState, onAdd, onRemove, onUpdate, onMove
// scheduleState es el array de bloques — cada bloque:
//   { id, name, icon, startMin, durationMin, day? }
// scheduleBlocksForDay(scheduleState, date) filtra los de hoy.

import React, { useState, useMemo, useCallback } from "react";
import {
  scheduleBlocksForDay,
  formatMinutesAsTime,
} from "./scheduleBlocks";
import {
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clock,
} from "lucide-react";
import { tint } from "./theme";

// ---- Colores por categoría (tomados de los planetas de ANRO) ----
const CATEGORY_COLORS = {
  default: "#7C5CE0",
  focus: "#2E7FD9",
  calm: "#1E9E6E",
  feel: "#D98A0B",
  daily: "#D9467F",
};

function guessCategoryColor(block) {
  const n = (block.name || "").toLowerCase();
  if (n.includes("enfoque") || n.includes("focus") || n.includes("pomodoro") || n.includes("body double"))
    return CATEGORY_COLORS.focus;
  if (n.includes("calma") || n.includes("mindful") || n.includes("respir") || n.includes("burbuja") || n.includes("pausa"))
    return CATEGORY_COLORS.calm;
  if (n.includes("ánimo") || n.includes("mood") || n.includes("energía") || n.includes("energy"))
    return CATEGORY_COLORS.feel;
  if (n.includes("medica") || n.includes("hábito") || n.includes("habit") || n.includes("pago"))
    return CATEGORY_COLORS.daily;
  return CATEGORY_COLORS.default;
}

// ---- Componente principal ----
export default function ScheduleAgendaPanel({
  C,
  t,
  lang,
  scheduleState,
  onAdd,
  onRemove,
  onUpdate,
  onMove,
}) {
  const [viewMode, setViewMode] = useState("day"); // "day" | "week"
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStartHour, setNewStartHour] = useState(9);
  const [newStartMinute, setNewStartMinute] = useState(0);
  const [newDuration, setNewDuration] = useState(25);
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("anro_schedule_completed");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Solo mantener los del día de hoy
        const today = new Date().toDateString();
        if (parsed.date === today) return new Set(parsed.ids);
      }
    } catch (_) {}
    return new Set();
  });

  const saveCompleted = useCallback((newSet) => {
    setCompletedIds(newSet);
    try {
      localStorage.setItem(
        "anro_schedule_completed",
        JSON.stringify({ date: new Date().toDateString(), ids: [...newSet] })
      );
    } catch (_) {}
  }, []);

  const toggleComplete = useCallback(
    (blockId) => {
      const next = new Set(completedIds);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      saveCompleted(next);
    },
    [completedIds, saveCompleted]
  );

  // Bloques del día seleccionado, ordenados por hora
  const dayBlocks = useMemo(
    () => scheduleBlocksForDay(scheduleState, selectedDate).sort((a, b) => a.startMin - b.startMin),
    [scheduleState, selectedDate]
  );

  const nowMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Encontrar el siguiente bloque (no completado, startMin >= ahora)
  const nextBlock = useMemo(() => {
    if (!isToday) return null;
    return dayBlocks.find((b) => !completedIds.has(b.id) && b.startMin >= nowMinutes - 15) || null;
  }, [dayBlocks, completedIds, nowMinutes, isToday]);

  // Progreso
  const totalBlocks = dayBlocks.length;
  const completedCount = dayBlocks.filter((b) => completedIds.has(b.id)).length;
  const progressPct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

  // Navegación de días
  const goDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const dayLabel = useMemo(() => {
    const days = lang === "es"
      ? ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
      : lang === "pt"
        ? ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
        : lang === "fr"
          ? ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
          : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = lang === "es"
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : lang === "pt"
        ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        : lang === "fr"
          ? ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[selectedDate.getDay()]} ${selectedDate.getDate()} de ${months[selectedDate.getMonth()]}`;
  }, [selectedDate, lang]);

  // i18n labels
  const labels = t.schedule || {};

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd({
      name: newName.trim(),
      icon: "📋",
      startMin: newStartHour * 60 + newStartMinute,
      durationMin: newDuration,
    });
    setNewName("");
    setAddingNew(false);
  };

  // ---- RENDER ----
  return (
    <div>
      {/* Selector Día / Semana + navegación */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {["day", "week"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                border: "none",
                background: viewMode === mode ? C.accent || "#7C5CE0" : tint(C.text, 0.08),
                color: viewMode === mode ? "#fff" : C.textMuted,
                fontSize: "12px",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {mode === "day" ? (labels.dayViewTab || "Día") : (labels.weekViewTab || "Semana")}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => goDay(-1)}
            aria-label={labels.prevDay || "Día anterior"}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex" }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.text, minWidth: "100px", textAlign: "center" }}>
            {dayLabel}
            {isToday && (
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "10px",
                  fontWeight: 700,
                  background: C.accent || "#7C5CE0",
                  color: "#fff",
                  padding: "2px 7px",
                  borderRadius: "8px",
                  verticalAlign: "middle",
                }}
              >
                {labels.todayBadge || "Hoy"}
              </span>
            )}
          </span>
          <button
            onClick={() => goDay(1)}
            aria-label={labels.nextDay || "Día siguiente"}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      {totalBlocks > 0 && (
        <div
          style={{
            background: tint(C.text, 0.04),
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: C.text }}>
              {labels.progressLabel || "Progreso del día"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.accent || "#7C5CE0" }}>
              {completedCount} / {totalBlocks}
            </span>
          </div>
          <div style={{ height: "6px", background: tint(C.text, 0.08), borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${C.accent || "#7C5CE0"}, ${tint(C.accent || "#7C5CE0", 0.6)})`,
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Tarjeta HERO — siguiente actividad */}
      {nextBlock && isToday && (
        <div
          style={{
            background: `linear-gradient(135deg, ${guessCategoryColor(nextBlock)}, ${tint(guessCategoryColor(nextBlock), 0.7)})`,
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "14px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: "absolute", right: "-20px", top: "-20px", width: "80px", height: "80px", background: "rgba(255,255,255,0.08)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: "30px", bottom: "-15px", width: "50px", height: "50px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

          <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
            {labels.nextUpLabel || "Siguiente"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: "24px",
              }}
            >
              {nextBlock.icon || "📋"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>{nextBlock.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>
                {formatMinutesAsTime(nextBlock.startMin)}
                {nextBlock.durationMin ? ` — ${nextBlock.durationMin} min` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => toggleComplete(nextBlock.id)}
            style={{
              marginTop: "14px",
              width: "100%",
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              padding: "10px",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Check size={16} />
            {labels.markDone || "Marcar como hecho"}
          </button>
        </div>
      )}

      {/* Lista de bloques */}
      {dayBlocks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 16px", color: C.textMuted }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
          <div style={{ fontSize: "13px", fontWeight: 500 }}>
            {labels.emptyDay || "No tienes bloques para este día"}
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
            {labels.emptyDayHint || "Agrega uno para organizar tu tiempo"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {dayBlocks.map((block) => {
            const isDone = completedIds.has(block.id);
            const isNext = nextBlock && block.id === nextBlock.id;
            const catColor = guessCategoryColor(block);

            // No mostrar el hero de nuevo como tarjeta normal
            if (isNext && isToday) return null;

            return (
              <div
                key={block.id}
                style={{
                  background: C.surface,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  opacity: isDone ? 0.6 : (isToday && block.startMin < nowMinutes && !isDone ? 0.8 : 1),
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Check circle */}
                <button
                  onClick={() => toggleComplete(block.id)}
                  aria-label={isDone ? "Desmarcar" : "Completar"}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: isDone ? `${catColor}15` : tint(C.text, 0.04),
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  {isDone ? (
                    <Check size={18} color="#22c55e" strokeWidth={2.5} />
                  ) : (
                    <span style={{ fontSize: "18px" }}>{block.icon || "📋"}</span>
                  )}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: C.text,
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {block.name}
                  </div>
                  <div style={{ fontSize: "11px", color: isDone ? "#22c55e" : C.textMuted, fontWeight: isDone ? 500 : 400, marginTop: "1px" }}>
                    {formatMinutesAsTime(block.startMin)}
                    {block.durationMin ? ` · ${block.durationMin} min` : ""}
                    {isDone
                      ? ` · ${labels.completedLabel || "Completado"}`
                      : ""}
                  </div>
                </div>

                {/* Color accent bar */}
                <div style={{ width: "4px", height: "28px", borderRadius: "2px", background: catColor, flexShrink: 0 }} />

                {/* Delete */}
                <button
                  onClick={() => onRemove(block.id)}
                  aria-label={labels.deleteBlockTitle || "Eliminar bloque"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex", opacity: 0.4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulario para agregar bloque */}
      {addingNew ? (
        <div
          style={{
            marginTop: "12px",
            background: C.surface,
            borderRadius: "14px",
            padding: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <input
            type="text"
            placeholder={labels.newBlockPlaceholder || "Nombre del bloque (ej. Trabajo profundo)..."}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
            style={{
              width: "100%",
              border: `1px solid ${C.border}`,
              background: tint(C.text, 0.03),
              borderRadius: "10px",
              padding: "10px 12px",
              fontSize: "13px",
              color: C.text,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={13} color={C.textMuted} />
              <select
                value={newStartHour}
                onChange={(e) => setNewStartHour(+e.target.value)}
                style={{
                  border: `1px solid ${C.border}`,
                  background: tint(C.text, 0.03),
                  borderRadius: "8px",
                  padding: "6px 4px",
                  fontSize: "12px",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span style={{ color: C.textMuted, fontWeight: 600 }}>:</span>
              <select
                value={newStartMinute}
                onChange={(e) => setNewStartMinute(+e.target.value)}
                style={{
                  border: `1px solid ${C.border}`,
                  background: tint(C.text, 0.03),
                  borderRadius: "8px",
                  padding: "6px 4px",
                  fontSize: "12px",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(+e.target.value)}
              style={{
                border: `1px solid ${C.border}`,
                background: tint(C.text, 0.03),
                borderRadius: "8px",
                padding: "6px 8px",
                fontSize: "12px",
                color: C.text,
                cursor: "pointer",
              }}
            >
              {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => { setAddingNew(false); setNewName(""); }}
              style={{
                background: "none",
                border: "none",
                color: C.textMuted,
                fontSize: "12px",
                cursor: "pointer",
                padding: "6px 10px",
              }}
            >
              {labels.closeEditor || "Cerrar"}
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                background: C.accent || "#7C5CE0",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: newName.trim() ? "pointer" : "default",
                opacity: newName.trim() ? 1 : 0.5,
              }}
            >
              {labels.addBlockButton || "Agregar"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          style={{
            width: "100%",
            marginTop: "12px",
            border: `2px dashed ${tint(C.accent || "#7C5CE0", 0.3)}`,
            background: "transparent",
            borderRadius: "14px",
            padding: "12px",
            fontSize: "13px",
            fontWeight: 600,
            color: C.accent || "#7C5CE0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} />
          {labels.addBlockButton || "Agregar bloque"}
        </button>
      )}
    </div>
  );
}
