import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampBubblePosition,
  loadBubblePosition,
  saveBubblePosition,
  exceedsDragThreshold,
} from "./draggableBubblePure";

// Posición arrastrable y persistente por dispositivo para una burbuja
// flotante (Memoria ANRO, "Ir a...", Burbuja de enfoque). Mismo patrón de
// "preferencia de dispositivo" que ya usa el resto de la app (tema,
// especie de mascota, acento personal): se guarda en localStorage, nunca
// en Supabase — nunca es progreso clínico, nunca viaja entre dispositivos
// ni pacientes.
//
// storageKey: llave única de localStorage para esta burbuja.
// getDefaultPosition(viewportW, viewportH, size) => {x, y}: dónde arranca
//   la burbuja la primera vez, antes de que la paciente la mueva (debe
//   reproducir la posición visual que ya tenía antes de este cambio).
// size: {w, h} en píxeles, para no dejarla salirse de la pantalla.
//
// Usa Pointer Events + setPointerCapture: una vez capturado el puntero en
// onPointerDown, los eventos de move/up siguen llegando al mismo elemento
// aunque el dedo/cursor se mueva fuera de sus límites — por eso no hace
// falta ningún listener en window.
export function useDraggableBubble(storageKey, getDefaultPosition, size) {
  const [pos, setPos] = useState(null); // null hasta montar en el navegador
  const dragRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startPointer: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
  });

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const saved = loadBubblePosition(window.localStorage, storageKey);
    const base = saved || getDefaultPosition(vw, vh, size);
    setPos(clampBubblePosition(base, size, vw, vh));
    // Solo al montar esta burbuja — si cambiaran size/getDefaultPosition
    // en caliente no queremos saltar la posición ya guardada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    function onResize() {
      setPos((p) => (p ? clampBubblePosition(p, size, window.innerWidth, window.innerHeight) : p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const onPointerDown = useCallback((e) => {
    setPos((currentPos) => {
      if (!currentPos) return currentPos;
      dragRef.current = {
        active: true,
        moved: false,
        pointerId: e.pointerId,
        startPointer: { x: e.clientX, y: e.clientY },
        startPos: { x: currentPos.x, y: currentPos.y },
      };
      return currentPos;
    });
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // algunos navegadores viejos no soportan setPointerCapture — el
      // arrastre simplemente no inicia captura, sin romper el click normal
    }
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startPointer.x;
      const dy = e.clientY - d.startPointer.y;
      if (!d.moved && exceedsDragThreshold(dx, dy)) d.moved = true;
      if (!d.moved) return;
      if (e.cancelable) e.preventDefault();
      setPos(
        clampBubblePosition(
          { x: d.startPos.x + dx, y: d.startPos.y + dy },
          size,
          window.innerWidth,
          window.innerHeight
        )
      );
    },
    [size.w, size.h]
  );

  const endDrag = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      try {
        e.currentTarget.releasePointerCapture?.(d.pointerId);
      } catch {
        // ya liberado o no soportado — no afecta el resultado
      }
      setPos((p) => {
        if (p) saveBubblePosition(window.localStorage, storageKey, p);
        return p;
      });
    },
    [storageKey]
  );

  // Llamar dentro del onClick real del botón: si el click es el final de
  // un arrastre, hay que ignorarlo (no abrir/cerrar nada) — el arrastre ya
  // se encargó de mover y guardar la posición.
  const wasDragged = useCallback(() => dragRef.current.moved, []);

  return {
    pos,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
    wasDragged,
  };
}
