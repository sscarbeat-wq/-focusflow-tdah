import React from "react";
import { weekMoodSummary, pendingHabits, weekSleepPattern, weekFocusSummary } from "./weeklyInsights";

// `dateKey` viene en formato YYYY-MM-DD en hora local — se construye con
// T00:00:00 para que no se interprete como UTC y "cambie de día". Los
// nombres de día visibles vienen de t.weeklyInsights.dayNames (mismo índice
// que Date#getDay()).
function dayLabel(dateKey, dayNames) {
  const d = new Date(`${dateKey}T00:00:00`);
  return dayNames[d.getDay()];
}

// Resumen semanal — patrones armados con lo que la app ya guarda: ánimo,
// racha y tarro de logros. Nada de esto fabrica datos que el paciente no
// registró; cuando no hay suficiente historial, lo decimos en vez de
// inventar un patrón.
export default function WeeklyInsights({ C, t, moodLog, jar, streak, habits, sleepLog, focusSessionLog }) {
  const mood = weekMoodSummary(moodLog, 7);
  const pending = pendingHabits(habits);
  const sleep = weekSleepPattern(sleepLog, 7);
  const focus = weekFocusSummary(focusSessionLog, 7);
  const showBestWorst = mood.bestDay && mood.worstDay && mood.bestDay.date !== mood.worstDay.date;
  const wi = t.weeklyInsights;
  const wf = wi.focus;
  const maxFocusMinutes = Math.max(1, ...focus.dailyBreakdown.map((d) => d.minutes));

  return (
    <div>
      {mood.loggedDays === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>
          {wi.noMood}
        </p>
      ) : (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: C.text, margin: "0 0 6px", lineHeight: 1.5 }}>
            {wi.moodRegistered(mood.loggedDays)}
            {mood.average != null ? wi.moodAverage(mood.average) : null}.
          </p>
          {showBestWorst && (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
              {wi.bestWorstDay(dayLabel(mood.bestDay.date, wi.dayNames), dayLabel(mood.worstDay.date, wi.dayNames))}
            </p>
          )}
        </div>
      )}

      {/* Racha, mejor racha y logros de la semana ahora van arriba de
          Progreso, en "Tu semana" (ProgressSummary.jsx), para no repetirlos. */}
      <div
        style={{
          marginBottom: "16px",
          borderTop: `1px solid ${C.border}`,
          paddingTop: "14px",
        }}
      >
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{wf.title}</p>
        {focus.sessionsCount === 0 ? (
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{wf.noSessions}</p>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: C.text, margin: "0 0 4px", lineHeight: 1.5 }}>
              {wf.summary(focus.sessionsCount, wf.formatMinutes(focus.totalMinutes))}
              {focus.averageMinutes != null ? wf.average(focus.averageMinutes) : null}
            </p>
            {focus.bestDay && (
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>
                {wf.bestDay(dayLabel(focus.bestDay.date, wi.dayNames), wf.formatMinutes(focus.bestDay.minutes))}
              </p>
            )}
            <div style={{ display: "flex", gap: "6px", marginBottom: focus.totalDistractions > 0 ? "8px" : 0 }}>
              {focus.dailyBreakdown.map(({ date, minutes }) => (
                <div key={date} title={date} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: "40px",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "70%",
                        maxWidth: "28px",
                        height: minutes > 0 ? `${Math.max(6, (minutes / maxFocusMinutes) * 40)}px` : "2px",
                        borderRadius: "4px",
                        background: minutes > 0 ? C.coral : C.border,
                        opacity: minutes > 0 ? 1 : 0.4,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "10px", color: C.textMuted }}>{minutes > 0 ? minutes : "·"}</span>
                </div>
              ))}
            </div>
            {focus.totalDistractions > 0 && (
              <p style={{ fontSize: "11px", color: C.textMuted, margin: 0, lineHeight: 1.4 }}>
                {wf.distractions(focus.totalDistractions)} {wf.distractionsNote}
              </p>
            )}
          </>
        )}
      </div>

      {pending.length > 0 && (
        <div>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 6px", lineHeight: 1.5 }}>
            {wi.pendingHabitsLabel}
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
                {wi.habitLabels[h.key] || h.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tiempo de sueño aproximado: a partir de 2 noches con hora de
          despertar (con una sola no es un "promedio"). */}
      {sleep.duration && sleep.duration.nights >= 2 && (
        <p
          style={{
            fontSize: "13px",
            color: C.text,
            margin: "16px 0 0",
            lineHeight: 1.5,
            borderTop: `1px solid ${C.border}`,
            paddingTop: "12px",
          }}
        >
          😴 {wi.sleepAverage(t.app.habits.formatDuration(sleep.duration.averageMinutes), sleep.duration.nights)}
        </p>
      )}

      {sleep.isPattern && (
        <p
          style={{
            fontSize: "12px",
            color: C.textMuted,
            margin: "16px 0 0",
            lineHeight: 1.5,
            borderTop: `1px solid ${C.border}`,
            paddingTop: "12px",
          }}
        >
          {wi.sleepPattern(sleep.lateNights, sleep.loggedNights)}
        </p>
      )}
    </div>
  );
}
