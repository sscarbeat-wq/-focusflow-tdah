// Recordatorio de pagos/suscripciones — lógica pura, sin dependencias
// externas. Inspirado en el seguimiento de pagos recurrentes de Mint,
// pensado para el "impuesto TDAH" de cargos por pago tardío o suscripciones
// olvidadas. A propósito NO se conecta a ninguna cuenta bancaria ni API
// financiera real — es solo una lista manual que la propia persona llena
// (nombre, monto de referencia, frecuencia y día de vencimiento), igual de
// "honesta" que el resto de Senda: nunca pretende ser más de lo que es.
//
// IMPORTANTE: este archivo se importa también desde api/send-reminders.js
// (para el aviso push de pagos próximos a vencer dentro del cron diario),
// así que su propio import de streak.js debe llevar la extensión ".js"
// completa — un import relativo sin extensión funciona bien en el navegador
// (Vite lo resuelve solo) pero puede tronar el empacador de funciones
// serverless de Vercel (ver la lección del 20 de octubre en el roadmap).
import { todayKey } from "./streak.js";

export const DEFAULT_PAYMENTS = [];
export const DEFAULT_PAYMENT_PAID_LOG = {};
export const PAYMENT_FREQUENCIES = ["mensual", "anual"];

// Cuántos días antes del vencimiento (inclusive el mismo día) se considera
// "próximo a vencer" — tanto para mostrarlo en la vista "Hoy" como para el
// aviso push del cron diario.
export const PAYMENT_REMINDER_DAYS_BEFORE = 3;

export function isValidDueDay(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 31;
}

export function isValidMonth(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 12;
}

export function isValidFrequency(value) {
  return PAYMENT_FREQUENCIES.includes(value);
}

// Agrega un pago/suscripción nuevo a la lista. amount: texto libre de
// referencia (ej. "$219", "~$150") — nunca se valida como número real ni se
// conecta a ninguna cuenta, solo se muestra tal cual. dueMonth solo aplica
// (y es obligatorio) si frequency es "anual".
export function addPayment(list, { name, amount, frequency, dueDay, dueMonth, notes } = {}) {
  const cleanName = String(name || "").trim().slice(0, 80);
  if (!cleanName) return list || [];
  if (!isValidFrequency(frequency)) return list || [];
  if (!isValidDueDay(dueDay)) return list || [];
  let cleanMonth = null;
  if (frequency === "anual") {
    if (!isValidMonth(dueMonth)) return list || [];
    cleanMonth = Math.round(Number(dueMonth));
  }
  const payment = {
    id: Date.now() + Math.random().toString(36).slice(2, 7),
    name: cleanName,
    amount: String(amount || "").trim().slice(0, 40),
    frequency,
    dueDay: Math.round(Number(dueDay)),
    dueMonth: cleanMonth,
    notes: String(notes || "").trim().slice(0, 200),
    active: true,
  };
  return [...(list || []), payment];
}

export function removePayment(list, id) {
  return (list || []).filter((p) => p.id !== id);
}

function lastDayOfMonth(year, monthIndex0) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

// Clave YYYY-MM-DD para un día de vencimiento dado, "recortada" al último
// día real del mes (ej. día 31 en febrero -> 28 o 29).
function dateKeyFor(year, monthIndex0, day) {
  const clampedDay = Math.min(day, lastDayOfMonth(year, monthIndex0));
  const mm = String(monthIndex0 + 1).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// Próxima fecha de vencimiento (clave YYYY-MM-DD) de este pago, saltando
// cualquier ciclo ya marcado como pagado en paidLog (paidLog[payment.id] ===
// la clave de ese ciclo) y cualquier ciclo que ya haya pasado.
export function nextDueDateKey(payment, paidLog, now = new Date()) {
  if (!payment || payment.active === false) return null;
  if (!isValidFrequency(payment.frequency) || !isValidDueDay(payment.dueDay)) return null;
  if (payment.frequency === "anual" && !isValidMonth(payment.dueMonth)) return null;

  let year = now.getFullYear();
  let monthIndex0 = payment.frequency === "anual" ? payment.dueMonth - 1 : now.getMonth();
  let key = dateKeyFor(year, monthIndex0, payment.dueDay);
  const todayStr = todayKey(now);
  const paidKey = (paidLog || {})[payment.id];

  let safety = 0; // tope defensivo para nunca entrar en loop infinito
  while (safety < 24 && (key < todayStr || paidKey === key)) {
    if (payment.frequency === "anual") {
      year += 1;
    } else {
      monthIndex0 += 1;
      if (monthIndex0 > 11) {
        monthIndex0 = 0;
        year += 1;
      }
    }
    key = dateKeyFor(year, monthIndex0, payment.dueDay);
    safety += 1;
  }
  return key;
}

// Días completos entre hoy y una clave YYYY-MM-DD (puede ser negativo si ya
// pasó, aunque nextDueDateKey ya nunca regresa un ciclo pasado).
export function daysUntil(dateKey, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dateKey.split("-").map(Number);
  const due = new Date(y, m - 1, d);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

// Pagos activos cuyo próximo vencimiento (ya sin contar ciclos pagados) cae
// dentro de la ventana de aviso (por default, hoy o hasta 3 días antes).
// Se usa tanto en la vista "Hoy" como en el aviso push del cron diario.
export function paymentsDueSoon(payments, paidLog, now = new Date(), daysBefore = PAYMENT_REMINDER_DAYS_BEFORE) {
  const out = [];
  for (const payment of payments || []) {
    if (payment.active === false) continue;
    const dueDateKey = nextDueDateKey(payment, paidLog, now);
    if (!dueDateKey) continue;
    const diff = daysUntil(dueDateKey, now);
    if (diff >= 0 && diff <= daysBefore) {
      out.push({ ...payment, dueDateKey, daysUntil: diff });
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Marca como pagado el ciclo que corresponde a dueDateKey (normalmente el
// que ya venía de paymentsDueSoon/nextDueDateKey) — el siguiente cálculo de
// nextDueDateKey saltará directo al ciclo siguiente.
export function markPaid(paidLog, paymentId, dueDateKey) {
  return { ...(paidLog || {}), [paymentId]: dueDateKey };
}

export function unmarkPaid(paidLog, paymentId) {
  const next = { ...(paidLog || {}) };
  delete next[paymentId];
  return next;
}
