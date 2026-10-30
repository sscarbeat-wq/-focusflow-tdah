import React, { useState } from "react";
import { Sparkles, LogOut, Sun, Moon, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

// Fase 3 del sistema de planes (30 de octubre de 2026) — hasta ahora Paywall
// solo existía como pantalla completa obligatoria para cuentas sin Plus (ver
// App.jsx). Ahora el plan Gratis entra de verdad a la app, así que este
// mismo componente también se abre a demanda desde dentro de una
// herramienta ("quiero suscribirme" en vez de "tengo que suscribirme para
// entrar"). onClose es opcional y solo se pasa en ese segundo caso — cuando
// App.jsx todavía bloquea por completo (sin sesión Plus ni trial), no hay a
// dónde "cerrar" y el botón no se muestra.
export default function Paywall({ userId, userEmail, onSignOut, C, theme, onToggleTheme, t, lang, onChangeLanguage, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fase 2 de suscripciones (30 de octubre de 2026) — api/create-checkout-session.js
  // acepta 2 precios (mensual y anual) y exige que el navegador le diga
  // cuál quiere (ver el comentario de ese archivo). "monthly" queda como
  // selección por default porque es el plan que ya existía — nadie pierde
  // su expectativa de precio por defecto con este cambio.
  const PRICE_IDS = {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY,
    annual: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL,
  };
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const handleSubscribe = async () => {
    setError("");
    const priceId = PRICE_IDS[selectedPlan];
    if (!priceId) {
      // Defensivo: si falta configurar la variable de entorno en Vercel
      // para el plan elegido, mejor un mensaje claro aquí que un "priceId
      // no reconocido" confuso viniendo del servidor.
      setError(t.paywall.checkoutError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail, priceId }),
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
        // onClose solo existe en el modo "a demanda" (Fase 3) — ahí Paywall
        // se monta por encima de FocusFlowTDAH en vez de ser la única cosa
        // en la página, así que necesita position:fixed para cubrir la
        // pantalla en vez de solo empujar contenido hacia abajo en el flujo
        // normal.
        position: onClose ? "fixed" : "static",
        inset: onClose ? 0 : undefined,
        zIndex: onClose ? 1000 : undefined,
        minHeight: "100vh",
        overflowY: "auto",
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
          borderRadius: "12px",
          padding: "36px 32px",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", gap: "8px" }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t.paywall.closeLabel}
              title={t.paywall.closeLabel}
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
              <X size={16} />
            </button>
          )}
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
        <Sparkles size={28} color={C.amber} style={{ marginBottom: "14px" }} />
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 8px" }}>{t.paywall.title}</h1>
        <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 24px" }}>
          {t.paywall.pitch}
        </p>

        <div
          role="radiogroup"
          aria-label={t.paywall.planPickerLabel}
          style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
        >
          {["monthly", "annual"].map((plan) => {
            const active = selectedPlan === plan;
            return (
              <button
                key={plan}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  flex: 1,
                  background: active ? C.mint : "transparent",
                  border: `1px solid ${active ? C.mint : C.border}`,
                  borderRadius: "10px",
                  padding: "10px 8px",
                  color: active ? C.mintText : C.text,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {plan === "monthly" ? t.paywall.monthlyPlanLabel : t.paywall.annualPlanLabel}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
          {selectedPlan === "monthly" ? t.paywall.monthlyPriceLabel : t.paywall.annualPriceLabel}
          {selectedPlan === "annual" && (
            <>
              {" · "}
              <span style={{ color: C.mint, fontWeight: 600 }}>{t.paywall.annualSavingsLabel}</span>
            </>
          )}
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
            borderRadius: "12px",
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
