import React, { useState } from "react";
import { Sun, Moon, Mail, Lock, Eye, EyeOff } from "lucide-react";
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
// Fase 2 (29 de octubre de 2026) — rediseño visual a petición de la
// doctora ("un diseño bonito, revisa lo que tienen las apps más
// descargadas"): esta es la PRIMERA pantalla que ve cualquier paciente
// nueva, antes de cualquier otra cosa de la app, así que es la que más
// "primera impresión" carga. Se tomaron prestados 3 patrones que ya
// comparten casi todas las apps de hábitos/bienestar con más descargas
// (Tiimo, Structured, Headspace, Calm): (1) encabezado de marca grande y
// centrado arriba de la tarjeta, en vez de un título chico dentro de ella;
// (2) campos con ícono a la izquierda en vez de solo texto; (3) botón
// primario con el color de acento de la app (el mismo "acento personal" que
// ya existe desde el 26 de octubre — ver theme.js) en vez de un color fijo,
// para que la pantalla ya se sienta "de esta app" desde antes de entrar.
// También se agregó el botón de mostrar/ocultar contraseña (ojo), presente
// en prácticamente cualquier login actual — único elemento nuevo de
// INTERACCIÓN de este cambio; todo lo demás es solo apariencia. NINGUNA
// lógica de autenticación se tocó: mismos 3 modos (signin/signup/
// reset-request), mismas validaciones, mismas llamadas a Supabase, mismos
// mensajes.
export default function Auth({ C, theme, onToggleTheme, t, lang, onChangeLanguage, accentKey }) {
  const [mode, setMode] = useState("signin"); // signin | signup | reset-request
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const title =
    mode === "reset-request" ? t.auth.resetRequestTitle : mode === "signin" ? t.auth.signInTitle : t.auth.signUpTitle;

  return (
    <div
      style={{
        background: `linear-gradient(160deg, ${tint(accent, 0.16)}, ${C.bg} 55%)`,
        color: C.text,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        padding: "24px 18px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
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

        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              display: "block",
              margin: "0 auto 12px",
              boxShadow: `0 10px 24px ${tint(accent, 0.3)}`,
            }}
          />
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            {t.common.appName}
          </h1>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{t.auth.tagline}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: C.surface,
            borderRadius: "24px",
            padding: "26px 24px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ marginBottom: "4px" }}>
            <InstallBanner C={C} t={t} />
          </div>

          <p style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 18px" }}>{title}</p>

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

          {message && (
            <p style={{ fontSize: "13px", color: C.mint, marginBottom: "14px", lineHeight: 1.5 }}>{message}</p>
          )}

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
      </div>
    </div>
  );
}
