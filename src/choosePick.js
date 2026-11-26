// "Elige por mí" — escoge uno de los pasos pendientes del desglosador,
// para cuando la decisión de "¿cuál empiezo?" es justo lo que traba
// (inspirado en el botón "Pick one for me" de Llama Life).
//
// 26 de noviembre de 2026 ("siento que no tiene mucha funcionalidad" sobre
// el check-in de energía): antes elegía entre TODOS los pasos pendientes
// sin considerar la energía de hoy — el check-in se sentía decorativo
// porque nada visible cambiaba al usarlo. Ahora, si hay pasos etiquetados
// que coinciden con el nivel de energía de hoy, elige al azar SOLO entre
// esos; si ninguno coincide (o no hay check-in todavía), sigue eligiendo
// entre todos los pendientes, como antes.
//
// steps: array de pasos del desglosador (forma {id, text, min, done,
// energy?}) — exactamente la misma que ya usa FocusFlowTDAH.jsx. No
// modifica nada, solo lee.
// energyLevel: "baja" | "media" | "alta" | null/undefined — opcional, el
// nivel del check-in de HOY (ver todayEnergyEntry en energyLog.js).
export function pickRandomStep(steps, energyLevel = null) {
  const pending = (steps || []).filter((s) => s && !s.done);
  if (pending.length === 0) return null;
  const matching = energyLevel ? pending.filter((s) => s.energy === energyLevel) : [];
  const pool = matching.length > 0 ? matching : pending;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
