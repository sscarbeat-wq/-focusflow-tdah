import React, { useRef } from "react";
import { tapFeedback } from "./celebrate";

// Agarradera para acomodar una lista jalando (10 de noviembre de 2026,
// "acomodar tareas jalándolas"). Va dentro de cada <li>; al arrastrarla,
// la fila entera sigue al dedo/mouse y al soltar se calcula en qué lugar
// quedó comparando con el centro de las demás filas de la misma lista.
// Sin librerías: Pointer Events + setPointerCapture.
// Teclado: con la agarradera enfocada, flecha arriba/abajo la mueven un
// lugar (el arrastre no es la única forma de hacerlo).

function GripIcon({ color }) {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" aria-hidden="true">
      {[3, 9, 15].map((y) =>
        [4, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={color} />)
      )}
    </svg>
  );
}

export default function ReorderHandle({ index, count, onMove, label, color = "currentColor" }) {
  const drag = useRef(null);

  const onPointerDown = (e) => {
    const li = e.currentTarget.closest("li");
    if (!li || !li.parentElement) return;
    const rows = Array.from(li.parentElement.children);
    drag.current = {
      li,
      startY: e.clientY,
      centers: rows.map((r) => {
        const rect = r.getBoundingClientRect();
        return rect.top + rect.height / 2;
      }),
      from: rows.indexOf(li),
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* sin captura igual funciona mientras el dedo siga encima */
    }
    tapFeedback("pick");
    li.style.transition = "none";
    li.style.zIndex = "5";
    li.style.boxShadow = "0 8px 20px rgba(0,0,0,0.18)";
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 3) d.moved = true;
    d.li.style.transform = `translateY(${dy}px) scale(1.02)`;
  };

  const finish = (e, cancelled) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dy = cancelled ? 0 : e.clientY - d.startY;
    const center = d.centers[d.from] + dy;
    let to = d.from;
    d.centers.forEach((c, i) => {
      if (i < d.from && center < c) to = Math.min(to, i);
      if (i > d.from && center > c) to = Math.max(to, i);
    });
    d.li.style.transform = "";
    d.li.style.boxShadow = "";
    d.li.style.zIndex = "";
    d.li.style.transition = "";
    if (!cancelled && d.moved && to !== d.from) {
      tapFeedback("drop");
      onMove(to);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      onMove(index - 1);
    } else if (e.key === "ArrowDown" && index < count - 1) {
      e.preventDefault();
      onMove(index + 1);
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onKeyDown={onKeyDown}
      style={{
        width: "28px",
        minHeight: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "grab",
        touchAction: "none",
        flexShrink: 0,
      }}
    >
      <GripIcon color={color} />
    </button>
  );
}
