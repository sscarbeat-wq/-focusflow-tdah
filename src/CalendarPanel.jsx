import React, { useEffect, useState } from "react";
import { CalendarCheck, Link2, Unlink } from "lucide-react";
import {
  startGoogleAuth,
  fetchCalendarStatus,
  updateCalendarPreferences,
  disconnectCalendar,
} from "./calendarSync";

function btnStyle(bg, color, border) {
  return {
    background: bg,
    border: border ? `1px solid ${border}` : "none",
    borderRadius: "6px",
    padding: "12px 18px",
    color,
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  };
}

// Lee el aviso que deja /api/auth/google/callback en la URL
// (?calendar=connected|denied|error) una sola vez al montar, y limpia la URL
// después — mismo patrón que ya se usa en App.jsx para el regreso de Stripe.
function readRedirectMessage() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const value = params.get("calendar");
  if (!value) return null;
  window.history.replaceState({}, "", window.location.pathname);
  return value;
}

export default function CalendarPanel({ C, userId }) {
  const [status, setStatus] = useState("checking"); // checking | disconnected | connected
  const [prefs, setPrefs] = useState({ syncSteps: true, syncFocusSessions: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(readRedirectMessage);

  const loadStatus = async () => {
    try {
      const data = await fetchCalendarStatus(userId);
      setStatus(data.connected ? "connected" : "disconnected");
      setPrefs({ syncSteps: data.syncSteps, syncFocusSessions: data.syncFocusSessions });
    } catch (err) {
      setError(err.message || "No se pudo consultar el estado del calendario.");
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleConnect = () => {
    setBusy(true);
    startGoogleAuth(userId);
  };

  const handleDisconnect = async () => {
    setBusy(true);
    setError("");
    try {
      await disconnectCalendar(userId);
      setStatus("disconnected");
    } catch (err) {
      setError(err.message || "No se pudo desconectar.");
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePref = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await updateCalendarPreferences(userId, { [key]: next[key] });
    } catch (err) {
      setPrefs(prefs); // revierte si no se pudo guardar
      setError(err.message || "No se pudo guardar la preferencia.");
    }
  };

  const toggleRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div>
      {message === "connected" && (
        <p style={{ fontSize: "13px", color: C.mint, marginBottom: "12px", lineHeight: 1.5 }}>
          ✓ Tu Google Calendar quedó conectado.
        </p>
      )}
      {message === "denied" && (
        <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "12px", lineHeight: 1.5 }}>
          No se completó la conexión — si cambias de opinión, puedes intentarlo de nuevo cuando quieras.
        </p>
      )}
      {message === "error" && (
        <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>
          Algo falló al conectar tu calendario. Intenta de nuevo en un momento.
        </p>
      )}
      {error && <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>{error}</p>}

      {status === "checking" && (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>Consultando...</p>
      )}

      {status === "disconnected" && (
        <>
          <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
            Conecta tu Google Calendar para que los pasos del desglosador y tus sesiones de Modo Enfoque se
            bloqueen automáticamente como eventos — para que ese tiempo quede apartado de antemano, no solo
            registrado aquí dentro de Senda.
          </p>
          <button onClick={handleConnect} disabled={busy} style={btnStyle(C.mint, C.mintText)}>
            <Link2 size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
            {busy ? "Abriendo Google..." : "Conectar con Google Calendar"}
          </button>
        </>
      )}

      {status === "connected" && (
        <>
          <p style={{ fontSize: "13px", color: C.mint, marginBottom: "16px" }}>
            <CalendarCheck size={16} style={{ marginRight: "6px", verticalAlign: "-3px" }} />
            Conectado
          </p>

          <div style={toggleRowStyle}>
            <span style={{ fontSize: "13px", color: C.text }}>Bloquear tiempo para pasos del desglosador</span>
            <button
              onClick={() => handleTogglePref("syncSteps")}
              style={{
                background: prefs.syncSteps ? C.mint : C.surfaceAlt,
                border: "none",
                borderRadius: "20px",
                width: "40px",
                height: "22px",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
              }}
              aria-label="Sincronizar pasos del desglosador"
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: prefs.syncSteps ? "20px" : "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: prefs.syncSteps ? C.mintText : C.textMuted,
                  transition: "left 0.15s",
                }}
              />
            </button>
          </div>

          <div style={{ ...toggleRowStyle, borderBottom: "none" }}>
            <span style={{ fontSize: "13px", color: C.text }}>Bloquear tiempo para sesiones de Modo Enfoque</span>
            <button
              onClick={() => handleTogglePref("syncFocusSessions")}
              style={{
                background: prefs.syncFocusSessions ? C.mint : C.surfaceAlt,
                border: "none",
                borderRadius: "20px",
                width: "40px",
                height: "22px",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
              }}
              aria-label="Sincronizar sesiones de Modo Enfoque"
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: prefs.syncFocusSessions ? "20px" : "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: prefs.syncFocusSessions ? C.mintText : C.textMuted,
                  transition: "left 0.15s",
                }}
              />
            </button>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={busy}
            style={{ ...btnStyle(C.surfaceAlt, C.text, C.border), marginTop: "16px" }}
          >
            <Unlink size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
            {busy ? "Un momento..." : "Desconectar"}
          </button>
        </>
      )}
    </div>
  );
}
