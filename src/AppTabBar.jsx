import React from "react";
import { Home, CalendarClock, Wrench, TrendingUp, User } from "lucide-react";
import { tint } from "./theme";

// Fase 2 de ANRO TDAH 2.0 (navegación, 28 de octubre de 2026): reemplaza el
// scroll larguísimo + el menú flotante "Ir a..." (QuickNavMenu, que se
// queda como atajo complementario) por 5 secciones fijas — Inicio, Agenda,
// Herramientas, Progreso, Perfil. En móvil es una barra fija abajo (patrón
// estándar de apps de hábitos/TDAH tipo Tiimo/Structured); en tablet/
// escritorio es una fila de pestañas normal, arriba del contenido — mismo
// componente, decide según `isNarrow` (que ya calcula FocusFlowTDAH.jsx con
// window.innerWidth < 760, el mismo breakpoint que usa el resto de la app).
//
// Patrón de accesibilidad WAI-ARIA para pestañas (tablist/tab): flechas
// izquierda/derecha (o arriba/abajo) mueven el foco Y seleccionan la
// pestaña siguiente/anterior, Home/End saltan a la primera/última,
// aria-selected marca cuál está activa, y solo la pestaña activa es
// alcanzable con Tab (roving tabindex) — exactamente como describe la guía
// de patrones ARIA de las pestañas de navegación.
const TAB_ORDER = ["inicio", "agenda", "herramientas", "progreso", "perfil"];
const TAB_ICONS = {
  inicio: Home,
  agenda: CalendarClock,
  herramientas: Wrench,
  progreso: TrendingUp,
  perfil: User,
};

export default function AppTabBar({ C, t, accent, activeTab, onChange, isNarrow }) {
  const focusTab = (key) => {
    // El botón recién seleccionado todavía no es el único con tabIndex=0 en
    // el render anterior — se espera al siguiente tick para que React ya
    // haya aplicado el nuevo roving tabindex antes de enfocarlo.
    requestAnimationFrame(() => {
      document.getElementById(`anro-tab-${key}`)?.focus();
    });
  };

  const handleKeyDown = (e) => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx === -1) return;
    let nextKey = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextKey = TAB_ORDER[(idx + 1) % TAB_ORDER.length];
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextKey = TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length];
    } else if (e.key === "Home") {
      nextKey = TAB_ORDER[0];
    } else if (e.key === "End") {
      nextKey = TAB_ORDER[TAB_ORDER.length - 1];
    }
    if (nextKey) {
      e.preventDefault();
      onChange(nextKey);
      focusTab(nextKey);
    }
  };

  return (
    <nav
      role="tablist"
      aria-label={t.appTabs.navLabel}
      aria-orientation={isNarrow ? "horizontal" : "horizontal"}
      onKeyDown={handleKeyDown}
      style={
        isNarrow
          ? {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              background: C.surface,
              borderTop: `1px solid ${C.border}`,
              boxShadow: "0 -2px 14px rgba(0,0,0,0.12)",
              zIndex: 55,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }
          : {
              display: "flex",
              gap: "6px",
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              padding: "6px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }
      }
    >
      {TAB_ORDER.map((key) => {
        const Icon = TAB_ICONS[key];
        const selected = activeTab === key;
        return (
          <button
            key={key}
            id={`anro-tab-${key}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`anro-tabpanel-${key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(key)}
            style={
              isNarrow
                ? {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    minHeight: "58px",
                    padding: "6px 2px",
                    background: "transparent",
                    border: "none",
                    color: selected ? accent : C.textMuted,
                    fontWeight: selected ? 700 : 500,
                    fontSize: "10.5px",
                    lineHeight: 1.2,
                    cursor: "pointer",
                  }
                : {
                    flex: "1 1 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    minHeight: "44px",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: selected ? tint(accent, 0.16) : "transparent",
                    border: "none",
                    color: selected ? accent : C.textMuted,
                    fontWeight: selected ? 700 : 600,
                    fontSize: "13.5px",
                    cursor: "pointer",
                  }
            }
          >
            <Icon size={isNarrow ? 21 : 18} aria-hidden="true" />
            <span>{t.appTabs[key]}</span>
          </button>
        );
      })}
    </nav>
  );
}
