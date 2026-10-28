import React, { useRef, useState } from "react";
import { Mic, Square, Keyboard, CheckCircle2, StickyNote, AlertTriangle, Sparkles } from "lucide-react";
import { canConfirmQuickCaptureSuggestion, describeQuickCaptureSuggestion } from "./quickCapture";

// "Descarga mental con IA" — Módulo 3 de ANRO TDAH 2.0 (8 de noviembre de
// 2026). Para cuando hay VARIAS cosas dándole vueltas a la cabeza a la vez
// (justo lo que suele pasar antes de poder empezar cualquiera de ellas) —
// en vez de dictar/escribir una por una en Captura rápida, aquí se "vacía
// la cabeza" de un solo golpe y la IA separa el texto en varios pendientes,
// cada uno con su propia tarjeta de confirmación.
//
// A propósito NO reimplementa nada de Captura rápida: usa el MISMO
// endpoint (api/quick-capture.js, con multiple:true), las MISMAS 4
// categorías, y las MISMAS funciones puras para decidir si una sugerencia
// se puede agregar directo y qué texto mostrar (canConfirmQuickCaptureSuggestion
// / describeQuickCaptureSuggestion, en quickCapture.js) — y los callbacks
// de confirmación (onConfirmMedication/onConfirmPayment/onConfirmStep/
// onAddNote) son los mismos que ya le pasa FocusFlowTDAH.jsx a
// QuickCapturePanel, así que terminar un pendiente aquí escribe exactamente
// en el mismo lugar que terminarlo allá. Nunca escribe nada por sí sola:
// cada pendiente espera su propio toque de confirmación, igual que Captura
// rápida.
export default function BrainDumpPanel({
  C,
  t,
  lang,
  userId,
  canAddStep,
  onAddNote,
  onConfirmMedication,
  onConfirmPayment,
  onConfirmStep,
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unsafe, setUnsafe] = useState(false);
  const [items, setItems] = useState(null); // null = todavía no se mandó nada; [] = ya se resolvieron todos
  const [textMode, setTextMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const savedMsgTimeout = useRef(null);

  const reset = () => {
    setItems(null);
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

  const sendDump = async ({ audioBase64, mimeType, text }) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, audioBase64, mimeType, text, language: lang, multiple: true }),
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
      setItems(Array.isArray(data.items) ? data.items : []);
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
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const audioBase64 = await blobToBase64(blob);
        if (!audioBase64) {
          setError(t.quickCapture.emptyRecordingError);
          return;
        }
        await sendDump({ audioBase64, mimeType: recorder.mimeType || "audio/webm" });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
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
    await sendDump({ text: cleanText });
    setDraft("");
  };

  const removeItemAt = (idx) => setItems((prev) => (prev || []).filter((_, i) => i !== idx));

  const handleSaveAsNote = (idx, item) => {
    onAddNote(item.noteText);
    flashSaved(t.quickCapture.savedAsNote);
    removeItemAt(idx);
  };

  const handleDiscard = (idx) => removeItemAt(idx);

  const handleConfirm = (idx, item) => {
    if (item.type === "medicamento") onConfirmMedication(item.fields);
    else if (item.type === "pago") onConfirmPayment(item.fields);
    else if (item.type === "paso") onConfirmStep(item.fields);
    flashSaved(t.quickCapture.added);
    removeItemAt(idx);
  };

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

  // Ya se mandó una descarga y la IA contestó — se muestran las tarjetas
  // (una lista vacía significa que ya se resolvieron todas).
  if (items !== null) {
    return (
      <div>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 12px" }}>{t.brainDump.allDone}</p>
            <button onClick={reset} style={btnPrimary}>
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
              const canConfirm = canConfirmQuickCaptureSuggestion(item, canAddStep);
              return (
                <div
                  key={idx}
                  style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px", marginBottom: "10px" }}
                >
                  <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
                    {describeQuickCaptureSuggestion(item, t)}
                  </p>

                  {!canConfirm && item.type !== "nota" && (
                    <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 10px" }}>
                      {item.type === "paso" && canAddStep === false
                        ? t.quickCapture.stepsFullNotice
                        : t.quickCapture.missingDataNotice}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {item.type === "nota" ? (
                      <button onClick={() => handleSaveAsNote(idx, item)} style={btnPrimary}>
                        <StickyNote size={14} /> {t.quickCapture.saveNoteButton}
                      </button>
                    ) : (
                      <>
                        {canConfirm && (
                          <button onClick={() => handleConfirm(idx, item)} style={btnPrimary}>
                            {t.quickCapture.confirmYes}
                          </button>
                        )}
                        <button onClick={() => handleSaveAsNote(idx, item)} style={btnGhost}>
                          {canConfirm ? t.quickCapture.confirmNoKeep : t.quickCapture.saveAsNoteOnly}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDiscard(idx)}
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
    );
  }

  // Todavía no se mandó ninguna descarga — mismo input de voz/texto que
  // Captura rápida, solo que invitando a escribir/decir varias cosas juntas.
  return (
    <div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
        {t.brainDump.intro}
      </p>

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
            placeholder={t.brainDump.placeholder}
            rows={4}
            style={{ ...inputStyle, marginBottom: "8px", display: "block" }}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={handleTextSubmit} disabled={!draft.trim() || busy} style={btnPrimary}>
              {busy ? t.quickCapture.processing : t.brainDump.submitButton}
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
    </div>
  );
}
