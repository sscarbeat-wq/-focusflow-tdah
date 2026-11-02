import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Aviso de actualización disponible — 2 de noviembre de 2026, corrigiendo un
// bug real encontrado probando la función #6 de Fase 4 (reportes de enfoque):
// antes (ver vite.config.js, registerType "autoUpdate" + skipWaiting/
// clientsClaim en true) cada vez que se publicaba una versión nueva, el
// service worker se actualizaba solo y RECARGABA LA PÁGINA SIN AVISAR en
// cuanto el navegador volvía a revisar la pestaña — típicamente justo al
// volver de otra pestaña — lo que borraba cualquier cosa que no estuviera
// guardada todavía, como una sesión de Modo Enfoque corriendo (el reloj, el
// sonido de fondo, el conteo de distracciones, todo vive solo en memoria
// hasta que la sesión termina).
//
// Ahora el service worker nuevo se queda "esperando" en vez de tomar control
// solo (skipWaiting/clientsClaim en false), y este componente avisa con un
// aviso discreto abajo de la pantalla — la persona decide cuándo actualizar,
// nunca se interrumpe nada en silencio. Si no hay actualización pendiente,
// este componente no muestra nada (needRefresh en false).
export default function UpdatePrompt({ C, t }) {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3000,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
        maxWidth: "min(420px, calc(100vw - 32px))",
      }}
    >
      <span style={{ fontSize: "13px", color: C.text, lineHeight: 1.4 }}>{t.updatePrompt.message}</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        style={{
          background: C.mint,
          color: C.mintText,
          border: "none",
          borderRadius: "10px",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        {t.updatePrompt.button}
      </button>
    </div>
  );
}
