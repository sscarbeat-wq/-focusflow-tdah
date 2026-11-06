// Lógica pura de posición para las burbujas flotantes arrastrables
// (Memoria ANRO, "Ir a...", Burbuja de enfoque). Separada del hook de
// React (useDraggableBubble.js) para poder probarla con Node sin DOM,
// mismo patrón que streak.js/mascotLogic.js respecto a sus componentes
// .jsx.

export const BUBBLE_MARGIN = 10;
export const DRAG_THRESHOLD_PX = 6;

// Mantiene la burbuja dentro de la pantalla visible, con un margen mínimo
// en los 4 lados — se usa tanto al cargar la posición guardada como en
// cada resize de ventana (ej. al girar el celular, o al abrir/cerrar el
// teclado en pantalla).
export function clampBubblePosition(pos, size, viewportW, viewportH) {
  const maxX = Math.max(BUBBLE_MARGIN, viewportW - size.w - BUBBLE_MARGIN);
  const maxY = Math.max(BUBBLE_MARGIN, viewportH - size.h - BUBBLE_MARGIN);
  return {
    x: Math.min(Math.max(pos.x, BUBBLE_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, BUBBLE_MARGIN), maxY),
  };
}

export function loadBubblePosition(storage, storageKey) {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    // dato corrupto o storage no disponible (ej. modo incógnito) — se
    // ignora, se usa la posición por defecto
  }
  return null;
}

export function saveBubblePosition(storage, storageKey, pos) {
  try {
    storage.setItem(storageKey, JSON.stringify({ x: pos.x, y: pos.y }));
  } catch {
    // storage lleno/bloqueado — la burbuja no recuerda la posición esta
    // vez, pero nada se rompe
  }
}

export function exceedsDragThreshold(dx, dy) {
  return Math.hypot(dx, dy) > DRAG_THRESHOLD_PX;
}

// Calcula dónde colocar un panel (menú/modal chico) que debe aparecer
// pegado a una burbuja que ahora puede estar en cualquier parte de la
// pantalla (ya no siempre en su esquina original) — se abre arriba o
// abajo del botón según cuál lado tenga más espacio, y se recorta en
// horizontal para nunca salirse de la pantalla.
export function computeAnchoredPanelPosition(bubblePos, bubbleSize, panelSize, viewportW, viewportH, gap = 8) {
  const spaceBelow = viewportH - (bubblePos.y + bubbleSize.h);
  const spaceAbove = bubblePos.y;
  const openAbove = spaceAbove > spaceBelow && spaceAbove > panelSize.h + gap;

  const top = openAbove
    ? Math.max(BUBBLE_MARGIN, bubblePos.y - gap - panelSize.h)
    : Math.min(bubblePos.y + bubbleSize.h + gap, Math.max(BUBBLE_MARGIN, viewportH - panelSize.h - BUBBLE_MARGIN));

  const idealLeft = bubblePos.x + bubbleSize.w / 2 - panelSize.w / 2;
  const left = Math.min(
    Math.max(idealLeft, BUBBLE_MARGIN),
    Math.max(BUBBLE_MARGIN, viewportW - panelSize.w - BUBBLE_MARGIN)
  );

  return { top, left, openAbove };
}
