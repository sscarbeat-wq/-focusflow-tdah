import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { supabase } from "./supabaseClient";
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
export default function Auth({ C, theme, onToggleTheme, t, lang, onChangeLanguage }) {
  const [mode, setMode] = useState("signin"); // signin | signup | reset-request
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "12px 14px",
    color: C.text,
    fontSize: "15px",
    marginBottom: "14px",
  };

  const title =
    mode === "reset-request" ? t.auth.resetRequestTitle : mode === "signin" ? t.auth.signInTitle : t.auth.signUpTitle;

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: C.surface,
          borderRadius: "12px",
          padding: "32px",
          width: "100%",
          maxWidth: "360px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", gap: "8px" }}>
          <LanguageSwitcher C={C} lang={lang} onChange={onChangeLanguage} t={t} height="34px" />
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
              title={theme === "light" ? t.common.toDarkMode : t.common.toLightMode}
              style={{
                background: "transparent",
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textMuted,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          )}
        </div>
        <div style={{ marginBottom: "-8px" }}>
          <InstallBanner C={C} t={t} />
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>{t.common.appName}</h1>
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 24px" }}>{title}</p>

        {mode === "reset-request" && (
          <p style={{ fontSize: "13px", color: C.textMuted, margin: "-14px 0 16px", lineHeight: 1.5 }}>
            {t.auth.resetRequestHint}
          </p>
        )}

        <input
          type="email"
          placeholder={t.auth.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />

        {mode !== "reset-request" && (
          <input
            type="password"
            placeholder={t.auth.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => goToMode("reset-request")}
            style={{
              display: "block",
              marginTop: "-6px",
              marginBottom: "14px",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              fontSize: "12px",
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
            background: C.mint,
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            color: C.mintText,
            fontWeight: 600,
            fontSize: "15px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "16px",
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
            }}
          >
            {mode === "signin" ? t.auth.toggleToSignUp : t.auth.toggleToSignIn}
          </button>
        )}
      </form>
    </div>
  );
}
