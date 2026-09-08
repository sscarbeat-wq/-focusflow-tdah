import React, { useState } from "react";
import { Sparkles, LogOut } from "lucide-react";

const C = {
  bg: "#141B2E",
  surface: "#1D2740",
  surfaceAlt: "#24304D",
  border: "#34405F",
  text: "#E8EAF0",
  textMuted: "#8E96AC",
  mint: "#8FCBB0",
  mintText: "#12261E",
  amber: "#D9A15C",
};

export default function Paywall({ userId, userEmail, onSignOut }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
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
      <div
        style={{
          background: C.surface,
          borderRadius: "8px",
          padding: "36px 32px",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
        }}
      >
        <Sparkles size={28} color={C.amber} style={{ marginBottom: "14px" }} />
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>Desbloquea FocusFlow</h1>
        <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          Acceso completo al desglosador de tareas, auditor de tiempo, freno de impulsividad, respiración guiada,
          reestructuración de pensamientos y rastreador de hábitos.
        </p>

        {error && (
          <p style={{ fontSize: "13px", color: C.amber, marginBottom: "16px", lineHeight: 1.5 }}>{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            width: "100%",
            background: C.mint,
            border: "none",
            borderRadius: "6px",
            padding: "14px",
            color: C.mintText,
            fontWeight: 600,
            fontSize: "15px",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "18px",
          }}
        >
          {loading ? "Un momento..." : "Suscribirme"}
        </button>

        <button
          onClick={onSignOut}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
