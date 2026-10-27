import React from "react";
import { todayTimelineItems, groupByDayPart } from "./dayTimeline";

// Línea de tiempo visual de HOY — a qué hora pasó cada cosa que hiciste en
// Senda, agrupada por momento del día, en vez de una lista plana. Pensada
// para "sentir" cómo se fue el día, no para planear nada: por eso solo
// muestra lo que de verdad ya pasó.
// Rediseño del 26 de octubre de 2026: puntos y línea más grandes, usando el
// acento personal de la paciente en vez del ámbar fijo de antes, y cada
// entrada como una tarjetita con fondo suave en vez de texto plano. Nota
// honesta sobre el alcance de este cambio: el tarro de logros guarda cada
// entrada como un solo texto ya traducido (`grantXp(label)`), sin ninguna
// categoría asociada — así que, a diferencia del resto de los paneles, acá
// NO se puede dar un color distinto por tipo de acción (medicamento,
// ánimo, etc.) sin antes agregar esa etiqueta en cada uno de los lugares
// de la app que llaman a `grantXp`, que son muchos. Queda pendiente como
// una ronda aparte si se decide que vale la pena.
export default function DayTimelinePanel({ C, t, jar, accent }) {
  const dotColor = accent || C.lavender;
  const { items, capped } = todayTimelineItems(jar);
  const groups = groupByDayPart(items).filter((g) => g.items.length > 0);

  if (items.length === 0) {
    return (
      <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
        {t.dayTimeline.empty}
      </p>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.key} style={{ marginBottom: "18px" }}>
          <p
            style={{
              fontSize: "12px",
              color: C.textMuted,
              margin: "0 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              fontWeight: 700,
            }}
          >
            {t.dayTimeline.dayParts[group.key] || group.label}
          </p>
          {group.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "10px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                    marginTop: "6px",
                  }}
                />
                {i < group.items.length - 1 && (
                  <div style={{ width: "2px", flex: 1, background: C.border, borderRadius: "1px", minHeight: "18px" }} />
                )}
              </div>
              <div style={{ paddingBottom: "12px", flex: 1 }}>
                <div
                  style={{
                    background: C.surfaceAlt,
                    borderRadius: "14px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <p style={{ fontSize: "13px", color: C.text, margin: 0 }}>{item.label}</p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: C.textMuted,
                      margin: 0,
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                    }}
                  >
                    {item.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
      {capped && (
        <p style={{ fontSize: "11px", color: C.textMuted, margin: "4px 0 0" }}>
          {t.dayTimeline.cappedNote}
        </p>
      )}
    </div>
  );
}
