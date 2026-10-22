import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Undo2 } from "lucide-react";
import {
  addMedication,
  removeMedication,
  todayDoses,
  doseTaken,
  logDose,
  undoDose,
  recentDoseHistory,
} from "./medicationLog";

// Seguimiento de medicamentos (inspirado en apps como Theraview) —
// medicamentos + horarios que la persona define una vez, check de "ya la
// tomé" por dosis con nota opcional de efecto secundario, historial de los
// últimos 7 días. Las notas de efectos secundarios son texto libre que
// nunca se manda a ninguna IA — solo se guardan para la persona y, si
// quiere, para compartirlas con su médico. Si pagó Vercel Pro, además
// recibe un recordatorio push a la hora exacta de cada dosis (ver
// api/send-reminders.js); si no, el aviso diario normal de la app sigue
// mencionando medicamentos pendientes de hoy.
export default function MedicationPanel({ C, t, medications, doseLog, onAdd, onRemove, onLogDose, onUndoDose }) {
  const [name, setName] = useState("");
  const [times, setTimes] = useState([""]);
  const [notes, setNotes] = useState("");
  const [noteDraftFor, setNoteDraftFor] = useState(null); // {medicationId, time} | null
  const [noteDraft, setNoteDraft] = useState("");

  const doses = todayDoses(medications);
  const history = recentDoseHistory(medications, doseLog, 7);

  const updateTime = (i, value) => {
    setTimes((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  };
  const addTimeField = () => setTimes((prev) => [...prev, ""]);
  const removeTimeField = (i) => setTimes((prev) => prev.filter((_, idx) => idx !== i));

  const handleAdd = () => {
    onAdd({ name, doseTimes: times, notes });
    setName("");
    setTimes([""]);
    setNotes("");
  };

  const openNoteDraft = (medicationId, time) => {
    setNoteDraftFor({ medicationId, time });
    setNoteDraft("");
  };

  const confirmDose = (medicationId, time, note = "") => {
    onLogDose(medicationId, time, note);
    setNoteDraftFor(null);
    setNoteDraft("");
  };

  const inputStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "8px 10px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "7px 10px",
    color: C.text,
    fontSize: "12px",
    cursor: "pointer",
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.mint,
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    color: "#064e3b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div>
      {doses.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{t.medication.todayDoses}</p>
          {doses.map((d) => {
            const taken = doseTaken(doseLog, d.medicationId, d.time);
            const isDraft = noteDraftFor && noteDraftFor.medicationId === d.medicationId && noteDraftFor.time === d.time;
            return (
              <div
                key={`${d.medicationId}-${d.time}`}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <button
                    onClick={() => (taken ? onUndoDose(d.medicationId, d.time) : openNoteDraft(d.medicationId, d.time))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {taken ? (
                      <CheckCircle2 size={18} color={C.mint} style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={18} color={C.textMuted} style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: "13px", color: C.text }}>
                      {d.time} — {d.medicationName}
                    </span>
                  </button>
                  {taken && (
                    <button
                      onClick={() => onUndoDose(d.medicationId, d.time)}
                      title={t.medication.undo}
                      style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", padding: "2px" }}
                    >
                      <Undo2 size={14} />
                    </button>
                  )}
                </div>

                {isDraft && (
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder={t.medication.sideEffectPlaceholder}
                      style={{ ...inputStyle, flex: 1, minWidth: "160px" }}
                    />
                    <button onClick={() => confirmDose(d.medicationId, d.time, noteDraft)} style={btnPrimary}>
                      {t.medication.markTaken}
                    </button>
                    <button onClick={() => setNoteDraftFor(null)} style={btnGhost}>
                      {t.medication.cancel}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {medications && medications.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{t.medication.yourMedications}</p>
          {medications.map((med) => (
            <div
              key={med.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "8px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div>
                <span style={{ fontSize: "13px", color: C.text }}>{med.name}</span>
                <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "8px" }}>
                  {med.doseTimes.join(", ")}
                </span>
                {med.notes && (
                  <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>{med.notes}</div>
                )}
              </div>
              <button
                onClick={() => onRemove(med.id)}
                title={t.medication.delete}
                style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", flexShrink: 0 }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "14px" }}>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>{t.medication.addMedicationTitle}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.medication.namePlaceholder}
          style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
        />
        {times.map((time, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              type="time"
              value={time}
              onChange={(e) => updateTime(i, e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            {times.length > 1 && (
              <button onClick={() => removeTimeField(i)} style={btnGhost}>
                {t.medication.removeTime}
              </button>
            )}
          </div>
        ))}
        <button onClick={addTimeField} style={{ ...btnGhost, marginBottom: "8px" }}>
          {t.medication.addTime}
        </button>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.medication.notesPlaceholder}
          rows={2}
          style={{ ...inputStyle, width: "100%", resize: "vertical", marginBottom: "10px", display: "block" }}
        />
        <button onClick={handleAdd} disabled={!name.trim()} style={btnPrimary}>
          <Plus size={14} /> {t.medication.addButton}
        </button>
      </div>

      {medications && medications.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {history.map(({ date, taken, expected }) => (
              <div
                key={date}
                title={date}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: "11px",
                  background: C.surfaceAlt,
                  borderRadius: "6px",
                  padding: "6px 0",
                  color: expected === 0 ? C.textMuted : taken >= expected ? C.mint : C.amberText,
                  opacity: expected === 0 ? 0.3 : 1,
                }}
              >
                {expected === 0 ? "·" : `${taken}/${expected}`}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>
            {t.medication.historyCaption}
          </p>
        </div>
      )}
    </div>
  );
}
