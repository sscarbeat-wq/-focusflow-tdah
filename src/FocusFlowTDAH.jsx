import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Award,
  ListTree,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Hand,
  Wind,
  Brain,
  Moon,
  Utensils,
  Activity,
  Layout as LayoutIcon,
  LogOut,
} from "lucide-react";

import InstallBanner from "./InstallBanner";

const C = {
  bg: "#141B2E",
  surface: "#1D2740",
  surfaceAlt: "#24304D",
  border: "#34405F",
  text: "#E8EAF0",
  textMuted: "#8E96AC",
  mint: "#8FCBB0",
  mintDark: "#5FA085",
  mintText: "#12261E",
  lavender: "#B3A6D9",
  lavenderDark: "#8B7CBF",
  lavenderText: "#201A33",
  amber: "#D9A15C",
  amberText: "#2E2008",
};

function Panel({ accent, icon, title, subtitle, children }) {
  return (
    <div
      style={{
        background: C.surface,
        borderTop: `3px solid ${accent}`,
        borderRadius: "6px",
        padding: "22px 22px 24px",
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ color: accent, marginTop: "2px", flexShrink: 0 }}>{icon}</div>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 600, margin: 0, color: C.text }}>{title}</h2>
          {subtitle && (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: "5px 0 0", lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "10px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {checked ? (
        <CheckCircle2 size={20} color={C.mint} style={{ flexShrink: 0 }} />
      ) : (
        <Circle size={20} color={C.textMuted} style={{ flexShrink: 0 }} />
      )}
      <span style={{ fontSize: "14px", color: checked ? C.text : C.textMuted }}>{label}</span>
    </button>
  );
}

const DEFAULT_PROGRESS = {
  xp: 0,
  jar: [],
  screensOff: false,
  sleepEnv: false,
  ateWell: false,
  hydrated: false,
  deskCleared: false,
};

export default function FocusFlowTDAH({ initialProgress, onProgressChange, userEmail, onSignOut }) {
  const saved = { ...DEFAULT_PROGRESS, ...(initialProgress || {}) };

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const breathingSectionRef = useRef(null);
  const stopThinkSectionRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const atajo = params.get("atajo");
    if (!atajo) return;
    const target = atajo === "respirar" ? breathingSectionRef.current : atajo === "freno" ? stopThinkSectionRef.current : null;
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, []);

  // ---- Persisted state ----
  const [xp, setXp] = useState(saved.xp);
  const [jar, setJar] = useState(saved.jar);
  const [screensOff, setScreensOff] = useState(saved.screensOff);
  const [sleepEnv, setSleepEnv] = useState(saved.sleepEnv);
  const [ateWell, setAteWell] = useState(saved.ateWell);
  const [hydrated, setHydrated] = useState(saved.hydrated);
  const [deskCleared, setDeskCleared] = useState(saved.deskCleared);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onProgressChange?.({ xp, jar, screensOff, sleepEnv, ateWell, hydrated, deskCleared });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp, jar, screensOff, sleepEnv, ateWell, hydrated, deskCleared]);

  // ---- XP + jar ----
  const [xpMsg, setXpMsg] = useState("");
  const xpTimeout = useRef(null);

  const grantXp = useCallback((label) => {
    setXp((p) => Math.round((p + 0.85) * 100) / 100);
    setXpMsg(`+0.85 XP — ${label}`);
    setJar((prev) => [{ id: Date.now(), label }, ...prev].slice(0, 12));
    if (xpTimeout.current) clearTimeout(xpTimeout.current);
    xpTimeout.current = setTimeout(() => setXpMsg(""), 2400);
  }, []);

  useEffect(() => () => xpTimeout.current && clearTimeout(xpTimeout.current), []);

  // ---- Dismantler (no persiste entre sesiones) ----
  const [bigTask, setBigTask] = useState("");
  const [steps, setSteps] = useState([]);
  const [stepDraft, setStepDraft] = useState("");
  const [stepMin, setStepMin] = useState(5);

  const addStep = () => {
    if (!stepDraft.trim() || steps.length >= 5) return;
    setSteps((p) => [...p, { id: Date.now(), text: stepDraft.trim(), min: stepMin, done: false }]);
    setStepDraft("");
    setStepMin(5);
  };
  const toggleStep = (id) =>
    setSteps((p) =>
      p.map((s) => {
        if (s.id !== id) return s;
        const done = !s.done;
        if (done) grantXp(`paso completado — ${s.text}`);
        return { ...s, done };
      })
    );
  const removeStep = (id) => setSteps((p) => p.filter((s) => s.id !== id));

  // ---- Time auditor ----
  const [estimateMin, setEstimateMin] = useState(15);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audit, setAudit] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (running) timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [running]);

  const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  const stopAudit = () => {
    setRunning(false);
    const realMin = elapsed / 60;
    if (realMin > 0 && estimateMin > 0) {
      const diff = Math.round(((realMin - estimateMin) / estimateMin) * 100);
      setAudit({ realMin: Math.round(realMin * 10) / 10, diff });
      grantXp("registraste tu tiempo real");
    }
  };
  const resetAudit = () => {
    setRunning(false);
    setElapsed(0);
    setAudit(null);
  };

  // ---- Stop & Think ----
  const [stFlowOpen, setStFlowOpen] = useState(false);
  const [stStage, setStStage] = useState(0);
  const [breathCountdown, setBreathCountdown] = useState(3);
  const stTimerRef = useRef(null);

  const startStopThink = () => {
    setStFlowOpen(true);
    setStStage(0);
  };
  const closeStopThink = () => {
    setStFlowOpen(false);
    setStStage(0);
    if (stTimerRef.current) clearInterval(stTimerRef.current);
  };
  const advanceStage = () => {
    if (stStage === 0) {
      setStStage(1);
      setBreathCountdown(3);
    } else if (stStage === 2) {
      setStStage(3);
    } else if (stStage === 3) {
      grantXp("usaste el freno de impulsividad");
      closeStopThink();
    }
  };
  useEffect(() => {
    if (stStage === 1) {
      stTimerRef.current = setInterval(() => {
        setBreathCountdown((c) => {
          if (c <= 1) {
            clearInterval(stTimerRef.current);
            setStStage(2);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => stTimerRef.current && clearInterval(stTimerRef.current);
  }, [stStage]);

  // ---- Mindfulness bubble ----
  const [breathingOn, setBreathingOn] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const breathRef = useRef(null);
  const phaseLabel = ["Inhala", "Retén", "Exhala"];

  useEffect(() => {
    if (breathingOn) {
      breathRef.current = setInterval(() => {
        setCount((c) => {
          if (c <= 1) {
            setPhase((p) => {
              const next = (p + 1) % 3;
              return next;
            });
            return 4;
          }
          return c - 1;
        });
      }, 1000);
    } else if (breathRef.current) clearInterval(breathRef.current);
    return () => breathRef.current && clearInterval(breathRef.current);
  }, [breathingOn]);

  const cyclesRef = useRef(0);
  useEffect(() => {
    if (breathingOn && phase === 0) {
      cyclesRef.current += 1;
      if (cyclesRef.current > 1 && cyclesRef.current >= 6) {
        setBreathingOn(false);
        cyclesRef.current = 0;
        grantXp("completaste tu minuto de respiración");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const scale = phase === 0 ? 1.3 : phase === 1 ? 1.3 : 0.85;

  const startBreathing = () => {
    setPhase(0);
    setCount(4);
    cyclesRef.current = 0;
    setBreathingOn(true);
  };

  // ---- CBT reframe ----
  const [rfStage, setRfStage] = useState(0);
  const [rfThought, setRfThought] = useState("");
  const [rfEvidenceAgainst, setRfEvidenceAgainst] = useState("");
  const [rfAlternative, setRfAlternative] = useState("");

  const rfNext = () => {
    if (rfStage === 0 && rfThought.trim()) setRfStage(1);
    else if (rfStage === 1 && rfEvidenceAgainst.trim()) setRfStage(2);
    else if (rfStage === 2 && rfAlternative.trim()) {
      setRfStage(3);
      grantXp("reestructuraste un pensamiento");
    }
  };
  const rfReset = () => {
    setRfStage(0);
    setRfThought("");
    setRfEvidenceAgainst("");
    setRfAlternative("");
  };

  // ---- Movement break (no persiste el conteo entre sesiones) ----
  const [breakRunning, setBreakRunning] = useState(false);
  const [breakSec, setBreakSec] = useState(300);
  const [breakDone, setBreakDone] = useState(false);
  const breakRef = useRef(null);

  useEffect(() => {
    if (breakRunning && breakSec > 0) {
      breakRef.current = setInterval(() => {
        setBreakSec((s) => {
          if (s <= 1) {
            setBreakRunning(false);
            setBreakDone(true);
            grantXp("pausa activa completada");
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => breakRef.current && clearInterval(breakRef.current);
  }, [breakRunning, grantXp]);

  const toggleXp = (setter, current, label) => {
    const next = !current;
    setter(next);
    if (next) grantXp(label);
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "14px",
    fontFamily: "inherit",
  };

  const btnPrimary = (bg, textColor) => ({
    background: bg,
    border: "none",
    borderRadius: "6px",
    padding: "10px 16px",
    color: textColor,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  });

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "10px 16px",
    color: C.text,
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        minHeight: "100vh",
        padding: "28px 18px 70px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <InstallBanner />
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "14px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>FocusFlow TDAH</h1>
            <p style={{ fontSize: "13px", color: C.textMuted, margin: "6px 0 0" }}>
              {userEmail ? `Sesión de ${userEmail}` : "Sistema de habituación y regulación"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                position: "relative",
              }}
            >
              <Sparkles size={18} color={C.amber} />
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.1 }}>{xp.toFixed(2)} XP</div>
                <div style={{ fontSize: "11px", color: C.textMuted }}>foco acumulado</div>
              </div>
              {xpMsg && (
                <div
                  style={{
                    position: "absolute",
                    top: "-32px",
                    right: 0,
                    background: C.mintDark,
                    color: C.mintText,
                    fontSize: "12px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {xpMsg}
                </div>
              )}
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                aria-label="Cerrar sesión"
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.textMuted,
                  cursor: "pointer",
                }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>

        {/* Dopamine jar */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "6px",
            padding: "14px 18px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: jar.length ? "10px" : 0 }}>
            <Award size={16} color={C.lavender} />
            <span style={{ fontSize: "13px", color: C.textMuted }}>Tarro de logros</span>
          </div>
          {jar.length === 0 ? (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
              Cada micro-logro que completes va a aparecer aquí.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {jar.map((j) => (
                <span
                  key={j.id}
                  style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: "20px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    color: C.lavender,
                  }}
                >
                  {j.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: C.surfaceAlt,
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "24px",
            fontSize: "12px",
            color: C.textMuted,
            lineHeight: 1.6,
          }}
        >
          Esta app es una herramienta de apoyo de hábitos. La investigación sobre rutinas y hábitos en TDAH está
          concentrada sobre todo en niños, y hoy no existe un instrumento validado para medir esto en adultos —
          por eso funciona como acompañamiento práctico, no como algo clínicamente validado, y no reemplaza
          evaluación o tratamiento profesional.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "0 20px" }}>
          <div>
            <Panel
              accent={C.mint}
              icon={<ListTree size={22} />}
              title="El desglosador"
              subtitle="Si te cuesta empezar, suele ser porque el primer paso es demasiado grande."
            >
              <input
                type="text"
                value={bigTask}
                onChange={(e) => setBigTask(e.target.value)}
                placeholder="¿Qué tarea estás postergando?"
                style={{ ...inputStyle, marginBottom: "14px" }}
              />
              {bigTask.trim() && (
                <>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={stepDraft}
                      onChange={(e) => setStepDraft(e.target.value)}
                      placeholder={`Paso ${steps.length + 1}`}
                      disabled={steps.length >= 5}
                      style={{ ...inputStyle, flex: "1 1 140px" }}
                    />
                    <select
                      value={stepMin}
                      onChange={(e) => setStepMin(Number(e.target.value))}
                      style={{ ...inputStyle, width: "auto" }}
                    >
                      {[2, 5, 10, 15, 20].map((m) => (
                        <option key={m} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addStep}
                      disabled={steps.length >= 5 || !stepDraft.trim()}
                      style={{
                        ...btnPrimary(C.mint, C.mintText),
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        opacity: steps.length >= 5 ? 0.5 : 1,
                      }}
                    >
                      <Plus size={14} /> Añadir
                    </button>
                  </div>
                  <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {steps.map((s, i) => (
                      <li
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 0",
                          borderBottom: `1px solid ${C.border}`,
                        }}
                      >
                        <span
                          onClick={() => toggleStep(s.id)}
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: s.done ? C.mint : C.surfaceAlt,
                            color: s.done ? C.mintText : C.textMuted,
                            fontSize: "12px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            cursor: "pointer",
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          {s.done ? <CheckCircle2 size={13} /> : i + 1}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: "14px",
                            textDecoration: s.done ? "line-through" : "none",
                            color: s.done ? C.textMuted : C.text,
                          }}
                        >
                          {s.text}
                        </span>
                        <span style={{ fontSize: "12px", color: C.textMuted }}>{s.min} min</span>
                        <button
                          onClick={() => removeStep(s.id)}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted }}
                          aria-label="Eliminar paso"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </Panel>

            <Panel
              accent={C.amber}
              icon={<Timer size={22} />}
              title="El auditor de tiempo"
              subtitle="Compara cuánto piensas que va a tardar contra lo que realmente tarda."
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: C.textMuted }}>Estimado</label>
                <input
                  type="number"
                  min={1}
                  value={estimateMin}
                  onChange={(e) => setEstimateMin(Math.max(1, Number(e.target.value)))}
                  disabled={running || elapsed > 0}
                  style={{ ...inputStyle, width: "60px" }}
                />
                <span style={{ fontSize: "13px", color: C.textMuted }}>min</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <span style={{ fontSize: "34px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(elapsed)}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!running ? (
                    <button
                      onClick={() => setRunning(true)}
                      aria-label="Iniciar"
                      style={{
                        ...btnPrimary(C.mint, C.mintText),
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Play size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={stopAudit}
                      aria-label="Detener"
                      style={{
                        ...btnPrimary(C.amber, C.amberText),
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Pause size={18} />
                    </button>
                  )}
                  <button
                    onClick={resetAudit}
                    aria-label="Reiniciar"
                    style={{
                      ...btnGhost,
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
              {audit && (
                <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "12px 14px", fontSize: "14px" }}>
                  Tardaste {audit.realMin} min contra {estimateMin} min estimados —{" "}
                  {audit.diff > 0
                    ? `un ${audit.diff}% más de lo que pensabas.`
                    : audit.diff < 0
                    ? `un ${Math.abs(audit.diff)}% menos de lo que pensabas.`
                    : "justo lo estimado."}
                </div>
              )}
            </Panel>
          </div>

          <div>
            <div ref={stopThinkSectionRef}>
            <Panel
              accent={C.lavender}
              icon={<Hand size={22} />}
              title="Freno de impulsividad"
              subtitle="Alto, respira, evalúa, actúa."
            >
              {!stFlowOpen ? (
                <button onClick={startStopThink} style={{ ...btnPrimary(C.lavender, C.lavenderText), width: "100%" }}>
                  Presionar antes de actuar
                </button>
              ) : (
                <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "18px", textAlign: "center" }}>
                  {stStage === 0 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Alto</p>
                      <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px" }}>
                        Pausa un segundo antes de seguir.
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        Listo
                      </button>
                    </>
                  )}
                  {stStage === 1 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Respira</p>
                      <p style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 8px" }}>{breathCountdown}</p>
                    </>
                  )}
                  {stStage === 2 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Evalúa</p>
                      <p style={{ fontSize: "14px", color: C.text, margin: "0 0 16px" }}>
                        ¿Esta acción te acerca a lo que quieres lograr?
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        Ya lo pensé
                      </button>
                    </>
                  )}
                  {stStage === 3 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Actúa</p>
                      <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px" }}>
                        Sigue con la decisión que tomaste.
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        Terminar
                      </button>
                    </>
                  )}
                  <button
                    onClick={closeStopThink}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: C.textMuted,
                      cursor: "pointer",
                      fontSize: "12px",
                      marginTop: "12px",
                      display: "block",
                      marginLeft: "auto",
                      marginRight: "auto",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </Panel>
            </div>

            <div ref={breathingSectionRef}>
            <Panel
              accent={C.mint}
              icon={<Wind size={22} />}
              title="Burbuja de enfoque"
              subtitle="Un minuto de respiración guiada para bajar la sobrecarga."
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: `2px solid ${C.mint}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    transform: `scale(${breathingOn ? scale : 1})`,
                    transition: "transform 1s ease-in-out",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{breathingOn ? phaseLabel[phase] : "Listo"}</div>
                    {breathingOn && <div style={{ fontSize: "20px", fontWeight: 700 }}>{count}</div>}
                  </div>
                </div>
                <button
                  onClick={breathingOn ? () => setBreathingOn(false) : startBreathing}
                  style={breathingOn ? btnGhost : btnPrimary(C.mint, C.mintText)}
                >
                  {breathingOn ? "Detener" : "Empezar"}
                </button>
              </div>
            </Panel>
            </div>

            <Panel
              accent={C.lavender}
              icon={<Brain size={22} />}
              title="Reestructuración de pensamientos"
              subtitle="Un pensamiento automático no siempre es un hecho."
            >
              {rfStage === 0 && (
                <>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 8px" }}>
                    ¿Qué pensamiento te está pesando ahora?
                  </p>
                  <textarea
                    value={rfThought}
                    onChange={(e) => setRfThought(e.target.value)}
                    placeholder='Por ejemplo: "siempre fallo en esto"'
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button onClick={rfNext} disabled={!rfThought.trim()} style={btnPrimary(C.lavender, C.lavenderText)}>
                    Seguir
                  </button>
                </>
              )}
              {rfStage === 1 && (
                <>
                  <p style={{ fontSize: "13px", color: C.text, margin: "0 0 8px" }}>
                    Pensaste: "{rfThought}". ¿Qué evidencia real tienes en contra de eso?
                  </p>
                  <textarea
                    value={rfEvidenceAgainst}
                    onChange={(e) => setRfEvidenceAgainst(e.target.value)}
                    placeholder="Por ejemplo: hay veces que sí lo logré, aunque me cueste"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button
                    onClick={rfNext}
                    disabled={!rfEvidenceAgainst.trim()}
                    style={btnPrimary(C.lavender, C.lavenderText)}
                  >
                    Seguir
                  </button>
                </>
              )}
              {rfStage === 2 && (
                <>
                  <p style={{ fontSize: "13px", color: C.text, margin: "0 0 8px" }}>
                    Con esa evidencia, ¿cómo podrías decirlo de forma más realista?
                  </p>
                  <textarea
                    value={rfAlternative}
                    onChange={(e) => setRfAlternative(e.target.value)}
                    placeholder="Por ejemplo: me cuesta esto, pero no siempre fallo"
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button
                    onClick={rfNext}
                    disabled={!rfAlternative.trim()}
                    style={btnPrimary(C.lavender, C.lavenderText)}
                  >
                    Terminar
                  </button>
                </>
              )}
              {rfStage === 3 && (
                <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "14px" }}>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 6px" }}>Tu pensamiento alternativo:</p>
                  <p style={{ fontSize: "15px", margin: "0 0 14px" }}>{rfAlternative}</p>
                  <button onClick={rfReset} style={btnGhost}>
                    Hacer otro
                  </button>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <Panel
          accent={C.amber}
          icon={<Moon size={22} />}
          title="Rastreador de estilo de vida"
          subtitle="Sueño, alimentación y movimiento son los hábitos con más evidencia asociada al TDAH. El de abajo a la derecha es un tip práctico adicional, no algo medido en los estudios."
        >
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "0 24px" }}>
            <div>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Moon size={13} /> Higiene del sueño
              </p>
              <Toggle label="Apagué las pantallas a tiempo" checked={screensOff} onChange={(v) => toggleXp(setScreensOff, screensOff, "pantallas apagadas a tiempo")} />
              <Toggle label="Preparé el entorno para dormir" checked={sleepEnv} onChange={(v) => toggleXp(setSleepEnv, sleepEnv, "entorno de sueño listo")} />
            </div>
            <div>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Utensils size={13} /> Alimentación
              </p>
              <Toggle label="Comí algo nutritivo hoy" checked={ateWell} onChange={(v) => toggleXp(setAteWell, ateWell, "comida nutritiva")} />
              <Toggle label="Tomé agua a lo largo del día" checked={hydrated} onChange={(v) => toggleXp(setHydrated, hydrated, "hidratación")} />
            </div>
            <div style={{ marginTop: "18px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={13} /> Movimiento
              </p>
              {!breakDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button
                    onClick={() => setBreakRunning((r) => !r)}
                    style={btnPrimary(breakRunning ? C.surfaceAlt : C.amber, breakRunning ? C.text : C.amberText)}
                  >
                    {breakRunning ? "Pausar" : "Pausa activa de 5 min"}
                  </button>
                  <span style={{ fontSize: "18px", fontVariantNumeric: "tabular-nums" }}>{fmt(breakSec)}</span>
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: C.mint, margin: 0 }}>Pausa completada.</p>
              )}
            </div>
            <div style={{ marginTop: "18px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <LayoutIcon size={13} /> Espacio de trabajo
              </p>
              <Toggle
                label='"Fuera de la vista, fuera de la mente" — orden rápido del escritorio'
                checked={deskCleared}
                onChange={(v) => toggleXp(setDeskCleared, deskCleared, "escritorio ordenado")}
              />
            </div>
          </div>
        </Panel>

        <p style={{ fontSize: "12px", color: C.textMuted, textAlign: "center", lineHeight: 1.6, marginTop: "8px" }}>
          Esto es una herramienta de apoyo y no reemplaza una evaluación o tratamiento profesional.
        </p>
      </div>
    </div>
  );
}
