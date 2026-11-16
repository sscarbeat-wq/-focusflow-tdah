import React from "react";
import { Clock, Pencil } from "lucide-react";
import { tint } from "./theme";
import { bodyDoublePresenceText, bodyDoubleHintText } from "./bodyDoublePure";

// Encabezado de Inicio del mockup "Opción K" (9 de noviembre de 2026):
// aviso de la próxima actividad de la agenda (si hay una cerca) + saludo
// según la hora + frase motivacional.
//
// El mockup mostraba un ejemplo fijo ("Tu cita con el psiquiatra es en 20
// min") — pero esta app, como el resto del código recuerda en
// todayView.js, "nunca inventa un pendiente que no pueda respaldar con
// datos reales": no hay ningún dato de "cita con el psiquiatra" en
// ninguna parte (scheduleBlocks.js guarda bloques genéricos de agenda,
// calendarSync.js solo EMPUJA eventos a Google Calendar, nunca los lee de
// vuelta). Por eso este aviso usa el bloque de agenda real más próximo de
// HOY, con su texto real (lo que la paciente haya escrito al crearlo —
// que puede perfectamente ser "Cita con el psiquiatra" si así lo anotó
// ella misma) y el tiempo real que falta — nunca el ejemplo del mockup
// tal cual. Si no hay ningún bloque dentro de la próxima hora y media, no
// se muestra nada (en vez de un aviso vacío o inventado).
const UPCOMING_WINDOW_MIN = 120;

// `onEditClick` (9 de noviembre de 2026 — botón "✏️ Editar" del mockup
// original, ver CompassEditSheet.jsx): opcional, así este encabezado sigue
// funcionando igual si algún día se usa sin brújula editable debajo.
export default function HomeHeader({ C, t, palette, period, nextBlock, nowMinutes, onEditClick, bodyDouble, onOpenBodyDouble }) {
  const greeting =
    period === "morning"
      ? t.today.greetingMorning
      : period === "afternoon"
      ? t.today.greetingAfternoon
      : t.today.greetingNight;

  const minutesUntil = nextBlock ? nextBlock.startMin - nowMinutes : null;
  const showBanner = nextBlock && minutesUntil != null && minutesUntil <= UPCOMING_WINDOW_MIN;

  return (
    <div style={{ padding: "4px 4px 0" }}>
      {(showBanner || onEditClick) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            // En el teléfono más angosto, con el aviso ya más grande, el
            // botón "Editar" lo apretaba a 4 renglones — ahora, si no caben
            // los dos, "Editar" baja a su propio renglón (a la derecha) y el
            // aviso usa todo el ancho.
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {showBanner && (
            // 10 de noviembre de 2026 ("las de los avisos también más
            // grandes"): 12px→15px de letra y 14→17 el ícono del reloj.
            // Misma fecha, después — jerarquía: lo único ACCIONABLE de esta
            // pantalla (qué viene ahorita) era una franja tenue, mientras
            // lo decorativo (la mascota) se llevaba toda la atención. Para
            // alguien con dificultades de función ejecutiva lo que tiene
            // que hacer ya debe ser lo que más resalta: ahora es una
            // tarjeta con fondo de color, borde y sombra, el ícono dentro
            // de su propio círculo de color, y la letra en negrita. Sin
            // inventar datos ni acciones nuevas: el texto es el mismo.
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: `linear-gradient(135deg, ${tint(palette.accent2, 0.3)} 0%, ${tint(palette.accent2, 0.16)} 100%)`,
                border: `1.5px solid ${tint(palette.accent2, 0.6)}`,
                borderLeft: `6px solid ${palette.accent2}`,
                borderRadius: "14px",
                padding: "12px 16px",
                boxShadow: `0 6px 18px ${tint(palette.accent2, 0.25)}`,
                flex: "1 1 260px",
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: palette.accent2,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                }}
              >
                <Clock size={18} />
              </span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: palette.text, lineHeight: 1.3 }}>
                {t.today.upcomingBlockBanner(nextBlock.text, minutesUntil)}
              </span>
            </div>
          )}
          {onEditClick && (
            <button
              onClick={onEditClick}
              aria-label={t.today.editCompassTitle}
              title={t.today.editCompassTitle}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "transparent",
                border: `1px solid ${tint(palette.text, 0.25)}`,
                borderRadius: "10px",
                padding: "7px 10px",
                color: palette.text,
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
                marginLeft: showBanner ? 0 : "auto",
              }}
            >
              <Pencil size={13} aria-hidden="true" />
              {t.today.editCompassButton}
            </button>
          )}
        </div>
      )}
      {/* 12 de noviembre de 2026: la frase motivacional rota por día
          del mes (30 frases). `motivationalQuotes` es un array; se mantiene
          compatibilidad con el string anterior por si algún idioma no se
          actualizó aún. */}
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: palette.text }}>{greeting}</span>
        <div style={{ fontSize: "12px", color: palette.textMuted, fontStyle: "italic", marginTop: "4px" }}>
          "{(() => {
            const quotes = t.today.motivationalQuotes;
            if (Array.isArray(quotes) && quotes.length > 0) {
              return quotes[new Date().getDate() % quotes.length];
            }
            return t.today.motivationalQuote || "";
          })()}"
        </div>
        {/* 16 de noviembre de 2026 ("solo quiero que quede esteeee"): el
            chip con los avatares de quién está en el Cuerpo doble virtual
            AHORA MISMO, junto al saludo. Pasó por varios lugares (pestaña
            aparte debajo de hábitos, acceso dentro de "Mis hábitos") y
            este chip terminó siendo la única entrada. No hace falta
            unirse para ver quién hay (bodyDouble.js escucha presencia
            desde que existe esta pantalla); tocar el chip lleva a la
            tarjeta real en Herramientas (ver onOpenBodyDouble en
            FocusFlowTDAH.jsx). Opcional: si no se pasan
            `bodyDouble`/`onOpenBodyDouble`, no se pinta nada (mismo
            patrón que onEditClick arriba). */}
        {bodyDouble && onOpenBodyDouble && (() => {
          const bd = t.bodyDouble;
          const participants = bodyDouble.participants || [];
          const count = participants.length;
          const joined = bodyDouble.joined;
          const statusText = bodyDoublePresenceText(bd, joined, count);
          const hintText = bodyDoubleHintText(bd, joined, count);
          const shownAvatars = participants.slice(0, 4);
          const extra = count - shownAvatars.length;
          return (
            <button
              type="button"
              onClick={onOpenBodyDouble}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                background: palette.chipBg || `color-mix(in srgb, ${palette.bg} 90%, transparent)`,
                border: `1px solid color-mix(in srgb, ${palette.text} 18%, transparent)`,
                borderRadius: "22px",
                padding: count > 0 ? "6px 14px 6px 8px" : "6px 14px",
                cursor: "pointer",
              }}
            >
              {count > 0 ? (
                <span style={{ display: "flex" }}>
                  {shownAvatars.map((p, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: C.surfaceAlt,
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        marginLeft: i === 0 ? 0 : "-8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                      }}
                    >
                      {p.avatar}
                    </span>
                  ))}
                  {extra > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: C.surfaceAlt,
                        border: "2px solid #fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        marginLeft: "-8px",
                        color: palette.textMuted,
                      }}
                    >
                      +{extra}
                    </span>
                  )}
                </span>
              ) : (
                <span aria-hidden="true" style={{ fontSize: "18px" }}>🧑‍🤝‍🧑</span>
              )}
              <span style={{ textAlign: "left" }}>
                <span style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: palette.text }}>{bd.tabTitle}</span>
                <span style={{ display: "block", fontSize: "10.5px", fontWeight: 700, color: count > 0 ? (palette.accent || "#2E7FD9") : palette.textMuted }}>
                  {statusText}
                  {hintText ? ` · ${hintText}` : ""}
                </span>
              </span>
            </button>
          );
        })()}
      </div>
    </div>
  );
}
