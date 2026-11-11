import React from "react";
import { Award } from "lucide-react";
import { tint } from "./theme";
import { weekAchievements, weekFocusSummary } from "./weeklyInsights";

// "Tu semana" — lo primero de la pestaña Progreso (11 de noviembre
// de 2026, "no me gusta cómo se ve"). Antes los números de racha y logros
// vivían escondidos a media tarjeta de Insights (que además es de Plus) y
// el Tarro de logros era una franja suelta con otro estilo. Ahora lo
// primero que se ve al entrar a Progreso son 4 números grandes y el tarro,
// en una sola tarjeta. Son datos que la paciente ya registró — nada nuevo
// ni calculado con IA — por eso se ven con o sin Plus.
export default function ProgressSummary({ C, t, jar, streak, focusSessionLog, isNarrow }) {
  const wi = t.weeklyInsights;
  const achievements = weekAchievements(jar, 7);
  const focus = weekFocusSummary(focusSessionLog, 7);
  const recentJar = (jar || []).slice(0, 12); // el más nuevo va primero

  const stats = [
    { emoji: "🔥", value: streak?.current ?? 0, label: wi.currentStreak, color: C.coral },
    { emoji: "🏆", value: streak?.longest ?? 0, label: wi.bestStreak, color: C.amber },
    { emoji: "⭐", value: `${achievements.count}${achievements.capped ? "+" : ""}`, label: wi.achievementsThisWeek(achievements.count), color: C.lavender },
    { emoji: "⏱️", value: wi.focus.formatMinutes(focus.totalMinutes), label: t.progressSummary.focusLabel, color: C.sky },
  ];

  // Segunda versión (mismo día, "son demasiados cuadros"): sin tarjeta
  // propia y sin un cuadro por número — los 4 números van en una fila,
  // separados por una línea fina, dentro de la única tarjeta de "Mi semana".
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
          rowGap: "16px",
          marginBottom: "18px",
        }}
      >
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "0 14px",
              borderLeft: (isNarrow ? i % 2 : i) === 0 ? "none" : `1px solid ${C.border}`,
              paddingLeft: (isNarrow ? i % 2 : i) === 0 ? 0 : "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span aria-hidden="true" style={{ fontSize: "17px" }}>{s.emoji}</span>
              <span style={{ fontSize: "24px", fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{s.value}</span>
            </div>
            <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "3px", lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <Award size={15} color={C.lavender} />
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t.app.jarLabel}</span>
      </div>
      {recentJar.length === 0 ? (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{t.app.jarEmpty}</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {recentJar.map((j) => (
            <span
              key={j.id}
              style={{
                background: tint(C.lavender, 0.14),
                borderRadius: "20px",
                padding: "5px 12px",
                fontSize: "12px",
                color: C.text,
              }}
            >
              {j.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
