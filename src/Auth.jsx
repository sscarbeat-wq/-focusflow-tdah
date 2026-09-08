import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import InstallBanner from "./InstallBanner";

const C = {
  bg: "#141B2E",
  surface: "#1D2740",
  surfaceAlt: "#24304D",
  border: "#34405F",
  text: "#E8EAF0",
  textMuted: "#8E96AC",
  mint: "#8FCBB0",
  mintText: "#12261E",
};

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email.trim() || !password.trim()) {
      setMessage("Completa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "12px 14px",
    color: C.text,
    fontSize: "15px",
    marginBottom: "14px",
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
        onSubmit={handleSubmit}
        style={{
          background: C.surface,
          borderRadius: "8px",
          padding: "32px",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        <div style={{ marginBottom: "-8px" }}>
          <InstallBanner />
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>FocusFlow TDAH</h1>
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 24px" }}>
          {mode === "signin" ? "Entra a tu cuenta" : "Crea tu cuenta"}
        </p>

        <input
          type="email"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />

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
            borderRadius: "6px",
            padding: "12px",
            color: C.mintText,
            fontWeight: 600,
            fontSize: "15px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "16px",
          }}
        >
          {loading ? "Un momento..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage("");
          }}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          {mode === "signin" ? "¿No tienes cuenta? Créala aquí" : "¿Ya tienes cuenta? Entra aquí"}
        </button>
      </form>
    </div>
  );
}
