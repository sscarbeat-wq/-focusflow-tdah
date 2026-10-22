import React from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "./i18n";

// Selector de idioma — mismo espíritu que el botón de tema claro/oscuro
// (control de dispositivo, visible en Auth, Paywall y dentro de la app),
// pero como <select> porque hay 4 opciones en vez de 2. `onChange` recibe
// directo el código de idioma ("es"/"en"/"fr"/"pt"), ya resuelto desde el
// evento del navegador.
export default function LanguageSwitcher({ C, lang, onChange, t, height = "40px" }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
      <Globe
        size={14}
        style={{ position: "absolute", left: "10px", color: C.textMuted, pointerEvents: "none" }}
      />
      <select
        value={lang}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t.common.chooseLanguage}
        title={t.common.chooseLanguage}
        style={{
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: "8px",
          height,
          padding: "0 10px 0 30px",
          color: C.textMuted,
          fontSize: "13px",
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
        }}
      >
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
