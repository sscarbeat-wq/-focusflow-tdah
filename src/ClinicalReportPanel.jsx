import React from "react";
import { Printer } from "lucide-react";
import { buildClinicalReport, CLINICAL_REPORT_DAYS } from "./clinicalReport";

const DATE_FMT = { day: "2-digit", month: "2-digit", year: "numeric" };

function formatDate(isoOrKey) {
  // Acepta tanto un ISO completo (generatedAt) como un YYYY-MM-DD (dateKey).
  const d = isoOrKey.length === 10 ? new Date(`${isoOrKey}T00:00:00`) : new Date(isoOrKey);
  return d.toLocaleDateString("es-MX", DATE_FMT);
}

// Vista de solo lectura, pensada para imprimirse o mostrarse en pantalla
// durante la consulta — nunca pide nada nuevo, solo junta lo que Senda ya
// tiene guardado de los últimos 14 días. Sin IA: es agregación pura, el
// mismo principio que ya usan los Insights semanales y la vista "Hoy".
export default function ClinicalReportPanel({
  C,
  moodLog,
  energyLog,
  medications,
  medicationDoseLog,
  habits,
  streak,
  sleepLog,
  impulseBrakeLog,
}) {
  const report = buildClinicalReport({
    moodLog,
    energyLog,
    medications,
    medicationDoseLog,
    habits,
    streak,
    sleepLog,
    impulseBrakeLog,
  });

  const sectionStyle = { marginBottom: "18px" };
  const labelStyle = { fontSize: "12px", color: C.textMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.03em" };
  const valueStyle = { fontSize: "14px", color: C.text, margin: 0, lineHeight: 1.6 };

  return (
    <div>
      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
        Resumen de tus últimos {CLINICAL_REPORT_DAYS} días en Senda, armado solo con lo que ya
        registraste — nada generado por IA. Es un apoyo para platicar en tu consulta, no un
        diagnóstico ni una evaluación clínica.
      </p>

      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.print) window.print();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: C.lavender,
          color: C.lavenderText,
          border: "none",
          borderRadius: "6px",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        <Printer size={16} /> Imprimir o guardar como PDF
      </button>

      <div style={sectionStyle}>
        <p style={labelStyle}>Ánimo</p>
        <p style={valueStyle}>
          {report.mood.loggedDays === 0
            ? "Sin registros de ánimo en este periodo."
            : `Registrado ${report.mood.loggedDays} de ${report.mood.totalDays} días${
                report.mood.average != null ? ` — promedio ${report.mood.average}/5` : ""
              }.`}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Energía</p>
        <p style={valueStyle}>
          {report.energy.loggedDays === 0
            ? "Sin registros de energía en este periodo."
            : `Registrada ${report.energy.loggedDays} de ${report.energy.totalDays} días — baja: ${report.energy.levelCounts.baja}, media: ${report.energy.levelCounts.media}, alta: ${report.energy.levelCounts.alta}.`}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Medicamentos</p>
        {report.medications.length === 0 ? (
          <p style={valueStyle}>Sin medicamentos activos registrados.</p>
        ) : (
          report.medications.map((med) => (
            <div key={med.id} style={{ marginBottom: "10px" }}>
              <p style={valueStyle}>
                <strong>{med.name}</strong>
                {med.adherencePercent != null ? ` — ${med.taken}/${med.expected} dosis (${med.adherencePercent}%)` : ""}
              </p>
              {med.sideEffectNotes.length > 0 && (
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {med.sideEffectNotes.map((n, i) => (
                    <li key={i} style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5 }}>
                      {formatDate(n.date)}: {n.note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Sueño</p>
        <p style={valueStyle}>
          {report.sleep.loggedNights === 0
            ? "Sin registros de hora de dormir en este periodo."
            : `Registrada ${report.sleep.loggedNights} de ${report.sleep.totalDays} noches — ${report.sleep.lateNights} de esas noches fue después de la medianoche.`}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Freno de impulsividad</p>
        <p style={valueStyle}>
          Usado {report.impulseBrake.total} vez{report.impulseBrake.total === 1 ? "" : "es"} en los
          últimos {CLINICAL_REPORT_DAYS} días
          {report.impulseBrake.purchase > 0 ? `, ${report.impulseBrake.purchase} de ellas antes de una compra no planeada` : ""}.
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>Racha y hábitos</p>
        <p style={valueStyle}>
          Racha actual: {report.streak.current} día{report.streak.current === 1 ? "" : "s"} (mejor
          racha: {report.streak.longest}).
          {report.pendingHabits.length > 0 ? ` Hábitos pendientes ahora mismo: ${report.pendingHabits.join(", ")}.` : ""}
        </p>
      </div>

      <p style={{ fontSize: "11px", color: C.textMuted, margin: "4px 0 0" }}>
        Generado el {formatDate(report.generatedAt)}.
      </p>
    </div>
  );
}
