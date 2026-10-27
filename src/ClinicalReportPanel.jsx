import React from "react";
import { Printer } from "lucide-react";
import { buildClinicalReport, CLINICAL_REPORT_DAYS } from "./clinicalReport";

const DATE_FMT = { day: "2-digit", month: "2-digit", year: "numeric" };

// Un locale de formato de fecha por idioma de la app — no tiene que ver con
// el país de la persona, solo con que día/mes/año se vea en el orden
// esperado para el idioma que elige.
const DATE_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function formatDate(isoOrKey, lang) {
  // Acepta tanto un ISO completo (generatedAt) como un YYYY-MM-DD (dateKey).
  const d = isoOrKey.length === 10 ? new Date(`${isoOrKey}T00:00:00`) : new Date(isoOrKey);
  return d.toLocaleDateString(DATE_LOCALES[lang] || DATE_LOCALES.es, DATE_FMT);
}

// Vista de solo lectura, pensada para imprimirse o mostrarse en pantalla
// durante la consulta — nunca pide nada nuevo, solo junta lo que Senda ya
// tiene guardado de los últimos 14 días. Sin IA: es agregación pura, el
// mismo principio que ya usan los Insights semanales y la vista "Hoy".
export default function ClinicalReportPanel({
  C,
  t,
  lang,
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
    <div id="senda-clinical-report">
      {/* Al imprimir (o "Guardar como PDF"), el navegador por default imprime TODA la página —
          todos los demás paneles de Senda, no solo este reporte. Esta hoja de estilo, con el
          truco clásico de "ocultar todo, mostrar solo este contenedor", hace que lo impreso sea
          nada más el reporte: oculta todo lo demás de la app, muestra solo #senda-clinical-report,
          esconde los controles interactivos marcados con data-no-print (el botón de imprimir), y
          muestra el encabezado marcado con data-print-only que en pantalla está oculto (el título
          del Panel que lo envuelve, en FocusFlowTDAH.jsx, no es parte de este contenedor y por
          eso no aparecería impreso sin este encabezado propio). */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #senda-clinical-report, #senda-clinical-report * { visibility: visible; }
          #senda-clinical-report { position: absolute; left: 0; top: 0; width: 100%; }
          #senda-clinical-report [data-no-print] { display: none !important; }
          #senda-clinical-report [data-print-only] { display: block !important; }
        }
      `}</style>

      <div data-print-only style={{ display: "none", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: C.text }}>{t.clinicalReport.printOnlyTitle}</h2>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: 0 }}>
          {t.clinicalReport.printOnlyRange(CLINICAL_REPORT_DAYS, formatDate(report.generatedAt, lang))}
        </p>
      </div>

      <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>
        {t.clinicalReport.intro(CLINICAL_REPORT_DAYS)}
      </p>

      <button
        data-no-print
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
          borderRadius: "12px",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        <Printer size={16} /> {t.clinicalReport.printButton}
      </button>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.moodLabel}</p>
        <p style={valueStyle}>
          {report.mood.loggedDays === 0
            ? t.clinicalReport.moodNone
            : t.clinicalReport.moodRegistered(report.mood.loggedDays, report.mood.totalDays, report.mood.average)}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.energyLabel}</p>
        <p style={valueStyle}>
          {report.energy.loggedDays === 0
            ? t.clinicalReport.energyNone
            : t.clinicalReport.energyRegistered(
                report.energy.loggedDays,
                report.energy.totalDays,
                report.energy.levelCounts.baja,
                report.energy.levelCounts.media,
                report.energy.levelCounts.alta
              )}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.medicationsLabel}</p>
        {report.medications.length === 0 ? (
          <p style={valueStyle}>{t.clinicalReport.noMedications}</p>
        ) : (
          report.medications.map((med) => (
            <div key={med.id} style={{ marginBottom: "10px" }}>
              <p style={valueStyle}>
                <strong>{med.name}</strong>
                {med.adherencePercent != null
                  ? t.clinicalReport.medAdherence(med.taken, med.expected, med.adherencePercent)
                  : ""}
              </p>
              {med.sideEffectNotes.length > 0 && (
                <ul style={{ margin: "4px 0 0", paddingLeft: "18px" }}>
                  {med.sideEffectNotes.map((n, i) => (
                    <li key={i} style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5 }}>
                      {formatDate(n.date, lang)}: {n.note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.sleepLabel}</p>
        <p style={valueStyle}>
          {report.sleep.loggedNights === 0
            ? t.clinicalReport.sleepNone
            : t.clinicalReport.sleepRegistered(report.sleep.loggedNights, report.sleep.totalDays, report.sleep.lateNights)}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.impulseBrakeLabel}</p>
        <p style={valueStyle}>
          {t.clinicalReport.impulseBrakeUsed(
            report.impulseBrake.total,
            CLINICAL_REPORT_DAYS,
            report.impulseBrake.purchase > 0 ? t.clinicalReport.impulseBrakePurchasePart(report.impulseBrake.purchase) : ""
          )}
        </p>
      </div>

      <div style={sectionStyle}>
        <p style={labelStyle}>{t.clinicalReport.streakHabitsLabel}</p>
        <p style={valueStyle}>
          {t.clinicalReport.streakSummary(report.streak.current, report.streak.longest)}
          {report.pendingHabits.length > 0 ? t.clinicalReport.pendingHabitsSuffix(report.pendingHabits.join(", ")) : ""}
        </p>
      </div>

      <p style={{ fontSize: "11px", color: C.textMuted, margin: "4px 0 0" }}>
        {t.clinicalReport.generatedOn(formatDate(report.generatedAt, lang))}
      </p>
    </div>
  );
}
