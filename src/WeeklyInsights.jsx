import React from "react";
import { weekMoodSummary, weekAchievements, pendingHabits, weekSleepPattern } from "./weeklyInsights";

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
export default function WeeklyInsights({ C, t, moodLog, jar, streak, habits, sleepLog }) {
  const mood = weekMoodSummary(moodLog, 7);
  const achievements = weekAchievements(jar, 7);
  const pending = pendingHabits(habits);
  const sleep = weekSleepPattern(sleepLog, 7);
  const showBestWorst = mood.bestDay && mood.worstDay && mood.bestDay.date !== mood.worstDay.date;
  const wi = t.weeklyInsights;

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

      <div style={{ display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>{streak?.current ?? 0}</p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>{wi.currentStreak}</p>
        </div>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>{streak?.longest ?? 0}</p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>{wi.bestStreak}</p>
        </div>
        <div>
          <p style={{ fontSize: "22px", fontWeight: 700, color: C.amber, margin: 0 }}>
            {achievements.count}
            {achievements.capped ? "+" : ""}
          </p>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: 0 }}>
            {wi.achievementsThisWeek(achievements.count)}
          </p>
        </div>
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
