import React from "react";
import { BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { todayEnergyEntry, recentEnergyEntries } from "./energyLog";

// Check-in de energía — mismo espíritu que MoodLog.jsx pero con 3 niveles en
// vez de 5, porque lo único que importa aquí es poder sugerir qué tipo de
// paso conviene intentar primero (ver TodayPanel), no medir con precisión.
// Los VALUES ("baja"/"media"/"alta") son claves internas fijas que se
// guardan en Supabase y se comparan en otras partes de la app (desglosador,
// TodayPanel) — nunca se traducen; solo la etiqueta visible cambia de
// idioma.
const LEVEL_VALUES = ["baja", "media", "alta"];
const LEVEL_ICONS = { baja: BatteryLow, media: BatteryMedium, alta: BatteryFull };

export default function EnergyLog({ C, t, energyLog, onSave }) {
  const existing = todayEnergyEntry(energyLog);
  const history = recentEnergyEntries(energyLog, 7);
  const labelFor = (value) => ({ baja: t.energyLog.low, media: t.energyLog.medium, alta: t.energyLog.high }[value]);

  const chipStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
    justifyContent: "center",
    background: active ? C.surfaceAlt : "transparent",
    border: `1px solid ${active ? C.border : "transparent"}`,
    borderRadius: "12px",
    padding: "10px 8px",
    cursor: "pointer",
    fontSize: "13px",
    color: active ? C.text : C.textMuted,
  });

  const dotFor = (level) => {
    const label = labelFor(level);
    return label ? label[0] : "·";
  };

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px" }}>
        {existing ? t.energyLog.todayRegistered(labelFor(existing.level)) : t.energyLog.prompt}
      </p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {LEVEL_VALUES.map((value) => {
          const Icon = LEVEL_ICONS[value];
          return (
            <button key={value} onClick={() => onSave(value)} style={chipStyle(existing?.level === value)}>
              <Icon size={18} />
              {labelFor(value)}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        {history.map(({ date, entry }) => (
          <div
            key={date}
            title={date}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 600,
              background: C.surfaceAlt,
              borderRadius: "12px",
              padding: "6px 0",
              color: C.text,
              opacity: entry ? 1 : 0.3,
            }}
          >
            {entry ? dotFor(entry.level) : "·"}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>{t.energyLog.last7Days}</p>
    </div>
  );
}
