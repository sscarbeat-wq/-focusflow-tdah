import React, { useState } from "react";
import HabitsInfoSheet from "./HabitsInfoSheet";

// Pestaña "Mis hábitos" de Inicio.
//
// Historia (11 y 12 de noviembre de 2026): empezó como una franja fija
// debajo de la mascota ("quisiera que los hábitos estuvieran más a la
// vista"); luego se le agregó poder arrastrarla y ocultarla; y la doctora
// propuso algo más simple: "como una pestaña que pueda ocultarse". Así
// quedó:
//   - Teléfono: una pestaña abajo, pegada a la barra de Inicio/Agenda…
//     Al tocarla el cuadro sube; al tocarla otra vez, baja.
//   - Computadora (`side`): la pestaña va pegada al borde derecho de la
//     pantalla y saca el cuadro hacia adentro.
//   - Cerrada sigue mostrando el contador ("1 de 4").
//   - Recuerda cómo se dejó (localStorage, por dispositivo). La primera
//     vez aparece abierta, para que se descubra.
// Adentro: los hábitos del día para palomear con un toque (mismo toggle y
// mismos XP que en "Mis hábitos de hoy"), "Despejar espacio", "Pausa
// activa" y tres enlaces: "¿Para qué sirven?", "Agregar" y "Ver todo".
// Colores: los de la paleta de Inicio (cambia con la hora y con los temas
// Plus), sobre un fondo casi opaco para que siempre se lea.
const OPEN_KEY = "anro-habits-tab-open";

function readOpen() {
  try {
    return window.localStorage.getItem(OPEN_KEY) !== "0";
  } catch (e) {
    return true;
  }
}

export default function TodayHabitsStrip({ C, t, palette, items, deskCleared, onDesk, onBreak, onAddHabit, onOpenAll, isNarrow, isShort, side }) {
  const th = t.todayStrip;
  const [infoOpen, setInfoOpen] = useState(false);
  const [open, setOpen] = useState(() => typeof window === "undefined" || readOpen());
  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch (e) {
      /* solo no se recuerda */
    }
  };

  // Pantalla bajita (celular chico): se omiten los renglones de apoyo para
  // que el cuadro siga cabiendo; la explicación completa está en el enlace.
  const shortScreen = !!(isNarrow && isShort);
  const done = items.filter((it) => it.checked).length;
  // 4 fijos → una fila de 4. Con hábitos propios (5 a 7): dos filas en el
  // teléfono (3+2, 3+3 o 4+3). `side` (computadora): de 2 en 2.
  const cols = side ? 2 : items.length <= 4 ? 4 : isNarrow ? Math.ceil(items.length / 2) : items.length;
  const oneRowScroll = shortScreen && items.length > 4;
  // Accesos sin su renglón de apoyo: celular bajito, o teléfono con
  // hábitos propios (dos filas), para que todo quepa sin bajar la pantalla.
  const compactActions = shortScreen || (isNarrow && items.length > 4);
  const text = palette.text;
  const muted = palette.textMuted || palette.text;
  const accent = palette.accent || "#3F9C82";
  const bg = palette.chipBg || `color-mix(in srgb, ${palette.bg} 90%, transparent)`;
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
        minHeight: shortScreen ? "36px" : compactActions ? "40px" : "50px",
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
        {!compactActions && (
          <span style={{ display: "block", fontSize: "11px", fontWeight: 500, color: muted, overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
        )}
      </span>
    </button>
  );

  const link = (label, onClick, key) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        minHeight: shortScreen ? "24px" : "32px",
        padding: "0 2px",
        background: "transparent",
        border: "none",
        color: text,
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  // ---- La pestaña (siempre visible) ----
  const tabLabel = (
    <>
      <span aria-hidden="true">🌱</span>
      <span>{th.tabTitle}</span>
      <span style={{ fontWeight: 700, color: muted }}>{th.count(done, items.length)}</span>
    </>
  );
  const tabButton = side ? (
    // Computadora: pestaña vertical pegada al borde derecho de la pantalla.
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-label={open ? th.closeAria : th.openAria}
      title={open ? th.closeAria : th.openAria}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "14px 9px",
        border: `1px solid ${line}`,
        borderRight: open ? `1px solid ${line}` : "none",
        borderRadius: "14px 0 0 14px",
        marginRight: open ? "-1px" : 0,
        background: bg,
        color: text,
        fontSize: "13.5px",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: "-3px 3px 12px rgba(0,0,0,0.12)",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "13px" }}>{open ? "›" : "‹"}</span>
      <span aria-hidden="true" style={{ fontSize: "18px" }}>🌱</span>
      <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
        {th.tabTitle} <span style={{ fontWeight: 700, color: muted }}>· {th.count(done, items.length)}</span>
      </span>
    </button>
  ) : (
    // Teléfono: pestaña arriba del cuadro, centrada.
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-label={open ? th.closeAria : th.openAria}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        minHeight: shortScreen ? "30px" : "38px",
        padding: "0 16px",
        border: `1px solid ${line}`,
        borderBottom: "none",
        borderRadius: "16px 16px 0 0",
        marginBottom: "-1px",
        position: "relative",
        zIndex: 1,
        background: bg,
        color: text,
        fontSize: "13.5px",
        fontWeight: 800,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {tabLabel}
      <span aria-hidden="true" style={{ fontSize: "12px", marginLeft: "2px" }}>{open ? "▾" : "▴"}</span>
    </button>
  );

  // ---- El cuadro (solo abierto) ----
  const panel = open && (
    <div
      style={{
        width: side ? "300px" : "100%",
        boxSizing: "border-box",
        padding: shortScreen ? "8px 12px 2px" : isNarrow ? "10px 12px 2px" : "14px 16px 6px",
        borderRadius: side ? "0 0 0 18px" : "18px 18px 0 0",
        background: bg,
        border: `1px solid ${line}`,
        borderRight: side ? "none" : `1px solid ${line}`,
        borderBottom: side ? `1px solid ${line}` : "none",
        boxShadow: side ? "-3px 3px 12px rgba(0,0,0,0.12)" : "none",
        color: text,
        textAlign: "left",
      }}
    >
      {/* En el teléfono, con hábitos propios (dos filas) se omite este
          renglón para que el cuadro siga cabiendo sin bajar la pantalla. */}
      {!shortScreen && !(isNarrow && items.length > 4) && (
        <p style={{ fontSize: "12px", color: muted, margin: isNarrow ? "0 0 8px" : "0 0 10px", lineHeight: 1.35 }}>{th.subtitle}</p>
      )}

      <div
        role="group"
        aria-label={th.title}
        style={
          oneRowScroll
            ? {
                // Celular bajito con hábitos propios: una sola fila que se
                // desliza de lado (el siguiente se asoma).
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                padding: "7px 4px 4px 0",
                margin: "-7px 0 4px",
                scrollbarWidth: "none",
              }
            : { display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "8px", marginBottom: shortScreen ? "5px" : isNarrow ? "8px" : "10px" }
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

      {/* Enlaces: la explicación, agregar un hábito propio (no aparece si
          ya tiene los 3) y la pantalla completa ("Mis hábitos de hoy": ahí
          están el registro de sueño y el lápiz para editar). */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0 8px", marginTop: shortScreen ? "2px" : "4px" }}>
        {link(`ⓘ ${t.habitsInfo.button}`, () => setInfoOpen(true), "info")}
        {onAddHabit && link(`＋ ${th.addShort}`, onAddHabit, "add")}
        {onOpenAll && link(`${th.openAll} ›`, onOpenAll, "all")}
      </div>
    </div>
  );

  return (
    <>
      {infoOpen && <HabitsInfoSheet C={C} t={t} onClose={() => setInfoOpen(false)} />}
      {side ? (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
          {tabButton}
          {panel}
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          {tabButton}
          {panel}
        </div>
      )}
    </>
  );
}
