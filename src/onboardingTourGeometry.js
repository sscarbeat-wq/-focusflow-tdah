// Lógica pura del recorrido de bienvenida interactivo (OnboardingTour.jsx) —
// separada para poder probarla con Node sin pasar por JSX/DOM real, mismo
// patrón que mascotLogic.js respecto a Mascot.jsx.
//
// 8 de noviembre de 2026 — Fase 2 del recorrido de bienvenida: a petición
// explícita de la doctora ("que se le dé un recorrido por la app y cómo
// podría usarla"), el recorrido original de 3 pantallas centradas (ver
// OnboardingTour.jsx, 29 de octubre de 2026) se amplía con pasos de
// "spotlight" que señalan directamente un elemento real dentro de la app
// (la mascota/racha, el contador de "foco acumulado", el botón de Memoria
// ANRO, el panel de Modo Enfoque) en vez de solo describirlos con texto.
// Esta función calcula, a partir del rectángulo real del elemento
// (`getBoundingClientRect()`) y del tamaño de la ventana:
//   1) dónde dibujar el "agujero" de spotlight (recortado para nunca
//      salirse de la pantalla), y
//   2) dónde colocar el globo de texto (arriba o abajo del elemento, según
//      quepa, y centrado horizontalmente pero sin salirse de los bordes
//      izquierdo/derecho) — para no tener que mezclar matemática de layout
//      con JSX dentro del componente.
export function computeSpotlightLayout(rect, viewportW, viewportH, options = {}) {
  const padding = options.padding ?? 8;
  const gap = options.gap ?? 14;
  const tooltipWidth = options.tooltipWidth ?? 320;
  const tooltipHeight = options.tooltipHeight ?? 180;
  const margin = options.margin ?? 12;

  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const right = Math.min(viewportW, rect.left + rect.width + padding);
  const bottom = Math.min(viewportH, rect.top + rect.height + padding);

  const spotlight = {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };

  const spaceBelow = viewportH - bottom;
  const spaceAbove = top;
  // Preferir abajo salvo que no quepa y arriba sí haya más espacio — mismo
  // criterio simple que usan la mayoría de los tours (react-joyride,
  // driver.js): "abajo por default, arriba solo si hace falta".
  const placement = spaceBelow >= tooltipHeight + gap || spaceBelow >= spaceAbove ? "bottom" : "top";

  const tooltipTop =
    placement === "bottom"
      ? Math.min(bottom + gap, Math.max(margin, viewportH - tooltipHeight - margin))
      : Math.max(margin, top - gap - tooltipHeight);

  // Centrado horizontal bajo/sobre el elemento, recortado para que el globo
  // nunca se salga de los bordes izquierdo/derecho de la pantalla (clave en
  // teléfonos angostos, donde el elemento señalado puede estar casi en la
  // orilla).
  const centerX = left + spotlight.width / 2;
  const rawLeft = centerX - tooltipWidth / 2;
  const maxLeft = Math.max(margin, viewportW - tooltipWidth - margin);
  const tooltipLeft = Math.min(Math.max(margin, rawLeft), maxLeft);

  return {
    spotlight,
    tooltip: { top: tooltipTop, left: tooltipLeft, width: tooltipWidth, placement },
  };
}
