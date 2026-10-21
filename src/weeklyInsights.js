// Utilidades de insights semanales — puras, sin dependencias externas.
// Se construyen 100% a partir de datos que la app ya guarda (ánimo, tarro
// de logros, racha): no agregan ningún costo ni dependencia nueva.
import { recentEntries } from "./moodLog";
import { recentBedtimes, isLateBedtime } from "./sleepLog";

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

// Hábitos de autocuidado que están APAGADOS ahora mismo. Estos interruptores
// todavía no se reinician cada día, así que no podemos decir "qué días los
// cumpliste" — solo mostramos el estado actual como un empujón suave, nunca
// como una racha semanal que la app no puede respaldar con datos reales.
export const HABIT_LABELS = [
  { key: "screensOff", label: "Apagar pantallas a tiempo" },
  { key: "sleepEnv", label: "Preparar el entorno para dormir" },
  { key: "ateWell", label: "Comer algo nutritivo" },
  { key: "hydrated", label: "Hidratarte durante el día" },
  { key: "deskCleared", label: "Ordenar el escritorio" },
];

export function pendingHabits(habits = {}) {
  return HABIT_LABELS.filter(({ key }) => !habits[key]);
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
  };
}
