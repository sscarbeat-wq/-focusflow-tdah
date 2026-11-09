import React from "react";
import { Clock, Pencil } from "lucide-react";
import { tint } from "./theme";

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
export default function HomeHeader({ C, t, palette, period, nextBlock, nowMinutes, onEditClick }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          {showBanner && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: tint(palette.accent, 0.1),
                borderLeft: `3px solid ${palette.accent2}`,
                borderRadius: "10px",
                padding: "8px 12px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Clock size={14} color={palette.accent2} aria-hidden="true" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: palette.text }}>
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
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: palette.text }}>{greeting}</span>
        <div style={{ fontSize: "12px", color: palette.textMuted, fontStyle: "italic", marginTop: "4px" }}>
          "{t.today.motivationalQuote}"
        </div>
      </div>
    </div>
  );
}
