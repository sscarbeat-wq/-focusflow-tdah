import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Circle, Undo2, Pill, ChevronDown, Clock, Mic } from "lucide-react";
import {
  addMedication,
  removeMedication,
  todayDoses,
  doseTaken,
  logDose,
  undoDose,
  recentDoseHistory,
} from "./medicationLog";
import { tint } from "./theme";

const WEEKDAY_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function weekdayInitial(dateKey, lang) {
  // dateKey es "YYYY-MM-DD" — mediodía local para no cruzar de día por un
  // corrimiento de huso horario (mismo truco que EnergyLog.jsx/MoodLog.jsx).
  const d = new Date(`${dateKey}T12:00:00`);
  const label = d.toLocaleDateString(WEEKDAY_LOCALES[lang] || WEEKDAY_LOCALES.es, { weekday: "short" });
  return label.replace(".", "").slice(0, 1).toUpperCase();
}

// Seguimiento de medicamentos (inspirado en apps como Theraview) —
// medicamentos + horarios que la persona define una vez, check de "ya la
// tomé" por dosis con nota opcional de efecto secundario, historial de los
// últimos 7 días. Las notas de efectos secundarios son texto libre que
// nunca se manda a ninguna IA — solo se guardan para la persona y, si
// quiere, para compartirlas con su médico. Si pagó Vercel Pro, además
// recibe un recordatorio push a la hora exacta de cada dosis (ver
// api/send-reminders.js); si no, el aviso diario normal de la app sigue
// mencionando medicamentos pendientes de hoy.
//
// 26 de noviembre de 2026 ("acomoda de otra forma esto de los
// medicamentos, que se vea bonito"): antes eran tres bloques planos
// apilados y el formulario de "Agregar medicamento" se veía siempre
// abierto, completo, aunque la persona ya tuviera todos sus medicamentos
// configurados — ocupaba la mitad de la pantalla sin necesidad. Ahora:
// 1) "Dosis de hoy" suma un resumen con barra de progreso (mismo criterio
//    de color que el resto de la app: mint = completo).
// 2) "Tus medicamentos" pasa a tarjetas con ícono y horarios como chips,
//    en vez de una fila de texto plano con una línea divisoria.
// 3) "Agregar medicamento" se colapsa en un botón punteado — el formulario
//    completo solo aparece cuando realmente se va a usar, y se vuelve a
//    cerrar solo al agregar.
// 4) El historial pasa de números sueltos a una gráfica de barras por
//    color (mismo patrón que EnergyLog.jsx/MoodLog.jsx): mint si se tomó
//    todo, ámbar si fue parcial, rosa si no se tomó nada ese día — para
//    que un vistazo rápido ya diga algo, sin tener que leer cada fracción.
export default function MedicationPanel({ C, t, lang, medications, doseLog, onAdd, onRemove, onLogDose, onUndoDose }) {
  const [name, setName] = useState("");
  const [times, setTimes] = useState([""]);
  const [notes, setNotes] = useState("");
  const [noteDraftFor, setNoteDraftFor] = useState(null); // {medicationId, time} | null
  const [noteDraft, setNoteDraft] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // 26 de noviembre de 2026 ("puedes añadir micrófono para que también el
  // paciente pueda dictar su medicamento"): dictado por voz del nombre del
  // medicamento con la Web Speech API (SpeechRecognition). Solo Chrome/
  // Safari/Edge la soportan de verdad (Firefox no) — por eso el botón del
  // micrófono se oculta por completo cuando no está disponible, mismo
  // criterio "honesto" que ya sigue pushSupported() en push.js: nunca
  // mostrar un control que no va a funcionar.
  const [dictating, setDictating] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef(null);
  const speechSupported =
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    // Si la persona cierra o colapsa el formulario con el micrófono todavía
    // escuchando, hay que apagarlo — si no, se queda grabando de fondo.
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startDictation = () => {
    if (!speechSupported) return;
    setMicError("");
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = WEEKDAY_LOCALES[lang] || WEEKDAY_LOCALES.es;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setName(transcript);
    };
    recognition.onerror = (event) => {
      // "no-speech" (no dijo nada) y "aborted" (ella misma lo detuvo) no son
      // errores reales — no hace falta molestarla con un mensaje por eso.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setMicError(t.medication.micError);
      }
    };
    recognition.onend = () => setDictating(false);
    recognitionRef.current = recognition;
    setDictating(true);
    recognition.start();
  };

  const stopDictation = () => {
    recognitionRef.current?.stop();
  };

  const doses = todayDoses(medications);
  const takenCount = doses.filter((d) => doseTaken(doseLog, d.medicationId, d.time)).length;
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
    setAddOpen(false);
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
    borderRadius: "12px",
    padding: "8px 10px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
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
    borderRadius: "12px",
    padding: "9px 14px",
    color: "#064e3b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const timeChip = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    fontWeight: 600,
    color: C.textMuted,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "2px 8px",
  };

  return (
    <div>
      {doses.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 8px" }}>
            <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontWeight: 600 }}>{t.medication.todayDoses}</p>
            <p style={{ fontSize: "12px", color: takenCount >= doses.length ? C.mint : C.textMuted, margin: 0, fontWeight: 700 }}>
              {t.medication.doseProgress(takenCount, doses.length)}
            </p>
          </div>
          <div style={{ height: "4px", borderRadius: "999px", background: C.border, overflow: "hidden", marginBottom: "10px" }}>
            <div
              style={{
                height: "100%",
                width: `${doses.length ? (takenCount / doses.length) * 100 : 0}%`,
                background: C.mint,
                borderRadius: "999px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          {takenCount >= doses.length && (
            <p style={{ fontSize: "12.5px", color: C.mint, margin: "0 0 10px", fontWeight: 600 }}>{t.medication.allTaken}</p>
          )}
          {doses.map((d) => {
            const taken = doseTaken(doseLog, d.medicationId, d.time);
            const isDraft = noteDraftFor && noteDraftFor.medicationId === d.medicationId && noteDraftFor.time === d.time;
            return (
              <div
                key={`${d.medicationId}-${d.time}`}
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${taken ? C.mint : C.amber}`,
                  borderRadius: "12px",
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
                    <span style={{ fontSize: "13px", color: taken ? C.textMuted : C.text, textDecoration: taken ? "line-through" : "none" }}>
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
                  <div
                    style={{
                      marginTop: "8px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      background: tint(C.mint, 0.1),
                      borderRadius: "10px",
                      padding: "8px",
                    }}
                  >
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

      <div style={{ marginBottom: "18px" }}>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{t.medication.yourMedications}</p>
        {medications && medications.length > 0 ? (
          medications.map((med) => (
            <div
              key={med.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "12px 14px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: tint(C.mint, 0.18),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Pill size={17} color={C.mint} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13.5px", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>{med.name}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(med.doseTimes || []).map((time) => (
                    <span key={time} style={timeChip}>
                      <Clock size={10} />
                      {time}
                    </span>
                  ))}
                </div>
                {med.notes && (
                  <p style={{ fontSize: "11.5px", color: C.textMuted, margin: "6px 0 0", fontStyle: "italic", lineHeight: 1.4 }}>
                    {med.notes}
                  </p>
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
          ))
        ) : (
          !addOpen && <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>{t.medication.noneYet}</p>
        )}
      </div>

      {!addOpen ? (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            background: "transparent",
            border: `1px dashed ${C.border}`,
            borderRadius: "14px",
            padding: "12px",
            color: C.textMuted,
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          <Plus size={15} /> {t.medication.addMedicationTitle}
        </button>
      ) : (
        <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 10px" }}>
            <p style={{ fontSize: "12px", color: C.textMuted, margin: 0, fontWeight: 600 }}>{t.medication.addMedicationTitle}</p>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              aria-label={t.medication.cancel}
              style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: speechSupported ? "4px" : "8px" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.medication.namePlaceholder}
              style={{ ...inputStyle, flex: 1 }}
            />
            {speechSupported && (
              <button
                type="button"
                onClick={() => (dictating ? stopDictation() : startDictation())}
                title={t.medication.dictate}
                aria-label={t.medication.dictate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  flexShrink: 0,
                  background: dictating ? C.rose : C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "12px",
                  color: dictating ? "#fff" : C.textMuted,
                  cursor: "pointer",
                }}
              >
                <Mic size={15} />
              </button>
            )}
          </div>
          {micError && (
            <p style={{ fontSize: "11.5px", color: C.amber, margin: "0 0 8px", lineHeight: 1.4 }}>{micError}</p>
          )}
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleAdd} disabled={!name.trim()} style={btnPrimary}>
              <Plus size={14} /> {t.medication.addButton}
            </button>
            <button onClick={() => setAddOpen(false)} style={btnGhost}>
              {t.medication.cancel}
            </button>
          </div>
        </div>
      )}

      {medications && medications.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div style={{ display: "flex", gap: "6px", height: "44px" }}>
            {history.map(({ date, taken, expected }) => {
              const isToday = date === history[history.length - 1].date;
              const color = expected === 0 ? null : taken >= expected ? C.mint : taken > 0 ? C.amber : C.rose;
              const heightPct = expected === 0 ? 14 : Math.max(14, Math.round((taken / expected) * 100));
              return (
                <div
                  key={date}
                  title={`${date} — ${expected === 0 ? t.medication.historyNoneExpected : `${taken}/${expected}`}`}
                  style={{ flex: 1, display: "flex", alignItems: "flex-end", height: "100%" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPct}%`,
                      minHeight: "10px",
                      borderRadius: "6px",
                      background: color || "transparent",
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
          <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>{t.medication.historyCaption}</p>
        </div>
      )}
    </div>
  );
}
