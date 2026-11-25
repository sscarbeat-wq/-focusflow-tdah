import React, { useState, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { todayEntry, recentEntries } from "./moodLog";
import { tint } from "./theme";

// El reconocimiento de voz del navegador (Web Speech API) necesita un BCP-47
// completo, no solo el código de 2 letras — mismo mapa que ya se usa en
// GoodMomentsPanel.jsx y CompanionPanel.jsx.
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

// 25 de noviembre de 2026 ("tambien añade el microfono"): dictado del
// propio navegador para la nota opcional ("¿Qué influyó en tu ánimo hoy?"),
// mismo patrón ya usado en CompanionPanel.jsx — NO pasa por ninguna IA, solo
// transcribe; si el navegador no lo soporta (ej. Safari de iPhone), el botón
// de micrófono simplemente no aparece y el textarea sigue funcionando igual
// con el teclado.
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// Registro de ánimo + journaling diario — 5 caritas animadas (SVG propio,
// no emoji de Unicode) + nota corta opcional, más una tira de los últimos 7
// días. Las etiquetas visibles viven en t.moodLog — acá solo quedan los
// valores internos (1-5), los colores y los dibujos, que no cambian con el
// idioma.
//
// 25 de noviembre de 2026 ("no le dice al paciente para qué sirve, se ve
// muy simple, nada interactivo"): dos cambios.
// 1) Se agregó t.moodLog.intro, una frase corta arriba de los emojis que le
//    dice a la paciente para qué sirve esto en concreto (alimenta
//    "Insights semanales" y el reporte para su psiquiatra).
// 2) Rediseño visual con colores por nivel de ánimo (MOOD_COLOR_KEYS) y una
//    mini gráfica de barras para "últimos 7 días" en vez de celdas iguales.
//
// 25 de noviembre de 2026, segunda ronda ("esas caritas no me gustan, quiero
// que se muevan y hagan los gestos"): los emojis de Unicode (😞😕😐🙂😄) se
// reemplazan por 5 caritas dibujadas en SVG (MoodFace, abajo) con su propia
// animación — mismo recurso ya usado en Mascot.jsx/MascotSprite.jsx (un
// <style> con @keyframes, sin librería nueva, respeta
// `prefers-reduced-motion: reduce`). No se generan ilustraciones nuevas por
// IA (no hay herramienta de generación de imágenes conectada en este
// entorno — ver anro-tdah-mascotas-expansion-propuesta.md); en vez de eso
// se usa el mismo camino ya aprobado para los personajes nuevos de la
// mascota cuando no hay ilustración real todavía: dibujo vectorial propio,
// con estilo consistente, hecho por código.
// Cada carita respira y parpadea sola todo el tiempo (igual en el selector
// de arriba y en las barras de "últimos 7 días"), y la que se acaba de
// elegir hace además un gesto de una sola vez (se repite cada vez que se
// toca, incluso si ya estaba elegida): triste llora, mal suspira y se
// agacha un poco, regular se encoge de hombros, bien da un salto, muy bien
// da un salto grande con destellos alrededor.
const MOOD_VALUES = [1, 2, 3, 4, 5];
// Gradiente de "muy mal" a "muy bien" usando solo colores que ya existen en
// theme.js (ningún color nuevo) — cada uno trae su propio ...Text para el
// texto que va encima.
const MOOD_COLOR_KEYS = { 1: "rose", 2: "coral", 3: "gray", 4: "amber", 5: "mint" };

const WEEKDAY_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

function weekdayInitial(dateKey, lang) {
  // dateKey es "YYYY-MM-DD" (todayKey() de streak.js) — se arma con
  // mediodía local para no cruzar de día por un corrimiento de huso
  // horario al convertir a Date.
  const d = new Date(`${dateKey}T12:00:00`);
  const label = d.toLocaleDateString(WEEKDAY_LOCALES[lang] || WEEKDAY_LOCALES.es, { weekday: "short" });
  return label.replace(".", "").slice(0, 1).toUpperCase();
}

// Fijos en los 5 dibujos, no cambian por tema claro/oscuro ni por nivel de
// ánimo (igual que el Unicode de un emoji tampoco cambiaba) — el color del
// ánimo ya lo lleva el fondo/borde de la burbuja que envuelve la carita.
const FACE_FILL = "#FFD873";
const LINE = "#4A3415";
const FACE_CX = 50;
const FACE_CY = 54;
const FACE_R = 44;
const EYE_L = { x: 34, y: 48 };
const EYE_R = { x: 66, y: 48 };

// Una sola carita SVG reutilizada en el selector (grande, interactiva) y en
// la tira de "últimos 7 días" (chica, solo decorativa). `selected` + `pulse`
// controlan el gesto de una sola vez: `pulse` es un número que cambia cada
// vez que SE VUELVE A TOCAR esa misma carita (ver handlePick), y se usa
// como `key` del grupo de gesto para forzar que React lo vuelva a montar —
// así la animación CSS (que no es infinita) se repite en vez de quedarse
// congelada la segunda vez que se toca el mismo ánimo.
function MoodFace({ value, size, selected = false, pulse = 0 }) {
  const gestureClass = selected ? `anro-mood-gesture-${value}` : "";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="anro-mood-breathe">
        <circle cx={FACE_CX} cy={FACE_CY} r={FACE_R} fill={FACE_FILL} stroke={LINE} strokeWidth="3" />
        <g key={selected ? `gesture-${pulse}` : "idle"} className={gestureClass} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {renderEyebrows(value)}
          {renderMouth(value)}
          {value === 1 && (
            <ellipse className="anro-mood-tear" cx={EYE_L.x - 7} cy={EYE_L.y + 9} rx="3.2" ry="5.5" fill="#6FB3E0" opacity="0" />
          )}
          {value === 5 && (
            // Cada destello va en su propio <g> con la posición fija por
            // atributo SVG (transform="translate(...)"), y la animación
            // CSS (opacity + transform de la propia chispa) se aplica al
            // <path> DE ADENTRO, nunca al mismo elemento que ya trae un
            // transform fijo — un transform por CSS siempre reemplaza por
            // completo al atributo transform de SVG (nunca se combinan),
            // así que ponerlos en el mismo elemento hacía que el destello
            // saltara a otra posición en vez de aparecer donde debía.
            <>
              <g transform="translate(12,26)">
                <path className="anro-mood-spark anro-mood-spark-a" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#FFD23F" opacity="0" />
              </g>
              <g transform="translate(88,26)">
                <path className="anro-mood-spark anro-mood-spark-b" d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#FFD23F" opacity="0" />
              </g>
              <g transform="translate(50,4)">
                <path className="anro-mood-spark anro-mood-spark-c" d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#FFD23F" opacity="0" />
              </g>
            </>
          )}
        </g>
        <g className="anro-mood-blink" style={{ transformBox: "fill-box", transformOrigin: `${EYE_L.x}px ${EYE_L.y}px` }}>
          {renderEye(value, EYE_L)}
        </g>
        <g className="anro-mood-blink" style={{ transformBox: "fill-box", transformOrigin: `${EYE_R.x}px ${EYE_R.y}px` }}>
          {renderEye(value, EYE_R, true)}
        </g>
      </g>
    </svg>
  );
}

function renderEye(value, pos, mirrored = false) {
  // Ánimo 5 usa ojitos felices en forma de arco en vez de círculo.
  if (value === 5) {
    const d = mirrored
      ? `M ${pos.x + 8} ${pos.y} Q ${pos.x} ${pos.y - 8} ${pos.x - 8} ${pos.y}`
      : `M ${pos.x - 8} ${pos.y} Q ${pos.x} ${pos.y - 8} ${pos.x + 8} ${pos.y}`;
    return <path d={d} fill="none" stroke={LINE} strokeWidth="4.5" strokeLinecap="round" />;
  }
  return <circle cx={pos.x} cy={pos.y} r="6" fill={LINE} />;
}

function renderEyebrows(value) {
  const d = {
    1: { l: "M 22 30 L 40 38", r: "M 78 30 L 60 38" },
    2: { l: "M 24 32 L 40 36", r: "M 76 32 L 60 36" },
    3: { l: "M 26 32 L 40 32", r: "M 74 32 L 60 32" },
    4: { l: "M 24 34 L 40 30", r: "M 76 34 L 60 30" },
    5: { l: "M 22 32 Q 32 22 42 30", r: "M 78 32 Q 68 22 58 30" },
  }[value];
  return (
    <>
      <path d={d.l} fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      <path d={d.r} fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function renderMouth(value) {
  if (value === 5) {
    return <path d="M 26 62 Q 50 92 74 62 Q 50 78 26 62 Z" fill="#8B3A3A" stroke={LINE} strokeWidth="3" />;
  }
  const d = {
    1: "M 30 74 Q 50 58 70 74",
    2: "M 34 72 Q 50 64 66 72",
    3: "M 35 70 L 65 70",
    4: "M 32 64 Q 50 80 68 64",
  }[value];
  return <path d={d} fill="none" stroke={LINE} strokeWidth="4" strokeLinecap="round" />;
}

export default function MoodLog({ C, t, lang, moodLog, onSave }) {
  const existing = todayEntry(moodLog);
  const [mood, setMood] = useState(existing?.mood || 0);
  const [note, setNote] = useState(existing?.note || "");
  const [justSaved, setJustSaved] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [listening, setListening] = useState(false); // dictado por voz de la nota
  const recognitionRef = useRef(null);
  const SpeechRecognition = getSpeechRecognition();

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const history = recentEntries(moodLog, 7);
  const labelFor = (value) =>
    ({ 1: t.moodLog.veryBad, 2: t.moodLog.bad, 3: t.moodLog.regular, 4: t.moodLog.good, 5: t.moodLog.veryGood }[value]);
  const colorFor = (value) => C[MOOD_COLOR_KEYS[value]];
  const textColorFor = (value) => C[`${MOOD_COLOR_KEYS[value]}Text`];

  const handlePick = (value) => {
    setMood(value);
    // Siempre cambia, incluso si ya era el mismo ánimo elegido — así el
    // gesto (llorar, saltar, etc.) se repite cada vez que la paciente toca
    // la carita, no solo la primera.
    setPulse((p) => p + 1);
  };

  const handleSave = () => {
    if (!mood) return;
    onSave(mood, note);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const chipStyle = (value) => {
    const active = mood === value;
    const color = colorFor(value);
    return {
      background: active ? tint(color, 0.22) : C.surfaceAlt,
      border: `2px solid ${active ? color : "transparent"}`,
      borderRadius: "14px",
      padding: active ? "6px" : "8px",
      cursor: "pointer",
      lineHeight: 1,
      transition: "background 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
      transform: active ? "translateY(-2px)" : "none",
      display: "flex",
    };
  };

  const saveColor = mood ? colorFor(mood) : null;

  return (
    <div>
      <style>{`
        @keyframes anroMoodBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        .anro-mood-breathe {
          animation: anroMoodBreathe 3.2s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes anroMoodBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        .anro-mood-blink {
          animation: anroMoodBlink 4.6s ease-in-out infinite;
        }
        @keyframes anroMoodGesture1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(2px) rotate(3deg); }
          60% { transform: translateY(2px) rotate(3deg); }
        }
        @keyframes anroMoodTear {
          0%, 15% { opacity: 0; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(4px); }
          85% { opacity: 1; transform: translateY(16px); }
          100% { opacity: 0; transform: translateY(18px); }
        }
        .anro-mood-gesture-1 { animation: anroMoodGesture1 1.4s ease-in-out; }
        .anro-mood-gesture-1 .anro-mood-tear { animation: anroMoodTear 1.4s ease-in; }
        @keyframes anroMoodGesture2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        .anro-mood-gesture-2 { animation: anroMoodGesture2 0.9s ease-in-out; }
        @keyframes anroMoodGesture3 {
          0%, 100% { transform: rotate(0deg); }
          30% { transform: rotate(-5deg); }
          70% { transform: rotate(5deg); }
        }
        .anro-mood-gesture-3 { animation: anroMoodGesture3 0.8s ease-in-out; }
        @keyframes anroMoodGesture4 {
          0%, 100% { transform: translateY(0) scale(1); }
          40% { transform: translateY(-7px) scale(1.05, 0.95); }
          70% { transform: translateY(0) scale(0.97, 1.04); }
        }
        .anro-mood-gesture-4 { animation: anroMoodGesture4 0.7s ease-out; }
        @keyframes anroMoodGesture5 {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-10px) scale(1.06, 0.94); }
          50% { transform: translateY(0) scale(0.96, 1.05); }
          70% { transform: translateY(-4px) scale(1.02, 0.98); }
        }
        @keyframes anroMoodSparkle {
          0%, 10% { opacity: 0; transform: translate(var(--sx,0px), var(--sy,0px)) scale(0.4); }
          45% { opacity: 1; transform: translate(var(--sx,0px), var(--sy,0px)) scale(1.1); }
          100% { opacity: 0; transform: translate(var(--sx,0px), var(--sy,0px)) scale(0.6); }
        }
        .anro-mood-gesture-5 { animation: anroMoodGesture5 0.9s ease-out; }
        .anro-mood-gesture-5 .anro-mood-spark { animation: anroMoodSparkle 0.9s ease-out; }
        .anro-mood-gesture-5 .anro-mood-spark-a { --sx: -6px; --sy: -4px; }
        .anro-mood-gesture-5 .anro-mood-spark-b { --sx: 6px; --sy: -4px; }
        .anro-mood-gesture-5 .anro-mood-spark-c { --sx: 0px; --sy: -8px; }
        @media (prefers-reduced-motion: reduce) {
          .anro-mood-breathe,
          .anro-mood-blink,
          .anro-mood-gesture-1,
          .anro-mood-gesture-2,
          .anro-mood-gesture-3,
          .anro-mood-gesture-4,
          .anro-mood-gesture-5,
          .anro-mood-gesture-1 .anro-mood-tear,
          .anro-mood-gesture-5 .anro-mood-spark {
            animation: none !important;
          }
        }
      `}</style>

      <p style={{ fontSize: "12.5px", color: C.textMuted, lineHeight: 1.5, margin: "0 0 14px" }}>{t.moodLog.intro}</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        {MOOD_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => handlePick(value)}
            aria-label={labelFor(value)}
            title={labelFor(value)}
            style={chipStyle(value)}
          >
            <MoodFace value={value} size={mood === value ? 52 : 40} selected={mood === value} pulse={pulse} />
          </button>
        ))}
      </div>

      <p
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: mood ? colorFor(mood) : C.textMuted,
          margin: "0 0 14px",
          minHeight: "18px",
        }}
      >
        {mood ? labelFor(mood) : t.moodLog.pickOne}
      </p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.moodLog.notePlaceholder}
        rows={2}
        style={{
          width: "100%",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "8px 10px",
          color: C.text,
          fontSize: "13px",
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: "8px",
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        <button
          onClick={handleSave}
          disabled={!mood}
          style={{
            background: saveColor || C.surfaceAlt,
            border: "none",
            borderRadius: "12px",
            padding: "8px 16px",
            color: mood ? textColorFor(mood) : C.textMuted,
            fontWeight: 600,
            fontSize: "13px",
            cursor: mood ? "pointer" : "not-allowed",
            transition: "background 0.15s ease",
          }}
        >
          {justSaved ? t.moodLog.saved : existing ? t.moodLog.updateButton : t.moodLog.saveButton}
        </button>

        {SpeechRecognition && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: listening ? C.rose : C.surfaceAlt,
              color: listening ? C.roseText || "#fff" : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "7px 12px",
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            {listening ? <Square size={13} /> : <Mic size={13} />}
            {listening ? t.companion.freeTextStop : t.companion.freeTextRecordVoice}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", marginTop: "20px", height: "84px" }}>
        {history.map(({ date, entry }) => {
          const isToday = date === history[history.length - 1].date;
          const color = entry?.mood ? colorFor(entry.mood) : null;
          const heightPct = entry?.mood ? (entry.mood / 5) * 100 : 14;
          return (
            <div key={date} title={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
              <div style={{ height: "20px", display: "flex", alignItems: "center" }}>
                {entry?.mood ? <MoodFace value={entry.mood} size={18} /> : null}
              </div>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                <div
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    minHeight: "10px",
                    borderRadius: "6px",
                    background: color ? color : "transparent",
                    border: !color ? `1px dashed ${C.border}` : isToday ? `2px solid ${C.text}` : "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
        {history.map(({ date }) => (
          <div key={date} style={{ flex: 1, textAlign: "center", fontSize: "10px", color: C.textMuted, fontWeight: 600 }}>
            {weekdayInitial(date, lang)}
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "6px 0 0" }}>{t.moodLog.last7Days}</p>
    </div>
  );
}
