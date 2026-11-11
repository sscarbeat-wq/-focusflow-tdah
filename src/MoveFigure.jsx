import React from "react";

// Muñequito animado de la Pausa activa (12 de noviembre de 2026). La
// doctora vio la primera versión, que usaba un emoji por movimiento, y dijo
// "los dibujos se ven muy sencillos". Ahora cada movimiento lo HACE un
// personaje dibujado con SVG y animado con CSS (sin imágenes, sin
// librerías): sube los brazos, hace sentadillas, gira el cuello, etc.
//
// Cómo está armado: un cuerpo de piezas (cabeza, torso, brazos de 2
// segmentos, piernas de 2 segmentos), cada una en su propio <g> con su
// punto de giro (hombro, codo, cadera, rodilla). Cada tipo de movimiento
// (`type`) es una tabla de animaciones por pieza — ver MOVES más abajo.
// Giros en grados: positivo = hacia la IZQUIERDA de quien mira (el brazo
// izquierdo sube con valores positivos, el derecho con negativos).
//
// `running`: si es false, la animación se queda en pausa. Con "reducir
// movimiento" activado en el dispositivo, el personaje no se anima.

// Puntos de giro (viewBox 0 0 200 200).
const P = {
  hip: [100, 124],
  neck: [100, 66],
  chest: [100, 98],
  shL: [85, 80],
  elL: [85, 107],
  shR: [115, 80],
  elR: [115, 107],
  hipL: [92, 124],
  knL: [92, 154],
  hipR: [108, 124],
  knR: [108, 154],
};

// kf(…): atajo para escribir fotogramas "porcentaje: transform".
const kf = (frames) =>
  Object.entries(frames)
    .map(([pct, tr]) => `${pct}%{transform:${tr}}`)
    .join("");
const rot = (deg) => `rotate(${deg}deg)`;

// Cada movimiento: duración del ciclo (s) y animación por pieza.
// Piezas: all (todo el cuerpo), upper (torso+cabeza+brazos), head, chest,
// aL/aR (brazo), fL/fR (antebrazo), lL/lR (muslo), sL/sR (pantorrilla).
const MOVES = {
  armsUp: {
    dur: 4.5,
    parts: {
      all: kf({ 0: "translateY(0)", 40: "translateY(-4px)", 60: "translateY(-4px)", 100: "translateY(0)" }),
      aL: kf({ 0: rot(8), 40: rot(172), 60: rot(172), 100: rot(8) }),
      aR: kf({ 0: rot(-8), 40: rot(-172), 60: rot(-172), 100: rot(-8) }),
      head: kf({ 0: rot(0), 40: "translateY(-2px)", 60: "translateY(-2px)", 100: rot(0) }),
    },
  },
  shoulders: {
    dur: 3,
    parts: {
      aL: kf({ 0: "translate(0,0) rotate(6deg)", 25: "translate(-2px,-7px) rotate(14deg)", 50: "translate(0,-10px) rotate(6deg)", 75: "translate(3px,-5px) rotate(2deg)", 100: "translate(0,0) rotate(6deg)" }),
      aR: kf({ 0: "translate(0,0) rotate(-6deg)", 25: "translate(2px,-7px) rotate(-14deg)", 50: "translate(0,-10px) rotate(-6deg)", 75: "translate(-3px,-5px) rotate(-2deg)", 100: "translate(0,0) rotate(-6deg)" }),
      head: kf({ 0: rot(0), 50: "translateY(1px)", 100: rot(0) }),
    },
  },
  neck: {
    dur: 6,
    parts: {
      head: kf({ 0: rot(0), 20: rot(-20), 35: rot(-20), 50: rot(0), 70: rot(20), 85: rot(20), 100: rot(0) }),
      aL: kf({ 0: rot(6), 100: rot(6) }),
      aR: kf({ 0: rot(-6), 100: rot(-6) }),
    },
  },
  sideBend: {
    dur: 6,
    parts: {
      upper: kf({ 0: rot(0), 25: rot(-17), 38: rot(-17), 50: rot(0), 75: rot(17), 88: rot(17), 100: rot(0) }),
      aL: kf({ 0: rot(8), 50: rot(8), 62: rot(170), 88: rot(170), 100: rot(8) }),
      aR: kf({ 0: rot(-8), 12: rot(-170), 38: rot(-170), 50: rot(-8), 100: rot(-8) }),
    },
  },
  twist: {
    dur: 3.2,
    parts: {
      upper: kf({ 0: "translateX(-3px) scaleX(0.9)", 50: "translateX(3px) scaleX(0.9)", 100: "translateX(-3px) scaleX(0.9)" }),
      head: kf({ 0: "translateX(-3px)", 50: "translateX(3px)", 100: "translateX(-3px)" }),
      aL: kf({ 0: rot(96), 50: rot(38), 100: rot(96) }),
      fL: kf({ 0: rot(20), 50: rot(-110), 100: rot(20) }),
      aR: kf({ 0: rot(-38), 50: rot(-96), 100: rot(-38) }),
      fR: kf({ 0: rot(110), 50: rot(-20), 100: rot(110) }),
    },
  },
  breathe: {
    dur: 7,
    parts: {
      all: kf({ 0: "translateY(0)", 45: "translateY(-3px)", 55: "translateY(-3px)", 100: "translateY(0)" }),
      chest: kf({ 0: "scale(1)", 45: "scale(1.1,1.04)", 55: "scale(1.1,1.04)", 100: "scale(1)" }),
      aL: kf({ 0: rot(8), 45: rot(30), 55: rot(30), 100: rot(8) }),
      aR: kf({ 0: rot(-8), 45: rot(-30), 55: rot(-30), 100: rot(-8) }),
      ring: kf({ 0: "scale(0.72)", 45: "scale(1)", 55: "scale(1)", 100: "scale(0.72)" }),
    },
  },
  march: {
    dur: 1.3,
    parts: {
      all: kf({ 0: "translateY(0)", 25: "translateY(-3px)", 50: "translateY(0)", 75: "translateY(-3px)", 100: "translateY(0)" }),
      lL: kf({ 0: rot(0), 25: rot(42), 50: rot(0), 100: rot(0) }),
      sL: kf({ 0: rot(0), 25: rot(-84), 50: rot(0), 100: rot(0) }),
      lR: kf({ 0: rot(0), 50: rot(0), 75: rot(-42), 100: rot(0) }),
      sR: kf({ 0: rot(0), 50: rot(0), 75: rot(84), 100: rot(0) }),
      aL: kf({ 0: rot(8), 25: rot(4), 75: rot(40), 100: rot(8) }),
      fL: kf({ 0: rot(0), 25: rot(0), 75: rot(-70), 100: rot(0) }),
      aR: kf({ 0: rot(-8), 25: rot(-40), 75: rot(-4), 100: rot(-8) }),
      fR: kf({ 0: rot(0), 25: rot(70), 75: rot(0), 100: rot(0) }),
    },
  },
  squat: {
    dur: 2.8,
    parts: {
      all: kf({ 0: "translateY(0)", 45: "translateY(20.7px)", 55: "translateY(20.7px)", 100: "translateY(0)" }),
      lL: kf({ 0: rot(0), 45: rot(50), 55: rot(50), 100: rot(0) }),
      sL: kf({ 0: rot(0), 45: rot(-100), 55: rot(-100), 100: rot(0) }),
      lR: kf({ 0: rot(0), 45: rot(-50), 55: rot(-50), 100: rot(0) }),
      sR: kf({ 0: rot(0), 45: rot(100), 55: rot(100), 100: rot(0) }),
      aL: kf({ 0: rot(8), 45: rot(78), 55: rot(78), 100: rot(8) }),
      aR: kf({ 0: rot(-8), 45: rot(-78), 55: rot(-78), 100: rot(-8) }),
    },
  },
  jacks: {
    dur: 1.6,
    parts: {
      all: kf({ 0: "translateY(0)", 50: "translateY(-3px)", 100: "translateY(0)" }),
      aL: kf({ 0: rot(8), 50: rot(150), 100: rot(8) }),
      aR: kf({ 0: rot(-8), 50: rot(-150), 100: rot(-8) }),
      lL: kf({ 0: rot(0), 50: rot(17), 100: rot(0) }),
      lR: kf({ 0: rot(0), 50: rot(-17), 100: rot(0) }),
    },
  },
  punches: {
    dur: 1.1,
    parts: {
      upper: kf({ 0: rot(-4), 50: rot(4), 100: rot(-4) }),
      aL: kf({ 0: rot(100), 50: rot(24), 100: rot(100) }),
      fL: kf({ 0: rot(0), 50: rot(125), 100: rot(0) }),
      aR: kf({ 0: rot(-24), 50: rot(-100), 100: rot(-24) }),
      fR: kf({ 0: rot(-125), 50: rot(0), 100: rot(-125) }),
      lL: kf({ 0: rot(9), 100: rot(9) }),
      lR: kf({ 0: rot(-9), 100: rot(-9) }),
    },
  },
  seatedLegs: {
    dur: 3.6,
    parts: {
      sL: kf({ 0: rot(0), 22: rot(58), 38: rot(58), 50: rot(0), 100: rot(0) }),
      sR: kf({ 0: rot(0), 50: rot(0), 72: rot(-58), 88: rot(-58), 100: rot(0) }),
      aL: kf({ 0: rot(6), 100: rot(6) }),
      aR: kf({ 0: rot(-6), 100: rot(-6) }),
    },
  },
  wrists: {
    dur: 2.2,
    parts: {
      aL: kf({ 0: rot(62), 100: rot(62) }),
      aR: kf({ 0: rot(-62), 100: rot(-62) }),
      fL: kf({ 0: rot(35), 50: rot(-20), 100: rot(35) }),
      fR: kf({ 0: rot(-35), 50: rot(20), 100: rot(-35) }),
      hL: kf({ 0: rot(35), 50: rot(-35), 100: rot(35) }),
      hR: kf({ 0: rot(-35), 50: rot(35), 100: rot(-35) }),
    },
  },
  shake: {
    dur: 0.45,
    parts: {
      aL: kf({ 0: rot(24), 50: rot(30), 100: rot(24) }),
      aR: kf({ 0: rot(-24), 50: rot(-30), 100: rot(-24) }),
      fL: kf({ 0: rot(-14), 50: rot(14), 100: rot(-14) }),
      fR: kf({ 0: rot(14), 50: rot(-14), 100: rot(14) }),
      hL: kf({ 0: rot(-25), 50: rot(25), 100: rot(-25) }),
      hR: kf({ 0: rot(25), 50: rot(-25), 100: rot(25) }),
    },
  },
  // Cara de cerca (ver FaceFigure)
  eyesFar: {
    dur: 7,
    parts: {
      pupils: kf({ 0: "translate(0,0)", 15: "translate(7px,-5px)", 80: "translate(7px,-5px)", 100: "translate(0,0)" }),
      far: kf({ 0: "scale(0.9)", 50: "scale(1.06)", 100: "scale(0.9)" }),
    },
  },
  eyesClosed: {
    dur: 5,
    parts: {
      lids: kf({ 0: "scaleY(1)", 18: "scaleY(0.08)", 70: "scaleY(0.08)", 88: "scaleY(1)", 100: "scaleY(1)" }),
    },
  },
};

export const MOVE_TYPES = Object.keys(MOVES);

function usePrefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function MoveFigure({ type, color = "#D98A0B", ink = "#2A2438", running = true, seated = false, size = 180 }) {
  const reduced = usePrefersReducedMotion();
  const move = MOVES[type] || MOVES.breathe;
  const isFace = type === "eyesFar" || type === "eyesClosed";
  // Nombre único por tipo para los @keyframes.
  const name = (part) => `anro-mf-${type}-${part}`;
  const css = Object.entries(move.parts)
    .map(([part, frames]) => `@keyframes ${name(part)}{${frames}}`)
    .join("");
  const anim = (part, origin) => {
    const style = { transformOrigin: origin ? `${origin[0]}px ${origin[1]}px` : undefined };
    if (move.parts[part] && !reduced) {
      style.animation = `${name(part)} ${move.dur}s ease-in-out infinite`;
      style.animationPlayState = running ? "running" : "paused";
    }
    return style;
  };

  // Colores fijos del personaje (no cambian con el tema claro/oscuro: el
  // personaje siempre va sobre un fondo claro, ver ActiveBreak.jsx). Piel en
  // el amarillo neutro de los emojis; `color` es el de la playera.
  const skin = "#FFD98A";
  const skinLine = "#E3AC4C";
  const hair = "#5B4636";
  const pants = "#3F4468";
  const blush = "#F08A7B";
  const dark = `color-mix(in srgb, ${color} 78%, #000)`;
  // Mangas un tono más claras que la playera, para que los brazos se
  // distingan cuando pasan por enfrente del torso.
  const sleeve = `color-mix(in srgb, ${color} 72%, #fff)`;
  const limb = { stroke: sleeve, strokeWidth: 11, strokeLinecap: "round", fill: "none" };
  const leg = { stroke: pants, strokeWidth: 12, strokeLinecap: "round", fill: "none" };

  if (isFace) {
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-hidden="true" style={{ display: "block" }}>
        <style>{css}</style>
        {type === "eyesFar" && (
          <g style={anim("far", [168, 34])}>
            {/* Algo lejano que mirar: montañas y sol por la ventana */}
            <rect x="140" y="10" width="54" height="46" rx="8" fill={`color-mix(in srgb, ${color} 14%, #fff)`} stroke={color} strokeWidth="3" />
            <circle cx="180" cy="24" r="6" fill={color} />
            <path d="M144 52 L158 32 L168 44 L176 36 L190 52 Z" fill={dark} />
          </g>
        )}
        <circle cx="96" cy="108" r="66" fill={skin} stroke={skinLine} strokeWidth="5" />
        <path d="M34 92 Q38 40 96 40 Q154 40 158 92 Q138 62 96 64 Q54 62 34 92 Z" fill={hair} />
        <circle cx="58" cy="128" r="9" fill={blush} opacity="0.45" />
        <circle cx="134" cy="128" r="9" fill={blush} opacity="0.45" />
        <g style={anim("lids", [96, 98])}>
          <ellipse cx="72" cy="98" rx="15" ry="17" fill="#fff" stroke={ink} strokeWidth="3" />
          <ellipse cx="120" cy="98" rx="15" ry="17" fill="#fff" stroke={ink} strokeWidth="3" />
          <g style={anim("pupils")}>
            <circle cx="72" cy="100" r="7.5" fill={ink} />
            <circle cx="120" cy="100" r="7.5" fill={ink} />
            <circle cx="74.5" cy="97" r="2.4" fill="#fff" />
            <circle cx="122.5" cy="97" r="2.4" fill="#fff" />
          </g>
        </g>
        <path d="M78 138 Q96 152 114 138" stroke={ink} strokeWidth="4" strokeLinecap="round" fill="none" />
        {type === "eyesFar" && <path d="M134 84 L150 62" stroke={color} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />}
      </svg>
    );
  }

  // Sentado: la silla sube el piso de los pies y las piernas van dobladas
  // (el muslo se ve corto porque apunta hacia quien mira).
  const thigh = seated ? 10 : 30;
  const kneeY = P.hipL[1] + thigh;
  const shin = seated ? 34 : 28;

  return (
    <svg viewBox="18 6 164 192" width={size} height={size} role="img" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <style>{css}</style>
      <ellipse cx="100" cy="190" rx={seated ? 46 : 38} ry="5" fill={ink} opacity="0.12" />
      {type === "breathe" && (
        <circle cx="100" cy="100" r="78" fill={color} opacity="0.13" style={anim("ring", [100, 100])} />
      )}
      {seated && (
        <g>
          <rect x="68" y="58" width="64" height="74" rx="10" fill={`color-mix(in srgb, ${ink} 16%, #fff)`} />
          <rect x="62" y="126" width="76" height="12" rx="6" fill={`color-mix(in srgb, ${ink} 30%, #fff)`} />
          <path d="M70 138 L66 188 M130 138 L134 188" stroke={`color-mix(in srgb, ${ink} 30%, #fff)`} strokeWidth="7" strokeLinecap="round" />
        </g>
      )}
      <g style={anim("all")}>
        {/* Piernas */}
        {[
          ["L", P.hipL, -1],
          ["R", P.hipR, 1],
        ].map(([side, hip, dir]) => (
          <g key={side} style={anim(`l${side}`, hip)}>
            <path d={`M${hip[0]} ${hip[1]} L${hip[0]} ${kneeY}`} {...leg} />
            <g style={anim(`s${side}`, [hip[0], kneeY])}>
              <path d={`M${hip[0]} ${kneeY} L${hip[0]} ${kneeY + shin}`} {...leg} />
              <path d={`M${hip[0]} ${kneeY + shin} L${hip[0] + dir * 9} ${kneeY + shin}`} stroke={ink} strokeWidth="9" strokeLinecap="round" />
            </g>
          </g>
        ))}
        <g style={anim("upper", P.hip)}>
          {/* Torso */}
          <rect x="83" y="70" width="34" height="58" rx="16" fill={color} style={anim("chest", P.chest)} />
          {/* Cabeza */}
          <g style={anim("head", P.neck)}>
            <circle cx="100" cy="45" r="22" fill={skin} stroke={skinLine} strokeWidth="3" />
            {/* Pelo */}
            <path d="M79.5 41 Q80 21 100 21 Q120 21 120.5 41 Q112 29 100 30 Q88 29 79.5 41 Z" fill={hair} />
            <circle cx="92" cy="44" r="2.8" fill={ink} />
            <circle cx="108" cy="44" r="2.8" fill={ink} />
            <path d="M93 53 Q100 59 107 53" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <circle cx="86" cy="51" r="3.4" fill={blush} opacity="0.5" />
            <circle cx="114" cy="51" r="3.4" fill={blush} opacity="0.5" />
          </g>
          {/* Brazos (hombro → codo → mano) */}
          {[
            ["L", P.shL, P.elL],
            ["R", P.shR, P.elR],
          ].map(([side, sh, el]) => (
            <g key={side} style={anim(`a${side}`, sh)}>
              <path d={`M${sh[0]} ${sh[1]} L${el[0]} ${el[1]}`} {...limb} />
              <g style={anim(`f${side}`, el)}>
                <path d={`M${el[0]} ${el[1]} L${el[0]} ${el[1] + 23}`} {...limb} />
                <g style={anim(`h${side}`, [el[0], el[1] + 23])}>
                  <circle cx={el[0]} cy={el[1] + 27} r="7.5" fill={skin} stroke={skinLine} strokeWidth="2.5" />
                </g>
              </g>
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
