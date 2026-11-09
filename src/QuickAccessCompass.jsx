import React, { useRef, useState } from "react";
import { Pin } from "lucide-react";
import { tint } from "./theme";
import Mascot from "./Mascot";
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
const CENTER_SIZE = 160; // alcanza el anillo-hero (150px + 10px de sombra de piso) con aire alrededor
const BUTTON_SIZE = 38;
const ITEM_WIDTH = 64;
const SPIN_SECONDS = 48;
const LONG_PRESS_MS = 550;
// clamp() en vez de un ancho fijo — el mismo valor sirve para la caja del
// dial (ancho+alto por aspect-ratio 1:1) y para la rueda que gira adentro
// (100% de esa caja), así que ambas siempre miden exactamente lo mismo sin
// necesidad de un número de radio en píxeles aparte.
const DIAL_WIDTH_EXPR = "clamp(260px, 90vw, 340px)";

// Un solo botón de acceso — propio componente chico solo para no repetir
// la lógica de "mantener presionado" 4 veces en el render principal.
// Estilo del círculo de ícono según `item.variant` — 4 combinaciones
// tomadas directo del mockup (alternan relleno sólido/aro blanco y
// acento/acento2); sin `variant`, se queda con el estilo genérico de
// siempre (tinte suave del acento), para que el componente no se rompa si
// algún día se usa con items que no traigan esa etiqueta.
function iconCircleStyle(variant, accent, accent2, pinned) {
  const ringColor = variant === "accent2-solid" || variant === "accent2-outline" ? accent2 : accent;
  if (variant === "accent-solid" || variant === "accent2-solid") {
    return {
      background: ringColor,
      border: pinned ? "2px solid #fff" : "none",
      color: "#fff",
      boxShadow: pinned ? `0 0 0 4px ${tint(ringColor, 0.35)}` : "0 4px 10px rgba(0,0,0,0.12)",
    };
  }
  if (variant === "accent-outline" || variant === "accent2-outline") {
    return {
      background: "#FFFFFF",
      border: pinned ? `2px solid ${ringColor}` : `1.5px solid ${tint(ringColor, 0.45)}`,
      color: ringColor,
      boxShadow: pinned ? `0 0 0 4px ${tint(ringColor, 0.22)}` : "0 4px 10px rgba(0,0,0,0.08)",
    };
  }
  return {
    background: tint(accent, 0.16),
    border: pinned ? `2px solid ${accent}` : `1.5px solid ${tint(accent, 0.35)}`,
    color: accent,
    boxShadow: pinned ? `0 0 0 4px ${tint(accent, 0.22)}` : "0 4px 10px rgba(0,0,0,0.08)",
  };
}

function CompassAccessButton({ item, anchorStyle, rotating, pinned, onPin, onUnpin, onSelect, C, accent, accent2, t, textColor }) {
  const timerRef = useRef(null);
  const firedRef = useRef(false);

  const startPress = () => {
    firedRef.current = false;
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
  const handleClick = () => {
    // Si el timeout de "mantener presionado" ya disparó el fijado/
    // desfijado, este click que sigue (mouseup dispara click igual,
    // aunque se haya mantenido presionado) no debe ADEMÁS navegar — sería
    // confuso fijar un acceso y que a la vez te saque de Inicio.
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    onSelect(item.key);
  };

  return (
    <div style={anchorStyle}>
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={pinned ? `${item.label} — ${t.today.unpinAccessAria(item.label)}` : item.label}
        title={pinned ? t.today.unpinAccessAria(item.label) : t.today.pinAccessAria(item.label)}
        className={rotating ? "anro-compass-counter" : undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          width: `${ITEM_WIDTH}px`,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          touchAction: "manipulation",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "relative",
            width: `${BUTTON_SIZE}px`,
            height: `${BUTTON_SIZE}px`,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...iconCircleStyle(item.variant, accent, accent2, pinned),
          }}
        >
          {item.icon}
          {pinned && (
            <span
              style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <Pin size={10} />
            </span>
          )}
        </span>
        <span style={{ fontSize: "10px", fontWeight: 700, color: textColor, lineHeight: 1.2 }}>{item.label}</span>
      </button>
    </div>
  );
}

// Ancla cada una de las 6 posiciones (cada 60°, empezando arriba y en
// sentido horario — mismo orden que el mockup: 0°/60°/120°/180°/240°/300°)
// en PORCENTAJE de la caja del dial (no píxeles fijos), así escala
// perfecto con el clamp() del contenedor en cualquier tamaño de pantalla.
// Los 2 de arriba/abajo usan un radio (37%) más chico que los 4 diagonales
// (45%) — no es un capricho estético: el botón de silenciar de la mascota
// (Mascot.jsx, variante "hero") vive en la esquina arriba-derecha de su
// círculo central, y con un solo radio uniforme el acceso diagonal más
// cercano a esa esquina quedaba encima del botón de silenciar (verificado
// con Playwright: "intercepts pointer events"). Arriba/abajo no tienen
// ese problema (quedan lejos de cualquier esquina), así que se quedan en
// el radio más chico — mejor para no desbordar el teléfono más angosto
// que soporta la app. Verificado con Playwright a 320px, 375px y 1100px:
// 0px de desborde horizontal y los 6 botones + el de silenciar, todos
// clicables sin pisarse.
const ORBIT_ANCHORS = [
  { top: "13%", left: "50%" }, // 0°   — arriba (radio chico)
  { top: "27.5%", left: "89%" }, // 60°  — arriba-derecha (radio grande)
  { top: "72.5%", left: "89%" }, // 120° — abajo-derecha (radio grande)
  { top: "87%", left: "50%" }, // 180° — abajo (radio chico)
  { top: "72.5%", left: "11%" }, // 240° — abajo-izquierda (radio grande)
  { top: "27.5%", left: "11%" }, // 300° — arriba-izquierda (radio grande)
];

export default function QuickAccessCompass({
  C,
  t,
  accent,
  accent2 = accent,
  items,
  onSelect,
  streak,
  species,
  focusStatus = "idle",
  accessory = "none",
  focusPercent = 0,
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
}) {
  const textColor = palette ? palette.text : C.text;
  const mutedColor = palette ? palette.textMuted : C.textMuted;
  const [pinnedKey, setPinnedKey] = useState(() => getStoredPinnedAccess());

  const pin = (key) => {
    setPinnedKey(key);
    storePinnedAccess(key);
  };
  const unpin = () => {
    setPinnedKey(null);
    storePinnedAccess(null);
  };

  const pinnedIndex = pinnedKey ? items.findIndex((it) => it.key === pinnedKey) : -1;
  const pinnedItem = pinnedIndex >= 0 ? items[pinnedIndex] : null;
  const rotatingItems = pinnedItem ? items.filter((it) => it.key !== pinnedItem.key) : items;
  // Si algo está fijado, el resto gira por las posiciones que quedan (1 a
  // 5) — "arriba" (posición 0) queda reservado para lo fijado. Sin nada
  // fijado, todos giran por las 6 de siempre.
  const rotatingAnchors = pinnedItem ? ORBIT_ANCHORS.slice(1) : ORBIT_ANCHORS;

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
      <style>{`
        @keyframes anroCompassSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes anroCompassCounterSpin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .anro-compass-wheel {
          animation: anroCompassSpin ${SPIN_SECONDS}s linear infinite;
        }
        .anro-compass-counter {
          animation: anroCompassCounterSpin ${SPIN_SECONDS}s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .anro-compass-wheel,
          .anro-compass-counter {
            animation: none !important;
          }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: DIAL_WIDTH_EXPR,
          maxWidth: "340px",
          aspectRatio: "1 / 1",
          margin: "0 auto",
          // boxSizing: "border-box" (9 de noviembre de 2026, al agregar los
          // 6 accesos): sin esto, aspect-ratio cuadraba solo el contenido Y
          // LUEGO se sumaba el padding vertical encima, dejando la caja
          // real más alta que ancha — las anclas en % de los 6 accesos (que
          // sí dependen de una caja perfectamente cuadrada para caer en los
          // ángulos correctos) quedaban desparejas: los de arriba/abajo se
          // alejaban más del centro que los diagonales, y uno de los
          // diagonales terminaba encima del botón de silenciar de la
          // mascota. Con border-box, el padding entra DENTRO del cuadrado
          // en vez de agrandarlo, así que la caja queda cuadrada de
          // verdad y las 6 anclas caen donde deben. Con solo 4 accesos
          // cardinales (arriba/derecha/abajo/izquierda) este desajuste no
          // se notaba porque esas 4 posiciones no dependen de que la caja
          // sea cuadrada (quedan centradas en cada eje igual).
          boxSizing: "border-box",
          // Espacio de sobra para que las etiquetas de texto debajo/encima
          // de los botones no queden recortadas.
          padding: "34px 0",
        }}
      >
        {/* Dial punteado decorativo — fijo, no gira (solo la rueda de
            accesos de adentro gira; el aro punteado es la referencia fija
            de "brújula", como en el mockup). */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: "100%",
            transform: "translate(-50%, -50%)",
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
            width: `${CENTER_SIZE}px`,
            height: `${CENTER_SIZE}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 38%, ${C.surface} 0%, ${C.surfaceAlt} 100%)`,
            boxShadow: `0 6px 16px ${tint(accent, 0.22)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
          />
        </div>

        {/* Acceso fijado arriba (si hay uno) — fuera de la rueda, no gira. */}
        {pinnedItem && (
          <div style={{ position: "absolute", ...ORBIT_ANCHORS[0], transform: "translate(-50%, -50%)" }}>
            <CompassAccessButton
              item={pinnedItem}
              anchorStyle={{}}
              rotating={false}
              pinned
              onPin={pin}
              onUnpin={unpin}
              onSelect={onSelect}
              C={C}
              accent={accent}
              accent2={accent2}
              t={t}
              textColor={textColor}
            />
          </div>
        )}

        {/* Rueda de accesos: gira sola y lenta alrededor del centro; cada
            ícono se contra-rota para quedar siempre derecho. Mismo tamaño
            exacto que la caja del dial (no un tamaño fijo aparte) para que
            las posiciones ancladas a sus bordes caigan siempre sobre el
            círculo punteado, en cualquier tamaño de pantalla. */}
        <div
          className="anro-compass-wheel"
          style={{
            position: "absolute",
            inset: 0,
            // La caja de la rueda cubre TODO el dial (para que las anclas en
            // % caigan donde deben), pero la mayor parte de esa caja está
            // vacía — sin esto, esa área vacía tapa los clics que debían
            // llegar a lo que está debajo (el botón de silenciar de la
            // mascota, en el centro). Cada botón de acceso se vuelve a
            // activar (`pointerEvents: "auto"`) más abajo, así que ellos
            // siguen respondiendo al clic normalmente.
            pointerEvents: "none",
          }}
        >
          {rotatingItems.map((item, i) => {
            const anchor = rotatingAnchors[i % rotatingAnchors.length];
            return (
              <div
                key={item.key}
                style={{
                  position: "absolute",
                  ...anchor,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto",
                }}
              >
                <CompassAccessButton
                  item={item}
                  anchorStyle={{}}
                  rotating
                  pinned={false}
                  onPin={pin}
                  onUnpin={unpin}
                  onSelect={onSelect}
                  C={C}
                  accent={accent}
                  accent2={accent2}
                  t={t}
                  textColor={textColor}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p
        style={{
          fontSize: "11px",
          color: mutedColor,
          margin: "12px 0 0",
          opacity: 0.8,
        }}
      >
        {t.today.quickAccessPinHint}
      </p>
    </div>
  );
}
