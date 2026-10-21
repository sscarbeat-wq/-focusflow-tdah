// Seguimiento de medicamentos — lógica pura, sin dependencias externas.
// Dos piezas separadas, igual que streak.js/moodLog.js:
//   1) la LISTA de medicamentos que la persona toma (nombre + horarios + notas
//      generales), que ella misma agrega/quita;
//   2) el HISTORIAL de dosis por día (qué se marcó como tomada, a qué hora,
//      con qué nota de efecto secundario si la hubo).
// Reutiliza todayKey() de streak.js para que el día coincida exactamente con
// el resto de la app (ánimo, racha, energía) y con api/send-reminders.js del
// lado del servidor (mismo cálculo de "hoy").
import { todayKey } from "./streak.js";

export const DEFAULT_MEDICATIONS = [];
export const DEFAULT_MEDICATION_DOSE_LOG = {};

// Valida "HH:MM" en formato de 24 horas — lo único que guardamos de horario,
// nunca un objeto Date (evita líos de zona horaria entre dispositivo y cron).
export function isValidDoseTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

// Agrega un medicamento nuevo a la lista. doseTimes: array de "HH:MM"
// (se filtran los inválidos y se ordenan). notes: texto libre opcional
// (ej. "para la presión", instrucciones del médico).
export function addMedication(list, { name, doseTimes, notes } = {}) {
  const cleanName = String(name || "").trim().slice(0, 80);
  if (!cleanName) return list || [];
  const cleanTimes = [...new Set((doseTimes || []).filter(isValidDoseTime))].sort();
  if (cleanTimes.length === 0) return list || [];
  const med = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    name: cleanName,
    doseTimes: cleanTimes,
    notes: String(notes || "").trim().slice(0, 200),
    active: true,
  };
  return [...(list || []), med];
}

export function removeMedication(list, id) {
  return (list || []).filter((m) => m.id !== id);
}

// Todas las dosis de HOY que corresponden a medicamentos activos, en forma
// plana — una entrada por cada combinación medicamento+horario. Es la base
// tanto para la UI ("dosis de hoy") como para el cron de recordatorios.
export function todayDoses(medications, now = new Date()) {
  const out = [];
  for (const med of medications || []) {
    if (med.active === false) continue;
    for (const time of med.doseTimes || []) {
      out.push({ medicationId: med.id, medicationName: med.name, time });
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

// ¿Ya se marcó como tomada esta dosis exacta (medicamento+horario) hoy?
export function doseTaken(doseLog, medicationId, time, now = new Date()) {
  const key = todayKey(now);
  const entries = (doseLog || {})[key] || [];
  return entries.some((e) => e.medicationId === medicationId && e.time === time);
}

// Marca una dosis como tomada hoy. note: efecto secundario u observación
// opcional en el momento de tomarla (texto libre, nunca se manda a ninguna
// IA — solo se guarda para que la persona y, si quiere, su médico la vean).
export function logDose(doseLog, medicationId, time, note = "", now = new Date()) {
  const key = todayKey(now);
  const prevEntries = (doseLog || {})[key] || [];
  if (prevEntries.some((e) => e.medicationId === medicationId && e.time === time)) {
    return doseLog || {}; // ya estaba registrada — no duplicar
  }
  const entry = {
    medicationId,
    time,
    note: String(note || "").trim().slice(0, 200),
    takenAt: now.toISOString(),
  };
  return {
    ...(doseLog || {}),
    [key]: [...prevEntries, entry],
  };
}

// Quita el registro de una dosis de hoy (por si se marcó por error).
export function undoDose(doseLog, medicationId, time, now = new Date()) {
  const key = todayKey(now);
  const entries = (doseLog || {})[key] || [];
  return {
    ...(doseLog || {}),
    [key]: entries.filter((e) => !(e.medicationId === medicationId && e.time === time)),
  };
}

// Últimos `days` días de historial (el más antiguo primero), pensado para
// una tira visual simple: por cada día, cuántas dosis se tomaron de las que
// tocaban, y las notas de efectos secundarios de ese día (si hay).
export function recentDoseHistory(medications, doseLog, days = 7, now = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    const expected = todayDoses(medications, d).length;
    const entries = (doseLog || {})[key] || [];
    const notes = entries.filter((e) => e.note).map((e) => e.note);
    out.push({ date: key, taken: entries.length, expected, notes });
  }
  return out;
}

// Resumen de apego POR medicamento en los últimos `days` días — a
// diferencia de recentDoseHistory() (que junta todos los medicamentos en
// un solo número por día), esto separa cada medicamento activo con su
// propio porcentaje y sus propias notas de efecto secundario. Pensado para
// el Reporte para tu consulta: nunca inventa un efecto secundario, solo
// junta las notas que la persona ya escribió al marcar una dosis como
// tomada.
export function medicationAdherenceSummary(medications, doseLog, days = 14, now = new Date()) {
  const active = (medications || []).filter((m) => m.active !== false);
  return active.map((med) => {
    let expected = 0;
    let taken = 0;
    const sideEffectNotes = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      expected += (med.doseTimes || []).length;
      const entries = (doseLog || {})[key] || [];
      const medEntries = entries.filter((e) => e.medicationId === med.id);
      taken += medEntries.length;
      for (const e of medEntries) {
        if (e.note) sideEffectNotes.push({ date: key, note: e.note });
      }
    }
    sideEffectNotes.sort((a, b) => (a.date < b.date ? 1 : -1)); // más reciente primero
    return {
      id: med.id,
      name: med.name,
      expected,
      taken,
      adherencePercent: expected > 0 ? Math.round((taken / expected) * 100) : null,
      sideEffectNotes,
    };
  });
}
