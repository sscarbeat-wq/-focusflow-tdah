import React, { useEffect, useRef, useState } from "react";
import { Flame, Trophy, Volume2, VolumeX } from "lucide-react";
import { tint } from "./theme";
import {
  stageFor,
  progressFraction,
  DEFAULT_SPECIES,
  RESET_VARIANT_COUNT,
  getStoredResetVariant,
  storeResetVariant,
  ACCESSORY_EMOJI,
} from "./mascotLogic";
import {
  playLevelUpSound,
  playHatchSound,
  playFocusStartSound,
  playDistractionReturnSound,
  unlockMascotAudio,
  getStoredMascotSoundPref,
  storeMascotSoundPref,
} from "./mascotSounds";

// Mascota simple basada en emoji + CSS — sin dependencias nuevas ni assets
// externos. Evoluciona según la racha actual. Pensada para poder cambiarse
// después por ilustraciones propias sin tocar la lógica del resto de la app.
// Los textos (label/hint) viven en el diccionario de idioma (t.mascot) — acá
// solo queda el componente visual; las etapas y el cálculo de progreso
// viven en mascotLogic.js (26 de octubre de 2026, para poder probarlos con
// Node sin pasar por JSX). `species` (27 de octubre de 2026): qué personaje
// eligió la paciente — "ave" si no se manda nada, el mismo que ya veían
// todas las pacientes antes de que existiera la elección.
//
// Animación (27 de octubre de 2026, a petición de la doctora: "más
// estilizados, que hagan movimientos"): sin un generador de ilustraciones
// disponible en este espacio de trabajo, el camino es CSS puro sobre el
// mismo emoji — nada de assets nuevos. Dos movimientos, pensados para no
// sobrecargar (la mascota se ve todo el día, en cada visita a la pantalla
// principal):
//   1. Flotación/respiración constante, muy sutil (3px, ~3.6s) — da
//      sensación de "viva" sin llamar la atención de más.
//   2. Festejo breve de "subió de nivel" (rotación + escala, ~0.9s) que se
//      dispara SOLO cuando el emoji de etapa cambia hacia adelante (nunca en
//      el reset — ahí no tiene sentido festejar). Coincide con el patrón ya
//      usado en el resto de la app: base calmada el día a día, explosión
//      breve en el momento de logro.
// Ambas respetan `prefers-reduced-motion: reduce` (se desactivan por
// completo), igual que la sensibilidad a sobreestimulación que ya se tomó
// en cuenta para el resto del diseño.
//
// Segunda pasada (27 de octubre de 2026, a petición de la doctora: "diseño
// bonito, que no se vea tan plana, y la mascota más grande, y que [la
// mascota] salga de un huevo"):
//   - Mascota más grande: el anillo pasó de 68px a 112px y el emoji de 32px
//     a 56px — sigue siendo el mismo componente, solo más protagonista.
//   - "Que no se vea tan plana": la tarjeta ya tenía un degradado sutil;
//     ahora suma una mancha de luz de color (el acento de racha, difuminada
//     de fondo), una sombra de dos capas para que se sienta "levantada" en
//     vez de pegada a la pantalla, y una sombra de "piso" debajo del
//     círculo para que la mascota se sienta apoyada en algo, no flotando
//     sobre la nada.
//   - "Que salga de un huevo": todas las especies que empiezan en huevo
//     (ave, dragón, pez — el pez es el que termina en 🐋) ya llegaban ahí
//     por lógica (mascotLogic.js), pero el cambio de huevo a la siguiente
//     etapa pasaba exactamente igual que cualquier otro festejo de racha,
//     sin distinguirse. Ahora ese momento específico (huevo → algo vivo)
//     tiene su propia animación de "eclosión": el huevo tiembla, se
//     encoge como si se rompiera, y el animal aparece con un rebote y un
//     par de chispitas — en vez de solo el festejo genérico de subir de
//     nivel. Las especies que no empiezan en huevo (gato, planta, perro)
//     conservan el festejo genérico de siempre.
// Todo lo nuevo respeta `prefers-reduced-motion: reduce` igual que antes.
//
// Tercera pasada (31 de octubre de 2026 — Fase 4, función #2: "la mascota
// reacciona en vivo durante el enfoque"): nuevo prop opcional `focusStatus`
// ("idle" | "focusing" | "distracted"), que FocusFlowTDAH.jsx alimenta en
// vivo desde los mismos callbacks `onSessionStart`/`onSessionComplete` que
// ya existían (ver bodyDouble.setStatus) y desde el tracker de distracción
// que YA existía en FocusMode.jsx (distractionTracker.js) — esta función es
// gratis para todo el mundo, no es parte del sistema de planes: solo
// conecta dos piezas que ya estaban construidas, no agrega infraestructura
// nueva. Por default "idle" (nadie manda este prop todavía desde otros
// lugares que usen <Mascot>, así que se ven exactamente igual que antes).
// Mientras hay una sesión de Modo Enfoque corriendo aparece una píldora
// "🎯 Enfocando" junto a las de racha; si el paciente deja la pestaña y
// vuelve, la mascota hace un gesto breve (un "parpadeo" lateral, nunca un
// regaño — mismo principio de evitar lenguaje de "perdiste" que ya se usa
// en el reinicio de racha) y la píldora cambia un instante a "👀 ¡Volviste!"
// antes de volver a "Enfocando". Todo respeta `prefers-reduced-motion`.
//
// Cuarta pasada (31 de octubre de 2026, a petición de la doctora: "más
// bonitas, que tengan movimiento y sonidos"):
//   - Movimiento: la flotación de siempre ahora incluye un leve balanceo
//     (rotación de ±2°) en vez de solo subir/bajar — se siente más viva sin
//     ser más intensa. El pez (única especie "acuática") tiene su propia
//     variante que se balancea de lado a lado en vez de rotar, como si
//     nadara.
//   - Sonidos: efectos cortos generados con Web Audio API (mascotSounds.js,
//     mismo principio sin archivos externos que ya usa FocusMode.jsx) para
//     subir de etapa, salir del huevo, empezar/retomar el enfoque y volver
//     de una distracción — nunca un loop de fondo. Activados por default,
//     con un botón de silenciar (esquina superior derecha de la tarjeta)
//     por si a alguien le resulta de más; la preferencia se guarda en el
//     dispositivo, igual que la especie elegida.

const RING_SIZE = 112;
const RING_RADIUS = 46;
const RING_STROKE = 8;
const EGG_EMOJI = "🥚";

// Variante "hero" (9 de noviembre de 2026 — rediseño "estilo K" de Inicio):
// la mascota pasa de vivir en su propia tarjeta rectangular a vivir DENTRO
// del círculo central de QuickAccessCompass.jsx, como una sola pieza visual
// con la brújula de accesos rápidos ("se ven dos mascotas" era justamente
// el problema que reportó la doctora con el diseño anterior — ahora solo
// existe un <Mascot>, nunca dos). Ningún hook/efecto de abajo cambia entre
// variantes — sonido, festejo, eclosión, gesto de distracción son
// exactamente la misma lógica; solo cambia qué JSX se dibuja al final.
// En esta variante el anillo deja de mostrar el avance de racha (fraction,
// más abajo) y pasa a mostrar el nuevo `focusPercent` real (ver
// todayFocusPercent() en focusSessionLog.js) — es el número que pidió la
// doctora ("un % real de enfoque de hoy"), no una reutilización del
// progreso de racha, que mide otra cosa.
const HERO_RING_SIZE = 150;
const HERO_RING_RADIUS = 62;
const HERO_RING_STROKE = 10;
const HERO_EMOJI_SIZE = 40;

export default function Mascot({
  streak,
  C,
  t,
  accent,
  species,
  focusStatus = "idle",
  accessory = "none",
  variant = "card",
  focusPercent = 0,
}) {
  const isHero = variant === "hero";
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const resolvedSpecies = species || DEFAULT_SPECIES;

  // Cuál de los 2 mensajes de reinicio de racha toca mostrar (preferencia
  // de dispositivo, mismo patrón que la especie elegida y el sonido) — se
  // alterna solo cuando empieza un reinicio nuevo, ver el useEffect de
  // abajo, no en cada render.
  const [resetVariant, setResetVariant] = useState(() => getStoredResetVariant());
  const stage = stageFor(current, longest, resolvedSpecies, resetVariant);
  const label = t.mascot[stage.labelKey];
  const hint = t.mascot[stage.hintKey];
  const ringColor = accent || C.lavender;
  const fraction = progressFraction(current, longest);
  const isAquatic = resolvedSpecies === "pez";

  const ringSize = isHero ? HERO_RING_SIZE : RING_SIZE;
  const ringRadius = isHero ? HERO_RING_RADIUS : RING_RADIUS;
  const ringStroke = isHero ? HERO_RING_STROKE : RING_STROKE;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const emojiFontSize = isHero ? HERO_EMOJI_SIZE : 56;
  // Hero: el anillo muestra el % real de enfoque de hoy, no el avance de
  // racha — son dos cosas distintas (ver comentario arriba de HERO_RING_SIZE).
  const ringFraction = isHero ? Math.max(0, Math.min(1, (focusPercent || 0) / 100)) : fraction;
  const dashOffset = ringCircumference * (1 - ringFraction);

  // Sonidos (gratis, preferencia de dispositivo) — ver mascotSounds.js.
  const [soundOn, setSoundOn] = useState(() => getStoredMascotSoundPref());

  // Los navegadores no deja sonar nada hasta una interacción real de la
  // persona; este listener "destraba" el audio en cuanto toque/haga click/
  // presione una tecla en cualquier parte de la app, sin que tenga que ser
  // justo el botón de sonido de la mascota.
  useEffect(() => {
    const unlock = () => unlockMascotAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggleSound = () => {
    unlockMascotAudio();
    setSoundOn((prev) => {
      const next = !prev;
      storeMascotSoundPref(next);
      return next;
    });
  };

  // Festejo de "subió de nivel" — se dispara solo cuando el emoji de la
  // etapa cambia de un render al siguiente (no en cada render), y nunca en
  // el reset de racha (ahí el emoji también cambia, pero sería raro
  // festejar justo cuando se perdió la racha). Si la etapa anterior era un
  // huevo, el festejo es la animación de eclosión en vez de la genérica.
  const prevEmojiRef = useRef(stage.emoji);
  const isReset = current === 0 && longest > 0;
  const [celebrate, setCelebrate] = useState(false);
  const [hatching, setHatching] = useState(false);

  useEffect(() => {
    if (prevEmojiRef.current !== stage.emoji) {
      const wasEgg = prevEmojiRef.current === EGG_EMOJI;
      prevEmojiRef.current = stage.emoji;
      if (!isReset) {
        if (wasEgg) {
          setHatching(true);
          if (soundOn) playHatchSound();
          const timeout = setTimeout(() => setHatching(false), 1100);
          return () => clearTimeout(timeout);
        }
        setCelebrate(true);
        if (soundOn) playLevelUpSound();
        const timeout = setTimeout(() => setCelebrate(false), 900);
        return () => clearTimeout(timeout);
      }
      // Reinicio de racha nuevo (no solo seguir viendo el mismo reinicio en
      // otro render): alterna cuál de los 2 mensajes toca la próxima vez,
      // guardado por dispositivo para que la alternancia siga aunque
      // cierre y abra la app.
      setResetVariant((prev) => {
        const next = (prev + 1) % RESET_VARIANT_COUNT;
        storeResetVariant(next);
        return next;
      });
    }
  }, [stage.emoji, isReset, soundOn]);

  // Gesto breve al volver de una distracción — mismo patrón que celebrate/
  // hatching arriba (se dispara solo en la transición, no en cada render),
  // pero sobre `focusStatus` en vez de `stage.emoji`. "distracted" es un
  // valor transitorio que el padre manda un instante y luego regresa a
  // "focusing" por su cuenta (ver FocusMode.jsx); por eso basta con
  // reaccionar a la transición hacia "distracted", no a cuánto dura.
  const prevFocusStatusRef = useRef(focusStatus);
  const [distracted, setDistracted] = useState(false);

  useEffect(() => {
    const prevStatus = prevFocusStatusRef.current;
    if (focusStatus === "distracted" && prevStatus !== "distracted") {
      setDistracted(true);
      if (soundOn) playDistractionReturnSound();
      const timeout = setTimeout(() => setDistracted(false), 1300);
      prevFocusStatusRef.current = focusStatus;
      return () => clearTimeout(timeout);
    }
    // Sonido de "empezar/retomar" solo al entrar a "focusing" viniendo de
    // verdad de estar quieto ("idle") — no al volver ahí después del gesto
    // de distracción, que ya tuvo su propio sonido arriba.
    if (focusStatus === "focusing" && prevStatus !== "focusing" && prevStatus !== "distracted") {
      if (soundOn) playFocusStartSound();
    }
    prevFocusStatusRef.current = focusStatus;
  }, [focusStatus, soundOn]);

  const showFocusPill = focusStatus === "focusing" || focusStatus === "distracted";

  // Píldoras reutilizadas tal cual entre las dos variantes (mismos datos,
  // solo cambia el contenedor que las envuelve más abajo) — un poco más
  // chicas en "hero" porque ahí viven centradas bajo un círculo angosto,
  // no a lo ancho de una tarjeta.
  const streakPill = (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: tint(C.amber, 0.16),
        borderRadius: "999px",
        padding: isHero ? "6px 12px" : "8px 14px",
        flexShrink: 0,
        boxShadow: `0 3px 8px ${tint(C.amber, 0.25)}`,
      }}
    >
      <Flame size={isHero ? 14 : 16} color={C.amber} />
      <span style={{ fontSize: isHero ? "13px" : "15px", fontWeight: 700, color: C.text }}>{current}</span>
      <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.dayWord(current)}</span>
    </div>
  );
  const trophyPill = longest > 0 && (
    <div
      title={t.mascot.bestStreakTitle}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: tint(ringColor, 0.16),
        borderRadius: "999px",
        padding: isHero ? "6px 12px" : "8px 14px",
        flexShrink: 0,
        boxShadow: `0 3px 8px ${tint(ringColor, 0.25)}`,
      }}
    >
      <Trophy size={isHero ? 14 : 16} color={ringColor} />
      <span style={{ fontSize: isHero ? "13px" : "15px", fontWeight: 700, color: C.text }}>{longest}</span>
      <span style={{ fontSize: "11px", color: C.textMuted }}>{t.mascot.bestStreakLabel}</span>
    </div>
  );
  const focusPill = showFocusPill && (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: tint(ringColor, 0.16),
        borderRadius: "999px",
        padding: isHero ? "6px 12px" : "8px 14px",
        flexShrink: 0,
        boxShadow: `0 3px 8px ${tint(ringColor, 0.25)}`,
        transition: "background 0.3s ease",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: "15px", lineHeight: 1 }}>
        {distracted ? "👀" : "🎯"}
      </span>
      <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>
        {distracted ? t.mascot.focusDistractedLabel : t.mascot.focusingLabel}
      </span>
    </div>
  );

  // El círculo del anillo + emoji + accesorio + sombra de piso es idéntico
  // entre variantes salvo tamaño (ringSize/ringRadius/etc. ya resueltos
  // arriba) y qué va dentro del centro (solo el emoji en "card"; emoji +
  // "XX% ENFOQUE HOY" en "hero", que es el número real que pidió la
  // doctora en vez de inventar uno).
  const ringBlock = (
    <div
      style={{
        position: "relative",
        width: `${ringSize}px`,
        height: `${ringSize + 10}px`,
        flexShrink: 0,
      }}
    >
      {isHero && (
        <button
          type="button"
          onClick={toggleSound}
          aria-label={soundOn ? t.mascot.muteSoundLabel : t.mascot.unmuteSoundLabel}
          title={soundOn ? t.mascot.muteSoundLabel : t.mascot.unmuteSoundLabel}
          style={{
            // 9 de noviembre de 2026: un poco más chico y más adentro
            // (antes -6px/26px) para que, con los 6 accesos de la
            // brújula (QuickAccessCompass.jsx), el de arriba-derecha no
            // quede pisando este botón — ver la nota junto a
            // ORBIT_ANCHORS ahí.
            position: "absolute",
            top: "-2px",
            right: "-2px",
            zIndex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "50%",
            color: C.textMuted,
            cursor: "pointer",
            width: "22px",
            height: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.85,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {soundOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      )}
      <div
        className="anro-mascot-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint(ringColor, 0.35)} 0%, transparent 70%)`,
        }}
      />
      <svg
        width={ringSize}
        height={ringSize}
        viewBox={`0 0 ${ringSize} ${ringSize}`}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringRadius}
          fill="none"
          stroke={C.surfaceAlt}
          strokeWidth={ringStroke}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={ringRadius}
          fill="none"
          stroke={ringColor}
          strokeWidth={ringStroke}
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          display: "flex",
          flexDirection: isHero ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          fontSize: `${emojiFontSize}px`,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        <span
          className={`anro-mascot-emoji${isAquatic ? " anro-mascot-emoji-aquatic" : ""}${
            celebrate ? " anro-mascot-celebrate" : ""
          }${hatching ? " anro-mascot-hatch" : ""}${distracted ? " anro-mascot-distracted-anim" : ""}`}
        >
          {stage.emoji}
        </span>
        {hatching && (
          <>
            <span className="anro-mascot-spark anro-mascot-spark-a" aria-hidden="true">
              ✨
            </span>
            <span className="anro-mascot-spark anro-mascot-spark-b" aria-hidden="true">
              ✨
            </span>
          </>
        )}
        {isHero && (
          <div style={{ marginTop: "1px", lineHeight: 1.15, textAlign: "center" }}>
            <div style={{ fontSize: "17px", fontWeight: 800, color: C.text }}>
              {Math.round(focusPercent || 0)}%
            </div>
            <div
              style={{
                fontSize: "7.5px",
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {t.mascot.focusTodayLabel}
            </div>
          </div>
        )}
      </div>
      {/* Sombra de "piso" — sensación de que la mascota está apoyada en
          algo, no flotando en el vacío. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "58%",
          height: "10px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.28), transparent 72%)",
          filter: "blur(1px)",
        }}
      />
      {/* Accesorio cosmético desbloqueable por puntos (8 de noviembre de
          2026, ver ACCESSORY_EMOJI en mascotLogic.js y xpMilestones.js) —
          una insignia chica encima de la mascota, no un disfraz de verdad
          (la mascota sigue siendo un solo emoji) para no complicar el
          dibujo. "none" no renderiza nada. */}
      {ACCESSORY_EMOJI[accessory] && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            fontSize: isHero ? "30px" : "26px",
            lineHeight: 1,
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
          }}
        >
          {ACCESSORY_EMOJI[accessory]}
        </span>
      )}
    </div>
  );

  if (isHero) {
    // 9 de noviembre de 2026 — rediseño "estilo K": sin tarjeta propia, sin
    // degradado ni sombra de tarjeta — acá SOLO el círculo de anillo+emoji+%
    // (lo que vive dentro del centro de QuickAccessCompass.jsx). El
    // label/hint y las píldoras de racha/mejor racha/enfoque que antes
    // vivían a la derecha de la tarjeta ya NO se pintan desde acá: se
    // relocalizan debajo de toda la brújula (dial + accesos), donde caben
    // mejor que apretadas dentro de un círculo — ver QuickAccessCompass.jsx,
    // que las vuelve a armar con stageFor() (misma función pura que usa
    // este archivo) para no perder esa información, solo reacomodarla.
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`
        @keyframes anroMascotFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(2deg); }
          50% { transform: translateY(-4px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(-2deg); }
        }
        @keyframes anroMascotFloatAquatic {
          0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
          25% { transform: translateY(-2px) translateX(3px) rotate(-4deg); }
          50% { transform: translateY(-4px) translateX(0) rotate(0deg); }
          75% { transform: translateY(-2px) translateX(-3px) rotate(4deg); }
        }
        @keyframes anroMascotGlow {
          0%, 100% { opacity: 0.32; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.08); }
        }
        @keyframes anroMascotLevelUp {
          0% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.32) rotate(-8deg); }
          55% { transform: scale(0.95) rotate(6deg); }
          80% { transform: scale(1.08) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes anroMascotHatch {
          0% { transform: scale(1) rotate(0deg); }
          14% { transform: scale(0.92) rotate(-10deg); }
          28% { transform: scale(0.94) rotate(9deg); }
          42% { transform: scale(0.88) rotate(-7deg); }
          54% { transform: scale(0.25) rotate(0deg); opacity: 0.35; }
          70% { transform: scale(1.4) rotate(5deg); opacity: 1; }
          85% { transform: scale(0.93) rotate(-3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes anroMascotSparkA {
          0%, 54% { transform: translate(0, 0) scale(0); opacity: 0; }
          68% { transform: translate(-24px, -20px) scale(1); opacity: 1; }
          100% { transform: translate(-38px, -34px) scale(0.3); opacity: 0; }
        }
        @keyframes anroMascotSparkB {
          0%, 54% { transform: translate(0, 0) scale(0); opacity: 0; }
          68% { transform: translate(26px, -16px) scale(1); opacity: 1; }
          100% { transform: translate(42px, -30px) scale(0.3); opacity: 0; }
        }
        @keyframes anroMascotDistracted {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-4px) rotate(-6deg); }
          40% { transform: translateX(4px) rotate(6deg); }
          60% { transform: translateX(-3px) rotate(-4deg); }
          80% { transform: translateX(3px) rotate(3deg); }
        }
        .anro-mascot-emoji {
          display: inline-block;
          animation: anroMascotFloat 3.6s ease-in-out infinite;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.2));
        }
        .anro-mascot-emoji.anro-mascot-emoji-aquatic {
          animation: anroMascotFloatAquatic 4.2s ease-in-out infinite;
        }
        .anro-mascot-emoji.anro-mascot-celebrate {
          animation: anroMascotLevelUp 0.9s ease-in-out;
        }
        .anro-mascot-emoji.anro-mascot-hatch {
          animation: anroMascotHatch 1.1s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .anro-mascot-emoji.anro-mascot-distracted-anim {
          animation: anroMascotDistracted 0.6s ease-in-out;
        }
        .anro-mascot-glow {
          animation: anroMascotGlow 2.8s ease-in-out infinite;
        }
        .anro-mascot-spark {
          position: absolute;
          top: 50%;
          left: 50%;
          font-size: 20px;
          opacity: 0;
          pointer-events: none;
        }
        .anro-mascot-spark-a {
          animation: anroMascotSparkA 1.1s ease-out;
        }
        .anro-mascot-spark-b {
          animation: anroMascotSparkB 1.1s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .anro-mascot-emoji,
          .anro-mascot-emoji.anro-mascot-emoji-aquatic,
          .anro-mascot-emoji.anro-mascot-celebrate,
          .anro-mascot-emoji.anro-mascot-hatch,
          .anro-mascot-emoji.anro-mascot-distracted-anim,
          .anro-mascot-glow,
          .anro-mascot-spark-a,
          .anro-mascot-spark-b {
            animation: none !important;
          }
        }
      `}</style>
        {ringBlock}
      </div>
    );
  }

  // Variante "card" — sin cambios de comportamiento ni de tamaño respecto
  // a como vivía antes del rediseño "estilo K" (sigue siendo la misma
  // tarjeta ancha con gradiente, usada hoy solo por el recorrido de
  // bienvenida si llegara a necesitarse de nuevo fuera de Inicio); ahora
  // reutiliza los mismos bloques `ringBlock`/`streakPill`/`trophyPill`/
  // `focusPill` que la variante "hero" en vez de repetir el JSX.
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`,
        borderRadius: "24px",
        padding: "20px 22px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "18px",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <button
        type="button"
        onClick={toggleSound}
        aria-label={soundOn ? t.mascot.muteSoundLabel : t.mascot.unmuteSoundLabel}
        title={soundOn ? t.mascot.muteSoundLabel : t.mascot.unmuteSoundLabel}
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1,
          background: "transparent",
          border: "none",
          color: C.textMuted,
          cursor: "pointer",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.55,
        }}
      >
        {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint(ringColor, 0.22)} 0%, transparent 70%)`,
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />
      {ringBlock}
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: C.text }}>{label}</div>
        <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "2px" }}>{hint}</div>
      </div>
      {streakPill}
      {trophyPill}
      {focusPill}
    </div>
  );
}
