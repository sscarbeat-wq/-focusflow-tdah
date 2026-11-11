// Avisos de hábitos a lo largo del día (11 de noviembre de 2026, "quiero
// que se le manden notificaciones al paciente a lo largo del día"). Lógica
// pura: dado el progreso guardado de una persona y el momento del día,
// decide QUÉ aviso mandar (o ninguno). La usa el cron de
// api/send-reminders.js (?check=habits) — por eso todos los imports llevan
// ".js" explícito (ver la nota sobre el empacador de Vercel en ese archivo).
//
// Decisiones de la doctora:
//   - 3 avisos al día: 10 am, 3 pm y 9 pm (hora de Ciudad de México).
//   - Solo se manda si a esa hora le FALTA algo; si ya lo palomeó, nada.
// Qué toca en cada momento:
//   - morning (10 am): comer algo nutritivo + sus hábitos propios.
//   - afternoon (3 pm): tomar agua (y recuerda la pausa activa).
//   - night (9 pm): apagar pantallas + preparar el cuarto.
// Tono: una invitación corta, sin culpa ni cuentas de "llevas X sin hacer".
// La persona puede apagar solo estos avisos (progress.habitReminders ===
// false) desde Perfil → Notificaciones, sin apagar los de medicamentos.
//
// A quién NO se le manda: a quien lleva más de HABIT_REMINDER_MAX_IDLE_DAYS
// días sin abrir la app (o nunca la ha abierto con esta versión). Tres
// avisos diarios a alguien que dejó de entrar serían justo la presión que
// el resto de ANRO TDAH evita — para esas personas ya existe el aviso suave
// de reenganche ("Aquí seguimos, sin prisa"), una vez por semana.
import { habitDayKey, normalizeCustomHabits } from "./customHabits.js";
import { daysBetween } from "./streak.js";

export const HABIT_REMINDER_MAX_IDLE_DAYS = 2;

export const HABIT_REMINDER_SLOTS = ["morning", "afternoon", "night"];

// Si el cron no manda ?slot=, se deduce de la hora (mismos cortes).
export function slotForHour(hour) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
}

function joinList(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

// `now`: un Date cuyos campos "locales" ya sean la hora de la persona (el
// cron pasa mxNow(), igual que hace con scheduleBlocksForDay).
// Regresa { title, body, tag } o null si no hay nada que avisar.
export function habitReminderFor(progress, slot, now = new Date()) {
  const p = progress || {};
  if (p.habitReminders === false) return null;
  if (!HABIT_REMINDER_SLOTS.includes(slot)) return null;

  // Las palomitas guardadas solo valen si son del "día de hábitos" actual
  // (se reinician a las 4 am, ver customHabits.js); si son de otro día,
  // todo cuenta como pendiente.
  // `habitsDay` se guarda cada vez que la app guarda algo, así que también
  // dice cuándo fue la última vez que la persona la usó.
  const todayHabitDay = habitDayKey(now);
  if (typeof p.habitsDay !== "string") return null;
  const idleDays = daysBetween(p.habitsDay, todayHabitDay);
  if (!(idleDays >= 0 && idleDays <= HABIT_REMINDER_MAX_IDLE_DAYS)) return null;
  const fresh = p.habitsDay === todayHabitDay;
  const done = (key) => fresh && !!p[key];
  const custom = normalizeCustomHabits(p.customHabits).filter((h) => !(fresh && h.done));
  const tag = "anro-habitos";

  if (slot === "morning") {
    const pending = [];
    if (!done("ateWell")) pending.push("comer algo nutritivo");
    custom.forEach((h) => pending.push(`"${h.label}"`));
    if (pending.length === 0) return null;
    return {
      title: "Tus hábitos de hoy 🌱",
      body: `Hoy te toca: ${joinList(pending)}. Palomea cada uno en ANRO TDAH cuando lo hagas.`,
      tag,
    };
  }

  if (slot === "afternoon") {
    if (done("hydrated")) return null;
    return {
      title: "¿Ya tomaste agua? 💧",
      body: "Toma un vaso ahora y palomea tu hábito. Si llevas rato sin moverte, una pausa activa de 5 minutos ayuda.",
      tag,
    };
  }

  // night
  const screens = !done("screensOff");
  const room = !done("sleepEnv");
  if (!screens && !room) return null;
  let body;
  if (screens && room) body = "Apaga las pantallas y deja tu cuarto listo para dormir. Mañana te lo vas a agradecer.";
  else if (screens) body = "Ya preparaste tu cuarto. Solo falta apagar las pantallas.";
  else body = "Ya apagaste las pantallas. Solo falta dejar tu cuarto listo para dormir.";
  return { title: "Hora de bajar el ritmo 🌙", body, tag };
}
