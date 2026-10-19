import React from "react";
import { BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { todayEnergyEntry, recentEnergyEntries } from "./energyLog";

// Check-in de energía — mismo espíritu que MoodLog.jsx pero con 3 niveles en
// vez de 5, porque lo único que importa aquí es poder sugerir qué tipo de
// paso conviene intentar primero (ver TodayPanel), no medir con precisión.
const LEVELS = [
  { value: "baja", Icon: BatteryLow, label: "Baja" },
  { value: "media", Icon: BatteryMedium, label: "Media" },
  { value: "alta", Icon: BatteryFull, label: "Alta" },
];

export default function EnergyLog({ C, energyLog, onSave }) {
  const existing = todayEnergyEntry(energyLog);
  const history = recentEnergyEntries(energyLog, 7);

  const chipStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
    justifyContent: "center",
    background: active ? C.surfaceAlt : "transparent",
    border: `1px solid ${active ? C.border : "transparent"}`,
    borderRadius: "8px",
    padding: "10px 8px",
    cursor: "pointer",
    fontSize: "13px",
    color: active ? C.text : C.textMuted,
  });

  const dotFor = (level) => {
    const l = LEVELS.find((x) => x.value === level);
    return l ? l.label[0] : "·";
  };

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px" }}>
        {existing ? `Hoy registraste: energía ${existing.level}.` : "¿Cómo está tu energía ahora mismo?"}
      </p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {LEVELS.map(({ value, Icon, label }) => (
          <button key={value} onClick={() => onSave(value)} style={chipStyle(existing?.level === value)}>
            <Icon size={18} />
            {label}
          </button>
        ))}
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
              borderRadius: "6px",
              padding: "6px 0",
              color: C.text,
              opacity: entry ? 1 : 0.3,
            }}
          >
            {entry ? dotFor(entry.level) : "·"}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>Últimos 7 días</p>
    </div>
  );
}
