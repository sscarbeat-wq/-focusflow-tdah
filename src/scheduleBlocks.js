// "Agenda visual interactiva" — Módulo 2 de ANRO TDAH 2.0 (el último de los
// 5, y el más complejo según el plan). Un plan del día armado con bloques
// de tiempo que se pueden arrastrar para cambiar su hora, con detección de
// choques entre ellos — inspirado en Tiimo/Structured, mismo público que
// ya motivó Rutinas (Módulo 5) y la pantalla de Inicio (Módulo 1).
//
// Decisión de alcance importante (documentada también en el plan del
// proyecto, claude/anro-tdah-2.0-plan-de-accion.md): esta agenda vive SOLO
// dentro de la app por ahora, sin sincronizarse con Google Calendar. La
// integración existente (calendarSync.js + api/calendar/create-event) solo
// puede CREAR eventos, nunca actualizarlos ni borrarlos — empujar cada
// arrastre de un bloque ahí duplicaría eventos sin control, y no hay forma
// de probar en vivo un flujo de OAuth nuevo dentro de esta sesión. El Modo
// Enfoque y el desglosador SIGUEN agendando en Google exactamente igual
// que antes, sin ningún cambio.
//
// Mismo patrón de lógica pura que oneThing.js/routines.js: sin DOM, sin
// efectos secundarios, fácil de probar con Node, pensado para guardarse
// como una llave más dentro del mismo JSON de progreso (ver la decisión de
// arquitectura del plan — nunca se migró a tablas relacionales).
//
// state: { blocks: [{ id, date /* "YYYY-MM-DD", mismo formato que
// todayKey() */, text, icon, startMin /* minutos desde medianoche,
// 0-1439 */, durationMin }] }
import { todayKey } from "./streak";

export const DEFAULT_SCHEDULE_BLOCKS = { blocks: [] };

export const MAX_BLOCKS_PER_DAY = 16;
export const MIN_DURATION_MIN = 5;
export const MAX_DURATION_MIN = 240;
export const DEFAULT_DURATION_MIN = 30;
// Minutos a los que se redondea un bloque al soltarlo (arrastrar) — mismo
// espíritu que los eventos de Google Calendar, que también se manejan en
// bloques "limpios" de 5 minutos.
export const SNAP_MIN = 5;
// Cuántos días de historial se conservan — igual de espíritu que los 30
// registros de completions.slice(0,30) en routines.js: no crecer sin
// límite, pero sin borrar el plan de ayer de golpe.
const KEEP_DAYS = 14;

function clean(state) {
  return { ...DEFAULT_SCHEDULE_BLOCKS, ...(state || {}) };
}

function newId() {
  return Date.now() + Math.random().toString(36).slice(2, 7);
}

export function clampStartMin(min) {
  const n = Number(min);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1439, Math.max(0, Math.round(n)));
}

export function clampDurationMin(min) {
  const n = Number(min);
  if (!Number.isFinite(n)) return DEFAULT_DURATION_MIN;
  return Math.min(MAX_DURATION_MIN, Math.max(MIN_DURATION_MIN, Math.round(n)));
}

export function snapToGrid(min) {
  return clampStartMin(Math.round(clampStartMin(min) / SNAP_MIN) * SNAP_MIN);
}

function pruneOld(blocks, now) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const cutoffKey = todayKey(cutoff);
  return blocks.filter((b) => b.date >= cutoffKey);
}

// `dateKey` (Fase 2E, vista semanal, 29 de octubre de 2026) permite agregar
// el bloque a un día que NO sea necesariamente "hoy" — sin ese parámetro el
// comportamiento es idéntico al de siempre (el bloque cae en el día de
// `now`), así que ningún llamador existente necesitó cambiar.
export function addScheduleBlock(state, { text, icon, startMin, durationMin, dateKey } = {}, now = new Date()) {
  const s = clean(state);
  const cleanText = String(text || "").trim().slice(0, 80);
  if (!cleanText) return s;
  const targetDateKey = dateKey || todayKey(now);
  const todayCount = s.blocks.filter((b) => b.date === targetDateKey).length;
  if (todayCount >= MAX_BLOCKS_PER_DAY) return s;
  const block = {
    id: newId(),
    date: targetDateKey,
    text: cleanText,
    icon: icon || "🗓️",
    startMin: clampStartMin(startMin ?? 9 * 60),
    durationMin: clampDurationMin(durationMin ?? DEFAULT_DURATION_MIN),
  };
  return { ...s, blocks: pruneOld([...s.blocks, block], now) };
}

export function removeScheduleBlock(state, blockId) {
  const s = clean(state);
  return { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) };
}

export function updateScheduleBlock(state, blockId, { text, icon, durationMin } = {}) {
  const s = clean(state);
  return {
    ...s,
    blocks: s.blocks.map((b) => {
      if (b.id !== blockId) return b;
      const cleanText = text !== undefined ? String(text || "").trim().slice(0, 80) : b.text;
      return {
        ...b,
        text: cleanText || b.text,
        icon: icon || b.icon,
        durationMin: durationMin !== undefined ? clampDurationMin(durationMin) : b.durationMin,
      };
    }),
  };
}

// Mover un bloque a una nueva hora — arrastrar y soltar, o el selector de
// hora accesible del formulario de edición usan exactamente esta misma
// función, para que ambos caminos terminen en el mismo estado válido
// (redondeado a 5 minutos, nunca fuera del día).
export function moveScheduleBlock(state, blockId, newStartMin) {
  const s = clean(state);
  const snapped = snapToGrid(newStartMin);
  return {
    ...s,
    blocks: s.blocks.map((b) => (b.id === blockId ? { ...b, startMin: snapped } : b)),
  };
}

// Bloques de un día cualquiera, dado su "YYYY-MM-DD" directamente — la
// pieza que faltaba para la vista semanal (Fase 2E), que necesita pedir los
// bloques de 7 días distintos, no solo los de "ahora mismo".
export function scheduleBlocksForDate(state, dateKey) {
  const s = clean(state);
  return s.blocks.filter((b) => b.date === dateKey).sort((a, b) => a.startMin - b.startMin);
}

export function scheduleBlocksForDay(state, now = new Date()) {
  return scheduleBlocksForDate(state, todayKey(now));
}

// Lunes (00:00 local) de la semana que contiene `now` — semana lunes a
// domingo, igual que el resto de calendarios en español/portugués/francés;
// en inglés EE.UU. suele empezar en domingo, pero una sola convención fija
// es más simple de razonar y de probar que una por idioma, y "ver mi semana
// completa" no depende de en qué día empiece la columna.
export function startOfWeek(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 = domingo ... 6 = sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

// Los 7 "YYYY-MM-DD" (lunes a domingo) de la semana que contiene `now`.
export function weekDateKeys(now = new Date()) {
  const monday = startOfWeek(now);
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    keys.push(todayKey(d));
  }
  return keys;
}

// Bloques de los 7 días de la semana de `now`, agrupados por fecha — ya
// ordenados dentro de cada día, listos para pintar la vista semanal sin que
// el componente tenga que repetir el filtrado/orden día por día.
export function scheduleBlocksForWeek(state, now = new Date()) {
  const keys = weekDateKeys(now);
  const byDate = {};
  keys.forEach((k) => {
    byDate[k] = scheduleBlocksForDate(state, k);
  });
  return { keys, byDate };
}

// Ids de los bloques que chocan con al menos otro, dentro de la misma
// lista de un solo día — comparación par a par, nada inventado: dos
// bloques chocan si uno empieza antes de que el otro termine Y
// viceversa. Nunca impide mover ni guardar un bloque — solo avisa (mismo
// principio "sin culpa" del resto de la app: la paciente decide qué hacer
// con el choque, Senda solo lo hace visible).
export function detectConflicts(blocks) {
  const conflicted = new Set();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      const aEnd = a.startMin + a.durationMin;
      const bEnd = b.startMin + b.durationMin;
      if (a.startMin < bEnd && b.startMin < aEnd) {
        conflicted.add(a.id);
        conflicted.add(b.id);
      }
    }
  }
  return conflicted;
}

// "9:30" a partir de minutos desde medianoche — para pintar la hora de
// cada bloque y la línea de "ahora".
export function formatMinutesAsTime(min) {
  const m = clampStartMin(min);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// "09:30" (input type="time") -> minutos desde medianoche, o null si el
// valor no tiene ese formato (el navegador ya valida esto, esto es solo
// una red de seguridad).
export function parseTimeInputToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}
