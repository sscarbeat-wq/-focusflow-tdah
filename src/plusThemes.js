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

export const PLUS_THEME_KEYS = Object.keys(PLUS_THEMES);
