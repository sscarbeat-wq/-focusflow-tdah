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
  isImageSpecies,
} from "./mascotLogic";
import { MascotArt, MascotSprite } from "./MascotSprite";
import CelebrationBurst from "./CelebrationBurst";
import { tapFeedback } from "./celebrate";
import { playAnimalSound } from "./animalSounds";
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
// Valores "hero" de siempre, pensados para el teléfono más angosto que
// soporta la app (verificado con Playwright a 320px, junto con
// QuickAccessCompass.jsx: CENTER_SIZE/BUTTON_SIZE/ORBIT_ANCHORS ahí
// dependen de que el anillo real mida ESTO por default). Quedan como
// piso/default — ver la nota de la sexta corrección más abajo para cómo
// se agranda en pantallas anchas sin tocar este piso.
const HERO_RING_SIZE = 150;
const HERO_RING_RADIUS = 62;
const HERO_RING_STROKE = 10;
const HERO_EMOJI_SIZE = 40;

// 9 de noviembre de 2026, sexta corrección de fidelidad: con el fondo de
// color ahora ocupando casi toda la pantalla (ver la nota de "cubre toda
// la app" en FocusFlowTDAH.jsx), en pantallas anchas la mascota y la
// brújula se veían chicas y perdidas en medio de tanto espacio — la
// doctora pidió agrandar el animal y los círculos de acceso. PERO: en el
// teléfono más angosto que soporta la app (320px) no hay lugar físico
// para agrandar el anillo Y los 6 accesos a la vez sin que empiecen a
// pisarse (verificado con Playwright: agrandar ambos ahí rompía el
// "mantener presionado para fijar"). Por eso el agrandado es SOLO para
// escritorio/pantallas anchas: QuickAccessCompass.jsx manda
// `heroRingSize`/etc. más grandes únicamente cuando hay sitio (>=760px,
// mismo punto de corte que ya usa el resto de la app); en el teléfono
// estos props vienen undefined y se usan los defaults de arriba, igual
// que siempre.
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
  heroRingSize = HERO_RING_SIZE,
  heroRingRadius = HERO_RING_RADIUS,
  heroRingStroke = HERO_RING_STROKE,
  heroEmojiSize = HERO_EMOJI_SIZE,
  // Puntos de "foco acumulado" — solo para notar cuándo SUBEN y hacer que
  // la mascota coma (10 de noviembre de 2026, ver MascotSprite.jsx).
  xp,
  // Cómo va el día (10 de noviembre de 2026, "que reaccione a tu día"):
  // "good" (ya hizo algo hoy) | "quiet" (todavía nada y ya es de día) |
  // "night" (de noche) | "neutral". Lo calcula FocusFlowTDAH.jsx.
  dayMood = "neutral",
  // Explicaciones del centro (10 de noviembre de 2026, "el paciente tiene
  // que saber para qué es"): minutos de Modo Enfoque de hoy y la meta,
  // el siguiente premio que se desbloquea con XP ({ remaining, name } o
  // null si ya tiene todo), y a dónde llevan los botones de cada globito.
  focusMinutes = 0,
  focusGoal = 50,
  nextUnlock = null,
  onStartFocus,
  onSeeRewards,
  // Aviso suave de Plus (10 de noviembre de 2026): solo justo después de
  // que la mascota crece (un momento feliz), nunca más de una vez por
  // semana, y nunca si ya tiene Plus.
  isPlus = true,
  onRequestUpgrade,
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
  const hasArt = isImageSpecies(resolvedSpecies);

  // Interacción con la mascota (10 de noviembre de 2026, "quiero que la
  // app sea interactiva"): tocarla la hace saludar, un doble toque la pone
  // a jugar, y cada vez que suben los puntos de "foco acumulado" come algo
  // — así ganar puntos se VE, no solo se cuenta. Ver MascotSprite.jsx.
  const [tapSignal, setTapSignal] = useState(0);
  const [playSignal, setPlaySignal] = useState(0);
  const [eatSignal, setEatSignal] = useState(0);
  const lastTapRef = useRef(0);
  const handlePet = () => {
    tapFeedback("tap");
    const now = Date.now();
    // Cada animal tiene su sonidito (animalSounds.js): "hola" al tocar,
    // más agudo y juguetón con doble toque. Respeta el botón de silencio.
    if (now - lastTapRef.current < 450) {
      setPlaySignal((n) => n + 1);
      lastTapRef.current = 0;
      if (soundOnRef.current) playAnimalSound(resolvedSpecies, "play");
    } else {
      setTapSignal((n) => n + 1);
      lastTapRef.current = now;
      if (soundOnRef.current) playAnimalSound(resolvedSpecies, "greet");
    }
  };
  // Celebraciones (10 de noviembre de 2026): al cargar la app los puntos y
  // la racha llegan de Supabase un momento DESPUÉS de montar (de 0 a lo
  // guardado) — eso no es un logro nuevo. Durante los primeros segundos
  // no se festeja nada.
  const mountedAtRef = useRef(Date.now());
  const settled = () => Date.now() - mountedAtRef.current > 3500;
  const [smallBurst, setSmallBurst] = useState(0);
  const [bigBurst, setBigBurst] = useState(0);
  // Casi todos los puntos se ganan FUERA de Inicio (en Herramientas,
  // Agenda...), donde la brújula está oculta (display:none, sin
  // desmontarse). Festejar ahí sería festejar sin que nadie lo vea: los
  // festejos se guardan y se disparan en cuanto la paciente vuelve a ver
  // a su mascota.
  const heroRef = useRef(null);
  const pendingRef = useRef({ eat: false, small: false, big: false, play: false, evolution: null });
  const pollRef = useRef(null);
  const isShown = () => !heroRef.current || heroRef.current.offsetParent !== null;
  const evolutionTimeoutRef = useRef(null);
  const flushPending = () => {
    const p = pendingRef.current;
    pendingRef.current = { eat: false, small: false, big: false, play: false, evolution: null };
    if (p.evolution) {
      setEvolution(p.evolution);
      maybeShowPlusHint();
      if (soundOnRef.current) playAnimalSound(resolvedSpecies, "evolve");
      if (evolutionTimeoutRef.current) clearTimeout(evolutionTimeoutRef.current);
      evolutionTimeoutRef.current = setTimeout(() => setEvolution(null), 2600);
    }
    if (p.big || p.evolution) setBigBurst((n) => n + 1);
    else if (p.small) setSmallBurst((n) => n + 1);
    if (p.play) {
      setPlaySignal((n) => n + 1);
      if (soundOnRef.current) playAnimalSound(resolvedSpecies, "play");
    } else if (p.eat) {
      setEatSignal((n) => n + 1);
      if (soundOnRef.current) playAnimalSound(resolvedSpecies, "eat");
    }
  };
  const queueCelebration = (changes) => {
    const p = pendingRef.current;
    if (changes.evolution) {
      p.evolution = { from: p.evolution ? p.evolution.from : changes.evolution.from, to: changes.evolution.to };
    }
    ["eat", "small", "big", "play"].forEach((k) => {
      if (changes[k]) p[k] = true;
    });
    if (isShown()) {
      flushPending();
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (isShown()) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        // Un respiro para que la pantalla ya esté pintada antes del festejo.
        setTimeout(flushPending, 350);
      }
    }, 600);
  };
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (evolutionTimeoutRef.current) clearTimeout(evolutionTimeoutRef.current);
    },
    []
  );

  const prevXpRef = useRef(xp);
  useEffect(() => {
    if (typeof xp === "number" && typeof prevXpRef.current === "number" && xp > prevXpRef.current) {
      if (settled() && isHero) queueCelebration({ eat: true, small: true });
      else setEatSignal((n) => n + 1);
    }
    prevXpRef.current = xp;
  }, [xp]); // eslint-disable-line react-hooks/exhaustive-deps
  // Subió la racha del día (la primera acción de hoy): festejo grande y la
  // mascota se pone a jugar.
  const prevCurrentRef = useRef(current);
  useEffect(() => {
    if (current > prevCurrentRef.current && settled() && isHero) {
      queueCelebration({ big: true, play: true });
    }
    prevCurrentRef.current = current;
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Globito de la mascota según cómo va el día — corto, amable, nunca un
  // regaño; se va solo. "quiet": cada ~50s rota entre 3 frases suaves.
  // "good"/"night": una sola vez, un rato después de entrar.
  const [nudge, setNudge] = useState(null);
  const [plusHint, setPlusHint] = useState(false);
  const plusHintTimers = useRef([]);
  const maybeShowPlusHint = () => {
    if (isPlus || !onRequestUpgrade || !t.mascot.plusHint) return;
    const KEY = "anro-plus-hint-at";
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    try {
      const last = Number(window.localStorage.getItem(KEY) || 0);
      if (Date.now() - last < WEEK) return;
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch (e) {
      /* sin localStorage: se muestra igual, una vez por sesión basta */
    }
    // Después de la animación de "¡Creció!", no encima de ella.
    plusHintTimers.current.push(
      setTimeout(() => {
        setPlusHint(true);
        plusHintTimers.current.push(setTimeout(() => setPlusHint(false), 9000));
      }, 2800)
    );
  };
  useEffect(() => () => plusHintTimers.current.forEach(clearTimeout), []);
  // Globito de explicación abierto: "focus" | "xp" | null.
  const [infoOpen, setInfoOpen] = useState(null);
  useEffect(() => {
    if (!infoOpen) return undefined;
    // Se cierra al tocar en cualquier otra parte (sin un fondo a pantalla
    // completa: dentro de la brújula, `position: fixed` quedaría atrapado
    // en el círculo por su transform).
    const onDown = (e) => {
      if (e.target.closest && (e.target.closest("[data-anro-info-card]") || e.target.closest("[data-anro-info]"))) return;
      setInfoOpen(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setInfoOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [infoOpen]);
  useEffect(() => {
    if (!isHero) return undefined;
    const timers = [];
    const show = (text, ms) => {
      setNudge(text);
      timers.push(setTimeout(() => setNudge(null), ms));
    };
    if (dayMood === "quiet") {
      const list = t.mascot.dayNudges || [];
      let i = 0;
      const cycle = () => {
        if (!list.length) return;
        show(list[i % list.length], 7000);
        i += 1;
        timers.push(setTimeout(cycle, 50000));
      };
      timers.push(setTimeout(cycle, 5000));
    } else if (dayMood === "good" && t.mascot.goodNudge) {
      timers.push(setTimeout(() => show(t.mascot.goodNudge, 5000), 4000));
    } else if (dayMood === "night" && t.mascot.nightNudge) {
      timers.push(setTimeout(() => show(t.mascot.nightNudge, 6000), 4000));
    }
    return () => {
      timers.forEach(clearTimeout);
      setNudge(null);
    };
  }, [dayMood, isHero, t]);

  const ringSize = isHero ? heroRingSize : RING_SIZE;
  const ringRadius = isHero ? heroRingRadius : RING_RADIUS;
  const ringStroke = isHero ? heroRingStroke : RING_STROKE;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const emojiFontSize = isHero ? heroEmojiSize : 56;
  // Qué tanto más grande que el piso de siempre (150px) vino el anillo
  // "hero" — en escritorio QuickAccessCompass.jsx manda un heroRingSize
  // más grande (ver nota arriba), y el botón de silenciar + el texto del
  // % necesitan crecer EN PROPORCIÓN para seguir viéndose bien pegados al
  // anillo, en vez de quedar chicos y perdidos (o, al revés, más grandes
  // de lo necesario) frente a un anillo que cambia de tamaño.
  const heroScale = isHero ? heroRingSize / HERO_RING_SIZE : 1;
  // Hero: el anillo muestra el % real de enfoque de hoy, no el avance de
  // racha — son dos cosas distintas (ver comentario arriba de HERO_RING_SIZE).
  const ringFraction = isHero ? Math.max(0, Math.min(1, (focusPercent || 0) / 100)) : fraction;
  const dashOffset = ringCircumference * (1 - ringFraction);

  // Sonidos (gratis, preferencia de dispositivo) — ver mascotSounds.js.
  const [soundOn, setSoundOn] = useState(() => getStoredMascotSoundPref());
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

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
  // Evolución (10 de noviembre de 2026): cuando la mascota cambia de etapa
  // de verdad (no al cargar), se ve el cambio — destello, la de antes se
  // encoge, la nueva aparece creciendo — con confeti y "¡Creció!".
  const [evolution, setEvolution] = useState(null); // { from, to }

  useEffect(() => {
    if (prevEmojiRef.current !== stage.emoji) {
      const wasEgg = prevEmojiRef.current === EGG_EMOJI;
      const fromVisual = prevEmojiRef.current;
      prevEmojiRef.current = stage.emoji;
      if (!isReset && isHero && settled()) {
        queueCelebration({ evolution: { from: fromVisual, to: stage.emoji } });
        return undefined;
      }
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
            // ORBIT_ANCHORS ahí. Sexta corrección: escalado con
            // `heroScale` (1 en el teléfono, más en escritorio) para
            // seguir viéndose proporcionado sea cual sea el tamaño real
            // del anillo.
            // Décima corrección (10 de noviembre de 2026): ahora los 6
            // accesos pasan por TODOS los ángulos al girar en órbita, así
            // que este botón ya no puede asomarse fuera del círculo blanco
            // de la mascota (en la esquina de la caja del anillo quedaba
            // afuera, justo en el camino de los accesos). Va 18px hacia
            // adentro — montado sobre el anillo, dentro del círculo a
            // cualquier tamaño (√2·(75−18−11)+11 ≈ 76 < 80) — y ABAJO a la
            // derecha en vez de arriba: las etiquetas de los accesos
            // cuelgan hacia abajo, así que la de un acceso que pasa por
            // arriba llegaba a taparlo (verificado con Playwright: ~1/5 del
            // tiempo); abajo, ninguna etiqueta llega nunca.
            // Ajuste del mismo día: en diagonal exacta (las "4:30") rozaba
            // el texto "ENFOQUE HOY" ya agrandado; ahora va sobre el anillo
            // a las "4:00" (120° desde arriba), a la derecha del texto.
            position: "absolute",
            top: `${ringSize / 2 + 65 * heroScale * 0.5 - 11 * heroScale}px`,
            right: `${ringSize / 2 - 65 * heroScale * 0.866 - 11 * heroScale}px`,
            zIndex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "50%",
            color: C.textMuted,
            cursor: "pointer",
            width: `${22 * heroScale}px`,
            height: `${22 * heroScale}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.85,
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          }}
        >
          {soundOn ? <Volume2 size={13 * heroScale} /> : <VolumeX size={13 * heroScale} />}
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
          className={`${hasArt ? "anro-mascot-art" : "anro-mascot-emoji"}${isAquatic ? " anro-mascot-emoji-aquatic" : ""}${
            celebrate ? " anro-mascot-celebrate" : ""
          }${hatching ? " anro-mascot-hatch" : ""}${distracted ? " anro-mascot-distracted-anim" : ""}`}
        >
          {isHero ? (
            // Ilustración: la caja mide ~1.9× el tamaño del emoji de
            // siempre — la imagen trae su propio contorno blanco y ocupa
            // menos "peso" visual que un emoji del mismo tamaño.
            <MascotSprite
              visual={stage.emoji}
              size={Math.round(emojiFontSize * 1.9)}
              hidden={!!evolution}
              dayMood={dayMood}
              tapSignal={tapSignal}
              playSignal={playSignal}
              eatSignal={eatSignal}
              walking={focusStatus === "focusing"}
            />
          ) : hasArt ? (
            <MascotArt visual={stage.emoji} size={Math.round(emojiFontSize * 1.4)} />
          ) : (
            stage.emoji
          )}
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
          // Escalado con `heroScale` (sexta corrección) junto con el
          // anillo — 1 en el teléfono (sin cambios), más grande en
          // escritorio, para no quedar chico al lado del anillo ahí.
          // Octava corrección (10 de noviembre de 2026, "las letras más
          // grandes"): la base subió de 17/7.5 a 20/9 — un empujón extra
          // de letra encima del escalado de siempre, que entra sin
          // problema dentro del mismo anillo (no cambia ningún tamaño de
          // afuera, solo el texto de adentro).
          <div style={{ marginTop: `${2 * heroScale}px`, lineHeight: 1.15, textAlign: "center" }}>
            <div style={{ fontSize: `${20 * heroScale}px`, fontWeight: 800, color: C.text }}>
              {Math.round(focusPercent || 0)}%
            </div>
            <div
              style={{
                fontSize: `${9 * heroScale}px`,
                fontWeight: 700,
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {t.mascot.focusTodayLabel}
            </div>
            {/* Los minutos reales detrás del % — "0%" solo no dice nada;
                "10 de 50 min" sí. */}
            {t.mascot.focusMinutes && (
              <div style={{ fontSize: `${8.5 * heroScale}px`, fontWeight: 600, color: C.textMuted, marginTop: `${1 * heroScale}px` }}>
                {t.mascot.focusMinutes(Math.round(focusMinutes || 0), focusGoal)}
              </div>
            )}
          </div>
        )}
      </div>
      {isHero && (
        // Zona para tocar a la mascota (saludo / doble toque: jugar). Va
        // aparte del dibujo porque ese bloque está oculto a lectores de
        // pantalla; este botón sí se anuncia. Cubre solo la parte de
        // arriba del círculo (donde está el animal), lejos del botón de
        // silenciar, que vive abajo a la derecha.
        <button
          type="button"
          onClick={handlePet}
          aria-label={t.mascot.petLabel}
          title={t.mascot.petLabel}
          style={{
            position: "absolute",
            top: `${ringSize * 0.14}px`,
            left: `${ringSize * 0.2}px`,
            width: `${ringSize * 0.6}px`,
            height: `${ringSize * 0.52}px`,
            borderRadius: "50%",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      )}
      {isHero && t.mascot.focusInfoTitle && (
        // Tocar el % (o los minutos) abre la explicación de qué mide.
        <button
          type="button"
          data-anro-info="focus"
          onClick={() => setInfoOpen((v) => (v === "focus" ? null : "focus"))}
          aria-label={t.mascot.focusInfoAria}
          aria-expanded={infoOpen === "focus"}
          style={{
            position: "absolute",
            top: `${ringSize * 0.64}px`,
            left: `${ringSize * 0.27}px`,
            width: `${ringSize * 0.46}px`,
            height: `${ringSize * 0.3}px`,
            borderRadius: "12px",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "help",
            WebkitTapHighlightColor: "transparent",
          }}
        />
      )}
      {isHero && typeof xp === "number" && t.mascot.xpBadge && (
        // XP junto al % (10 de noviembre de 2026): una pastillita en el
        // borde de abajo del círculo; al tocarla explica qué son y cuánto
        // falta para el siguiente premio.
        <button
          type="button"
          data-anro-info="xp"
          onClick={() => setInfoOpen((v) => (v === "xp" ? null : "xp"))}
          aria-label={t.mascot.xpBadgeAria(Math.round(xp))}
          aria-expanded={infoOpen === "xp"}
          style={{
            position: "absolute",
            top: `${ringSize - 4 * heroScale}px`,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            gap: `${4 * heroScale}px`,
            whiteSpace: "nowrap",
            padding: `${3 * heroScale}px ${10 * heroScale}px`,
            borderRadius: "999px",
            border: "2px solid #fff",
            background: ringColor,
            color: "#fff",
            fontSize: `${11 * heroScale}px`,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: `0 4px 10px ${tint(ringColor, 0.45)}`,
          }}
        >
          <span aria-hidden="true">★</span>
          {t.mascot.xpBadge(Math.round(xp))}
        </button>
      )}
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
      <div ref={heroRef} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        /* Ilustración (MascotSprite.jsx): el balanceo de reposo lo hace el
           propio sprite (entre sus imágenes), aquí solo la sombra y los
           mismos festejos de etapa que el emoji. */
        .anro-mascot-art {
          display: inline-block;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.16));
        }
        .anro-mascot-art.anro-mascot-celebrate {
          animation: anroMascotLevelUp 0.9s ease-in-out;
        }
        .anro-mascot-art.anro-mascot-hatch {
          animation: anroMascotHatch 1.1s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .anro-mascot-art.anro-mascot-distracted-anim {
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
          .anro-mascot-art.anro-mascot-celebrate,
          .anro-mascot-art.anro-mascot-hatch,
          .anro-mascot-art.anro-mascot-distracted-anim,
          .anro-mascot-glow,
          .anro-mascot-spark-a,
          .anro-mascot-spark-b {
            animation: none !important;
          }
        }
        @keyframes anroEvoFlash { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.3); } 35% { opacity: .95; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.5); } }
        @keyframes anroEvoOut { 0% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 20% { transform: translate(-50%,-50%) scale(1.08) rotate(-6deg); } 45% { opacity: 0; transform: translate(-50%,-50%) scale(.2) rotate(8deg); } 100% { opacity: 0; } }
        @keyframes anroEvoIn { 0%, 40% { opacity: 0; transform: translate(-50%,-50%) scale(.2); } 62% { opacity: 1; transform: translate(-50%,-50%) scale(1.25); } 80% { transform: translate(-50%,-50%) scale(.94); } 100% { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes anroEvoTag { 0%, 50% { opacity: 0; transform: translate(-50%, 6px) scale(.8); } 65% { opacity: 1; transform: translate(-50%, 0) scale(1.08); } 90% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -6px); } }
        @keyframes anroNudgeIn { 0% { opacity: 0; transform: translate(-50%, calc(-100% + 8px)) scale(.9); } 100% { opacity: 1; transform: translate(-50%, -100%) scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .anro-evo-flash, .anro-evo-out, .anro-evo-in, .anro-evo-tag, .anro-nudge { animation-duration: 0.01s !important; }
        }
      `}</style>
        {ringBlock}
        <CelebrationBurst signal={smallBurst} size="small" />
        <CelebrationBurst signal={bigBurst} size="big" />
        {evolution && (
          // Evolución: la de antes se encoge y la nueva aparece creciendo,
          // con un destello del color de la paciente detrás.
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
            <span
              className="anro-evo-flash"
              style={{
                position: "absolute",
                left: "50%",
                top: "40%",
                width: `${ringSize * 0.8}px`,
                height: `${ringSize * 0.8}px`,
                borderRadius: "50%",
                background: `radial-gradient(circle, #FFFFFF 0%, ${tint(ringColor, 0.55)} 45%, transparent 72%)`,
                animation: "anroEvoFlash 1.6s ease-out forwards",
              }}
            />
            <span className="anro-evo-out" style={{ position: "absolute", left: "50%", top: "40%", animation: "anroEvoOut 2.4s ease-in-out forwards" }}>
              <MascotArt visual={evolution.from} size={Math.round(emojiFontSize * 1.9)} />
            </span>
            <span className="anro-evo-in" style={{ position: "absolute", left: "50%", top: "40%", animation: "anroEvoIn 2.4s ease-out forwards" }}>
              <MascotArt visual={evolution.to} size={Math.round(emojiFontSize * 1.9)} />
            </span>
            <span
              className="anro-evo-tag"
              style={{
                position: "absolute",
                left: "50%",
                top: "-6px",
                whiteSpace: "nowrap",
                background: ringColor,
                color: "#fff",
                fontWeight: 800,
                fontSize: `${13 * heroScale}px`,
                padding: `${4 * heroScale}px ${12 * heroScale}px`,
                borderRadius: "999px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                animation: "anroEvoTag 2.6s ease-out forwards",
              }}
            >
              {t.mascot.evolvedLabel}
            </span>
          </span>
        )}
        {plusHint && !evolution && (
          <button
            type="button"
            onClick={() => {
              setPlusHint(false);
              onRequestUpgrade();
            }}
            aria-label={t.mascot.plusHintAria}
            style={{
              position: "absolute",
              left: "50%",
              top: `${-4 * heroScale}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 8,
              width: "max-content",
              maxWidth: `${210 * Math.min(heroScale, 1.25)}px`,
              background: C.surface,
              color: C.text,
              border: `1.5px solid ${tint(C.amber, 0.7)}`,
              borderRadius: "14px",
              padding: `${7 * Math.min(heroScale, 1.25)}px ${12 * Math.min(heroScale, 1.25)}px`,
              fontSize: `${12.5 * Math.min(heroScale, 1.25)}px`,
              fontWeight: 700,
              lineHeight: 1.3,
              textAlign: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              cursor: "pointer",
              animation: "anroNudgeIn 0.35s ease-out",
            }}
          >
            <span aria-hidden="true">✨ </span>
            {t.mascot.plusHint}
            <span style={{ display: "block", marginTop: "4px", color: C.amber, fontSize: "0.9em" }}>{t.mascot.plusHintAria} →</span>
          </button>
        )}
        {nudge && !evolution && !plusHint && (
          <span
            role="status"
            className="anro-nudge"
            style={{
              position: "absolute",
              left: "50%",
              top: `${-4 * heroScale}px`,
              transform: "translate(-50%, -100%)",
              zIndex: 7,
              width: "max-content",
              maxWidth: `${200 * Math.min(heroScale, 1.25)}px`,
              background: C.surface,
              color: C.text,
              border: `1.5px solid ${tint(ringColor, 0.5)}`,
              borderRadius: "14px",
              padding: `${6 * Math.min(heroScale, 1.25)}px ${11 * Math.min(heroScale, 1.25)}px`,
              fontSize: `${13 * Math.min(heroScale, 1.25)}px`,
              fontWeight: 700,
              lineHeight: 1.3,
              textAlign: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              pointerEvents: "none",
              animation: "anroNudgeIn 0.35s ease-out",
            }}
          >
            {nudge}
          </span>
        )}
        {infoOpen && (
          <div
            role="dialog"
            aria-label={infoOpen === "focus" ? t.mascot.focusInfoTitle : t.app.xpInfoLabel}
            data-anro-info-card="true"
            style={{
              position: "absolute",
              top: `${ringSize + 26 * Math.min(heroScale, 1.25)}px`,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 30,
              width: `${250 * Math.min(heroScale, 1.2)}px`,
              maxWidth: "86vw",
              background: C.surface,
              color: C.text,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
              padding: "14px 16px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
              textAlign: "left",
            }}
          >
            <strong style={{ display: "block", fontSize: "14px", marginBottom: "6px" }}>
              {infoOpen === "focus" ? t.mascot.focusInfoTitle : t.app.xpInfoLabel}
            </strong>
            <p style={{ margin: "0 0 10px", fontSize: "13px", lineHeight: 1.5, color: C.textMuted }}>
              {infoOpen === "focus"
                ? t.mascot.focusInfoBody(Math.round(focusMinutes || 0), focusGoal)
                : t.app.xpInfoBody}
            </p>
            {infoOpen === "xp" && (
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: C.text }}>
                {nextUnlock ? t.mascot.xpNext(nextUnlock.remaining, nextUnlock.name) : t.mascot.xpAllUnlocked}
              </p>
            )}
            {((infoOpen === "focus" && onStartFocus) || (infoOpen === "xp" && onSeeRewards)) && (
              <button
                type="button"
                onClick={() => {
                  const wasFocus = infoOpen === "focus";
                  setInfoOpen(null);
                  if (wasFocus) onStartFocus();
                  else onSeeRewards(nextUnlock?.kind);
                }}
                style={{
                  width: "100%",
                  minHeight: "40px",
                  border: "none",
                  borderRadius: "12px",
                  background: ringColor,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {infoOpen === "focus" ? t.mascot.focusInfoButton : t.mascot.xpInfoButton}
              </button>
            )}
          </div>
        )}
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
