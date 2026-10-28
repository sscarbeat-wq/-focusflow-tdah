import React, { useRef, useState } from "react";
import { Mic, Square, Keyboard, Trash2, CheckCircle2, StickyNote, AlertTriangle } from "lucide-react";
import { pendingQuickNotes, canConfirmQuickCaptureSuggestion, describeQuickCaptureSuggestion } from "./quickCapture";

// "Captura rápida" (inspirado en Eco, de Bitblocks SAS) — un solo botón
// para dejar una idea suelta por voz o texto sin tener que decidir primero
// en qué panel de Senda va. api/quick-capture.js transcribe (si fue voz) y
// PROPONE una categoría (medicamento/pago/paso del desglosador/nota
// general), pero nunca escribe nada sola — por eso toda sugerencia que no
// sea "nota" aparece aquí como una tarjeta que hay que confirmar con un
// toque. Si no se confirma nada, se guarda como nota suelta; una nota
// suelta que lleva varios días sin resolverse resurge sola en "Hoy"
// (oldForgottenNoteId la resalta aquí abajo cuando eso pasa), inspirado en
// "El Regreso" de Eco.
export default function QuickCapturePanel({
  C,
  t,
  lang,
  userId,
  quickNotes,
  oldForgottenNoteId,
  canAddStep,
  onAddNote,
  onResolveNote,
  onRemoveNote,
  onConfirmMedication,
  onConfirmPayment,
  onConfirmStep,
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unsafe, setUnsafe] = useState(false);
  const [suggestion, setSuggestion] = useState(null); // { noteText, type, fields }
  const [textMode, setTextMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const savedMsgTimeout = useRef(null);

  const reset = () => {
    setSuggestion(null);
    setError("");
    setUnsafe(false);
  };

  const flashSaved = (msg) => {
    setSavedMsg(msg);
    if (savedMsgTimeout.current) clearTimeout(savedMsgTimeout.current);
    savedMsgTimeout.current = setTimeout(() => setSavedMsg(""), 2500);
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const sendCapture = async ({ audioBase64, mimeType, text }) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, audioBase64, mimeType, text, language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.genericError);
      if (data.unsafe) {
        setUnsafe(true);
        return;
      }
      if (data.error) {
        setError(data.error);
        return;
      }
      setSuggestion({ noteText: data.noteText || "", type: data.type || "nota", fields: data.fields || {} });
    } catch (err) {
      setError(err.message || t.common.genericError);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const audioBase64 = await blobToBase64(blob);
        if (!audioBase64) {
          setError(t.quickCapture.emptyRecordingError);
          return;
        }
        await sendCapture({ audioBase64, mimeType: recorder.mimeType || "audio/webm" });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      // Sin permiso de micrófono o sin soporte en este navegador — se cae al
      // campo de texto en vez de dejar la función inutilizable.
      setTextMode(true);
      setError(t.quickCapture.micError);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch (err) {
      /* ya se había detenido — no pasa nada */
    }
  };

  const handleTextSubmit = async () => {
    const cleanText = draft.trim();
    if (!cleanText || busy) return;
    reset();
    await sendCapture({ text: cleanText });
    setDraft("");
  };

  const handleSaveAsNote = () => {
    if (!suggestion) return;
    onAddNote(suggestion.noteText);
    flashSaved(t.quickCapture.savedAsNote);
    setSuggestion(null);
  };

  const handleDiscardSuggestion = () => setSuggestion(null);

  const handleConfirmSuggestion = () => {
    if (!suggestion) return;
    if (suggestion.type === "medicamento") onConfirmMedication(suggestion.fields);
    else if (suggestion.type === "pago") onConfirmPayment(suggestion.fields);
    else if (suggestion.type === "paso") onConfirmStep(suggestion.fields);
    flashSaved(t.quickCapture.added);
    setSuggestion(null);
  };

  // Solo se ofrece el botón de "agregar directo" cuando la IA entendió lo
  // mínimo necesario para que el dato sea útil de verdad (ej. una hora de
  // medicamento, o un día de vencimiento de pago) — si faltó algo, la
  // tarjeta solo ofrece guardarlo como nota, nunca intenta adivinar.
  const canConfirm = canConfirmQuickCaptureSuggestion(suggestion, canAddStep);

  const pending = pendingQuickNotes(quickNotes);

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.lavender,
    border: "none",
    borderRadius: "12px",
    padding: "9px 14px",
    color: C.lavenderText,
    fontSize: "13px",
    fontWeight: 600,
    cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1,
  };

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "8px 12px",
    color: C.text,
    fontSize: "12px",
    cursor: "pointer",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
  };

  if (unsafe) {
    return (
      <div>
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.rose}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "10px",
          }}
        >
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: 0 }}>
            <AlertTriangle size={14} style={{ verticalAlign: "-2px", marginRight: "6px", color: C.rose }} />
            {t.crisis.message}
          </p>
        </div>
        <button
          onClick={reset}
          style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", cursor: "pointer", padding: 0 }}
        >
          {t.common.understood}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
        {t.quickCapture.intro}
      </p>

      {!suggestion && (
        <div style={{ marginBottom: "16px" }}>
          {!textMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={busy}
                style={{
                  ...btnPrimary,
                  background: recording ? C.rose : C.lavender,
                  color: recording ? C.roseText : C.lavenderText,
                }}
              >
                {recording ? <Square size={14} /> : <Mic size={14} />}
                {recording ? t.quickCapture.stopRecording : busy ? t.quickCapture.processing : t.quickCapture.recordButton}
              </button>
              <button onClick={() => setTextMode(true)} disabled={busy} style={btnGhost}>
                <Keyboard size={13} style={{ verticalAlign: "-2px", marginRight: "5px" }} />
                {t.quickCapture.typeInstead}
              </button>
            </div>
          )}

          {textMode && (
            <div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.quickCapture.textPlaceholder}
                rows={2}
                style={{ ...inputStyle, marginBottom: "8px", display: "block" }}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={handleTextSubmit} disabled={!draft.trim() || busy} style={btnPrimary}>
                  {busy ? t.quickCapture.processing : t.quickCapture.captureButton}
                </button>
                <button onClick={() => setTextMode(false)} disabled={busy} style={btnGhost}>
                  <Mic size={13} style={{ verticalAlign: "-2px", marginRight: "5px" }} />
                  {t.quickCapture.recordInstead}
                </button>
              </div>
            </div>
          )}

          {busy && !recording && (
            <p style={{ fontSize: "12px", color: C.textMuted, margin: "8px 0 0" }}>{t.quickCapture.transcribing}</p>
          )}
          {error && <p style={{ fontSize: "12px", color: C.amber, margin: "8px 0 0" }}>{error}</p>}
          {savedMsg && <p style={{ fontSize: "12px", color: C.mint, margin: "8px 0 0" }}>{savedMsg}</p>}
        </div>
      )}

      {suggestion && (
        <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
            {describeQuickCaptureSuggestion(suggestion, t)}
          </p>

          {!canConfirm && suggestion.type !== "nota" && (
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 10px" }}>
              {suggestion.type === "paso" && canAddStep === false
                ? t.quickCapture.stepsFullNotice
                : t.quickCapture.missingDataNotice}
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {suggestion.type === "nota" ? (
              <button onClick={handleSaveAsNote} style={btnPrimary}>
                <StickyNote size={14} /> {t.quickCapture.saveNoteButton}
              </button>
            ) : (
              <>
                {canConfirm && (
                  <button onClick={handleConfirmSuggestion} style={btnPrimary}>
                    {t.quickCapture.confirmYes}
                  </button>
                )}
                <button onClick={handleSaveAsNote} style={btnGhost}>
                  {canConfirm ? t.quickCapture.confirmNoKeep : t.quickCapture.saveAsNoteOnly}
                </button>
              </>
            )}
            <button
              onClick={handleDiscardSuggestion}
              style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", cursor: "pointer", padding: "9px 4px" }}
            >
              {t.quickCapture.discard}
            </button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{t.quickCapture.looseNotesLabel}</p>
          {pending.map((n) => {
            const isForgotten = n.id === oldForgottenNoteId;
            return (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "10px",
                  background: isForgotten ? C.surfaceAlt : "transparent",
                  border: `1px solid ${isForgotten ? C.amber : C.border}`,
                  borderRadius: "12px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  {isForgotten && (
                    <span style={{ display: "block", fontSize: "11px", color: C.amber, marginBottom: "3px", fontWeight: 600 }}>
                      {t.quickCapture.oldPending}
                    </span>
                  )}
                  <span style={{ fontSize: "13px", color: C.text }}>{n.text}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => onResolveNote(n.id)}
                    title={t.quickCapture.resolveTitle}
                    style={{ background: "transparent", border: "none", color: C.mint, cursor: "pointer" }}
                  >
                    <CheckCircle2 size={15} />
                  </button>
                  <button
                    onClick={() => onRemoveNote(n.id)}
                    title={t.quickCapture.deleteTitle}
                    style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
