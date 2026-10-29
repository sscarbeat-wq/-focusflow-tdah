// Fase 1 del sistema de suscripciones (29 de octubre de 2026) — lógica pura,
// sin ningún efecto secundario, para decidir qué nivel de plan tiene una
// cuenta en un momento dado. Separado en su propio archivo (mismo patrón que
// streak.js/todayView.js) para poder probarlo con Node antes de conectarlo a
// la interfaz, y porque tanto el cliente (para mostrar/ocultar candados)
// como cualquier función de servidor futura pueden necesitar la misma regla.
//
// Modelo de negocio aprobado por la usuaria (29 de octubre de 2026):
// - "free" — plan Gratis, permanente, nunca se le quita nada a nadie.
// - "trial" — cuenta nueva, SIN tarjeta, con acceso completo a Plus durante
//   TRIAL_DAYS días desde que se registró. Se calcula solo con la fecha de
//   creación de la cuenta (auth.users.created_at, que Supabase ya guarda) —
//   a propósito no se creó ninguna tabla/columna nueva para esto.
// - "plus" — suscripción real y activa en Stripe (mensual o anual).
//
// Al terminar el trial, una cuenta sin suscripción activa en Stripe cae
// de vuelta a "free" — nunca a un estado bloqueado ni distinto del plan
// Gratis normal, para no repetir el patrón punitivo que esta app ya evitó
// en racha/mascota/etc.

export const TRIAL_DAYS = 14;

// Funciones que solo están disponibles en el plan Plus (o durante el
// trial). Esta lista es la referencia única para toda la app — cuando se
// conecten los candados de la Fase 3, cada panel va a importar de aquí en
// vez de repetir la lista. En la Fase 1 solo se declara, todavía no se usa
// para bloquear nada en la interfaz.
export const PLUS_FEATURE_KEYS = [
  "aiBreakdown", // El desglosador con IA (incluye el control de granularidad)
  "pickForMe", // "Elige por mí"
  "quickCapture", // Captura rápida con IA (voz/texto clasificado)
  "messageTone", // "Ayuda con mensajes"
  "companionAiReplies", // Respuestas generadas por IA del Compañero de apoyo (el botón de crisis NUNCA se restringe, en ningún plan)
  "customRoutines", // Rutinas personalizadas ilimitadas (más allá de las 3 preestablecidas)
  "googleCalendar", // Integración con Google Calendar
  "weeklyInsights", // Insights semanales de patrones
  "clinicalReport", // Reporte para tu consulta
  "paymentsReminder", // Recordatorio de pagos/suscripciones
  "distractionBlocker", // Aviso de apps distractoras dentro de Modo Enfoque
];

const ACTIVE_STRIPE_STATUSES = ["active", "trialing"];

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Decide el nivel de plan de una cuenta.
 *
 * @param {Object} params
 * @param {string|Date} params.accountCreatedAt - auth.users.created_at (ISO o Date)
 * @param {string|null|undefined} params.subscriptionStatus - subscriptions.status en Supabase (puede no existir todavía)
 * @param {string|null|undefined} params.subscriptionPlan - subscriptions.plan ("monthly" | "annual" | null)
 * @param {Date} [params.now] - para pruebas; por default, la hora actual real.
 * @returns {{ tier: "plus"|"free", source: "stripe"|"trial"|"free", plan: string|null, trialEndsAt: Date|null, trialDaysLeft: number|null }}
 */
export function getPlanState({ accountCreatedAt, subscriptionStatus, subscriptionPlan, now } = {}) {
  const current = now instanceof Date ? now : new Date();

  const isStripeActive = subscriptionStatus && ACTIVE_STRIPE_STATUSES.includes(subscriptionStatus);
  if (isStripeActive) {
    return {
      tier: "plus",
      source: "stripe",
      plan: subscriptionPlan || null,
      trialEndsAt: null,
      trialDaysLeft: null,
    };
  }

  const createdAt = accountCreatedAt instanceof Date ? accountCreatedAt : new Date(accountCreatedAt);
  if (!accountCreatedAt || Number.isNaN(createdAt.getTime())) {
    // Dato defensivo: si por algún motivo no hay fecha de creación válida,
    // nunca se otorga un trial que no se pueda calcular — se trata como
    // plan Gratis, nunca como un error que bloquee la app.
    return { tier: "free", source: "free", plan: null, trialEndsAt: null, trialDaysLeft: null };
  }

  const trialEndsAt = addDays(createdAt, TRIAL_DAYS);
  const inTrial = current.getTime() < trialEndsAt.getTime();

  if (inTrial) {
    const msLeft = trialEndsAt.getTime() - current.getTime();
    const trialDaysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return { tier: "plus", source: "trial", plan: null, trialEndsAt, trialDaysLeft };
  }

  return { tier: "free", source: "free", plan: null, trialEndsAt, trialDaysLeft: 0 };
}

/** Azúcar sintáctica para los paneles: ¿esta cuenta puede usar esta función Plus ahora mismo? */
export function hasPlusAccess(planState) {
  return Boolean(planState && planState.tier === "plus");
}
