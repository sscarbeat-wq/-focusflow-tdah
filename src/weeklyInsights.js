// Utilidades de insights semanales — puras, sin dependencias externas.
// Se construyen 100% a partir de datos que la app ya guarda (ánimo, tarro
// de logros, racha): no agregan ningún costo ni dependencia nueva.
import { recentEntries } from "./moodLog";
import { recentBedtimes, isLateBedtime, sleepDurationSummary } from "./sleepLog";
import { recentFocusSessions } from "./focusSessionLog";

// Resumen del ánimo de los últimos `days` días (por defecto 7), apoyado en
// recentEntries() de moodLog.js — esa función ya rellena los días sin
// registro con entry:null, así que nunca inventamos un ánimo que el
// paciente no registró; solo resumimos lo que sí hay.
export function weekMoodSummary(moodLog, days = 7, now = new Date()) {
  const entries = recentEntries(moodLog, days, now);
  const logged = entries.filter((e) => e.entry);
  if (logged.length === 0) {
    return { entries, loggedDays: 0, average: null, bestDay: null, worstDay: null };
  }
  const average = Math.round((logged.reduce((sum, e) => sum + e.entry.mood, 0) / logged.length) * 10) / 10;
  const bestDay = logged.reduce((a, b) => (b.entry.mood > a.entry.mood ? b : a));
  const worstDay = logged.reduce((a, b) => (b.entry.mood < a.entry.mood ? b : a));
  return { entries, loggedDays: logged.length, average, bestDay, worstDay };
}

// Logros del tarro (jar) que cayeron dentro de los últimos `days` días. El
// id de cada logro es Date.now() en el momento en que se ganó, así que es
// una marca de tiempo real — pero el tarro solo guarda los últimos 12, así
// que en una semana muy activa puede no alcanzar a cubrir los 7 días
// completos. `capped` avisa que puede haber más logros de los que se
// muestran (si no, estaríamos subestimando sin decirlo).
export function weekAchievements(jar, days = 7, now = new Date()) {
  const cutoff = now.getTime() - days * 86400000;
  const list = jar || [];
  const inWindow = list.filter((j) => typeof j.id === "number" && j.id >= cutoff);
  return {
    count: inWindow.length,
    items: inWindow,
    capped: list.length >= 12 && inWindow.length === list.length,
  };
}

// Hábitos de autocuidado que están APAGADOS ahora mismo. Desde el 11 de
// noviembre de 2026 las palomitas sí se reinician cada día (ver
// customHabits.js), pero no se guarda historial por día: no podemos decir
// "qué días los cumpliste" — solo mostramos el estado de hoy como un
// empujón suave, nunca como una racha semanal que la app no puede
// respaldar con datos reales.
export const HABIT_LABELS = [
  { key: "screensOff", label: "Apagar pantallas a tiempo" },
  { key: "sleepEnv", label: "Preparar el cuarto para dormir" },
  { key: "ateWell", label: "Comer algo nutritivo" },
  { key: "hydrated", label: "Hidratarte durante el día" },
  { key: "deskCleared", label: "Ordenar el escritorio" },
];

// `habits.custom`: los hábitos que la paciente agregó (customHabits.js) —
// los que no ha palomeado hoy también cuentan como pendientes, con el
// nombre que ella les puso.
export function pendingHabits(habits = {}) {
  const fixed = HABIT_LABELS.filter(({ key }) => !habits[key]);
  const custom = (Array.isArray(habits.custom) ? habits.custom : [])
    .filter((h) => h && !h.done)
    .map((h) => ({ key: `custom-${h.id}`, label: h.label }));
  return [...fixed, ...custom];
}

// Patrón de hora de dormir tardía en los últimos `days` días. Esto NUNCA es
// un diagnóstico — es una observación neutral armada solo con lo que la
// persona registró, para que ella (y si quiere, su médico) la tengan en
// cuenta. El umbral de "patrón" (3 de 7 noches registradas tardías) es
// arbitrario a propósito: elegido para no disparar la nota con una sola
// noche distinta de lo normal, pero sin pedir una semana completa de datos.
export const SLEEP_PATTERN_MIN_LATE_NIGHTS = 3;

export function weekSleepPattern(sleepLog, days = 7, now = new Date()) {
  const entries = recentBedtimes(sleepLog, days, now);
  const logged = entries.filter((e) => e.entry);
  const lateNights = logged.filter((e) => isLateBedtime(e.entry.time)).length;
  return {
    entries,
    loggedNights: logged.length,
    lateNights,
    isPattern: lateNights >= SLEEP_PATTERN_MIN_LATE_NIGHTS,
    // Tiempo de sueño aproximado de la semana (noches con hora de despertar).
    duration: sleepDurationSummary(sleepLog, days, now),
  };
}

// Resumen de sesiones de Modo Enfoque de los últimos `days` días (función
// #6 de Fase 4, inspirada en Pomodone) — apoyado en
// recentFocusSessions() de focusSessionLog.js, que ya rellena los días sin
// ninguna sesión con entries:[], así que aquí tampoco se inventa nada:
// solo se suma y se promedia lo que de verdad se completó.
//
// `totalDistractions` solo suma las sesiones con distractionTracked:true
// (ver el comentario en focusSessionLog.js) — una sesión completada sin el
// bloqueador de distracciones activo no cuenta como "cero distracciones",
// simplemente no entra a la suma.
export function weekFocusSummary(focusSessionLog, days = 7, now = new Date()) {
  const recent = recentFocusSessions(focusSessionLog, days, now);
  let sessionsCount = 0;
  let totalMinutes = 0;
  let totalDistractions = 0;
  let bestDay = null;

  const dailyBreakdown = recent.map(({ date, entries }) => {
    const minutes = entries.reduce((sum, e) => sum + (e.durationMin || 0), 0);
    const distractions = entries.reduce(
      (sum, e) => sum + (e.distractionTracked ? e.distractionCount || 0 : 0),
      0
    );
    sessionsCount += entries.length;
    totalMinutes += minutes;
    totalDistractions += distractions;
    if (entries.length > 0 && (bestDay === null || minutes > bestDay.minutes)) {
      bestDay = { date, minutes, sessions: entries.length };
    }
    return { date, sessions: entries.length, minutes };
  });

  return {
    dailyBreakdown,
    sessionsCount,
    totalMinutes,
    averageMinutes: sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : null,
    bestDay,
    totalDistractions,
  };
}
