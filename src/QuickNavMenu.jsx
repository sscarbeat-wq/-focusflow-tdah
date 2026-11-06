import React, { useEffect, useState } from "react";
import { Compass, X } from "lucide-react";
import { useDraggableBubble } from "./useDraggableBubble";
import { computeAnchoredPanelPosition } from "./draggableBubblePure";

// "Ir a..." — Módulo 1 de ANRO TDAH 2.0 (navegación). La app es una sola
// página larga con más de 25 paneles (desglosador, rutinas, respiración,
// TCC, etc.) y hasta ahora la única forma de llegar a uno era con scroll
// manual o desde un enlace puntual de la vista "Hoy"/Compañero de apoyo.
// Este botón flotante (igual que el de "Elige por mí" en otras pantallas
// de apps de TDAH) deja saltar a CUALQUIER sección desde cualquier punto
// del scroll, sin tener que volver arriba primero.
//
// sections: [{ key, icon, label }] en el mismo orden en que aparecen en la
// página — el componente solo pinta la lista y llama a onNavigate(key); la
// lógica de scroll (igual que ya usa el Compañero de apoyo) vive en
// FocusFlowTDAH.jsx, para no duplicar ese mecanismo.
//
// 2026-11 — la doctora pidió que este botón (y el de Memoria ANRO) se
// puedan arrastrar a cualquier parte de la pantalla, porque a veces el
// punto fijo donde aparecían tapaba contenido. La posición ahora vive en
// useDraggableBubble (persistida por dispositivo en localStorage, nunca
// progreso clínico) en vez de un right/bottom fijo. Mientras `pos` es
// `null` (justo antes de montar) se usa el mismo lugar de siempre como
// resguardo, para no mostrar nada "saltando" al cargar.
const BUBBLE_SIZE = { w: 52, h: 52 };

export default function QuickNavMenu({ C, t, accent, sections, onNavigate, bottomOffset = 0 }) {
  const [open, setOpen] = useState(false);

  const getDefaultPosition = (vw, vh) => ({
    x: vw - BUBBLE_SIZE.w - 16,
    y: vh - BUBBLE_SIZE.h - (20 + bottomOffset),
  });
  const { pos, dragHandlers, wasDragged } = useDraggableBubble(
    "anro-bubble-pos-quicknav",
    getDefaultPosition,
    BUBBLE_SIZE
  );

  // Cerrar con Escape — mismo gesto que se espera de cualquier menú
  // flotante; solo escucha mientras está abierto, para no agregar un
  // listener global permanente de más.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handlePick = (key) => {
    setOpen(false);
    onNavigate?.(key);
  };

  const handleButtonClick = () => {
    if (wasDragged()) return; // ese click fue el final de un arrastre, se ignora
    setOpen((v) => !v);
  };

  const buttonStyle = pos
    ? { position: "fixed", left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" }
    : {
        position: "fixed",
        right: "16px",
        bottom: `${20 + bottomOffset}px`,
        left: "auto",
        top: "auto",
      };

  const menuPanelStyle = (() => {
    if (!pos) {
      return { right: "16px", bottom: `${84 + bottomOffset}px`, left: "auto", top: "auto" };
    }
    const panelW = Math.min(300, typeof window !== "undefined" ? window.innerWidth - 32 : 300);
    const panelH = Math.min(typeof window !== "undefined" ? window.innerHeight * 0.6 : 420, 520);
    const { top, left } = computeAnchoredPanelPosition(
      pos,
      BUBBLE_SIZE,
      { w: panelW, h: panelH },
      typeof window !== "undefined" ? window.innerWidth : 360,
      typeof window !== "undefined" ? window.innerHeight : 640
    );
    return { top: `${top}px`, left: `${left}px`, right: "auto", bottom: "auto" };
  })();

  return (
    <>
      {open && (
        <div
          role="menu"
          aria-label={t.quickNav.title}
          style={{
            position: "fixed",
            ...menuPanelStyle,
            width: "min(300px, calc(100vw - 32px))",
            maxHeight: "min(60vh, 520px)",
            overflowY: "auto",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            padding: "10px",
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "2px 6px 8px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t.quickNav.title}</span>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.quickNav.closeLabel}
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                borderRadius: "8px",
              }}
            >
              <X size={16} />
            </button>
          </div>
          {sections.map((s) => (
            <button
              key={s.key}
              role="menuitem"
              onClick={() => handlePick(s.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                minHeight: "44px",
                textAlign: "left",
                background: "transparent",
                border: "none",
                borderRadius: "10px",
                padding: "8px 8px",
                color: C.text,
                fontSize: "13px",
                cursor: "pointer",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span style={{ flexShrink: 0, display: "flex", color: C.textMuted }}>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleButtonClick}
        onPointerDown={(e) => {
          if (open) setOpen(false);
          dragHandlers.onPointerDown(e);
        }}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
        aria-label={open ? t.quickNav.closeLabel : t.quickNav.openLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          ...buttonStyle,
          width: `${BUBBLE_SIZE.w}px`,
          height: `${BUBBLE_SIZE.h}px`,
          borderRadius: "50%",
          background: accent,
          color: "#fff",
          border: "none",
          boxShadow: "0 6px 18px rgba(0,0,0,0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          touchAction: "none",
          zIndex: 60,
        }}
      >
        {open ? <X size={22} /> : <Compass size={22} />}
      </button>
    </>
  );
}
