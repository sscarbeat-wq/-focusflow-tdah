import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { tint } from "./theme";
import {
  DEFAULT_DURATION_MIN,
  MAX_BLOCKS_PER_DAY,
  formatMinutesAsTime,
  parseTimeInputToMinutes,
} from "./scheduleBlocks";

// Agenda visual del día — Módulo 2 de ANRO TDAH 2.0 (ver scheduleBlocks.js
// para la decisión de alcance: esta agenda vive solo dentro de la app, no
// se sincroniza con Google Calendar todavía).
//
// Dos formas de cambiar la hora de un bloque, a propósito:
// 1) Arrastrarlo con el dedo/mouse directo en la cuadrícula (gesto rápido,
//    visual, igual que Tiimo/Structured).
// 2) El campo de hora (<input type="time">) dentro del editor de cada
//    bloque — funciona igual de bien con teclado/lector de pantalla, así
//    que la agenda es 100% usable sin arrastrar nada.
// Ambos caminos llaman a la MISMA función (onMove), así que siempre
// terminan en el mismo estado válido.
const START_HOUR = 0;
const END_HOUR = 24;
const PX_PER_MIN = 1; // 60px por hora
const GRID_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;
const CLICK_THRESHOLD_PX = 6; // menos que esto = toque, no arrastre
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const BLOCK_ICONS = ["🗓️", "💻", "🍽️", "🏃", "📞", "🧘", "📚", "🛒", "👥", "😴"];

function minutesNow(now) {
  return now.getHours() * 60 + now.getMinutes();
}

export default function ScheduleAgendaPanel({ C, t, blocks, conflicts, onAdd, onRemove, onUpdate, onMove }) {
  const scrollRef = useRef(null);
  const [nowMin, setNowMin] = useState(() => minutesNow(new Date()));
  const [expandedId, setExpandedId] = useState(null);
  const [drag, setDrag] = useState(null); // { id, startClientY, startMin, previewMin }
  const [newText, setNewText] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState(DEFAULT_DURATION_MIN);
  const [newIcon, setNewIcon] = useState(BLOCK_ICONS[0]);

  useEffect(() => {
    const id = setInterval(() => setNowMin(minutesNow(new Date())), 60000);
    return () => clearInterval(id);
  }, []);

  // Al abrir el panel, la cuadrícula hace scroll hasta un poco antes de
  // "ahora" en vez de empezar siempre a medianoche — así la hora actual
  // queda visible sin que la paciente tenga que buscarla.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, (nowMin - 90) * PX_PER_MIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atCap = blocks.length >= MAX_BLOCKS_PER_DAY;

  const handlePointerDown = (e, block) => {
    if (e.button !== undefined && e.button !== 0) return; // solo click izquierdo / toque
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ id: block.id, startClientY: e.clientY, startMin: block.startMin, previewMin: block.startMin, moved: false });
  };

  const handlePointerMove = (e) => {
    if (!drag) return;
    const deltaY = e.clientY - drag.startClientY;
    const deltaMin = deltaY / PX_PER_MIN;
    const moved = Math.abs(deltaY) > CLICK_THRESHOLD_PX;
    setDrag({ ...drag, previewMin: drag.startMin + deltaMin, moved: moved || drag.moved });
  };

  const endDrag = (commit) => {
    if (!drag) return;
    if (commit && drag.moved) {
      onMove(drag.id, drag.previewMin);
    } else if (!drag.moved) {
      setExpandedId((cur) => (cur === drag.id ? null : drag.id));
    }
    setDrag(null);
  };

  const handlePointerUp = () => endDrag(true);
  const handlePointerCancel = () => endDrag(false);

  const handleBlockKeyDown = (e, block) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpandedId((cur) => (cur === block.id ? null : block.id));
    }
  };

  const expanded = useMemo(() => blocks.find((b) => b.id === expandedId) || null, [blocks, expandedId]);

  const handleSubmitNew = (e) => {
    e.preventDefault();
    const cleanText = newText.trim();
    if (!cleanText) return;
    const startMin = parseTimeInputToMinutes(newTime);
    onAdd({ text: cleanText, icon: newIcon, startMin: startMin ?? undefined, durationMin: Number(newDuration) });
    setNewText("");
    setNewTime("");
  };

  const hourLines = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hourLines.push(h);
  }

  return (
    <div>
      <div
        ref={scrollRef}
        style={{
          position: "relative",
          height: "440px",
          overflowY: "auto",
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          background: C.surfaceAlt,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div style={{ position: "relative", height: `${GRID_HEIGHT}px` }}>
          {hourLines.map((h) => (
            <div
              key={h}
              style={{
                position: "absolute",
                top: `${(h - START_HOUR) * 60 * PX_PER_MIN}px`,
                left: 0,
                right: 0,
                borderTop: `1px solid ${C.border}`,
                height: "1px",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "6px",
                  fontSize: "10px",
                  color: C.textMuted,
                  background: C.surfaceAlt,
                  padding: "0 3px",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Línea de "ahora" */}
          <div
            style={{
              position: "absolute",
              top: `${(nowMin - START_HOUR * 60) * PX_PER_MIN}px`,
              left: 0,
              right: 0,
              height: "2px",
              background: C.coral,
              zIndex: 5,
            }}
          />

          {blocks.map((block) => {
            const isDragging = drag && drag.id === block.id;
            const liveStartMin = isDragging ? drag.previewMin : block.startMin;
            const top = (liveStartMin - START_HOUR * 60) * PX_PER_MIN;
            const height = Math.max(20, block.durationMin * PX_PER_MIN);
            const isConflicted = conflicts.has(block.id);
            const accent = isConflicted ? C.rose : C.sky;
            return (
              <div
                key={block.id}
                role="button"
                tabIndex={0}
                aria-label={`${formatMinutesAsTime(block.startMin)} ${block.text}${isConflicted ? ` — ${t.schedule.conflictLabel}` : ""}`}
                aria-expanded={expandedId === block.id}
                onPointerDown={(e) => handlePointerDown(e, block)}
                onKeyDown={(e) => handleBlockKeyDown(e, block)}
                style={{
                  position: "absolute",
                  left: "56px",
                  right: "8px",
                  top: `${top}px`,
                  height: `${height}px`,
                  background: `linear-gradient(135deg, ${tint(accent, 0.35)}, ${tint(accent, 0.18)})`,
                  border: `1px solid ${isConflicted ? C.rose : tint(accent, 0.5)}`,
                  borderLeft: `4px solid ${accent}`,
                  borderRadius: "8px",
                  padding: "3px 8px",
                  cursor: "grab",
                  overflow: "hidden",
                  zIndex: isDragging ? 10 : 2,
                  boxShadow: isDragging ? "0 6px 16px rgba(0,0,0,0.25)" : "none",
                  color: C.text,
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  minHeight: "44px",
                }}
              >
                <GripVertical size={13} style={{ flexShrink: 0, color: C.textMuted }} />
                <span style={{ flexShrink: 0 }}>{block.icon}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  <strong>{formatMinutesAsTime(block.startMin)}</strong> {block.text}
                </span>
                {isConflicted && <AlertTriangle size={14} style={{ flexShrink: 0, color: C.rose }} />}
              </div>
            );
          })}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: "10px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "12px",
          }}
        >
          {conflicts.has(expanded.id) && (
            <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.rose, margin: "0 0 8px" }}>
              <AlertTriangle size={14} /> {t.schedule.conflictNotice}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            <input
              type="text"
              value={expanded.text}
              onChange={(e) => onUpdate(expanded.id, { text: e.target.value })}
              style={{
                flex: "1 1 160px",
                minHeight: "44px",
                padding: "0 12px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: C.surfaceAlt,
                color: C.text,
                fontSize: "13px",
              }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: C.textMuted }}>{t.schedule.timeLabel}</span>
              <input
                type="time"
                value={formatMinutesAsTime(expanded.startMin)}
                onChange={(e) => {
                  const parsed = parseTimeInputToMinutes(e.target.value);
                  if (parsed !== null) onMove(expanded.id, parsed);
                }}
                aria-label={t.schedule.timeLabel}
                style={{
                  minHeight: "44px",
                  padding: "0 10px",
                  borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: C.surfaceAlt,
                  color: C.text,
                  fontSize: "13px",
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: C.textMuted }}>{t.schedule.durationLabel}</span>
              <select
                value={expanded.durationMin}
                onChange={(e) => onUpdate(expanded.id, { durationMin: Number(e.target.value) })}
                aria-label={t.schedule.durationLabel}
                style={{
                  minHeight: "44px",
                  padding: "0 10px",
                  borderRadius: "10px",
                  border: `1px solid ${C.border}`,
                  background: C.surfaceAlt,
                  color: C.text,
                  fontSize: "13px",
                }}
              >
                {DURATION_OPTIONS.map((min) => (
                  <option key={min} value={min}>
                    {t.schedule.aboutMinutes(min)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => {
                onRemove(expanded.id);
                setExpandedId(null);
              }}
              aria-label={t.schedule.deleteBlockTitle}
              style={{
                minHeight: "44px",
                minWidth: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "0 14px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: "transparent",
                color: C.rose,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              <Trash2 size={16} /> {t.schedule.deleteBlockTitle}
            </button>
            <button
              onClick={() => setExpandedId(null)}
              style={{
                minHeight: "44px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "none",
                background: C.surfaceAlt,
                color: C.text,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {t.schedule.closeEditor}
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmitNew}
        style={{
          marginTop: "12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <select
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          aria-label={t.schedule.iconLabel}
          style={{
            minHeight: "44px",
            padding: "0 8px",
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
            color: C.text,
            fontSize: "15px",
          }}
        >
          {BLOCK_ICONS.map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={t.schedule.newBlockPlaceholder}
          disabled={atCap}
          style={{
            flex: "1 1 160px",
            minHeight: "44px",
            padding: "0 12px",
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
            color: C.text,
            fontSize: "13px",
          }}
        />
        <input
          type="time"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
          aria-label={t.schedule.timeLabel}
          disabled={atCap}
          style={{
            minHeight: "44px",
            padding: "0 10px",
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
            color: C.text,
            fontSize: "13px",
          }}
        />
        <select
          value={newDuration}
          onChange={(e) => setNewDuration(e.target.value)}
          aria-label={t.schedule.durationLabel}
          disabled={atCap}
          style={{
            minHeight: "44px",
            padding: "0 10px",
            borderRadius: "10px",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
            color: C.text,
            fontSize: "13px",
          }}
        >
          {DURATION_OPTIONS.map((min) => (
            <option key={min} value={min}>
              {t.schedule.aboutMinutes(min)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={atCap || !newText.trim()}
          style={{
            minHeight: "44px",
            minWidth: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "0 16px",
            borderRadius: "10px",
            border: "none",
            background: atCap || !newText.trim() ? C.surfaceAlt : C.sky,
            color: atCap || !newText.trim() ? C.textMuted : "#fff",
            cursor: atCap || !newText.trim() ? "default" : "pointer",
            fontSize: "13px",
          }}
        >
          <Plus size={16} /> {t.schedule.addBlockButton}
        </button>
      </form>
      {atCap && <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "6px" }}>{t.schedule.dayFullNotice}</p>}
    </div>
  );
}
