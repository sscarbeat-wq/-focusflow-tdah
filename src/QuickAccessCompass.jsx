import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";
import { tint, luminance } from "./theme";
import Mascot from "./Mascot";
import { tapFeedback } from "./celebrate";
import { stageFor, getStoredResetVariant, getStoredPinnedAccess, storePinnedAccess } from "./mascotLogic";

// 8 de noviembre de 2026 — reemplaza a la antigua `QuickAccessGrid.jsx`
// (cuadrícula rectangular) como parte del rediseño "estilo K" de Inicio.
// Primera corrección, 9 de noviembre: se agrandó el dial y se le devolvió
// la rotación, pero seguía siendo un anillo de accesos ALREDEDOR de una
// tarjeta <Mascot> separada — la doctora señaló, con los mockups
// originales en mano ("Opción K — brújula... ELEGIDA para Inicio"), que
// eso no era lo aprobado: el diseño real es UNA sola pieza circular
// (mascota + anillo de "% de enfoque de hoy" + accesos rápidos girando
// alrededor), no una tarjeta más un adorno aparte.
//
// Segunda pasada — reconstrucción fiel al mockup (9 de noviembre de 2026):
//   - El centro del dial ya NO es un ícono de brújula decorativo: es la
//     mascota real (<Mascot variant="hero">), con su anillo mostrando el
//     % REAL de enfoque de hoy (ver todayFocusPercent() en
//     focusSessionLog.js) en vez de un número inventado. Sigue habiendo
//     una sola mascota en toda la pantalla — FocusFlowTDAH.jsx ya no
//     renderiza su propia <Mascot> aparte, esta es la única.
//   - El label/hint de etapa y las píldoras de racha/mejor racha/estado de
//     enfoque, que antes vivían en la tarjeta ancha de <Mascot>, se
//     recalculan aquí (misma función pura `stageFor()`, nada de datos
//     nuevos) y se muestran DEBAJO de toda la brújula — no se pierde
//     ninguna información, solo cambia de layout horizontal a centrado
//     bajo el círculo, porque ya no cabe apretada dentro de un círculo
//     junto con la mascota.
//   - Las posiciones de los accesos ya no se calculan con un radio en
//     píxeles fijos — eso desbordaba el contenedor angosto del teléfono
//     más chico que soporta la app. Ahora se anclan en PORCENTAJE de la
//     propia caja del dial (que sí es responsiva via clamp()), así escala
//     igual en cualquier tamaño de pantalla sin un solo píxel fijo de por
//     medio.
//   - Nueva interacción del mockup original: "mantén presionado para fijar
//     uno arriba". Mantener presionado cualquier acceso (mouse o touch) lo
//     saca de la rueda que gira y lo deja fijo en la posición de arriba;
//     mantener presionado el que ya está fijado lo libera. Preferencia de
//     dispositivo (getStoredPinnedAccess/storePinnedAccess en
//     mascotLogic.js), mismo patrón que la especie o el sonido de la
//     mascota. Un tap/click normal (sin mantener) sigue navegando como
//     siempre — mantener presionado nunca interfiere con el uso normal.
//
// Tercera pasada (9 de noviembre de 2026) — la doctora reenvió los 3
// mockups originales completos ("Opción K — mañana/atardecer/noche") y
// resultó que el diseño real tiene 6 accesos repartidos cada 60° (no 4
// cada 90°): Próximo paso, Herramientas, Compañero, racha·puntos, Agenda y
// Ánimo — ver FocusFlowTDAH.jsx para de dónde sale cada uno. Este archivo
// no necesitó enterarse de CUÁLES son los 6 — sigue siendo genérico sobre
// `items` (cualquier cantidad) — solo cambió la geometría: 6 anclas en vez
// de 4, centro y botones un poco más chicos para que los 6 quepan sin
// desbordar en el teléfono más angosto que soporta la app (igual que
// antes, verificado con Playwright a 320/375px y 1100px), y 48s de giro
// (el período exacto del mockup, antes eran 60s).
// Estos 4 números están afinados específicamente para el teléfono más
// angosto que soporta la app (320px, verificado con Playwright): el
// anillo-hero de Mascot.jsx (150px) + aire alrededor, y 6 accesos cada
// 60° sin pisarse entre sí ni con el botón de silenciar. Quedan como
// piso/default para pantallas angostas — ver la nota de la sexta
// corrección más abajo (DESKTOP_SIZES) para cómo crecen en pantallas
// anchas sin tocar este piso ya verificado.
const CENTER_SIZE = 160; // alcanza el anillo-hero (150px + 10px de sombra de piso) con aire alrededor
const BUTTON_SIZE = 38;
const ITEM_WIDTH = 64;
const SPIN_SECONDS = 48;
const LONG_PRESS_MS = 550;
// Sexta corrección de fidelidad (9 de noviembre de 2026): con el fondo ya
// ocupando casi toda la pantalla (quinta corrección, "en grande"), la
// doctora pidió agrandar también el animal y los círculos de acceso.
// Agrandar TODO por igual rompía el "mantener presionado para fijar" a
// 320px (verificado con Playwright: en el teléfono más angosto no hay
// sitio físico de más), así que el tamaño grande es solo para pantallas
// anchas. MOBILE_SIZES = los valores de siempre, ya verificados en
// teléfono; DESKTOP_SIZES = los grandes de escritorio.
const MOBILE_SIZES = {
  centerSize: CENTER_SIZE,
  buttonSize: BUTTON_SIZE,
  itemWidth: ITEM_WIDTH,
  // Radio de la órbita (centro del círculo de cada acceso → centro de la
  // mascota), en px. 124 = lo más que cabe en el teléfono más angosto
  // (320px): 124 + 32 (media etiqueta) = 156 ≤ 160 (media pantalla).
  orbitRadius: 124,
  labelFontSize: 10, // = BUTTON_SIZE * 0.263, la cuenta de siempre
  // Mismos valores que los defaults de Mascot.jsx (HERO_RING_SIZE etc.).
  heroRingSize: 150,
  heroRingRadius: 62,
  heroRingStroke: 10,
  heroEmojiSize: 40,
};
// Séptima/octava corrección (10 de noviembre de 2026): animal más grande
// (anillo 250px) y letras más grandes (18px), sin tocar el tamaño de los
// 6 accesos ni la rotación.
const DESKTOP_SIZES = {
  centerSize: 260, // 250px de anillo-hero + 10px de sombra de piso
  buttonSize: 54,
  itemWidth: 88,
  // 215: deja ~10px entre la etiqueta del acceso que pasa por arriba
  // (que cuelga hacia el centro) y el círculo de la mascota (radio 130).
  orbitRadius: 215,
  labelFontSize: 18,
  heroRingSize: 250,
  heroRingRadius: 105,
  heroRingStroke: 17,
  heroEmojiSize: 66,
};

// Novena corrección (10 de noviembre de 2026): antes había un corte seco
// en 760px — de un píxel al otro todo saltaba del tamaño de teléfono al de
// escritorio (se notaba como un "brinco" al redimensionar la ventana, y
// una tablet vertical de ~768px recibía de golpe el tamaño completo de
// escritorio). Ahora, entre TRANSITION_MIN y TRANSITION_MAX, cada medida
// pasa poco a poco de su valor de teléfono a su valor de escritorio. Fuera
// de ese rango todo queda exactamente igual que antes (<480: teléfono tal
// cual; >900: escritorio tal cual).
//
// Por qué esto no puede hacer que los accesos se encimen en medio de la
// transición: la órbita, el círculo central y los botones son las 3
// mezclas lineales con el MISMO factor `t` entre dos configuraciones ya
// verificadas. El espacio libre entre cada acceso y la mascota (órbita −
// botón/2 − centro/2) también es lineal en esas 3 medidas, así que en
// cualquier punto intermedio es un promedio ponderado de dos números
// positivos — siempre positivo. Igual se verificó con Playwright.
const TRANSITION_MIN = 480;
const TRANSITION_MAX = 900;

function clampNum(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function computeSizes(width) {
  const t = clampNum((width - TRANSITION_MIN) / (TRANSITION_MAX - TRANSITION_MIN), 0, 1);
  const out = {};
  for (const key of Object.keys(MOBILE_SIZES)) {
    out[key] = lerp(MOBILE_SIZES[key], DESKTOP_SIZES[key], t);
  }
  // Caja del dial: lo justo para que quepa la órbita con media etiqueta
  // de cada lado. Lo que cuelga de más abajo (la etiqueta del acceso que
  // pasa por abajo) se compensa con `extraBottom` como margen.
  out.dialSize = 2 * (out.orbitRadius + out.itemWidth / 2);
  const labelHeight = 2 * 1.2 * out.labelFontSize; // hasta 2 renglones
  out.extraBottom = Math.max(0, out.buttonSize / 2 + 5 + labelHeight - out.itemWidth / 2) + 4;
  return out;
}

function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

// Novena corrección, parte 2 — "que el giro no distraiga": la rueda se
// detiene en cuanto la paciente pone el mouse/dedo encima o navega con
// teclado a un acceso, para que nunca tenga que leer o tocar un blanco en
// movimiento, y vuelve a girar sola un rato después de que deja de
// interactuar. Complementa (no reemplaza) prefers-reduced-motion, que
// sigue apagando el giro por completo para quien lo tenga activado.
const RESUME_AFTER_LEAVE_MS = 1500;
const RESUME_AFTER_TOUCH_MS = 5000;

// Un solo botón de acceso — propio componente chico solo para no repetir
// la lógica de "mantener presionado" 4 veces en el render principal.
// Estilo del círculo de ícono según `item.variant` — 4 combinaciones
// tomadas directo del mockup (alternan relleno sólido/aro blanco y
// acento/acento2); sin `variant`, se queda con el estilo genérico de
// siempre (tinte suave del acento), para que el componente no se rompa si
// algún día se usa con items que no traigan esa etiqueta.
//
// Séptima corrección (9 de noviembre de 2026, "que se vean los botones
// como en 3D, como en el sistema solar"): cada círculo pasa de un color
// plano a una esfera con luz — un brillo blanco suave arriba-izquierda
// (como si la luz les pegara desde ahí) y una sombra sutil abajo-derecha,
// con el color de siempre todavía en el medio. Es el mismo truco que
// cualquier ilustración de "planeta": 2 capas de gradiente radial encima
// del color/fondo de base, nada de imágenes nuevas. La sombra que ya
// proyecta cada botón (`boxShadow`) también se agranda un poco para que
// se sientan "flotando" arriba de la pantalla, no pegados a ella — igual
// que un planeta orbitando, con su propia sombra.
// Planeta relleno de un color propio (ver planetColorsFor en theme.js):
// esfera con luz arriba-izquierda y sombra abajo-derecha, y el ícono en
// blanco u oscuro según qué tan claro sea el planeta.
function planetCircleStyle(color, accent, pinned) {
  const light = luminance(color) > 0.55;
  return {
    background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 40%), radial-gradient(circle at 72% 78%, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0) 60%), ${color}`,
    border: pinned ? "2px solid #fff" : "none",
    color: light ? "#1E2433" : "#FFFFFF",
    boxShadow: pinned
      ? `0 0 0 4px ${tint(color, 0.4)}, 0 6px 14px rgba(0,0,0,0.22)`
      : `0 6px 14px ${tint(color, 0.45)}, 0 2px 4px rgba(0,0,0,0.12)`,
  };
}

function iconCircleStyle(variant, accent, accent2, pinned) {
  const ringColor = variant === "accent2-solid" || variant === "accent2-outline" ? accent2 : accent;
  const sphereHighlight = "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 42%)";
  const sphereShade = "radial-gradient(circle at 72% 78%, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0) 58%)";
  if (variant === "accent-solid" || variant === "accent2-solid") {
    return {
      background: `${sphereHighlight}, ${sphereShade}, ${ringColor}`,
      border: pinned ? "2px solid #fff" : "none",
      color: "#fff",
      boxShadow: pinned
        ? `0 0 0 4px ${tint(ringColor, 0.35)}, 0 6px 14px rgba(0,0,0,0.22)`
        : "0 6px 14px rgba(0,0,0,0.22)",
    };
  }
  if (variant === "accent-outline" || variant === "accent2-outline") {
    return {
      background: `${sphereHighlight}, radial-gradient(circle at 72% 78%, ${tint(ringColor, 0.12)} 0%, rgba(255,255,255,0) 60%), #FFFFFF`,
      border: pinned ? `2px solid ${ringColor}` : `1.5px solid ${tint(ringColor, 0.45)}`,
      color: ringColor,
      boxShadow: pinned
        ? `0 0 0 4px ${tint(ringColor, 0.22)}, 0 6px 12px rgba(0,0,0,0.14)`
        : "0 6px 12px rgba(0,0,0,0.14)",
    };
  }
  return {
    background: `${sphereHighlight}, radial-gradient(circle at 72% 78%, ${tint(accent, 0.3)} 0%, rgba(255,255,255,0) 60%), ${tint(accent, 0.16)}`,
    border: pinned ? `2px solid ${accent}` : `1.5px solid ${tint(accent, 0.35)}`,
    color: accent,
    boxShadow: pinned
      ? `0 0 0 4px ${tint(accent, 0.22)}, 0 6px 12px rgba(0,0,0,0.14)`
      : "0 6px 12px rgba(0,0,0,0.14)",
  };
}

function CompassAccessButton({
  item,
  anchorStyle,
  pinned,
  onPin,
  onUnpin,
  onSelect,
  C,
  accent,
  accent2,
  t,
  textColor,
  buttonSize = BUTTON_SIZE,
  itemWidth = ITEM_WIDTH,
  labelFontSize: labelFontSizeProp,
  circleFilter,
  labelHalo,
  // Fondo de "pastilla" detrás de la etiqueta (temas con dibujo, ver
  // chipBg en FocusFlowTDAH.jsx): sobre estrellas, fresas o encaje, un
  // halo no basta para que se lea; una pastilla del color base del tema sí.
  labelChip,
  // Arrastrar para reacomodar (10 de noviembre de 2026, "más interactiva"):
  // solo si el padre manda estos 3 (si no, el acceso funciona como siempre).
  onDragStart,
  onDragMove,
  onDragEnd,
  dragging = false,
  isDropTarget = false,
  planetColor,
}) {
  const timerRef = useRef(null);
  // Arrastre: se activa al mover el dedo/mouse más de 10px con el botón
  // presionado — así un toque normal sigue siendo un toque, y "mantener
  // presionado sin moverse" sigue fijando el acceso arriba, como siempre.
  const dragRef = useRef(null);
  const [dragDelta, setDragDelta] = useState(null);
  const canDrag = typeof onDragEnd === "function";
  // El resto de medidas del botón (insignia de "fijado", tamaño de letra
  // de la etiqueta) se derivan de `buttonSize` en vez de ser números fijos
  // aparte — así, al recibir el tamaño más grande de escritorio
  // (DESKTOP_SIZES, sexta corrección), todo el botón crece junto y en
  // proporción, sin un segundo juego de números que mantener a mano.
  // `labelFontSize` (octava corrección, "las letras más grandes") es la
  // excepción: cuando viene mandado desde fuera se usa tal cual (más
  // grande que la cuenta proporcional de siempre), para poder agrandar
  // SOLO la letra sin que eso arrastre también el tamaño del círculo.
  const pinBadgeSize = buttonSize * 0.42;
  const pinIconSize = buttonSize * 0.26;
  const labelFontSize = labelFontSizeProp ?? buttonSize * 0.263;
  const firedRef = useRef(false);

  const startPress = (e) => {
    firedRef.current = false;
    if (canDrag && e) dragRef.current = { x: e.clientX, y: e.clientY, active: false };
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      if (pinned) onUnpin();
      else onPin(item.key);
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const handleMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.hypot(dx, dy) < 10) return;
      d.active = true;
      cancelPress();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {
        /* algunos navegadores no dejan capturar — el arrastre sigue igual */
      }
      onDragStart?.(item.key);
      tapFeedback("pick");
    }
    setDragDelta({ dx, dy });
    onDragMove?.(item.key, e.clientX, e.clientY);
  };
  const endDrag = (e, cancelled) => {
    cancelPress();
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.active) {
      // El click que sigue al soltar no debe además navegar.
      firedRef.current = true;
      setDragDelta(null);
      onDragEnd?.(item.key, cancelled ? null : e.clientX, cancelled ? null : e.clientY);
    }
  };
  const handleClick = () => {
    // Si el timeout de "mantener presionado" ya disparó el fijado/
    // desfijado, este click que sigue (mouseup dispara click igual,
    // aunque se haya mantenido presionado) no debe ADEMÁS navegar — sería
    // confuso fijar un acceso y que a la vez te saque de Inicio.
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    tapFeedback("tap");
    onSelect(item.key);
  };

  return (
    <div
      style={{
        ...anchorStyle,
        transform: dragDelta
          ? `translate(${dragDelta.dx}px, ${dragDelta.dy}px) scale(1.12)`
          : isDropTarget
          ? "scale(1.14)"
          : undefined,
        transition: dragDelta ? "none" : "transform 0.2s ease",
        filter: isDropTarget ? `drop-shadow(0 0 10px ${tint(accent, 0.9)})` : dragging ? "drop-shadow(0 10px 14px rgba(0,0,0,0.25))" : undefined,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerMove={canDrag ? handleMove : undefined}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerLeave={() => {
          if (!dragRef.current?.active) cancelPress();
        }}
        onPointerCancel={(e) => endDrag(e, true)}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={pinned ? `${item.label} — ${t.today.unpinAccessAria(item.label)}` : item.label}
        title={pinned ? t.today.unpinAccessAria(item.label) : t.today.pinAccessAria(item.label)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          width: `${itemWidth}px`,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: dragging ? "grabbing" : "pointer",
          // "none" (y no "manipulation") cuando se puede arrastrar: si no,
          // en el celular el navegador se queda con el movimiento del dedo
          // y el acceso nunca se mueve. En Inicio no hay nada que
          // desplazar, así que no se pierde nada.
          touchAction: canDrag ? "none" : "manipulation",
        }}
      >
        <span
          aria-hidden="true"
          data-orbit-icon="true"
          style={{
            position: "relative",
            width: `${buttonSize}px`,
            height: `${buttonSize}px`,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(planetColor ? planetCircleStyle(planetColor, accent, pinned) : iconCircleStyle(item.variant, accent, accent2, pinned)),
            // Novena corrección: de noche los círculos (sobre todo los
            // blancos) se atenúan y entibian un poco — ver circleFilter en
            // timeOfDayPalette.js. undefined de mañana/tarde = sin cambio.
            filter: circleFilter,
            transition: "filter 0.6s ease",
          }}
        >
          {/* Los íconos vienen de FocusFlowTDAH.jsx con tamaño fijo (18px,
              pensado para el círculo de 38px del teléfono); se escalan en
              proporción para que no se vean perdidos en el círculo más
              grande de escritorio. */}
          <span style={{ display: "flex", transform: `scale(${buttonSize / BUTTON_SIZE})` }}>{item.icon}</span>
          {pinned && (
            <span
              style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                width: `${pinBadgeSize}px`,
                height: `${pinBadgeSize}px`,
                borderRadius: "50%",
                background: accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <Pin size={pinIconSize} />
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: `${labelFontSize}px`,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.2,
            // Halo suave del color del fondo: cuando un acceso pasa por
            // arriba, su etiqueta cuelga hacia la mascota y en el teléfono
            // más angosto puede rozar unos píxeles el borde del círculo
            // blanco — el halo la mantiene legible también de noche.
            textShadow: labelChip ? "none" : labelHalo,
            ...(labelChip
              ? { background: labelChip, padding: "2px 8px", borderRadius: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }
              : {}),
          }}
        >
          {item.label}
        </span>
      </button>
    </div>
  );
}

// Décima corrección (10 de noviembre de 2026, "giran desfasados, se salen
// del círculo"): antes la rueda giraba con CSS (la rueda entera rotando +
// cada acceso contra-rotando para quedar derecho) y los 6 accesos estaban
// en DOS radios distintos (37% arriba/abajo, 45% en diagonal). Al girar,
// eso se veía como accesos que entraban y salían del aro punteado — unos
// encima de la línea, otros adentro — y si un acceso se volvía a montar
// (al editar los accesos, por ejemplo) su contra-giro arrancaba de cero
// mientras la rueda seguía en otro ángulo: quedaba chueco, desfasado.
//
// Ahora es una órbita de verdad, como un sistema solar: UN solo ángulo
// compartido (phaseRef) avanza con el tiempo y cada acceso se coloca en
// `fase + i·(360°/n)` sobre UN solo radio — exactamente encima del aro
// punteado, que ahora se dibuja con ese mismo radio. Nadie contra-rota
// (solo se trasladan, así que siempre están derechos) y no hay forma de
// que uno se desfase de los demás: todos salen de la misma cuenta.
// El centro del CÍRCULO del ícono es el que va sobre la órbita; la
// etiqueta cuelga debajo.
//
// Con un acceso fijado, la brújula se queda quieta (el fijado arriba, los
// demás repartidos en su lugar): antes los que giraban pasaban por encima
// del fijado al llegar arriba.
function orbitPoint(radius, angleRad) {
  return { x: radius * Math.sin(angleRad), y: -radius * Math.cos(angleRad) };
}

function usePrefersReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    onChange();
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}

export default function QuickAccessCompass({
  C,
  t,
  accent,
  accent2 = accent,
  items: itemsProp,
  onSelect,
  streak,
  species,
  focusStatus = "idle",
  accessory = "none",
  focusPercent = 0,
  // Puntos de "foco acumulado": la mascota come cuando suben (ver
  // MascotSprite.jsx). Opcional.
  xp,
  // Paleta automática por hora del día (timeOfDayPalette.js) — opcional,
  // así este componente sigue sirviendo igual si algún día se usa fuera
  // de un fondo con degradado. Cuando se manda, todo el texto de ADENTRO
  // de la brújula (etiquetas de los 6 accesos, racha/mejor racha, el
  // pie de "los accesos giran solos") usa sus colores en vez de los del
  // tema claro/oscuro de siempre — si no, ese texto oscuro (pensado para
  // un fondo claro/oscuro fijo) quedaba casi invisible sobre un fondo de
  // noche oscuro o de atardecer cálido. El círculo central (la mascota)
  // se queda con los colores de siempre (C.surface/C.surfaceAlt): en los
  // 3 mockups ese círculo sigue blanco/claro incluso de noche, a propósito
  // (es "la ventana" fija en medio del fondo que sí cambia). El acento
  // (accent — color personal que ya elige la paciente) tampoco cambia con
  // la hora: solo el fondo y el texto son automáticos, el acento sigue
  // siendo 100% su elección en toda la app, acá también.
  palette = null,
  // Cómo va el día, para la mascota (ver Mascot.jsx). Opcional.
  dayMood = "neutral",
  // Arrastrar un acceso encima de otro los intercambia de lugar; el padre
  // recibe el nuevo orden de keys y lo guarda (10 de noviembre de 2026).
  onReorder,
  // Color de cada planeta, en orden de lugar en la órbita (ver
  // planetColorsFor en theme.js). Sin esto, el estilo de siempre.
  planetColors,
  // Pasan tal cual a la mascota del centro (explicaciones del % y los XP).
  focusMinutes,
  focusGoal,
  nextUnlock,
  onStartFocus,
  onSeeRewards,
  isPlus,
  onRequestUpgrade,
  // Cuarto de la mascota (estilo Pou): botón debajo de la brújula, con un
  // iconito si alguna necesidad está bajita (ver petNeeds.js).
  onOpenRoom,
  roomBadge,
}) {
  const textColor = palette ? palette.text : C.text;
  const mutedColor = palette ? palette.textMuted : C.textMuted;
  // Sexta corrección de fidelidad (9 de noviembre de 2026): "el animal más
  // grande, los círculos grandes" — ver la nota junto a DESKTOP_SIZES más
  // arriba para por qué este agrandado es solo de >=760px en adelante.
  const viewportWidth = useViewportWidth();
  const sizes = computeSizes(viewportWidth);
  const circleFilter = palette?.circleFilter;
  const haloColor = palette?.bg || C.bg;
  const labelHalo = haloColor
    ? `0 0 3px ${haloColor}, 0 0 6px ${haloColor}, 0 1px 2px ${haloColor}`
    : undefined;

  // Pausa del giro mientras la paciente interactúa (ver la nota junto a
  // RESUME_AFTER_LEAVE_MS más arriba).
  const [spinPaused, setSpinPaused] = useState(false);
  const resumeTimerRef = useRef(null);
  const pauseSpin = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setSpinPaused(true);
  };
  const resumeSpinLater = (ms) => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      setSpinPaused(false);
    }, ms);
  };
  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);
  const [pinnedKey, setPinnedKey] = useState(() => getStoredPinnedAccess());

  const pin = (key) => {
    phaseRef.current = 0;
    setPinnedKey(key);
    storePinnedAccess(key);
  };
  const unpin = () => {
    setPinnedKey(null);
    storePinnedAccess(null);
  };

  // Defensa: si llegaran 2 accesos con la misma `key`, React los
  // confundiría y uno quedaría sin posición (atorado en el centro). Se
  // queda solo el primero de cada key.
  const items = itemsProp.filter((it, i, arr) => arr.findIndex((o) => o.key === it.key) === i);
  const pinnedIndex = pinnedKey ? items.findIndex((it) => it.key === pinnedKey) : -1;
  const pinnedItem = pinnedIndex >= 0 ? items[pinnedIndex] : null;
  // Orden de los lugares en la órbita: el fijado (si hay) siempre en el
  // lugar 0 = arriba, los demás en su orden de siempre detrás de él.
  const orbitItems = pinnedItem ? [pinnedItem, ...items.filter((it) => it.key !== pinnedItem.key)] : items;

  // --- Órbita (ver la nota de la décima corrección junto a orbitPoint) ---
  const reducedMotion = usePrefersReducedMotion();
  const [draggingKey, setDraggingKey] = useState(null);
  const [dropKey, setDropKey] = useState(null);
  const spinning = !spinPaused && !pinnedItem && !reducedMotion && !draggingKey;
  const phaseRef = useRef(0); // radianes; se conserva entre renders y pausas
  const itemElsRef = useRef(new Map()); // key -> <div> envoltorio de cada acceso
  const geometryRef = useRef({ keys: [], radius: 0, iconOffset: 0 });
  geometryRef.current = {
    keys: orbitItems.map((it) => it.key),
    radius: sizes.orbitRadius,
    iconOffset: sizes.buttonSize / 2,
    pinned: pinnedItem != null,
  };
  const placeOrbitItems = () => {
    const { keys, radius, iconOffset, pinned } = geometryRef.current;
    const n = keys.length || 1;
    // Con un acceso fijado, todo se acomoda en fase 0: el fijado queda
    // exactamente arriba (no "más o menos arriba" según dónde iba la
    // rueda al momento de fijarlo).
    const phase = pinned ? 0 : phaseRef.current;
    keys.forEach((key, i) => {
      const el = itemElsRef.current.get(key);
      if (!el) return;
      const { x, y } = orbitPoint(radius, phase + (i * 2 * Math.PI) / n);
      // left/top 50% = centro del dial; -50% en X centra el botón, y
      // -iconOffset en Y deja el CENTRO DEL ÍCONO (no el del botón con su
      // etiqueta) exactamente sobre la órbita.
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, ${-iconOffset}px)`;
    });
  };
  // Cada render (cambio de tamaño de pantalla, de accesos, de fijado):
  // recoloca todo con la fase actual, antes de pintar — sin saltos.
  useLayoutEffect(() => {
    placeOrbitItems();
  });
  // Mientras gira: avanza la fase compartida con el reloj real (no por
  // cuadro), así la velocidad es la misma en cualquier pantalla.
  useEffect(() => {
    if (!spinning) return undefined;
    let raf = 0;
    let last = null;
    const step = (ts) => {
      if (last != null) {
        const dt = Math.min(ts - last, 100); // si la pestaña estuvo oculta, no "brinca"
        phaseRef.current = (phaseRef.current + (dt / (SPIN_SECONDS * 1000)) * 2 * Math.PI) % (2 * Math.PI);
        placeOrbitItems();
      }
      last = ts;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  // Arrastrar para reacomodar: el acceso que quede más cerca del dedo (a
  // menos de ~1 círculo de distancia) es el lugar de destino; al soltar se
  // intercambian. Si se suelta en otro lado, regresa a su lugar.
  const findDropKey = (key, x, y) => {
    if (x == null) return null;
    let best = null;
    let bestDist = Infinity;
    itemElsRef.current.forEach((el, k) => {
      if (k === key) return;
      const icon = el.querySelector("[data-orbit-icon]");
      if (!icon) return;
      const r = icon.getBoundingClientRect();
      const dist = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = k;
      }
    });
    return bestDist < sizes.buttonSize * 1.1 ? best : null;
  };
  const dragHandlers = onReorder
    ? {
        onDragStart: (key) => {
          pauseSpin();
          setDraggingKey(key);
        },
        onDragMove: (key, x, y) => {
          const target = findDropKey(key, x, y);
          setDropKey((prev) => (prev === target ? prev : target));
        },
        onDragEnd: (key, x, y) => {
          const target = findDropKey(key, x, y);
          setDraggingKey(null);
          setDropKey(null);
          resumeSpinLater(RESUME_AFTER_TOUCH_MS);
          if (!target) return;
          const keys = items.map((it) => it.key);
          const a = keys.indexOf(key);
          const b = keys.indexOf(target);
          if (a < 0 || b < 0) return;
          [keys[a], keys[b]] = [keys[b], keys[a]];
          tapFeedback("drop");
          onReorder(keys);
        },
      }
    : {};

  // Label/hint de etapa + mejor racha + estado de enfoque — ANTES se
  // mostraban en texto propio debajo de la brújula (herencia de cuando
  // esto era una tarjeta <Mascot> aparte). Segunda corrección de fidelidad
  // (9 de noviembre de 2026): el mockup real no tiene ESE bloque de texto
  // ni la fila de píldoras — después del dial va directo al pie "los
  // accesos giran solos". Para no perder la información (sigue siendo
  // real, solo que ya no cabía visualmente sin apartarse del mockup), se
  // arma un resumen y se pone como `title` del círculo central: aparece
  // al dejar el mouse encima (o mantener presionado en el teléfono), como
  // cualquier tooltip nativo — mismo patrón que ya usa el botón "mejor
  // racha" un poco más abajo en el código viejo. La racha y los puntos de
  // hoy, en cualquier caso, ya se ven directo en el acceso "racha·pts" de
  // la rueda — no dependen de este tooltip para estar visibles.
  const current = streak?.current || 0;
  const longest = streak?.longest || 0;
  const stage = stageFor(current, longest, species, getStoredResetVariant());
  const stageLabel = t.mascot[stage.labelKey];
  const stageHint = t.mascot[stage.hintKey];
  const focusPillText =
    focusStatus === "focusing"
      ? t.mascot.focusingLabel
      : focusStatus === "distracted"
      ? t.mascot.focusDistractedLabel
      : null;
  const centerTitle = [
    stageLabel,
    stageHint,
    longest > 0 ? `${t.mascot.bestStreakLabel}: ${longest}` : null,
    focusPillText,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="anro-compass-dial"
        data-spin-paused={spinPaused ? "true" : "false"}
        // Mouse: se detiene al entrar, sigue 1.5s después de salir.
        // Dedo: no hay "salir", así que se detiene al tocar y sigue sola 5s
        // después del último toque. Teclado: se detiene mientras haya un
        // acceso enfocado (onFocus/onBlur de React sí burbujean).
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") pauseSpin();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") resumeSpinLater(RESUME_AFTER_LEAVE_MS);
        }}
        onPointerDown={(e) => {
          pauseSpin();
          if (e.pointerType !== "mouse") resumeSpinLater(RESUME_AFTER_TOUCH_MS);
        }}
        onFocus={pauseSpin}
        onBlur={() => resumeSpinLater(RESUME_AFTER_LEAVE_MS)}
        style={{
          position: "relative",
          width: `${sizes.dialSize}px`,
          height: `${sizes.dialSize}px`,
          margin: `0 auto ${sizes.extraBottom}px`,
        }}
      >
        {/* Aro punteado = la órbita: mismo radio exacto que recorren los
            centros de los 6 accesos (décima corrección), para que se vean
            siempre montados sobre la línea, nunca adentro ni afuera. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${2 * sizes.orbitRadius}px`,
            height: `${2 * sizes.orbitRadius}px`,
            transform: "translate(-50%, -50%)",
            boxSizing: "border-box",
            border: `1.5px dashed ${tint(accent, 0.3)}`,
            borderRadius: "50%",
          }}
        />

        {/* Centro: la mascota real (anillo con el % de enfoque de hoy +
            emoji de etapa) — nunca un ícono decorativo. Una sola mascota
            en toda la pantalla, siempre. `title`: el label/hint de etapa +
            mejor racha + estado de enfoque, que ya no se muestran como
            texto aparte (ver nota de `centerTitle` más arriba) — sigue
            disponible al pasar el mouse o mantener presionado. */}
        <div
          title={centerTitle || undefined}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${sizes.centerSize}px`,
            height: `${sizes.centerSize}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            // Mismo truco de "esfera con luz" que los 6 accesos (séptima
            // corrección) — un brillo suave arriba-izquierda encima del
            // degradado de siempre, para que el centro también se sienta
            // un cuerpo con volumen, no un círculo plano.
            background: `radial-gradient(circle at 32% 24%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 38%), radial-gradient(circle at 50% 38%, ${C.surface} 0%, ${C.surfaceAlt} 100%)`,
            boxShadow: `0 10px 24px ${tint(accent, 0.28)}, 0 2px 6px rgba(0,0,0,0.12)`,
            filter: circleFilter,
            transition: "filter 0.6s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Encima de los accesos: el globito de la mascota y el confeti
            // salen del círculo y no deben quedar tapados por un acceso
            // que pasa (el que se arrastra va todavía más arriba, z 10).
            zIndex: 2,
          }}
        >
          <Mascot
            variant="hero"
            streak={streak}
            C={C}
            t={t}
            accent={accent}
            species={species}
            focusStatus={focusStatus}
            accessory={accessory}
            focusPercent={focusPercent}
            heroRingSize={sizes.heroRingSize}
            heroRingRadius={sizes.heroRingRadius}
            heroRingStroke={sizes.heroRingStroke}
            heroEmojiSize={sizes.heroEmojiSize}
            xp={xp}
            dayMood={dayMood}
            focusMinutes={focusMinutes}
            focusGoal={focusGoal}
            nextUnlock={nextUnlock}
            onStartFocus={onStartFocus}
            onSeeRewards={onSeeRewards}
            isPlus={isPlus}
            onRequestUpgrade={onRequestUpgrade}
          />
        </div>

        {/* Los accesos en órbita. Cada envoltorio arranca en el centro del
            dial (left/top 50%) y placeOrbitItems() le pone el transform con
            su lugar en la órbita — fuera del render de React, así girar no
            vuelve a renderizar nada. */}
        {orbitItems.map((item, slot) => {
          const isPinned = pinnedItem != null && item.key === pinnedItem.key;
          return (
            <div
              key={item.key}
              data-orbit-key={item.key}
              ref={(el) => {
                if (el) itemElsRef.current.set(item.key, el);
                else itemElsRef.current.delete(item.key);
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                willChange: spinning ? "transform" : undefined,
                zIndex: draggingKey === item.key ? 10 : undefined,
              }}
            >
              <CompassAccessButton
                item={item}
                anchorStyle={{}}
                pinned={isPinned}
                onPin={pin}
                onUnpin={unpin}
                onSelect={onSelect}
                C={C}
                accent={accent}
                accent2={accent2}
                t={t}
                textColor={textColor}
                buttonSize={sizes.buttonSize}
                itemWidth={sizes.itemWidth}
                labelFontSize={sizes.labelFontSize}
                circleFilter={circleFilter}
                labelHalo={labelHalo}
                labelChip={palette?.chipBg}
                {...dragHandlers}
                dragging={draggingKey === item.key}
                planetColor={planetColors ? planetColors[slot % planetColors.length] : undefined}
                isDropTarget={dropKey === item.key}
              />
            </div>
          );
        })}
      </div>

      {onOpenRoom && (
        <button
          type="button"
          onClick={() => {
            tapFeedback("tap");
            onOpenRoom();
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            margin: "4px auto 0",
            padding: "0 18px",
            borderRadius: "999px",
            border: `1.5px solid ${tint(accent, 0.5)}`,
            background: palette?.chipBg || C.surface,
            // Sobre el fondo blanco de siempre, texto oscuro (de noche el
            // texto de la paleta es claro y no se leía); en los temas Plus,
            // el de su pastilla.
            color: palette?.chipBg ? textColor : C.text,
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: `0 6px 14px ${tint(accent, 0.25)}`,
          }}
        >
          <span aria-hidden="true">🏠</span>
          {t.petRoom.open}
          {roomBadge && (
            <span
              aria-hidden="true"
              style={{ fontSize: "13px", background: tint(accent, 0.18), borderRadius: "999px", padding: "1px 7px" }}
            >
              {roomBadge}
            </span>
          )}
        </button>
      )}
      <p
        style={{
          fontSize: "11px",
          color: palette?.chipBg ? textColor : mutedColor,
          margin: "12px auto 0",
          opacity: palette?.chipBg ? 1 : 0.8,
          ...(palette?.chipBg
            ? { background: palette.chipBg, display: "table", padding: "4px 12px", borderRadius: "10px", maxWidth: "92%" }
            : {}),
        }}
      >
        {t.today.quickAccessPinHint}
      </p>
    </div>
  );
}
