// "Reporte para tu consulta" — junta en una sola vista lo que Senda ya
// tiene guardado, pensado para llevarlo (impreso o en pantalla) a la cita
// con el médico. 100% agregación de datos reales: no usa IA, no inventa
// nada, exactamente el mismo principio que weeklyInsights.js y
// todayView.js.
//
// Inspirado en Patrickson et al. 2024 (estudio cualitativo australiano,
// n=9 pacientes + 6 clínicos revisando prototipos de apps): los pacientes
// quieren algo simple que dispare la conversación en consulta y que
// respete su privacidad; los clínicos quieren ver patrones de un vistazo
// en vez de otra lista de datos sueltos. También responde al hallazgo de
// la encuesta de 2019 (financiada por Shire/Takeda, n=616): más del 90% de
// adultos con TDAH en tratamiento reportan que el efecto del medicamento
// "se les acaba" en la tarde/noche aunque en consulta su control se vea
// bien — lo que pasa fuera de consulta es justo lo que este reporte junta.
import { recentEntries } from "./moodLog";
import { recentEnergyEntries } from "./energyLog";
import { medicationAdherenceSummary } from "./medicationLog";
import { recentBedtimes, isLateBedtime } from "./sleepLog";
import { pendingHabits } from "./weeklyInsights";
import { weekImpulseBrakeCounts } from "./impulseBrakeLog";

// 14 días en vez de los 7 que usan los Insights semanales: para una
// consulta (normalmente cada varias semanas o meses) una ventana más larga
// da un panorama más representativo que solo la última semana.
export const CLINICAL_REPORT_DAYS = 14;

export function buildClinicalReport({
  moodLog,
  energyLog,
  medications,
  medicationDoseLog,
  habits,
  streak,
  sleepLog,
  impulseBrakeLog,
  days = CLINICAL_REPORT_DAYS,
  now = new Date(),
} = {}) {
  const moodEntries = recentEntries(moodLog, days, now);
  const loggedMood = moodEntries.filter((e) => e.entry);
  const moodAverage =
    loggedMood.length > 0
      ? Math.round((loggedMood.reduce((sum, e) => sum + e.entry.mood, 0) / loggedMood.length) * 10) / 10
      : null;

  const energyEntries = recentEnergyEntries(energyLog, days, now);
  const loggedEnergy = energyEntries.filter((e) => e.entry);
  const energyLevelCounts = { baja: 0, media: 0, alta: 0 };
  for (const e of loggedEnergy) {
    if (energyLevelCounts[e.entry.level] != null) energyLevelCounts[e.entry.level] += 1;
  }

  const medicationSummaries = medicationAdherenceSummary(medications, medicationDoseLog, days, now);

  const sleepEntries = recentBedtimes(sleepLog, days, now);
  const loggedSleep = sleepEntries.filter((e) => e.entry);
  const lateNights = loggedSleep.filter((e) => isLateBedtime(e.entry.time)).length;

  const impulseBrake = weekImpulseBrakeCounts(impulseBrakeLog, days, now);

  return {
    rangeDays: days,
    generatedAt: now.toISOString(),
    mood: {
      loggedDays: loggedMood.length,
      totalDays: days,
      average: moodAverage,
    },
    energy: {
      loggedDays: loggedEnergy.length,
      totalDays: days,
      levelCounts: energyLevelCounts,
    },
    medications: medicationSummaries,
    sleep: {
      loggedNights: loggedSleep.length,
      totalDays: days,
      lateNights,
    },
    streak: { current: streak?.current ?? 0, longest: streak?.longest ?? 0 },
    pendingHabits: pendingHabits(habits).map((h) => h.label),
    impulseBrake,
  };
}
