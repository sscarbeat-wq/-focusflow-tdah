import React, { useState } from "react";
import { Play, Shuffle, ListTree, SkipForward, LogOut, CheckCircle2 } from "lucide-react";
import FocusMode from "./FocusMode";
import { tint } from "./theme";

// "Solo una cosa" — Módulo 4 de ANRO TDAH 2.0. Pensado para el momento en
// que ver TODO lo pendiente a la vez (el desglosador, los pasos, el
// temporizador con sus opciones) es justo lo que paraliza. Este panel
// nunca reconstruye nada que ya exista: antes de elegir una tarea, deja
// elegir entre los pasos pendientes del desglosador (misma lista que ya
// usa esa sección) o escribir una tarea suelta; al enfocarse, reutiliza
// FocusMode (en su variante `minimal`, ver FocusMode.jsx) para el
// temporizador y el ruido blanco — nada de eso se duplica aquí.
//
// Props:
//   C, t — tema y traducciones (mismo patrón que el resto de la app).
//   pendingSteps — pasos del desglosador con done=false (FocusFlowTDAH.jsx
//     ya los filtra antes de pasarlos).
//   current — oneThing.current (null | {id, text, stepId, startedAt}).
//   onStart(text, stepId) — elegir/empezar una tarea.
//   onFinish() — terminarla (el padre decide si además hay que marcar un
//     paso del desglosador como hecho, cuando stepId no es null).
//   onSwitch() — volver al selector sin registrar nada (cambiar de tarea no
//     es un fracaso).
//   onExit() — igual que onSwitch, pero además sale del modo enfoque.
//   onNeedHelp() — "no sé por dónde empezar" / "dividir en pasos": lleva al
//     desglosador con IA que ya existe, en vez de duplicar esa lógica aquí.
//   onSessionStart, onSessionComplete — mismos callbacks que ya usa el
//     panel "Modo Enfoque" (agendar en calendario, otorgar XP del
//     temporizador en sí, avisar al compañero de cuerpo-presente).
export default function OneThingPanel({
  C,
  t,
  pendingSteps,
  current,
  onStart,
  onFinish,
  onSwitch,
  onExit,
  onNeedHelp,
  onSessionStart,
  onSessionComplete,
}) {
  const [draft, setDraft] = useState("");

  const inputStyle = {
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px 14px",
    color: C.text,
    fontSize: "15px",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
  };

  const pillBtn = (bg, textColor) => ({
    background: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%), ${bg}`,
    border: "none",
    borderRadius: "999px",
    padding: "10px 18px",
    color: textColor,
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: `0 4px 10px ${tint(bg, 0.35)}`,
  });

  const ghostBtn = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "999px",
    padding: "10px 16px",
    color: C.text,
    fontSize: "14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };

  const start = (text, stepId = null) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    onStart(clean, stepId);
    setDraft("");
  };

  // ---- Ya hay una tarea activa: solo se ve ESA tarea + el temporizador ----
  if (current) {
    return (
      <div>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {t.oneThing.focusingOn}
        </p>
        <h3 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 18px", color: C.text, lineHeight: 1.25 }}>
          {current.text}
        </h3>

        <FocusMode C={C} t={t} minimal onSessionComplete={onSessionComplete} onSessionStart={onSessionStart} />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "18px" }}>
          <button onClick={onFinish} style={pillBtn(C.mint, C.mintText)}>
            <CheckCircle2 size={16} />
            {t.oneThing.finish}
          </button>
          <button onClick={() => onNeedHelp(current.text)} style={ghostBtn}>
            <ListTree size={15} />
            {t.oneThing.splitIntoSteps}
          </button>
          <button onClick={onSwitch} style={ghostBtn}>
            <SkipForward size={15} />
            {t.oneThing.switchTask}
          </button>
          <button onClick={onExit} style={ghostBtn}>
            <LogOut size={15} />
            {t.oneThing.exit}
          </button>
        </div>
      </div>
    );
  }

  // ---- Todavía no hay tarea activa: elegir una ----
  return (
    <div>
      <p style={{ fontSize: "14px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
        {t.oneThing.intro}
      </p>

      {pendingSteps && pendingSteps.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px" }}>{t.oneThing.fromSteps}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pendingSteps.slice(0, 5).map((s) => (
              <button
                key={s.id}
                onClick={() => start(s.text, s.id)}
                style={{
                  ...ghostBtn,
                  justifyContent: "space-between",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                }}
              >
                <span>{s.text}</span>
                <Play size={14} style={{ flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start(draft);
          }}
          placeholder={t.oneThing.placeholder}
          style={{ ...inputStyle, flex: "1 1 220px" }}
          maxLength={200}
        />
        <button onClick={() => start(draft)} style={pillBtn(C.coral, "#fff")} disabled={!draft.trim()}>
          <Play size={16} />
          {t.oneThing.start}
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
        <button onClick={() => onNeedHelp(draft)} style={ghostBtn}>
          <Shuffle size={15} />
          {t.oneThing.needHelp}
        </button>
      </div>
    </div>
  );
}
