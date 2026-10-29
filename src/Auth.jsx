import React, { useEffect, useState } from "react";
import { Sun, Moon, Mail, Lock, Eye, EyeOff, CalendarClock, ListChecks, Sparkles, HeartHandshake, Download } from "lucide-react";
import { supabase } from "./supabaseClient";
import { tint } from "./theme";
import InstallBanner from "./InstallBanner";
import LanguageSwitcher from "./LanguageSwitcher";

// 28 de octubre de 2026 — la doctora pidió que la pantalla de ingreso
// permita recuperar la contraseña ("eso no viene en la pantalla de
// ingreso"). Se agregó un tercer modo, "reset-request": la paciente escribe
// su correo y se le manda un enlace de recuperación (Supabase ya tiene esto
// integrado — supabase.auth.resetPasswordForEmail). El otro lado del flujo
// (elegir la contraseña nueva cuando la paciente vuelve a entrar desde ese
// enlace) vive en ResetPassword.jsx, mostrado desde App.jsx cuando Supabase
// detecta el evento "PASSWORD_RECOVERY" — no aquí, porque en ese momento ya
// no se está en esta pantalla de login, sino en una sesión temporal de
// recuperación.
//
// Segunda pasada de rediseño (29 de octubre de 2026) — la doctora mandó una
// propuesta de contenido y dirección de diseño completa y específica: dos
// columnas en escritorio (presentación de ANRO + 4 beneficios a la
// izquierda, formulario en tarjeta a la derecha), todo vertical en móvil
// con acceso rápido al formulario sin scroll excesivo, logo del cerebro
// multicolor, paleta lavanda/morado/blanco ya existente, microanimaciones
// de entrada respetando `prefers-reduced-motion`, y SIN tocar nada de la
// autenticación real (signin/signup/reset-request, idioma, tema, PWA).
//
// Decisiones de implementación:
// - `isWide` (breakpoint propio de 920px, no el de 760px que usa el resto
//   de la app — ahí es "una columna vs. dos", acá necesitamos más ancho
//   para que la columna de beneficios no se vea apretada) sigue el mismo
//   patrón ya usado en FocusFlowTDAH.jsx para `isNarrow`: estado +
//   listener de resize, sin media queries CSS nuevas.
// - El "Bienvenido a ANRO" + subtítulo de la propuesta es el saludo de la
//   pantalla de ENTRAR; para crear cuenta y recuperar contraseña se
//   conservan los títulos que ya existían (la doctora no mandó copy nuevo
//   para esos dos), así ningún modo se queda sin título.
// - El aviso ("ANRO es una herramienta de acompañamiento...") es texto
//   NUEVO y propio de esta pantalla — ya existía un disclaimer parecido
//   pero más largo dentro de la app (`app.disclaimer`, se ve en Inicio ya
//   con sesión iniciada); no se reemplaza ese, este es uno aparte
//   (`auth.disclaimer`) con el texto exacto que mandó la doctora.
// - Las animaciones de entrada son clases CSS + keyframes inyectados con
//   un <style> (mismo patrón que ya usa Mascot.jsx para sus animaciones),
//   con el mismo bloque `@media (prefers-reduced-motion: reduce)` que
//   anula todo con `animation: none !important`.
// - NINGUNA lógica de autenticación se tocó: mismos 3 modos, mismas
//   validaciones, mismas llamadas a Supabase, mismos mensajes. Tampoco se
//   tocó `InstallBanner.jsx` (sigue siendo el mismo componente funcional
//   de instalación de PWA) — el texto "También puedes instalar ANRO en tu
//   celular" que pidió la doctora es una línea nueva y puramente
//   informativa en la columna de marketing, no reemplaza esa lógica.
export default function Auth({ C, theme, onToggleTheme, t, lang, onChangeLanguage, accentKey }) {
  const [mode, setMode] = useState("signin"); // signin | signup | reset-request
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const check = () => setIsWide(window.innerWidth >= 920);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Mismo patrón que personalAccent en FocusFlowTDAH.jsx: color de acento
  // elegido por la paciente (preferencia de dispositivo, no clínica) con
  // lavanda como respaldo si todavía no se ha elegido ninguno. `accentKey`
  // ya trae emparejado su color de texto con buen contraste en theme.js
  // (mintText, lavenderText, etc.) — se usa ese mismo par para el botón
  // principal, en vez de inventar un color de texto fijo que podría perder
  // contraste con algunos de los acentos disponibles.
  const accent = (accentKey && C[accentKey]) || C.lavender;
  const accentText = (accentKey && C[`${accentKey}Text`]) || C.lavenderText;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (mode === "reset-request") {
      if (!email.trim()) {
        setMessage(t.auth.incompleteFields);
        return;
      }
      setLoading(true);
      try {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        // Mismo mensaje exista o no la cuenta — no se revela si un correo
        // está registrado o no (evita que alguien use este formulario para
        // averiguar qué correos tienen cuenta en la app).
        setMessage(t.auth.resetRequestSent);
      } catch (err) {
        setMessage(err.message || t.common.genericError);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setMessage(t.auth.incompleteFields);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(t.auth.accountCreated);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err.message || t.common.genericError);
    } finally {
      setLoading(false);
    }
  };

  const goToMode = (next) => {
    setMode(next);
    setMessage("");
    setShowPassword(false);
  };

  const fieldWrapStyle = {
    position: "relative",
    marginBottom: "14px",
  };

  const fieldIconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: C.textMuted,
    pointerEvents: "none",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "14px",
    padding: "13px 14px 13px 42px",
    color: C.text,
    fontSize: "15px",
    minHeight: "48px",
  };

  const topIconBtnStyle = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.textMuted,
    cursor: "pointer",
    flexShrink: 0,
  };

  const cardTitle =
    mode === "reset-request" ? t.auth.resetRequestTitle : mode === "signin" ? t.auth.welcomeTitle : t.auth.signUpTitle;

  const BENEFIT_ICONS = [CalendarClock, ListChecks, Sparkles, HeartHandshake];

  // --- Bloques reutilizados en ambos layouts (escritorio/móvil) ---------

  const topBar = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "18px" }}>
      <LanguageSwitcher C={C} lang={lang} onChange={onChangeLanguage} t={t} height="38px" />
      {onToggleTheme && (
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
          title={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
          style={topIconBtnStyle}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      )}
    </div>
  );

  const brandHeader = (
    <div
      className="anro-auth-fade"
      style={{ textAlign: isWide ? "left" : "center", marginBottom: isWide ? "20px" : "18px" }}
    >
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        style={{
          width: isWide ? "64px" : "56px",
          height: isWide ? "64px" : "56px",
          borderRadius: "18px",
          display: "block",
          margin: isWide ? "0 0 14px" : "0 auto 10px",
          boxShadow: `0 10px 24px ${tint(accent, 0.3)}`,
        }}
      />
      <p
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 8px",
        }}
      >
        {t.common.appName}
      </p>
      <h1
        style={{
          fontSize: isWide ? "32px" : "22px",
          fontWeight: 800,
          lineHeight: 1.25,
          margin: "0 0 10px",
          letterSpacing: "-0.01em",
          color: C.text,
        }}
      >
        {t.auth.heroTitle}
      </h1>
      {isWide && (
        <p style={{ fontSize: "15px", color: C.textMuted, margin: 0, lineHeight: 1.6, maxWidth: "440px" }}>
          {t.auth.heroDescription}
        </p>
      )}
    </div>
  );

  const benefitsGrid = (
    <div
      className="anro-auth-fade"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: isWide ? "22px" : "18px",
        animationDelay: "0.1s",
      }}
    >
      {t.auth.benefits.map((benefit, i) => {
        const Icon = BENEFIT_ICONS[i] || Sparkles;
        return (
          <div
            key={benefit.title}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              background: tint(accent, 0.07),
              border: `1px solid ${tint(accent, 0.22)}`,
              borderRadius: "16px",
              padding: "14px",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: tint(accent, 0.2),
                color: accent,
                flexShrink: 0,
              }}
            >
              <Icon size={17} />
            </span>
            <span>
              <span style={{ display: "block", fontSize: "13px", fontWeight: 700, color: C.text, marginBottom: "2px" }}>
                {benefit.title}
              </span>
              <span style={{ display: "block", fontSize: "12px", color: C.textMuted, lineHeight: 1.4 }}>
                {benefit.description}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );

  const installAndDisclaimer = (
    <div className="anro-auth-fade" style={{ animationDelay: "0.18s" }}>
      <p
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12.5px",
          color: C.textMuted,
          margin: "0 0 10px",
        }}
      >
        <Download size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
        {t.auth.installHint}
      </p>
      <p style={{ fontSize: "11.5px", color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{t.auth.disclaimer}</p>
    </div>
  );

  const formCard = (
    <form
      onSubmit={handleSubmit}
      className="anro-auth-fade"
      style={{
        background: C.surface,
        borderRadius: "24px",
        padding: "26px 24px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
        border: `1px solid ${C.border}`,
        animationDelay: isWide ? "0.12s" : "0.04s",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "4px" }}>
        <InstallBanner C={C} t={t} />
      </div>

      <p style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 4px", color: C.text }}>{cardTitle}</p>
      {mode === "signin" && (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 18px", lineHeight: 1.5 }}>
          {t.auth.welcomeSubtitle}
        </p>
      )}
      {mode !== "signin" && <div style={{ marginBottom: "18px" }} />}

      {mode === "reset-request" && (
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "-6px 0 16px", lineHeight: 1.5 }}>
          {t.auth.resetRequestHint}
        </p>
      )}

      <div style={fieldWrapStyle}>
        <Mail size={16} style={fieldIconStyle} aria-hidden="true" />
        <input
          type="email"
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />
      </div>

      {mode !== "reset-request" && (
        <div style={fieldWrapStyle}>
          <Lock size={16} style={fieldIconStyle} aria-hidden="true" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: "42px" }}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            style={{
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              borderRadius: "10px",
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )}

      {mode === "signin" && (
        <button
          type="button"
          onClick={() => goToMode("reset-request")}
          style={{
            display: "block",
            marginTop: "-4px",
            marginBottom: "16px",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "12.5px",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          {t.auth.forgotPasswordLink}
        </button>
      )}

      {message && <p style={{ fontSize: "13px", color: C.mint, marginBottom: "14px", lineHeight: 1.5 }}>{message}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          // Relleno sólido, no degradado: un degradado hecho con tint()
          // (que mezcla con lo que haya detrás, no con blanco) se vería
          // distinto en modo claro y oscuro de forma impredecible justo
          // donde más importa el contraste con el texto. Sólido + sombra
          // de color da el mismo acabado "premium" sin ese riesgo.
          background: accent,
          border: "none",
          borderRadius: "14px",
          padding: "14px",
          minHeight: "50px",
          color: accentText,
          fontWeight: 700,
          fontSize: "15px",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: "14px",
          boxShadow: `0 10px 22px ${tint(accent, 0.35)}`,
        }}
      >
        {loading
          ? t.common.loading
          : mode === "reset-request"
          ? t.auth.resetRequestButton
          : mode === "signin"
          ? t.auth.signInButton
          : t.auth.signUpButton}
      </button>

      {mode === "reset-request" ? (
        <button
          type="button"
          onClick={() => goToMode("signin")}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "13px",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {t.auth.backToSignIn}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => goToMode(mode === "signin" ? "signup" : "signin")}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "13px",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {mode === "signin" ? t.auth.toggleToSignUp : t.auth.toggleToSignIn}
        </button>
      )}
    </form>
  );

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${tint(accent, 0.16)}, ${C.bg} 55%)`,
        color: C.text,
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        padding: isWide ? "40px 32px" : "24px 18px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes anroAuthFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anro-auth-fade {
          opacity: 0;
          animation: anroAuthFadeUp 0.5s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .anro-auth-fade {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: isWide ? "1040px" : "420px" }}>
        {topBar}

        {isWide ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "56px", alignItems: "start" }}>
            <div>
              {brandHeader}
              {benefitsGrid}
              {installAndDisclaimer}
            </div>
            <div>{formCard}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {brandHeader}
            {formCard}
            <div style={{ height: "22px" }} />
            {benefitsGrid}
            {installAndDisclaimer}
          </div>
        )}
      </div>
    </div>
  );
}
