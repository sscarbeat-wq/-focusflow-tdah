// "Hoy" — junta en una sola lista lo que de verdad está pendiente ahora
// mismo, usando solo datos que la app ya tiene guardados (pasos del
// desglosador, ánimo de hoy, hábitos de estilo de vida, programa de TCC) —
// mismo principio que weeklyInsights.js: nunca inventa un pendiente que la
// app no pueda respaldar con datos reales. No agrega ninguna fuente de
// datos nueva ni ninguna llamada a IA.
//
// Inspirado en la vista de "hoy"/línea de tiempo diaria que tienen Tiimo,
// Structured y Sunsama — de lo más mencionado en reseñas de por qué la
// gente con TDAH las prefiere sobre varios paneles sueltos: un solo lugar
// que responde "¿qué me falta AHORA?", en vez de tener que revisar panel
// por panel para enterarte.
import { todayEntry } from "./moodLog";
import { todayEnergyEntry } from "./energyLog";
import { todayDoses, doseTaken } from "./medicationLog";
import { paymentsDueSoon } from "./paymentsLog";
import { programStatus } from "./cbtProgram";
import { pendingHabits } from "./weeklyInsights";
import { oldForgottenNote } from "./quickCapture";

// Traducciones por defecto (español) para quien llame a esta función sin
// pasar `t` — mismo patrón de respaldo que distractionTracker.js, para que
// la función siga siendo útil fuera de React/sin idioma seleccionado.
const DEFAULT_TODAY_T = {
  today: {
    stepsPending: (n) => (n === 1 ? "1 paso pendiente del desglosador" : `${n} pasos pendientes del desglosador`),
    stepSuggested: (text) => `Sugerido para tu energía de hoy: ${text}`,
    moodNotLogged: "Todavía no registras cómo te sientes hoy",
    energyNotLogged: "Todavía no registras tu energía de hoy",
    medicationPending: (n) => (n === 1 ? "1 dosis de medicamento pendiente hoy" : `${n} dosis de medicamento pendientes hoy`),
    medicationDetail: (time, name) => `${time} — ${name}`,
    paymentsPending: (n) => (n === 1 ? "1 pago por vencer" : `${n} pagos por vencer`),
    paymentDetail: (name, amountPart, whenPart) => `${name}${amountPart} (${whenPart})`,
    paymentDueToday: "hoy",
    paymentDueInDays: (n) => `en ${n} día${n === 1 ? "" : "s"}`,
    cbtNewLesson: "Nueva lección del programa de TCC disponible",
    habitsPending: (n) => (n === 1 ? "1 hábito de autocuidado pendiente" : `${n} hábitos de autocuidado pendientes`),
    quickNoteReturned: "Una nota de hace unos días volvió a aparecer",
  },
  weeklyInsights: {
    habitLabels: {
      screensOff: "Apagar pantallas a tiempo",
      sleepEnv: "Preparar el entorno para dormir",
      ateWell: "Comer algo nutritivo",
      hydrated: "Hidratarte durante el día",
      deskCleared: "Ordenar el escritorio",
    },
  },
};

// steps: array de pasos del desglosador (forma: {id, text, min, done,
// energy?}) — energy es opcional ("baja"/"media"/"alta"), solo en pasos
// agregados a mano.
// moodLog, cbtProgram, habits: mismas formas que ya usa el resto de la app.
// energyLog: mismo patrón que moodLog, para el check-in de energía.
// medications, medicationDoseLog: mismas formas que usa MedicationPanel.
// t: objeto de traducciones completo (de src/i18n.js) — opcional, cae a
// español si no se pasa.
export function buildTodayItems({
  steps,
  moodLog,
  energyLog,
  medications,
  medicationDoseLog,
  payments,
  paymentPaidLog,
  cbtProgram,
  habits,
  quickNotes,
  now = new Date(),
  t = DEFAULT_TODAY_T,
} = {}) {
  const items = [];

  const pendingSteps = (steps || []).filter((s) => !s.done);
  if (pendingSteps.length > 0) {
    // Si ya registró su energía de hoy, sugerimos primero el paso pendiente
    // que coincide con ese nivel (si hay alguno etiquetado) — nunca
    // escondemos los demás, solo cambiamos cuál se muestra como sugerencia.
    const energyToday = todayEnergyEntry(energyLog, now);
    const matching = energyToday ? pendingSteps.find((s) => s.energy === energyToday.level) : null;
    const suggested = matching || pendingSteps[0];
    items.push({
      id: "steps",
      sectionRef: "desglosador",
      label: t.today.stepsPending(pendingSteps.length),
      detail: matching ? t.today.stepSuggested(suggested.text) : suggested.text,
    });
  }

  if (!todayEntry(moodLog, now)) {
    items.push({
      id: "mood",
      sectionRef: "mood",
      label: t.today.moodNotLogged,
      detail: null,
    });
  }

  if (!todayEnergyEntry(energyLog, now)) {
    items.push({
      id: "energy",
      sectionRef: "energy",
      label: t.today.energyNotLogged,
      detail: null,
    });
  }

  const pendingDoses = todayDoses(medications, now).filter(
    (d) => !doseTaken(medicationDoseLog, d.medicationId, d.time, now)
  );
  if (pendingDoses.length > 0) {
    items.push({
      id: "medication",
      sectionRef: "medication",
      label: t.today.medicationPending(pendingDoses.length),
      detail: t.today.medicationDetail(pendingDoses[0].time, pendingDoses[0].medicationName),
    });
  }

  const duePayments = paymentsDueSoon(payments, paymentPaidLog, now);
  if (duePayments.length > 0) {
    const first = duePayments[0];
    items.push({
      id: "payments",
      sectionRef: "payments",
      label: t.today.paymentsPending(duePayments.length),
      detail: t.today.paymentDetail(
        first.name,
        first.amount ? ` — ${first.amount}` : "",
        first.daysUntil === 0 ? t.today.paymentDueToday : t.today.paymentDueInDays(first.daysUntil)
      ),
    });
  }

  const cbt = programStatus(cbtProgram, now);
  if (!cbt.finished && cbt.availableNow && cbt.nextLesson) {
    items.push({
      id: "cbt",
      sectionRef: "cbt",
      label: t.today.cbtNewLesson,
      detail: cbt.nextLesson.title,
    });
  }

  const pending = pendingHabits(habits);
  if (pending.length > 0) {
    items.push({
      id: "habits",
      sectionRef: "habits",
      label: t.today.habitsPending(pending.length),
      detail: pending.map((h) => t.weeklyInsights.habitLabels[h.key] || h.label).join(", "),
    });
  }

  // "El Regreso" de Eco: una nota de Captura rápida que lleva varios días
  // sin resolverse resurge aquí sola, en vez de quedarse enterrada en una
  // lista que nadie vuelve a revisar.
  const forgotten = oldForgottenNote(quickNotes, now);
  if (forgotten) {
    items.push({
      id: "quicknote",
      sectionRef: "quickCapture",
      label: t.today.quickNoteReturned,
      detail: forgotten.text,
    });
  }

  return items;
}
