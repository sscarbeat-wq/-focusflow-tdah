import React, { useState } from "react";
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
  // 16 de noviembre de 2026 ("no podría quedarse como implícito, solo en
  // caso de saber que hace"): el texto de qué es esto ya no se ve siempre
  // — ahora el botón de unirse va primero, y la explicación queda oculta
  // detrás de un enlace pequeño ("¿Qué es esto?"), para quien de verdad no
  // sabe y la busca. `showInfo` es estado local: no necesita recordarse de
  // una vez a otra, cada vez que se abre esta pantalla puede o no
  // interesarle leerlo.
  const [showInfo, setShowInfo] = useState(false);

  if (!joined) {
    return (
      <>
        <button onClick={join} style={{ ...btnStyle(C.mint, C.mintText), marginBottom: "10px" }}>
          <Users size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {t.bodyDouble.joinButton}
        </button>
        <div>
          <button
            type="button"
            onClick={() => setShowInfo((v) => !v)}
            aria-expanded={showInfo}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: C.textMuted,
              fontSize: "12px",
              fontWeight: 700,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {t.bodyDouble.whatIsThis}
          </button>
          {showInfo && (
            <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "8px 0 0" }}>
              {t.bodyDouble.intro}
            </p>
          )}
        </div>
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
