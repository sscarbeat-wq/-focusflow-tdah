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

export default function NotificationsPanel({ C, t, userId, habitReminders = true, onToggleHabitReminders }) {
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

      {/* Avisos de hábitos (11 nov 2026): se pueden apagar por separado,
          sin apagar los de medicamentos, agenda o ánimo. El interruptor se
          guarda con el progreso (habitReminders) y el cron lo respeta —
          ver src/habitReminders.js. */}
      {onToggleHabitReminders && (
        <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `1px solid ${C.border}`, opacity: status === "on" ? 1 : 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14.5px", fontWeight: 700, color: C.text, margin: "0 0 3px" }}>🌱 {t.notifications.habitsTitle}</p>
              <p style={{ fontSize: "12.5px", color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{t.notifications.habitsDesc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={habitReminders}
              aria-label={t.notifications.habitsTitle}
              onClick={onToggleHabitReminders}
              style={{
                position: "relative",
                width: "52px",
                height: "30px",
                flexShrink: 0,
                borderRadius: "999px",
                border: "none",
                background: habitReminders ? C.mint : C.border,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "3px",
                  left: habitReminders ? "25px" : "3px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
          <p style={{ fontSize: "12.5px", fontWeight: 700, color: habitReminders ? C.text : C.textMuted, margin: "8px 0 0" }}>
            {habitReminders ? t.notifications.habitsOn : t.notifications.habitsOff}
          </p>
          {status !== "on" && (
            <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "6px 0 0", lineHeight: 1.5 }}>{t.notifications.habitsNeedsPush}</p>
          )}
        </div>
      )}
    </div>
  );
}
