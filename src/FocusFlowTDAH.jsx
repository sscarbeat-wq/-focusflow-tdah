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
  Target,
  Repeat,
  Compass,
  CalendarClock,
  ArrowLeft,
  Lock,
} from "lucide-react";

import LanguageSwitcher from "./LanguageSwitcher";
import AppTabBar from "./AppTabBar";
import QuickAccessGrid from "./QuickAccessGrid";
import ToolsGrid from "./ToolsGrid";
import OnboardingTour from "./OnboardingTour";
import InstallBanner from "./InstallBanner";
import PostDiagnosisCard from "./PostDiagnosisCard";
import ScienceCapsulePanel from "./ScienceCapsulePanel";
import MindfulnessPanel from "./MindfulnessPanel";
import Mascot from "./Mascot";
import FocusMode from "./FocusMode";
import OneThingPanel from "./OneThingPanel";
import KanbanBoard from "./KanbanBoard";
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
import CaptureHubPanel from "./CaptureHubPanel";
import RoutinesPanel from "./RoutinesPanel";
import ClinicalReportPanel from "./ClinicalReportPanel";
import GoodMomentsPanel from "./GoodMomentsPanel";
import DayTimelinePanel from "./DayTimelinePanel";
import QuickNavMenu from "./QuickNavMenu";
import { hasPlusAccess } from "./plans";
import { PlusLockedPanel, PlusUpsellBadge, PlusUpsellInline } from "./PlusUpsellCard";
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
import { DEFAULT_ONE_THING, startOneThing, finishOneThing, exitOneThing } from "./oneThing";
import {
  DEFAULT_ROUTINES,
  addRoutineTemplate,
  removeRoutineTemplate,
  renameRoutineTemplate,
  addRoutineStep,
  removeRoutineStep,
  updateRoutineStep,
  moveRoutineStep,
  startRoutineSession,
  advanceRoutineSession,
  exitRoutineSession,
} from "./routines";
import {
  DEFAULT_SCHEDULE_BLOCKS,
  addScheduleBlock,
  removeScheduleBlock,
  updateScheduleBlock,
  moveScheduleBlock,
} from "./scheduleBlocks";
import ScheduleAgendaPanel from "./ScheduleAgendaPanel";
import { tint, ACCENT_OPTIONS } from "./theme";
import { SPECIES_OPTIONS, matureEmoji, DEFAULT_SPECIES } from "./mascotLogic";

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
  oneThing: DEFAULT_ONE_THING,
  routines: DEFAULT_ROUTINES,
  scheduleBlocks: DEFAULT_SCHEDULE_BLOCKS,
};

// Panel y Toggle viven a nivel de módulo (no adentro de FocusFlowTDAH) para
// que React no los trate como un componente nuevo en cada render — si se
// redefinen en cada llamada, React desmonta y vuelve a montar todo lo que
// hay dentro cada vez que el componente se actualiza, lo que le hace perder
// el foco a cualquier input que esté adentro mientras el paciente escribe.
// Reciben `C` (el tema activo) como prop para seguir cambiando de color
// junto con el resto de la app entre modo claro y oscuro.
// Rediseño del 26 de octubre de 2026 (estilo inspirado en Tiimo, ver la
// propuesta visual aprobada): esquinas más redondeadas, más espacio, y un
// lavado suave del color de acento de fondo en vez de solo una línea en el
// borde superior — mismo principio de "colores suaves, nunca alarmantes"
// que ya regía la paleta, solo que ahora cada panel se reconoce por su
// color de categoría de un vistazo, no solo por el ícono/título.
// Panel — único punto de control del estilo visual de cada tarjeta de la
// app (27 de octubre de 2026). Segunda pasada el mismo día, a petición de
// la doctora: "diseño bonito, que no se vea tan plana". Antes cada panel
// era un rectángulo de un solo color sólido (C.surface) con una sombra muy
// discreta — correcto pero sin ninguna personalidad. Ahora:
//   - El fondo es un degradado muy suave hacia el color de acento de ESE
//     panel (la categoría ya tenía un color fijo asignado, ver el mapa de
//     accent={C.xxx} en cada <Panel>) — cada tarjeta se siente como "la
//     suya", no intercambiable con las demás.
//   - La sombra pasa de una sola capa a dos (una ambiental, otra más
//     cerrada) más una línea de brillo arriba (inset) — la misma técnica
//     que usan apps tipo Tiimo para que las tarjetas se sientan "levantadas"
//     en vez de pegadas al fondo.
//   - El ícono pasa de un cuadro de color plano a una placa con degradado y
//     su propia sombra de color, como si flotara un poco sobre la tarjeta.
function Panel({ accent, icon, title, subtitle, children, C }) {
  return (
    <div
      style={{
        background: `linear-gradient(165deg, ${tint(accent, 0.07)}, ${C.surface} 55%)`,
        borderRadius: "22px",
        padding: "24px 24px 26px",
        marginBottom: "20px",
        boxShadow: `0 1px 2px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "18px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: `linear-gradient(135deg, ${tint(accent, 0.3)}, ${tint(accent, 0.12)})`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 10px ${tint(accent, 0.3)}`,
          }}
        >
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: C.text }}>{title}</h2>
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
  manageSubscriptionError,
  planState,
  onRequestUpgrade,
  C,
  theme,
  onToggleTheme,
  accentKey,
  onChangeAccent,
  species,
  onChangeSpecies,
  t,
  lang,
  onChangeLanguage,
}) {
  const saved = { ...DEFAULT_PROGRESS, ...(initialProgress || {}) };
  // Fase 3 del sistema de planes (30 de octubre de 2026) — isPlus decide,
  // herramienta por herramienta, si se muestra el contenido real o el aviso
  // de PlusUpsellCard.jsx. planState puede no venir (otra pantalla que no
  // pase por App.jsx) — en ese caso se trata como Gratis, nunca como Plus,
  // para no abrir de más por accidente.
  const isPlus = hasPlusAccess(planState);
  // Acento personal — 26 de octubre de 2026. `accentKey` puede no venir
  // todavía (pantallas que no pasan por App.jsx, o una prop opcional no
  // enviada) — C.lavender como respaldo es el mismo color que ya se usaba
  // fijo antes de este cambio, así que nunca se ve distinto si falta.
  const personalAccent = (accentKey && C[accentKey]) || C.lavender;

  const bodyDouble = useBodyDouble(userId);

  // Fase 4, función #2 (31 de octubre de 2026 — "la mascota reacciona en
  // vivo durante el enfoque"): "idle" | "focusing" | "distracted", viene de
  // FocusMode.jsx (directo o a través de OneThingPanel) exactamente igual
  // que bodyDouble.setStatus("enfocando"/"aqui") ya lo hacía para la sala de
  // cuerpo-doble — un solo estado compartido porque solo una de las dos
  // sesiones de Modo Enfoque puede estar corriendo a la vez en la práctica.
  const [focusStatus, setFocusStatus] = useState("idle");

  const [accentPickerOpen, setAccentPickerOpen] = useState(false);
  const [speciesPickerOpen, setSpeciesPickerOpen] = useState(false);
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
  const oneThingSectionRef = useRef(null);
  const routinesSectionRef = useRef(null);
  const scheduleSectionRef = useRef(null);
  const auditorSectionRef = useRef(null);
  const reestructuracionSectionRef = useRef(null);
  const moodSectionRef = useRef(null);
  const energySectionRef = useRef(null);
  const medicationSectionRef = useRef(null);
  const paymentsSectionRef = useRef(null);
  const cbtSectionRef = useRef(null);
  const habitsSectionRef = useRef(null);
  // Fase 2D (Captura rápida + Descarga mental fusionadas, 29 de octubre de
  // 2026): las dos vivían cada una en su propia sección; ahora comparten
  // una sola (ver CaptureHubPanel.jsx), así que una sola ref alcanza.
  const captureHubSectionRef = useRef(null);
  // Refs agregadas en el Módulo 1 (navegación) para que el menú flotante
  // "Ir a..." (ver QuickNavMenu.jsx) pueda saltar a CUALQUIER sección de la
  // página, no solo a las que ya enlazaba el Compañero de apoyo/vista Hoy.
  const todaySectionRef = useRef(null);
  const timelineSectionRef = useRef(null);
  const companionPanelSectionRef = useRef(null);
  const focusModeSectionRef = useRef(null);
  const goodMomentsSectionRef = useRef(null);
  const insightsSectionRef = useRef(null);
  const reportSectionRef = useRef(null);
  const notificationsSectionRef = useRef(null);
  const calendarSectionRef = useRef(null);
  const bodyDoubleSectionRef = useRef(null);
  const mindfulnessSectionRef = useRef(null);
  const messageToneSectionRef = useRef(null);
  // Fase 2 (navegación, 28 de octubre de 2026): la app pasa de una sola
  // página larga a 5 pestañas (Inicio/Agenda/Herramientas/Progreso/Perfil —
  // ver AppTabBar.jsx). Es una preferencia de DISPOSITIVO, no de paciente
  // (igual que el tema claro/oscuro o "senda-celebrate"), así que vive en
  // localStorage y no en el progreso guardado en Supabase — y así quien
  // vuelve a abrir la app sigue en la pestaña donde se quedó.
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return window.localStorage.getItem("anro-active-tab") || "inicio";
    } catch (e) {
      return "inicio";
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("anro-active-tab", activeTab);
    } catch (e) {
      /* localStorage no disponible (modo privado, etc.) — seguimos solo con el estado en memoria */
    }
  }, [activeTab]);

  // Fase 2B (Herramientas como cuadrícula, 29 de octubre de 2026): dentro
  // de la pestaña Herramientas (la que tiene más paneles, 20 de 28) ya no
  // se ve una lista larga de un tirón — se ve una cuadrícula de tarjetas, y
  // tocar una abre SOLO esa herramienta (ver ToolsGrid.jsx). activeTool
  // null = se ve la cuadrícula; activeTool = "clave" = se ve solo ese
  // panel + un botón "Volver". No es estado persistido (ni en Supabase ni
  // en localStorage): es de sesión, se reinicia a la cuadrícula cada vez
  // que se entra de nuevo a Herramientas desde otra pestaña, para no dejar
  // a la paciente "atorada" dentro de una herramienta vieja sin querer.
  const [activeTool, setActiveTool] = useState(null);
  useEffect(() => {
    if (activeTab !== "herramientas") setActiveTool(null);
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const atajo = params.get("atajo");
    if (!atajo) return;
    const key = atajo === "respirar" ? "burbuja" : atajo === "freno" ? "freno" : null;
    if (key) {
      // setTimeout(…, 0) para dejar que el resto del render inicial termine
      // antes de forzar el cambio de pestaña — scrollToCompanionSection (ver
      // abajo) ya se encarga de esperar a que la pestaña de destino esté
      // visible antes de hacer scroll.
      setTimeout(() => scrollToCompanionSection(key), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El compañero de apoyo situacional y la vista "Hoy" enlazan a la
  // herramienta de Senda que ya existe para cada pendiente, en vez de
  // duplicar su contenido — mismo mecanismo de scroll que ya usaban los
  // atajos de "?atajo=respirar/freno".
  const companionSectionRefs = {
    desglosador: desglosadorSectionRef,
    oneThing: oneThingSectionRef,
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
    quickCapture: captureHubSectionRef,
    routines: routinesSectionRef,
    schedule: scheduleSectionRef,
    today: todaySectionRef,
    timeline: timelineSectionRef,
    companion: companionPanelSectionRef,
    focusMode: focusModeSectionRef,
    goodMoments: goodMomentsSectionRef,
    insights: insightsSectionRef,
    report: reportSectionRef,
    notifications: notificationsSectionRef,
    calendar: calendarSectionRef,
    bodyDouble: bodyDoubleSectionRef,
    mindfulness: mindfulnessSectionRef,
    messageTone: messageToneSectionRef,
  };
  // A qué pestaña (de las 5 de AppTabBar) pertenece cada sección — mismas
  // llaves que companionSectionRefs arriba. "today" no está porque Inicio
  // es la pestaña por defecto y no necesita navegarse a sí misma.
  const SECTION_TABS = {
    timeline: "agenda",
    schedule: "agenda",
    quickCapture: "herramientas",
    routines: "herramientas",
    companion: "herramientas",
    desglosador: "herramientas",
    auditor: "herramientas",
    oneThing: "herramientas",
    focusMode: "herramientas",
    mood: "herramientas",
    energy: "herramientas",
    medication: "herramientas",
    payments: "herramientas",
    cbt: "herramientas",
    habits: "herramientas",
    freno: "herramientas",
    burbuja: "herramientas",
    mindfulness: "herramientas",
    reestructuracion: "herramientas",
    messageTone: "herramientas",
    bodyDouble: "herramientas",
    goodMoments: "progreso",
    insights: "progreso",
    report: "progreso",
    notifications: "perfil",
    calendar: "perfil",
  };
  // Como las 5 pestañas (y, dentro de Herramientas, cada herramienta) se
  // muestran/ocultan con CSS (display:none), nada se desmonta — así que
  // saltar a una sección de otra pestaña (o de otra herramienta dentro de
  // Herramientas) primero tiene que cambiar ese estado (lo que la vuelve
  // display:block) y solo entonces hacer scrollIntoView; si se hiciera en
  // el mismo tick, el navegador todavía la vería display:none y el scroll
  // no haría nada. Por simplicidad SIEMPRE se espera doble
  // requestAnimationFrame antes de medir la posición, haya cambiado algo o
  // no — cuesta como mucho un parpadeo imperceptible, pero evita casos raros
  // donde activeTool cambió pero activeTab no (así que antes no se
  // esperaba) y el panel todavía no era visible.
  const scrollToCompanionSection = (key) => {
    const ref = companionSectionRefs[key];
    if (!ref) return;
    const targetTab = SECTION_TABS[key] || "inicio";
    if (targetTab === "herramientas") setActiveTool(key);
    if (targetTab !== activeTab) setActiveTab(targetTab);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    });
  };
  // Oculta (sin desmontar) cada sección que no sea de la pestaña activa —
  // ver la nota de arriba sobre por qué no se desmonta: ningún temporizador
  // ni estado interno de un panel se pierde al cambiar de pestaña.
  const tabStyle = (tab) => ({ display: activeTab === tab ? undefined : "none" });
  // Igual que tabStyle, pero para las 20 herramientas dentro de la pestaña
  // Herramientas: solo se ve la que está "abierta" (activeTool === key), y
  // solo cuando además esa pestaña es la activa.
  const toolStyle = (key) => ({ display: activeTab === "herramientas" && activeTool === key ? undefined : "none" });

  // Lista completa y en orden de las secciones de la página, para el menú
  // flotante "Ir a..." (Módulo 1). Reutiliza los mismos íconos que ya
  // identifican a cada panel en su encabezado (ver <Panel icon={...}> más
  // abajo) en vez de inventar un segundo set — así el ícono del menú
  // siempre coincide con el del panel al que lleva.
  const quickNavSections = [
    { key: "today", icon: <ListChecks size={18} />, label: t.app.panels.today.title },
    { key: "timeline", icon: <Clock size={18} />, label: t.app.panels.timeline.title },
    { key: "schedule", icon: <CalendarClock size={18} />, label: t.app.panels.schedule.title },
    { key: "quickCapture", icon: <StickyNote size={18} />, label: t.app.panels.captureHub.title },
    { key: "routines", icon: <Repeat size={18} />, label: t.app.panels.routines.title },
    { key: "companion", icon: <HeartHandshake size={18} />, label: t.app.panels.companion.title },
    { key: "desglosador", icon: <ListTree size={18} />, label: t.app.panels.dismantler.title },
    { key: "auditor", icon: <Timer size={18} />, label: t.app.panels.auditor.title },
    { key: "oneThing", icon: <Target size={18} />, label: t.app.panels.oneThing.title },
    { key: "focusMode", icon: <Headphones size={18} />, label: t.app.panels.focusMode.title },
    { key: "mood", icon: <Smile size={18} />, label: t.app.panels.mood.title },
    { key: "goodMoments", icon: <Heart size={18} />, label: t.app.panels.goodMoments.title },
    { key: "cbt", icon: <BookOpen size={18} />, label: t.app.panels.cbt.title },
    { key: "insights", icon: <TrendingUp size={18} />, label: t.app.panels.insights.title },
    { key: "report", icon: <FileText size={18} />, label: t.app.panels.report.title },
    { key: "notifications", icon: <Bell size={18} />, label: t.app.panels.notifications.title },
    { key: "calendar", icon: <CalendarRange size={18} />, label: t.app.panels.calendar.title },
    { key: "bodyDouble", icon: <Users size={18} />, label: t.app.panels.bodyDouble.title },
    { key: "energy", icon: <BatteryMedium size={18} />, label: t.app.panels.energy.title },
    { key: "medication", icon: <Pill size={18} />, label: t.app.panels.medication.title },
    { key: "payments", icon: <CreditCard size={18} />, label: t.app.panels.payments.title },
    { key: "freno", icon: <Hand size={18} />, label: t.app.panels.stopThink.title },
    { key: "burbuja", icon: <Wind size={18} />, label: t.app.panels.breathing.title },
    { key: "mindfulness", icon: <Flower2 size={18} />, label: t.app.panels.mindfulness.title },
    { key: "reestructuracion", icon: <Brain size={18} />, label: t.app.panels.reframe.title },
    { key: "messageTone", icon: <MessageSquare size={18} />, label: t.app.panels.messageTone.title },
    { key: "habits", icon: <Moon size={18} />, label: t.app.panels.habits.title },
  ];

  // Fase 2 (Inicio simplificado): los 4 accesos rápidos que eligió la
  // doctora (desglosador, compañero de apoyo, freno de impulsividad,
  // burbuja de enfoque) — se arman filtrando quickNavSections en vez de
  // declarar íconos/etiquetas nuevos, para que SIEMPRE coincidan con el
  // ícono y el título real de cada herramienta (si alguno cambia ahí,
  // cambia aquí solo).
  const QUICK_ACCESS_KEYS = ["desglosador", "companion", "freno", "burbuja"];
  const quickAccessItems = QUICK_ACCESS_KEYS.map((key) => quickNavSections.find((s) => s.key === key)).filter(Boolean);

  // Fase 2B (Herramientas como cuadrícula): las 20 tarjetas, en el mismo
  // orden en que ya aparecían como lista — reutiliza quickNavSections
  // (ícono + título) filtrando por SECTION_TABS, y le agrega como
  // descripción el mismo subtítulo que ya tiene cada panel en su propio
  // encabezado (t.app.panels.X.subtitle), para no escribir ni mantener un
  // segundo texto por herramienta. Las llaves de este mapa son las mismas
  // 20 que tienen SECTION_TABS[key] === "herramientas".
  const TOOL_DESCRIPTIONS = {
    quickCapture: t.app.panels.captureHub.subtitle,
    routines: t.app.panels.routines.subtitle,
    companion: t.app.panels.companion.subtitle,
    desglosador: t.app.panels.dismantler.subtitle,
    auditor: t.app.panels.auditor.subtitle,
    oneThing: t.app.panels.oneThing.subtitle,
    focusMode: t.app.panels.focusMode.subtitle,
    mood: t.app.panels.mood.subtitle,
    energy: t.app.panels.energy.subtitle,
    medication: t.app.panels.medication.subtitle,
    payments: t.app.panels.payments.subtitle,
    cbt: t.app.panels.cbt.subtitle,
    habits: t.app.panels.habits.subtitle,
    freno: t.app.panels.stopThink.subtitle,
    burbuja: t.app.panels.breathing.subtitle,
    mindfulness: t.app.panels.mindfulness.subtitle,
    reestructuracion: t.app.panels.reframe.subtitle,
    messageTone: t.app.panels.messageTone.subtitle,
    bodyDouble: t.app.panels.bodyDouble.subtitle,
  };
  // Fase 3 del sistema de planes (30 de octubre de 2026) — las 6
  // herramientas que son Plus completo (ver PlusLockedPanel más abajo en
  // este mismo archivo) muestran el badge "Plus" aquí en la cuadrícula,
  // antes de que la paciente las abra; las que solo tienen UNA función
  // interna bloqueada (desglosador, rutinas, compañero, modo enfoque) se
  // quedan sin badge porque la herramienta en sí sigue siendo gratis.
  const LOCKED_TOOL_KEYS = ["quickCapture", "messageTone", "calendar", "insights", "report", "payments"];
  const herramientasItems = quickNavSections
    .filter((s) => SECTION_TABS[s.key] === "herramientas")
    .map((s) => ({
      ...s,
      description: TOOL_DESCRIPTIONS[s.key],
      badge: !isPlus && LOCKED_TOOL_KEYS.includes(s.key) ? <PlusUpsellBadge C={C} t={t} /> : null,
    }));

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
  const [oneThing, setOneThing] = useState(saved.oneThing);
  const [routines, setRoutines] = useState(saved.routines);
  const [scheduleBlocks, setScheduleBlocks] = useState(saved.scheduleBlocks);

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
      oneThing,
      routines,
      scheduleBlocks,
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
    oneThing,
    routines,
    scheduleBlocks,
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

  // Fase 4, función #3 (31 de octubre de 2026 — tablero tipo Kanban,
  // gratis, decisión confirmada con la doctora: "AH GRATIS"): "list" |
  // "board", solo decide cuál vista se dibuja debajo — ambas leen/escriben
  // el mismo arreglo `steps` de arriba, así que no hace falta persistirlo
  // (los pasos del desglosador tampoco persisten entre sesiones).
  const [desglosadorView, setDesglosadorView] = useState("list");

  // ---- "Solo una cosa" (Módulo 4 de ANRO TDAH 2.0, 8 de noviembre de 2026) ----
  // Reutiliza los pasos del desglosador de arriba (pendingStepsForOneThing)
  // y el Modo Enfoque (ver OneThingPanel.jsx) — este bloque solo mueve el
  // estado puro de oneThing.js hacia la pantalla y decide cómo otorgar XP al
  // terminar, sin inventar un sistema de recompensas nuevo.
  const handleOneThingStart = (text, stepId = null) => setOneThing((prev) => startOneThing(prev, text, stepId));
  const handleOneThingSwitch = () => setOneThing((prev) => exitOneThing(prev));
  const handleOneThingExit = () => setOneThing((prev) => exitOneThing(prev));
  const handleOneThingFinish = () => {
    const activeStepId = oneThing?.current?.stepId;
    const activeText = oneThing?.current?.text;
    if (activeStepId) {
      // Ya es un paso del desglosador: marcarlo como hecho otorga su propio
      // XP (ver toggleStep) — otorgar XP aquí también lo duplicaría.
      toggleStep(activeStepId);
    } else if (activeText) {
      grantXp(t.app.xpLabels.oneThingCompleted(activeText));
    }
    setOneThing((prev) => finishOneThing(prev));
  };
  // "Dividir en pasos" / "no sé por dónde empezar" no duplica al desglosador
  // con IA que ya existe más abajo: solo lleva el texto de la tarea activa
  // (o lo que ya se había escrito en el buscador de "Solo una cosa") y
  // desplaza la pantalla hasta esa herramienta.
  const handleOneThingNeedHelp = (text) => {
    if (text && text.trim()) setBigTask(text.trim());
    scrollToCompanionSection("desglosador");
  };

  // ---- "Rutinas visuales guiadas" (Módulo 5 de ANRO TDAH 2.0, 8 de
  // noviembre de 2026) ---- Todo el estado vive en routines.js (lógica
  // pura); este bloque solo lo conecta con la pantalla y decide CUÁNDO
  // otorgar XP — solo al completar una rutina ENTERA, nunca al editarla ni
  // al avanzar un paso suelto, para que el incentivo sea terminar la
  // secuencia completa.
  const handleAddRoutineTemplate = (fields) => setRoutines((prev) => addRoutineTemplate(prev, fields));
  // Rutinas de ejemplo listas para usar (Fase 2F, 29 de octubre de 2026) —
  // la doctora reportó que, viendo la pantalla vacía, no quedaba claro ni
  // para qué sirve esto ni cómo se usa. En vez de solo mejorar el texto,
  // se agregaron 3 rutinas ya armadas (ver t.routines.presets) que se
  // agregan con un solo toque, para que se entienda viendo un ejemplo real
  // en vez de imaginándolo. Arma la plantilla y le agrega sus pasos en la
  // misma actualización de estado; si ya se llegó al tope de rutinas
  // (MAX_ROUTINE_TEMPLATES), addRoutineTemplate no agrega nada y aquí se
  // detecta eso (el arreglo de templates no creció) para no terminar
  // agregando los pasos del ejemplo a una rutina existente por error.
  const handleUseRoutinePreset = (preset) => {
    setRoutines((prev) => {
      const next = addRoutineTemplate(prev, { name: preset.name, icon: preset.icon });
      if (next.templates.length === prev.templates.length) return next;
      const newTpl = next.templates[next.templates.length - 1];
      let withSteps = next;
      preset.steps.forEach((st) => {
        withSteps = addRoutineStep(withSteps, newTpl.id, st);
      });
      return withSteps;
    });
  };
  const handleRemoveRoutineTemplate = (templateId) => setRoutines((prev) => removeRoutineTemplate(prev, templateId));
  const handleRenameRoutineTemplate = (templateId, fields) =>
    setRoutines((prev) => renameRoutineTemplate(prev, templateId, fields));
  const handleAddRoutineStep = (templateId, fields) => setRoutines((prev) => addRoutineStep(prev, templateId, fields));
  const handleRemoveRoutineStep = (templateId, stepId) =>
    setRoutines((prev) => removeRoutineStep(prev, templateId, stepId));
  const handleUpdateRoutineStep = (templateId, stepId, fields) =>
    setRoutines((prev) => updateRoutineStep(prev, templateId, stepId, fields));
  const handleMoveRoutineStep = (templateId, stepId, direction) =>
    setRoutines((prev) => moveRoutineStep(prev, templateId, stepId, direction));
  const handleStartRoutineSession = (templateId) => setRoutines((prev) => startRoutineSession(prev, templateId));
  const handleExitRoutineSession = () => setRoutines((prev) => exitRoutineSession(prev));
  const handleAdvanceRoutineSession = () => {
    const template = routines.templates.find((r) => r.id === routines.session?.templateId);
    const { state, completed } = advanceRoutineSession(routines);
    setRoutines(state);
    if (completed && template) grantXp(t.app.xpLabels.routineCompleted(template.name));
  };

  // Agenda visual interactiva (Módulo 2) — ver scheduleBlocks.js para la
  // decisión de alcance (sin sincronizar con Google Calendar todavía).
  const handleAddScheduleBlock = (fields) => setScheduleBlocks((prev) => addScheduleBlock(prev, fields));
  const handleRemoveScheduleBlock = (blockId) => setScheduleBlocks((prev) => removeScheduleBlock(prev, blockId));
  const handleUpdateScheduleBlock = (blockId, fields) =>
    setScheduleBlocks((prev) => updateScheduleBlock(prev, blockId, fields));
  const handleMoveScheduleBlock = (blockId, newStartMin) =>
    setScheduleBlocks((prev) => moveScheduleBlock(prev, blockId, newStartMin));

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

  // 27 de octubre de 2026 — mismo pedido de "que no se vea tan plana":
  // el campo de texto ahora tiene una sombra interior sutil (se siente
  // "hundido", como un campo real en vez de un rectángulo pintado) y el
  // botón primario suma un barniz de brillo arriba (glossy) más una
  // sombra del mismo color que el botón, para que se sienta con relieve
  // en vez de un bloque de color plano. btnGhost se queda igual de
  // discreto a propósito — es el botón "secundario", no debe competir.
  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px 12px",
    color: C.text,
    fontSize: "14px",
    fontFamily: "inherit",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
  };

  const btnPrimary = (bg, textColor) => ({
    background: `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%), ${bg}`,
    border: "none",
    borderRadius: "12px",
    padding: "10px 16px",
    color: textColor,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: `0 4px 10px ${tint(bg, 0.35)}`,
  });

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "10px 16px",
    color: C.text,
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        // 27 de octubre de 2026 — a petición de la doctora, el fondo de TODA
        // la app ahora sigue el color de acento que elige la paciente (antes
        // solo lo usaban la mascota y el panel "Hoy"). Es un lavado muy
        // suave del acento sobre el fondo normal del tema claro/oscuro, no
        // un color plano — así los 24 paneles, que sí mantienen su color
        // fijo por categoría (ver Panel más abajo), siguen contrastando bien
        // encima en vez de perderse contra un fondo saturado.
        background: `linear-gradient(160deg, ${tint(personalAccent, 0.12)}, ${C.bg} 60%)`,
        color: C.text,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        minHeight: "100vh",
        // Fase 2 (navegación): en móvil AppTabBar queda fija abajo (~60px +
        // el borde de seguridad del notch) y QuickNavMenu se sube encima de
        // ella (ver bottomOffset más abajo) — el padding inferior crece
        // para que el último panel de cada pestaña no quede tapado detrás
        // de ninguna de las dos. En escritorio AppTabBar es una fila normal
        // (no fija), así que el padding se queda como estaba.
        padding: isNarrow ? "28px 18px 160px" : "28px 18px 70px",
      }}
    >
      {/* Bienvenida de 3 pantallas, solo la primera vez — se renderiza
          siempre (no depende de activeTab), y ella sola decide si se
          muestra o no según localStorage (ver OnboardingTour.jsx). */}
      <OnboardingTour C={C} t={t} accent={personalAccent} />
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* 28 de octubre de 2026 — la doctora diseñó un logo propio (el
                  cerebrito sonriente) y pidió reemplazar la marca genérica de
                  acá (cuadrado con degradado + ícono de chispa, puesta el 27
                  de octubre por no haber logo todavía). El archivo vive en
                  /public (no en /src) porque así lo sirve Vite directo, sin
                  pasar por el empacador — mismo patrón que icon-192.png,
                  icon-512.png, etc. (ver vite.config.js). Es PNG con fondo
                  transparente, así que no necesita ninguna placa de color
                  detrás como tenía la versión anterior. */}
              <img
                src="/logo-mark.png"
                alt=""
                aria-hidden="true"
                style={{ width: "40px", height: "40px", flexShrink: 0 }}
              />
              <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>{t.common.appName}</h1>
            </div>
            {/* 50px = 40px del logo + 10px del espacio entre el logo y el
                título (mismo gap del contenedor de arriba) — para que el
                subtítulo quede alineado justo debajo del texto del título,
                no del logo. */}
            <p style={{ fontSize: "13px", color: C.textMuted, margin: "6px 0 0 50px" }}>
              {userEmail ? t.app.sessionOf(userEmail) : t.app.noEmailSubtitle}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onChangeLanguage && <LanguageSwitcher C={C} lang={lang} onChange={onChangeLanguage} t={t} height="40px" />}
            <div
              style={{
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
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
                    borderRadius: "12px",
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
                borderRadius: "12px",
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
                    borderRadius: "12px",
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
                  borderRadius: "12px",
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
            {onChangeAccent && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setAccentPickerOpen((prev) => !prev)}
                  aria-label={t.app.accentPicker.label}
                  title={t.app.accentPicker.label}
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: personalAccent,
                      boxShadow: `0 0 0 1px ${C.border}`,
                      display: "block",
                    }}
                    aria-hidden="true"
                  />
                </button>
                {accentPickerOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "16px",
                      padding: "12px",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                      zIndex: 10,
                      width: "176px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "10px" }}>
                      {t.app.accentPicker.prompt}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {ACCENT_OPTIONS.map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            onChangeAccent(key);
                            setAccentPickerOpen(false);
                          }}
                          aria-label={t.app.accentPicker.names[key]}
                          title={t.app.accentPicker.names[key]}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: C[key],
                            // Borde delgado siempre visible (no solo cuando está
                            // seleccionado) — 27 de octubre de 2026, necesario
                            // desde que se agregaron blanco y negro: un círculo
                            // blanco sin borde se pierde contra este popover
                            // (C.surface, casi blanco en modo claro), y uno negro
                            // se perdería igual contra un fondo oscuro.
                            boxShadow: key === accentKey ? `0 0 0 3px ${C.text}` : `0 0 0 1px ${C.border}`,
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {onChangeSpecies && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setSpeciesPickerOpen((prev) => !prev)}
                  aria-label={t.app.speciesPicker.label}
                  title={t.app.speciesPicker.label}
                  style={{
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    borderRadius: "12px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                >
                  <span aria-hidden="true" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" }}>
                    {matureEmoji(species || DEFAULT_SPECIES)}
                  </span>
                </button>
                {speciesPickerOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      right: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "16px",
                      padding: "14px",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                      zIndex: 10,
                      width: "236px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "10px" }}>
                      {t.app.speciesPicker.prompt}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {SPECIES_OPTIONS.map((key) => {
                        const selected = key === (species || DEFAULT_SPECIES);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              onChangeSpecies(key);
                              setSpeciesPickerOpen(false);
                            }}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "6px",
                              width: "64px",
                              padding: "10px 4px 8px",
                              borderRadius: "14px",
                              background: selected ? tint(personalAccent, 0.18) : tint(C.textMuted, 0.06),
                              border: selected ? `2px solid ${personalAccent}` : "2px solid transparent",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                background: C.surfaceAlt,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))",
                              }}
                            >
                              {matureEmoji(key)}
                            </span>
                            <span style={{ fontSize: "10px", color: C.textMuted, textAlign: "center" }}>
                              {t.app.speciesPicker.names[key]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {onManageSubscription && (
              <button
                onClick={onManageSubscription}
                style={{
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "12px",
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
                  borderRadius: "12px",
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

        {manageSubscriptionError && (
          <p
            role="alert"
            style={{
              fontSize: "13px",
              color: C.amber,
              textAlign: "center",
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            {manageSubscriptionError}
          </p>
        )}

        <Mascot streak={streak} C={C} t={t} accent={personalAccent} species={species} focusStatus={focusStatus} />

        {/* Fase 2 (navegación, 28 de octubre de 2026): barra de 5 pestañas
            que reemplaza el scroll largo como forma principal de moverse
            por la app — fija abajo en móvil, fila arriba en tablet/
            escritorio (ver AppTabBar.jsx, que decide cuál según isNarrow).
            Cuando es fija abajo, su posición en el JSX no importa para el
            layout (position:fixed), pero aquí mismo es donde aparece
            inline cuando NO es fija — justo debajo de la mascota. */}
        <AppTabBar C={C} t={t} accent={personalAccent} activeTab={activeTab} onChange={setActiveTab} isNarrow={isNarrow} />

        {/* role="tabpanel" sobre TODA la región de paneles (no solo los de
            la pestaña activa): como cada sección que no es de la pestaña
            activa ya tiene display:none (tabStyle, ver arriba) y eso la
            saca por completo del árbol de accesibilidad, un lector de
            pantalla que entra a esta región solo encuentra el contenido de
            la pestaña realmente visible — exactamente el comportamiento
            correcto de un tabpanel, sin tener que partir este bloque en 5
            contenedores físicos separados. */}
        <div role="tabpanel" id={`anro-tabpanel-${activeTab}`} aria-labelledby={`anro-tab-${activeTab}`} tabIndex={-1}>
        {/* Módulo 1 (8 de noviembre de 2026): "Hoy" se mueve a ser el
            PRIMER panel bajo el saludo/mascota — antes quedaba enterrado
            después del frasco de recompensas y el disclaimer, lejos de
            funcionar como una verdadera pantalla de inicio. Ahora es lo
            primero que se ve al abrir la app, y ya conoce las Rutinas
            (Módulo 5) además de todo lo que ya cubría. */}
        <div ref={todaySectionRef} style={tabStyle("inicio")}>
          <Panel C={C}
            accent={personalAccent}
            icon={<ListChecks size={22} />}
            title={t.app.panels.today.title}
            subtitle={t.app.panels.today.subtitle}
          >
            <TodayPanel
              C={C}
              t={t}
              accent={personalAccent}
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
              routines={routines}
              onNavigate={scrollToCompanionSection}
            />
            <div style={{ marginTop: "18px" }}>
              <QuickAccessGrid C={C} t={t} accent={personalAccent} items={quickAccessItems} onSelect={scrollToCompanionSection} />
            </div>
          </Panel>
        </div>

        {/* Fase 2 (Inicio simplificado): el frasco de recompensas y el
            disclaimer vivían sueltos, fuera de cualquier pestaña — un
            descuido de la Fase A (se agregó style={tabStyle(...)} a los 28
            paneles, pero no a estos dos bloques, que no son <Panel>).
            Corregido aquí: ambos quedan en Inicio, junto a "Hoy", que es de
            donde siempre fueron vecinos. */}
        <div style={tabStyle("inicio")}>
        {/* Dopamine jar */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
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
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "24px",
            fontSize: "12px",
            color: C.textMuted,
            lineHeight: 1.6,
          }}
        >
          {t.app.disclaimer}
        </div>
        </div>

        <div ref={timelineSectionRef} style={tabStyle("agenda")}>
          <Panel C={C}
            accent={C.amber}
            icon={<Clock size={22} />}
            title={t.app.panels.timeline.title}
            subtitle={t.app.panels.timeline.subtitle}
          >
            <DayTimelinePanel C={C} t={t} jar={jar} accent={personalAccent} />
          </Panel>
        </div>

        <div ref={scheduleSectionRef} style={tabStyle("agenda")}>
          <Panel C={C}
            accent={C.sky}
            icon={<CalendarClock size={22} />}
            title={t.app.panels.schedule.title}
            subtitle={t.app.panels.schedule.subtitle}
          >
            <ScheduleAgendaPanel
              C={C}
              t={t}
              lang={lang}
              scheduleState={scheduleBlocks}
              onAdd={handleAddScheduleBlock}
              onRemove={handleRemoveScheduleBlock}
              onUpdate={handleUpdateScheduleBlock}
              onMove={handleMoveScheduleBlock}
            />
          </Panel>
        </div>

        {/* Fase 2B (Herramientas como cuadrícula): se ve SOLO cuando la
            pestaña activa es Herramientas — en cualquier otra pestaña este
            bloque entero queda oculto, igual que los paneles. Sin
            activeTool: cuadrícula de las 20 tarjetas. Con activeTool: un
            botón para volver a la cuadrícula (la herramienta misma ya se ve
            más abajo, por su propio toolStyle). */}
        {activeTab === "herramientas" && (
          <div style={{ marginBottom: "20px" }}>
            {activeTool === null ? (
              <ToolsGrid C={C} t={t} accent={personalAccent} items={herramientasItems} onSelect={setActiveTool} />
            ) : (
              <button
                onClick={() => setActiveTool(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minHeight: "40px",
                  padding: "8px 14px",
                  background: "transparent",
                  border: `1px solid ${C.border}`,
                  borderRadius: "12px",
                  color: C.text,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} /> {t.tools.backButton}
              </button>
            )}
          </div>
        )}

        <div ref={captureHubSectionRef} style={toolStyle("quickCapture")}>
        <Panel C={C}
          accent={C.amber}
          icon={<StickyNote size={22} />}
          title={t.app.panels.captureHub.title}
          subtitle={t.app.panels.captureHub.subtitle}
        >
          <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
          <CaptureHubPanel
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
          </PlusLockedPanel>
        </Panel>
        </div>

        <div ref={routinesSectionRef} style={toolStyle("routines")}>
        <Panel C={C}
          accent={C.sky}
          icon={<Repeat size={22} />}
          title={t.app.panels.routines.title}
          subtitle={t.app.panels.routines.subtitle}
        >
          <RoutinesPanel
            C={C}
            t={t}
            routines={routines}
            isPlus={isPlus}
            onRequestUpgrade={onRequestUpgrade}
            onAddTemplate={handleAddRoutineTemplate}
            onUseTemplate={handleUseRoutinePreset}
            onRemoveTemplate={handleRemoveRoutineTemplate}
            onRenameTemplate={handleRenameRoutineTemplate}
            onAddStep={handleAddRoutineStep}
            onRemoveStep={handleRemoveRoutineStep}
            onUpdateStep={handleUpdateRoutineStep}
            onMoveStep={handleMoveRoutineStep}
            onStartSession={handleStartRoutineSession}
            onAdvanceSession={handleAdvanceRoutineSession}
            onExitSession={handleExitRoutineSession}
          />
        </Panel>
        </div>

        <div ref={companionPanelSectionRef} style={toolStyle("companion")}>
          <Panel C={C}
            accent={C.lavender}
            icon={<HeartHandshake size={22} />}
            title={t.app.panels.companion.title}
            subtitle={t.app.panels.companion.subtitle}
          >
            <CompanionPanel
              C={C}
              t={t}
              lang={lang}
              userId={userId}
              onNavigate={scrollToCompanionSection}
              isPlus={isPlus}
              onRequestUpgrade={onRequestUpgrade}
            />
          </Panel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr", gap: "0 20px" }}>
          <div>
            <div ref={desglosadorSectionRef} style={toolStyle("desglosador")}>
            <Panel C={C}
              accent={C.coral}
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
                  {/* Fase 3 (30 de octubre de 2026) — el desglosador manual (lo
                      de abajo: agregar pasos a mano, lista, temporizador) sigue
                      siendo gratis para toda cuenta; solo la asistencia con IA
                      (granularidad + botón de IA) es Plus. Se gatea aquí en vez
                      de envolver el panel completo para no quitarle a nadie la
                      herramienta base. */}
                  {isPlus ? (
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
                              borderRadius: "12px",
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
                    </>
                  ) : (
                    <div style={{ marginBottom: "14px" }}>
                      <PlusUpsellInline C={C} t={t} label={t.upsell.aiBreakdown} onRequestUpgrade={onRequestUpgrade} />
                    </div>
                  )}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <button
                        onClick={() => setDesglosadorView("list")}
                        aria-pressed={desglosadorView === "list"}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "999px",
                          border: `1px solid ${desglosadorView === "list" ? C.coral : C.border}`,
                          background: desglosadorView === "list" ? C.coral : "transparent",
                          color: desglosadorView === "list" ? C.coralText : C.textMuted,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {t.app.dismantler.kanban.viewListLabel}
                      </button>
                      <button
                        onClick={() => setDesglosadorView("board")}
                        aria-pressed={desglosadorView === "board"}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "999px",
                          border: `1px solid ${desglosadorView === "board" ? C.coral : C.border}`,
                          background: desglosadorView === "board" ? C.coral : "transparent",
                          color: desglosadorView === "board" ? C.coralText : C.textMuted,
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {t.app.dismantler.kanban.viewBoardLabel}
                      </button>
                    </div>
                  )}
                  {steps.length > 0 && desglosadorView === "list" && (
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
                      {isPlus ? (
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
                      ) : (
                        // "Elige por mí" (pickForMe) es Plus — botón con
                        // candado en vez del Shuffle normal, mismo texto para
                        // que no haya que armar una frase nueva por idioma.
                        <button
                          onClick={onRequestUpgrade}
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
                          <Lock size={12} />
                          {t.app.dismantler.pickForMe}
                        </button>
                      )}
                    </div>
                  )}
                  {chosenStep && isPlus && (
                    <p style={{ fontSize: "12px", color: C.lavenderText, margin: "0 0 8px", fontWeight: 600 }}>
                      {t.app.dismantler.startWith(chosenStep.text)}
                    </p>
                  )}
                  {chooseMsg && (
                    <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px" }}>{chooseMsg}</p>
                  )}
                  {desglosadorView === "list" && (() => {
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
                  {desglosadorView === "board" && steps.length > 0 && (
                    <KanbanBoard
                      C={C}
                      t={t}
                      steps={steps}
                      activeStepId={oneThing?.current?.stepId ?? null}
                      onStart={(s) => handleOneThingStart(s.text, s.id)}
                      onStopActive={handleOneThingSwitch}
                      onToggleStep={toggleStep}
                      onRemoveStep={removeStep}
                    />
                  )}
                </>
              )}
            </Panel>
            </div>

            <div ref={auditorSectionRef} style={toolStyle("auditor")}>
            <Panel C={C}
              accent={C.coral}
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
                <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "12px 14px", fontSize: "14px" }}>
                  {audit.diff > 0
                    ? t.app.auditor.resultMore(audit.realMin, estimateMin, audit.diff)
                    : audit.diff < 0
                    ? t.app.auditor.resultLess(audit.realMin, estimateMin, Math.abs(audit.diff))
                    : t.app.auditor.resultExact(audit.realMin, estimateMin)}
                </div>
              )}
            </Panel>
            </div>

            <div ref={oneThingSectionRef} style={toolStyle("oneThing")}>
            <Panel C={C}
              accent={C.coral}
              icon={<Target size={22} />}
              title={t.app.panels.oneThing.title}
              subtitle={t.app.panels.oneThing.subtitle}
            >
              <OneThingPanel
                C={C}
                t={t}
                pendingSteps={steps.filter((s) => !s.done)}
                current={oneThing.current}
                onStart={handleOneThingStart}
                onFinish={handleOneThingFinish}
                onSwitch={handleOneThingSwitch}
                onExit={handleOneThingExit}
                onNeedHelp={handleOneThingNeedHelp}
                onSessionComplete={() => {
                  bodyDouble.setStatus("aqui");
                }}
                onSessionStart={(min) => {
                  scheduleStepsOnCalendar(
                    userId,
                    [{ text: oneThing?.current?.text || t.app.focusSessionEventTitle, min }],
                    { kind: "oneThing" }
                  );
                  bodyDouble.setStatus("enfocando");
                }}
                onFocusStatusChange={setFocusStatus}
              />
            </Panel>
            </div>

            <div ref={focusModeSectionRef} style={toolStyle("focusMode")}>
            <Panel C={C}
              accent={C.coral}
              icon={<Headphones size={22} />}
              title={t.app.panels.focusMode.title}
              subtitle={t.app.panels.focusMode.subtitle}
            >
              <FocusMode
                C={C}
                t={t}
                isPlus={isPlus}
                onRequestUpgrade={onRequestUpgrade}
                onSessionComplete={() => {
                  grantXp(t.app.xpLabels.focusSessionCompleted);
                  bodyDouble.setStatus("aqui");
                }}
                onSessionStart={(min) => {
                  scheduleStepsOnCalendar(userId, [{ text: t.app.focusSessionEventTitle, min }], { kind: "focus" });
                  bodyDouble.setStatus("enfocando");
                }}
                onFocusStatusChange={setFocusStatus}
              />
            </Panel>
            </div>

            <div ref={moodSectionRef} style={toolStyle("mood")}>
            <Panel C={C}
              accent={C.lavender}
              icon={<Smile size={22} />}
              title={t.app.panels.mood.title}
              subtitle={t.app.panels.mood.subtitle}
            >
              <MoodLog C={C} t={t} moodLog={moodLog} onSave={handleMoodSave} />
            </Panel>
            </div>

            <div ref={goodMomentsSectionRef} style={tabStyle("progreso")}>
            <Panel C={C}
              accent={C.lavender}
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
            </div>

            <div ref={cbtSectionRef} style={toolStyle("cbt")}>
            <Panel C={C}
              accent={C.lavender}
              icon={<BookOpen size={22} />}
              title={t.app.panels.cbt.title}
              subtitle={t.app.panels.cbt.subtitle}
            >
              <CbtProgramPanel C={C} t={t} program={cbtProgram} onComplete={handleCbtLessonComplete} />
            </Panel>
            </div>

            <ScienceCapsulePanel C={C} t={t} />

            <div ref={insightsSectionRef} style={tabStyle("progreso")}>
            <Panel C={C}
              accent={C.amber}
              icon={<TrendingUp size={22} />}
              title={t.app.panels.insights.title}
              subtitle={t.app.panels.insights.subtitle}
            >
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
              <WeeklyInsights
                C={C}
                t={t}
                moodLog={moodLog}
                jar={jar}
                streak={streak}
                habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared }}
                sleepLog={sleepLog}
              />
              </PlusLockedPanel>
            </Panel>
            </div>

            <div ref={reportSectionRef} style={tabStyle("progreso")}>
            <Panel C={C}
              accent={C.amber}
              icon={<FileText size={22} />}
              title={t.app.panels.report.title}
              subtitle={t.app.panels.report.subtitle}
            >
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
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
              </PlusLockedPanel>
            </Panel>
            </div>

            <div ref={notificationsSectionRef} style={tabStyle("perfil")}>
            <Panel C={C}
              accent={C.sky}
              icon={<Bell size={22} />}
              title={t.app.panels.notifications.title}
              subtitle={t.app.panels.notifications.subtitle}
            >
              <NotificationsPanel C={C} t={t} userId={userId} />
            </Panel>
            </div>

            <div ref={calendarSectionRef} style={tabStyle("perfil")}>
            <Panel C={C}
              accent={C.sky}
              icon={<CalendarRange size={22} />}
              title={t.app.panels.calendar.title}
              subtitle={t.app.panels.calendar.subtitle}
            >
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
              <CalendarPanel C={C} t={t} userId={userId} />
              </PlusLockedPanel>
            </Panel>
            </div>

            <div ref={bodyDoubleSectionRef} style={toolStyle("bodyDouble")}>
            <Panel C={C}
              accent={C.rose}
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
          </div>

          <div>
            <div ref={energySectionRef} style={toolStyle("energy")}>
            <Panel C={C}
              accent={C.mint}
              icon={<BatteryMedium size={22} />}
              title={t.app.panels.energy.title}
              subtitle={t.app.panels.energy.subtitle}
            >
              <EnergyLog C={C} t={t} energyLog={energyLog} onSave={handleEnergySave} />
            </Panel>
            </div>

            <div ref={medicationSectionRef} style={toolStyle("medication")}>
            <Panel C={C}
              accent={C.mint}
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

            <div ref={paymentsSectionRef} style={toolStyle("payments")}>
            <Panel C={C}
              accent={C.sky}
              icon={<CreditCard size={22} />}
              title={t.app.panels.payments.title}
              subtitle={t.app.panels.payments.subtitle}
            >
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
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
              </PlusLockedPanel>
            </Panel>
            </div>

            <div ref={stopThinkSectionRef} style={toolStyle("freno")}>
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
                <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "18px", textAlign: "center" }}>
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

            <div ref={breathingSectionRef} style={toolStyle("burbuja")}>
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

            <div ref={mindfulnessSectionRef} style={toolStyle("mindfulness")}>
            <Panel C={C}
              accent={C.lavender}
              icon={<Flower2 size={22} />}
              title={t.app.panels.mindfulness.title}
              subtitle={t.app.panels.mindfulness.subtitle}
            >
              <MindfulnessPanel C={C} t={t} lang={lang} onComplete={handleMindfulnessComplete} />
            </Panel>
            </div>

            <div ref={reestructuracionSectionRef} style={toolStyle("reestructuracion")}>
            <Panel C={C}
              accent={C.rose}
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
                <div style={{ background: C.surfaceAlt, borderRadius: "12px", padding: "14px" }}>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 6px" }}>{t.app.reframe.resultLabel}</p>
                  <p style={{ fontSize: "15px", margin: "0 0 14px" }}>{rfAlternative}</p>
                  <button onClick={rfReset} style={btnGhost}>
                    {t.app.reframe.doAnother}
                  </button>
                </div>
              )}
            </Panel>
            </div>

            <div ref={messageToneSectionRef} style={toolStyle("messageTone")}>
            <Panel C={C}
              accent={C.rose}
              icon={<MessageSquare size={22} />}
              title={t.app.panels.messageTone.title}
              subtitle={t.app.panels.messageTone.subtitle}
            >
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
              <MessageTonePanel C={C} t={t} lang={lang} userId={userId} />
              </PlusLockedPanel>
            </Panel>
            </div>
          </div>
        </div>

        <div ref={habitsSectionRef} style={toolStyle("habits")}>
        <Panel C={C}
          accent={C.coral}
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
        </div>

        <p style={{ fontSize: "12px", color: C.textMuted, textAlign: "center", lineHeight: 1.6, marginTop: "8px" }}>
          {t.app.footerNote}
        </p>
      </div>

      {/* Módulo 1 (navegación): botón flotante que deja saltar a cualquiera
          de los 28 paneles desde cualquier punto del scroll — posición fija,
          así que no importa en qué parte del árbol de JSX se declare.
          scrollToCompanionSection ya sabe cambiar de pestaña sola si la
          sección pedida vive en otra (ver más arriba), así que este menú
          sigue funcionando exactamente igual que antes de la Fase 2, ahora
          cruzando pestañas cuando hace falta. bottomOffset lo sube por
          encima de AppTabBar cuando esta queda fija abajo (móvil). */}
      <QuickNavMenu
        C={C}
        t={t}
        accent={personalAccent}
        sections={quickNavSections}
        onNavigate={scrollToCompanionSection}
        bottomOffset={isNarrow ? 64 : 0}
      />
    </div>
  );
}
