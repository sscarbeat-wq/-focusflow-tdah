import React, { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { getPushStatus, enablePush, disablePush } from "./push";

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

export default function NotificationsPanel({ C, userId }) {
  const [status, setStatus] = useState("checking"); // checking | unsupported | denied | off | on
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPushStatus().then((s) => active && setStatus(s));
    return () => {
      active = false;
    };
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setError("");
    try {
      await enablePush(userId);
      setStatus("on");
    } catch (err) {
      setError(err.message || "No se pudo activar. Intenta de nuevo.");
      setStatus(await getPushStatus());
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disablePush();
      setStatus("off");
    } finally {
      setBusy(false);
    }
  };

  if (status === "unsupported") {
    return (
      <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: 0 }}>
        Tu navegador no soporta notificaciones push todavía. En iPhone, primero instala Senda a tu pantalla de
        inicio (botón Compartir → "Agregar a pantalla de inicio") y ábrela desde ahí para poder activarlas.
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
        Un aviso si no has hecho tu registro de ánimo hoy, o si tu racha está por perderse — para no depender
        de acordarte de abrir la app.
      </p>

      {status === "denied" && (
        <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>
          Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes del navegador (el ícono
          junto a la dirección web) y recarga la página.
        </p>
      )}

      {error && <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>{error}</p>}

      {status === "on" ? (
        <button onClick={handleDisable} disabled={busy} style={btnStyle(C.surfaceAlt, C.text, C.border)}>
          <BellOff size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {busy ? "Un momento..." : "Desactivar notificaciones"}
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy || status === "denied" || status === "checking"}
          style={btnStyle(C.mint, C.mintText)}
        >
          <BellRing size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {busy ? "Un momento..." : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}
