import React, { useRef, useState } from "react";
import { Mic, Square, Keyboard, Trash2, CheckCircle2, StickyNote, AlertTriangle, Sparkles, Inbox } from "lucide-react";
import { pendingQuickNotes, canConfirmQuickCaptureSuggestion, describeQuickCaptureSuggestion } from "./quickCapture";

// "Captura rápida" + "Descarga mental con IA" fusionadas en una sola
// interfaz (Fase 2D de navegación, 29 de octubre de 2026) — la doctora
// pidió integrarlas en una sola pantalla sin perder ninguno de los dos
// flujos. Antes eran dos tarjetas separadas (QuickCapturePanel.jsx y
// BrainDumpPanel.jsx, que se quedan en el repo sin uso por si hace falta
// volver atrás) que ya compartían casi todo su código — grabar/escribir,
// mandar a api/quick-capture.js, mostrar tarjetas de confirmación — la
// única diferencia real era si se mandaba multiple:true (Descarga mental,
// varias cosas a la vez) o no (Captura rápida, una idea a la vez). Aquí
// viven juntas detrás de un selector de modo arriba; cada modo se
// comporta EXACTAMENTE igual que su panel original, incluida la lista de
// notas sueltas pendientes (se ve sin importar el modo elegido, porque es
// la misma lista sin importar desde cuál de los dos flujos se llegó a
// cada nota).
export default function CaptureHubPanel({
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
  const [mode, setMode] = useState("quick"); // "quick" = Captura rápida (una idea) | "dump" = Descarga mental (varias)
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unsafe, setUnsafe] = useState(false);
  const [suggestion, setSuggestion] = useState(null); // modo "quick": { noteText, type, fields }
  const [items, setItems] = useState(null); // modo "dump": null = nada mandado todavía; [] = ya se resolvieron todas
  const [textMode, setTextMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const savedMsgTimeout = useRef(null);

  const resetResults = () => {
    setSuggestion(null);
    setItems(null);
    setError("");
    setUnsafe(false);
  };

  // Cambiar de modo solo se permite en reposo (sin grabación ni envío en
  // curso, ver los `disabled` de los botones abajo) y limpia cualquier
  // resultado/borrador a medio hacer del modo anterior, para no mezclar un
  // borrador de "una idea" con el modo "vaciar la cabeza" o viceversa.
  const handleModeChange = (nextMode) => {
    if (nextMode === mode || busy || recording) return;
    setMode(nextMode);
    resetResults();
    setTextMode(false);
    setDraft("");
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
        body: JSON.stringify({
          userId,
          audioBase64,
          mimeType,
          text,
          language: lang,
          ...(mode === "dump" ? { multiple: true } : {}),
        }),
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
      if (mode === "dump") {
        setItems(Array.isArray(data.items) ? data.items : []);
      } else {
        setSuggestion({ noteText: data.noteText || "", type: data.type || "nota", fields: data.fields || {} });
      }
    } catch (err) {
      setError(err.message || t.common.genericError);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    resetResults();
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
        stream.getTracks().forEach((tr) => tr.stop());
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
    resetResults();
    await sendCapture({ text: cleanText });
    setDraft("");
  };

  // ---- modo "quick": una sola sugerencia a la vez ----
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

  // ---- modo "dump": varias sugerencias a la vez ----
  const removeItemAt = (idx) => setItems((prev) => (prev || []).filter((_, i) => i !== idx));

  const handleSaveItemAsNote = (idx, item) => {
    onAddNote(item.noteText);
    flashSaved(t.quickCapture.savedAsNote);
    removeItemAt(idx);
  };

  const handleDiscardItem = (idx) => removeItemAt(idx);

  const handleConfirmItem = (idx, item) => {
    if (item.type === "medicamento") onConfirmMedication(item.fields);
    else if (item.type === "pago") onConfirmPayment(item.fields);
    else if (item.type === "paso") onConfirmStep(item.fields);
    flashSaved(t.quickCapture.added);
    removeItemAt(idx);
  };

  // Solo se ofrece el botón de "agregar directo" cuando la IA entendió lo
  // mínimo necesario para que el dato sea útil de verdad — si faltó algo,
  // la tarjeta solo ofrece guardarlo como nota, nunca intenta adivinar.
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

  const modeTabStyle = (isActive) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minHeight: "40px",
    padding: "8px 14px",
    background: isActive ? C.lavender : "transparent",
    border: `1px solid ${isActive ? C.lavender : C.border}`,
    borderRadius: "12px",
    color: isActive ? C.lavenderText : C.text,
    fontSize: "13px",
    fontWeight: 600,
    cursor: busy || recording ? "default" : "pointer",
    opacity: busy || recording ? 0.6 : 1,
  });

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
          onClick={resetResults}
          style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", cursor: "pointer", padding: 0 }}
        >
          {t.common.understood}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        role="group"
        aria-label={t.captureHub.modeGroupLabel}
        style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}
      >
        <button
          type="button"
          aria-pressed={mode === "quick"}
          onClick={() => handleModeChange("quick")}
          disabled={busy || recording}
          style={modeTabStyle(mode === "quick")}
        >
          <StickyNote size={14} /> {t.captureHub.quickTab}
        </button>
        <button
          type="button"
          aria-pressed={mode === "dump"}
          onClick={() => handleModeChange("dump")}
          disabled={busy || recording}
          style={modeTabStyle(mode === "dump")}
        >
          <Inbox size={14} /> {t.captureHub.dumpTab}
        </button>
      </div>

      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
        {mode === "dump" ? t.brainDump.intro : t.quickCapture.intro}
      </p>

      {mode === "dump" && items !== null && (
        <div style={{ marginBottom: "16px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 12px" }}>{t.brainDump.allDone}</p>
              <button onClick={resetResults} style={btnPrimary}>
                <Sparkles size={14} />
                {t.brainDump.newDumpButton}
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 12px" }}>
                {t.brainDump.itemsIntro(items.length)}
              </p>
              {items.map((item, idx) => {
                const itemCanConfirm = canConfirmQuickCaptureSuggestion(item, canAddStep);
                return (
                  <div key={idx} style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px", marginBottom: "10px" }}>
                    <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
                      {describeQuickCaptureSuggestion(item, t)}
                    </p>

                    {!itemCanConfirm && item.type !== "nota" && (
                      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 10px" }}>
                        {item.type === "paso" && canAddStep === false ? t.quickCapture.stepsFullNotice : t.quickCapture.missingDataNotice}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {item.type === "nota" ? (
                        <button onClick={() => handleSaveItemAsNote(idx, item)} style={btnPrimary}>
                          <StickyNote size={14} /> {t.quickCapture.saveNoteButton}
                        </button>
                      ) : (
                        <>
                          {itemCanConfirm && (
                            <button onClick={() => handleConfirmItem(idx, item)} style={btnPrimary}>
                              {t.quickCapture.confirmYes}
                            </button>
                          )}
                          <button onClick={() => handleSaveItemAsNote(idx, item)} style={btnGhost}>
                            {itemCanConfirm ? t.quickCapture.confirmNoKeep : t.quickCapture.saveAsNoteOnly}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDiscardItem(idx)}
                        style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "12px", cursor: "pointer", padding: "9px 4px" }}
                      >
                        {t.quickCapture.discard}
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {savedMsg && <p style={{ fontSize: "12px", color: C.mint, margin: "8px 0 0" }}>{savedMsg}</p>}
        </div>
      )}

      {mode === "quick" && suggestion && (
        <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
            {describeQuickCaptureSuggestion(suggestion, t)}
          </p>

          {!canConfirm && suggestion.type !== "nota" && (
            <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 10px" }}>
              {suggestion.type === "paso" && canAddStep === false ? t.quickCapture.stepsFullNotice : t.quickCapture.missingDataNotice}
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

      {((mode === "quick" && !suggestion) || (mode === "dump" && items === null)) && (
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
                placeholder={mode === "dump" ? t.brainDump.placeholder : t.quickCapture.textPlaceholder}
                rows={mode === "dump" ? 4 : 2}
                style={{ ...inputStyle, marginBottom: "8px", display: "block" }}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={handleTextSubmit} disabled={!draft.trim() || busy} style={btnPrimary}>
                  {busy ? t.quickCapture.processing : mode === "dump" ? t.brainDump.submitButton : t.quickCapture.captureButton}
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
          {mode === "quick" && savedMsg && <p style={{ fontSize: "12px", color: C.mint, margin: "8px 0 0" }}>{savedMsg}</p>}
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
