import React from "react";
import { todayTimelineItems, groupByDayPart } from "./dayTimeline";

// Línea de tiempo visual de HOY — a qué hora pasó cada cosa que hiciste en
// Senda, agrupada por momento del día, en vez de una lista plana. Pensada
// para "sentir" cómo se fue el día, no para planear nada: por eso solo
// muestra lo que de verdad ya pasó.
export default function DayTimelinePanel({ C, t, jar }) {
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
        <div key={group.key} style={{ marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "12px",
              color: C.textMuted,
              margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {t.dayTimeline.dayParts[group.key] || group.label}
          </p>
          {group.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "8px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: C.amber,
                    flexShrink: 0,
                    marginTop: "4px",
                  }}
                />
                {i < group.items.length - 1 && (
                  <div style={{ width: "1px", flex: 1, background: C.border, minHeight: "18px" }} />
                )}
              </div>
              <div style={{ paddingBottom: "14px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    color: C.textMuted,
                    margin: "0 0 2px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.time}
                </p>
                <p style={{ fontSize: "13px", color: C.text, margin: 0 }}>{item.label}</p>
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
