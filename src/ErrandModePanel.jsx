// ErrandModePanel.jsx — "Modo Salida" (13 de noviembre de 2026).
//
// Caso real que lo originó: salir por líquido de lentes y gasolina, volver
// con gasolina y pan, y acordarse del líquido al llegar a casa. La lista se
// dicta ANTES de salir; desde ahí la app la sostiene: en pantalla (un toque
// para tachar), en la bandeja de notificaciones (aviso fijo con lo que
// falta) y con avisos push mientras quede algo sin tachar (cron
// ?check=errands en api/send-reminders.js). Lógica pura en errandMode.js.
//
// Props:
//   C, t, lang, accent
//   errandState            — { errands, archive }
//   onAddItems(items)      — agrega a la salida activa (o la crea)
//   onToggleItem(tripId, itemId)
//   onRemoveItem(tripId, itemId)
//   onCompleteTrip(tripId) — archiva y da puntos (lo decide el padre)
//   onCancelTrip(tripId)
//   onOpenNotifications()  — lleva a Perfil → Notificaciones

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Plus, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { tint } from "./theme";
import {
  parseErrandText,
  activeTrip,
  pendingItems,
  allChecked,
  tripProgress,
  normalizeErrandState,
  errandNotificationContent,
  ERRAND_NOTIFICATION_TAG,
} from "./errandMode";

const SpeechRecognitionAPI =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const SPEECH_LANG = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };
const DATE_LOCALE = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };
const DONE_COLOR = "#1E9E6E";

// Respaldo por si a un idioma le falta alguna llave de t.errandMode.
const FALLBACK = {
  intro: "Antes de salir, di todo lo que vas a hacer afuera. ANRO guarda la lista y te avisa mientras falte algo.",
  voiceCTA: "Dicta tus mandados",
  voiceHint: "“Comprar líquido de lentes, cargar gasolina y pasar por pan”",
  voiceAddMore: "Dictar otro",
  listening: "Te escucho…",
  tapToStop: "Toca para terminar",
  typePlaceholder: "O escríbelos: farmacia, gasolina, pan",
  typeMorePlaceholder: "Agregar otro mandado",
  addAria: "Agregar a la lista",
  pendingCount: (n) => `Te ${n === 1 ? "falta" : "faltan"} ${n}`,
  allDoneTitle: "¡Lista completa!",
  allDoneSub: "Todo lo que ibas a hacer, hecho. Nada se quedó en el camino.",
  celebrateBtn: "Cerrar salida",
  cancelTrip: "Borrar esta lista",
  cancelConfirm: "¿Borrar la lista completa?",
  cancelYes: "Sí, borrar",
  cancelNo: "No",
  removeAria: (text) => `Quitar ${text}`,
  justDone: "Salida cerrada. Bien hecho.",
  archiveTitle: "Salidas anteriores",
  archiveItems: (n) => `${n} mandado${n === 1 ? "" : "s"}`,
  notifTitle: (n) => `🚗 Te ${n === 1 ? "falta" : "faltan"} ${n} mandado${n === 1 ? "" : "s"}`,
  notifSuffix: "Antes de regresar, revisa tu lista.",
  notifOn: "ANRO te avisa mientras falte algo — el primer aviso llega a los 15–30 minutos.",
  notifOff: "Sin notificaciones, la lista solo vive aquí adentro.",
  notifOffAction: "Activar avisos",
  voiceUnsupported: "Este navegador no permite dictar. Escribe tus mandados abajo.",
  voiceDenied: "Permite el micrófono para dictar, o escribe tus mandados abajo.",
  voiceNothing: "No alcancé a escuchar. Intenta otra vez o escríbelo.",
};

function notificationsGranted() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

// Deja en la bandeja UN aviso con lo que falta (o lo quita si ya no falta
// nada). Va por el service worker porque en Android/iOS `new Notification()`
// no existe para PWAs. Cualquier falla se ignora: el aviso es un extra, la
// lista en pantalla es lo que manda.
async function syncTrayNotification(trip, strings) {
  try {
    if (!notificationsGranted() || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const content = errandNotificationContent(trip, strings);
    if (!content) {
      const open = await reg.getNotifications({ tag: ERRAND_NOTIFICATION_TAG });
      open.forEach((n) => n.close());
      return;
    }
    await reg.showNotification(content.title, {
      body: content.body,
      tag: content.tag,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      renotify: false,
      data: { url: "/" },
    });
  } catch (err) {
    /* sin service worker o sin permiso — seguimos solo con la lista en pantalla */
  }
}

export default function ErrandModePanel({
  C,
  t,
  lang,
  accent,
  errandState,
  onAddItems,
  onToggleItem,
  onRemoveItem,
  onCompleteTrip,
  onCancelTrip,
  onOpenNotifications,
}) {
  const tx = { ...FALLBACK, ...((t && t.errandMode) || {}) };
  const state = normalizeErrandState(errandState);
  const trip = activeTrip(state);
  const pending = pendingItems(trip);
  const done = allChecked(trip);
  const progress = tripProgress(trip);

  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const recRef = useRef(null);
  const heardRef = useRef("");
  const justDoneTimer = useRef(null);

  const addFromText = useCallback(
    (raw) => {
      const items = parseErrandText(raw);
      if (items.length === 0) return false;
      onAddItems(items);
      return true;
    },
    [onAddItems]
  );

  const submitDraft = () => {
    if (addFromText(draft)) setDraft("");
  };

  // ---- Voz ----
  // Mismo patrón que la Agenda (ScheduleAgendaPanel.jsx): una frase por
  // toque, con respaldo en onend porque Chrome en Android a veces termina
  // sin marcar el resultado como final.
  const stopVoice = useCallback(() => {
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      try {
        rec.stop();
      } catch (err) {
        /* ya estaba detenido */
      }
    }
    setListening(false);
  }, []);

  const startVoice = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setVoiceError(tx.voiceUnsupported);
      return;
    }
    setVoiceError("");
    setHeard("");
    heardRef.current = "";
    let handled = false;
    const finish = (transcript) => {
      if (handled) return;
      handled = true;
      if (!addFromText(transcript)) setVoiceError(tx.voiceNothing);
      setHeard("");
    };

    const rec = new SpeechRecognitionAPI();
    rec.lang = SPEECH_LANG[lang] || "es-MX";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      heardRef.current = transcript;
      setHeard(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        finish(transcript);
        stopVoice();
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        handled = true;
        setVoiceError(tx.voiceDenied);
      }
      stopVoice();
    };
    rec.onend = () => {
      setListening(false);
      if (!handled) finish(heardRef.current);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch (err) {
      setListening(false);
      setVoiceError(tx.voiceNothing);
    }
    // tx cambia de identidad en cada render; solo importan lang y addFromText.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, addFromText, stopVoice]);

  useEffect(() => () => stopVoice(), [stopVoice]);
  useEffect(() => () => clearTimeout(justDoneTimer.current), []);

  // ---- Aviso fijo en la bandeja ----
  // Solo cuando la lista CAMBIA (no al abrir la app): si la persona ya
  // descartó el aviso, no se lo volvemos a poner por el simple hecho de entrar.
  const signature = trip ? pending.map((it) => it.id).join("|") : "";
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    syncTrayNotification(trip, { title: tx.notifTitle, suffix: tx.notifSuffix });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const handleComplete = () => {
    if (!trip) return;
    onCompleteTrip(trip.id);
    setJustDone(true);
    clearTimeout(justDoneTimer.current);
    justDoneTimer.current = setTimeout(() => setJustDone(false), 5000);
  };

  // ---- Piezas compartidas ----
  const inputRow = (placeholder) => (
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitDraft();
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={300}
        enterKeyHint="done"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 14px",
          borderRadius: "12px",
          border: `1px solid ${C.border}`,
          background: C.surface,
          color: C.text,
          fontSize: "16px", // 16px evita el zoom automático de iOS al enfocar
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={submitDraft}
        disabled={!draft.trim()}
        aria-label={tx.addAria}
        style={{
          width: "48px",
          flexShrink: 0,
          borderRadius: "12px",
          border: "none",
          background: draft.trim() ? accent : C.surfaceAlt,
          color: draft.trim() ? "#fff" : C.textMuted,
          cursor: draft.trim() ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={20} />
      </button>
    </div>
  );

  const voiceFeedback = (
    <>
      {listening && heard && (
        <div
          aria-live="polite"
          style={{ background: tint("#DC2626", 0.08), borderRadius: "10px", padding: "10px 12px", fontSize: "13px", color: C.text, fontStyle: "italic" }}
        >
          “{heard}”
        </div>
      )}
      {voiceError && (
        <div role="status" style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>
          {voiceError}
        </div>
      )}
    </>
  );

  const pulseStyle = (
    <style>{`
      @keyframes errandPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
      @media (prefers-reduced-motion: reduce) { .errand-pulse { animation: none !important; } }
    `}</style>
  );

  // ════════════════ Sin salida activa: armar la lista ════════════════
  if (!trip) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {justDone && (
          <div
            role="status"
            style={{
              background: tint(DONE_COLOR, 0.12),
              border: `1px solid ${tint(DONE_COLOR, 0.35)}`,
              borderRadius: "12px",
              padding: "12px 14px",
              fontSize: "14px",
              fontWeight: 700,
              color: C.text,
            }}
          >
            ✅ {tx.justDone}
          </div>
        )}

        <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55, color: C.text }}>{tx.intro}</p>

        {SpeechRecognitionAPI && (
          <button
            type="button"
            onClick={listening ? stopVoice : startVoice}
            aria-pressed={listening}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "none",
              background: listening
                ? "linear-gradient(135deg, #EF4444, #DC2626)"
                : `linear-gradient(135deg, ${accent}, ${tint(accent, 0.7)})`,
              color: "#fff",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: listening ? "0 4px 20px rgba(239,68,68,0.35)" : `0 4px 16px ${tint(accent, 0.25)}`,
            }}
          >
            <span
              className="errand-pulse"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                animation: listening ? "errandPulse 1.4s ease-in-out infinite" : undefined,
              }}
            >
              <Mic size={24} color="#fff" />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "15px", fontWeight: 700 }}>
                {listening ? tx.listening : tx.voiceCTA}
              </span>
              <span style={{ display: "block", fontSize: "12px", opacity: 0.9, marginTop: "3px", lineHeight: 1.4 }}>
                {listening ? tx.tapToStop : tx.voiceHint}
              </span>
            </span>
          </button>
        )}

        {voiceFeedback}
        {inputRow(tx.typePlaceholder)}

        {state.archive.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowArchive((v) => !v)}
              aria-expanded={showArchive}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                color: C.textMuted,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              {showArchive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {tx.archiveTitle} ({state.archive.length})
            </button>
            {showArchive && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                {state.archive.map((old) => (
                  <div
                    key={old.id}
                    style={{ background: C.surfaceAlt, borderRadius: "10px", padding: "10px 12px", fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}
                  >
                    <div style={{ fontWeight: 700, color: C.text }}>
                      {new Date(old.completedAt || old.createdAt).toLocaleDateString(DATE_LOCALE[lang] || "es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {tx.archiveItems(old.items.length)}
                    </div>
                    {old.items.map((it) => `${it.icon} ${it.text}`).join(" · ")}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {pulseStyle}
      </div>
    );
  }

  // ════════════════ Salida activa: la lista ════════════════
  const barColor = done ? DONE_COLOR : accent;
  const checkedCount = trip.items.length - pending.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Cuánto falta — lo primero que se lee de un vistazo */}
      <div style={{ background: tint(barColor, 0.12), borderRadius: "14px", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
          <span aria-live="polite" style={{ fontSize: "18px", fontWeight: 800, color: C.text }}>
            {done ? tx.allDoneTitle : tx.pendingCount(pending.length)}
          </span>
          <span style={{ fontSize: "13px", color: C.textMuted, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {checkedCount}/{trip.items.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={trip.items.length}
          aria-valuenow={checkedCount}
          style={{ height: "8px", borderRadius: "4px", background: tint(barColor, 0.2), overflow: "hidden" }}
        >
          <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", borderRadius: "4px", background: barColor, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* La lista: toda la fila se toca para tachar (blanco grande, sin puntería) */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {trip.items.map((item) => (
          <li
            key={item.id}
            style={{
              display: "flex",
              alignItems: "stretch",
              background: item.checked ? tint(DONE_COLOR, 0.08) : C.surface,
              border: `1px solid ${item.checked ? tint(DONE_COLOR, 0.3) : C.border}`,
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={item.checked}
              onClick={() => onToggleItem(trip.id, item.id)}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: C.text,
              }}
            >
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "9px",
                  flexShrink: 0,
                  border: item.checked ? "none" : `2px solid ${C.textMuted}`,
                  background: item.checked ? DONE_COLOR : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.checked && <Check size={18} color="#fff" strokeWidth={3} />}
              </span>
              <span aria-hidden="true" style={{ fontSize: "22px", flexShrink: 0, opacity: item.checked ? 0.5 : 1 }}>
                {item.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "16px",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  overflowWrap: "anywhere",
                  color: item.checked ? C.textMuted : C.text,
                  textDecoration: item.checked ? "line-through" : "none",
                }}
              >
                {item.text}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemoveItem(trip.id, item.id)}
              aria-label={tx.removeAria(item.text)}
              style={{
                width: "44px",
                flexShrink: 0,
                background: "none",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} />
            </button>
          </li>
        ))}
      </ul>

      {done ? (
        <div
          style={{
            background: tint(DONE_COLOR, 0.1),
            border: `1px solid ${tint(DONE_COLOR, 0.3)}`,
            borderRadius: "14px",
            padding: "18px 16px",
            textAlign: "center",
          }}
        >
          <div aria-hidden="true" style={{ fontSize: "36px", lineHeight: 1, marginBottom: "8px" }}>🎉</div>
          <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5, marginBottom: "14px" }}>{tx.allDoneSub}</div>
          <button
            type="button"
            onClick={handleComplete}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: DONE_COLOR,
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {tx.celebrateBtn}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: "8px" }}>
            {SpeechRecognitionAPI && (
              <button
                type="button"
                onClick={listening ? stopVoice : startVoice}
                aria-pressed={listening}
                aria-label={listening ? tx.tapToStop : tx.voiceAddMore}
                title={tx.voiceAddMore}
                style={{
                  width: "48px",
                  minHeight: "48px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: listening ? "#DC2626" : accent,
                  color: "#fff",
                }}
              >
                <span className="errand-pulse" style={{ display: "flex", animation: listening ? "errandPulse 1.4s ease-in-out infinite" : undefined }}>
                  <Mic size={20} />
                </span>
              </button>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>{inputRow(tx.typeMorePlaceholder)}</div>
          </div>
          {listening && !heard && (
            <div aria-live="polite" style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>🎙️ {tx.listening}</div>
          )}
          {voiceFeedback}

          {/* Avisos: decir claro si van a llegar o no */}
          {notificationsGranted() ? (
            <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>🔔 {tx.notifOn}</p>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                background: C.surfaceAlt,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <span style={{ flex: 1, minWidth: "180px", fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>🔕 {tx.notifOff}</span>
              {onOpenNotifications && (
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${C.border}`,
                    background: C.surface,
                    color: C.text,
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {tx.notifOffAction}
                </button>
              )}
            </div>
          )}

          {/* Borrar la lista pide confirmar: un toque de más es barato, perder la lista no */}
          {confirmCancel ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: "140px", fontSize: "13px", color: C.text, fontWeight: 600 }}>{tx.cancelConfirm}</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmCancel(false);
                  onCancelTrip(trip.id);
                }}
                style={{ padding: "10px 14px", borderRadius: "10px", border: "none", background: "#DC2626", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                {tx.cancelYes}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                style={{ padding: "10px 14px", borderRadius: "10px", border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                {tx.cancelNo}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              style={{ alignSelf: "flex-start", background: "none", border: "none", padding: "8px 0", color: C.textMuted, fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              {tx.cancelTrip}
            </button>
          )}
        </>
      )}
      {pulseStyle}
    </div>
  );
}
