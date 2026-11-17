import React, { useState } from "react";
import { Users, LogOut } from "lucide-react";
import { REACTIONS, bodyDoublePresenceText, bodyDoubleHintText } from "./bodyDoublePure";
import { tint } from "./theme";

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

// 16 de noviembre de 2026 ("quiero que esto tenga otro aspecto"): la
// tarjeta era puro texto y una fila de círculos chiquitos — se sentía más
// un formulario que el resto de la app (que sí se permite ilustrar: ver
// CalmBubbles.jsx, Mascot.jsx). Acá no se agrega NADA de lógica nueva —
// mismas props, mismos datos — solo cómo se pintan: los avatares flotan
// con un offset fijo por posición (no al azar en cada render, para que no
// "salten" solos) dentro de una escena con degradado del color de acento.
const FLOAT = [
  { dy: -6, rot: -4 },
  { dy: 10, rot: 3 },
  { dy: -12, rot: 2 },
  { dy: 6, rot: -3 },
  { dy: -4, rot: 5 },
  { dy: 11, rot: -2 },
];

// 17 de noviembre de 2026 ("podrían tener el movimiento de flotar?"): el
// offset de FLOAT ya no es solo una posición fija — cada burbuja sube y
// baja sola, sin sincronizarse con las demás (duración y demora distinta
// por posición, como ya hace CalmBubbles.jsx con --sway). Respeta
// prefers-reduced-motion (ver el <style> de abajo): ahí se queda quieta
// en el offset de siempre, sin animación.
// 17 de noviembre de 2026 ("el reacción se quita, quisiera que se
// quedara pero en la burbuja"): antes la reacción aparecía en un avisito
// aparte debajo, que se autoborraba a los 4 segundos (ver bodyDouble.js).
// Ahora se pinta pegada a la esquina de la burbuja de quien la mandó —
// bodyDouble.js ya no la borra sola, así que se queda hasta que esa
// persona mande otra (la reemplaza) o salga de la sala (ver
// AvatarCluster: solo se busca reacción entre quienes siguen en
// `participants`, así que si alguien se va, su reacción deja de
// encontrar burbuja y desaparece con ella).
function AvatarBubble({ C, accent, avatar, isMe, status, title, size = 52, index = 0, reactionEmoji }) {
  const f = FLOAT[index % FLOAT.length];
  const duration = 3.2 + (index % 4) * 0.55;
  const delay = -((index % 5) * 0.6);
  const badgeSize = Math.max(18, Math.round(size * 0.4));
  return (
    <div
      title={title}
      className="anro-bd-bubble"
      style={{
        position: "relative",
        "--bd-y": `${f.dy}px`,
        "--bd-rot": `${f.rot}deg`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.round(size * 0.46)}px`,
        background: `linear-gradient(160deg, ${tint(accent, 0.26)}, ${C.surface})`,
        border: isMe ? `2.5px solid ${C.lavender}` : `2px solid ${C.surface}`,
        boxShadow: `0 0 0 4px ${tint(accent, status === "enfocando" ? 0.22 : 0.09)}, 0 6px 14px rgba(0,0,0,0.14)`,
        flexShrink: 0,
      }}
    >
      {avatar}
      {reactionEmoji && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-4px",
            right: "-4px",
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            borderRadius: "50%",
            background: C.surface,
            border: `1.5px solid ${C.surface}`,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${Math.round(badgeSize * 0.62)}px`,
          }}
        >
          {reactionEmoji}
        </span>
      )}
    </div>
  );
}

// 17 de noviembre de 2026 ("y si hubiera más de 100 por ejemplo?"):
// pintar un círculo flotante POR CADA persona se cae con una sala grande
// — la tarjeta se volvería una pared interminable de avatares. A partir
// de `MAX_AVATARS` solo se dibujan los primeros y el resto se resume en
// un último círculo "+N" (mismo patrón que ya usa el chip del encabezado
// de Inicio — ver HomeHeader.jsx, shownAvatars/extra). El texto de
// arriba ("47 en la sala") siempre cuenta a TODOS, cueste lo que cueste
// dibujar — nunca depende de cuántos círculos entraron en pantalla.
const MAX_AVATARS_JOINED = 14;
const MAX_AVATARS_PEEK = 10;

function ExtraBubble({ C, accent, count, size = 52 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${Math.round(size * 0.3)}px`,
        fontWeight: 800,
        color: accent,
        background: C.surfaceAlt,
        border: `2px solid ${C.surface}`,
        boxShadow: `0 0 0 4px ${tint(accent, 0.1)}, 0 6px 14px rgba(0,0,0,0.14)`,
        flexShrink: 0,
      }}
    >
      +{count}
    </div>
  );
}

function AvatarCluster({ C, accent, participants, bd, size = 52, incomingReactions = [] }) {
  const max = size < 50 ? MAX_AVATARS_PEEK : MAX_AVATARS_JOINED;
  const shown = participants.slice(0, max);
  const extra = participants.length - shown.length;
  return (
    <>
      {shown.map((p, i) => {
        // Único vínculo que existe entre una reacción y quien la mandó es
        // el avatar (ver nota de privacidad en bodyDoublePure.js: nadie ve
        // quién es quién más allá de ese avatar) — si dos personas
        // comparten el mismo animal, la reacción se pega a la primera que
        // aparece en la lista, nunca a las dos a la vez.
        const reaction = incomingReactions.find((r) => r.avatar === p.avatar);
        return (
          <AvatarBubble
            key={i}
            index={i}
            C={C}
            accent={accent}
            avatar={p.avatar}
            isMe={p.isMe}
            status={p.status}
            title={p.isMe ? bd.youTitle : p.status === "enfocando" ? bd.focusingTitle : bd.hereTitle}
            size={size}
            reactionEmoji={reaction?.emoji}
          />
        );
      })}
      {extra > 0 && <ExtraBubble C={C} accent={accent} count={extra} size={size} />}
    </>
  );
}

// Escena con degradado suave del color de acento, donde flotan los
// avatares (o, si la sala está vacía, un único círculo en calma). Mismo
// componente para el estado "sin unirse" (espiando, sin datos inventados
// — bodyDouble.js ya escucha presencia desde que existe esta pantalla) y
// el estado "dentro de la sala".
function RoomScene({ C, accent, children, justifyCenter }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: "18px",
        background: `radial-gradient(circle at 25% 20%, ${tint(accent, 0.16)}, transparent 60%), radial-gradient(circle at 85% 85%, ${tint(accent, 0.1)}, transparent 55%), ${C.surfaceAlt}`,
        padding: "22px 18px",
        marginBottom: "14px",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: justifyCenter ? "center" : "flex-start",
        minHeight: "94px",
      }}
    >
      {/* 17 de noviembre de 2026 ("podrían tener el movimiento de
          flotar?"): sube y baja alrededor del offset fijo de siempre
          (--bd-y/--bd-rot, uno por burbuja — ver AvatarBubble arriba),
          nunca lo reemplaza del todo: con prefers-reduced-motion se
          apaga la animación y vuelve a quedarse quieta en ese offset. */}
      <style>{`
        @keyframes anroBDFloat {
          0%, 100% { transform: translateY(var(--bd-y)) rotate(var(--bd-rot)); }
          50% { transform: translateY(calc(var(--bd-y) - 9px)) rotate(var(--bd-rot)); }
        }
        .anro-bd-bubble { animation-name: anroBDFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anro-bd-bubble { animation: none !important; transform: translateY(var(--bd-y)) rotate(var(--bd-rot)); }
        }
      `}</style>
      {children}
    </div>
  );
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
  const accent = C.rose;
  const bd = t.bodyDouble;
  const count = participants.length;
  // Mismo texto corto que ya usa el chip del encabezado de Inicio (ver
  // HomeHeader.jsx) — una sola función de verdad para "cuántos hay y qué
  // tan llena está la sala", en vez de repetir frases sueltas aquí.
  const statusText = bodyDoublePresenceText(bd, joined, count);
  const hintText = bodyDoubleHintText(bd, joined, count);

  if (!joined) {
    return (
      <>
        {/* 16 de noviembre de 2026: antes de unirse no se mostraba nada de
            quién hay — pero bodyDouble.js ya "espía" presencia desde que
            existe esta pantalla (sin necesidad de unirse), así que
            `participants` puede tener gente real incluso aquí. Antes esa
            información se perdía; ahora se ve (atenuada, para marcar que
            todavía no estás "dentro") en vez de dejar la tarjeta vacía. */}
        <RoomScene C={C} accent={accent} justifyCenter={count === 0}>
          {count === 0 ? (
            <div
              aria-hidden="true"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                background: `linear-gradient(160deg, ${tint(accent, 0.22)}, ${C.surface})`,
                boxShadow: `0 0 0 6px ${tint(accent, 0.08)}`,
              }}
            >
              🌙
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", filter: "saturate(0.75)", opacity: 0.82 }}>
              <AvatarCluster C={C} accent={accent} participants={participants} bd={bd} size={46} />
            </div>
          )}
        </RoomScene>

        <p style={{ fontSize: "13px", fontWeight: 700, color: count > 0 ? accent : C.textMuted, margin: "0 0 14px" }}>
          {statusText}
          {hintText ? ` · ${hintText}` : ""}
        </p>

        <button onClick={join} style={{ ...btnStyle(C.mint, C.mintText), width: "100%", marginBottom: "10px" }}>
          <Users size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
          {bd.joinButton}
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
            {bd.whatIsThis}
          </button>
          {showInfo && (
            <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "8px 0 0" }}>
              {bd.intro}
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <RoomScene C={C} accent={accent}>
        <AvatarCluster C={C} accent={accent} participants={participants} bd={bd} incomingReactions={incomingReactions} />
      </RoomScene>

      <p style={{ fontSize: "13px", fontWeight: 700, color: accent, marginBottom: "4px" }}>
        {statusText}
      </p>
      <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px", lineHeight: 1.5 }}>
        {bd.privacyNote}
      </p>

      {/* 17 de noviembre de 2026 ("añade más reacciones"): de 3 a 6 —
          siguen sin texto libre (mismo vocabulario fijo y chico de
          bodyDoublePure.js, a propósito), solo son más opciones. Con 6 ya
          no caben en una sola fila de 390px, así que esta fila ahora sí
          envuelve (`flexWrap`) en vez de desbordarse. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "18px" }}>
        {REACTIONS.map((r) => (
          <button
            key={r.emoji}
            onClick={() => sendReaction?.(r.emoji)}
            title={bd.reactionLabels[r.emoji] || r.label}
            aria-label={bd.reactionLabels[r.emoji] || r.label}
            style={{
              fontSize: "20px",
              background: `linear-gradient(160deg, ${tint(accent, 0.14)}, ${C.surfaceAlt})`,
              border: `1px solid ${tint(accent, 0.3)}`,
              borderRadius: "14px",
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            {r.emoji}
          </button>
        ))}
      </div>

      <button onClick={leave} style={{ ...btnStyle("transparent", C.textMuted, C.border) }}>
        <LogOut size={16} style={{ marginRight: "8px", verticalAlign: "-3px" }} />
        {bd.leaveButton}
      </button>
    </>
  );
}
