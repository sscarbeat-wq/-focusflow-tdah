import React, { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { supabase } from "./supabaseClient";
import LanguageSwitcher from "./LanguageSwitcher";

// 28 de octubre de 2026 — segunda mitad del flujo de "recuperar
// contraseña" (ver Auth.jsx para la primera mitad, donde se pide el
// correo). Esta pantalla aparece cuando la paciente entra a la app desde
// el enlace que le llegó por correo: Supabase ya detectó el token de
// recuperación en la URL y emitió el evento "PASSWORD_RECOVERY"
// (supabase-js lo hace solo, con la configuración por defecto —
// detectSessionInUrl ya viene activado). App.jsx escucha ese evento y
// muestra esta pantalla EN VEZ de la app normal, aunque ya exista una
// sesión — si no se hiciera así, la paciente entraría directo a la app
// con la contraseña vieja todavía activa, sin haber tenido oportunidad de
// cambiarla.
//
// Mismo lenguaje visual que Auth.jsx (misma tarjeta, mismos controles de
// idioma/tema) para que no se sienta como una pantalla aparte.
export default function ResetPassword({ C, theme, onToggleTheme, t, lang, onChangeLanguage, onDone }) {
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!password1.trim() || !password2.trim()) {
      setMessage(t.auth.incompleteFields);
      return;
    }
    if (password1 !== password2) {
      setMessage(t.auth.newPasswordMismatch);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password1 });
      if (error) throw error;
      setMessage(t.auth.newPasswordSuccess);
      setDone(true);
    } catch (err) {
      setMessage(err.message || t.common.genericError);
    } finally {
      setLoading(false);
    }
  };

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
        onSubmit={done ? (e) => e.preventDefault() : handleSubmit}
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

        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>{t.common.appName}</h1>
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 10px" }}>{t.auth.newPasswordTitle}</p>
        {!done && (
          <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
            {t.auth.newPasswordHint}
          </p>
        )}

        {!done && (
          <>
            <input
              type="password"
              placeholder={t.auth.newPasswordPlaceholder}
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder={t.auth.newPasswordConfirmPlaceholder}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
          </>
        )}

        {message && (
          <p style={{ fontSize: "13px", color: C.mint, marginBottom: "14px", lineHeight: 1.5 }}>{message}</p>
        )}

        {done ? (
          <button
            type="button"
            onClick={onDone}
            style={{
              width: "100%",
              background: C.mint,
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              color: C.mintText,
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            {t.auth.signInButton}
          </button>
        ) : (
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
            }}
          >
            {loading ? t.common.loading : t.auth.newPasswordButton}
          </button>
        )}
      </form>
    </div>
  );
}
