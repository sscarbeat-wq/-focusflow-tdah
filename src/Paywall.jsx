import React, { useState } from "react";
import { Sparkles, LogOut, Sun, Moon } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Paywall({ userId, userEmail, onSignOut, C, theme, onToggleTheme, t, lang, onChangeLanguage }) {
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
      if (!res.ok) throw new Error(data.error || t.paywall.checkoutError);
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || t.common.genericError);
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
                borderRadius: "8px",
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
        <Sparkles size={28} color={C.amber} style={{ marginBottom: "14px" }} />
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>{t.paywall.title}</h1>
        <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          {t.paywall.pitch}
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
          {loading ? t.common.loading : t.paywall.subscribeButton}
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
          <LogOut size={14} /> {t.common.signOut}
        </button>
      </div>
    </div>
  );
}
