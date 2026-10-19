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
import { programStatus } from "./cbtProgram";
import { pendingHabits } from "./weeklyInsights";

// steps: array de pasos del desglosador (forma: {id, text, min, done})
// moodLog, cbtProgram, habits: mismas formas que ya usa el resto de la app
export function buildTodayItems({ steps, moodLog, cbtProgram, habits, now = new Date() } = {}) {
  const items = [];

  const pendingSteps = (steps || []).filter((s) => !s.done);
  if (pendingSteps.length > 0) {
    items.push({
      id: "steps",
      sectionRef: "desglosador",
      label:
        pendingSteps.length === 1
          ? "1 paso pendiente del desglosador"
          : `${pendingSteps.length} pasos pendientes del desglosador`,
      detail: pendingSteps[0].text,
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
