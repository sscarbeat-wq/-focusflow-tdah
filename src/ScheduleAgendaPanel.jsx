import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, GripVertical, AlertTriangle, ChevronLeft, ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { tint } from "./theme";
import {
  DEFAULT_DURATION_MIN,
  MAX_BLOCKS_PER_DAY,
  formatMinutesAsTime,
  parseTimeInputToMinutes,
  scheduleBlocksForDate,
  scheduleBlocksForWeek,
  detectConflicts,
} from "./scheduleBlocks";
import { todayKey } from "./streak";

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
//
// Fase 2E (29 de octubre de 2026): se agregó un selector Día/Semana arriba.
// La vista Día es exactamente la cuadrícula de siempre (arrastrar, editar,
// agregar), ahora capaz de mostrar cualquier día (no solo "hoy") mediante
// las flechas de navegación — sigue abriendo cerca de la hora actual
// cuando el día mostrado es hoy. La vista Semana es deliberadamente más
// simple: una lista compacta de los 7 días (lunes a domingo) con sus
// bloques — tocar un bloque ahí cambia a la vista Día de ese día y abre su
// editor (reutiliza el mismo formulario, nunca se duplica); tocar el
// encabezado de un día cambia a su vista Día sin abrir nada, para poder
// agregar un bloque nuevo ese día. Arrastrar para mover solo existe dentro
// de la vista Día, igual que antes — mover un bloque arrastrando ENTRE
// columnas de días distintos habría sido mucho más riesgo para un
// beneficio chico, y no lo pidió la doctora.
const START_HOUR = 0;
const END_HOUR = 24;
const PX_PER_MIN = 1; // 60px por hora
const GRID_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;
const CLICK_THRESHOLD_PX = 6; // menos que esto = toque, no arrastre
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const BLOCK_ICONS = ["🗓️", "💻", "🍽️", "🏃", "📞", "🧘", "📚", "🛒", "👥", "😴"];

// Mismo patrón que ClinicalReportPanel.jsx/GoodMomentsPanel.jsx: un locale
// de formato por idioma de la app (no por país de la persona), solo para
// que el nombre del día/mes salga en el orden e idioma esperados.
const DATE_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function minutesNow(now) {
  return now.getHours() * 60 + now.getMinutes();
}

function dateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function addDays(date, delta) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

export default function ScheduleAgendaPanel({ C, t, lang, scheduleState, onAdd, onRemove, onUpdate, onMove }) {
  const locale = DATE_LOCALES[lang] || DATE_LOCALES.es;
  const scrollRef = useRef(null);
  const [nowMin, setNowMin] = useState(() => minutesNow(new Date()));
  const [viewMode, setViewMode] = useState("day"); // "day" | "week"
  const [selectedDate, setSelectedDate] = useState(() => new Date());
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

  const selectedDateKey = todayKey(selectedDate);
  const todayKeyNow = todayKey(new Date());
  const isToday = selectedDateKey === todayKeyNow;

  const blocks = useMemo(
    () => scheduleBlocksForDate(scheduleState, selectedDateKey),
    [scheduleState, selectedDateKey]
  );
  const conflicts = useMemo(() => detectConflicts(blocks), [blocks]);
  const week = useMemo(() => scheduleBlocksForWeek(scheduleState, selectedDate), [scheduleState, selectedDate]);

  // Al entrar a la vista Día (o cambiar de día dentro de ella), la
  // cuadrícula hace scroll hasta un poco antes de "ahora" cuando el día
  // mostrado es hoy — así la hora actual queda visible sin buscarla. Si es
  // otro día, se abre cerca de las 8am (horario típico de inicio de
  // actividades) en vez de medianoche, por la misma razón.
  useEffect(() => {
    if (viewMode !== "day" || !scrollRef.current) return;
    const anchorMin = isToday ? nowMin : 8 * 60;
    scrollRef.current.scrollTop = Math.max(0, (anchorMin - 90) * PX_PER_MIN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDateKey]);

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
    onAdd({ text: cleanText, icon: newIcon, startMin: startMin ?? undefined, durationMin: Number(newDuration), dateKey: selectedDateKey });
    setNewText("");
    setNewTime("");
  };

  const goToDay = (dateKey) => {
    setSelectedDate(dateFromKey(dateKey));
    setViewMode("day");
  };

  const openBlockFromWeek = (dateKey, blockId) => {
    setSelectedDate(dateFromKey(dateKey));
    setViewMode("day");
    setExpandedId(blockId);
  };

  const hourLines = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hourLines.push(h);
  }

  const viewTabStyle = (isActive) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minHeight: "40px",
    padding: "8px 14px",
    background: isActive ? C.sky : "transparent",
    border: `1px solid ${isActive ? C.sky : C.border}`,
    borderRadius: "12px",
    color: isActive ? "#fff" : C.text,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  });

  const navBtnStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40px",
    minWidth: "40px",
    borderRadius: "10px",
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.text,
    cursor: "pointer",
  };

  return (
    <div>
      <div
        role="group"
        aria-label={t.schedule.viewGroupLabel}
        style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}
      >
        <button type="button" aria-pressed={viewMode === "day"} onClick={() => setViewMode("day")} style={viewTabStyle(viewMode === "day")}>
          <Calendar size={14} /> {t.schedule.dayViewTab}
        </button>
        <button type="button" aria-pressed={viewMode === "week"} onClick={() => setViewMode("week")} style={viewTabStyle(viewMode === "week")}>
          <CalendarDays size={14} /> {t.schedule.weekViewTab}
        </button>
      </div>

      {viewMode === "day" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
          <button type="button" onClick={() => setSelectedDate((d) => addDays(d, -1))} aria-label={t.schedule.prevDay} style={navBtnStyle}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: C.text, textTransform: "capitalize" }}>
              {selectedDate.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })}
            </span>
            {isToday ? (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: C.sky,
                  background: tint(C.sky, 0.18),
                  borderRadius: "999px",
                  padding: "2px 8px",
                }}
              >
                {t.schedule.todayBadge}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                style={{ background: "transparent", border: "none", color: C.sky, fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                {t.schedule.backToToday}
              </button>
            )}
          </div>
          <button type="button" onClick={() => setSelectedDate((d) => addDays(d, 1))} aria-label={t.schedule.nextDay} style={navBtnStyle}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {viewMode === "day" && (
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

            {/* Línea de "ahora" — solo cuando el día mostrado es hoy, para no
                dar a entender que "ahora" cayó en un día distinto. */}
            {isToday && (
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
            )}

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
      )}

      {viewMode === "week" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {week.keys.map((dateKey) => {
            const dayBlocks = week.byDate[dateKey] || [];
            const dayConflicts = detectConflicts(dayBlocks);
            const isDayToday = dateKey === todayKeyNow;
            const d = dateFromKey(dateKey);
            return (
              <div
                key={dateKey}
                style={{
                  border: `1px solid ${isDayToday ? C.sky : C.border}`,
                  borderRadius: "12px",
                  padding: "10px 12px",
                  background: isDayToday ? tint(C.sky, 0.08) : C.surfaceAlt,
                }}
              >
                <button
                  type="button"
                  onClick={() => goToDay(dateKey)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    minHeight: "32px",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    marginBottom: dayBlocks.length ? "8px" : 0,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  aria-label={`${t.schedule.viewFullDay} — ${d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })}`}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.text, textTransform: "capitalize" }}>
                      {d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    {isDayToday && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: C.sky,
                          background: tint(C.sky, 0.18),
                          borderRadius: "999px",
                          padding: "1px 7px",
                        }}
                      >
                        {t.schedule.todayBadge}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} style={{ color: C.textMuted, flexShrink: 0 }} />
                </button>

                {dayBlocks.length === 0 ? (
                  <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>{t.schedule.weekEmptyDay}</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dayBlocks.map((block) => {
                      const isConflicted = dayConflicts.has(block.id);
                      return (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => openBlockFromWeek(dateKey, block.id)}
                          aria-label={`${formatMinutesAsTime(block.startMin)} ${block.text}${isConflicted ? ` — ${t.schedule.conflictLabel}` : ""}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minHeight: "36px",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${isConflicted ? C.rose : "transparent"}`,
                            background: C.surface,
                            color: C.text,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>{block.icon}</span>
                          <span style={{ flexShrink: 0, fontWeight: 600 }}>{formatMinutesAsTime(block.startMin)}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{block.text}</span>
                          {isConflicted && <AlertTriangle size={13} style={{ flexShrink: 0, color: C.rose }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "day" && expanded && (
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

      {viewMode === "day" && (
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
      )}
      {viewMode === "day" && atCap && <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "6px" }}>{t.schedule.dayFullNotice}</p>}
    </div>
  );
}
