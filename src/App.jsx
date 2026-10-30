import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import ResetPassword from "./ResetPassword";
import FocusFlowTDAH from "./FocusFlowTDAH";
import Paywall from "./Paywall";
import { DARK_THEME, LIGHT_THEME, getStoredTheme, storeTheme, getStoredAccent, storeAccent } from "./theme";
import { getStoredLanguage, storeLanguage, getTranslations } from "./i18n";
import { getStoredSpecies, storeSpecies } from "./mascotLogic";
import { getPlanState, hasPlusAccess } from "./plans";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  // 28 de octubre de 2026 — "recuperar contraseña": cuando la paciente entra
  // desde el enlace de recuperación que le llegó por correo, Supabase crea
  // una sesión válida y avisa con el evento "PASSWORD_RECOVERY" (ver el
  // listener más abajo). Sin esta bandera, esa sesión válida mandaría a la
  // paciente derecho a la app con la contraseña VIEJA todavía activa, sin
  // haber tenido oportunidad de cambiarla — por eso se revisa antes que
  // cualquier otra cosa en el render de abajo.
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [subscription, setSubscription] = useState(undefined); // undefined = cargando
  const saveTimeout = useRef(null);

  // Tema claro/oscuro — una sola fuente de verdad para toda la app, para
  // que la pantalla de login, el paywall y la app se vean consistentes.
  const [theme, setTheme] = useState(getStoredTheme);
  const C = theme === "light" ? LIGHT_THEME : DARK_THEME;
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      storeTheme(next);
      return next;
    });
  };

  // Evita un "flash" del color equivocado fuera del árbol de React (por
  // ejemplo el rebote al hacer scroll más allá del final de la página).
  useEffect(() => {
    document.body.style.background = C.bg;
  }, [C.bg]);

  // Acento personal — 26 de octubre de 2026, mismo patrón y mismo motivo
  // que el tema claro/oscuro justo arriba: preferencia de DISPOSITIVO, no
  // del progreso clínico. La paciente elige uno de los 6 colores que ya
  // tiene la app para los elementos que no pertenecen a ninguna categoría
  // fija (la mascota, el panel "Hoy") — los paneles con categoría propia
  // (medicamentos, ánimo, etc.) siguen con su color fijo sin importar el
  // acento elegido, para no perder esa señal visual de "qué tipo de cosa es
  // esta tarjeta".
  const [accentKey, setAccentKey] = useState(getStoredAccent);
  const changeAccent = (next) => {
    setAccentKey(next);
    storeAccent(next);
  };

  // Especie de la mascota — 27 de octubre de 2026, mismo patrón: la
  // paciente elige su personaje (ave, gato, planta o dragón) y la app
  // recuerda la elección por dispositivo. "ave" es el default — el mismo
  // personaje que ya veían todas las pacientes antes de que existiera esta
  // elección, así que nadie ve un cambio sin haberlo pedido.
  const [species, setSpecies] = useState(getStoredSpecies);
  const changeSpecies = (next) => {
    setSpecies(next);
    storeSpecies(next);
  };

  // Idioma — preferencia de DISPOSITIVO, mismo patrón y mismo motivo que el
  // tema claro/oscuro justo arriba (ver src/i18n.js): vive en localStorage,
  // no en el progreso clínico que viaja con la cuenta en Supabase. `t` es el
  // diccionario completo del idioma activo; se pasa como prop a cada
  // componente exactamente igual que `C` y `theme`, sin usar Context — así
  // se mantiene el único patrón que ya usa esta base de código.
  const [lang, setLang] = useState(getStoredLanguage);
  const t = getTranslations(lang);
  const changeLanguage = (next) => {
    setLang(next);
    storeLanguage(next);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setLoadingProgress(true);
    supabase
      .from("progress")
      .select("data")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("Error cargando progreso:", error);
        setProgress(data?.data || {});
        setLoadingProgress(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  const refreshSubscription = React.useCallback(() => {
    if (!session) return;
    supabase
      .from("subscriptions")
      .select("status, stripe_customer_id, plan")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Error cargando suscripción:", error);
        setSubscription(data || null);
      });
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refreshSubscription();
  }, [session, refreshSubscription]);

  // Si venimos de vuelta de un pago exitoso, reintenta cargar el estado
  // unas veces (el webhook de Stripe puede tardar unos segundos).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success" || !session) return;
    let tries = 0;
    const interval = setInterval(() => {
      tries += 1;
      refreshSubscription();
      if (tries >= 6) clearInterval(interval);
    }, 2000);
    window.history.replaceState({}, "", window.location.pathname);
    return () => clearInterval(interval);
  }, [session, refreshSubscription]);

  const handleProgressChange = (nextProgress) => {
    setProgress(nextProgress);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      if (!session) return;
      const { error } = await supabase
        .from("progress")
        .upsert({ user_id: session.user.id, data: nextProgress, updated_at: new Date().toISOString() });
      if (error) console.error("Error guardando progreso:", error);
    }, 800);
  };

  // 30 de octubre de 2026 — antes, si /api/create-portal-session fallaba
  // (ej. el stripe_customer_id guardado no existe en el modo/cuenta de
  // Stripe que esté usando esa variable de entorno — visto en Preview, con
  // llaves de prueba, contra un customer real de modo live), el botón "Mi
  // suscripción" no hacía absolutamente nada visible: ni mensaje, ni
  // redirección, solo silencio. Ahora cualquier falla (de red, o un error
  // que regrese la API) se guarda en manageSubscriptionError para que
  // FocusFlowTDAH la muestre junto al botón, en vez de que la paciente se
  // quede sin saber si su clic sirvió de algo.
  const [manageSubscriptionError, setManageSubscriptionError] = useState("");

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) return;
    setManageSubscriptionError("");
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || t.common.genericError);
      window.location.href = data.url;
    } catch (err) {
      setManageSubscriptionError(err.message || t.common.genericError);
    }
  };

  if (session === undefined) return null; // cargando sesión inicial

  // Antes que cualquier otra cosa: si venimos del enlace de recuperar
  // contraseña, Supabase ya dejó una sesión válida activa, pero la
  // paciente todavía no eligió su contraseña nueva — se queda en esta
  // pantalla sin importar si "session" ya existe.
  if (passwordRecovery) {
    return (
      <ResetPassword
        C={C}
        theme={theme}
        onToggleTheme={toggleTheme}
        t={t}
        lang={lang}
        onChangeLanguage={changeLanguage}
        onDone={() => setPasswordRecovery(false)}
      />
    );
  }

  if (!session)
    return (
      <Auth
        C={C}
        theme={theme}
        onToggleTheme={toggleTheme}
        t={t}
        lang={lang}
        onChangeLanguage={changeLanguage}
        accentKey={accentKey}
      />
    );
  if (loadingProgress || subscription === undefined) return null; // cargando datos

  // Fase 2 del sistema de planes (30 de octubre de 2026) — antes de esto,
  // cualquier cuenta sin suscripción activa en Stripe caía derecho al
  // Paywall sin importar qué tan nueva fuera, así que el trial de 14 días
  // sin tarjeta que ya describe src/plans.js nunca se aplicaba de verdad.
  // Ahora se usa esa misma regla de negocio ya aprobada: el trial se
  // calcula solo con auth.users.created_at (Supabase ya lo guarda, no hace
  // falta ninguna columna nueva) y da acceso completo a Plus mientras dura;
  // al terminar, si no hay una suscripción real y activa en Stripe, la
  // cuenta cae a Gratis (Paywall) — nunca a un estado distinto o bloqueado.
  const planState = getPlanState({
    accountCreatedAt: session.user.created_at,
    subscriptionStatus: subscription?.status,
    subscriptionPlan: subscription?.plan,
  });

  if (!hasPlusAccess(planState)) {
    return (
      <Paywall
        userId={session.user.id}
        userEmail={session.user.email}
        onSignOut={() => supabase.auth.signOut()}
        C={C}
        theme={theme}
        onToggleTheme={toggleTheme}
        t={t}
        lang={lang}
        onChangeLanguage={changeLanguage}
      />
    );
  }

  return (
    <FocusFlowTDAH
      initialProgress={progress}
      onProgressChange={handleProgressChange}
      userEmail={session.user.email}
      userId={session.user.id}
      onSignOut={() => supabase.auth.signOut()}
      // Fase 2: durante el trial (o el plan Gratis) no existe ninguna
      // suscripción real en Stripe todavía, así que no hay nada que
      // "administrar" — sin este chequeo, el botón "Mi suscripción" se
      // habría seguido mostrando durante el trial sin hacer nada al
      // presionarlo (handleManageSubscription ya se detenía en silencio
      // por dentro, pero es mejor no mostrar un botón muerto).
      onManageSubscription={subscription?.stripe_customer_id ? handleManageSubscription : undefined}
      manageSubscriptionError={manageSubscriptionError}
      planState={planState}
      C={C}
      theme={theme}
      onToggleTheme={toggleTheme}
      accentKey={accentKey}
      onChangeAccent={changeAccent}
      species={species}
      onChangeSpecies={changeSpecies}
      t={t}
      lang={lang}
      onChangeLanguage={changeLanguage}
    />
  );
}
