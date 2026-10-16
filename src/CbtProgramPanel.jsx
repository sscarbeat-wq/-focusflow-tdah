import React from "react";
import { CheckCircle2 } from "lucide-react";
import { LESSONS, programStatus } from "./cbtProgram";

// Programa breve de TCC — una lección corta al día, mismo principio que
// Inflow (un currículum que se recorre poco a poco, no un libro de un
// jalón). A diferencia de las herramientas sueltas que ya tiene Senda
// (desglosador, freno de impulsividad, respiración, reestructuración), esto
// es contenido progresivo: cada día desbloquea la siguiente lección, nunca
// antes.
export default function CbtProgramPanel({ C, program, onComplete }) {
  const status = programStatus(program);

  const progressBar = (
    <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
      {LESSONS.map((lesson, i) => (
        <div
          key={lesson.id}
          title={lesson.title}
          style={{
            flex: 1,
            height: "6px",
            borderRadius: "3px",
            background: i < status.completedCount ? C.lavenderDark : C.surfaceAlt,
          }}
        />
      ))}
    </div>
  );

  if (status.finished) {
    return (
      <div>
        {progressBar}
        <p style={{ fontSize: "14px", color: C.text, margin: "0 0 12px" }}>
          Completaste las {status.total} lecciones de la Semana 1 🎉 Puedes repasarlas cuando quieras.
        </p>
        <div>
          {LESSONS.map((lesson) => (
            <div key={lesson.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0" }}>
              <CheckCircle2 size={15} color={C.lavenderDark} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: "13px", color: C.textMuted }}>{lesson.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { nextLesson, availableNow, completedCount, total } = status;

  if (!availableNow) {
    return (
      <div>
        {progressBar}
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 4px" }}>
          Lección {completedCount} de {total} completada hoy.
        </p>
        <p style={{ fontSize: "14px", color: C.text, margin: 0 }}>
          Vuelve mañana para "{nextLesson.title}" — una lección al día, para que de verdad se asiente.
        </p>
      </div>
    );
  }

  return (
    <div>
      {progressBar}
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px" }}>
        Día {nextLesson.day} de {total} · {nextLesson.minutes} min de lectura
      </p>
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: C.text, margin: "0 0 10px" }}>{nextLesson.title}</h3>
      {nextLesson.body.map((paragraph, i) => (
        <p key={i} style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
          {paragraph}
        </p>
      ))}
      <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "10px 12px", marginBottom: "14px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: C.textMuted,
            margin: "0 0 4px",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          Para hoy
        </p>
        <p style={{ fontSize: "13px", color: C.text, margin: 0, lineHeight: 1.5 }}>{nextLesson.exercise}</p>
      </div>
      <button
        onClick={() => onComplete(nextLesson.id, nextLesson.title)}
        style={{
          background: C.lavenderDark,
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          color: "#fff",
          fontWeight: 600,
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        Marcar como completada
      </button>
    </div>
  );
}
