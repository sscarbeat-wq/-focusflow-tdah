import React, { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { getPushStatus, enablePush, disablePush } from "./push";

function btnStyle(bg, color, border) {
  return {
    background: bg,
    border: border ? `1px solid ${border}` : "none",
    borderRadius: "12px",
    padding: "12px 18px",
    color,
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  };
}

export default function NotificationsPanel({ C, t, userId }) {
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
      setError(err.message || t.notifications.enableError);
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
        {t.notifications.unsupported}
      </p>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
        {t.notifications.intro}
      </p>

      {status === "denied" && (
        <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>
          {t.notifications.deniedWarning}
        </p>
      )}

      {error && <p style={{ fontSize: "13px", color: C.amber, marginBottom: "12px", lineHeight: 1.5 }}>{error}</p>}

      {status === "on" ? (
        <button onClick={handleDisable} disabled={busy} style={btnStyle(C.surfaceAlt, C.text, C.border)}>
          <BellOff size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {busy ? t.common.loading : t.notifications.disableButton}
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy || status === "denied" || status === "checking"}
          style={btnStyle(C.mint, C.mintText)}
        >
          <BellRing size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {busy ? t.common.loading : t.notifications.enableButton}
        </button>
      )}
    </div>
  );
}
