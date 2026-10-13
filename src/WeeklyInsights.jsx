import React from "react";
import { weekMoodSummary, weekAchievements, pendingHabits } from "./weeklyInsights";

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// `dateKey` viene en formato YYYY-MM-DD en hora local — se construye con
// T00:00:00 para que no se interprete como UTC y "cambie de día".
function dayLabel(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return DAY_NAMES[d.getDay()];
}

// Resumen semanal — patrones armados con lo que la app ya guarda: ánimo,
// racha y tarro de logros. Nada de esto fabrica datos que el paciente no
// registró; cuando no hay suficiente historial, lo decimos en vez de
// inventar un patrón.
export default function WeeklyInsights({ C, moodLog, jar, streak, habits }) {
  const mood = weekMoodSummary(moodLog, 7);
  const achievements = weekAchievements(jar, 7);
  const pending = pendingHabits(habits);
  const showBestWorst = mood.bestDay && mood.worstDay && mood.bestDay.date !== mood.worstDay.date;

  return (
    <div>
      {mood.loggedDays === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
          Todavía no hay suficientes registros de ánimo esta semana para ver un patrón — en cuanto
          registres un par de días vas a ver aquí tu mejor y tu peor momento.
        </p>
      ) : (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: C.text, margin: "0 0 6px", lineHeight: 1.5 }}>
            Registraste tu ánimo <strong>{mood.loggedDays}</strong> de los últimos 7 días
            {mood.average != null ? (
              <>
                {" "}
                — promedio <strong>{mood.average}/5</strong>
              </>
            ) : null}
            .
          </p>
          {showBestWorst && (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
              Tu mejor día fue el <strong>{dayLabel(mood.bestDay.date)}</strong>; el que más te costó
              fue el <strong>{dayLabel(mood.worstDay.date)}</strong>.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>{streak?.current ?? 0}</p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>racha actual</p>
        </div>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>{streak?.longest ?? 0}</p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>mejor racha</p>
        </div>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>
            {achievements.count}
            {achievements.capped ? "+" : ""}
          </p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>
            logro{achievements.count === 1 ? "" : "s"} esta semana
          </p>
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 6px", lineHeight: 1.5 }}>
            Hábitos de autocuidado pendientes ahora mismo:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {pending.map((h) => (
              <span
                key={h.key}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: "20px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: C.textMuted,
                }}
              >
                {h.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
