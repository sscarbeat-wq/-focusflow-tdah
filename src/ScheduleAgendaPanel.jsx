// ScheduleAgendaPanel.jsx — Agenda visual v16
// La agenda es un ESPEJO DEL DÍA, no una lista de tareas.
// Muestra automáticamente: medicamentos (del módulo de medicamentos).
// El paciente solo agrega: pendientes externos (citas, mandados, compromisos).
// Captura rápida por voz con soporte de fechas ("cita el viernes a las 4").
//
// Props: C, t, lang, scheduleState, onAdd, onRemove, onUpdate, onMove, medications
// medications: array de medicamentos activos (del módulo medicationLog.js)
// scheduleState es el array de bloques — cada bloque:
//   { id, text, icon, startMin, durationMin, day? }
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
  const n = (block.text || block.name || "").toLowerCase();
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

// (Sugerencias predefinidas eliminadas en v16 — la agenda ya no repite cosas
// que tienen su propio módulo. Solo sirve para pendientes externos del paciente
// + medicamentos automáticos.)

// ---- Helpers de fecha para el parser de voz ----
const DAY_NAMES_ES = { lunes: 1, martes: 2, miércoles: 3, miercoles: 3, jueves: 4, viernes: 5, sábado: 6, sabado: 6, domingo: 0 };
const MONTH_NAMES_ES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };

/** Dado un día de la semana (0=dom), encuentra la próxima fecha con ese día */
function nextWeekday(targetDay, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diff = (targetDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff)); // si es hoy, ir al próximo
  return d;
}

/** Extrae una fecha del texto hablado. Retorna { date: Date|null, cleaned: string } */
function parseDateFromVoice(text, now = new Date()) {
  let cleaned = text;
  let date = null;

  // "el 20 de noviembre", "el 5 de diciembre"
  const absDate = cleaned.match(/(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
  if (absDate) {
    const day = parseInt(absDate[1], 10);
    const month = MONTH_NAMES_ES[absDate[2].toLowerCase()];
    if (month != null && day >= 1 && day <= 31) {
      let year = now.getFullYear();
      const candidate = new Date(year, month, day);
      if (candidate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        year++; // si ya pasó, asumir el del año que viene
      }
      date = new Date(year, month, day);
      cleaned = cleaned.replace(absDate[0], "").trim();
    }
  }

  // "mañana"
  if (!date && /\bmañana\b/i.test(cleaned) && !/\bde\s+la\s+mañana\b/i.test(cleaned)) {
    // solo si es "mañana" suelto, no "de la mañana" (que es indicador AM)
    const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    date = tmrw;
    cleaned = cleaned.replace(/\bmañana\b/i, "").trim();
  }

  // "pasado mañana"
  if (!date && /\bpasado\s+mañana\b/i.test(cleaned)) {
    date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    cleaned = cleaned.replace(/\bpasado\s+mañana\b/i, "").trim();
  }

  // "el lunes", "el viernes", "el sábado"
  if (!date) {
    const dayMatch = cleaned.match(/(?:el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)/i);
    if (dayMatch) {
      const dayKey = dayMatch[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const targetDay = DAY_NAMES_ES[dayKey];
      if (targetDay != null) {
        date = nextWeekday(targetDay, now);
        cleaned = cleaned.replace(dayMatch[0], "").trim();
      }
    }
  }

  return { date, cleaned };
}

// ---- Parser de voz → bloque de agenda ----
// Extrae nombre, hora de inicio, duración y FECHA de un texto hablado.
// Enfocado en pendientes externos: citas, mandados, compromisos.
function parseVoiceToBlock(raw, now = new Date()) {
  const text = raw.toLowerCase().trim();
  let startMin = null;
  let durationMin = null;
  let name = text;

  // ── Extraer FECHA (ej. "el viernes", "mañana", "el 20 de noviembre") ──
  const { date: parsedDate, cleaned: afterDate } = parseDateFromVoice(name, now);
  name = afterDate;

  // ── Extraer duración (ej. "por 30 minutos") ──
  const durPatterns = [
    /(?:por|during|pendant|durante)\s+(\d+)\s*(?:min(?:utos?|utes?)?)/i,
    /(\d+)\s*(?:min(?:utos?|utes?)?)/i,
  ];
  for (const pat of durPatterns) {
    const m = name.match(pat);
    if (m) {
      durationMin = parseInt(m[1], 10);
      name = name.replace(m[0], "").trim();
      break;
    }
  }

  // ── Extraer hora (ej. "a las 10", "at 3 pm") ──
  const timePatterns = [
    /a\s+las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:y\s+media)?\s*(?:de\s+la\s+(mañana|tarde|noche))?/i,
    /at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    /[àa]\s+(\d{1,2})\s*h\s*(\d{2})?/i,
    /[àa]s?\s+(\d{1,2})(?::(\d{2}))?\s*(?:horas?)?/i,
  ];

  for (const pat of timePatterns) {
    const m = name.match(pat);
    if (m) {
      let hour = parseInt(m[1], 10);
      const mins = m[2] ? parseInt(m[2], 10) : 0;
      const period = m[3] ? m[3].toLowerCase() : null;

      if (name.match(/a\s+las?\s+\d{1,2}\s+y\s+media/i) && mins === 0) {
        startMin = hour * 60 + 30;
      } else {
        if (period === "pm" || period === "tarde") {
          if (hour < 12) hour += 12;
        } else if (period === "noche") {
          if (hour < 12) hour += 12;
        } else if (period === "am" || period === "mañana") {
          if (hour === 12) hour = 0;
        } else {
          if (hour >= 1 && hour <= 6) hour += 12;
        }
        startMin = hour * 60 + mins;
      }
      name = name.replace(m[0], "").trim();
      break;
    }
  }

  // ── Limpiar nombre ──
  name = name
    .replace(/^(?:agendar|agregar|añadir|crear|add|create|programar|poner|recordar|recordarme)\s+/i, "")
    .replace(/^(?:tengo|tenemos|hay|necesito|quiero|voy a|i have|i need|i want)\s+/i, "")
    .replace(/^(?:que\s+)?(?:una?|un|the|le|la|o|mi|my)\s+/i, "")
    .replace(/\s+$/g, "")
    .replace(/^[\s,.\-]+|[\s,.\-]+$/g, "");

  if (name.length > 0) name = name.charAt(0).toUpperCase() + name.slice(1);
  if (name.length < 2) name = "Pendiente";

  // Asignar ícono inteligente según keywords (solo pendientes externos)
  let icon = "📌";
  let smartDuration = 30;
  const nl = name.toLowerCase();

  if (nl.includes("cita") || nl.includes("doctor") || nl.includes("dentista") || nl.includes("consulta") || nl.includes("appointment")) {
    icon = "🏥"; smartDuration = 60;
  } else if (nl.includes("reunión") || nl.includes("reunion") || nl.includes("meeting") || nl.includes("junta") || nl.includes("llamada") || nl.includes("call")) {
    icon = "📞"; smartDuration = 30;
  } else if (nl.includes("compra") || nl.includes("shop") || nl.includes("super") || nl.includes("mercado") || nl.includes("mandado")) {
    icon = "🛒"; smartDuration = 45;
  } else if (nl.includes("recoger") || nl.includes("llevar") || nl.includes("pick up") || nl.includes("dejar")) {
    icon = "🚗"; smartDuration = 30;
  } else if (nl.includes("pago") || nl.includes("pagar") || nl.includes("banco") || nl.includes("bank") || nl.includes("trámite")) {
    icon = "🏦"; smartDuration = 30;
  } else if (nl.includes("trabaj") || nl.includes("work") || nl.includes("oficina") || nl.includes("chamba")) {
    icon = "💼"; smartDuration = 60;
  } else if (nl.includes("clase") || nl.includes("class") || nl.includes("curso") || nl.includes("escuela") || nl.includes("examen")) {
    icon = "🎓"; smartDuration = 50;
  } else if (nl.includes("comer") || nl.includes("comida") || nl.includes("restaurante") || nl.includes("desayun") || nl.includes("cena")) {
    icon = "🍽️"; smartDuration = 45;
  } else if (nl.includes("ejercicio") || nl.includes("gym") || nl.includes("correr") || nl.includes("caminar")) {
    icon = "🏃"; smartDuration = 30;
  } else if (nl.includes("vuelo") || nl.includes("viaje") || nl.includes("aeropuerto") || nl.includes("avión")) {
    icon = "✈️"; smartDuration = 120;
  } else if (nl.includes("fiesta") || nl.includes("cumpleaños") || nl.includes("evento") || nl.includes("party")) {
    icon = "🎉"; smartDuration = 120;
  }

  return {
    name,
    icon,
    startMin: startMin != null ? startMin : null,
    durationMin: durationMin != null ? durationMin : smartDuration,
    dateKey: parsedDate, // Date object o null (hoy)
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
  medications,
  autoStartVoice,
  onVoiceConsumed,
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

    // Helper interno: parsear y agregar bloque DIRECTO (sin pasar por estado)
    const addBlockFromVoice = (transcript) => {
      const parsed = parseVoiceToBlock(transcript);
      if (!parsed || !parsed.name) return;
      const now = new Date();
      const fallbackStart = now.getHours() * 60 + now.getMinutes() + 15;
      try {
        // Si el parser detectó una fecha ("el viernes", "mañana", "el 20 de nov"),
        // convertir el Date a dateKey string "YYYY-MM-DD" para scheduleBlocks.js
        let dateKey = undefined;
        if (parsed.dateKey instanceof Date) {
          const dd = parsed.dateKey;
          dateKey = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
          // Auto-navegar al día donde se agendó
          setSelectedDate(dd);
        }
        onAdd({
          text: parsed.name,
          icon: parsed.icon,
          startMin: parsed.startMin != null ? parsed.startMin : fallbackStart,
          durationMin: parsed.durationMin,
          dateKey,
        });
        const dateLabel = dateKey && parsed.dateKey
          ? ` (${parsed.dateKey.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { weekday: "short", day: "numeric", month: "short" })})`
          : "";
        setVoiceText("✅ " + parsed.name + dateLabel);
      } catch (err) {
        setVoiceError("Error al agregar: " + (err.message || "desconocido"));
      }
    };

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
      if (e.results[e.results.length - 1].isFinal) {
        gotFinal = true;
        addBlockFromVoice(transcript);
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
      // Fallback: si Chrome terminó sin isFinal pero captó texto
      if (!gotFinal && latestTranscriptRef.current.length > 0) {
        addBlockFromVoice(latestTranscriptRef.current);
      }
    };

    recognitionRef.current = rec;
    setVoiceListening(true);
    rec.start();
  }, [lang, labels, stopVoice, onAdd]);

  // Limpiar al desmontar
  useEffect(() => () => stopVoice(), [stopVoice]);

  // Auto-iniciar voz cuando viene del Home (prop autoStartVoice)
  useEffect(() => {
    if (autoStartVoice && SpeechRecognitionAPI && !voiceListening) {
      startVoice();
      if (onVoiceConsumed) onVoiceConsumed();
    }
  }, [autoStartVoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando la voz parsea un bloque, auto-agregarlo directamente
  const applyVoiceParsed = useCallback((parsed) => {
    if (!parsed) return;
    const now = new Date();
    const fallbackStart = now.getHours() * 60 + now.getMinutes() + 15;
    const startMin = parsed.startMin != null ? parsed.startMin : fallbackStart;
    let dateKey = undefined;
    if (parsed.dateKey instanceof Date) {
      const dd = parsed.dateKey;
      dateKey = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(dd.getDate()).padStart(2, "0")}`;
      setSelectedDate(dd);
    }
    onAdd({
      text: parsed.name,
      icon: parsed.icon,
      startMin,
      durationMin: parsed.durationMin,
      dateKey,
    });
    setVoiceParsed(null);
    setVoiceText("");
  }, [onAdd]);

  const handleVoiceConfirm = useCallback(() => {
    applyVoiceParsed(voiceParsed);
  }, [voiceParsed, applyVoiceParsed]);

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

  // Generar bloques virtuales de medicamentos a partir del prop medications
  const medicationBlocks = useMemo(() => {
    if (!medications || !Array.isArray(medications) || medications.length === 0) return [];
    const blocks = [];
    for (const med of medications) {
      if (med.active === false) continue;
      for (const time of med.doseTimes || []) {
        const [hh, mm] = (time || "08:00").split(":").map(Number);
        blocks.push({
          id: `med_${med.id}_${time}`,
          text: med.name || "Medicamento",
          name: med.name || "Medicamento",
          icon: "💊",
          startMin: (hh || 0) * 60 + (mm || 0),
          durationMin: 5,
          isMedication: true, // flag para UI: no editable, no borrable
          medicationId: med.id,
          doseTime: time,
        });
      }
    }
    return blocks;
  }, [medications]);

  // Bloques del día seleccionado + medicamentos virtuales, ordenados por hora
  const dayBlocks = useMemo(() => {
    const manual = scheduleBlocksForDay(scheduleState, selectedDate);
    // Los medicamentos se muestran todos los días (son diarios)
    const all = [...manual, ...medicationBlocks];
    return all.sort((a, b) => a.startMin - b.startMin);
  }, [scheduleState, selectedDate, medicationBlocks]);

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
      text: newName.trim(),
      icon: "📋",
      startMin: newStartHour * 60 + newStartMinute,
      durationMin: newDuration,
    });
    setNewName("");
    setAddingNew(false);
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
        text: b.name,
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
            background: nextBlock.isMedication
              ? `linear-gradient(135deg, #7C4DFF, ${tint("#7C4DFF", 0.7)})`
              : `linear-gradient(135deg, ${guessCategoryColor(nextBlock)}, ${tint(guessCategoryColor(nextBlock), 0.7)})`,
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
              <div style={{ fontSize: "16px", fontWeight: 700, color: "white" }}>{nextBlock.text || nextBlock.name}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>
                {nextBlock.startMin != null ? formatMinutesAsTime(nextBlock.startMin) : (labels.pendingToday || "Pendiente de hoy")}
              </div>
            </div>
          </div>
          {nextBlock.isMedication ? (
            <div style={{
              marginTop: "14px",
              width: "100%",
              background: "rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.9)",
              fontSize: "12px",
              fontWeight: 500,
              padding: "8px",
              borderRadius: "12px",
              textAlign: "center",
            }}>
              💊 {labels.medHeroHint || "Regístralo en tu módulo de medicamentos"}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* ===== LISTA DE BLOQUES Ó SUGERIDOS ===== */}
      {dayBlocks.length === 0 ? (
        /* ---- Estado vacío: sugerencias rápidas ---- */
        <div>
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
              {labels.buildYourDay || "Tu agenda del día"}
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

            {/* Medicamentos del día (automáticos del módulo de medicamentos) */}
            {medicationBlocks.length > 0 && (
              <div style={{
                background: `${tint(accent, 0.08)}`,
                borderRadius: "14px",
                padding: "12px 14px",
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: accent, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>💊</span>
                  <span>{labels.autoMedications || "Tus medicamentos de hoy"}</span>
                </div>
                {medicationBlocks.map((mb) => (
                  <div key={mb.id} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "6px 0",
                    borderBottom: `1px solid ${tint(accent, 0.08)}`,
                  }}>
                    <span style={{ fontSize: "16px" }}>💊</span>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: C.text, flex: 1 }}>{mb.text}</span>
                    <span style={{ fontSize: "11px", color: C.textMuted }}>{formatMinutesAsTime(mb.startMin)}</span>
                  </div>
                ))}
                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "6px", textAlign: "center" }}>
                  {labels.autoMedicationsHint || "Se agregan automáticamente desde tu módulo de medicamentos"}
                </div>
              </div>
            )}

            {/* Mensaje de estado vacío para pendientes */}
            <div style={{
              textAlign: "center",
              padding: "16px 12px",
              background: C.surface,
              borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📌</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                {labels.emptyPendientes || "¿Tienes pendientes externos?"}
              </div>
              <div style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.4 }}>
                {labels.emptyPendientesHint || "Agrega citas, mandados o compromisos. Usa el micrófono para decirlo con voz."}
              </div>
            </div>

            {/* Botón principal de voz — grande y destacado */}
            {SpeechRecognitionAPI && (
              <button
                onClick={voiceListening ? stopVoice : startVoice}
                style={{
                  width: "100%",
                  background: voiceListening
                    ? `linear-gradient(135deg, #E53935, #FF5252)`
                    : `linear-gradient(135deg, ${accent}, ${tint(accent, 0.7)})`,
                  border: "none",
                  borderRadius: "16px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: voiceListening
                    ? "0 4px 16px rgba(229,57,53,0.3)"
                    : `0 4px 16px ${tint(accent, 0.25)}`,
                  animation: voiceListening ? "anro-pulse 1.5s ease-in-out infinite" : "none",
                  transition: "all 0.3s ease",
                }}
                aria-label={labels.voiceAdd || "Agregar con voz"}
              >
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Mic size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>
                    {voiceListening
                      ? (labels.voiceListening || "Escuchando...")
                      : (labels.voiceCTA || "Dicta tu pendiente")}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
                    {voiceListening
                      ? (labels.voiceTapStop || "Toca para detener")
                      : (labels.voiceHint || "\"Cita con el dentista el viernes a las 4\"")}
                  </div>
                </div>
                {voiceListening && (
                  <div style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#fff",
                    animation: "anro-pulse 1s ease-in-out infinite",
                    flexShrink: 0,
                  }} />
                )}
              </button>
            )}

            {/* Botón secundario: crear bloque manual */}
            <button
              onClick={() => setAddingNew(true)}
              style={{
                width: "100%",
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
              {labels.customBlock || "Escribir manualmente"}
            </button>

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
                        ? formatMinutesAsTime(voiceParsed.startMin)
                        : (labels.pendingToday || "Pendiente de hoy")}
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
            const catColor = block.isMedication ? "#7C4DFF" : guessCategoryColor(block);

            // No mostrar el hero de nuevo como tarjeta normal
            if (isNext && isToday) return null;

            return (
              <div
                key={block.id}
                style={{
                  background: block.isMedication ? `${tint("#7C4DFF", 0.06)}` : C.surface,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  opacity: isDone ? 0.6 : (isToday && block.startMin < nowMinutes && !isDone ? 0.8 : 1),
                  transition: "all 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  borderLeft: block.isMedication ? "3px solid #7C4DFF" : "none",
                }}
              >
                {/* Check circle / Med icon */}
                {block.isMedication ? (
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: `${tint("#7C4DFF", 0.12)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: "18px",
                  }}>
                    💊
                  </div>
                ) : (
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
                )}

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
                    {block.text || block.name}
                  </div>
                  <div style={{ fontSize: "11px", color: block.isMedication ? "#7C4DFF" : (isDone ? "#22c55e" : C.textMuted), fontWeight: block.isMedication ? 600 : (isDone ? 500 : 400), marginTop: "1px" }}>
                    {block.startMin != null ? formatMinutesAsTime(block.startMin) : (labels.pendingToday || "Pendiente de hoy")}
                    {block.isMedication ? ` · ${labels.autoLabel || "Automático"}` : ""}
                    {isDone && !block.isMedication ? ` · ${labels.completedLabel || "Completado"}` : ""}
                  </div>
                </div>

                {/* Color accent bar */}
                <div style={{ width: "4px", height: "28px", borderRadius: "2px", background: catColor, flexShrink: 0 }} />

                {/* Delete — solo para bloques manuales, NO medicamentos */}
                {!block.isMedication && (
                  <button
                    onClick={() => onRemove(block.id)}
                    aria-label={labels.deleteBlockTitle || "Eliminar bloque"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: "4px", display: "flex", opacity: 0.4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
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
            placeholder={labels.newBlockPlaceholder || "Tu pendiente (ej. Cita con el dentista)..."}
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
        /* Botones para agregar otro bloque: voz (principal) + manual */
        dayBlocks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
            {/* Botón de voz — prominente */}
            {SpeechRecognitionAPI && (
              <button
                onClick={voiceListening ? stopVoice : startVoice}
                style={{
                  width: "100%",
                  background: voiceListening
                    ? `linear-gradient(135deg, #E53935, #FF5252)`
                    : `linear-gradient(135deg, ${accent}, ${tint(accent, 0.7)})`,
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: voiceListening
                    ? "0 3px 12px rgba(229,57,53,0.25)"
                    : `0 3px 12px ${tint(accent, 0.2)}`,
                  animation: voiceListening ? "anro-pulse 1.5s ease-in-out infinite" : "none",
                  transition: "all 0.3s ease",
                }}
                aria-label={labels.voiceAdd || "Agregar con voz"}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Mic size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>
                    {voiceListening
                      ? (labels.voiceListening || "Escuchando...")
                      : (labels.voiceCTA || "Dicta tu pendiente")}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "1px" }}>
                    {voiceListening
                      ? (labels.voiceTapStop || "Toca para detener")
                      : (labels.voiceHintShort || "\"Ir al banco mañana a las 10\"")}
                  </div>
                </div>
                {voiceListening && (
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fff", animation: "anro-pulse 1s ease-in-out infinite", flexShrink: 0 }} />
                )}
              </button>
            )}
            {/* Botón manual — secundario */}
            <button
              onClick={() => setAddingNew(true)}
              style={{
                width: "100%",
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
                {voiceParsed.startMin != null ? formatMinutesAsTime(voiceParsed.startMin) : (labels.pendingToday || "Pendiente de hoy")}
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

      {/* (Ideas rápidas eliminadas en v16 — la agenda solo es para pendientes externos) */}
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
