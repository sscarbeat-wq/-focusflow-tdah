import React, { useState } from "react";
import { BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { todayEnergyEntry, recentEnergyEntries } from "./energyLog";
import { tint } from "./theme";

// Check-in de energía — mismo espíritu que MoodLog.jsx pero con 3 niveles en
// vez de 5, porque lo único que importa aquí es poder sugerir qué tipo de
// paso conviene intentar primero (ver TodayPanel), no medir con precisión.
// Los VALUES ("baja"/"media"/"alta") son claves internas fijas que se
// guardan en Supabase y se comparan en otras partes de la app (desglosador,
// TodayPanel) — nunca se traducen; solo la etiqueta visible cambia de
// idioma.
//
// 25 de noviembre de 2026 ("esto de la energía también, hazle otro diseño,
// explica para que sirve, hazlo bonito"): antes eran 3 botones planos sin
// color propio y, debajo, una tira de cuadros grises con solo la inicial de
// la etiqueta ("B" tanto de "Baja" como de una futura "Buena" — ambiguo) —
// no se entendía nada a simple vista. Ahora:
// 1) t.energyLog.intro explica arriba, en una frase, para qué sirve esto en
//    concreto (alimenta el desglosador).
// 2) Cada nivel tiene su propio color — mismo criterio semáforo que ya se
//    usa en el desglosador para las etiquetas de energía de los pasos
//    (ver FocusFlowTDAH.jsx ~línea 5220): rose = baja, amber = media,
//    mint = alta — y un pequeño "pop" al elegirlo.
// 3) El historial de "últimos 7 días" pasa a ser una gráfica de barras por
//    color (mismo patrón que la tira de MoodLog.jsx) en vez de letras
//    sueltas, con la inicial del día de la semana debajo.
const LEVEL_VALUES = ["baja", "media", "alta"];
const LEVEL_ICONS = { baja: BatteryLow, media: BatteryMedium, alta: BatteryFull };
const LEVEL_COLOR_KEYS = { baja: "rose", media: "amber", alta: "mint" };
const LEVEL_HEIGHT_PCT = { baja: 34, media: 67, alta: 100 };

const WEEKDAY_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function weekdayInitial(dateKey, lang) {
  // dateKey es "YYYY-MM-DD" — se arma con mediodía local para no cruzar de
  // día por un corrimiento de huso horario al convertir a Date (mismo
  // truco que MoodLog.jsx).
  const d = new Date(`${dateKey}T12:00:00`);
  const label = d.toLocaleDateString(WEEKDAY_LOCALES[lang] || WEEKDAY_LOCALES.es, { weekday: "short" });
  return label.replace(".", "").slice(0, 1).toUpperCase();
}

export default function EnergyLog({ C, t, lang, energyLog, onSave }) {
  const existing = todayEnergyEntry(energyLog);
  const history = recentEnergyEntries(energyLog, 7);
  const [pulse, setPulse] = useState(0);
  const labelFor = (value) => ({ baja: t.energyLog.low, media: t.energyLog.medium, alta: t.energyLog.high }[value]);
  const colorFor = (value) => C[LEVEL_COLOR_KEYS[value]];

  const handlePick = (value) => {
    onSave(value);
    // Siempre cambia, incluso si ya era el mismo nivel elegido, para que el
    // "pop" se repita cada vez que se toca (igual criterio que
    // MoodLog.jsx: el gesto se repite, no solo la primera vez).
    setPulse((p) => p + 1);
  };

  const chipStyle = (value) => {
    const active = existing?.level === value;
    const color = colorFor(value);
    return {
      display: "flex",
      alignItems: "center",
      gap: "7px",
      flex: 1,
      justifyContent: "center",
      background: active ? tint(color, 0.22) : C.surfaceAlt,
      border: `2px solid ${active ? color : "transparent"}`,
      borderRadius: "14px",
      padding: active ? "9px 7px" : "11px 8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: active ? 700 : 500,
      color: active ? C.text : C.textMuted,
      transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
      transform: active ? "translateY(-2px)" : "none",
    };
  };

  return (
    <div>
      <style>{`
        @keyframes anroEnergyPick {
          0% { transform: scale(0.8); }
          55% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .anro-energy-pick { animation: anroEnergyPick 0.4s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .anro-energy-pick { animation: none !important; }
        }
      `}</style>

      <p style={{ fontSize: "12.5px", color: C.textMuted, lineHeight: 1.5, margin: "0 0 12px" }}>{t.energyLog.intro}</p>

      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px" }}>
        {existing ? t.energyLog.todayRegistered(labelFor(existing.level)) : t.energyLog.prompt}
      </p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {LEVEL_VALUES.map((value) => {
          const Icon = LEVEL_ICONS[value];
          const active = existing?.level === value;
          return (
            <button key={value} type="button" onClick={() => handlePick(value)} style={chipStyle(value)}>
              <span
                key={active ? `pick-${pulse}` : "idle"}
                className={active ? "anro-energy-pick" : ""}
                style={{ display: "flex" }}
              >
                <Icon size={18} color={active ? colorFor(value) : undefined} />
              </span>
              {labelFor(value)}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "6px", height: "56px" }}>
        {history.map(({ date, entry }) => {
          const isToday = date === history[history.length - 1].date;
          const color = entry?.level ? colorFor(entry.level) : null;
          const heightPct = entry?.level ? LEVEL_HEIGHT_PCT[entry.level] : 14;
          return (
            <div key={date} title={date} style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "100%" }}>
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  minHeight: "10px",
                  borderRadius: "6px",
                  background: color ? color : "transparent",
                  border: !color ? `1px dashed ${C.border}` : isToday ? `2px solid ${C.text}` : "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
        {history.map(({ date }) => (
          <div key={date} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: C.textMuted, fontWeight: 600 }}>
            {weekdayInitial(date, lang)}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>{t.energyLog.last7Days}</p>
    </div>
  );
}
