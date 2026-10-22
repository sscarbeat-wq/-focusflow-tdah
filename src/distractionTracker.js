// Bloqueador de apps distractoras (versión web, usando la Page Visibility API).
//
// Senda NO puede bloquear de verdad otras apps del celular/computadora desde
// el navegador — eso requiere desarrollo nativo. Lo que SÍ puede hacer con
// honestidad es darse cuenta cuando el paciente deja la pestaña mientras una
// sesión de Modo Enfoque está corriendo, y avisarle al volver cuánto tiempo
// estuvo fuera — un aviso dentro del navegador, no un bloqueo real.
//
// Lógica pura, sin tocar el DOM ni temporizadores reales, para poder probarla
// con datos de ejemplo antes de conectarla al evento real de visibilidad de
// la pestaña — mismo principio que bodyDoublePure.js y weeklyInsights.js.

export function resetTracker() {
  return { count: 0, totalAwayMs: 0, awaySince: null };
}

// Se llama cuando la pestaña deja de estar visible (document.hidden === true).
// Si ya estaba marcada como "fuera" (no debería pasar en uso normal, pero por
// seguridad), no se sobreescribe el awaySince existente.
export function recordLeave(state, timestampMs) {
  if (state.awaySince != null) return state;
  return { ...state, awaySince: timestampMs };
}

// Se llama cuando la pestaña vuelve a estar visible. Devuelve el nuevo estado
// y, por separado, cuánto tiempo (ms) estuvo fuera esta vez (null si no había
// ningún awaySince registrado, p. ej. la pestaña nunca se fue en esta sesión).
export function recordReturn(state, timestampMs) {
  if (state.awaySince == null) return { state, awayMs: null };
  const awayMs = Math.max(0, timestampMs - state.awaySince);
  return {
    state: {
      count: state.count + 1,
      totalAwayMs: state.totalAwayMs + awayMs,
      awaySince: null,
    },
    awayMs,
  };
}

function toSeconds(ms) {
  return Math.round(ms / 1000);
}

const DEFAULT_FOCUS_MODE_T = {
  distractionSummary: (count, seconds) =>
    `🚪 ${count === 1 ? "1 salida" : `${count} salidas`} de la pestaña (${seconds}s fuera en total esta sesión)`,
  returnToast: (seconds) => `Volviste después de ${seconds}s fuera de la pestaña — tu sesión de enfoque sigue corriendo`,
};

// Texto del contador persistente (debajo del temporizador). null si todavía
// no hay nada que mostrar (no ha salido de la pestaña en esta sesión). `t`
// es t.focusMode del idioma activo — por defecto cae a español para no
// romper a quien llame esta función sin pasarlo (p. ej. pruebas existentes).
export function formatDistractionSummary(state, t = DEFAULT_FOCUS_MODE_T) {
  if (!state || state.count === 0) return null;
  const sec = toSeconds(state.totalAwayMs);
  return t.distractionSummary(state.count, sec);
}

// Texto del aviso momentáneo que aparece justo al volver a la pestaña. null
// si estuvo fuera menos de 2 segundos — eso suele ser solo un parpadeo del
// sistema (cambio de ventana accidental, captura de pantalla, etc.), no una
// distracción real, y avisar por tan poco sería más ruido que ayuda.
export function formatReturnToast(awayMs, t = DEFAULT_FOCUS_MODE_T) {
  if (awayMs == null || awayMs < 2000) return null;
  const sec = toSeconds(awayMs);
  return t.returnToast(sec);
}
