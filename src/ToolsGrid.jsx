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
  { key: "daily", emoji: "📋", color: "#D9467F", tools: ["medication", "payments", "habits", "messageTone", "errandMode"] },
];

const RECENT_KEY = "anro-tools-recent";

// Pregunta rápida, en 2 pasos (20 de noviembre de 2026: "como podria hacer
// que todas estas funciones no se vean demasiadas" → primera versión era 1
// pregunta con 4 respuestas, pero solo llevaban a herramientas de
// "organizarme" ("no serian buenas esas preguntas para poder dirigir al
// paciente también a las otras funciones de calma etc") → se probaron 2
// formas y la paciente eligió "área primero, luego la pregunta"). Paso 1:
// elige una de las 5 áreas de TOOL_GROUPS (mismas que "explorar por
// categoría", reutilizando tg.groups/emoji/color). Paso 2: 3 respuestas
// cortas específicas de esa área, cada una abre UNA herramienta directo.
// El orden de cada lista aquí debe coincidir con `tg.triage.subAnswers.<área>`
// en cada i18n/*.js (misma posición = misma herramienta).
const TRIAGE_SUBQUESTIONS = {
  start: ["desglosador", "mindMap", "auditor"],
  focus: ["focusMode", "bodyDouble", "activeBreak"],
  calm: ["burbuja", "mindfulness", "freno"],
  feel: ["mood", "energy", "companion"],
  daily: ["medication", "habits", "errandMode"],
};

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
  // Igual que `group`: no se recuerda entre visitas — cada vez que entra a
  // Herramientas empieza con la pregunta rápida, no con todas a la vista.
  const [showAll, setShowAll] = useState(false);
  // Paso 2 de la pregunta rápida: null = paso 1 (elegir área); una clave de
  // TOOL_GROUPS = paso 2 (las 3 preguntas específicas de esa área).
  const [triageArea, setTriageArea] = useState(null);

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
  // Dentro de una categoría ya no se ven todas sus herramientas de golpe
  // (14 de noviembre de 2026, "se ven demasiadas herramientas, para un
  // tdah será complicado elegir una"): se muestran las 3 más relevantes
  // (las que ya usó, primero) y el resto queda detrás de "Ver N más",
  // recordado por categoría mientras la pestaña Herramientas sigue abierta.
  const [expandedGroups, setExpandedGroups] = useState({});
  const byKey = Object.fromEntries(items.map((it) => [it.key, it]));
  const groupOf = (key) => TOOL_GROUPS.find((g) => g.tools.includes(key));
  // Cualquier herramienta que no esté en un grupo (por si se agrega una
  // nueva y se olvida acomodarla) cae al final en "Mi día a día".
  const grouped = new Set(TOOL_GROUPS.flatMap((g) => g.tools));
  const leftovers = items.filter((it) => !grouped.has(it.key)).map((it) => it.key);

  const open = (key) => {
    const next = [key, ...recent.filter((k) => k !== key)].slice(0, 7);
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
        {!showAll && !triageArea && (
          <section
            style={{
              background: `linear-gradient(${tint(accent, 0.08)}, ${tint(accent, 0.08)}), ${C.surface}`,
              border: `1px solid ${tint(accent, 0.2)}`,
              borderRadius: "20px",
              padding: "16px",
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 12px", textAlign: "center" }}>
              {tg.triage.question}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {TOOL_GROUPS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setTriageArea(g.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "13px 14px",
                    borderRadius: "14px",
                    border: `1px solid ${tint(C.text, 0.1)}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: "17px" }}>{g.emoji}</span>
                  {tg.groups[g.key]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                display: "block",
                width: "100%",
                marginTop: "12px",
                padding: "10px",
                background: "transparent",
                border: "none",
                color: accent,
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              {tg.triage.browseAll}
            </button>
          </section>
        )}

        {!showAll && triageArea && (
          <section
            style={{
              background: `linear-gradient(${tint(accent, 0.08)}, ${tint(accent, 0.08)}), ${C.surface}`,
              border: `1px solid ${tint(accent, 0.2)}`,
              borderRadius: "20px",
              padding: "16px",
            }}
          >
            <button
              type="button"
              onClick={() => setTriageArea(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                color: accent,
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                padding: "0 0 10px",
              }}
            >
              ← {tg.triage.back}
            </button>
            <h3 style={{ fontSize: "14px", fontWeight: 800, color: C.text, margin: "0 0 12px", textAlign: "center" }}>
              {tg.triage.subIntro[triageArea]}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(TRIAGE_SUBQUESTIONS[triageArea] || []).map((key, i) =>
                byKey[key] ? (
                  <button
                    key={key}
                    type="button"
                    onClick={() => open(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: `1px solid ${tint(C.text, 0.1)}`,
                      background: C.surface,
                      color: C.text,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {tg.triage.subAnswers[triageArea][i]}
                    <span aria-hidden="true" style={{ color: accent, fontWeight: 800 }}>→</span>
                  </button>
                ) : null
              )}
            </div>
          </section>
        )}

        {showAll && (
          <button
            type="button"
            onClick={() => {
              setShowAll(false);
              setTriageArea(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              color: accent,
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              padding: "2px 0",
              alignSelf: "flex-start",
            }}
          >
            ← {tg.triage.backToQuestion}
          </button>
        )}

        {showAll && sugItem && (
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

        {showAll && recentKeys.length > 0 && (
          <section>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: C.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              ⭐ {tg.recentTitle}
            </h3>
            {list(recentKeys, true)}
          </section>
        )}

        {showAll && (
        <section>
          <h3 style={{ fontSize: "13px", fontWeight: 800, color: C.textMuted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {tg.browseTitle}
          </h3>
          {/* 14 de noviembre de 2026, segunda vuelta ("siento que se ve
              igual"): las 5 categorías dejaron de ser tarjetas grandes de
              color — ocupaban más pantalla que la propia sugerencia y por
              eso la pantalla se seguía viendo igual de saturada. Ahora son
              una fila de pastillas chicas (mismo patrón ya usado para
              cambiar de categoría dentro de una herramienta), para que la
              sugerencia sea claramente lo único grande en la pantalla. */}
          <div role="list" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TOOL_GROUPS.map((g) => {
              const keys = (g.key === "daily" ? [...g.tools, ...leftovers] : g.tools).filter((k) => byKey[k]);
              return (
                <div key={g.key} role="listitem">
                  <button
                    type="button"
                    onClick={() => pickGroup(g.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minHeight: "46px",
                      padding: "0 16px",
                      borderRadius: "999px",
                      border: `1px solid ${tint(g.color, 0.35)}`,
                      background: `linear-gradient(${tint(g.color, 0.12)}, ${tint(g.color, 0.12)}), ${C.surface}`,
                      color: C.text,
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: "17px" }}>{g.emoji}</span>
                    {tg.groups[g.key]}
                    <span aria-hidden="true" style={{ fontSize: "11px", fontWeight: 800, color: g.color }}>
                      · {keys.length}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        )}
      </div>
    );
  }

  const VISIBLE_IN_GROUP = 3;
  const allKeysInGroup = (current.key === "daily" ? [...current.tools, ...leftovers] : current.tools).filter((k) => byKey[k]);
  // Dentro de la categoría, las que ya usó suben primero (en el mismo orden
  // de "más reciente"); el resto se queda en su orden normal.
  const recentFirst = recent.filter((k) => allKeysInGroup.includes(k));
  const orderedKeys = [...recentFirst, ...allKeysInGroup.filter((k) => !recentFirst.includes(k))];
  const isExpanded = !!expandedGroups[current.key];
  const visibleKeys = isExpanded ? orderedKeys : orderedKeys.slice(0, VISIBLE_IN_GROUP);
  const hiddenCount = orderedKeys.length - visibleKeys.length;

  return (
    <div aria-label={tg.gridLabel}>
      <h2 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span aria-hidden="true">{current.emoji}</span> {tg.groups[current.key]}
      </h2>
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

      {list(visibleKeys, false)}

      {orderedKeys.length > VISIBLE_IN_GROUP && (
        <button
          type="button"
          onClick={() => setExpandedGroups((prev) => ({ ...prev, [current.key]: !isExpanded }))}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            marginTop: "10px",
            padding: "12px",
            borderRadius: "14px",
            border: `1px dashed ${tint(current.color, 0.4)}`,
            background: "transparent",
            color: current.color,
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {isExpanded ? tg.seeLess : tg.seeMore(hiddenCount)}
          <span aria-hidden="true" style={{ fontSize: "12px" }}>{isExpanded ? "▲" : "▼"}</span>
        </button>
      )}
    </div>
  );
}
