import React, { useState } from "react";
import HabitsInfoSheet from "./HabitsInfoSheet";

// Franja "Hoy" debajo de la mascota en Inicio (11 de noviembre de 2026,
// "quisiera que los hábitos estuvieran más a la vista, y también lo de
// fuera de la vista y pausa activa"). Antes los hábitos solo se veían
// entrando a Herramientas → Mi día a día. Ahora, en lo primero que se ve:
//   - Los 4 hábitos del día como botones redondos con emoji y una palabra;
//     un toque los palomea (mismo toggle y mismos XP que en la herramienta).
//   - Dos accesos: "Despejar mi espacio" (abre Modo enfoque, donde está la
//     explicación de "Fuera de la vista") y "Pausa activa".
// Segunda vuelta (mismo día, "no dice para qué sirve, por qué es necesario…
// y eso de cuarto, ¿qué es?"): un renglón que dice qué hacer, nombres más
// claros ("Cuarto listo para dormir"), una frase bajo cada acceso y el
// botón "¿Para qué sirven?" que abre la explicación de cada hábito
// (HabitsInfoSheet.jsx).
// Colores: los de la paleta de Inicio (cambia con la hora y con los temas
// Plus), sobre una pastilla casi opaca para que siempre se lea.
export default function TodayHabitsStrip({ C, t, palette, items, deskCleared, onDesk, onBreak, onAddHabit, isNarrow, isShort, side }) {
  const th = t.todayStrip;
  const [infoOpen, setInfoOpen] = useState(false);
  // Pantalla bajita (celular chico): se omiten los renglones de apoyo para
  // que la franja siga cabiendo; la explicación completa está en el botón.
  const shortScreen = !!(isNarrow && isShort);
  const done = items.filter((it) => it.checked).length;
  // 4 fijos → una fila de 4. Con hábitos propios (5 a 7): en computadora
  // siguen en UNA fila; en el teléfono, dos filas (3+2, 3+3 o 4+3).
  // `side` (computadora): tarjeta angosta a un lado de la brújula, con los
  // hábitos de 2 en 2 y los accesos uno bajo el otro.
  const cols = side ? 2 : items.length <= 4 ? 4 : isNarrow ? Math.ceil(items.length / 2) : items.length;
  const oneRowScroll = shortScreen && items.length > 4;
  const text = palette.text;
  const muted = palette.textMuted || palette.text;
  const accent = palette.accent || "#3F9C82";
  const bg = palette.chipBg || `color-mix(in srgb, ${palette.bg} 84%, transparent)`;
  const line = `color-mix(in srgb, ${text} 16%, transparent)`;

  const action = (emoji, label, sub, onClick, isDone) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: side ? "flex-start" : "center",
        gap: isNarrow ? "6px" : "8px",
        minHeight: shortScreen ? "40px" : "50px",
        padding: isNarrow ? "0 6px" : side ? "0 14px" : "0 12px",
        borderRadius: "14px",
        border: `1px solid ${line}`,
        background: isDone ? `color-mix(in srgb, ${accent} 22%, transparent)` : "transparent",
        color: text,
        fontSize: isNarrow ? "12.5px" : "14px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: isNarrow ? "16px" : "18px" }}>{isDone ? "✅" : emoji}</span>
      <span style={{ minWidth: 0, textAlign: "left" }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {!shortScreen && (
          <span style={{ display: "block", fontSize: "11px", fontWeight: 500, color: muted, overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
        )}
      </span>
    </button>
  );

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "560px",
        margin: "0 auto",
        boxSizing: "border-box",
        padding: shortScreen ? "8px 12px" : isNarrow ? "10px 12px" : side ? "16px" : "14px 18px",
        borderRadius: "20px",
        background: bg,
        border: `1px solid ${line}`,
        color: text,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: side ? "6px 8px" : "4px 8px", marginBottom: shortScreen ? "6px" : side ? "6px" : "2px" }}>
        <span style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap" }}>{th.title}</span>
        {/* Celular bajito: en lugar del contador va el "＋" (las palomitas
            ya se ven en cada botón) para no gastar otro renglón. */}
        {!(shortScreen && onAddHabit) && (
          <span style={{ fontSize: "13px", fontWeight: 700, color: muted, whiteSpace: "nowrap" }}>{th.count(done, items.length)}</span>
        )}
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          style={{
            marginLeft: side ? 0 : "auto",
            minHeight: shortScreen ? "24px" : "30px",
            padding: isNarrow ? "0 6px" : "0 10px",
            borderRadius: "999px",
            border: `1px solid ${line}`,
            background: "transparent",
            color: text,
            fontSize: isNarrow ? "11px" : "12px",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden="true">ⓘ </span>
          {t.habitsInfo.button}
        </button>
        {shortScreen && onAddHabit && (
          <button
            type="button"
            onClick={onAddHabit}
            aria-label={t.app.habits.addHabit}
            title={t.app.habits.addHabit}
            style={{
              width: "26px",
              height: "24px",
              borderRadius: "999px",
              border: `1px solid ${line}`,
              background: "transparent",
              color: text,
              fontSize: "15px",
              fontWeight: 800,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ＋
          </button>
        )}
      </div>
      {!shortScreen && (
        <p style={{ fontSize: "12px", color: muted, margin: isNarrow ? "0 0 8px" : "0 0 10px", lineHeight: 1.35 }}>{th.subtitle}</p>
      )}
      {infoOpen && <HabitsInfoSheet C={C} t={t} onClose={() => setInfoOpen(false)} />}

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
            : { display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "8px", marginBottom: shortScreen ? "6px" : isNarrow ? "8px" : "10px" }
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
              flex: oneRowScroll ? "0 0 70px" : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              minWidth: 0,
              padding: shortScreen ? "6px 4px 5px" : side ? "10px 6px 8px" : "8px 4px 6px",
              borderRadius: "14px",
              border: it.checked ? `2px solid ${accent}` : `1px solid ${line}`,
              background: it.checked ? `color-mix(in srgb, ${accent} 22%, transparent)` : "transparent",
              color: text,
              cursor: "pointer",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: shortScreen ? "22px" : "24px", lineHeight: 1, filter: it.checked ? "none" : "grayscale(0.35)" }}>{it.emoji}</span>
            {/* Los hábitos propios traen su nombre completo: máximo 2
                renglones y el resto se corta con "…". */}
            <span
              style={{
                fontSize: side ? "12.5px" : "11.5px",
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

      <div style={{ display: "flex", flexDirection: side ? "column" : "row", gap: "8px" }}>
        {action("🧹", deskCleared ? th.deskDone : th.desk, th.deskSub, onDesk, deskCleared)}
        {action("🚶", th.activeBreak, th.activeBreakSub, onBreak, false)}
      </div>

      {/* "¿Y dónde agrego más hábitos?" (11 nov 2026): acceso directo desde
          Inicio; abre "Mis hábitos de hoy" con el formulario listo. No
          aparece cuando ya tiene los 3 hábitos propios. */}
      {!shortScreen && onAddHabit && (
        <button
          type="button"
          onClick={onAddHabit}
          style={{
            display: "block",
            width: "100%",
            minHeight: "30px",
            marginTop: "6px",
            background: "transparent",
            border: "none",
            color: text,
            fontSize: "12.5px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ＋ {t.app.habits.addHabit}
        </button>
      )}
    </div>
  );
}
