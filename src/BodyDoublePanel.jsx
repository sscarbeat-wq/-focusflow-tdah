import React from "react";
import { Users, LogOut } from "lucide-react";
import { REACTIONS } from "./bodyDoublePure";

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

export default function BodyDoublePanel({
  C,
  t,
  joined,
  participants,
  incomingReactions = [],
  join,
  leave,
  sendReaction,
}) {
  if (!joined) {
    return (
      <>
        <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
          {t.bodyDouble.intro}
        </p>
        <button onClick={join} style={btnStyle(C.mint, C.mintText)}>
          <Users size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {t.bodyDouble.joinButton}
        </button>
      </>
    );
  }

  const count = participants.length;

  return (
    <>
      <p style={{ fontSize: "13px", color: C.mint, marginBottom: "4px" }}>
        {count <= 1 ? t.bodyDouble.aloneInRoom : t.bodyDouble.roomCount(count)}
      </p>
      <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.5 }}>
        {t.bodyDouble.privacyNote}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
        {participants.map((p, i) => (
          <div
            key={i}
            title={p.isMe ? t.bodyDouble.youTitle : p.status === "enfocando" ? t.bodyDouble.focusingTitle : t.bodyDouble.hereTitle}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              background: p.status === "enfocando" ? C.mint : C.surfaceAlt,
              border: p.isMe ? `2px solid ${C.lavender}` : `1px solid ${C.border}`,
            }}
          >
            {p.avatar}
          </div>
        ))}
      </div>

      {incomingReactions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          {incomingReactions.map((r) => (
            <div
              key={r.id}
              style={{
                fontSize: "13px",
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: "999px",
                padding: "4px 10px",
              }}
            >
              {r.avatar} {r.emoji}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {REACTIONS.map((r) => (
          <button
            key={r.emoji}
            onClick={() => sendReaction?.(r.emoji)}
            title={t.bodyDouble.reactionLabels[r.emoji] || r.label}
            aria-label={t.bodyDouble.reactionLabels[r.emoji] || r.label}
            style={{
              fontSize: "18px",
              background: C.surfaceAlt,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {r.emoji}
          </button>
        ))}
      </div>

      <button onClick={leave} style={{ ...btnStyle(C.surfaceAlt, C.text, C.border) }}>
        <LogOut size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
        {t.bodyDouble.leaveButton}
      </button>
    </>
  );
}
