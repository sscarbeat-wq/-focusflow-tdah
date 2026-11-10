// Temas con diseño de la Colección Plus (10 de noviembre de 2026, "más
// colores Plus, bonitos como de galaxia, de cielo... ya con diseños").
// A diferencia de los colores normales (un solo color), cada tema trae:
//   - accentLight/accentDark: el color de botones y resaltados en el resto
//     de la app (modo claro / oscuro), igual que cualquier acento.
//   - planets: los 6 planetas de la brújula, cada uno de un tono del tema.
//   - background: el FONDO de Inicio con su dibujo (estrellas, nubes,
//     burbujas, luciérnagas...), hecho solo con degradados de CSS — nada de
//     imágenes que descargar. Reemplaza al fondo automático por hora.
//   - text/textMuted/haloBg: colores del texto sobre ese fondo.
//   - swatch: la muestra que se ve en el selector de color.
// Solo con ANRO Plus (ver PLUS_ACCENTS en theme.js).

const stars = (color = "#ffffff") =>
  [
    `radial-gradient(1.3px 1.3px at 20px 30px, ${color} 60%, transparent 61%) 0 0 / 110px 110px`,
    `radial-gradient(1px 1px at 70px 85px, rgba(255,255,255,0.75) 60%, transparent 61%) 0 0 / 150px 150px`,
    `radial-gradient(1.7px 1.7px at 45px 120px, #FDE68A 60%, transparent 61%) 0 0 / 190px 190px`,
    `radial-gradient(1px 1px at 130px 40px, rgba(255,255,255,0.6) 60%, transparent 61%) 0 0 / 170px 130px`,
  ].join(", ");

export const PLUS_THEMES = {
  galaxy: {
    accentLight: "#5B3FD6",
    accentDark: "#A08CF5",
    planets: ["#8B5CF6", "#EC4899", "#22D3EE", "#F5C542", "#6366F1", "#D946EF"],
    background: [
      stars(),
      "radial-gradient(ellipse 60% 40% at 78% 16%, rgba(236,72,153,0.38), transparent 70%)",
      "radial-gradient(ellipse 70% 45% at 15% 78%, rgba(34,211,238,0.24), transparent 70%)",
      "linear-gradient(180deg, #0B0628 0%, #1E0F4D 55%, #2A0E45 100%)",
    ].join(", "),
    text: "#F1EEFF",
    textMuted: "#B9B1E0",
    haloBg: "#1A0D40",
  },
  aurora: {
    accentLight: "#0E8F80",
    accentDark: "#5ED6C4",
    planets: ["#34D399", "#A78BFA", "#2DD4BF", "#60A5FA", "#F472B6", "#22C55E"],
    background: [
      "linear-gradient(115deg, transparent 18%, rgba(52,211,153,0.38) 33%, transparent 48%)",
      "linear-gradient(100deg, transparent 40%, rgba(167,139,250,0.32) 55%, transparent 70%)",
      "linear-gradient(125deg, transparent 58%, rgba(45,212,191,0.26) 70%, transparent 82%)",
      stars(),
      "linear-gradient(180deg, #041B2D 0%, #0B2E3F 60%, #123B3A 100%)",
    ].join(", "),
    text: "#ECFDF8",
    textMuted: "#A7D8CF",
    haloBg: "#0A2A38",
  },
  clouds: {
    accentLight: "#1E7FD0",
    accentDark: "#7CC3F5",
    planets: ["#2E90FA", "#F5B83D", "#38BDF8", "#60A5FA", "#0EA5E9", "#FB923C"],
    background: [
      "radial-gradient(circle at 88% 9%, rgba(255,214,102,0.75) 0, rgba(255,214,102,0.25) 7%, transparent 16%)",
      "radial-gradient(ellipse 130px 42px at 20% 22%, rgba(255,255,255,0.95), transparent 70%)",
      "radial-gradient(ellipse 90px 34px at 28% 18%, rgba(255,255,255,0.9), transparent 70%)",
      "radial-gradient(ellipse 170px 52px at 74% 34%, rgba(255,255,255,0.85), transparent 70%)",
      "radial-gradient(ellipse 150px 46px at 62% 72%, rgba(255,255,255,0.75), transparent 70%)",
      "radial-gradient(ellipse 110px 36px at 14% 86%, rgba(255,255,255,0.8), transparent 70%)",
      "linear-gradient(180deg, #74C1F6 0%, #B4E0FF 55%, #EAF7FF 100%)",
    ].join(", "),
    text: "#0F2C44",
    textMuted: "#3C6381",
    haloBg: "#CDEBFF",
  },
  dusk: {
    accentLight: "#D9532E",
    accentDark: "#F7926E",
    planets: ["#FF7A59", "#FFB547", "#E0457B", "#9B5CF6", "#F43F5E", "#FDBA74"],
    background: [
      "radial-gradient(circle at 50% 82%, rgba(255,222,140,0.95) 0, rgba(255,176,96,0.55) 9%, transparent 26%)",
      "radial-gradient(1px 1px at 30px 40px, rgba(255,255,255,0.7) 60%, transparent 61%) 0 0 / 140px 120px",
      "linear-gradient(180deg, #2E1650 0%, #8E3470 38%, #EE7458 72%, #FFC97E 100%)",
    ].join(", "),
    text: "#FFF4EC",
    textMuted: "#F7D5C8",
    haloBg: "#6E2A66",
  },
  abyss: {
    accentLight: "#0B6FA4",
    accentDark: "#4FC3F7",
    planets: ["#22D3EE", "#38BDF8", "#2DD4BF", "#818CF8", "#0EA5E9", "#5EEAD4"],
    background: [
      "radial-gradient(circle at 18px 20px, rgba(255,255,255,0.28) 0 3px, rgba(255,255,255,0.08) 4px, transparent 5px) 0 0 / 90px 140px",
      "radial-gradient(circle at 60px 50px, rgba(255,255,255,0.2) 0 5px, rgba(255,255,255,0.06) 6px, transparent 7px) 0 0 / 160px 210px",
      "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(125,211,252,0.4), transparent 70%)",
      "linear-gradient(180deg, #0B5683 0%, #063258 55%, #031A33 100%)",
    ].join(", "),
    text: "#E6F7FF",
    textMuted: "#9CC8E0",
    haloBg: "#06315A",
  },
  cotton: {
    accentLight: "#C2479A",
    accentDark: "#F3A6D6",
    planets: ["#F472B6", "#C084FC", "#60A5FA", "#F9A8D4", "#A78BFA", "#7DD3FC"],
    background: [
      "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.75) 0 2px, transparent 3px) 0 0 / 46px 46px",
      "radial-gradient(circle at 35px 35px, rgba(255,255,255,0.5) 0 1.5px, transparent 2.5px) 0 0 / 46px 46px",
      "linear-gradient(160deg, #FFCFE6 0%, #E7D3FF 50%, #C6E8FF 100%)",
    ].join(", "),
    text: "#45254F",
    textMuted: "#7A5888",
    haloBg: "#EED8F8",
  },
  fireflies: {
    accentLight: "#3F7D20",
    accentDark: "#A3D977",
    planets: ["#84CC16", "#FACC15", "#22C55E", "#2DD4BF", "#A3E635", "#F59E0B"],
    background: [
      "radial-gradient(circle at 30px 40px, rgba(253,230,138,0.95) 0 2px, rgba(253,230,138,0.3) 3px, transparent 8px) 0 0 / 130px 150px",
      "radial-gradient(circle at 95px 105px, rgba(190,242,100,0.85) 0 1.5px, rgba(190,242,100,0.25) 3px, transparent 7px) 0 0 / 170px 190px",
      "radial-gradient(ellipse 90% 45% at 50% 115%, rgba(34,197,94,0.4), transparent 70%)",
      "linear-gradient(180deg, #0E2A1F 0%, #13382A 55%, #0A1F17 100%)",
    ].join(", "),
    text: "#EEFBE8",
    textMuted: "#A9CDA0",
    haloBg: "#112F23",
  },
};


// --- Segunda tanda (10 de noviembre de 2026: "más temas Plus, por ejemplo
// fondos de pinturas de Van Gogh, tipo kawaii, góticos") -------------------
// Estos llevan dibujos de verdad (remolinos, corazoncitos, fresas,
// murciélagos, encaje): son SVG escritos aquí mismo y metidos como
// data-URI en el CSS — siguen sin descargar ninguna imagen. Los de Van Gogh
// son dibujos ORIGINALES inspirados en su estilo (pinceladas, remolinos),
// no copias de los cuadros.
const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

// Pinceladas cortas en varias direcciones, como textura de óleo.
const brush = (colors, w = 120, h = 120) => {
  let out = "";
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 42; i++) {
    const x = Math.round(rnd() * w);
    const y = Math.round(rnd() * h);
    const a = Math.round(rnd() * 180);
    const len = 8 + Math.round(rnd() * 12);
    const c = colors[i % colors.length];
    out += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="0.45" transform="rotate(${a} ${x} ${y})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${out}</svg>`;
};

const STARRY_SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
<defs>
<radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF3A0"/><stop offset="0.35" stop-color="#F7C948" stop-opacity="0.9"/><stop offset="1" stop-color="#F7C948" stop-opacity="0"/></radialGradient>
<radialGradient id="m" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE27A"/><stop offset="0.5" stop-color="#F5B83D" stop-opacity="0.7"/><stop offset="1" stop-color="#F5B83D" stop-opacity="0"/></radialGradient>
</defs>
<g fill="none" stroke-linecap="round">
<path d="M-20 250 C 60 170, 170 170, 220 230 S 330 300, 420 220" stroke="#A9D2F7" stroke-width="14" opacity="0.35"/>
<path d="M-20 270 C 70 200, 160 205, 210 255 S 320 320, 420 245" stroke="#E7F2FF" stroke-width="5" opacity="0.4"/>
<path d="M150 235 C 175 205, 230 205, 240 240 C 248 268, 205 285, 185 262 C 170 245, 190 228, 208 240" stroke="#DCEBFF" stroke-width="7" opacity="0.55"/>
<path d="M60 360 C 120 320, 200 330, 260 370 S 380 400, 430 360" stroke="#7FB2E8" stroke-width="12" opacity="0.3"/>
<path d="M-10 120 C 50 90, 120 100, 160 130" stroke="#BFDCFA" stroke-width="8" opacity="0.35"/>
</g>
<circle cx="60" cy="175" r="34" fill="url(#g)"/><circle cx="60" cy="175" r="9" fill="#FFF7C2"/>
<circle cx="60" cy="175" r="20" fill="none" stroke="#F7D774" stroke-width="3" opacity="0.7"/>
<circle cx="250" cy="140" r="28" fill="url(#g)"/><circle cx="250" cy="140" r="7" fill="#FFF7C2"/>
<circle cx="250" cy="140" r="16" fill="none" stroke="#F7D774" stroke-width="3" opacity="0.7"/>
<circle cx="150" cy="130" r="16" fill="url(#g)"/><circle cx="150" cy="130" r="4" fill="#FFF7C2"/>
<circle cx="330" cy="300" r="22" fill="url(#g)"/><circle cx="330" cy="300" r="6" fill="#FFF7C2"/>
<circle cx="40" cy="330" r="20" fill="url(#g)"/><circle cx="40" cy="330" r="5" fill="#FFF7C2"/>
<circle cx="345" cy="80" r="62" fill="url(#m)"/>
<path d="M345 48 a32 32 0 1 0 22 56 a26 26 0 1 1 -22 -56 z" fill="#FFE27A"/>
<path d="M40 800 C 30 700, 55 640, 48 560 C 44 500, 70 470, 66 420 C 82 470, 96 520, 92 580 C 100 640, 118 700, 110 800 Z" fill="#0E2318" opacity="0.92"/>
<path d="M120 800 L 120 740 L 160 720 L 200 735 L 240 715 L 290 735 L 330 720 L 400 740 L 400 800 Z" fill="#132A4A"/>
<rect x="175" y="745" width="8" height="8" fill="#F7C948"/><rect x="255" y="738" width="8" height="8" fill="#F7C948"/><rect x="320" y="748" width="7" height="7" fill="#F7C948"/>
</svg>`;

const WHEAT_SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6B0"/><stop offset="0.4" stop-color="#FBD24C" stop-opacity="0.85"/><stop offset="1" stop-color="#FBD24C" stop-opacity="0"/></radialGradient></defs>
<g fill="none" stroke-linecap="round">
<path d="M-20 120 C 60 80, 140 90, 190 130 S 300 170, 420 110" stroke="#FFFFFF" stroke-width="12" opacity="0.45"/>
<path d="M30 200 C 90 170, 170 180, 210 210" stroke="#E6F3FF" stroke-width="9" opacity="0.5"/>
<path d="M220 60 C 260 40, 330 50, 360 80" stroke="#FFFFFF" stroke-width="8" opacity="0.45"/>
</g>
<circle cx="320" cy="140" r="58" fill="url(#s)"/><circle cx="320" cy="140" r="20" fill="#FFE070"/>
<path d="M0 470 C 80 440, 160 455, 230 440 S 350 430, 400 445 L 400 800 L 0 800 Z" fill="#D9A520"/>
<path d="M0 520 C 90 500, 170 515, 250 500 S 360 495, 400 505 L 400 800 L 0 800 Z" fill="#E8B930"/>
<g stroke-linecap="round" stroke-width="4" opacity="0.7">
<path d="M20 600 q 6 -24 0 -40" stroke="#A8720E" fill="none"/><path d="M60 640 q 6 -26 -2 -44" stroke="#F6D36A" fill="none"/>
<path d="M110 610 q 4 -22 -4 -40" stroke="#A8720E" fill="none"/><path d="M160 660 q 6 -26 0 -46" stroke="#F6D36A" fill="none"/>
<path d="M210 620 q 6 -24 -2 -42" stroke="#A8720E" fill="none"/><path d="M260 670 q 4 -24 -4 -44" stroke="#F6D36A" fill="none"/>
<path d="M310 630 q 6 -24 0 -42" stroke="#A8720E" fill="none"/><path d="M360 680 q 6 -26 -2 -44" stroke="#F6D36A" fill="none"/>
<path d="M40 720 q 6 -24 0 -40" stroke="#F6D36A" fill="none"/><path d="M140 740 q 6 -24 -2 -42" stroke="#A8720E" fill="none"/>
<path d="M240 730 q 6 -24 0 -40" stroke="#F6D36A" fill="none"/><path d="M340 750 q 6 -24 -2 -42" stroke="#A8720E" fill="none"/>
</g>
<g fill="#2B2B3A"><path d="M90 300 q 8 -6 16 0 q 8 -6 16 0" stroke="#2B2B3A" stroke-width="3" fill="none"/><path d="M200 260 q 7 -5 14 0 q 7 -5 14 0" stroke="#2B2B3A" stroke-width="3" fill="none"/></g>
</svg>`;

const KAWAII_TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
<path d="M24 30 c-6-8-18-2-12 8 l12 10 l12-10 c6-10-6-16-12-8z" fill="#FF8FC4"/>
<path d="M72 64 l3 7 l7 1 l-5 5 l1 7 l-6-3 l-6 3 l1-7 l-5-5 l7-1z" fill="#FFD54F"/>
<g fill="#FFFFFF" opacity="0.95"><circle cx="66" cy="22" r="8"/><circle cx="76" cy="20" r="10"/><circle cx="86" cy="24" r="7"/><rect x="62" y="22" width="28" height="8" rx="4"/></g>
<circle cx="72" cy="23" r="1.3" fill="#5B4A6B"/><circle cx="80" cy="23" r="1.3" fill="#5B4A6B"/><path d="M74 26 q2 2 4 0" stroke="#5B4A6B" stroke-width="1.2" fill="none"/>
<circle cx="20" cy="76" r="2.5" fill="#B9A7FF"/><circle cx="46" cy="58" r="2" fill="#8FD3FF"/><circle cx="50" cy="12" r="2" fill="#FFB3D9"/>
</svg>`;

const STRAWBERRY_TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84">
<g transform="translate(14 14)"><path d="M14 6 C 4 6, 0 14, 3 22 C 6 30, 12 34, 14 36 C 16 34, 22 30, 25 22 C 28 14, 24 6, 14 6 Z" fill="#FF5A6E"/>
<path d="M14 6 l-6 -4 l4 5 l-6 1 l7 1 z M14 6 l6 -4 l-4 5 l6 1 l-7 1 z" fill="#4CAF50"/>
<g fill="#FFE8A3"><circle cx="9" cy="15" r="1"/><circle cx="16" cy="13" r="1"/><circle cx="20" cy="19" r="1"/><circle cx="11" cy="22" r="1"/><circle cx="16" cy="27" r="1"/></g>
<circle cx="10" cy="20" r="1.2" fill="#3B2030"/><circle cx="18" cy="20" r="1.2" fill="#3B2030"/><path d="M12 24 q2 2 4 0" stroke="#3B2030" stroke-width="1" fill="none"/></g>
<circle cx="64" cy="62" r="3" fill="#FFFFFF" opacity="0.9"/><circle cx="70" cy="20" r="2" fill="#FFB3C7"/>
</svg>`;

const GOTHIC_SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="mo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F3E9FF"/><stop offset="0.45" stop-color="#D9C6F5" stop-opacity="0.6"/><stop offset="1" stop-color="#D9C6F5" stop-opacity="0"/></radialGradient></defs>
<circle cx="330" cy="215" r="70" fill="url(#mo)"/><circle cx="330" cy="215" r="30" fill="#EFE4FF"/>
<g fill="#120818">
<path d="M80 160 q 10 -12 20 0 q 6 -10 12 -2 q 6 -8 12 2 q 10 -12 20 0 q -14 4 -22 14 q -4 -6 -10 0 q -8 -10 -32 -14z"/>
<path d="M200 230 q 7 -9 14 0 q 4 -7 8 -1 q 4 -6 8 1 q 7 -9 14 0 q -10 3 -15 10 q -3 -4 -7 0 q -6 -7 -22 -10z"/>
<path d="M330 260 q 6 -8 12 0 q 4 -6 7 -1 q 3 -5 7 1 q 6 -8 12 0 q -9 3 -13 9 q -3 -4 -6 0 q -5 -6 -19 -9z"/>
</g>
<path d="M0 800 L0 690 L30 690 L30 640 L45 600 L60 640 L60 690 L110 690 L110 660 L130 620 L150 660 L150 700 L220 700 L220 650 L240 580 L260 650 L260 700 L330 700 L330 670 L350 630 L370 670 L370 690 L400 690 L400 800 Z" fill="#0D0612"/>
<g fill="#C9A6FF" opacity="0.8"><rect x="236" y="615" width="8" height="14" rx="4"/><rect x="40" y="625" width="6" height="10" rx="3"/><rect x="345" y="650" width="6" height="10" rx="3"/></g>
<g fill="#FFFFFF"><circle cx="40" cy="60" r="1.5"/><circle cx="150" cy="90" r="1.2"/><circle cx="210" cy="40" r="1.6"/><circle cx="120" cy="300" r="1.2"/><circle cx="380" cy="360" r="1.4"/><circle cx="60" cy="420" r="1.2"/></g>
</svg>`;

const DAMASK_TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80">
<g fill="none" stroke="#5A2D6E" stroke-width="1.5" opacity="0.55">
<path d="M30 8 C 22 18, 22 30, 30 40 C 38 30, 38 18, 30 8 Z"/>
<path d="M30 40 C 18 40, 10 50, 14 60 C 20 54, 26 52, 30 56 C 34 52, 40 54, 46 60 C 50 50, 42 40, 30 40 Z"/>
<circle cx="30" cy="68" r="3"/><circle cx="0" cy="0" r="6"/><circle cx="60" cy="0" r="6"/><circle cx="0" cy="80" r="6"/><circle cx="60" cy="80" r="6"/>
</g></svg>`;

const LACE_TILE = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
<g fill="none" stroke="#3A2A33" stroke-width="1.4">
<circle cx="24" cy="24" r="14"/><circle cx="24" cy="24" r="8"/>
<circle cx="0" cy="0" r="10"/><circle cx="48" cy="0" r="10"/><circle cx="0" cy="48" r="10"/><circle cx="48" cy="48" r="10"/>
</g>
<g fill="#B3123F"><circle cx="24" cy="24" r="3.2"/></g>
<g fill="#3A2A33"><circle cx="24" cy="10" r="1.2"/><circle cx="24" cy="38" r="1.2"/><circle cx="10" cy="24" r="1.2"/><circle cx="38" cy="24" r="1.2"/></g>
</svg>`;

Object.assign(PLUS_THEMES, {
  starrynight: {
    accentLight: "#1F4E8C",
    accentDark: "#7FB2E8",
    planets: ["#F5C542", "#3B82F6", "#FDE68A", "#1E40AF", "#60A5FA", "#F59E0B"],
    background: [
      `${svgUrl(STARRY_SCENE)} center / cover no-repeat`,
      `${svgUrl(brush(["#8FC1F2", "#2F5FA8", "#E7F0FF"]))} 0 0 / 120px 120px`,
      "linear-gradient(180deg, #0A2350 0%, #1B4A8A 60%, #123566 100%)",
    ].join(", "),
    text: "#F2F7FF",
    textMuted: "#B9CFEA",
    haloBg: "#143D74",
  },
  wheatfield: {
    accentLight: "#B7791F",
    accentDark: "#F2C14E",
    planets: ["#F2B705", "#2E86DE", "#E67E22", "#5DADE2", "#D4AC0D", "#1F618D"],
    background: [
      `${svgUrl(WHEAT_SCENE)} center / cover no-repeat`,
      `${svgUrl(brush(["#FFFFFF", "#7FC1F2", "#3E8ED0"]))} 0 0 / 120px 120px`,
      "linear-gradient(180deg, #3E8ED0 0%, #7FC1F2 45%, #E8B930 70%, #D9A520 100%)",
    ].join(", "),
    text: "#1E2A3A",
    textMuted: "#3D4F66",
    haloBg: "#BFE0FA",
  },
  kawaii: {
    accentLight: "#D9468F",
    accentDark: "#FF9CCB",
    planets: ["#FF8FC4", "#B9A7FF", "#8FD3FF", "#FFD54F", "#FFB3D9", "#9EE6C8"],
    background: [
      `${svgUrl(KAWAII_TILE)} 0 0 / 96px 96px`,
      "linear-gradient(170deg, #FFE3F1 0%, #F1E6FF 50%, #DFF3FF 100%)",
    ].join(", "),
    text: "#4B2C5E",
    textMuted: "#7E5D92",
    haloBg: "#FBE6F6",
  },
  strawberry: {
    accentLight: "#E0405A",
    accentDark: "#FF8A9B",
    planets: ["#FF5A6E", "#4CAF50", "#FFB3C7", "#FF8A65", "#81C784", "#F06292"],
    background: [
      `${svgUrl(STRAWBERRY_TILE)} 0 0 / 110px 110px`,
      "linear-gradient(170deg, #FFEFF3 0%, #FFE0E8 55%, #E4F7EA 100%)",
    ].join(", "),
    text: "#4A1E2A",
    textMuted: "#7D4A58",
    haloBg: "#FFE6EC",
  },
  gothic: {
    accentLight: "#6B2D8F",
    accentDark: "#C9A6FF",
    planets: ["#8E44AD", "#C0392B", "#5B2C6F", "#D7BDE2", "#922B21", "#A569BD"],
    background: [
      `${svgUrl(GOTHIC_SCENE)} center / cover no-repeat`,
      `${svgUrl(DAMASK_TILE)} 0 0 / 60px 80px`,
      "linear-gradient(180deg, #1A0B24 0%, #2A1236 55%, #12061A 100%)",
    ].join(", "),
    text: "#F3EAFB",
    textMuted: "#BBA3CC",
    haloBg: "#230F30",
  },
  lace: {
    accentLight: "#A3123A",
    accentDark: "#F06A8B",
    planets: ["#B3123F", "#4A4A4A", "#E35D7A", "#2B2B2B", "#8E0E2E", "#F2A3B5"],
    background: [
      `${svgUrl(LACE_TILE)} 0 0 / 48px 48px`,
      "radial-gradient(ellipse 80% 50% at 50% 30%, rgba(179,18,63,0.25), transparent 70%)",
      "linear-gradient(180deg, #120B10 0%, #1C1118 60%, #0B0709 100%)",
    ].join(", "),
    text: "#FBEFF3",
    textMuted: "#CBA9B5",
    haloBg: "#1A1016",
  },
});

export const PLUS_THEME_KEYS = Object.keys(PLUS_THEMES);
