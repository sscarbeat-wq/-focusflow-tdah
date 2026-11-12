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
  MessageCircle,
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
  Network,
  Info,
  X,
  Wrench,
  Flame,
  Globe,
} from "lucide-react";

import LanguageSwitcher from "./LanguageSwitcher";
import CalmBubbles from "./CalmBubbles";
import ReorderHandle from "./ReorderHandle";
import AppTabBar from "./AppTabBar";
import QuickAccessCompass from "./QuickAccessCompass";
import ToolsGrid from "./ToolsGrid";
import OnboardingTour from "./OnboardingTour";
import InstallBanner from "./InstallBanner";
import PostDiagnosisCard from "./PostDiagnosisCard";
import ScienceCapsulePanel from "./ScienceCapsulePanel";
import MindfulnessPanel from "./MindfulnessPanel";
import FocusMode from "./FocusMode";
import OneThingPanel from "./OneThingPanel";
import KanbanBoard from "./KanbanBoard";
import MindMap from "./MindMap";
import MedicationAlarm from "./MedicationAlarm";
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
import MemoriaAnroLauncher from "./MemoriaAnroLauncher";
import BreathingBubbleLauncher from "./BreathingBubbleLauncher";
import { hasPlusAccess } from "./plans";
import { PlusLockedPanel, PlusUpsellBadge, PlusUpsellInline } from "./PlusUpsellCard";
import { scheduleStepsOnCalendar } from "./calendarSync";
import { useBodyDouble } from "./bodyDouble";
import { celebrate } from "./celebrate";
import { DEFAULT_STREAK, nextStreak, effectiveStreak } from "./streak";
import { DEFAULT_MOOD_LOG, recordMood, todayEntry as todayMoodEntry } from "./moodLog";
import {
  DEFAULT_FOCUS_SESSION_LOG,
  logFocusSession,
  todayFocusPercent,
  todayFocusMinutes,
  DAILY_FOCUS_GOAL_MIN,
} from "./focusSessionLog";
import { DEFAULT_ENERGY_LOG, recordEnergy } from "./energyLog";
import {
  DEFAULT_MEDICATIONS,
  DEFAULT_MEDICATION_DOSE_LOG,
  addMedication,
  removeMedication,
  logDose,
  undoDose,
  isValidDoseTime,
  todayDoses,
  doseTaken,
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
  setQuickNoteReminder,
  reminderDateKeyFromPreset,
} from "./quickCapture";
import { DEFAULT_SLEEP_LOG, recordBedtime, todayBedtime, sleepDurationMinutes } from "./sleepLog";
import { DEFAULT_IMPULSE_BRAKE_LOG, recordImpulseBrakeUse } from "./impulseBrakeLog";
import { DEFAULT_GOOD_MOMENTS, addGoodMoment, removeGoodMoment } from "./goodMoments";
import ProgressSummary from "./ProgressSummary";
import ActiveBreak from "./ActiveBreak";
import DeskReady from "./DeskReady";
import TodayHabitsStrip from "./TodayHabitsStrip";
import HabitsList from "./HabitsList";
import {
  DEFAULT_CUSTOM_HABITS,
  habitDayKey,
  normalizeCustomHabits,
  canAddCustomHabit,
  addCustomHabit,
  updateCustomHabit,
  removeCustomHabit,
  toggleCustomHabit,
  resetCustomHabits,
} from "./customHabits";
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
  scheduleBlocksForDay,
  formatMinutesAsTime,
} from "./scheduleBlocks";
import ScheduleAgendaPanel from "./ScheduleAgendaPanel";
import { buildTodayItems } from "./todayView";
import { timeOfDayPeriod, timeOfDayPalette, timeOfDayBackground } from "./timeOfDayPalette";
import HomeHeader from "./HomeHeader";
import { tint, ACCENT_OPTIONS, UNLOCKABLE_ACCENT_OPTIONS, PLUS_ACCENTS, planetColorsFor, SOLAR_PLANETS } from "./theme";
import { PlusUpsellBadge as PlusMark } from "./PlusUpsellCard";
import { PLUS_THEMES } from "./plusThemes";
import {
  matureEmoji,
  DEFAULT_SPECIES,
  isUnlockableSpecies,
  isPlusSpecies,
  ACCESSORY_OPTIONS,
  ACCESSORY_EMOJI,
  DEFAULT_ACCESSORY,
  PLUS_ACCESSORIES,
  getStoredCompassSelection,
  storeCompassSelection,
} from "./mascotLogic";
import CompassEditSheet from "./CompassEditSheet";
import SpeciesPickerSheet from "./SpeciesPickerSheet";
import { MascotArt } from "./MascotSprite";
import { XP_MILESTONES, isUnlocked, justCrossedMilestones } from "./xpMilestones";

const DEFAULT_PROGRESS = {
  xp: 0,
  jar: [],
  screensOff: false,
  sleepEnv: false,
  ateWell: false,
  hydrated: false,
  deskCleared: false,
  // 11 nov 2026 — ver customHabits.js: hábitos propios, a qué "día de
  // hábitos" pertenecen las palomitas y cuáles ya dieron XP ese día.
  customHabits: DEFAULT_CUSTOM_HABITS,
  habitsDay: null,
  habitXpGiven: [],
  // Avisos de hábitos (10 am, 3 pm, 9 pm — ver habitReminders.js). La
  // persona puede apagar solo estos desde Perfil → Notificaciones.
  habitReminders: true,
  streak: DEFAULT_STREAK,
  moodLog: DEFAULT_MOOD_LOG,
  energyLog: DEFAULT_ENERGY_LOG,
  focusSessionLog: DEFAULT_FOCUS_SESSION_LOG,
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
        // Capa de color encima de un fondo SÓLIDO: tint() es translúcido, y
        // sin el color de fondo debajo se transparentaba el degradado de la
        // página (la parte de arriba de la tarjeta se veía lavada y el
        // subtítulo casi no se leía).
        background: `linear-gradient(165deg, ${tint(accent, 0.07)}, transparent 55%), ${C.surface}`,
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
  accessory,
  onChangeAccessory,
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
  //
  // 8 de noviembre de 2026: el cálculo de `personalAccent` se movió más
  // abajo en este archivo (justo después de declarar `xp`), porque ahora
  // necesita saber cuántos puntos tiene la paciente para decidir si un
  // color con candado (UNLOCKABLE_ACCENT_OPTIONS, ver theme.js) ya está
  // desbloqueado — ver ese bloque para los detalles.

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
  const [accessoryPickerOpen, setAccessoryPickerOpen] = useState(false);
  // "✏️ Editar" de la brújula de Inicio (ver COMPASS_POOL más abajo) —
  // preferencia de dispositivo, mismo patrón que especie/accesorio/fijado.
  const [compassEditOpen, setCompassEditOpen] = useState(false);
  const [compassKeys, setCompassKeys] = useState(() => getStoredCompassSelection());
  // Se calcula YA en el primer render (antes empezaba en `false` y se
  // corregía en un useEffect): las 3 burbujas flotantes calculan su
  // posición inicial al montarse, y como los efectos de los hijos corren
  // ANTES que los del padre, en el teléfono la veían todavía en `false` —
  // con bottomOffset 0 — y nacían encimadas sobre la barra de pestañas de
  // abajo (tapando "Inicio" y "Perfil"). Verificado con Playwright a 390px.
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);
  // Pantalla ancha (computadora) y pantalla bajita (celular chico) — las
  // usa la franja de hábitos de Inicio: en pantalla ancha va A UN LADO de
  // la brújula (debajo empujaba la barra de pestañas fuera de la pantalla)
  // y en celulares bajitos se compacta.
  const [isWide, setIsWide] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1180);
  const [isShort, setIsShort] = useState(() => typeof window !== "undefined" && window.innerHeight < 800);
  useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 760);
      setIsWide(window.innerWidth >= 1180);
      setIsShort(window.innerHeight < 800);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const breathingSectionRef = useRef(null);
  const calmBubblesSectionRef = useRef(null);
  const activeBreakSectionRef = useRef(null);
  const stopThinkSectionRef = useRef(null);
  const desglosadorSectionRef = useRef(null);
  const mindMapSectionRef = useRef(null);
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
  // 10 de noviembre de 2026 ("lo primero que quiero que aparezca es el
  // animal y el círculo... no quiero nada más... no los quiero así en
  // lista larga, quiero que la app sea interactiva"): Inicio ya no es una
  // página larga. Por defecto muestra SOLO la brújula ("compass"); el panel
  // "Hoy" con la lista de pendientes es ahora una página aparte dentro de
  // Inicio ("hoy"), a la que se llega tocando "Próximo paso" en la brújula
  // (o desde "Ir a..."), con un botón para volver — mismo patrón que ya
  // usan las herramientas (cuadrícula → herramienta → volver).
  const [inicioView, setInicioView] = useState("compass");
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
  const [activeTool, setActiveTool] = useState(() => {
    // Si al cargar ya hay una pausa activa, empezar con ella abierta
    try { if (localStorage.getItem("anro-break-session")) return "activeBreak"; } catch (_) {}
    return null;
  });
  useEffect(() => {
    if (activeTab === "herramientas") {
      // Al volver a Herramientas, si hay pausa guardada → re-abrir
      try {
        const saved = localStorage.getItem("anro-break-session");
        if (saved) { setActiveTool("activeBreak"); return; }
      } catch (_) {}
    } else {
      // No resetear si hay pausa activa en curso
      try {
        if (localStorage.getItem("anro-break-session")) return;
      } catch (_) {}
      setActiveTool(null);
    }
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
    mindMap: mindMapSectionRef,
    oneThing: oneThingSectionRef,
    burbuja: breathingSectionRef,
    calmBubbles: calmBubblesSectionRef,
    activeBreak: activeBreakSectionRef,
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
    mindMap: "herramientas",
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
    calmBubbles: "herramientas",
    activeBreak: "herramientas",
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
  // `opts.instant` (8 de noviembre de 2026, recorrido de bienvenida
  // interactivo): el recorrido necesita medir dónde quedó el elemento
  // justo después de navegar, para dibujar el "agujero" de spotlight
  // encima — con scroll "smooth" el elemento seguiría moviéndose cuando
  // se mide, y el spotlight quedaría mal calculado. El resto de llamadas
  // (menú "Ir a...", atajos, etc.) no pasa `opts` y sigue con scroll
  // animado como siempre.
  const scrollToCompanionSection = (key, opts = {}) => {
    // "home": la brújula de Inicio (no es una sección con ref; la usa el
    // recorrido de bienvenida para regresar a la mascota).
    if (key === "home") {
      setInicioView("compass");
      setActiveTab("inicio");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
      return;
    }
    const ref = companionSectionRefs[key];
    if (!ref) return;
    const targetTab = SECTION_TABS[key] || "inicio";
    if (targetTab === "herramientas") setActiveTool(key);
    if (targetTab === "inicio") setInicioView("hoy");
    if (targetTab === "progreso") setProgressView({ goodMoments: "momentos", report: "consulta" }[key] || "semana");
    if (targetTab !== activeTab) setActiveTab(targetTab);
    const behavior = opts.instant ? "auto" : "smooth";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior, block: "center" }));
    });
  };
  // Oculta (sin desmontar) cada sección que no sea de la pestaña activa —
  // ver la nota de arriba sobre por qué no se desmonta: ningún temporizador
  // ni estado interno de un panel se pierde al cambiar de pestaña.
  // Qué parte de Progreso se ve (ver la barra de 3 opciones en esa pestaña).
  const [progressView, setProgressView] = useState("semana");
  const tabStyle = (tab) => ({ display: activeTab === tab ? undefined : "none" });
  // En escritorio, estando en Inicio, la barra de pestañas va dentro de la
  // brújula (abajo) para que lo primero de la pantalla sea la mascota y el
  // círculo sin esconder la navegación — ver la nota junto a <AppTabBar>.
  const inicioCompass = activeTab === "inicio" && inicioView === "compass";
  const tabBarInHero = inicioCompass && !isNarrow;
  // Tocar la pestaña "Inicio" siempre regresa a la brújula (aunque se
  // estuviera viendo la página "Hoy").
  const goToTab = (tab) => {
    if (tab === "inicio") setInicioView("compass");
    setActiveTab(tab);
  };
  // Igual que tabStyle, pero para las 20 herramientas dentro de la pestaña
  // Herramientas: solo se ve la que está "abierta" (activeTool === key), y
  // solo cuando además esa pestaña es la activa.
  // `gridColumn: "1 / -1"`: dentro de la cuadrícula de 2 columnas de más
  // abajo, la herramienta abierta usa todo el ancho (solo se ve una a la
  // vez, así que no tiene con quién compartir la fila). Fuera de una
  // cuadrícula esta propiedad no hace nada.
  const toolStyle = (key) => ({
    display: activeTab === "herramientas" && activeTool === key ? undefined : "none",
    gridColumn: "1 / -1",
  });

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
    { key: "mindMap", icon: <Network size={18} />, label: t.app.panels.mindMap.title },
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
    { key: "calmBubbles", icon: <Sparkles size={18} />, label: t.app.panels.calmBubbles.title },
    { key: "activeBreak", icon: <Activity size={18} />, label: t.app.panels.activeBreak.title },
    { key: "mindfulness", icon: <Flower2 size={18} />, label: t.app.panels.mindfulness.title },
    { key: "reestructuracion", icon: <Brain size={18} />, label: t.app.panels.reframe.title },
    { key: "messageTone", icon: <MessageSquare size={18} />, label: t.app.panels.messageTone.title },
    { key: "habits", icon: <Moon size={18} />, label: t.app.panels.habits.title },
  ];

  // Catálogo completo para "✏️ Editar" (botón del mockup original que
  // había quedado fuera de la primera entrega, 9 de noviembre de 2026):
  // la paciente elige hasta 6 de estos para su brújula de Inicio, en vez
  // de los 6 fijos de siempre. Reutiliza `quickNavSections` (misma lista,
  // mismos íconos/etiquetas, que el menú flotante "Ir a...") para no
  // mantener un segundo catálogo de destinos aparte — con 3 agregados
  // sintéticos al principio que no son secciones individuales sino
  // atajos: "todayNextStep" (salta al primer pendiente real de HOY, el
  // mismo que calcula buildTodayItems más abajo — el destino cambia según
  // el día, pero la paciente solo elige "quiero este atajo" una vez) y
  // "herramientasRoot"/"agendaRoot" (saltan a la raíz de esas pestañas,
  // no a una herramienta en particular). No se tocó `quickNavSections` en
  // sí — ese array lo sigue usando tal cual el menú "Ir a..." y el
  // filtro de la cuadrícula de Herramientas (SECTION_TABS) más abajo.
  const COMPASS_POOL = [
    { key: "todayNextStep", icon: <ListChecks size={18} />, label: t.today.compassNextStep },
    { key: "herramientasRoot", icon: <Wrench size={18} />, label: t.appTabs.herramientas },
    { key: "agendaRoot", icon: <CalendarClock size={18} />, label: t.appTabs.agenda },
    // "Mis hábitos de hoy" ya no se puede elegir como planeta (12 nov
    // 2026): tiene su propia pestaña en Inicio y sería repetir lo mismo.
    ...quickNavSections.filter((sec) => sec.key !== "habits"),
  ];
  const DEFAULT_COMPASS_KEYS = ["companion", "insights", "agendaRoot", "mood", "todayNextStep", "herramientasRoot"];

  // Los 6 accesos de la brújula de Inicio (reemplaza a los 4 anteriores —
  // ver nota larga del 9 de noviembre de 2026 más abajo, junto a
  // <QuickAccessCompass>, de dónde sale cada uno).

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
    mindMap: t.app.panels.mindMap.subtitle,
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
    calmBubbles: t.app.panels.calmBubbles.subtitle,
    activeBreak: t.app.panels.activeBreak.subtitle,
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
  // Reinicio diario de hábitos (ver customHabits.js): si lo guardado es de
  // otro "día de hábitos" —o de antes de que existiera este dato— las
  // palomitas arrancan apagadas.
  const habitsFresh = saved.habitsDay === habitDayKey();
  const [habitsDay, setHabitsDay] = useState(() => habitDayKey());
  const [screensOff, setScreensOff] = useState(habitsFresh && saved.screensOff);
  const [sleepEnv, setSleepEnv] = useState(habitsFresh && saved.sleepEnv);
  const [ateWell, setAteWell] = useState(habitsFresh && saved.ateWell);
  const [hydrated, setHydrated] = useState(habitsFresh && saved.hydrated);
  const [deskCleared, setDeskCleared] = useState(habitsFresh && saved.deskCleared);
  const [customHabits, setCustomHabits] = useState(() => {
    const list = normalizeCustomHabits(saved.customHabits);
    return habitsFresh ? list : resetCustomHabits(list);
  });
  const [habitReminders, setHabitReminders] = useState(saved.habitReminders !== false);
  const [habitXpGiven, setHabitXpGiven] = useState(() => (habitsFresh && Array.isArray(saved.habitXpGiven) ? saved.habitXpGiven : []));
  // Con la app abierta al cambiar el día (o al volver a ella al día
  // siguiente): se apagan todas las palomitas.
  useEffect(() => {
    const check = () => {
      const key = habitDayKey();
      if (key === habitsDay) return;
      setHabitsDay(key);
      setScreensOff(false);
      setSleepEnv(false);
      setAteWell(false);
      setHydrated(false);
      setDeskCleared(false);
      setCustomHabits((list) => resetCustomHabits(list));
      setHabitXpGiven([]);
    };
    const id = setInterval(check, 60 * 1000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [habitsDay]);
  const [streak, setStreak] = useState(() => effectiveStreak(saved.streak));
  const [moodLog, setMoodLog] = useState(saved.moodLog);
  const [homeMoodSaved, setHomeMoodSaved] = useState(false);
  const [energyLog, setEnergyLog] = useState(saved.energyLog);
  const [focusSessionLog, setFocusSessionLog] = useState(saved.focusSessionLog);
  // % real de enfoque de hoy (rediseño "estilo K" de Inicio, 9 de noviembre
  // de 2026) — alimenta el anillo de la mascota en QuickAccessCompass.jsx.
  // Cálculo puro y barato (solo suma minutos del día de hoy), se recalcula
  // en cada render sin necesidad de memorizarlo.
  const focusPercent = todayFocusPercent(focusSessionLog);
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

  // Acento personal con candado por puntos (8 de noviembre de 2026, ver
  // UNLOCKABLE_ACCENT_OPTIONS en theme.js y XP_MILESTONES en
  // xpMilestones.js) — declarado aquí, después de `xp`, porque necesita
  // saber cuántos puntos tiene la paciente para decidir si el color
  // guardado en localStorage ya se ganó. Si `accentKey` es uno de los 3
  // colores con candado y todavía no se alcanzan los puntos necesarios, se
  // usa el respaldo de siempre (C.lavender) en vez de aplicar un color que
  // no se ganó — así, guardar (o editar a mano) un valor viejo en
  // localStorage nunca puede mostrar una recompensa todavía no
  // desbloqueada. Los 9 colores libres de siempre (ACCENT_OPTIONS) nunca
  // pasan por este candado.
  const accentLocked =
    accentKey &&
    UNLOCKABLE_ACCENT_OPTIONS.includes(accentKey) &&
    (PLUS_ACCENTS.includes(accentKey) ? !isPlus : !isUnlocked(accentKey, "accent", xp));
  // Mismo candado para el accesorio guardado: uno de la Colección Plus sin
  // Plus, o uno por XP todavía no ganado, no se dibuja.
  const resolvedAccessory = !accessory
    ? DEFAULT_ACCESSORY
    : PLUS_ACCESSORIES.includes(accessory)
    ? isPlus
      ? accessory
      : DEFAULT_ACCESSORY
    : accessory === DEFAULT_ACCESSORY || isUnlocked(accessory, "accessory", xp)
    ? accessory
    : DEFAULT_ACCESSORY;
  const personalAccent = (accentKey && !accentLocked && C[accentKey]) || C.lavender;
  // Mismo candado para la mascota (10 de noviembre de 2026): un personaje
  // nuevo guardado en este dispositivo solo se muestra si ya se tienen los
  // puntos; si no, se usa el de siempre (Ave).
  const chosenSpecies = species || DEFAULT_SPECIES;
  // Las de Plus (isPlusSpecies) dependen de la suscripción, no de los XP.
  // Con Plus, todas las mascotas al instante (las de Plus y también las que
  // las demás ganan con XP) — decisión de la doctora, 10 de noviembre de 2026.
  // Todas las mascotas que no son gratis se ganan con XP, igual con o sin
  // Plus (decisión de la doctora, 10 de noviembre de 2026).
  const speciesLocked =
    (isPlusSpecies(chosenSpecies) && !isPlus) ||
    (isUnlockableSpecies(chosenSpecies) && !isUnlocked(chosenSpecies, "species", xp));
  const resolvedSpecies = speciesLocked ? DEFAULT_SPECIES : chosenSpecies;

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
      customHabits,
      habitsDay,
      habitXpGiven,
      habitReminders,
      streak,
      moodLog,
      energyLog,
      focusSessionLog,
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
    customHabits,
    habitsDay,
    habitXpGiven,
    habitReminders,
    streak,
    moodLog,
    energyLog,
    focusSessionLog,
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
  // 8 de noviembre de 2026: la doctora reportó que "foco acumulado" se
  // presta a confusión (suena a que solo cuenta el tiempo en Modo
  // Enfoque, cuando en realidad sube por ~17 acciones distintas en toda
  // la app). Se le agregó una explicación a esto en el paso 5 del
  // recorrido de bienvenida interactivo (OnboardingTour.jsx), pero ese
  // recorrido solo se muestra UNA vez por dispositivo — quien ya lo vio
  // (o cerró la pestaña antes de llegar a ese paso) no tenía forma de
  // volver a consultarlo. Este ícono de información es independiente del
  // recorrido: cualquier paciente puede tocarlo cuantas veces quiera.
  const [xpInfoOpen, setXpInfoOpen] = useState(false);
  useEffect(() => {
    if (!xpInfoOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setXpInfoOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [xpInfoOpen]);

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

  // Desbloqueos por puntos (8 de noviembre de 2026, ver XP_MILESTONES en
  // xpMilestones.js) — `prevXpRef` guarda el valor de `xp` del render
  // anterior para poder detectar el momento EXACTO en que se cruza un
  // umbral (no solo "ya está arriba de"), comparándolo cada vez que `xp`
  // cambia. Se hace en un efecto separado de grantXp (en vez de dentro de
  // su setXp) para no tener que agregar `xp` a las dependencias de
  // grantXp ni volver a crearlo en cada punto ganado. Al montar, el ref
  // arranca con el mismo valor que `xp` ya tiene (el guardado), así que si
  // la paciente ya había cruzado un umbral antes (en otra sesión) no se
  // vuelve a festejar al recargar la página.
  const prevXpRef = useRef(xp);
  const [unlockQueue, setUnlockQueue] = useState([]);
  useEffect(() => {
    const prev = prevXpRef.current;
    if (xp > prev) {
      const crossed = justCrossedMilestones(prev, xp);
      if (crossed.length > 0) setUnlockQueue((q) => [...q, ...crossed]);
    }
    prevXpRef.current = xp;
  }, [xp]);
  // Desbloqueo que se muestra ahora mismo en el modal de celebración (el
  // primero de la cola) — si se cruzan dos umbrales de un solo golpe de XP
  // (no debería pasar con +0.85 por acción, pero por si acaso), se
  // festejan uno por uno en vez de encimados.
  const activeUnlock = unlockQueue[0] || null;
  const dismissUnlock = useCallback(() => {
    setUnlockQueue((q) => q.slice(1));
  }, []);
  useEffect(() => {
    if (!activeUnlock) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") dismissUnlock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeUnlock, dismissUnlock]);

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

  // Sonidito corto al tocar una carita de ánimo (Web Audio API).
  const playMoodSound = useCallback((mood) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Frecuencias: de grave (triste) a agudo (feliz)
      const freqs = { 1: [260], 2: [330], 3: [392], 4: [440, 554], 5: [523, 659, 784] };
      const notes = freqs[mood] || [392];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
      setTimeout(() => ctx.close(), 800);
    } catch (_) { /* silenciar si el navegador no soporta Web Audio */ }
  }, []);

  // Guarda ánimo desde la tarjeta compacta de Inicio (sin nota).
  const handleHomeMoodSave = useCallback(
    (mood) => {
      playMoodSound(mood);
      handleMoodSave(mood, "");
      setHomeMoodSaved(true);
      setTimeout(() => setHomeMoodSaved(false), 1800);
    },
    [handleMoodSave, playMoodSound]
  );

  const handleEnergySave = useCallback(
    (level) => {
      setEnergyLog((prev) => recordEnergy(prev, level));
      grantXp(t.app.xpLabels.energyLogged);
    },
    [grantXp, t]
  );

  // `wake`: hora de despertar (opcional, "" la borra) — ver sleepLog.js.
  // Los XP se dan solo la primera vez del día; corregir la hora después ya
  // no vuelve a dar puntos.
  const handleRecordBedtime = useCallback(
    (time, wake) => {
      const firstToday = !todayBedtime(sleepLog);
      setSleepLog((prev) => recordBedtime(prev, time, new Date(), wake));
      if (firstToday) grantXp(t.app.xpLabels.bedtimeLogged);
    },
    [grantXp, t, sleepLog]
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

  // ---- Alarma activa de medicamentos (Fase 4, función #5 — 31 de octubre
  // de 2026, inspirada en Alarmy, gratis: "ok está bien" confirmó la
  // doctora, con la propuesta de que fuera gratis por ser seguridad
  // clínica y no un extra de conveniencia) ----
  //
  // Honestidad igual que el bloqueador de distracciones de Modo Enfoque:
  // esto SOLO funciona mientras la pestaña de la app está abierta — reusa
  // el push normal (api/send-reminders.js) como respaldo pasivo para
  // cuando la app está cerrada, no lo reemplaza ni finge hacer lo que no
  // puede. Mientras la pestaña está abierta, revisa cada 20s si alguna
  // dosis de hoy ya se cumplió y no se ha marcado como tomada — si pasaron
  // entre 0 y 240 minutos desde su horario, dispara la alarma de pantalla
  // completa (MedicationAlarm.jsx). Posponer solo espera 5 minutos y vuelve
  // a sonar — a propósito no hay botón de "ignorar para siempre": eso es
  // justo lo que la vuelve "activa" y no un aviso pasivo más.
  const [activeMedicationAlarm, setActiveMedicationAlarm] = useState(null); // {medicationId, medicationName, time} | null
  const medicationSnoozeRef = useRef({}); // { "medId-time": timestampMs hasta cuándo callar }

  useEffect(() => {
    const checkMedicationAlarms = () => {
      if (activeMedicationAlarm) return; // una a la vez
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      for (const d of todayDoses(medications)) {
        if (doseTaken(medicationDoseLog, d.medicationId, d.time, now)) continue;
        const [dh, dm] = d.time.split(":").map(Number);
        const doseMinutes = dh * 60 + dm;
        const minutesSince = nowMinutes - doseMinutes;
        if (minutesSince < 0 || minutesSince > 240) continue; // todavía no toca, o ya pasó demasiado tiempo (más de 4h) — seguir insistiendo a esas alturas ya no ayuda
        const key = `${d.medicationId}-${d.time}`;
        const snoozeUntil = medicationSnoozeRef.current[key];
        if (snoozeUntil && Date.now() < snoozeUntil) continue;
        setActiveMedicationAlarm({ medicationId: d.medicationId, medicationName: d.medicationName, time: d.time });
        break;
      }
    };
    checkMedicationAlarms();
    const interval = setInterval(checkMedicationAlarms, 20000);
    return () => clearInterval(interval);
  }, [medications, medicationDoseLog, activeMedicationAlarm]);

  const handleMedicationAlarmTaken = () => {
    if (!activeMedicationAlarm) return;
    handleLogDose(activeMedicationAlarm.medicationId, activeMedicationAlarm.time, "");
    setActiveMedicationAlarm(null);
  };
  const handleMedicationAlarmSnooze = () => {
    if (!activeMedicationAlarm) return;
    const key = `${activeMedicationAlarm.medicationId}-${activeMedicationAlarm.time}`;
    medicationSnoozeRef.current[key] = Date.now() + 5 * 60 * 1000;
    setActiveMedicationAlarm(null);
  };

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
  const handleAddQuickNote = useCallback((text, photoPath = null) => {
    setQuickNotes((prev) => addQuickNote(prev, text, new Date(), photoPath));
  }, []);

  const handleResolveQuickNote = useCallback((id) => {
    setQuickNotes((prev) => resolveQuickNote(prev, id));
  }, []);

  const handleRemoveQuickNote = useCallback((id) => {
    setQuickNotes((prev) => removeQuickNote(prev, id));
  }, []);

  // "Recordarme en..." (8 de noviembre de 2026) — decisión explícita de la
  // doctora: solo opciones fijas ("mañana"/"en3dias"/"en1semana"), nunca un
  // selector de fecha/hora libre. `preset` llega tal cual desde el botón que
  // tocó la persona (ver CaptureHubPanel.jsx); pasar `null` quita el
  // recordatorio. El cálculo de la fecha en sí vive en quickCapture.js
  // (reminderDateKeyFromPreset), no aquí, para que sea la misma función pura
  // que el cron de api/send-reminders.js pueda usar/probar por su cuenta.
  const handleSetQuickNoteReminder = useCallback((id, preset) => {
    setQuickNotes((prev) =>
      setQuickNoteReminder(prev, id, preset ? reminderDateKeyFromPreset(preset, new Date()) : null)
    );
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

  // Extraído de addStep (31 de octubre de 2026, función #4 — mapa mental)
  // para que "Convertir en paso" del mapa mental use exactamente la misma
  // lógica que ya tenía el botón "Añadir" de abajo (mismo tope de 5 pasos,
  // misma forma del objeto, mismo agendado en calendario) en vez de
  // duplicarla. Devuelve true si el paso se agregó, false si no (lista ya
  // llena o texto vacío) — para que quien llame pueda decidir qué hacer
  // (ej. mostrar un aviso) sin tener que repetir la validación.
  const addStepFromText = (text, min = 5, energy = null) => {
    const trimmed = (text || "").trim();
    if (!trimmed || steps.length >= 5) return false;
    const newStep = { id: Date.now(), text: trimmed, min, done: false, energy: energy || null };
    const offsetMin = steps.reduce((sum, s) => sum + (s.min || 0), 0);
    scheduleStepsOnCalendar(userId, [newStep], { startOffsetMinutes: offsetMin, kind: "step" });
    setSteps((p) => [...p, newStep]);
    return true;
  };
  const addStep = () => {
    if (addStepFromText(stepDraft, stepMin, stepEnergy || null)) {
      setStepDraft("");
      setStepMin(5);
      setStepEnergy("");
    }
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
  // Acomodar los pasos jalándolos (10 de noviembre de 2026) — ver
  // ReorderHandle.jsx. Mueve el paso `id` al lugar `to` de la lista.
  const moveStep = (id, to) =>
    setSteps((p) => {
      const from = p.findIndex((s) => s.id === id);
      if (from < 0) return p;
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
      return next;
    });

  // Fase 4, función #3 (31 de octubre de 2026 — tablero tipo Kanban,
  // gratis, decisión confirmada con la doctora: "AH GRATIS"): "list" |
  // "board", solo decide cuál vista se dibuja debajo — ambas leen/escriben
  // el mismo arreglo `steps` de arriba, así que no hace falta persistirlo
  // (los pasos del desglosador tampoco persisten entre sesiones).
  const [desglosadorView, setDesglosadorView] = useState("list");

  // ---- Mapa mental (Fase 4, función #4 — 31 de octubre de 2026, inspirada
  // en MindNode, gratis según lo confirmado con la doctora) ----
  // Pensado como el paso ANTERIOR al desglosador: soltar ideas sueltas sin
  // compromiso de orden, y solo cuando una ya convence, mandarla al
  // desglosador con addStepFromText (arriba) — mismo tope de 5 pasos,
  // mismo dato, nada nuevo que sincronizar. Comparte `bigTask`/`setBigTask`
  // con el desglosador a propósito: es el mismo "de qué tarea estamos
  // hablando" en las dos herramientas. Igual que `steps`, no persiste entre
  // sesiones (es una libreta de ideas de un solo uso, no un historial).
  const [mindMapIdeas, setMindMapIdeas] = useState([]);
  const [ideaDraft, setIdeaDraft] = useState("");
  const addIdea = () => {
    const trimmed = ideaDraft.trim();
    if (!trimmed || mindMapIdeas.length >= 12) return;
    setMindMapIdeas((p) => [...p, { id: Date.now(), text: trimmed }]);
    setIdeaDraft("");
  };
  const removeIdea = (id) => setMindMapIdeas((p) => p.filter((i) => i.id !== id));
  const [ideaToStepMsg, setIdeaToStepMsg] = useState("");
  const ideaToStepMsgTimeout = useRef(null);
  const convertIdeaToStep = (idea) => {
    const added = addStepFromText(idea.text, 5, null);
    if (added) {
      removeIdea(idea.id);
      setIdeaToStepMsg(t.app.mindMap.convertedNotice(idea.text));
    } else {
      setIdeaToStepMsg(t.app.dismantler.maxStepsNotice);
    }
    if (ideaToStepMsgTimeout.current) clearTimeout(ideaToStepMsgTimeout.current);
    ideaToStepMsgTimeout.current = setTimeout(() => setIdeaToStepMsg(""), 3500);
  };
  useEffect(() => () => ideaToStepMsgTimeout.current && clearTimeout(ideaToStepMsgTimeout.current), []);

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

  // ---- Pausa activa: ahora es su propia herramienta (ActiveBreak.jsx).
  // `activeBreakStart` cambia (Date.now()) cuando se abre desde el aviso de
  // Modo enfoque, para que arranque sola. `breakPrompt`: el aviso
  // "¿Te mueves 5 minutos?" que aparece al terminar una sesión de enfoque.
  const [activeBreakStart, setActiveBreakStart] = useState(0);
  const [breakPrompt, setBreakPrompt] = useState(false);
  // "＋ Agregar un hábito mío" desde la franja de Inicio: abre "Mis hábitos
  // de hoy" con el formulario ya abierto (ver HabitsList.jsx).
  const [habitAddSignal, setHabitAddSignal] = useState(0);
  const [habitFormOpen, setHabitFormOpen] = useState(false);
  const [breakInProgress, setBreakInProgress] = useState(false);
  const openAddHabit = () => {
    setHabitAddSignal(Date.now());
    scrollToCompanionSection("habits");
  };

  // Palomear un hábito. Los XP se dan UNA vez por hábito por día
  // (`habitXpGiven`): antes, marcar y desmarcar el mismo hábito daba XP
  // cada vez. `key` identifica al hábito (los propios usan su id).
  const toggleXp = (setter, current, label, key) => {
    const next = !current;
    setter(next);
    if (next) grantHabitXp(key || label, label);
  };
  const grantHabitXp = (key, label) => {
    if (habitXpGiven.includes(key)) return;
    setHabitXpGiven((prev) => [...prev, key]);
    grantXp(label);
  };

  // Los hábitos del día — los mismos en "Mis hábitos de hoy" (Herramientas)
  // y en la franja de Inicio (TodayHabitsStrip.jsx): los 4 fijos y luego
  // los que la paciente agregó (máximo 3, ver customHabits.js).
  const habitItems = [
    { key: "screensOff", hint: t.habitsInfo.items.screensOff.what, emoji: "📵", short: t.todayStrip.short.screensOff, label: t.app.habits.screensOff, checked: screensOff, onToggle: () => toggleXp(setScreensOff, screensOff, t.app.xpLabels.screensOffLabel, "screensOff") },
    { key: "sleepEnv", hint: t.habitsInfo.items.sleepEnv.what, emoji: "🛏️", short: t.todayStrip.short.sleepEnv, label: t.app.habits.sleepEnvReady, checked: sleepEnv, onToggle: () => toggleXp(setSleepEnv, sleepEnv, t.app.xpLabels.sleepEnvLabel, "sleepEnv") },
    { key: "ateWell", hint: t.habitsInfo.items.ateWell.what, emoji: "🥗", short: t.todayStrip.short.ateWell, label: t.app.habits.ateWell, checked: ateWell, onToggle: () => toggleXp(setAteWell, ateWell, t.app.xpLabels.ateWellLabel, "ateWell") },
    { key: "hydrated", hint: t.habitsInfo.items.hydrated.what, emoji: "💧", short: t.todayStrip.short.hydrated, label: t.app.habits.hydrated, checked: hydrated, onToggle: () => toggleXp(setHydrated, hydrated, t.app.xpLabels.hydratedLabel, "hydrated") },
    ...customHabits.map((ch) => ({
      key: `custom-${ch.id}`,
      id: ch.id,
      custom: true,
      emoji: ch.emoji,
      short: ch.label,
      label: ch.label,
      checked: ch.done,
      onToggle: () => {
        setCustomHabits((list) => toggleCustomHabit(list, ch.id));
        if (!ch.done) grantHabitXp(`custom-${ch.id}`, t.app.xpLabels.customHabitDone(ch.label));
      },
    })),
  ];

  // ---- Hora de dormir ----
  const todayBedtimeEntry = todayBedtime(sleepLog);
  // Los dos campos arrancan con lo ya guardado hoy (si hay), para poder
  // corregir una hora sin volver a escribir la otra.
  const [bedtimeInput, setBedtimeInput] = useState(() => todayBedtimeEntry?.time || "");
  const [wakeInput, setWakeInput] = useState(() => todayBedtimeEntry?.wake || "");
  const [sleepSaved, setSleepSaved] = useState(false);
  const saveBedtime = () => {
    if (!bedtimeInput) return;
    handleRecordBedtime(bedtimeInput, wakeInput);
    setSleepSaved(true);
  };
  const sleepMinutesToday = sleepDurationMinutes(todayBedtimeEntry);

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
        // border-box: sin esto el minHeight de 100vh se sumaba al padding
        // de arriba/abajo y la página siempre medía un poco más que la
        // pantalla — en Inicio (que ahora es solo la brújula) eso dejaba
        // bajar unos píxeles a un espacio vacío.
        boxSizing: "border-box",
        // Fase 2 (navegación): en móvil AppTabBar queda fija abajo (~60px +
        // el borde de seguridad del notch) y QuickNavMenu se sube encima de
        // ella (ver bottomOffset más abajo) — el padding inferior crece
        // para que el último panel de cada pestaña no quede tapado detrás
        // de ninguna de las dos. En escritorio AppTabBar es una fila normal
        // (no fija), así que el padding se queda como estaba.
        // En la brújula de Inicio no hay nada debajo: el padding de abajo
        // se reduce a lo justo (en teléfono, el alto de la barra fija) para
        // que la pantalla no se pueda bajar a un espacio vacío.
        padding: isNarrow
          ? `28px 18px ${inicioCompass ? 64 : 160}px`
          : `28px 18px ${inicioCompass ? 0 : 70}px`,
      }}
    >
      {/* Recorrido de bienvenida, solo la primera vez — se renderiza
          siempre (no depende de activeTab), y él solo decide si se
          muestra o no según localStorage (ver OnboardingTour.jsx). Se le
          pasa scrollToCompanionSection como onNavigate para que sus pasos
          de "spotlight" puedan cambiar de pestaña/herramienta (ej. abrir
          Modo Enfoque) reutilizando la misma navegación que ya usan el
          menú "Ir a..." y los atajos — no una ruta paralela. */}
      <OnboardingTour C={C} t={t} accent={personalAccent} onNavigate={scrollToCompanionSection} />
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* id usado por el recorrido de bienvenida (OnboardingTour.jsx) para
            señalar la mascota con un spotlight — sigue apuntando aquí, solo
            que ahora envuelve a toda la brújula en vez de a una tarjeta
            aparte (ver nota del 9 de noviembre más abajo). */}
        {/* 9 de noviembre de 2026 — reconstrucción fiel al mockup "Opción K"
            (la doctora señaló, con los mockups originales en mano, que el
            diseño aprobado era UNA sola pieza circular: mascota + anillo de
            "% de enfoque de hoy" + accesos rápidos girando alrededor — no
            una tarjeta de mascota más un adorno de accesos aparte, que fue
            el problema que reportó como "se ven dos mascotas"). Por eso ya
            no hay una <Mascot> aparte aquí: vive DENTRO de
            QuickAccessCompass.jsx (en su centro), que es ahora el único
            lugar de toda la pantalla donde se dibuja la mascota. El % del
            anillo es real (todayFocusPercent(focusSessionLog), calculado
            arriba) — no un número inventado ni el progreso de racha
            reciclado.

            Segunda corrección, el mismo 9 de noviembre: la doctora reenvió
            los 3 mockups originales completos y los accesos reales eran 6
            (no los 4 que se habían reconstruido antes), cada uno saliendo
            de un dato real distinto:
              - Próximo paso: el primer pendiente real de buildTodayItems()
                (el mismo motor que ya usa <TodayPanel>) — si no hay nada
                pendiente, apunta a la sección "Hoy", que ya sabe mostrar
                "no tienes nada pendiente" en vez de inventar una tarea.
              - Herramientas / Agenda: saltan a la raíz de esas pestañas
                (no a una herramienta en particular).
              - Compañero / Ánimo: los de siempre (scrollToCompanionSection).
              - Racha · puntos: streak.current y xp, ambos ya reales y
                persistidos — salta a Insights (Progreso), donde viven esos
                mismos números en detalle.
            El mockup también mostraba "Agenda · 4pm" con una hora fija —
            aquí se calculó de verdad (el siguiente bloque de la agenda de
            HOY que todavía no pasó); si no queda ninguno, se muestra solo
            "Agenda" sin hora inventada. */}
        {(() => {
          const now = new Date();
          const period = timeOfDayPeriod(now);
          // Tema con diseño de la Colección Plus (galaxia, cielo...): su
          // fondo y sus colores de texto reemplazan a los automáticos por
          // hora (10 de noviembre de 2026).
          const plusTheme = !accentLocked ? PLUS_THEMES[accentKey] : null;
          const palette = plusTheme
            ? {
                ...timeOfDayPalette(now),
                bg: plusTheme.haloBg,
                text: plusTheme.text,
                textMuted: plusTheme.textMuted,
                circleFilter: undefined,
                // Pastilla detrás de cada texto (etiquetas de la brújula,
                // saludo, pie): el color base del tema casi opaco, para que
                // las letras se lean sobre cualquier dibujo.
                chipBg: `color-mix(in srgb, ${plusTheme.haloBg} 86%, transparent)`,
              }
            : timeOfDayPalette(now);
          const todayItems = buildTodayItems({
            steps,
            moodLog,
            energyLog,
            medications,
            medicationDoseLog,
            payments,
            paymentPaidLog,
            cbtProgram,
            habits: { screensOff, sleepEnv, ateWell, hydrated, deskCleared, custom: customHabits },
            quickNotes,
            routines,
            now,
            t,
          });
          const nextStepTarget = todayItems[0]?.sectionRef || "today";
          // Cómo va el día, para que la mascota reaccione (10 de noviembre
          // de 2026, "más interactiva"): de noche descansa; si hoy ya ganó
          // algún punto (cada entrada del frasco guarda la hora en su id)
          // está contenta; si ya es de día y todavía nada, un globito
          // amable de vez en cuando. Nunca regaña.
          const hourNow = now.getHours();
          const didSomethingToday = jar.some((j) => {
            const d = new Date(j.id);
            return d.toDateString() === now.toDateString();
          });
          const dayMood =
            hourNow >= 22 || hourNow < 6 ? "night" : didSomethingToday ? "good" : hourNow >= 10 ? "quiet" : "neutral";
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const nextBlock = scheduleBlocksForDay(scheduleBlocks, now).find((b) => b.startMin > nowMinutes) || null;
          const agendaLabel = nextBlock
            ? `${t.appTabs.agenda} · ${formatMinutesAsTime(nextBlock.startMin)}`
            : t.appTabs.agenda;

          // `variant`/orden (9 de noviembre de 2026, TERCERA corrección de
          // fidelidad — la doctora mandó una foto nítida de los 3 mockups
          // completos y se ve claro que: (a) el orden empieza en "Compañero"
          // arriba, no en "Próximo paso"; (b) la rueda usa UN SOLO color
          // (el acento) en los 6, nunca el acento2 — acento2 es solo para el
          // aviso de "próxima actividad" arriba del saludo. Solo 2 de los 6
          // llevan relleno sólido y los otros 4 van con aro blanco + borde
          // de color — ANTES eso dependía de CUÁL acceso era (Próximo paso/
          // Herramientas siempre sólidos); ahora que los 6 son editables
          // (ver COMPASS_POOL/compassKeys más arriba), el relleno sólido se
          // decide por POSICIÓN en la rueda (índices 4 y 5 — abajo-izquierda
          // y arriba-izquierda en ORBIT_ANCHORS de QuickAccessCompass.jsx,
          // que son los del mockup con relleno sólido), no por identidad del
          // acceso — así cualquier combinación que elija la paciente
          // mantiene el mismo patrón visual 2 sólidos / 4 aro.
          //
          // `effectiveKeys`: lo elegido por la paciente (compassKeys,
          // guardado en localStorage por CompassEditSheet) o los 6 de
          // siempre si todavía no eligió nada. Cada key se resuelve contra
          // COMPASS_POOL para ícono/etiqueta — con 2 excepciones que
          // necesitan un dato que cambia en vivo y no puede vivir en el
          // catálogo estático: "todayNextStep" (apunta al primer pendiente
          // REAL de hoy, calculado arriba con buildTodayItems — ver nota
          // larga más abajo de dónde sale) e "insights" (muestra la racha y
          // los puntos reales de hoy en vez de la etiqueta genérica
          // "Progreso" del catálogo).
          // Si alguien ya tenía "habits" como planeta (antes de que tuviera
          // su pestaña), se sustituye por el primer acceso de siempre que
          // no esté ya en su brújula, para no dejarle un hueco.
          const rawKeys = compassKeys || DEFAULT_COMPASS_KEYS;
          const habitsReplacement = [...DEFAULT_COMPASS_KEYS, ...COMPASS_POOL.map((c) => c.key)].find((k) => !rawKeys.includes(k));
          const effectiveKeys = rawKeys.includes("habits")
            ? rawKeys.map((k) => (k === "habits" ? habitsReplacement : k)).filter(Boolean)
            : rawKeys;
          const compassItems = effectiveKeys.map((key, i) => {
            const variant = i >= 4 ? "accent-solid" : "accent-outline";
            if (key === "todayNextStep") {
              // key propia ("todayNextStep") en vez de `nextStepTarget`
              // (10 de noviembre de 2026): el próximo paso puede ser
              // justamente "mood" o "insights", y entonces 2 accesos de la
              // brújula tenían la MISMA key — React mezclaba los 2 y uno se
              // quedaba atorado en el centro, encima de la mascota. El
              // destino real se resuelve al tocarlo (handleCompassSelect).
              return { key: "todayNextStep", icon: <ListChecks size={18} />, label: t.today.compassNextStep, variant };
            }
            if (key === "insights") {
              return {
                key: "insights",
                icon: <Flame size={18} />,
                // Redondeado (10 de noviembre de 2026): los puntos se suman de a
                // 0.85, así que `xp` puede traer decimales ("41.65 pts") — en
                // un acceso tan chico de la brújula se lee mejor el entero; el
                // valor exacto con 2 decimales se sigue viendo en el panel de
                // puntos de siempre.
                label: `${streak.current} ${t.mascot.dayWord(streak.current)} · ${Math.round(xp)} ${t.today.pointsAbbrev}`,
                variant,
              };
            }
            if (key === "agendaRoot") {
              return { key: "agendaRoot", icon: <CalendarClock size={18} />, label: agendaLabel, variant };
            }
            // "companion"/"mood": corregido el mismo día — al agregar el
            // catálogo editable se me había olvidado que estos 2 YA tenían
            // una presentación más corta y específica para la brújula
            // (ver tercera corrección de fidelidad más arriba: ícono de
            // burbuja de chat para Compañero, etiqueta corta "Ánimo") que
            // NO es la misma que su título genérico en `quickNavSections`
            // ("Compañero de apoyo" con ícono de manos, "Registro de
            // ánimo") — sin este caso especial, elegirlos desde "Editar"
            // los mostraba con el ícono/etiqueta larga del panel en vez de
            // la versión corta pensada para la brújula.
            if (key === "companion") {
              return { key: "companion", icon: <MessageCircle size={18} />, label: t.today.compassCompanionLabel, variant };
            }
            if (key === "mood") {
              return { key: "mood", icon: <Smile size={18} />, label: t.today.compassMoodLabel, variant };
            }
            const poolItem = COMPASS_POOL.find((p) => p.key === key);
            if (!poolItem) return null; // clave guardada que ya no existe (ej. sección renombrada) — se omite en vez de romper
            return { ...poolItem, variant };
          }).filter(Boolean);

          const handleCompassSelect = (key) => {
            if (key === "todayNextStep") {
              scrollToCompanionSection(nextStepTarget);
              return;
            }
            if (key === "herramientasRoot") {
              setActiveTool(null);
              if (activeTab !== "herramientas") setActiveTab("herramientas");
              return;
            }
            if (key === "agendaRoot") {
              if (activeTab !== "agenda") setActiveTab("agenda");
              return;
            }
            scrollToCompanionSection(key);
          };

          return (
            <div
              style={{
                background: plusTheme ? plusTheme.background : timeOfDayBackground(period),
                // 9 de noviembre de 2026, QUINTA corrección de fidelidad —
                // la cuarta corrección solo sangraba hasta el borde de la
                // columna de 1000px en escritorio (seguía habiendo un
                // margen gris a los lados en pantallas anchas, y se quedaba
                // corta de alto); la doctora pidió explícitamente que en
                // escritorio también se vea "en grande". Ahora sangra hasta
                // el borde REAL de la ventana en cualquier ancho —no solo
                // el de la columna de 1000px— con el truco estándar de
                // "romper" un contenedor centrado (`100vw` + margen
                // izquierdo `calc(50% - 50vw)`): no depende de cuánto
                // padding tenga el contenedor por fuera, a diferencia de
                // los márgenes negativos de -18px que eran la versión
                // anterior. Alto: ya no se exceptúa escritorio, el mismo
                // calc(100vh - 64px) aplica siempre (los 64px son el alto
                // fijo de AppTabBar en móvil nomás — en escritorio esos
                // 64px de más no importan, sigue viéndose a pantalla
                // completa igual).
                marginLeft: "calc(50% - 50vw)",
                marginRight: "calc(50% - 50vw)",
                width: "100vw",
                borderRadius: "0px",
                marginBottom: 0,
                // -28px: cancela el padding superior de toda la página para
                // que la brújula quede pegada al borde de arriba de la
                // pantalla, sin franja antes.
                marginTop: "-28px",
                overflow: "hidden",
                // Teléfono: toda la pantalla menos la barra de pestañas fija
                // de abajo (64px). Escritorio: toda la pantalla (la barra va
                // adentro, ver tabBarInHero).
                minHeight: isNarrow ? "calc(100vh - 64px)" : "100vh",
                // Solo en Inicio (ver la nota junto a <AppTabBar> arriba).
                // display:none en vez de no montarla: igual que el resto de
                // las pestañas, así nada se reinicia al ir y volver.
                display: inicioCompass ? "flex" : "none",
                flexDirection: "column",
              }}
            >
              <HomeHeader
                C={C}
                t={t}
                palette={palette}
                period={period}
                nextBlock={nextBlock}
                nowMinutes={nowMinutes}
                onEditClick={() => setCompassEditOpen(true)}
              />
              {compassEditOpen && (
                <CompassEditSheet
                  C={C}
                  t={t}
                  accent={personalAccent}
                  pool={COMPASS_POOL}
                  selectedKeys={effectiveKeys}
                  defaultKeys={DEFAULT_COMPASS_KEYS}
                  onClose={() => setCompassEditOpen(false)}
                  onSave={(keys) => {
                    setCompassKeys(keys);
                    storeCompassSelection(keys);
                    setCompassEditOpen(false);
                  }}
                />
              )}
              {/* `flex: 1` + `justifyContent: "center"` (igual, cuarta
                  corrección): con el fondo ahora ocupando toda la
                  pantalla, la brújula se centra sola en el espacio que
                  sobra debajo del saludo — igual que en el mockup, en vez
                  de quedar pegada arriba con un hueco vacío abajo. */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
                {/* Computadora: la franja de hábitos va a la derecha de la
                    brújula, centrada a lo alto (ver TodayHabitsStrip.jsx).
                    El envoltorio no recibe clics; solo la tarjeta. */}
                {isWide && (
                  <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, display: "flex", alignItems: "center", pointerEvents: "none", zIndex: 3 }}>
                    <div style={{ pointerEvents: "auto" }}>
                      <TodayHabitsStrip
                        C={C}
                        t={t}
                        palette={palette}
                        items={habitItems}
                        deskCleared={deskCleared}
                        side
                        onDesk={() => scrollToCompanionSection("focusMode")}
                        onBreak={() => scrollToCompanionSection("activeBreak")}
                        onAddHabit={canAddCustomHabit(customHabits) ? openAddHabit : undefined}
                        onOpenAll={() => scrollToCompanionSection("habits")}
                      />
                    </div>
                  </div>
                )}
                <div id="anro-tour-mascot" style={{ marginTop: "8px", paddingBottom: isNarrow && isShort ? "2px" : "20px" }}>
                <QuickAccessCompass
                  C={C}
                  t={t}
                  // 9 de noviembre de 2026 — tercera pasada: se había
                  // probado acá con el acento/acento2 de la PALETA
                  // automática por hora (para calcar el color fijo del
                  // mockup en las 3 franjas horarias), pero la doctora
                  // confirmó explícitamente que el color PERSONAL de la
                  // paciente (el mismo que ya manda en todo el resto de
                  // la app — botones, resaltados, el aro de la mascota en
                  // cualquier otro lugar) también debe mandar ACÁ adentro,
                  // sin excepción. Por eso vuelve a ser `personalAccent`
                  // (no `palette.accent`): el dial punteado, los 6 íconos
                  // y el anillo de "% de enfoque" se ven ahora del color
                  // que cada paciente eligió para sí misma, distinto entre
                  // pacientes — ya no un azul-verdoso fijo igual para
                  // todas. Lo que SÍ sigue siendo automático por hora (y
                  // no se tocó) es el FONDO con degradado y el color del
                  // texto (`palette` más abajo) — esa es la única parte
                  // de este rediseño que depende de la hora del día.
                  accent={personalAccent}
                  accent2={personalAccent}
                  items={compassItems}
                  onSelect={handleCompassSelect}
                  streak={streak}
                  species={resolvedSpecies}
                  focusStatus={focusStatus}
                  accessory={resolvedAccessory}
                  focusPercent={focusPercent}
                  palette={palette}
                  xp={xp}
                  dayMood={dayMood}
                  // Planetas en tonos del color que eligió la paciente (o de
                  // colores, si eligió "Sistema solar") — 10 de noviembre de 2026.
                  planetColors={planetColorsFor(accentLocked ? null : accentKey, personalAccent)}
                  // Explicaciones del centro (10 de noviembre de 2026): qué
                  // mide el %, qué son los XP y cuánto falta para el
                  // siguiente premio.
                  focusMinutes={todayFocusMinutes(focusSessionLog)}
                  focusGoal={DAILY_FOCUS_GOAL_MIN}
                  nextUnlock={(() => {
                    const next = [...XP_MILESTONES]
                      .sort((a, b) => a.xp - b.xp)
                      .find((m) => m.xp > xp);
                    if (!next) return null;
                    const names =
                      next.kind === "species"
                        ? t.app.speciesPicker.names
                        : next.kind === "accent"
                        ? t.app.accentPicker.names
                        : t.app.accessoryPicker.names;
                    return { remaining: Math.max(1, Math.ceil(next.xp - xp)), name: names[next.key] || next.key, kind: next.kind };
                  })()}
                  onStartFocus={() => scrollToCompanionSection("focusMode")}
                  isPlus={isPlus}
                  onRequestUpgrade={onRequestUpgrade}
                  // Lleva a Perfil con abierto justo el selector del
                  // siguiente premio (mascota, color o accesorio).
                  onSeeRewards={(kind) => {
                    goToTab("perfil");
                    if (kind === "accent") setAccentPickerOpen(true);
                    else if (kind === "accessory") setAccessoryPickerOpen(true);
                    else setSpeciesPickerOpen(true);
                    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
                  }}
                  onReorder={(keys) => {
                    setCompassKeys(keys);
                    storeCompassSelection(keys);
                  }}
                />
                </div>
              </div>
              {/* Franja "Hoy" (hábitos + despejar + pausa activa), debajo
                  de la mascota — ver TodayHabitsStrip.jsx. */}
              {!isWide && (
                <div style={{ padding: isNarrow ? "0 12px" : "0 18px" }}>
                  <TodayHabitsStrip
                    C={C}
                    t={t}
                    palette={palette}
                    items={habitItems}
                    deskCleared={deskCleared}
                    isNarrow={isNarrow}
                    isShort={isShort}
                    onDesk={() => scrollToCompanionSection("focusMode")}
                    onBreak={() => scrollToCompanionSection("activeBreak")}
                    onAddHabit={canAddCustomHabit(customHabits) ? openAddHabit : undefined}
                    onOpenAll={() => scrollToCompanionSection("habits")}
                  />
                </div>
              )}
              {/* Tarjeta compacta de ánimo: se muestra solo si el
                  usuario NO ha registrado su ánimo hoy. Al tocar una
                  carita se guarda al instante (sin nota) y se muestra
                  una confirmación breve antes de desaparecer.
                  Caritas SVG kawaii animadas (nov 2026). */}
              {(!todayMoodEntry(moodLog) || homeMoodSaved) && (
                <div style={{
                  padding: isNarrow ? "8px 12px 0" : "8px 18px 0",
                  maxWidth: "420px",
                  width: "100%",
                  margin: "0 auto",
                  boxSizing: "border-box",
                }}>
                  {homeMoodSaved ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: `${personalAccent}22`,
                      borderRadius: "14px",
                      padding: "10px 16px",
                      animation: "moodFadeIn .4s ease",
                    }}>
                      <span style={{ fontSize: "18px" }}>✓</span>
                      <span style={{ fontSize: "13px", color: palette.textHi || C.text, fontWeight: 600 }}>
                        {t.moodLog.homeSaved}
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      background: `${palette.textHi || C.text}0a`,
                      borderRadius: "14px",
                      padding: "10px 14px",
                      textAlign: "center",
                    }}>
                      <style>{`
                        @keyframes moodFloat {
                          0%, 100% { transform: translateY(0) rotate(0deg); }
                          25% { transform: translateY(-4px) rotate(-2deg); }
                          50% { transform: translateY(-1px) rotate(0deg); }
                          75% { transform: translateY(-5px) rotate(2deg); }
                        }
                        @keyframes moodFadeIn {
                          from { opacity: 0; transform: scale(.6) translateY(10px); }
                          to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        @keyframes moodPulse {
                          0%, 100% { filter: drop-shadow(0 2px 3px rgba(0,0,0,.12)); }
                          50% { filter: drop-shadow(0 4px 8px rgba(0,0,0,.18)); }
                        }
                        .mood-face-btn { animation: moodFadeIn .4s cubic-bezier(.34,1.56,.64,1) both; }
                        .mood-face-btn:nth-child(1) { animation-delay: .05s; }
                        .mood-face-btn:nth-child(2) { animation-delay: .12s; }
                        .mood-face-btn:nth-child(3) { animation-delay: .19s; }
                        .mood-face-btn:nth-child(4) { animation-delay: .26s; }
                        .mood-face-btn:nth-child(5) { animation-delay: .33s; }
                        .mood-face-btn svg {
                          animation: moodFloat 3s ease-in-out infinite, moodPulse 3s ease-in-out infinite;
                        }
                        .mood-face-btn:nth-child(1) svg { animation-delay: 0s, 0s; }
                        .mood-face-btn:nth-child(2) svg { animation-delay: .3s, .3s; }
                        .mood-face-btn:nth-child(3) svg { animation-delay: .6s, .6s; }
                        .mood-face-btn:nth-child(4) svg { animation-delay: .9s, .9s; }
                        .mood-face-btn:nth-child(5) svg { animation-delay: 1.2s, 1.2s; }
                        .mood-face-btn:hover svg {
                          animation: none;
                          transform: scale(1.25) translateY(-3px);
                          filter: drop-shadow(0 6px 12px rgba(0,0,0,.22));
                        }
                        .mood-face-btn:active svg { transform: scale(.9); }
                      `}</style>
                      <p style={{
                        margin: "0 0 8px",
                        fontSize: "13px",
                        color: palette.textHi || C.text,
                        fontWeight: 600,
                      }}>
                        {t.moodLog.homePrompt}
                      </p>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        {[
                          { v: 1, hi: "#dbeaf5", mid: "#a3c8e0", lo: "#6a9cbd", shadow: "#5888a8", label: t.moodLog.veryBad, face: (id) => <>
                            {/* ojos cerrados tristes */}
                            <path d="M14.5 21c1.8-2 4.5-2 6 0" stroke="#4a7a96" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                            <path d="M29.5 21c1.8-2 4.5-2 6 0" stroke="#4a7a96" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                            {/* cejas tristes */}
                            <path d="M13 16.5c2-1.8 5-1.5 6.5 0" stroke="#4a7a96" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
                            <path d="M30.5 16.5c1.5-1.5 4.5-1.8 6.5 0" stroke="#4a7a96" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
                            {/* boca triste */}
                            <path d="M17 34c3-3.5 13-3.5 16 0" stroke="#4a7a96" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                            {/* lágrima */}
                            <ellipse cx="35.5" cy="25" rx="1.8" ry="2.5" fill={`url(#tear${id})`}/>
                          </>},
                          { v: 2, hi: "#fef1c8", mid: "#f0d478", lo: "#d4ae4a", shadow: "#b8923a", label: t.moodLog.bad, face: (id) => <>
                            {/* ojos preocupados */}
                            <ellipse cx="17.5" cy="22" rx="2.8" ry="3.2" fill="#8a6e20"/>
                            <ellipse cx="17.5" cy="21.3" rx="2.8" ry="2.5" fill="#5c4a15"/>
                            <circle cx="16.5" cy="20.5" r="1" fill="#fff" opacity=".8"/>
                            <ellipse cx="32.5" cy="22" rx="2.8" ry="3.2" fill="#8a6e20"/>
                            <ellipse cx="32.5" cy="21.3" rx="2.8" ry="2.5" fill="#5c4a15"/>
                            <circle cx="31.5" cy="20.5" r="1" fill="#fff" opacity=".8"/>
                            {/* cejas preocupadas */}
                            <path d="M13 17c2-2.2 5.5-1.5 7 .3" stroke="#8a6e20" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                            <path d="M30 17.3c1.5-1.8 5-2.2 7 0" stroke="#8a6e20" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                            {/* boca triste suave */}
                            <path d="M18 34c3-2.5 11-2.5 14 0" stroke="#8a6e20" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                          </>},
                          { v: 3, hi: "#d5f5e5", mid: "#8edcb5", lo: "#5cc08a", shadow: "#3ea06a", label: t.moodLog.regular, face: () => <>
                            {/* ojos neutrales */}
                            <ellipse cx="17.5" cy="22" rx="2.8" ry="3.2" fill="#2d7a55"/>
                            <ellipse cx="17.5" cy="21.3" rx="2.8" ry="2.5" fill="#1e5a3c"/>
                            <circle cx="16.5" cy="20.5" r="1" fill="#fff" opacity=".8"/>
                            <ellipse cx="32.5" cy="22" rx="2.8" ry="3.2" fill="#2d7a55"/>
                            <ellipse cx="32.5" cy="21.3" rx="2.8" ry="2.5" fill="#1e5a3c"/>
                            <circle cx="31.5" cy="20.5" r="1" fill="#fff" opacity=".8"/>
                            {/* boca recta */}
                            <line x1="19" y1="32" x2="31" y2="32" stroke="#2d7a55" strokeWidth="1.8" strokeLinecap="round"/>
                          </>},
                          { v: 4, hi: "#feecd0", mid: "#f5c882", lo: "#e8a445", shadow: "#c8862a", label: t.moodLog.good, face: () => <>
                            {/* ojos felices */}
                            <ellipse cx="17.5" cy="21.5" rx="2.8" ry="3.2" fill="#8a5a18"/>
                            <ellipse cx="17.5" cy="20.8" rx="2.8" ry="2.5" fill="#5c3c10"/>
                            <circle cx="16.5" cy="20" r="1.1" fill="#fff" opacity=".85"/>
                            <ellipse cx="32.5" cy="21.5" rx="2.8" ry="3.2" fill="#8a5a18"/>
                            <ellipse cx="32.5" cy="20.8" rx="2.8" ry="2.5" fill="#5c3c10"/>
                            <circle cx="31.5" cy="20" r="1.1" fill="#fff" opacity=".85"/>
                            {/* sonrisa */}
                            <path d="M17 30c4 5 12 5 16 0" stroke="#8a5a18" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                          </>},
                          { v: 5, hi: "#fde0e8", mid: "#f5a0b8", lo: "#e06888", shadow: "#c04868", label: t.moodLog.veryGood, face: () => <>
                            {/* ojos grandes brillantes */}
                            <ellipse cx="17" cy="21" rx="3.8" ry="4.2" fill="#8a2048"/>
                            <ellipse cx="17" cy="20" rx="3.5" ry="3.2" fill="#5c1530"/>
                            <circle cx="15.5" cy="19" r="1.6" fill="#fff" opacity=".9"/>
                            <circle cx="18.5" cy="21.5" r=".8" fill="#fff" opacity=".6"/>
                            <ellipse cx="33" cy="21" rx="3.8" ry="4.2" fill="#8a2048"/>
                            <ellipse cx="33" cy="20" rx="3.5" ry="3.2" fill="#5c1530"/>
                            <circle cx="31.5" cy="19" r="1.6" fill="#fff" opacity=".9"/>
                            <circle cx="34.5" cy="21.5" r=".8" fill="#fff" opacity=".6"/>
                            {/* sonrisota */}
                            <path d="M15 29c5 7 15 7 20 0" stroke="#8a2048" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                            <path d="M18 32c3.5 2 11 2 14.5 0" stroke="#8a2048" strokeWidth="1" fill="none" strokeLinecap="round"/>
                            {/* rubor */}
                            <circle cx="10" cy="26" r="3.5" fill="#e06888" opacity=".25"/>
                            <circle cx="40" cy="26" r="3.5" fill="#e06888" opacity=".25"/>
                          </>},
                        ].map(({ v, hi, mid, lo, shadow, label, face }) => {
                          const gid = `mf${v}`;
                          return (
                          <button
                            key={v}
                            className="mood-face-btn"
                            onClick={() => handleHomeMoodSave(v)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px",
                              borderRadius: "50%",
                              lineHeight: 0,
                              transition: "transform .15s",
                            }}
                            aria-label={label}
                          >
                            <svg width="50" height="54" viewBox="0 0 50 54" style={{ transition: "transform .15s", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.12))" }}>
                              <defs>
                                <radialGradient id={`bg${gid}`} cx="35%" cy="30%" r="65%">
                                  <stop offset="0%" stopColor={hi}/>
                                  <stop offset="55%" stopColor={mid}/>
                                  <stop offset="100%" stopColor={lo}/>
                                </radialGradient>
                                <radialGradient id={`sh${gid}`} cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor={shadow} stopOpacity=".3"/>
                                  <stop offset="100%" stopColor={shadow} stopOpacity="0"/>
                                </radialGradient>
                                {v === 1 && <linearGradient id={`tear${gid}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#cce8f8"/>
                                  <stop offset="100%" stopColor="#7abade"/>
                                </linearGradient>}
                              </defs>
                              {/* sombra debajo */}
                              <ellipse cx="25" cy="50" rx="16" ry="3" fill={`url(#sh${gid})`}/>
                              {/* esfera 3D */}
                              <circle cx="25" cy="25" r="22" fill={`url(#bg${gid})`}/>
                              {/* brillo superior */}
                              <ellipse cx="19" cy="14" rx="10" ry="6" fill="#fff" opacity=".35"/>
                              <ellipse cx="17" cy="12" rx="5" ry="3" fill="#fff" opacity=".25"/>
                              {/* cara */}
                              {face(gid)}
                            </svg>
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {tabBarInHero && (
                <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "0 18px", boxSizing: "border-box" }}>
                  <AppTabBar C={C} t={t} accent={personalAccent} activeTab={activeTab} onChange={goToTab} isNarrow={isNarrow} />
                </div>
              )}
            </div>
          );
        })()}

        {/* Aviso de instalación y guía de diagnóstico reciente: antes
            salían arriba de todo en todas las pestañas; ahora viven en
            Perfil, para que Inicio sea solo la brújula. */}
        <div style={tabStyle("perfil")}>
          <InstallBanner C={C} t={t} />
          <PostDiagnosisCard C={C} t={t} />
        </div>
        {/* Header */}
        <header
          style={{
            // Oculto en Inicio (brújula y página "Hoy"): ahí la pantalla
            // es solo la mascota. En las otras 4 pestañas sigue igual.
            display: activeTab === "inicio" ? "none" : "flex",
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
          </div>
          {/* flexWrap (10 de noviembre de 2026): en el teléfono esta fila
              (idiomas + puntos + 5 botones) medía ~550px y empujaba toda
              la página hacia los lados (scroll horizontal de ~180px a
              390px de ancho, verificado con Playwright). Ahora baja a un
              segundo renglón cuando no cabe. */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", maxWidth: "100%" }}>
            {/* 10 de noviembre de 2026 ("¿podrías acomodar de otra manera
                esto?"): la fila de 9 botones sueltos (idioma, sonido, tema,
                color, mascota, accesorio, suscripción, salir) se movió a la
                tarjeta "Personaliza tu ANRO" de Perfil, con etiquetas en vez
                de puros íconos. Aquí arriba solo quedan los puntos. */}
            <div
              id="anro-tour-xp"
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
                <div style={{ fontSize: "16px", fontWeight: 600, lineHeight: 1.1 }}>{Math.round(xp)} {t.app.xpUnit}</div>
                <div style={{ fontSize: "11px", color: C.textMuted, display: "flex", alignItems: "center", gap: "3px" }}>
                  {t.app.xpCaption}
                  {/* 8 de noviembre de 2026: ícono de información permanente
                      (no depende del recorrido de bienvenida, que solo se ve
                      una vez) — ver nota en el estado xpInfoOpen arriba. */}
                  <button
                    onClick={() => setXpInfoOpen((v) => !v)}
                    aria-label={t.app.xpInfoLabel}
                    aria-expanded={xpInfoOpen}
                    style={{
                      width: "20px",
                      height: "20px",
                      minWidth: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      color: C.textMuted,
                      cursor: "pointer",
                      padding: 0,
                      // position+zIndex por encima del fondo transparente de
                      // cierre (zIndex 90, ver abajo) — si no, con el
                      // popover abierto el fondo tapa este mismo botón y
                      // tocarlo de nuevo para cerrar (en vez de tocar fuera
                      // o la X) no hacía nada. Detectado con Playwright
                      // antes de entregar.
                      position: "relative",
                      zIndex: 92,
                      borderRadius: "50%",
                    }}
                  >
                    <Info size={13} />
                  </button>
                </div>
              </div>
              {xpInfoOpen && (
                <>
                  {/* Fondo transparente a pantalla completa, solo para
                      detectar el toque afuera y cerrar — mismo patrón que ya
                      usan los modales de la app (OnboardingTour.jsx,
                      MemoriaAnroLauncher.jsx). */}
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 90 }}
                    onMouseDown={() => setXpInfoOpen(false)}
                  />
                  <div
                    role="dialog"
                    aria-label={t.app.xpInfoLabel}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "min(280px, 80vw)",
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: "14px",
                      padding: "14px 16px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                      zIndex: 91,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "13px", color: C.text }}>{t.app.xpInfoLabel}</strong>
                      <button
                        onClick={() => setXpInfoOpen(false)}
                        aria-label={t.common.close}
                        style={{
                          width: "24px",
                          height: "24px",
                          minWidth: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          border: "none",
                          color: C.textMuted,
                          cursor: "pointer",
                          borderRadius: "6px",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: "12.5px", color: C.textMuted, lineHeight: 1.6, margin: 0 }}>{t.app.xpInfoBody}</p>
                  </div>
                </>
              )}
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

        {/* Personaliza tu ANRO (10 de noviembre de 2026) — lo que antes eran
            9 botones de puro ícono en el encabezado, ahora como mosaicos con
            nombre y valor actual ("Mascota · Gato", "Tema · Claro"), solo en
            Perfil. Color y accesorio se eligen en un panel que se abre
            debajo de los mosaicos (no un globito flotante que en el
            teléfono se salía de la pantalla). */}
        {activeTab === "perfil" && (() => {
          const st = t.app.settingsCard;
          const tileStyle = (active) => ({
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            minHeight: "64px",
            padding: "10px 14px",
            borderRadius: "16px",
            border: active ? `2px solid ${personalAccent}` : `1px solid ${C.border}`,
            background: active ? tint(personalAccent, 0.1) : C.surfaceAlt,
            color: C.text,
            cursor: "pointer",
            textAlign: "left",
            position: "relative",
            boxSizing: "border-box",
          });
          const tileIcon = {
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: C.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: C.textMuted,
          };
          const tileText = (label, value) => (
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
            </span>
          );
          const panelStyle = {
            marginTop: "12px",
            padding: "14px",
            borderRadius: "16px",
            border: `1px solid ${C.border}`,
            background: C.surfaceAlt,
          };
          return (
            <section
              aria-label={st.title}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "20px",
                padding: "18px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 14px" }}>{st.title}</h2>
              <div
                style={{
                  display: "grid",
                  // 2 columnas en el teléfono, 3 en pantallas anchas.
                  gridTemplateColumns: isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                {onChangeSpecies && (
                  <button type="button" onClick={() => setSpeciesPickerOpen(true)} style={tileStyle(false)}>
                    <span aria-hidden="true" style={tileIcon}>
                      <MascotArt visual={matureEmoji(resolvedSpecies)} size={34} />
                    </span>
                    {tileText(st.mascot, t.app.speciesPicker.names[resolvedSpecies] || resolvedSpecies)}
                  </button>
                )}
                {onChangeAccent && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccessoryPickerOpen(false);
                      setAccentPickerOpen((prev) => !prev);
                    }}
                    aria-expanded={accentPickerOpen}
                    style={tileStyle(accentPickerOpen)}
                  >
                    <span aria-hidden="true" style={tileIcon}>
                      <span
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background:
                            accentKey === "solar"
                              ? `conic-gradient(${[...SOLAR_PLANETS, SOLAR_PLANETS[0]].join(", ")})`
                              : !accentLocked && PLUS_THEMES[accentKey]
                              ? PLUS_THEMES[accentKey].background
                              : personalAccent,
                          boxShadow: `0 0 0 1px ${C.border}`,
                          display: "block",
                        }}
                      />
                    </span>
                    {tileText(st.color, t.app.accentPicker.names[accentLocked ? "lavender" : accentKey] || t.app.accentPicker.names.lavender)}
                  </button>
                )}
                {onChangeAccessory && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccentPickerOpen(false);
                      setAccessoryPickerOpen((prev) => !prev);
                    }}
                    aria-expanded={accessoryPickerOpen}
                    style={tileStyle(accessoryPickerOpen)}
                  >
                    <span aria-hidden="true" style={{ ...tileIcon, fontSize: "20px" }}>
                      {ACCESSORY_EMOJI[resolvedAccessory] ? ACCESSORY_EMOJI[resolvedAccessory] : <Sparkles size={18} />}
                    </span>
                    {tileText(st.accessory, t.app.accessoryPicker.names[resolvedAccessory])}
                  </button>
                )}
                {onToggleTheme && (
                  <button type="button" onClick={onToggleTheme} style={tileStyle(false)} aria-label={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}>
                    <span aria-hidden="true" style={tileIcon}>
                      {theme === "light" ? <Sun size={18} /> : <Moon size={18} />}
                    </span>
                    {tileText(st.theme, theme === "light" ? st.themeLight : st.themeDark)}
                  </button>
                )}
                <button type="button" onClick={toggleCelebrate} style={tileStyle(false)} aria-label={celebrateOn ? t.app.muteOn : t.app.muteOff}>
                  <span aria-hidden="true" style={tileIcon}>
                    {celebrateOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </span>
                  {tileText(st.sound, celebrateOn ? st.soundOn : st.soundOff)}
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
                {onChangeLanguage && (
                  <div style={{ ...tileStyle(false), cursor: "default" }}>
                    {!isNarrow && (
                      <span aria-hidden="true" style={tileIcon}>
                        <Globe size={18} />
                      </span>
                    )}
                    <span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 600 }}>{st.language}</span>
                      <LanguageSwitcher C={C} lang={lang} onChange={onChangeLanguage} t={t} height="34px" />
                    </span>
                  </div>
                )}
              </div>

              {accentPickerOpen && (
                <div style={panelStyle}>
                  <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "10px" }}>{t.app.accentPicker.prompt}</div>
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
                            background:
                              key === "solar" ? `conic-gradient(${[...SOLAR_PLANETS, SOLAR_PLANETS[0]].join(", ")})` : C[key],
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
                      {/* Colores con candado por puntos (8 de noviembre de
                          2026, ver UNLOCKABLE_ACCENT_OPTIONS en theme.js) —
                          se muestran siempre, incluso bloqueados, para que
                          la paciente sepa que existen y cuánto le falta;
                          nunca se puede tocar uno todavía bloqueado. */}
                      {UNLOCKABLE_ACCENT_OPTIONS.filter((key) => !PLUS_ACCENTS.includes(key)).map((key) => {
                        const plusOnly = PLUS_ACCENTS.includes(key);
                        const unlocked = plusOnly ? isPlus : isUnlocked(key, "accent", xp);
                        const milestone = XP_MILESTONES.find((m) => m.kind === "accent" && m.key === key);
                        const remaining =
                          !unlocked && milestone ? Math.max(1, Math.ceil(milestone.xp - xp)) : null;
                        const lockedLabel = plusOnly
                          ? `${t.app.accentPicker.names[key]} — ${t.upsell.badge}`
                          : remaining != null
                            ? `${t.app.rewardsLockedShort(t.app.accentPicker.names[key])} — ${t.app.rewardsRemaining(remaining)}`
                            : t.app.rewardsLockedShort(t.app.accentPicker.names[key]);
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (!unlocked) {
                                // Colección Plus sin Plus: lleva a los planes.
                                if (plusOnly && onRequestUpgrade) onRequestUpgrade();
                                return;
                              }
                              onChangeAccent(key);
                              setAccentPickerOpen(false);
                            }}
                            disabled={!unlocked && !plusOnly}
                            aria-label={unlocked ? t.app.accentPicker.names[key] : lockedLabel}
                            title={unlocked ? t.app.accentPicker.names[key] : lockedLabel}
                            style={{
                              position: "relative",
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: C[key],
                              opacity: unlocked ? 1 : plusOnly ? 0.6 : 0.35,
                              boxShadow: key === accentKey ? `0 0 0 3px ${C.text}` : `0 0 0 1px ${C.border}`,
                              border: "none",
                              cursor: unlocked || plusOnly ? "pointer" : "not-allowed",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {!unlocked && (plusOnly ? <Sparkles size={13} color="#fff" /> : <Lock size={12} color={C.text} />)}
                          </button>
                        );
                      })}
                    </div>
                  {/* Colección Plus con diseño (galaxia, cielo, aurora...) —
                      muestras grandes con su dibujo, porque un circulito no
                      deja ver las estrellas ni las nubes. Cambian también el
                      fondo de Inicio. Sin Plus, tocar una lleva a los planes. */}
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "13px" }}>{t.app.accentPicker.plusTitle}</strong>
                    <PlusMark C={C} t={t} />
                  </div>
                  <p style={{ margin: "4px 0 10px", fontSize: "12px", color: C.textMuted }}>{t.app.accentPicker.plusHint}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: "10px" }}>
                    {PLUS_ACCENTS.map((key) => {
                      const selected = key === accentKey && !accentLocked;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (!isPlus) {
                              if (onRequestUpgrade) onRequestUpgrade();
                              return;
                            }
                            onChangeAccent(key);
                            setAccentPickerOpen(false);
                          }}
                          aria-label={isPlus ? t.app.accentPicker.names[key] : `${t.app.accentPicker.names[key]} — ${t.upsell.badge}`}
                          aria-pressed={selected}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            padding: 0,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: C.text,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "1 / 1",
                              borderRadius: "16px",
                              background: PLUS_THEMES[key].background,
                              boxShadow: selected ? `0 0 0 3px ${C.text}` : `0 0 0 1px ${C.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {/* Un planetita con los colores del tema encima del fondo */}
                            <span
                              style={{
                                width: "34%",
                                aspectRatio: "1 / 1",
                                borderRadius: "50%",
                                background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 42%), ${PLUS_THEMES[key].planets[0]}`,
                                boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
                              }}
                            />
                            {!isPlus && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "6px",
                                  right: "6px",
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: "rgba(0,0,0,0.45)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Lock size={11} color="#fff" />
                              </span>
                            )}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                            {t.app.accentPicker.names[key]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {accessoryPickerOpen && (
                <div style={panelStyle}>
                  <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "10px" }}>{t.app.accessoryPicker.prompt}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {ACCESSORY_OPTIONS.map((key) => {
                        const selected = key === resolvedAccessory;
                        const plusOnly = PLUS_ACCESSORIES.includes(key);
                        const unlocked = key === "none" || (plusOnly ? isPlus : isUnlocked(key, "accessory", xp));
                        // Puntos que faltan para ESTE accesorio en particular
                        // (no "el siguiente hito cualquiera", que podría ser
                        // un color de acento y confundir la cifra mostrada).
                        const milestone = XP_MILESTONES.find((m) => m.kind === "accessory" && m.key === key);
                        const remaining = !unlocked && milestone ? Math.max(1, Math.ceil(milestone.xp - xp)) : null;
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              if (!unlocked) {
                                if (plusOnly && onRequestUpgrade) onRequestUpgrade();
                                return;
                              }
                              onChangeAccessory(key);
                              setAccessoryPickerOpen(false);
                            }}
                            disabled={!unlocked && !plusOnly}
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
                              cursor: unlocked || plusOnly ? "pointer" : "not-allowed",
                              opacity: unlocked ? 1 : plusOnly ? 0.75 : 0.55,
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
                                fontSize: "20px",
                                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))",
                              }}
                            >
                              {unlocked || plusOnly ? (
                                ACCESSORY_EMOJI[key] || <Sparkles size={18} color={C.textMuted} />
                              ) : (
                                <Lock size={16} color={C.textMuted} />
                              )}
                            </span>
                            <span style={{ fontSize: "10px", color: C.textMuted, textAlign: "center" }}>
                              {t.app.accessoryPicker.names[key]}
                            </span>
                            {plusOnly ? (
                              <PlusMark C={C} t={t} />
                            ) : (
                              !unlocked &&
                              remaining != null && (
                                <span style={{ fontSize: "9px", color: C.textMuted, textAlign: "center" }}>
                                  {t.app.rewardsRemaining(remaining)}
                                </span>
                              )
                            )}
                          </button>
                        );
                      })}
                    </div>
                </div>
              )}
                {speciesPickerOpen && (
                  <SpeciesPickerSheet
                    C={C}
                    t={t}
                    accent={personalAccent}
                    xp={xp}
                    selected={resolvedSpecies}
                    isPlus={isPlus}
                    onRequestUpgrade={onRequestUpgrade}
                    onSelect={onChangeSpecies}
                    onClose={() => setSpeciesPickerOpen(false)}
                  />
                )}

              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "13px", color: C.textMuted, minWidth: 0, overflowWrap: "anywhere" }}>
                  {userEmail ? t.app.sessionOf(userEmail) : t.app.noEmailSubtitle}
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {onManageSubscription && (
                    <button
                      type="button"
                      onClick={onManageSubscription}
                      style={{
                        minHeight: "40px",
                        padding: "0 16px",
                        borderRadius: "12px",
                        border: `1px solid ${C.border}`,
                        background: "transparent",
                        color: C.text,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t.app.mySubscription}
                    </button>
                  )}
                  {onSignOut && (
                    <button
                      type="button"
                      onClick={onSignOut}
                      style={{
                        minHeight: "40px",
                        padding: "0 16px",
                        borderRadius: "12px",
                        border: `1px solid ${C.border}`,
                        background: "transparent",
                        color: C.textMuted,
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <LogOut size={15} /> {t.common.signOut}
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })()}


        {/* Modal de celebración al cruzar un hito de puntos (8 de noviembre
            de 2026, ver XP_MILESTONES en xpMilestones.js) — independiente
            del aviso corto xpMsg (que sale en cada acción): este solo
            aparece el momento exacto en que se cruza un umbral, y se queda
            visible hasta que la paciente lo cierre (no desaparece solo),
            para que el logro se note. Mismo patrón de modal centrado que ya
            usa OnboardingTour.jsx (fondo oscuro + tarjeta al centro). */}
        {activeUnlock && (
          <div
            role="dialog"
            aria-label={t.app.unlockModal.title}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              zIndex: 95,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) dismissUnlock();
            }}
          >
            <div
              style={{
                background: C.surface,
                borderRadius: "20px",
                padding: "28px 24px",
                width: "min(300px, 100%)",
                textAlign: "center",
                boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: tint(personalAccent, 0.18),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  margin: "0 auto 16px",
                }}
              >
                {activeUnlock.kind === "species" ? (
                  <MascotArt visual={matureEmoji(activeUnlock.key)} size={56} />
                ) : activeUnlock.kind === "accessory" ? (
                  ACCESSORY_EMOJI[activeUnlock.key] || <Sparkles size={32} color={personalAccent} />
                ) : (
                  <span
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: C[activeUnlock.key],
                      display: "block",
                      boxShadow: `0 0 0 1px ${C.border}`,
                    }}
                  />
                )}
              </div>
              <strong style={{ display: "block", fontSize: "16px", color: C.text, marginBottom: "6px" }}>
                {t.app.unlockModal.title}
              </strong>
              <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 20px" }}>
                {activeUnlock.kind === "species"
                  ? t.app.unlockModal.speciesBody(t.app.speciesPicker.names[activeUnlock.key])
                  : activeUnlock.kind === "accessory"
                  ? t.app.unlockModal.accessoryBody(t.app.accessoryPicker.names[activeUnlock.key])
                  : t.app.unlockModal.accentBody(t.app.accentPicker.names[activeUnlock.key])}
              </p>
              <button
                onClick={dismissUnlock}
                style={{
                  background: personalAccent,
                  // "#fff" fijo, no C.text — mismo patrón que ya usa el
                  // botón principal de OnboardingTour.jsx para un fondo
                  // sólido del color de acento (que puede ser casi
                  // cualquier color de los 9+3 disponibles).
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.app.unlockModal.button}
              </button>
            </div>
          </div>
        )}

        {activeMedicationAlarm && (
          <MedicationAlarm
            C={C}
            t={t}
            medicationName={activeMedicationAlarm.medicationName}
            time={activeMedicationAlarm.time}
            onTaken={handleMedicationAlarmTaken}
            onSnooze={handleMedicationAlarmSnooze}
          />
        )}

        {/* Fase 2 (navegación, 28 de octubre de 2026): barra de 5 pestañas
            que reemplaza el scroll largo como forma principal de moverse
            por la app — fija abajo en móvil, fila arriba en tablet/
            escritorio (ver AppTabBar.jsx, que decide cuál según isNarrow).
            Cuando es fija abajo, su posición en el JSX no importa para el
            layout (position:fixed).
            10 de noviembre de 2026 ("no me gusta que las herramientas se
            vean abajo"): antes iba DEBAJO de la brújula de Inicio, y la
            brújula se veía en las 5 pestañas. Desde que la brújula ocupa
            casi toda la pantalla, en escritorio eso dejaba la barra de
            pestañas y el contenido de Agenda/Herramientas/Progreso/Perfil
            una pantalla entera más abajo — había que bajar cada vez para
            llegar. Ahora la brújula solo se ve en Inicio (ver `display` en
            su contenedor).
            Mismo día, después ("lo primero que quiero que aparezca en la
            pantalla es el animal y el círculo"): en Inicio la brújula pasó
            a ser lo PRIMERO de la página, antes del aviso de instalación,
            la tarjeta de diagnóstico y el encabezado. Para no esconder la
            navegación en escritorio, ahí la barra de pestañas se dibuja
            DENTRO de la brújula, abajo (`tabBarInHero`); en las demás
            pestañas sigue aquí, arriba del contenido. En el teléfono la
            barra siempre está fija abajo, así que no cambia nada. */}
        {!tabBarInHero && (
          <AppTabBar C={C} t={t} accent={personalAccent} activeTab={activeTab} onChange={goToTab} isNarrow={isNarrow} />
        )}

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
        {activeTab === "inicio" && inicioView === "hoy" && (
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={() => {
                setInicioView("compass");
                window.scrollTo({ top: 0, behavior: "auto" });
              }}
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
              <ArrowLeft size={16} /> {t.today.backToHome}
            </button>
          </div>
        )}
        <div ref={todaySectionRef} style={{ display: activeTab === "inicio" && inicioView === "hoy" ? undefined : "none" }}>
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
              habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared, custom: customHabits }}
              quickNotes={quickNotes}
              routines={routines}
              onNavigate={scrollToCompanionSection}
            />
          </Panel>
        </div>

        {/* Fase 2 (Inicio simplificado): el frasco de recompensas y el
            disclaimer vivían sueltos, fuera de cualquier pestaña — un
            descuido de la Fase A (se agregó style={tabStyle(...)} a los 28
            paneles, pero no a estos dos bloques, que no son <Panel>).
            Corregido aquí: ambos quedan en Inicio, junto a "Hoy", que es de
            donde siempre fueron vecinos. */}
        {/* 10 de noviembre de 2026: con Inicio convertido en solo la
            brújula, el frasco de recompensas pasa a Progreso (es progreso) y
            el aviso de "no reemplaza a tu médico" a Perfil. */}
        <div>
        {/* Pestaña Progreso (11 de noviembre de 2026). Primera versión: 5
            tarjetas en 2 columnas — "son demasiados cuadros". Ahora: una
            barra con 3 opciones (Mi semana · Momentos buenos · Para mi
            consulta) y UNA sola tarjeta con lo que se eligió. Dentro, las
            partes se separan con una línea fina, no con más cuadros.
              - Mi semana: números + tarro de logros, insights (Plus) y el
                dato del día.
              - Momentos buenos: el banco de momentos.
              - Para mi consulta: el reporte para imprimir (Plus). */}
        <div style={tabStyle("progreso")}>
          <div
            role="tablist"
            aria-label={t.progressSummary.viewsLabel}
            style={{
              display: "flex",
              gap: "4px",
              padding: "4px",
              marginBottom: "16px",
              background: C.surface,
              borderRadius: "16px",
              border: `1px solid ${C.border}`,
            }}
          >
            {[
              { key: "semana", emoji: "📈", label: t.progressSummary.views.semana },
              { key: "momentos", emoji: "💛", label: t.progressSummary.views.momentos },
              { key: "consulta", emoji: "📋", label: t.progressSummary.views.consulta },
            ].map((v) => {
              const active = progressView === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setProgressView(v.key)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "6px 8px",
                    borderRadius: "12px",
                    border: "none",
                    background: active ? tint(personalAccent, 0.18) : "transparent",
                    color: active ? C.text : C.textMuted,
                    fontSize: isNarrow ? "12.5px" : "14px",
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    lineHeight: 1.2,
                  }}
                >
                  <span aria-hidden="true">{v.emoji}</span>
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: C.surface,
              borderRadius: "22px",
              padding: isNarrow ? "20px 18px" : "26px 28px",
              marginBottom: "20px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div ref={insightsSectionRef} style={{ display: progressView === "semana" ? undefined : "none" }}>
              <ProgressSummary C={C} t={t} jar={jar} streak={streak} focusSessionLog={focusSessionLog} isNarrow={isNarrow} />
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "22px 0 18px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <TrendingUp size={15} color={C.amber} />
                <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t.app.panels.insights.title}</span>
              </div>
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
                <WeeklyInsights
                  C={C}
                  t={t}
                  moodLog={moodLog}
                  jar={jar}
                  streak={streak}
                  habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared, custom: customHabits }}
                  sleepLog={sleepLog}
                  focusSessionLog={focusSessionLog}
                />
              </PlusLockedPanel>
              <div style={{ borderTop: `1px solid ${C.border}`, margin: "20px 0 18px" }} />
              <ScienceCapsulePanel C={C} t={t} />
            </div>

            <div ref={goodMomentsSectionRef} style={{ display: progressView === "momentos" ? undefined : "none" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>{t.app.panels.goodMoments.title}</h2>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>{t.app.panels.goodMoments.subtitle}</p>
              <GoodMomentsPanel
                C={C}
                t={t}
                lang={lang}
                goodMoments={goodMoments}
                onAdd={handleAddGoodMoment}
                onRemove={handleRemoveGoodMoment}
              />
            </div>

            <div ref={reportSectionRef} style={{ display: progressView === "consulta" ? undefined : "none" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>{t.app.panels.report.title}</h2>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 16px", lineHeight: 1.5 }}>{t.app.panels.report.subtitle}</p>
              <PlusLockedPanel C={C} t={t} locked={!isPlus} onRequestUpgrade={onRequestUpgrade}>
                <ClinicalReportPanel
                  C={C}
                  t={t}
                  lang={lang}
                  moodLog={moodLog}
                  energyLog={energyLog}
                  medications={medications}
                  medicationDoseLog={medicationDoseLog}
                  habits={{ screensOff, sleepEnv, ateWell, hydrated, deskCleared, custom: customHabits }}
                  streak={streak}
                  sleepLog={sleepLog}
                  impulseBrakeLog={impulseBrakeLog}
                />
              </PlusLockedPanel>
            </div>
          </div>
        </div>

        <div
          style={{
            ...tabStyle("perfil"),
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
              <ToolsGrid
                C={C}
                t={t}
                accent={personalAccent}
                items={herramientasItems}
                onSelect={setActiveTool}
                // "Te puede servir ahora" (11 de noviembre de 2026): UNA
                // sugerencia según lo que la app ya sabe del día, en este
                // orden — ánimo bajo registrado hoy → calmarse; de noche →
                // preparar el descanso; sin check-in → registrar ánimo;
                // pasos pendientes → elegir solo uno; mañana → desglosar;
                // si no, un rato de Modo Enfoque.
                suggestion={(() => {
                  const now = new Date();
                  const h = now.getHours();
                  const moodToday = todayMoodEntry(moodLog, now);
                  if (moodToday && moodToday.mood <= 2) return { key: "calmBubbles", reason: "moodLow" };
                  // Acaba de terminar una sesión de enfoque (última hora) →
                  // moverse un poco.
                  const lastFocus = Object.values(focusSessionLog || {}).flat().map((e) => Date.parse(e.completedAt)).filter(Boolean).sort().pop();
                  if (lastFocus && now.getTime() - lastFocus < 60 * 60 * 1000) return { key: "activeBreak", reason: "afterFocus" };
                  if (h >= 21 || h < 5) return { key: "habits", reason: "night" };
                  if (!moodToday) return { key: "mood", reason: "noCheckin" };
                  if (steps.some((st) => !st.done)) return { key: "oneThing", reason: "pending" };
                  if (h < 13) return { key: "desglosador", reason: "morning" };
                  return { key: "focusMode", reason: "default" };
                })()}
              />
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
            onSetReminder={handleSetQuickNoteReminder}
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

        {/* 10 de noviembre de 2026 — "no me gusta que las herramientas se
            vean abajo": antes este bloque tenía DOS columnas fijas, cada
            una con su propia lista de secciones. Las 3 de Progreso y las 2
            de Perfil estaban todas en la columna izquierda, y la derecha
            solo tenía herramientas (que en Progreso/Perfil están ocultas),
            así que en esas pestañas todo quedaba apilado en media pantalla
            con la otra mitad vacía. Ahora cada sección es hija directa de
            la cuadrícula: las ocultas (display:none) no ocupan lugar, y
            las que sí se ven en la pestaña activa se acomodan solas lado a
            lado, de 2 en 2. Una herramienta abierta usa el ancho completo
            (ver toolStyle), igual que Captura rápida, Rutinas y Compañero,
            que ya estaban afuera de esta cuadrícula a todo lo ancho. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "0 20px",
            alignItems: "start",
          }}
        >
            <div ref={mindMapSectionRef} style={toolStyle("mindMap")}>
            <Panel C={C}
              accent={C.lavender}
              icon={<Network size={22} />}
              title={t.app.panels.mindMap.title}
              subtitle={t.app.panels.mindMap.subtitle}
            >
              <MindMap
                C={C}
                t={t}
                bigTask={bigTask}
                onBigTaskChange={setBigTask}
                ideas={mindMapIdeas}
                ideaDraft={ideaDraft}
                onIdeaDraftChange={setIdeaDraft}
                onAddIdea={addIdea}
                onRemoveIdea={removeIdea}
                onConvertIdea={convertIdeaToStep}
                convertedMsg={ideaToStepMsg}
                onGoToDismantler={() => scrollToCompanionSection("desglosador")}
              />
            </Panel>
            </div>

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
                                  // Fondo sólido (no transparente) para que la fila
                                  // se vea bien mientras se arrastra encima de las
                                  // demás (ver ReorderHandle.jsx).
                                  background: chosenStep?.id === s.id ? C.surfaceAlt : C.surface,
                                }}
                              >
                                {!oneStepMode && steps.length > 1 && (
                                  <ReorderHandle
                                    index={originalIndex}
                                    count={steps.length}
                                    onMove={(to) => moveStep(s.id, to)}
                                    label={t.app.dismantler.dragStepAria(s.text)}
                                    color={C.textMuted}
                                  />
                                )}
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
                        {!oneStepMode && steps.length > 1 && (
                          <p style={{ fontSize: "12px", color: C.textMuted, margin: "8px 0 0" }}>{t.app.dismantler.dragStepHint}</p>
                        )}
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
                onSessionComplete={(session) => {
                  setFocusSessionLog((prev) => logFocusSession(prev, session));
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
                storageKey={`anro-focus-session-onething-${userId}`}
              />
            </Panel>
            </div>

            <div id="anro-tour-focus-mode" ref={focusModeSectionRef} style={toolStyle("focusMode")}>
            <Panel C={C}
              accent={C.coral}
              icon={<Headphones size={22} />}
              title={t.app.panels.focusMode.title}
              subtitle={t.app.panels.focusMode.subtitle}
            >
              <DeskReady
                C={C}
                t={t}
                done={deskCleared}
                onDone={() => toggleXp(setDeskCleared, deskCleared, t.app.xpLabels.deskClearedLabel, "deskCleared")}
              />
              <FocusMode
                C={C}
                t={t}
                isPlus={isPlus}
                onRequestUpgrade={onRequestUpgrade}
                onSessionComplete={(session) => {
                  setFocusSessionLog((prev) => logFocusSession(prev, session));
                  grantXp(t.app.xpLabels.focusSessionCompleted);
                  bodyDouble.setStatus("aqui");
                  setBreakPrompt(true);
                }}
                onSessionStart={(min) => {
                  scheduleStepsOnCalendar(userId, [{ text: t.app.focusSessionEventTitle, min }], { kind: "focus" });
                  bodyDouble.setStatus("enfocando");
                }}
                onFocusStatusChange={setFocusStatus}
                storageKey={`anro-focus-session-main-${userId}`}
              />
              {/* Al terminar una sesión de trabajo empieza el descanso: buen
                  momento para la pausa activa. Un toque la abre y arranca. */}
              {breakPrompt && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "16px",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    background: tint(C.amber, 0.14),
                    border: `1px solid ${tint(C.amber, 0.35)}`,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: "28px" }}>🚶</span>
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <p style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: 0 }}>{t.activeBreak.promptTitle}</p>
                    <p style={{ fontSize: "13px", color: C.textMuted, margin: "2px 0 0", lineHeight: 1.4 }}>{t.activeBreak.promptText}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBreakPrompt(false);
                      setActiveBreakStart(Date.now());
                      scrollToCompanionSection("activeBreak");
                    }}
                    style={btnPrimary(C.amber, C.amberText)}
                  >
                    {t.activeBreak.promptButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakPrompt(false)}
                    style={{ background: "transparent", border: "none", color: C.textMuted, fontSize: "13px", cursor: "pointer", padding: "8px" }}
                  >
                    {t.activeBreak.promptLater}
                  </button>
                </div>
              )}
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




            <div ref={notificationsSectionRef} style={tabStyle("perfil")}>
            <Panel C={C}
              accent={C.sky}
              icon={<Bell size={22} />}
              title={t.app.panels.notifications.title}
              subtitle={t.app.panels.notifications.subtitle}
            >
              <NotificationsPanel C={C} t={t} userId={userId} habitReminders={habitReminders} onToggleHabitReminders={() => setHabitReminders((v) => !v)} />
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

            {/* Mini juego de calma (10 de noviembre de 2026) — ver CalmBubbles.jsx. */}
            <div ref={activeBreakSectionRef} style={toolStyle("activeBreak")}>
            <Panel C={C}
              accent={C.amber}
              icon={<Activity size={22} />}
              title={t.app.panels.activeBreak.title}
              subtitle={t.app.panels.activeBreak.subtitle}
            >
              <ActiveBreak C={C} t={t} lang={lang} isNarrow={isNarrow} autoStart={activeBreakStart} onComplete={() => grantXp(t.app.xpLabels.activeBreakCompleted)} onActiveChange={setBreakInProgress} />
            </Panel>
            </div>

            <div ref={calmBubblesSectionRef} style={toolStyle("calmBubbles")}>
            <Panel C={C}
              accent={C.sky}
              icon={<Sparkles size={22} />}
              title={t.app.panels.calmBubbles.title}
              subtitle={t.app.panels.calmBubbles.subtitle}
            >
              <CalmBubbles C={C} t={t} accent={personalAccent} onComplete={() => grantXp(t.app.xpLabels.calmBubblesCompleted)} />
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

        <div ref={habitsSectionRef} style={toolStyle("habits")}>
        <Panel C={C}
          accent={C.coral}
          icon={<Moon size={22} />}
          title={t.app.panels.habits.title}
          subtitle={t.app.panels.habits.subtitle}
        >
          {/* 11 de noviembre de 2026 ("no me gusta nada el diseño"): antes
              eran 4 bloques en 2 columnas mezclando hábitos, un reloj de
              pausa activa y el "Fuera de la vista". Ahora es SOLO la lista
              de hábitos del día, con contador. La pausa activa es su propia
              herramienta (ActiveBreak.jsx) y el "Fuera de la vista" pasó a
              Modo enfoque como paso de "Antes de empezar" (DeskReady.jsx). */}
          {(() => {
            return (
              <div>
                <HabitsList
                  C={C}
                  t={t}
                  isNarrow={isNarrow}
                  items={habitItems}
                  canAdd={canAddCustomHabit(customHabits)}
                  openAddSignal={habitAddSignal}
                  onFormOpenChange={setHabitFormOpen}
                  onAdd={(data) => setCustomHabits((list) => addCustomHabit(list, data))}
                  onUpdate={(id, data) => setCustomHabits((list) => updateCustomHabit(list, id, data))}
                  onRemove={(id) => setCustomHabits((list) => removeCustomHabit(list, id))}
                />

                <div style={{ borderTop: `1px solid ${C.border}`, margin: "20px 0 16px" }} />
                {/* Sueño de anoche (11 nov 2026): hora de dormir y, si
                    quiere, hora de despertar — con las dos se calcula el
                    tiempo de sueño aproximado (ver sleepLog.js). */}
                <p style={{ fontSize: "15px", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>🌙 {t.app.habits.sleepTitle}</p>
                <p style={{ fontSize: "12.5px", color: C.textMuted, margin: "0 0 12px", lineHeight: 1.5 }}>{t.app.habits.sleepHint}</p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", fontWeight: 700, color: C.text }}>
                    {t.app.habits.bedtimeLabel}
                    <input
                      type="time"
                      value={bedtimeInput}
                      onChange={(e) => {
                        setBedtimeInput(e.target.value);
                        setSleepSaved(false);
                      }}
                      style={{ ...inputStyle, width: "auto", minHeight: "44px", fontSize: "16px" }}
                    />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12.5px", fontWeight: 700, color: C.text }}>
                    {t.app.habits.wakeLabel}
                    <input
                      type="time"
                      value={wakeInput}
                      onChange={(e) => {
                        setWakeInput(e.target.value);
                        setSleepSaved(false);
                      }}
                      style={{ ...inputStyle, width: "auto", minHeight: "44px", fontSize: "16px" }}
                    />
                  </label>
                  <button onClick={saveBedtime} disabled={!bedtimeInput} style={{ ...btnGhost, minHeight: "44px", opacity: bedtimeInput ? 1 : 0.5 }}>
                    {sleepSaved ? `✓ ${t.app.habits.sleepSaved}` : t.common.save}
                  </button>
                </div>
                {todayBedtimeEntry && (
                  <p style={{ fontSize: "14px", color: C.text, margin: "12px 0 0", lineHeight: 1.5 }}>
                    {sleepMinutesToday != null ? (
                      <>
                        😴 <strong>{t.app.habits.sleepDuration(t.app.habits.formatDuration(sleepMinutesToday))}</strong>{" "}
                        <span style={{ color: C.textMuted, fontSize: "12.5px" }}>{t.app.habits.sleepApproxNote}</span>
                      </>
                    ) : todayBedtimeEntry.wake ? (
                      <span style={{ color: C.textMuted }}>{t.app.habits.sleepCheckTimes}</span>
                    ) : (
                      <span style={{ color: C.textMuted }}>{t.app.habits.bedtimeRegistered(todayBedtimeEntry.time)} {t.app.habits.sleepAddWake}</span>
                    )}
                  </p>
                )}
              </div>
            );
          })()}
        </Panel>
        </div>
        </div>

        <p style={{ display: inicioCompass ? "none" : undefined, fontSize: "12px", color: C.textMuted, textAlign: "center", lineHeight: 1.6, marginTop: "8px" }}>
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
      {/* 11 nov 2026: en Inicio (brújula) los 3 botones flotantes tapaban
          la franja "Mis hábitos de hoy" de abajo; ahí se ocultan (la
          brújula ya lleva a todo). Siguen montados (display:none), así que
          no pierden su estado, y en las demás pestañas se ven igual. */}
      <div style={{ display:
            inicioCompass ||
            (activeTab === "herramientas" && ((habitFormOpen && activeTool === "habits") || (breakInProgress && activeTool === "activeBreak")))
              ? "none"
              : undefined, }}>
      <QuickNavMenu
        C={C}
        t={t}
        accent={personalAccent}
        sections={quickNavSections}
        onNavigate={scrollToCompanionSection}
        bottomOffset={isNarrow ? 64 : 0}
      />

      {/* "Memoria ANRO" (3 de noviembre de 2026): acceso flotante adicional
          a Captura rápida/Descarga mental desde cualquier pantalla, sin
          navegar primero a "Herramientas" — ver MemoriaAnroLauncher.jsx
          para la decisión completa. Mismas props que ya recibe
          CaptureHubPanel más abajo en la pestaña "Herramientas"; los dos
          leen y escriben el mismo estado (quickNotes), así que una nota
          agregada desde el botón flotante aparece también en el panel de
          la pestaña, y viceversa. */}
      <MemoriaAnroLauncher
        C={C}
        t={t}
        lang={lang}
        userId={userId}
        accent={personalAccent}
        quickNotes={quickNotes}
        oldForgottenNoteId={forgottenNoteId}
        canAddStep={steps.length < 5}
        onAddNote={handleAddQuickNote}
        onResolveNote={handleResolveQuickNote}
        onRemoveNote={handleRemoveQuickNote}
        onConfirmMedication={handleConfirmQuickMedication}
        onConfirmPayment={handleConfirmQuickPayment}
        onConfirmStep={handleConfirmQuickStep}
        onSetReminder={handleSetQuickNoteReminder}
        bottomOffset={isNarrow ? 64 : 0}
      />
      <BreathingBubbleLauncher
  C={C}
  t={t}
  accent={personalAccent}
  grantXp={grantXp}
  bottomOffset={isNarrow ? 64 : 0}
/>
      </div>
    </div>
  );
}
