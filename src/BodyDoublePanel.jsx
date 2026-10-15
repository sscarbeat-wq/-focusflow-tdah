import React from "react";
import { Users, LogOut } from "lucide-react";

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

export default function BodyDoublePanel({ C, joined, participants, join, leave }) {
  if (!joined) {
    return (
      <>
        <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
          Únete a una sala en vivo y trabaja en silencio al mismo tiempo que otras personas — nadie te ve, nadie te
          escribe, pero sientes que no estás solo. Es la técnica de "cuerpo doble", que a muchas personas con TDAH
          les ayuda a sostener el enfoque.
        </p>
        <button onClick={join} style={btnStyle(C.mint, C.mintText)}>
          <Users size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          Unirme a la sala
        </button>
      </>
    );
  }

  const count = participants.length;

  return (
    <>
      <p style={{ fontSize: "13px", color: C.mint, marginBottom: "4px" }}>
        {count <= 1
          ? "Estás solo en la sala por ahora — queda abierta, alguien más puede llegar."
          : `${count} personas en la sala ahora mismo, incluyéndote.`}
      </p>
      <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.5 }}>
        Nadie puede verte ni escribirte — solo saben que hay alguien más aquí, trabajando en silencio al mismo
        tiempo que tú.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
        {participants.map((p, i) => (
          <div
            key={i}
            title={p.isMe ? "Tú" : p.status === "enfocando" ? "Enfocándose" : "Aquí"}
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

      <button onClick={leave} style={{ ...btnStyle(C.surfaceAlt, C.text, C.border) }}>
        <LogOut size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
        Salir de la sala
      </button>
    </>
  );
}
