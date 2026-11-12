import React, { useState, useEffect } from "react";
import { tint } from "./theme";

// Herramientas agrupadas por lo que la paciente necesita (11 de noviembre
// de 2026, "dame una idea de acomodar las herramientas"). Antes eran 21
// tarjetas iguales en una sola cuadrícula — con TDAH, ver tantas opciones
// juntas paraliza. Ahora:
//   - 5 grupos según lo que necesita ("Empezar y organizarme",
//     "Concentrarme", "Calmarme", "Cómo me siento", "Mi día a día"), cada
//     uno con su color para reconocerlo de un vistazo.
//   - Al tocar un grupo se ven solo sus herramientas (2 a 6) con su
//     descripción completa, y una fila de botones para cambiar de grupo o
//     volver a "Categorías".
// `items` sigue viniendo armado desde FocusFlowTDAH.jsx (ícono, nombre,
// descripción, badge Plus); aquí solo se acomodan.

export const TOOL_GROUPS = [
  { key: "start", emoji: "🧩", color: "#7C5CE0", tools: ["desglosador", "oneThing", "mindMap", "routines", "quickCapture", "auditor"] },
  { key: "focus", emoji: "🎯", color: "#2E7FD9", tools: ["focusMode", "bodyDouble", "activeBreak"] },
  { key: "calm", emoji: "🫧", color: "#1E9E6E", tools: ["burbuja", "calmBubbles", "mindfulness", "freno", "reestructuracion"] },
  { key: "feel", emoji: "💛", color: "#D98A0B", tools: ["mood", "energy", "companion", "cbt"] },
  { key: "daily", emoji: "📋", color: "#D9467F", tools: ["medication", "payments", "habits", "messageTone"] },
];

const RECENT_KEY = "anro-tools-recent";

function readJSON(key, fallback) {
  try {
    const v = JSON.parse(window.localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* sin localStorage: solo no se recuerda */
  }
}

// Segunda versión (mismo día, "¿crees que sea la mejor forma?"): al entrar
// ya NO se ven las 21 — solo "Te puede servir ahora" (una sugerencia según
// el día, ver `suggestion` desde FocusFlowTDAH.jsx), "Las que más usas" y 5
// tarjetas grandes, una por grupo. Las herramientas de cada grupo se ven al
// tocar su tarjeta.
export default function ToolsGrid({ C, t, accent, items, onSelect, suggestion, initialGroup, onGroupClear }) {
  const tg = t.tools;
  // El grupo elegido NO se recuerda entre visitas: cada vez que entra a
  // Herramientas empieza en la vista corta (sugerencia + 5 tarjetas).
  const [group, setGroup] = useState(null);

  // Sincronizar desde el padre cuando se navega desde un planeta de la
  // brújula (12 de noviembre de 2026): al tocar un planeta de categoría
  // en Inicio, FocusFlowTDAH manda `initialGroup` con la clave del grupo
  // y cambia a la pestaña Herramientas. Este efecto abre ese grupo
  // automáticamente y luego limpia la señal para que el botón "← Categorías"
  // vuelva a funcionar normal sin quedar atorado en el grupo.
  useEffect(() => {
    if (initialGroup) {
      setGroup(initialGroup);
      onGroupClear?.();
    }
  }, [initialGroup]);
  const [recent, setRecent] = useState(() => readJSON(RECENT_KEY, []));
  const byKey = Object.fromEntries(items.map((it) => [it.key, it]));
  const groupOf = (key) => TOOL_GROUPS.find((g) => g.tools.includes(key));
  // Cualquier herramienta que no esté en un grupo (por si se agrega una
  // nueva y se olvida acomodarla) cae al final en "Mi día a día".
  const grouped = new Set(TOOL_GROUPS.flatMap((g) => g.tools));
  const leftovers = items.filter((it) => !grouped.has(it.key)).map((it) => it.key);

  const open = (key) => {
    const next = [key, ...recent.filter((k) => k !== key)].slice(0, 4);
    setRecent(next);
    writeJSON(RECENT_KEY, next);
    onSelect(key);
  };
  const pickGroup = (key) => {
    setGroup(key);
  };

  const card = (key, compact) => {
    const it = byKey[key];
    if (!it) return null;
    const color = (groupOf(key) || TOOL_GROUPS[4]).color;
    return (
      <div key={key} role="listitem">
        <button
          type="button"
          onClick={() => open(key)}
          style={{
            display: "flex",
            flexDirection: compact ? "row" : "column",
            alignItems: compact ? "center" : "flex-start",
            gap: compact ? "10px" : "10px",
            width: "100%",
            minHeight: compact ? "58px" : "110px",
            padding: compact ? "10px 12px" : "14px",
            // Color translúcido SOBRE un fondo sólido: sin el fondo, en modo
            // oscuro se transparentaba el degradado de la página y el texto
            // se perdía.
            background: `linear-gradient(${tint(color, 0.07)}, ${tint(color, 0.07)}), ${C.surface}`,
            border: `1px solid ${tint(color, 0.22)}`,
            borderRadius: "16px",
            color: C.text,
            cursor: "pointer",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: tint(color, 0.18),
              color,
              flexShrink: 0,
            }}
          >
            {it.icon}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.25 }}>{it.label}</span>
              {it.badge}
            </span>
            {!compact && it.description && (
              <span style={{ display: "block", fontSize: "11.5px", color: C.textMuted, lineHeight: 1.4, marginTop: "3px" }}>
                {it.description}
              </span>
            )}
          </span>
        </button>
      </div>
    );
  };

  const list = (keys, compact) => (
    <div
      role="list"
      style={{
        display: "grid",
        gridTemplateColumns: compact ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(auto-fill, minmax(170px, 1fr))",
        gap: "10px",
      }}
    >
      {keys.map((k) => card(k, compact))}
    </div>
  );

  const chip = (key, label, emoji, color) => {
    const active = group === key;
    return (
      <button
        key={key || "all"}
        type="button"
        onClick={() => pickGroup(key)}
        aria-pressed={active}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          minHeight: "44px",
          padding: "0 14px",
          borderRadius: "999px",
          border: active ? `2px solid ${color}` : `1px solid ${tint(color, 0.35)}`,
          background: active ? color : `linear-gradient(${tint(color, 0.1)}, ${tint(color, 0.1)}), ${C.surface}`,
          color: active ? "#fff" : C.text,
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {emoji && <span aria-hidden="true">{emoji}</span>}
        {label}
      </button>
    );
  };

  const current = TOOL_GROUPS.find((g) => g.key === group);
  const recentKeys = recent.filter((k) => byKey[k]);
  const sug = suggestion && byKey[suggestion.key] ? suggestion : null;

  if (!current) {
    const sugItem = sug ? byKey[sug.key] : null;
    const sugColor = sug ? (groupOf(sug.key) || TOOL_GROUPS[4]).color : accent;
    return (
      <div aria-label={tg.gridLabel} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {sugItem && (
          <button
            type="button"
            onClick={() => open(sug.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              width: "100%",
              padding: "16px",
              borderRadius: "20px",
              border: `2px solid ${tint(sugColor, 0.45)}`,
              background: `linear-gradient(135deg, ${tint(sugColor, 0.18)} 0%, ${tint(sugColor, 0.06)} 100%), ${C.surface}`,
              color: C.text,
              cursor: "pointer",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: "52px", height: "52px", borderRadius: "16px", background: sugColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: "scale(1)" }}
            >
              {sugItem.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "11.5px", fontWeight: 800, color: sugColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                ✨ {tg.suggestTitle}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "16px", fontWeight: 800, margin: "2px 0" }}>
                {sugItem.label} {sugItem.badge}
              </span>
              <span style={{ display: "block", fontSize: "12.5px", color: C.textMuted, lineHeight: 1.4 }}>{tg.suggestReasons[sug.reason]}</span>
            </span>
            <span aria-hidden="true" style={{ fontSize: "20px", color: sugColor, fontWeight: 800 }}>›</span>
          </button>
        )}

        {recentKeys.length > 0 && (
          <section>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: C.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ⭐ {tg.recentTitle}
            </h3>
            {list(recentKeys, true)}
          </section>
        )}

        <section>
          <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 10px" }}>{tg.needTitle}</h2>
          <div role="list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
            {TOOL_GROUPS.map((g) => {
              const keys = (g.key === "daily" ? [...g.tools, ...leftovers] : g.tools).filter((k) => byKey[k]);
              return (
                <div key={g.key} role="listitem">
                  <button
                    type="button"
                    onClick={() => pickGroup(g.key)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "8px",
                      width: "100%",
                      minHeight: "128px",
                      padding: "16px",
                      borderRadius: "20px",
                      border: `1px solid ${tint(g.color, 0.3)}`,
                      background: `linear-gradient(160deg, ${tint(g.color, 0.2)} 0%, ${tint(g.color, 0.07)} 100%), ${C.surface}`,
                      color: C.text,
                      cursor: "pointer",
                      textAlign: "left",
                      boxSizing: "border-box",
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: "30px", lineHeight: 1 }}>{g.emoji}</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: C.text, lineHeight: 1.25 }}>{tg.groups[g.key]}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: g.color }}>{tg.groupCount(keys.length)}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div aria-label={tg.gridLabel}>
      <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 10px" }}>{tg.needTitle}</h2>
      {/* En el teléfono los botones van en una sola fila que se desliza de
          lado (en vez de ocupar 3 renglones); en computadora caben todos. */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "nowrap",
          overflowX: "auto",
          margin: "0 -4px 18px",
          padding: "2px 4px 6px",
          scrollbarWidth: "thin",
        }}
      >
        {chip(null, `← ${tg.allGroups}`, null, accent)}
        {TOOL_GROUPS.map((g) => chip(g.key, tg.groups[g.key], g.emoji, g.color))}
      </div>

      {list(current.key === "daily" ? [...current.tools, ...leftovers] : current.tools, false)}
    </div>
  );
}
