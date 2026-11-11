import React from "react";

// Franja "Hoy" debajo de la mascota en Inicio (11 de noviembre de 2026,
// "quisiera que los hábitos estuvieran más a la vista, y también lo de
// fuera de la vista y pausa activa"). Antes los hábitos solo se veían
// entrando a Herramientas → Mi día a día. Ahora, en lo primero que se ve:
//   - Los 4 hábitos del día como botones redondos con emoji y una palabra;
//     un toque los palomea (mismo toggle y mismos XP que en la herramienta).
//   - Dos accesos: "Despejar mi espacio" (abre Modo enfoque, donde está la
//     explicación de "Fuera de la vista") y "Pausa activa".
// Colores: los de la paleta de Inicio (cambia con la hora y con los temas
// Plus), sobre una pastilla casi opaca para que siempre se lea.
export default function TodayHabitsStrip({ t, palette, items, deskCleared, onDesk, onBreak, isNarrow }) {
  const th = t.todayStrip;
  const done = items.filter((it) => it.checked).length;
  // 4 fijos → una fila de 4. Con hábitos propios (5 a 7): en computadora
  // siguen en UNA fila; en el teléfono, dos filas (3+2, 3+3 o 4+3).
  const cols = items.length <= 4 ? 4 : isNarrow ? Math.ceil(items.length / 2) : items.length;
  const oneRowScroll = isNarrow && items.length > 4 && typeof window !== "undefined" && window.innerHeight < 720;
  const text = palette.text;
  const muted = palette.textMuted || palette.text;
  const accent = palette.accent || "#3F9C82";
  const bg = palette.chipBg || `color-mix(in srgb, ${palette.bg} 84%, transparent)`;
  const line = `color-mix(in srgb, ${text} 16%, transparent)`;

  const action = (emoji, label, onClick, isDone) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isNarrow ? "6px" : "8px",
        minHeight: oneRowScroll ? "40px" : "46px",
        padding: isNarrow ? "0 6px" : "0 12px",
        borderRadius: "14px",
        border: `1px solid ${line}`,
        background: isDone ? `color-mix(in srgb, ${accent} 22%, transparent)` : "transparent",
        color: text,
        fontSize: isNarrow ? "13px" : "14px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "18px" }}>{isDone ? "✅" : emoji}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    </button>
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "560px",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: oneRowScroll ? "8px 12px" : isNarrow ? "10px 12px" : "14px 18px",
        borderRadius: "20px",
        background: bg,
        border: `1px solid ${line}`,
        color: text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: oneRowScroll ? "6px" : isNarrow ? "8px" : "10px" }}>
        <span style={{ fontSize: "14px", fontWeight: 800 }}>{th.title}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: muted }}>{th.count(done, items.length)}</span>
      </div>

      <div
        role="group"
        aria-label={th.title}
        style={
          oneRowScroll
            ? {
                // Celular bajito con hábitos propios: una sola fila que se
                // desliza de lado (el siguiente se asoma), para que la
                // franja no crezca y siga cabiendo sin bajar la pantalla.
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                padding: "7px 4px 4px 0",
                margin: "-7px 0 4px",
                scrollbarWidth: "none",
              }
            : { display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "8px", marginBottom: isNarrow ? "8px" : "10px" }
        }
      >
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={it.onToggle}
            aria-pressed={it.checked}
            aria-label={it.label}
            title={it.label}
            style={{
              position: "relative",
              flex: oneRowScroll ? "0 0 64px" : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              minWidth: 0,
              padding: "8px 4px 6px",
              borderRadius: "14px",
              border: it.checked ? `2px solid ${accent}` : `1px solid ${line}`,
              background: it.checked ? `color-mix(in srgb, ${accent} 22%, transparent)` : "transparent",
              color: text,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: oneRowScroll ? "22px" : "24px", lineHeight: 1, filter: it.checked ? "none" : "grayscale(0.35)" }}>{it.emoji}</span>
            {/* Los hábitos propios traen su nombre completo: máximo 2
                renglones y el resto se corta con "…". */}
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: it.checked ? 800 : 600,
                lineHeight: 1.15,
                textAlign: "center",
                maxWidth: "100%",
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {it.short}
            </span>
            {it.checked && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-4px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: accent,
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {action("🧹", deskCleared ? th.deskDone : th.desk, onDesk, deskCleared)}
        {action("🚶", th.activeBreak, onBreak, false)}
      </div>
    </div>
  );
}
