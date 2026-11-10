import React, { useEffect, useRef, useState } from "react";
import { tint } from "./theme";
import { tapFeedback } from "./celebrate";

// "Burbujas de calma" (10 de noviembre de 2026, "más interactiva" — mini
// juego de calma). Un minuto: un círculo guía la respiración (crece al
// inhalar 4s, se encoge al exhalar 6s — exhalación más larga que la
// inhalación, el patrón que ayuda a bajar la activación) y mientras tanto
// suben burbujas que se pueden reventar con un toque. Mientras exhalas
// brillan un poco más, como invitación a reventarlas EN la exhalación:
// así el juego empuja a bajar el ritmo en vez de a tocar rápido. No hay
// puntaje que ganar ni tiempo que vencer — solo un contador tranquilo.
// Al terminar el minuto da los mismos puntos que la burbuja de
// respiración (una sola vez por minuto completo).
// Con prefers-reduced-motion las burbujas no suben: aparecen quietas en
// lugares al azar y se desvanecen solas.

const INHALE_MS = 4000;
const EXHALE_MS = 6000;
const CYCLES = 6; // 6 × 10s = 1 minuto
const SPAWN_MS = 750;
const ARENA_H = 300;

function useReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function CalmBubbles({ C, t, accent, onComplete }) {
  const tx = t.app.calmBubbles;
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState("inhale");
  const [popped, setPopped] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [pops, setPops] = useState([]); // destellos de las reventadas
  const timers = useRef([]);
  const nextId = useRef(1);

  const clearAll = () => {
    timers.current.forEach((tm) => clearTimeout(tm) || clearInterval(tm));
    timers.current = [];
  };
  useEffect(() => clearAll, []);

  const start = () => {
    clearAll();
    setDone(false);
    setPopped(0);
    setBubbles([]);
    setRunning(true);
    tapFeedback("tap");
    let cycle = 0;
    const runCycle = () => {
      setPhase("inhale");
      timers.current.push(
        setTimeout(() => {
          setPhase("exhale");
          timers.current.push(
            setTimeout(() => {
              cycle += 1;
              if (cycle >= CYCLES) {
                finish(true);
              } else {
                runCycle();
              }
            }, EXHALE_MS)
          );
        }, INHALE_MS)
      );
    };
    runCycle();
    const spawn = setInterval(() => {
      const id = nextId.current++;
      const size = 34 + Math.round(Math.random() * 30);
      setBubbles((prev) => [
        ...prev.slice(-18),
        {
          id,
          size,
          x: 6 + Math.random() * 82,
          y: 10 + Math.random() * 70,
          dur: 7 + Math.random() * 3,
          sway: Math.round(Math.random() * 30 - 15),
        },
      ]);
    }, SPAWN_MS);
    timers.current.push(spawn);
  };

  const finish = (completed) => {
    clearAll();
    setRunning(false);
    setBubbles([]);
    if (completed) {
      setDone(true);
      onComplete?.();
    }
  };

  const pop = (b) => {
    tapFeedback("pop");
    setPopped((n) => n + 1);
    setBubbles((prev) => prev.filter((o) => o.id !== b.id));
    const pid = `${b.id}-p`;
    setPops((prev) => [...prev, { id: pid, x: b.x, size: b.size }]);
    timers.current.push(setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== pid)), 500));
  };

  const removeBubble = (id) => setBubbles((prev) => prev.filter((o) => o.id !== id));
  const exhaling = running && phase === "exhale";
  const guideScale = !running ? 0.75 : phase === "inhale" ? 1 : 0.6;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
      <style>{`
        @keyframes anroBubbleRise {
          0% { transform: translate(-50%, 0); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translate(calc(-50% + var(--sway)), -${ARENA_H * 0.55}px); }
          100% { transform: translate(-50%, -${ARENA_H + 80}px); opacity: 0.9; }
        }
        @keyframes anroBubbleStill { 0% { opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes anroBubblePop { 0% { transform: translate(-50%, 50%) scale(.6); opacity: 1; } 100% { transform: translate(-50%, 50%) scale(1.8); opacity: 0; } }
        .anro-bubble { transition: box-shadow .6s ease, filter .6s ease; }
        .anro-bubble:active { filter: brightness(1.1); }
      `}</style>

      {!running && !done && (
        <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, textAlign: "center", lineHeight: 1.5, maxWidth: "440px" }}>{tx.intro}</p>
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          height: `${ARENA_H}px`,
          borderRadius: "22px",
          overflow: "hidden",
          background: `radial-gradient(circle at 50% 110%, ${tint(accent, 0.28)} 0%, ${tint(accent, 0.08)} 55%, ${C.surfaceAlt} 100%)`,
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Círculo guía de respiración, al centro y detrás de las burbujas */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "150px",
            height: "150px",
            marginLeft: "-75px",
            marginTop: "-75px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.75) 0%, ${tint(accent, 0.35)} 60%, ${tint(accent, 0.5)} 100%)`,
            boxShadow: `0 0 40px ${tint(accent, 0.45)}`,
            transform: `scale(${reduced ? 0.8 : guideScale})`,
            transition: `transform ${phase === "inhale" ? INHALE_MS : EXHALE_MS}ms ease-in-out`,
          }}
        />
        <p
          role="status"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            margin: 0,
            textAlign: "center",
            fontSize: "16px",
            fontWeight: 800,
            color: C.text,
            pointerEvents: "none",
          }}
        >
          {running ? (phase === "inhale" ? tx.inhale : tx.exhale) : done ? tx.done : ""}
        </p>

        {bubbles.map((b) => (
          <button
            key={b.id}
            type="button"
            className="anro-bubble"
            aria-label={tx.bubbleAria}
            onClick={() => pop(b)}
            onAnimationEnd={() => removeBubble(b.id)}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              ...(reduced ? { top: `${b.y}%` } : { bottom: `-${b.size}px` }),
              width: `${b.size}px`,
              height: `${b.size}px`,
              padding: 0,
              borderRadius: "50%",
              cursor: "pointer",
              border: "1.5px solid rgba(255,255,255,0.85)",
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 22%, ${tint(accent, 0.25)} 70%, ${tint(accent, 0.45)} 100%)`,
              boxShadow: exhaling ? `0 0 16px ${tint(accent, 0.9)}` : `0 2px 8px ${tint(accent, 0.3)}`,
              "--sway": `${b.sway}px`,
              animation: reduced
                ? `anroBubbleStill ${b.dur}s ease-in-out forwards`
                : `anroBubbleRise ${b.dur}s linear forwards`,
              transform: reduced ? "translate(-50%, 0)" : undefined,
              touchAction: "manipulation",
            }}
          />
        ))}
        {pops.map((p) => (
          <span
            key={p.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${p.x}%`,
              bottom: "50%",
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              border: `2px solid ${tint(accent, 0.8)}`,
              animation: "anroBubblePop 0.45s ease-out forwards",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: C.textMuted }}>{tx.popped(popped)}</span>
        {running ? (
          <button
            type="button"
            onClick={() => finish(false)}
            style={{
              minHeight: "42px",
              padding: "10px 18px",
              borderRadius: "999px",
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.text,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {tx.stop}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            style={{
              minHeight: "42px",
              padding: "10px 22px",
              borderRadius: "999px",
              border: "none",
              background: accent,
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 6px 16px ${tint(accent, 0.4)}`,
            }}
          >
            {done ? tx.again : tx.start}
          </button>
        )}
      </div>
    </div>
  );
}
