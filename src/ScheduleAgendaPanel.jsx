// ScheduleAgendaPanel.jsx — Agenda visual v10
// Calendario colapsable semana/mes + bloques sugeridos en estado vacío
// + repetir día anterior + entrada por voz.
// Rediseño aprobado nov 2026.
//
// Props: C, t, lang, scheduleState, onAdd, onRemove, onUpdate, onMove
// scheduleState es el array de bloques — cada bloque:
//   { id, name, icon, startMin, durationMin, day? }
// scheduleBlocksForDay(scheduleState, date) filtra los de hoy.

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  scheduleBlocksForDay,
  formatMinutesAsTime,
} from "./scheduleBlocks";
import {
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  Mic,
} from "lucide-react";
import { tint } from "./theme";

// ---- Colores por categoría (tomados de los planetas de ANRO) ----
const CATEGORY_COLORS = {
  default: "#7C5CE0", // purple — Empezar y organizarme
  focus: "#2E7FD9",   // blue — Concentrarme
  calm: "#1E9E6E",    // green — Calmarme
  feel: "#D98A0B",    // yellow — Cómo me siento
  daily: "#D9467F",   // pink — Mi día a día
};

function guessCategoryColor(block) {
  const n = (block.name || "").toLowerCase();
  if (n.includes("enfoque") || n.includes("focus") || n.includes("pomodoro") || n.includes("body double"))
    return CATEGORY_COLORS.focus;
  if (n.includes("calma") || n.includes("mindful") || n.includes("respir") || n.includes("burbuja") || n.includes("pausa"))
    return CATEGORY_COLORS.calm;
  if (n.includes("ánimo") || n.includes("mood") || n.includes("energía") || n.includes("energy") || n.includes("humor"))
    return CATEGORY_COLORS.feel;
  if (n.includes("hábito") || n.includes("habit") || n.includes("pago") || n.includes("rutina") || n.includes("routine"))
    return CATEGORY_COLORS.daily;
  if (n.includes("medica") || n.includes("pastilla") || n.includes("pill"))
    return CATEGORY_COLORS.default;
  return CATEGORY_COLORS.default;
}

// ---- Bloques sugeridos para estado vacío ----
const SUGGESTED_BLOCKS = [
  { nameKey: "sugMedicamento", fallback: "Medicamento",        icon: "💊", startMin: 480,  durationMin: 5,  color: CATEGORY_COLORS.default },
  { nameKey: "sugEnfoque",     fallback: "Sesión de enfoque",  icon: "🎯", startMin: 540,  durationMin: 25, color: CATEGORY_COLORS.focus },
  { nameKey: "sugPausa",       fallback: "Pausa activa",       icon: "🧘", startMin: 660,  durationMin: 10, color: CATEGORY_COLORS.calm },
  { nameKey: "sugAnimo",       fallback: "Registro de ánimo",  icon: "😊", startMin: 780,  durationMin: 3,  color: CATEGORY_COLORS.feel },
  { nameKey: "sugHabitos",     fallback: "Hábitos del día",    icon: "✅", startMin: 1140, durationMin: 15, color: CATEGORY_COLORS.daily },
];

// ---- Parser de voz → bloque de agenda ----
// Extrae nombre, hora de inicio y duración de un texto hablado.
// Soporta español, inglés, francés y portugués.
function parseVoiceToBlock(raw) {
  const text = raw.toLowerCase().trim();
  let startMin = null;
  let durationMin = 25; // default
  let name = text;

  // ── Extraer duración (ej. "por 30 minutos", "for 15 minutes", "pendant 20 minutes", "por 10 minutos") ──
  const durPatterns = [
    /(?:por|during|pendant|durante)\s+(\d+)\s*(?:min(?:utos?|utes?)?)/i,
    /(\d+)\s*(?:min(?:utos?|utes?)?)/i,
  ];
  for (const pat of durPatterns) {
    const m = text.match(pat);
    if (m) {
      durationMin = parseInt(m[1], 10);
      name = name.replace(m[0], "").trim();
      break;
    }
  }

  // ── Extraer hora (ej. "a las 10", "at 3 pm", "à 14h", "às 9") ──
  const timePatterns = [
    // "a las 10 y media", "a las 3 de la tarde", "a las 10:30"
    /a\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:y\s+media)?\s*(?:de\s+la\s+(mañana|tarde|noche))?/i,
    // "at 3 pm", "at 10:30 am"
    /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    // "à 14h", "à 9h30"
    /[àa]\s+(\d{1,2})\s*h\s*(\d{2})?/i,
    // "às 9 horas"
    /[àa]s?\s+(\d{1,2})(?::(\d{2}))?\s*(?:horas?)?/i,
  ];

  for (const pat of timePatterns) {
    const m = name.match(pat);
    if (m) {
      let hour = parseInt(m[1], 10);
      const mins = m[2] ? parseInt(m[2], 10) : 0;
      const period = m[3] ? m[3].toLowerCase() : null;

      // "y media" dentro del match original
      if (name.match(/a\s+las?\s+\d{1,2}\s+y\s+media/i) && mins === 0) {
        startMin = hour * 60 + 30;
      } else {
        // am/pm o de la tarde/noche
        if (period === "pm" || period === "tarde") {
          if (hour < 12) hour += 12;
        } else if (period === "noche") {
          if (hour < 12) hour += 12;
        } else if (period === "am" || period === "mañana") {
          if (hour === 12) hour = 0;
        } else {
          // Sin indicador: si es < 7 asumir pm
          if (hour >= 1 && hour <= 6) hour += 12;
        }
        startMin = hour * 60 + mins;
      }

      name = name.replace(m[0], "").trim();
      break;
    }
  }

  // ── Limpiar nombre ──
  // Quitar verbos / conectores típicos de voz al inicio
  name = name
    .replace(/^(?:agendar|agregar|añadir|crear|add|create|ajouter|adicionar|programar|poner|recordar)\s+/i, "")
    .replace(/^(?:tengo|tenemos|hay|necesito|quiero|voy a|i have|i need|i want)\s+/i, "")
    .replace(/^(?:que\s+)?(?:una?|un|the|le|la|o|mi|my|mon|ma)\s+/i, "")
    .replace(/\s+$/g, "")
    .replace(/^[\s,.\-]+|[\s,.\-]+$/g, "");

  // Capitalizar primera letra
  if (name.length > 0) name = name.charAt(0).toUpperCase() + name.slice(1);

  // Si no se extrajo nombre útil, usar fallback
  if (name.length < 2) name = "Bloque de voz";

  // Asignar ícono según keywords
  let icon = "🎤";
  const nl = name.toLowerCase();
  if (nl.includes("medica") || nl.includes("pastilla") || nl.includes("pill")) icon = "💊";
  else if (nl.includes("enfoque") || nl.includes("focus") || nl.includes("pomodoro")) icon = "🎯";
  else if (nl.includes("pausa") || nl.includes("break") || nl.includes("calma") || nl.includes("respir")) icon = "🧘";
  else if (nl.includes("ánimo") || nl.includes("mood") || nl.includes("humor")) icon = "😊";
  else if (nl.includes("hábito") || nl.includes("habit") || nl.includes("rutina")) icon = "✅";
  else if (nl.includes("comer") || nl.includes("comida") || nl.includes("lunch") || nl.includes("eat")) icon = "🍽️";
  else if (nl.includes("ejercicio") || nl.includes("exercise") || nl.includes("gym") || nl.includes("correr") || nl.includes("run")) icon = "🏃";
  else if (nl.includes("dormir") || nl.includes("sleep") || nl.includes("siesta") || nl.includes("nap")) icon = "😴";
  else if (nl.includes("cita") || nl.includes("doctor") || nl.includes("dentista") || nl.includes("appointment") || nl.includes("consulta")) icon = "🏥";
  else if (nl.includes("reunión") || nl.includes("reunion") || nl.includes("meeting") || nl.includes("junta") || nl.includes("call") || nl.includes("llamada")) icon = "📞";
  else if (nl.includes("estudi") || nl.includes("study") || nl.includes("tarea") || nl.includes("homework") || nl.includes("leer") || nl.includes("read")) icon = "📚";
  else if (nl.includes("compra") || nl.includes("shop") || nl.includes("super") || nl.includes("mercado")) icon = "🛒";

  return {
    name,
    icon,
    startMin: startMin != null ? startMin : null,
    durationMin,
  };
}

// Detección de soporte de Web Speech API
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Mapeo de lang a BCP47 para SpeechRecognition
const SPEECH_LANG = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

// ---- Helpers del calendario ----
const MONTH_NAMES = {
  es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
  pt: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
};

const DAY_HEADERS = {
  es: ["L", "M", "Mi", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
  fr: ["L", "M", "Me", "J", "V", "S", "D"],
  pt: ["S", "T", "Q", "Q", "S", "S", "D"],
};

/** Lunes–Domingo de la semana que contiene `date` */
function getWeekForDate(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=dom
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dow + 6) % 7));
  const week = [];
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday);
    wd.setDate(monday.getDate() + i);
    week.push(wd);
  }
  return week;
}

/** Grid del mes completo (array de semanas, cada semana = 7 celdas, null si no hay día) */
function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = (first.getDay() + 6) % 7; // 0=lunes
  const grid = [];
  let week = new Array(startOffset).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
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
        const today = new Date().toDateString();
        if (parsed.date === today) return new Set(parsed.ids);
      }
    } catch (_) {}
    return new Set();
  });

  // i18n labels (moved up so voice handlers can reference it)
  const labels = t.schedule || {};

  // ── Voice input state ──
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [voiceParsed, setVoiceParsed] = useState(null); // resultado del parser para confirmar
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef(""); // guarda el último transcript para fallback en onend

  const stopVoice = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setVoiceListening(false);
  }, []);

  const startVoice = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setVoiceError(labels.voiceUnsupported || "Tu navegador no soporta entrada de voz.");
      return;
    }
    setVoiceError("");
    setVoiceText("");
    setVoiceParsed(null);
    latestTranscriptRef.current = "";

    const rec = new SpeechRecognitionAPI();
    rec.lang = SPEECH_LANG[lang] || "es-MX";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    let gotFinal = false;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setVoiceText(transcript);
      latestTranscriptRef.current = transcript;
      // Si es resultado final, parsear
      if (e.results[e.results.length - 1].isFinal) {
        gotFinal = true;
        const parsed = parseVoiceToBlock(transcript);
        setVoiceParsed(parsed);
        stopVoice();
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setVoiceError(labels.voiceDenied || "Permite el acceso al micrófono para usar esta función.");
      } else if (e.error !== "aborted") {
        setVoiceError(labels.voiceErrorGeneric || "No se captó nada. Intenta de nuevo.");
      }
      stopVoice();
    };

    rec.onend = () => {
      setVoiceListening(false);
      // Fallback: si el navegador terminó sin marcar isFinal pero sí captó texto,
      // parsear lo que tengamos (Chrome a veces cierra sin final result)
      if (!gotFinal && latestTranscriptRef.current.length > 0) {
        const parsed = parseVoiceToBlock(latestTranscriptRef.current);
        setVoiceParsed(parsed);
      }
    };

    recognitionRef.current = rec;
    setVoiceListening(true);
    rec.start();
  }, [lang, labels, stopVoice]);

  // Limpiar al desmontar
  useEffect(() => () => stopVoice(), [stopVoice]);

  const handleVoiceConfirm = useCallback(() => {
    if (!voiceParsed) return;
    const now = new Date();
    const fallbackStart = now.getHours() * 60 + now.getMinutes() + 15; // 15 min desde ahora
    onAdd({
      name: voiceParsed.name,
      icon: voiceParsed.icon,
      startMin: voiceParsed.startMin != null ? voiceParsed.startMin : fallbackStart,
      durationMin: voiceParsed.durationMin,
    });
    setVoiceParsed(null);
    setVoiceText("");
  }, [voiceParsed, onAdd]);

  const handleVoiceCancel = useCallback(() => {
    setVoiceParsed(null);
    setVoiceText("");
    setVoiceError("");
  }, []);

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

  const today = useMemo(() => new Date(), []);
  const isToday = sameDay(selectedDate, today);

  // Encontrar el siguiente bloque (no completado, startMin >= ahora)
  const nextBlock = useMemo(() => {
    if (!isToday) return null;
    return dayBlocks.find((b) => !completedIds.has(b.id) && b.startMin >= nowMinutes - 15) || null;
  }, [dayBlocks, completedIds, nowMinutes, isToday]);

  // Progreso
  const totalBlocks = dayBlocks.length;
  const completedCount = dayBlocks.filter((b) => completedIds.has(b.id)).length;
  const progressPct = totalBlocks > 0 ? Math.round((completedCount / totalBlocks) * 100) : 0;

  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.es;
  const dayHeaders = DAY_HEADERS[lang] || DAY_HEADERS.es;

  // Seleccionar un día desde el calendario
  const pickDate = useCallback((d) => {
    if (!d) return;
    setSelectedDate(d);
  }, []);

  // Navegación del mes expandido
  const prevMonth = () => setCalMonth((p) => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const nextMonth = () => setCalMonth((p) => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });

  // Abrir mes expandido (sync con selectedDate)
  const openMonth = () => {
    setCalMonth({ y: selectedDate.getFullYear(), m: selectedDate.getMonth() });
    setCalendarOpen(true);
  };

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

  const handleSuggestedAdd = (sug) => {
    onAdd({
      name: labels[sug.nameKey] || sug.fallback,
      icon: sug.icon,
      startMin: sug.startMin,
      durationMin: sug.durationMin,
    });
  };

  // Semana visible (para el strip colapsado)
  const weekDays = useMemo(() => getWeekForDate(selectedDate), [selectedDate]);

  // Grid del mes (para expandido)
  const monthGrid = useMemo(() => getMonthGrid(calMonth.y, calMonth.m), [calMonth.y, calMonth.m]);

  // Bloques de ayer (para "Repetir mi día anterior")
  const yesterdayBlocks = useMemo(() => {
    const yd = new Date(selectedDate);
    yd.setDate(yd.getDate() - 1);
    return scheduleBlocksForDay(scheduleState, yd).sort((a, b) => a.startMin - b.startMin);
  }, [scheduleState, selectedDate]);

  const handleRepeatYesterday = useCallback(() => {
    yesterdayBlocks.forEach((b) => {
      onAdd({
        name: b.name,
        icon: b.icon || "📋",
        startMin: b.startMin,
        durationMin: b.durationMin,
      });
    });
  }, [yesterdayBlocks, onAdd]);

  // Accent color
  const accent = C.accent || "#7C5CE0";

  // ---- RENDER ----
  return (
    <div>
      {/* Keyframes para pulse de micrófono */}
      <style>{`
        @keyframes anro-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>

      {/* ===== CALENDARIO ===== */}
      <div
        style={{
          background: C.surface,
          borderRadius: "16px",
          padding: "12px 10px 10px",
          marginBottom: "14px",
          boxShadow: `0 1px 4px ${tint(accent, 0.08)}`,
        }}
      >
        {/* Cabecera: mes + botón expandir/colapsar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 8px" }}>
          {calendarOpen ? (
            <>
              <button
                onClick={prevMonth}
                aria-label={labels.prevDay || "Mes anterior"}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                {monthNames[calMonth.m]} {calMonth.y}
              </span>
              <button
                onClick={nextMonth}
                aria-label={labels.nextDay || "Mes siguiente"}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex" }}
              >
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
              <button
                onClick={openMonth}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: accent,
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                }}
              >
                {labels.viewMonth || "Ver mes"}
                <ChevronDown size={12} />
              </button>
            </>
          )}
        </div>

        {/* Headers de días: L M Mi J V S D */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", marginBottom: "4px" }}>
          {dayHeaders.map((h, i) => (
            <span key={i} style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, padding: "2px 0" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Grid de días */}
        {calendarOpen ? (
          /* Mes completo */
          <div>
            {monthGrid.map((week, wi) => (
              <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
                {week.map((d, di) => (
                  <DayCell key={di} date={d} selectedDate={selectedDate} today={today} accent={accent} C={C} onPick={pickDate} />
                ))}
              </div>
            ))}
            {/* Botón ocultar */}
            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <button
                onClick={() => setCalendarOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: accent,
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                }}
              >
                {labels.hideMonth || "Ocultar"}
                <ChevronUp size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* Semana colapsada */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
            {weekDays.map((d, i) => (
              <DayCell key={i} date={d} selectedDate={selectedDate} today={today} accent={accent} C={C} onPick={pickDate} />
            ))}
          </div>
        )}
      </div>

      {/* ===== BARRA DE PROGRESO ===== */}
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
            <span style={{ fontSize: "12px", fontWeight: 700, color: accent }}>
              {completedCount} / {totalBlocks}
            </span>
          </div>
          <div style={{ height: "6px", background: tint(C.text, 0.08), borderRadius: "3px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${accent}, ${tint(accent, 0.6)})`,
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* ===== TARJETA HERO — siguiente actividad ===== */}
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

      {/* ===== LISTA DE BLOQUES Ó SUGERIDOS ===== */}
      {dayBlocks.length === 0 ? (
        /* ---- Estado vacío: sugerencias rápidas ---- */
        <div>
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
              {labels.buildYourDay || "Arma tu día con un toque"}
            </div>
            <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "3px" }}>
              {labels.chooseSuggested || "Elige los bloques que necesitas"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Repetir día anterior (solo si ayer tuvo bloques) */}
            {yesterdayBlocks.length > 0 && (
              <button
                onClick={handleRepeatYesterday}
                style={{
                  width: "100%",
                  background: `linear-gradient(135deg, ${accent}, ${tint(accent, 0.7)})`,
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: `0 2px 8px ${tint(accent, 0.25)}`,
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "20px",
                  }}
                >
                  🔄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
                    {labels.repeatYesterday || "Repetir mi día anterior"}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
                    {(labels.repeatYesterdayHint || "{n} bloques listos para copiar").replace("{n}", yesterdayBlocks.length)}
                  </div>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
              </button>
            )}

            {SUGGESTED_BLOCKS.map((sug) => (
              <button
                key={sug.nameKey}
                onClick={() => handleSuggestedAdd(sug)}
                style={{
                  width: "100%",
                  background: C.surface,
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  textAlign: "left",
                }}
              >
                {/* Color bar */}
                <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: sug.color, flexShrink: 0 }} />
                {/* Icon */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `${sug.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "18px",
                  }}
                >
                  {sug.icon}
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
                    {labels[sug.nameKey] || sug.fallback}
                  </div>
                  <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "1px" }}>
                    {formatMinutesAsTime(sug.startMin)} · {sug.durationMin} min
                  </div>
                </div>
                {/* + icon */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `${sug.color}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Plus size={14} color={sug.color} />
                </div>
              </button>
            ))}

            {/* Fila: bloque personalizado + voz */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setAddingNew(true)}
                style={{
                  flex: 1,
                  border: `2px dashed ${tint(accent, 0.3)}`,
                  background: "transparent",
                  borderRadius: "14px",
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: accent,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Plus size={16} />
                {labels.customBlock || "Crear bloque personalizado"}
              </button>

              {/* Botón de voz */}
              {SpeechRecognitionAPI && (
                <button
                  onClick={voiceListening ? stopVoice : startVoice}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    border: voiceListening ? `2px solid ${accent}` : `2px dashed ${tint(accent, 0.3)}`,
                    background: voiceListening ? tint(accent, 0.12) : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    animation: voiceListening ? "anro-pulse 1.5s ease-in-out infinite" : "none",
                  }}
                  aria-label={labels.voiceAdd || "Agregar con voz"}
                >
                  {voiceListening
                    ? <Mic size={20} color={accent} />
                    : <Mic size={20} color={tint(accent, 0.6)} />}
                </button>
              )}
            </div>

            {/* Indicador de voz activa */}
            {voiceListening && (
              <div
                style={{
                  background: tint(accent, 0.06),
                  borderRadius: "12px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#E53935",
                    animation: "anro-pulse 1s ease-in-out infinite",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: C.text }}>
                    {labels.voiceListening || "Escuchando..."}
                  </div>
                  {voiceText && (
                    <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px", fontStyle: "italic" }}>
                      "{voiceText}"
                    </div>
                  )}
                </div>
                <button
                  onClick={stopVoice}
                  style={{
                    background: tint(C.text, 0.08),
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: C.text,
                    cursor: "pointer",
                  }}
                >
                  {labels.voiceStop || "Parar"}
                </button>
              </div>
            )}

            {/* Resultado de voz: confirmar o cancelar */}
            {voiceParsed && !voiceListening && (
              <div
                style={{
                  background: C.surface,
                  borderRadius: "14px",
                  padding: "14px",
                  boxShadow: `0 2px 8px ${tint(accent, 0.12)}`,
                  border: `1px solid ${tint(accent, 0.15)}`,
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                  {labels.voiceConfirmTitle || "¿Agregar este bloque?"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "22px" }}>{voiceParsed.icon}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{voiceParsed.name}</div>
                    <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>
                      {voiceParsed.startMin != null
                        ? `${formatMinutesAsTime(voiceParsed.startMin)} · ${voiceParsed.durationMin} min`
                        : `${voiceParsed.durationMin} min`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleVoiceConfirm}
                    style={{
                      flex: 1,
                      background: accent,
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Check size={16} />
                    {labels.voiceConfirm || "Agregar"}
                  </button>
                  <button
                    onClick={handleVoiceCancel}
                    style={{
                      flex: 1,
                      background: tint(C.text, 0.06),
                      color: C.text,
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {labels.voiceCancel || "Cancelar"}
                  </button>
                </div>
              </div>
            )}

            {/* Error de voz */}
            {voiceError && (
              <div style={{ fontSize: "12px", color: "#E53935", textAlign: "center", padding: "8px" }}>
                {voiceError}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---- Lista de bloques existentes ---- */
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
                    {isDone ? ` · ${labels.completedLabel || "Completado"}` : ""}
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

      {/* ===== FORMULARIO AGREGAR BLOQUE ===== */}
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
                background: accent,
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
        /* Botones para agregar otro bloque: texto + voz */
        dayBlocks.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={() => setAddingNew(true)}
              style={{
                flex: 1,
                border: `2px dashed ${tint(accent, 0.3)}`,
                background: "transparent",
                borderRadius: "14px",
                padding: "12px",
                fontSize: "13px",
                fontWeight: 600,
                color: accent,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Plus size={16} />
              {labels.addAnotherBlock || "Agregar otro bloque"}
            </button>
            {SpeechRecognitionAPI && (
              <button
                onClick={voiceListening ? stopVoice : startVoice}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  border: voiceListening ? `2px solid ${accent}` : `2px dashed ${tint(accent, 0.3)}`,
                  background: voiceListening ? tint(accent, 0.12) : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  animation: voiceListening ? "anro-pulse 1.5s ease-in-out infinite" : "none",
                }}
                aria-label={labels.voiceAdd || "Agregar con voz"}
              >
                <Mic size={20} color={voiceListening ? accent : tint(accent, 0.6)} />
              </button>
            )}
          </div>
        )
      )}

      {/* ===== VOICE FEEDBACK (fuera del ternario, visible siempre) ===== */}
      {voiceListening && dayBlocks.length > 0 && (
        <div
          style={{
            background: tint(accent, 0.06),
            borderRadius: "12px",
            padding: "12px 14px",
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E53935", animation: "anro-pulse 1s ease-in-out infinite", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.text }}>{labels.voiceListening || "Escuchando..."}</div>
            {voiceText && <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px", fontStyle: "italic" }}>"{voiceText}"</div>}
          </div>
          <button onClick={stopVoice} style={{ background: tint(C.text, 0.08), border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", fontWeight: 600, color: C.text, cursor: "pointer" }}>
            {labels.voiceStop || "Parar"}
          </button>
        </div>
      )}
      {voiceParsed && !voiceListening && dayBlocks.length > 0 && (
        <div style={{ background: C.surface, borderRadius: "14px", padding: "14px", marginTop: "8px", boxShadow: `0 2px 8px ${tint(accent, 0.12)}`, border: `1px solid ${tint(accent, 0.15)}` }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
            {labels.voiceConfirmTitle || "¿Agregar este bloque?"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "22px" }}>{voiceParsed.icon}</span>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{voiceParsed.name}</div>
              <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>
                {voiceParsed.startMin != null ? `${formatMinutesAsTime(voiceParsed.startMin)} · ${voiceParsed.durationMin} min` : `${voiceParsed.durationMin} min`}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleVoiceConfirm} style={{ flex: 1, background: accent, color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Check size={16} /> {labels.voiceConfirm || "Agregar"}
            </button>
            <button onClick={handleVoiceCancel} style={{ flex: 1, background: tint(C.text, 0.06), color: C.text, border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {labels.voiceCancel || "Cancelar"}
            </button>
          </div>
        </div>
      )}
      {voiceError && dayBlocks.length > 0 && (
        <div style={{ fontSize: "12px", color: "#E53935", textAlign: "center", padding: "8px" }}>{voiceError}</div>
      )}
    </div>
  );
}

// ---- Sub-componente: celda de día en el calendario ----
function DayCell({ date, selectedDate, today, accent, C, onPick }) {
  if (!date) {
    return <div style={{ padding: "6px 0" }} />;
  }
  const isSelected = sameDay(date, selectedDate);
  const isToday = sameDay(date, today);
  const isPast = date < today && !isToday;

  return (
    <button
      onClick={() => onPick(date)}
      style={{
        background: isSelected ? accent : "transparent",
        color: isSelected ? "#fff" : isPast ? C.textMuted : C.text,
        border: isToday && !isSelected ? `2px solid ${accent}` : "2px solid transparent",
        borderRadius: "50%",
        width: "34px",
        height: "34px",
        fontSize: "12px",
        fontWeight: isToday || isSelected ? 700 : 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        margin: "2px auto",
        transition: "all 0.15s",
        opacity: isPast ? 0.5 : 1,
        padding: 0,
      }}
    >
      {date.getDate()}
    </button>
  );
}
