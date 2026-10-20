// "Elige por mí" — escoge al azar uno de los pasos pendientes del
// desglosador, para cuando la decisión de "¿cuál empiezo?" es justo lo que
// traba (inspirado en el botón "Pick one for me" de Llama Life). Primera
// versión: elige entre TODOS los pasos pendientes, sin considerar la
// energía de hoy — se puede agregar ese filtro después si se quiere.
//
// steps: array de pasos del desglosador (forma {id, text, min, done,
// energy?}) — exactamente la misma que ya usa FocusFlowTDAH.jsx. No
// modifica nada, solo lee.
export function pickRandomStep(steps) {
  const pending = (steps || []).filter((s) => s && !s.done);
  if (pending.length === 0) return null;
  const index = Math.floor(Math.random() * pending.length);
  return pending[index];
}
