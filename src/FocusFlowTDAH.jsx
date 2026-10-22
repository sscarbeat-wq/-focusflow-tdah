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
  Headphones,
  Smile,
  Bell,
  Sun,
  TrendingUp,
  CalendarRange,
  Users,
  Volume2,
  VolumeX,
  BookOpen,
  HeartHandshake,
  MessageSquare,
  ListChecks,
  Pill,
  BatteryMedium,
  Shuffle,
  CreditCard,
  StickyNote,
  FileText,
  ShoppingCart,
  Heart,
  Clock,
  Flower2,
} from "lucide-react";

import LanguageSwitcher from "./LanguageSwitcher";
import InstallBanner from "./InstallBanner";
import PostDiagnosisCard from "./PostDiagnosisCard";
import ScienceCapsulePanel from "./ScienceCapsulePanel";
import MindfulnessPanel from "./MindfulnessPanel";
import Mascot from "./Mascot";
import FocusMode from "./FocusMode";
import MoodLog from "./MoodLog";
import EnergyLog from "./EnergyLog";
import MedicationPanel from "./MedicationPanel";
import PaymentsPanel from "./PaymentsPanel";
import NotificationsPanel from "./NotificationsPanel";
import WeeklyInsights from "./WeeklyInsights";
import CalendarPanel from "./CalendarPanel";
import BodyDoublePanel from "./BodyDoublePanel";
import CbtProgramPanel from "./CbtProgramPanel";
import CompanionPanel from "./CompanionPanel";
import TodayPanel from "./TodayPanel";
import MessageTonePanel from "./MessageTonePanel";
import QuickCapturePanel from "./QuickCapturePanel";
import ClinicalReportPanel from "./ClinicalReportPanel";
import GoodMomentsPanel from "./GoodMomentsPanel";
import DayTimelinePanel from "./DayTimelinePanel";
import { scheduleStepsOnCalendar } from "./calendarSync";
import { useBodyDouble } from "./bodyDouble";
import { celebrate } from "./celebrate";
import { DEFAULT_STREAK, nextStreak, effectiveStreak } from "./streak";
import { DEFAULT_MOOD_LOG, recordMood } from "./moodLog";
import { DEFAULT_ENERGY_LOG, recordEnergy } from "./energyLog";
import {
  DEFAULT_MEDICATIONS,
  DEFAULT_MEDICATION_DOSE_LOG,
  addMedication,
  removeMedication,
  logDose,
  undoDose,
  isValidDoseTime,
} from "./medicationLog";
import {
  DEFAULT_PAYMENTS,
  DEFAULT_PAYMENT_PAID_LOG,
  addPayment,
  removePayment,
  markPaid,
  unmarkPaid,
} from "./paymentsLog";
import { pickRandomStep } from "./choosePick";
import { DEFAULT_CBT_PROGRAM, markLessonComplete } from "./cbtProgram";
import {
  DEFAULT_QUICK_NOTES,
  addQuickNote,
  resolveQuickNote,
  removeQuickNote,
  oldForgottenNote,
} from "./quickCapture";
import { DEFAULT_SLEEP_LOG, recordBedtime, todayBedtime } from "./sleepLog";
import { DEFAULT_IMPULSE_BRAKE_LOG, recordImpulseBrakeUse } from "./impulseBrakeLog";
import { DEFAULT_GOOD_MOMENTS, addGoodMoment, removeGoodMoment } from "./goodMoments";

const DEFAULT_PROGRESS = {
  xp: 0,
  jar: [],
  screensOff: false,
  sleepEnv: false,
  ateWell: false,
  hydrated: false,
  deskCleared: false,
  streak: DEFAULT_STREAK,
  moodLog: DEFAULT_MOOD_LOG,
  energyLog: DEFAULT_ENERGY_LOG,
  medications: DEFAULT_MEDICATIONS,
  medicationDoseLog: DEFAULT_MEDICATION_DOSE_LOG,
  payments: DEFAULT_PAYMENTS,
  paymentPaidLog: DEFAULT_PAYMENT_PAID_LOG,
  cbtProgram: DEFAULT_CBT_PROGRAM,
  quickNotes: DEFAULT_QUICK_NOTES,
  sleepLog: DEFAULT_SLEEP_LOG,
  impulseBrakeLog: DEFAULT_IMPULSE_BRAKE_LOG,
  goodMoments: DEFAULT_GOOD_MOMENTS,
};

// Panel y Toggle viven a nivel de módulo (no adentro de FocusFlowTDAH) para
// que React no los trate como un componente nuevo en cada render — si se
// redefinen en cada llamada, React desmonta y vuelve a montar todo lo que
// hay dentro cada vez que el componente se actualiza, lo que le hace perder
// el foco a cualquier input que esté adentro mientras el paciente escribe.
// Reciben `C` (el tema activo) como prop para seguir cambiando de color
// junto con el resto de la app entre modo claro y oscuro.
function Panel({ accent, icon, title, subtitle, children, C }) {
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

function Toggle({ label, checked, onChange, C }) {
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

export default function FocusFlowTDAH({
  initialProgress,
  onProgressChange,
  userEmail,
  userId,
  onSignOut,
  onManageSubscription,
  C,
  theme,
  onToggleTheme,
  t,
  lang,
  onChangeLanguage,
}) {
  const saved = { ...DEFAULT_PROGRESS, ...(initialProgress || {}) };

  const bodyDouble = useBodyDouble(userId);

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 760);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const breathingSectionRef = useRef(null);
  const stopThinkSectionRef = useRef(null);
  const desglosadorSectionRef = useRef(null);
  const auditorSectionRef = useRef(null);
  const reestructuracionSectionRef = useRef(null);
  const moodSectionRef = useRef(null);
  const energySectionRef = useRef(null);
  const medicationSectionRef = useRef(null);
  const paymentsSectionRef = useRef(null);
  const cbtSectionRef = useRef(null);
  const habitsSectionRef = useRef(null);
  const quickCaptureSectionRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const atajo = params.get("atajo");
    if (!atajo) return;
    const target = atajo === "respirar" ? breathingSectionRef.current : atajo === "freno" ? stopThinkSectionRef.current : null;
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, []);

  // El compañero de apoyo situacional y la vista "Hoy" enlazan a la
  // herramienta de Senda que ya existe para cada pendiente, en vez de
  // duplicar su contenido — mismo mecanismo de scroll que ya usaban los
  // atajos de "?atajo=respirar/freno".
  const companionSectionRefs = {
    desglosador: desglosadorSectionRef,
    burbuja: breathingSectionRef,
    auditor: auditorSectionRef,
    freno: stopThinkSectionRef,
    reestructuracion: reestructuracionSectionRef,
    mood: moodSectionRef,
    energy: energySectionRef,
    medication: medicationSectionRef,
    payments: paymentsSectionRef,
    cbt: cbtSectionRef,
    habits: habitsSectionRef,
    quickCapture: quickCaptureSectionRef,
  };
  const scrollToCompanionSection = (key) => {
    const ref = companionSectionRefs[key];
    if (ref?.current) ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ---- Persisted state ----
  const [xp, setXp] = useState(saved.xp);
  const [jar, setJar] = useState(saved.jar);
  const [screensOff, setScreensOff] = useState(saved.screensOff);
  const [sleepEnv, setSleepEnv] = useState(saved.sleepEnv);
  const [ateWell, setAteWell] = useState(saved.ateWell);
  const [hydrated, setHydrated] = useState(saved.hydrated);
  const [deskCleared, setDeskCleared] = useState(saved.deskCleared);
  const [streak, setStreak] = useState(() => effectiveStreak(saved.streak));
  const [moodLog, setMoodLog] = useState(saved.moodLog);
  const [energyLog, setEnergyLog] = useState(saved.energyLog);
  const [medications, setMedications] = useState(saved.medications);
  const [medicationDoseLog, setMedicationDoseLog] = useState(saved.medicationDoseLog);
  const [payments, setPayments] = useState(saved.payments);
  const [paymentPaidLog, setPaymentPaidLog] = useState(saved.paymentPaidLog);
  const [cbtProgram, setCbtProgram] = useState(saved.cbtProgram);
  const [quickNotes, setQuickNotes] = useState(saved.quickNotes);
  const [sleepLog, setSleepLog] = useState(saved.sleepLog);
  const [impulseBrakeLog, setImpulseBrakeLog] = useState(saved.impulseBrakeLog);
  const [goodMoments, setGoodMoments] = useState(saved.goodMoments);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onProgressChange?.({
      xp,
      jar,
      screensOff,
      sleepEnv,
      ateWell,
      hydrated,
      deskCleared,
      streak,
      moodLog,
      energyLog,
      medications,
      medicationDoseLog,
      payments,
      paymentPaidLog,
      cbtProgram,
      quickNotes,
      sleepLog,
      impulseBrakeLog,
      goodMoments,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    xp,
    jar,
    screensOff,
    sleepEnv,
    ateWell,
    hydrated,
    deskCleared,
    streak,
    moodLog,
    energyLog,
    medications,
    medicationDoseLog,
    payments,
    paymentPaidLog,
    cbtProgram,
    quickNotes,
    sleepLog,
    impulseBrakeLog,
    goodMoments,
  ]);

  // ---- XP + jar ----
  const [xpMsg, setXpMsg] = useState("");
  const xpTimeout = useRef(null);

  // Micro-recompensa de sonido + vibración al ganar XP — preferencia de
  // dispositivo, no de paciente (como el tema claro/oscuro), por eso vive
  // en localStorage y no en el progreso guardado en Supabase.
  const [celebrateOn, setCelebrateOn] = useState(() => {
    try {
      return window.localStorage.getItem("senda-celebrate") !== "off";
    } catch (e) {
      return true;
    }
  });
  const [celebrateMsg, setCelebrateMsg] = useState("");
  const celebrateMsgTimeout = useRef(null);
  const toggleCelebrate = useCallback(() => {
    setCelebrateOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("senda-celebrate", next ? "on" : "off");
      } catch (e) {
        /* localStorage no disponible (modo privado, etc.) — seguimos solo con el estado en memoria */
      }
      // Confirmación visible del cambio (el ícono solo, Volume2/VolumeX, es
      // difícil de notar a simple vista) + un sonido de muestra al
      // encenderlo, para que quede claro de inmediato qué se activó.
      setCelebrateMsg(next ? t.app.soundOnMsg : t.app.soundOffMsg);
      if (celebrateMsgTimeout.current) clearTimeout(celebrateMsgTimeout.current);
      celebrateMsgTimeout.current = setTimeout(() => setCelebrateMsg(""), 2000);
      celebrate(next);
      return next;
    });
  }, [t]);

  const grantXp = useCallback(
    (label) => {
      setXp((p) => Math.round((p + 0.85) * 100) / 100);
      setXpMsg(t.app.xpGained(label));
      setJar((prev) => [{ id: Date.now(), label }, ...prev].slice(0, 12));
      setStreak((prev) => nextStreak(prev));
      celebrate(celebrateOn);
      if (xpTimeout.current) clearTimeout(xpTimeout.current);
      xpTimeout.current = setTimeout(() => setXpMsg(""), 2400);
    },
    [celebrateOn, t]
  );

  const handleMoodSave = useCallback(
    (mood, note) => {
      setMoodLog((prev) => recordMood(prev, mood, note));
      grantXp(t.app.xpLabels.moodLogged);
    },
    [grantXp, t]
  );

  const handleEnergySave = useCallback(
    (level) => {
      setEnergyLog((prev) => recordEnergy(prev, level));
      grantXp(t.app.xpLabels.energyLogged);
    },
    [grantXp, t]
  );

  const handleRecordBedtime = useCallback(
    (time) => {
      setSleepLog((prev) => recordBedtime(prev, time));
      grantXp(t.app.xpLabels.bedtimeLogged);
    },
    [grantXp, t]
  );

  const handleAddGoodMoment = useCallback(
    (text) => {
      setGoodMoments((prev) => addGoodMoment(prev, text));
      grantXp(t.app.xpLabels.goodMomentSaved);
    },
    [grantXp, t]
  );

  const handleRemoveGoodMoment = useCallback((id) => {
    setGoodMoments((prev) => removeGoodMoment(prev, id));
  }, []);

  // MindfulnessPanel es autocontenido (lleva su propio temporizador, igual
  // que FocusMode) y solo avisa cuando la práctica completa se terminó —
  // no hay ningún dato nuevo que guardar, solo otorgar el XP.
  const handleMindfulnessComplete = useCallback(() => {
    grantXp(t.app.xpLabels.mindfulnessCompleted);
  }, [grantXp, t]);

  const handleAddMedication = useCallback((med) => {
    setMedications((prev) => addMedication(prev, med));
  }, []);

  const handleRemoveMedication = useCallback((id) => {
    setMedications((prev) => removeMedication(prev, id));
  }, []);

  const handleLogDose = useCallback(
    (medicationId, time, note) => {
      setMedicationDoseLog((prev) => logDose(prev, medicationId, time, note));
      grantXp(t.app.xpLabels.doseLogged);
    },
    [grantXp, t]
  );

  const handleUndoDose = useCallback((medicationId, time) => {
    setMedicationDoseLog((prev) => undoDose(prev, medicationId, time));
  }, []);

  const handleAddPayment = useCallback((payment) => {
    setPayments((prev) => addPayment(prev, payment));
  }, []);

  const handleRemovePayment = useCallback((id) => {
    setPayments((prev) => removePayment(prev, id));
    setPaymentPaidLog((prev) => unmarkPaid(prev, id));
  }, []);

  const handleMarkPaymentPaid = useCallback(
    (id, dueDateKey) => {
      setPaymentPaidLog((prev) => markPaid(prev, id, dueDateKey));
      grantXp(t.app.xpLabels.paymentMarked);
    },
    [grantXp, t]
  );

  const handleUnmarkPaymentPaid = useCallback((id) => {
    setPaymentPaidLog((prev) => unmarkPaid(prev, id));
  }, []);

  // "Captura rápida" — handleAddQuickNote cubre tanto una nota general
  // (type "nota") como cualquier sugerencia que la persona decida NO
  // confirmar directo (ej. "no, solo guardar como nota"). Las otras tres
  // SÍ llaman a las funciones que ya existían para agregar cada cosa, y
  // solo se usan cuando la persona tocó "Sí, agrégalo" en la tarjeta de
  // confirmación — la IA de api/quick-capture.js nunca escribe esto sola.
  const handleAddQuickNote = useCallback((text) => {
    setQuickNotes((prev) => addQuickNote(prev, text));
  }, []);

  const handleResolveQuickNote = useCallback((id) => {
    setQuickNotes((prev) => resolveQuickNote(prev, id));
  }, []);

  const handleRemoveQuickNote = useCallback((id) => {
    setQuickNotes((prev) => removeQuickNote(prev, id));
  }, []);

  const handleConfirmQuickMedication = useCallback((fields) => {
    const time = fields?.time;
    if (!isValidDoseTime(time)) return; // defensivo — el panel ya no ofrece este botón sin hora válida
    setMedications((prev) => addMedication(prev, { name: fields?.name, doseTimes: [time], notes: "" }));
  }, []);

  const handleConfirmQuickPayment = useCallback((fields) => {
    const frequency = fields?.frequency === "anual" ? "anual" : "mensual";
    setPayments((prev) =>
      addPayment(prev, {
        name: fields?.name,
        amount: fields?.amount,
        frequency,
        dueDay: fields?.dueDay,
        // La IA no pregunta el mes de un pago anual (no es un dato que la
        // persona suele mencionar al dictar una nota rápida) — si hace
        // falta, se usa el mes actual; de todas formas se puede corregir
        // a mano desde el panel de Pagos.
        dueMonth: frequency === "anual" ? fields?.dueMonth || new Date().getMonth() + 1 : null,
        notes: "",
      })
    );
  }, []);

  // markLessonComplete es defensiva (ignora cualquier id que no sea la
  // lección que de verdad toca ahora mismo), así que siempre es seguro
  // llamarla directo desde el botón del panel.
  const handleCbtLessonComplete = useCallback(
    (lessonId, title) => {
      setCbtProgram((prev) => markLessonComplete(prev, lessonId));
      grantXp(t.app.xpLabels.lessonCompleted(title));
    },
    [grantXp, t]
  );

  useEffect(() => () => xpTimeout.current && clearTimeout(xpTimeout.current), []);
  useEffect(() => () => celebrateMsgTimeout.current && clearTimeout(celebrateMsgTimeout.current), []);

  // ---- Dismantler (no persiste entre sesiones) ----
  const [bigTask, setBigTask] = useState("");
  const [steps, setSteps] = useState([]);
  const [stepDraft, setStepDraft] = useState("");
  const [stepMin, setStepMin] = useState(5);
  // Energía sugerida para el paso que se está agregando a mano (inspirado
  // en el campo "Energy Level"/"Brain State" de Toodledo) — "" significa
  // "cualquier energía", es decir, sin etiqueta. Los pasos que vienen del
  // desglosador con IA también traen esta etiqueta (la IA la sugiere sola,
  // ver api/breakdown-task.js); la persona puede dejarla o seguir
  // agregando pasos a mano con su propia etiqueta.
  const [stepEnergy, setStepEnergy] = useState("");

  // Qué tan desglosado pedir el paso a paso con IA (inspirado en el control
  // de "picante" de Magic ToDo, de Goblin Tools) — "normal" es el
  // comportamiento de siempre.
  const [aiGranularity, setAiGranularity] = useState("normal");
  // Los ids ("pocos"/"normal"/"muchos") son el valor interno que se manda a
  // la API (ver handleAiBreakdown) — nunca cambian con el idioma. La
  // etiqueta visible se resuelve con t.app.dismantler.* al renderizar.
  const AI_GRANULARITY_OPTIONS = [
    { id: "pocos", maxSteps: 3 },
    { id: "normal", maxSteps: 5 },
    { id: "muchos", maxSteps: 8 },
  ];
  const granularityLabel = (id) =>
    ({
      pocos: t.app.dismantler.granularityFew,
      normal: t.app.dismantler.granularityNormal,
      muchos: t.app.dismantler.granularityMany,
    }[id]);

  // Modo "un paso a la vez" (inspirado en Taskmaster, de Goblin Tools) —
  // preferencia de dispositivo, no de paciente, por eso vive en
  // localStorage y no en el progreso guardado en Supabase.
  const [oneStepMode, setOneStepMode] = useState(() => {
    try {
      return window.localStorage.getItem("senda-one-step-mode") === "on";
    } catch (e) {
      return false;
    }
  });
  const toggleOneStepMode = () => {
    setOneStepMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("senda-one-step-mode", next ? "on" : "off");
      } catch (e) {
        /* localStorage no disponible (modo privado, etc.) — seguimos solo con el estado en memoria */
      }
      return next;
    });
  };

  const addStep = () => {
    if (!stepDraft.trim() || steps.length >= 5) return;
    const newStep = { id: Date.now(), text: stepDraft.trim(), min: stepMin, done: false, energy: stepEnergy || null };
    // El bloque de calendario de este paso empieza después de los minutos
    // de los pasos que ya estaban en la lista, para que vayan quedando uno
    // detrás del otro en vez de encimados. Si el calendario no está
    // conectado o esta sincronización está apagada, esta llamada no hace
    // nada (ver api/calendar/create-event.js) — nunca bloquea agregar el paso.
    const offsetMin = steps.reduce((sum, s) => sum + (s.min || 0), 0);
    scheduleStepsOnCalendar(userId, [newStep], { startOffsetMinutes: offsetMin, kind: "step" });
    setSteps((p) => [...p, newStep]);
    setStepDraft("");
    setStepMin(5);
    setStepEnergy("");
  };
  const toggleStep = (id) =>
    setSteps((p) =>
      p.map((s) => {
        if (s.id !== id) return s;
        const done = !s.done;
        if (done) grantXp(t.app.xpLabels.stepCompleted(s.text));
        return { ...s, done };
      })
    );
  const removeStep = (id) => setSteps((p) => p.filter((s) => s.id !== id));

  // Igual que addStep, pero a partir de lo que propuso la IA de "Captura
  // rápida" (ver api/quick-capture.js) — solo se llama cuando la persona ya
  // tocó "Sí, agrégalo" en la tarjeta de confirmación, nunca antes.
  const handleConfirmQuickStep = useCallback(
    (fields) => {
      if (steps.length >= 5) return; // defensivo — el panel ya no ofrece este botón al tope de pasos
      const text = String(fields?.text || "").trim().slice(0, 200);
      if (!text) return;
      const minValue = Number(fields?.min);
      const cleanMin = Number.isFinite(minValue) && minValue >= 2 && minValue <= 20 ? Math.round(minValue) : 5;
      const newStep = {
        id: Date.now() + Math.random().toString(36).slice(2, 7),
        text,
        min: cleanMin,
        done: false,
        energy: null,
      };
      const offsetMin = steps.reduce((sum, s) => sum + (s.min || 0), 0);
      scheduleStepsOnCalendar(userId, [newStep], { startOffsetMinutes: offsetMin, kind: "step" });
      setSteps((p) => [...p, newStep]);
    },
    [steps, userId]
  );

  // "Elige por mí" (inspirado en "Pick one for me" de Llama Life) — para
  // cuando la decisión de "¿cuál paso empiezo?" es justo lo que traba. Por
  // ahora elige al azar entre TODOS los pasos pendientes, sin considerar la
  // energía de hoy (ver choosePick.js). chosenStepId solo resalta un paso
  // que siga pendiente — si ya se completó o se borró, simplemente deja de
  // resaltarse, sin necesidad de limpiarlo a mano.
  const [chosenStepId, setChosenStepId] = useState(null);
  const [chooseMsg, setChooseMsg] = useState("");
  const handleChoosePick = () => {
    const picked = pickRandomStep(steps);
    if (picked) {
      setChosenStepId(picked.id);
      setChooseMsg("");
    } else {
      setChosenStepId(null);
      setChooseMsg(t.app.dismantler.noPendingSteps);
    }
  };
  const chosenStep = steps.find((s) => s.id === chosenStepId && !s.done) || null;

  // "El Regreso" de Eco: la nota pendiente más vieja (si lleva varios días
  // sin resolverse) se resalta tanto aquí como en "Hoy".
  const forgottenNoteId = oldForgottenNote(quickNotes)?.id || null;

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAiBreakdown = async () => {
    if (!bigTask.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/breakdown-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, task: bigTask.trim(), granularity: aiGranularity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.app.dismantler.aiBreakdownError);
      const maxSteps = AI_GRANULARITY_OPTIONS.find((g) => g.id === aiGranularity)?.maxSteps || 5;
      const newSteps = (data.steps || []).slice(0, maxSteps).map((s, i) => ({
        id: Date.now() + i,
        text: s.text,
        min: s.min,
        done: false,
        energy: s.energy || null,
      }));
      // Estos reemplazan la lista anterior por completo, así que el bloque
      // de calendario de cada uno arranca desde cero (offset 0), uno detrás
      // de otro según sus minutos estimados.
      scheduleStepsOnCalendar(userId, newSteps, { kind: "step" });
      setSteps(newSteps);
    } catch (err) {
      setAiError(err.message || t.common.genericError);
    } finally {
      setAiLoading(false);
    }
  };

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
      grantXp(t.app.xpLabels.timeAuditRecorded);
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
  const [stContext, setStContext] = useState("general");
  const [breathCountdown, setBreathCountdown] = useState(3);
  const stTimerRef = useRef(null);

  const startStopThink = (context = "general") => {
    setStFlowOpen(true);
    setStStage(0);
    setStContext(context);
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
      grantXp(stContext === "compra" ? t.app.xpLabels.stopThinkPurchase : t.app.xpLabels.stopThinkGeneral);
      setImpulseBrakeLog((prev) => recordImpulseBrakeUse(prev, stContext));
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
  const phaseLabel = [t.app.breathing.inhale, t.app.breathing.hold, t.app.breathing.exhale];

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
        grantXp(t.app.xpLabels.breathingCompleted);
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
      grantXp(t.app.xpLabels.reframeCompleted);
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
            grantXp(t.app.xpLabels.activeBreakCompleted);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => breakRef.current && clearInterval(breakRef.current);
  }, [breakRunning, grantXp, t]);

  const toggleXp = (setter, current, label) => {
    const next = !current;
    setter(next);
    if (next) grantXp(label);
  };

  // ---- Hora de dormir ----
  const todayBedtimeEntry = todayBedtime(sleepLog);
  const [bedtimeInput, setBedtimeInput] = useState("");
  const saveBedtime = () => {
    if (!bedtimeInput) return;
    handleRecordBedtime(bedtimeInput);
    setBedtimeInput("");
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
        <InstallBanner C={C} t={t} />
        <PostDiagnosisCard C={C} t={t} />
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
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>{t.common.appName}</h1>
            <p style={{ fontSize: "13px", color: C.textMuted, margin: "6px 0 0" }}>
              {userEmail ? t.app.sessionOf(userEmail) : t.app.noEmailSubtitle}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onChangeLanguage && <LanguageSwitcher C={C} lang={lang} onChange={onChangeLanguage} t={t} height="40px" />}
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
                <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.1 }}>{xp.toFixed(2)} {t.app.xpUnit}</div>
                <div style={{ fontSize: "11px", color: C.textMuted }}>{t.app.xpCaption}</div>
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
            <button
              onClick={toggleCelebrate}
              aria-label={celebrateOn ? t.app.muteOn : t.app.muteOff}
              title={celebrateOn ? t.app.muteOn : t.app.muteOff}
              style={{
                position: "relative",
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
              {celebrateOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {celebrateMsg && (
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
                  {celebrateMsg}
                </div>
              )}
            </button>
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
                title={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
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
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            )}
            {onManageSubscription && (
              <button
                onClick={onManageSubscription}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  padding: "0 14px",
                  height: "40px",
                  color: C.textMuted,
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {t.app.mySubscription}
              </button>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                aria-label={t.common.signOut}
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

        <Mascot streak={streak} C={C} t={t} />

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
            <span style={{ fontSize: "13px", color: C.textMuted }}>{t.app.jarLabel}</span>
          </div>
          {jar.length === 0 ? (
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
              {t.app.jarEmpty}
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
          {t.app.disclaimer}
        </div>

        <Panel C={C}
          accent={C.lavender}
          icon={<ListChecks size={22} />}
          title={t.app.panels.today.title}
          subtitle={t.app.panels.today.subtitle}
        >
          <TodayPanel
            C={C}
            t={t}
            steps={steps}
            moodLog={moodLog}
            energyLog={energyLog}
            medications={medications}
            medicationDoseLog={medicationDoseLog}
            payments={payments}
            paymentPaidLog={paymentPaidLog}
            cbtProgram={cbtProgram}
            habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared }}
            quickNotes={quickNotes}
            onNavigate={scrollToCompanionSection}
          />
        </Panel>

        <Panel C={C}
          accent={C.amber}
          icon={<Clock size={22} />}
          title={t.app.panels.timeline.title}
          subtitle={t.app.panels.timeline.subtitle}
        >
          <DayTimelinePanel C={C} t={t} jar={jar} />
        </Panel>

        <div ref={quickCaptureSectionRef}>
        <Panel C={C}
          accent={C.lavender}
          icon={<StickyNote size={22} />}
          title={t.app.panels.quickCapture.title}
          subtitle={t.app.panels.quickCapture.subtitle}
        >
          <QuickCapturePanel
            C={C}
            t={t}
            lang={lang}
            userId={userId}
            quickNotes={quickNotes}
            oldForgottenNoteId={forgottenNoteId}
            canAddStep={steps.length < 5}
            onAddNote={handleAddQuickNote}
            onResolveNote={handleResolveQuickNote}
            onRemoveNote={handleRemoveQuickNote}
            onConfirmMedication={handleConfirmQuickMedication}
            onConfirmPayment={handleConfirmQuickPayment}
            onConfirmStep={handleConfirmQuickStep}
          />
        </Panel>
        </div>

        <Panel C={C}
          accent={C.rose}
          icon={<HeartHandshake size={22} />}
          title={t.app.panels.companion.title}
          subtitle={t.app.panels.companion.subtitle}
        >
          <CompanionPanel C={C} t={t} lang={lang} userId={userId} onNavigate={scrollToCompanionSection} />
        </Panel>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "0 20px" }}>
          <div>
            <div ref={desglosadorSectionRef}>
            <Panel C={C}
              accent={C.mint}
              icon={<ListTree size={22} />}
              title={t.app.panels.dismantler.title}
              subtitle={t.app.panels.dismantler.subtitle}
            >
              <input
                type="text"
                value={bigTask}
                onChange={(e) => setBigTask(e.target.value)}
                placeholder={t.app.dismantler.taskPlaceholder}
                style={{ ...inputStyle, marginBottom: "14px" }}
              />
              {bigTask.trim() && (
                <>
                  <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 6px" }}>
                    {t.app.dismantler.granularityLabel}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                    {AI_GRANULARITY_OPTIONS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setAiGranularity(g.id)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: `1px solid ${aiGranularity === g.id ? C.lavender : C.border}`,
                          background: aiGranularity === g.id ? C.lavender : "transparent",
                          color: aiGranularity === g.id ? C.lavenderText : C.textMuted,
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {granularityLabel(g.id)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleAiBreakdown}
                    disabled={aiLoading}
                    style={{
                      ...btnPrimary(C.lavender, C.lavenderText),
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "10px",
                      opacity: aiLoading ? 0.7 : 1,
                      cursor: aiLoading ? "default" : "pointer",
                    }}
                  >
                    <Sparkles size={14} /> {aiLoading ? t.app.dismantler.aiLoading : t.app.dismantler.aiButton}
                  </button>
                  {aiError && (
                    <p style={{ fontSize: "12px", color: C.amber, margin: "0 0 12px", lineHeight: 1.5 }}>{aiError}</p>
                  )}
                  <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px" }}>
                    {t.app.dismantler.aiReplacesNote}
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={stepDraft}
                      onChange={(e) => setStepDraft(e.target.value)}
                      placeholder={t.app.dismantler.stepPlaceholder(steps.length + 1)}
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
                    <select
                      value={stepEnergy}
                      onChange={(e) => setStepEnergy(e.target.value)}
                      title={t.app.dismantler.stepEnergyTooltip}
                      style={{ ...inputStyle, width: "auto" }}
                    >
                      <option value="">{t.app.dismantler.anyEnergy}</option>
                      <option value="baja">{t.app.dismantler.lowEnergy}</option>
                      <option value="media">{t.app.dismantler.midEnergy}</option>
                      <option value="alta">{t.app.dismantler.highEnergy}</option>
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
                      <Plus size={14} /> {t.app.dismantler.addButton}
                    </button>
                  </div>
                  {steps.length >= 5 && (
                    <p style={{ fontSize: "11px", color: C.textMuted, margin: "-6px 0 10px" }}>
                      {t.app.dismantler.maxStepsNotice}
                    </p>
                  )}
                  {steps.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <button
                        onClick={toggleOneStepMode}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: C.textMuted,
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ListChecks size={12} />
                        {oneStepMode ? t.app.dismantler.viewAllSteps : t.app.dismantler.viewOneStep}
                      </button>
                      <button
                        onClick={handleChoosePick}
                        title={t.app.dismantler.pickForMeTitle}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: C.textMuted,
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Shuffle size={12} />
                        {t.app.dismantler.pickForMe}
                      </button>
                    </div>
                  )}
                  {chosenStep && (
                    <p style={{ fontSize: "12px", color: C.lavenderText, margin: "0 0 8px", fontWeight: 600 }}>
                      {t.app.dismantler.startWith(chosenStep.text)}
                    </p>
                  )}
                  {chooseMsg && (
                    <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px" }}>{chooseMsg}</p>
                  )}
                  {(() => {
                    const pending = steps.filter((s) => !s.done);
                    const visibleSteps = oneStepMode
                      ? steps.filter((s) => s.done || s.id === pending[0]?.id)
                      : steps;
                    const hiddenPendingCount = oneStepMode ? Math.max(0, pending.length - (pending[0] ? 1 : 0)) : 0;
                    return (
                      <>
                        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {visibleSteps.map((s) => {
                            const originalIndex = steps.findIndex((o) => o.id === s.id);
                            return (
                              <li
                                key={s.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "8px 6px",
                                  margin: "0 -6px",
                                  borderBottom: `1px solid ${C.border}`,
                                  borderRadius: chosenStep?.id === s.id ? "6px" : 0,
                                  background: chosenStep?.id === s.id ? C.surfaceAlt : "transparent",
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
                                  {s.done ? <CheckCircle2 size={13} /> : originalIndex + 1}
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
                                {s.energy && (
                                  <span
                                    title={t.app.dismantler.energyTagTitle(s.energy)}
                                    style={{
                                      fontSize: "11px",
                                      color: C.textMuted,
                                      background: C.surfaceAlt,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: "10px",
                                      padding: "2px 7px",
                                    }}
                                  >
                                    {s.energy}
                                  </span>
                                )}
                                <button
                                  onClick={() => removeStep(s.id)}
                                  style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted }}
                                  aria-label={t.app.dismantler.removeStepAria}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </li>
                            );
                          })}
                        </ol>
                        {hiddenPendingCount > 0 && (
                          <p style={{ fontSize: "12px", color: C.textMuted, margin: "8px 0 0" }}>
                            {t.app.dismantler.morePendingSteps(hiddenPendingCount)}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </Panel>
            </div>

            <div ref={auditorSectionRef}>
            <Panel C={C}
              accent={C.amber}
              icon={<Timer size={22} />}
              title={t.app.panels.auditor.title}
              subtitle={t.app.panels.auditor.subtitle}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <label style={{ fontSize: "13px", color: C.textMuted }}>{t.app.auditor.estimateLabel}</label>
                <input
                  type="number"
                  min={1}
                  value={estimateMin}
                  onChange={(e) => setEstimateMin(Math.max(1, Number(e.target.value)))}
                  disabled={running || elapsed > 0}
                  style={{ ...inputStyle, width: "60px" }}
                />
                <span style={{ fontSize: "13px", color: C.textMuted }}>{t.app.auditor.minutesUnit}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <span style={{ fontSize: "34px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {fmt(elapsed)}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {!running ? (
                    <button
                      onClick={() => setRunning(true)}
                      aria-label={t.app.auditor.startAria}
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
                      aria-label={t.app.auditor.stopAria}
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
                    aria-label={t.app.auditor.resetAria}
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
                  {audit.diff > 0
                    ? t.app.auditor.resultMore(audit.realMin, estimateMin, audit.diff)
                    : audit.diff < 0
                    ? t.app.auditor.resultLess(audit.realMin, estimateMin, Math.abs(audit.diff))
                    : t.app.auditor.resultExact(audit.realMin, estimateMin)}
                </div>
              )}
            </Panel>
            </div>

            <Panel C={C}
              accent={C.lavender}
              icon={<Headphones size={22} />}
              title={t.app.panels.focusMode.title}
              subtitle={t.app.panels.focusMode.subtitle}
            >
              <FocusMode
                C={C}
                t={t}
                onSessionComplete={() => {
                  grantXp(t.app.xpLabels.focusSessionCompleted);
                  bodyDouble.setStatus("aqui");
                }}
                onSessionStart={(min) => {
                  scheduleStepsOnCalendar(userId, [{ text: t.app.focusSessionEventTitle, min }], { kind: "focus" });
                  bodyDouble.setStatus("enfocando");
                }}
              />
            </Panel>

            <div ref={moodSectionRef}>
            <Panel C={C}
              accent={C.rose}
              icon={<Smile size={22} />}
              title={t.app.panels.mood.title}
              subtitle={t.app.panels.mood.subtitle}
            >
              <MoodLog C={C} t={t} moodLog={moodLog} onSave={handleMoodSave} />
            </Panel>
            </div>

            <Panel C={C}
              accent={C.rose}
              icon={<Heart size={22} />}
              title={t.app.panels.goodMoments.title}
              subtitle={t.app.panels.goodMoments.subtitle}
            >
              <GoodMomentsPanel
                C={C}
                t={t}
                lang={lang}
                goodMoments={goodMoments}
                onAdd={handleAddGoodMoment}
                onRemove={handleRemoveGoodMoment}
              />
            </Panel>

            <div ref={cbtSectionRef}>
            <Panel C={C}
              accent={C.lavenderDark}
              icon={<BookOpen size={22} />}
              title={t.app.panels.cbt.title}
              subtitle={t.app.panels.cbt.subtitle}
            >
              <CbtProgramPanel C={C} t={t} program={cbtProgram} onComplete={handleCbtLessonComplete} />
            </Panel>
            </div>

            <ScienceCapsulePanel C={C} t={t} />

            <Panel C={C}
              accent={C.amber}
              icon={<TrendingUp size={22} />}
              title={t.app.panels.insights.title}
              subtitle={t.app.panels.insights.subtitle}
            >
              <WeeklyInsights
                C={C}
                t={t}
                moodLog={moodLog}
                jar={jar}
                streak={streak}
                habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared }}
                sleepLog={sleepLog}
              />
            </Panel>

            <Panel C={C}
              accent={C.lavenderDark}
              icon={<FileText size={22} />}
              title={t.app.panels.report.title}
              subtitle={t.app.panels.report.subtitle}
            >
              <ClinicalReportPanel
                C={C}
                t={t}
                lang={lang}
                moodLog={moodLog}
                energyLog={energyLog}
                medications={medications}
                medicationDoseLog={medicationDoseLog}
                habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared }}
                streak={streak}
                sleepLog={sleepLog}
                impulseBrakeLog={impulseBrakeLog}
              />
            </Panel>

            <Panel C={C}
              accent={C.mint}
              icon={<Bell size={22} />}
              title={t.app.panels.notifications.title}
              subtitle={t.app.panels.notifications.subtitle}
            >
              <NotificationsPanel C={C} t={t} userId={userId} />
            </Panel>

            <Panel C={C}
              accent={C.lavender}
              icon={<CalendarRange size={22} />}
              title={t.app.panels.calendar.title}
              subtitle={t.app.panels.calendar.subtitle}
            >
              <CalendarPanel C={C} t={t} userId={userId} />
            </Panel>

            <Panel C={C}
              accent={C.mint}
              icon={<Users size={22} />}
              title={t.app.panels.bodyDouble.title}
              subtitle={t.app.panels.bodyDouble.subtitle}
            >
              <BodyDoublePanel
                C={C}
                t={t}
                joined={bodyDouble.joined}
                participants={bodyDouble.participants}
                incomingReactions={bodyDouble.incomingReactions}
                join={bodyDouble.join}
                leave={bodyDouble.leave}
                sendReaction={bodyDouble.sendReaction}
              />
            </Panel>
          </div>

          <div>
            <div ref={energySectionRef}>
            <Panel C={C}
              accent={C.amber}
              icon={<BatteryMedium size={22} />}
              title={t.app.panels.energy.title}
              subtitle={t.app.panels.energy.subtitle}
            >
              <EnergyLog C={C} t={t} energyLog={energyLog} onSave={handleEnergySave} />
            </Panel>
            </div>

            <div ref={medicationSectionRef}>
            <Panel C={C}
              accent={C.rose}
              icon={<Pill size={22} />}
              title={t.app.panels.medication.title}
              subtitle={t.app.panels.medication.subtitle}
            >
              <MedicationPanel
                C={C}
                t={t}
                medications={medications}
                doseLog={medicationDoseLog}
                onAdd={handleAddMedication}
                onRemove={handleRemoveMedication}
                onLogDose={handleLogDose}
                onUndoDose={handleUndoDose}
              />
            </Panel>
            </div>

            <div ref={paymentsSectionRef}>
            <Panel C={C}
              accent={C.mint}
              icon={<CreditCard size={22} />}
              title={t.app.panels.payments.title}
              subtitle={t.app.panels.payments.subtitle}
            >
              <PaymentsPanel
                C={C}
                t={t}
                payments={payments}
                paidLog={paymentPaidLog}
                onAdd={handleAddPayment}
                onRemove={handleRemovePayment}
                onMarkPaid={handleMarkPaymentPaid}
                onUnmarkPaid={handleUnmarkPaymentPaid}
              />
            </Panel>
            </div>

            <div ref={stopThinkSectionRef}>
            <Panel C={C}
              accent={C.lavender}
              icon={<Hand size={22} />}
              title={t.app.panels.stopThink.title}
              subtitle={t.app.panels.stopThink.subtitle}
            >
              {!stFlowOpen ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button onClick={() => startStopThink("general")} style={{ ...btnPrimary(C.lavender, C.lavenderText), width: "100%" }}>
                    {t.app.stopThink.pressBeforeActing}
                  </button>
                  <button
                    onClick={() => startStopThink("compra")}
                    style={{
                      ...btnPrimary(C.surfaceAlt, C.text),
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <ShoppingCart size={16} /> {t.app.stopThink.beforePurchase}
                  </button>
                </div>
              ) : (
                <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "18px", textAlign: "center" }}>
                  {stStage === 0 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>{t.app.stopThink.stopLabel}</p>
                      <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px" }}>
                        {stContext === "compra"
                          ? t.app.stopThink.pausePurchase
                          : t.app.stopThink.pauseGeneral}
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        {t.app.stopThink.ready}
                      </button>
                    </>
                  )}
                  {stStage === 1 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>{t.app.stopThink.breatheLabel}</p>
                      <p style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 8px" }}>{breathCountdown}</p>
                    </>
                  )}
                  {stStage === 2 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>{t.app.stopThink.evaluateLabel}</p>
                      <p style={{ fontSize: "14px", color: C.text, margin: "0 0 16px" }}>
                        {stContext === "compra"
                          ? t.app.stopThink.evaluatePurchase
                          : t.app.stopThink.evaluateGeneral}
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        {t.app.stopThink.alreadyThought}
                      </button>
                    </>
                  )}
                  {stStage === 3 && (
                    <>
                      <p style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>{t.app.stopThink.actLabel}</p>
                      <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px" }}>
                        {stContext === "compra"
                          ? t.app.stopThink.actPurchase
                          : t.app.stopThink.actGeneral}
                      </p>
                      <button onClick={advanceStage} style={btnPrimary(C.lavender, C.lavenderText)}>
                        {t.app.stopThink.finish}
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
                    {t.common.cancel}
                  </button>
                </div>
              )}
            </Panel>
            </div>

            <div ref={breathingSectionRef}>
            <Panel C={C}
              accent={C.mint}
              icon={<Wind size={22} />}
              title={t.app.panels.breathing.title}
              subtitle={t.app.panels.breathing.subtitle}
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
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{breathingOn ? phaseLabel[phase] : t.app.breathing.ready}</div>
                    {breathingOn && <div style={{ fontSize: "20px", fontWeight: 700 }}>{count}</div>}
                  </div>
                </div>
                <button
                  onClick={breathingOn ? () => setBreathingOn(false) : startBreathing}
                  style={breathingOn ? btnGhost : btnPrimary(C.mint, C.mintText)}
                >
                  {breathingOn ? t.app.breathing.stop : t.app.breathing.start}
                </button>
              </div>
            </Panel>
            </div>

            <Panel C={C}
              accent={C.lavender}
              icon={<Flower2 size={22} />}
              title={t.app.panels.mindfulness.title}
              subtitle={t.app.panels.mindfulness.subtitle}
            >
              <MindfulnessPanel C={C} t={t} lang={lang} onComplete={handleMindfulnessComplete} />
            </Panel>

            <div ref={reestructuracionSectionRef}>
            <Panel C={C}
              accent={C.lavender}
              icon={<Brain size={22} />}
              title={t.app.panels.reframe.title}
              subtitle={t.app.panels.reframe.subtitle}
            >
              {rfStage === 0 && (
                <>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 8px" }}>
                    {t.app.reframe.thoughtQuestion}
                  </p>
                  <textarea
                    value={rfThought}
                    onChange={(e) => setRfThought(e.target.value)}
                    placeholder={t.app.reframe.thoughtPlaceholder}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button onClick={rfNext} disabled={!rfThought.trim()} style={btnPrimary(C.lavender, C.lavenderText)}>
                    {t.app.reframe.continueButton}
                  </button>
                </>
              )}
              {rfStage === 1 && (
                <>
                  <p style={{ fontSize: "13px", color: C.text, margin: "0 0 8px" }}>
                    {t.app.reframe.evidenceQuestion(rfThought)}
                  </p>
                  <textarea
                    value={rfEvidenceAgainst}
                    onChange={(e) => setRfEvidenceAgainst(e.target.value)}
                    placeholder={t.app.reframe.evidencePlaceholder}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button
                    onClick={rfNext}
                    disabled={!rfEvidenceAgainst.trim()}
                    style={btnPrimary(C.lavender, C.lavenderText)}
                  >
                    {t.app.reframe.continueButton}
                  </button>
                </>
              )}
              {rfStage === 2 && (
                <>
                  <p style={{ fontSize: "13px", color: C.text, margin: "0 0 8px" }}>
                    {t.app.reframe.alternativeQuestion}
                  </p>
                  <textarea
                    value={rfAlternative}
                    onChange={(e) => setRfAlternative(e.target.value)}
                    placeholder={t.app.reframe.alternativePlaceholder}
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: "12px" }}
                  />
                  <button
                    onClick={rfNext}
                    disabled={!rfAlternative.trim()}
                    style={btnPrimary(C.lavender, C.lavenderText)}
                  >
                    {t.app.reframe.finishButton}
                  </button>
                </>
              )}
              {rfStage === 3 && (
                <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "14px" }}>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 6px" }}>{t.app.reframe.resultLabel}</p>
                  <p style={{ fontSize: "15px", margin: "0 0 14px" }}>{rfAlternative}</p>
                  <button onClick={rfReset} style={btnGhost}>
                    {t.app.reframe.doAnother}
                  </button>
                </div>
              )}
            </Panel>
            </div>

            <Panel C={C}
              accent={C.mint}
              icon={<MessageSquare size={22} />}
              title={t.app.panels.messageTone.title}
              subtitle={t.app.panels.messageTone.subtitle}
            >
              <MessageTonePanel C={C} t={t} lang={lang} userId={userId} />
            </Panel>
          </div>
        </div>

        <div ref={habitsSectionRef}>
        <Panel C={C}
          accent={C.amber}
          icon={<Moon size={22} />}
          title={t.app.panels.habits.title}
          subtitle={t.app.panels.habits.subtitle}
        >
          <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "0 24px" }}>
            <div>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Moon size={13} /> {t.app.habits.sleepHygiene}
              </p>
              <Toggle C={C} label={t.app.habits.screensOff} checked={screensOff} onChange={(v) => toggleXp(setScreensOff, screensOff, t.app.xpLabels.screensOffLabel)} />
              <Toggle C={C} label={t.app.habits.sleepEnvReady} checked={sleepEnv} onChange={(v) => toggleXp(setSleepEnv, sleepEnv, t.app.xpLabels.sleepEnvLabel)} />
              <div style={{ marginTop: "10px" }}>
                {todayBedtimeEntry ? (
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 6px" }}>
                    {t.app.habits.bedtimeRegistered(todayBedtimeEntry.time)}
                  </p>
                ) : (
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 6px" }}>
                    {t.app.habits.bedtimeQuestion}
                  </p>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="time"
                    value={bedtimeInput}
                    onChange={(e) => setBedtimeInput(e.target.value)}
                    style={{ ...inputStyle, width: "auto" }}
                  />
                  <button onClick={saveBedtime} style={btnGhost}>
                    {t.common.save}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Utensils size={13} /> {t.app.habits.nutrition}
              </p>
              <Toggle C={C} label={t.app.habits.ateWell} checked={ateWell} onChange={(v) => toggleXp(setAteWell, ateWell, t.app.xpLabels.ateWellLabel)} />
              <Toggle C={C} label={t.app.habits.hydrated} checked={hydrated} onChange={(v) => toggleXp(setHydrated, hydrated, t.app.xpLabels.hydratedLabel)} />
            </div>
            <div style={{ marginTop: "18px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Activity size={13} /> {t.app.habits.movement}
              </p>
              {!breakDone ? (
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button
                    onClick={() => setBreakRunning((r) => !r)}
                    style={btnPrimary(breakRunning ? C.surfaceAlt : C.amber, breakRunning ? C.text : C.amberText)}
                  >
                    {breakRunning ? t.app.habits.pauseButton : t.app.habits.activeBreak}
                  </button>
                  <span style={{ fontSize: "18px", fontVariantNumeric: "tabular-nums" }}>{fmt(breakSec)}</span>
                </div>
              ) : (
                <p style={{ fontSize: "14px", color: C.mint, margin: 0 }}>{t.app.habits.breakDone}</p>
              )}
            </div>
            <div style={{ marginTop: "18px" }}>
              <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <LayoutIcon size={13} /> {t.app.habits.workspace}
              </p>
              <Toggle C={C}
                label={t.app.habits.deskCleared}
                checked={deskCleared}
                onChange={(v) => toggleXp(setDeskCleared, deskCleared, t.app.xpLabels.deskClearedLabel)}
              />
            </div>
          </div>
        </Panel>
        </div>

        <p style={{ fontSize: "12px", color: C.textMuted, textAlign: "center", lineHeight: 1.6, marginTop: "8px" }}>
          {t.app.footerNote}
        </p>
      </div>
    </div>
  );
}
