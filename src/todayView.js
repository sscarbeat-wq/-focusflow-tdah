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

// steps: array de pasos del desglosador (forma: {id, text, min, done,
// energy?}) — energy es opcional ("baja"/"media"/"alta"), solo en pasos
// agregados a mano.
// moodLog, cbtProgram, habits: mismas formas que ya usa el resto de la app.
// energyLog: mismo patrón que moodLog, para el check-in de energía.
// medications, medicationDoseLog: mismas formas que usa MedicationPanel.
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
  now = new Date(),
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
      label:
        pendingSteps.length === 1
          ? "1 paso pendiente del desglosador"
          : `${pendingSteps.length} pasos pendientes del desglosador`,
      detail: matching ? `Sugerido para tu energía de hoy: ${suggested.text}` : suggested.text,
    });
  }

  if (!todayEntry(moodLog, now)) {
    items.push({
      id: "mood",
      sectionRef: "mood",
      label: "Todavía no registras cómo te sientes hoy",
      detail: null,
    });
  }

  if (!todayEnergyEntry(energyLog, now)) {
    items.push({
      id: "energy",
      sectionRef: "energy",
      label: "Todavía no registras tu energía de hoy",
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
      label:
        pendingDoses.length === 1
          ? "1 dosis de medicamento pendiente hoy"
          : `${pendingDoses.length} dosis de medicamento pendientes hoy`,
      detail: `${pendingDoses[0].time} — ${pendingDoses[0].medicationName}`,
    });
  }

  const duePayments = paymentsDueSoon(payments, paymentPaidLog, now);
  if (duePayments.length > 0) {
    const first = duePayments[0];
    items.push({
      id: "payments",
      sectionRef: "payments",
      label:
        duePayments.length === 1
          ? "1 pago por vencer"
          : `${duePayments.length} pagos por vencer`,
      detail: `${first.name}${first.amount ? ` — ${first.amount}` : ""} (${
        first.daysUntil === 0 ? "hoy" : `en ${first.daysUntil} día${first.daysUntil === 1 ? "" : "s"}`
      })`,
    });
  }

  const cbt = programStatus(cbtProgram, now);
  if (!cbt.finished && cbt.availableNow && cbt.nextLesson) {
    items.push({
      id: "cbt",
      sectionRef: "cbt",
      label: "Nueva lección del programa de TCC disponible",
      detail: cbt.nextLesson.title,
    });
  }

  const pending = pendingHabits(habits);
  if (pending.length > 0) {
    items.push({
      id: "habits",
      sectionRef: "habits",
      label:
        pending.length === 1
          ? "1 hábito de autocuidado pendiente"
          : `${pending.length} hábitos de autocuidado pendientes`,
      detail: pending.map((h) => h.label).join(", "),
    });
  }

  return items;
}
