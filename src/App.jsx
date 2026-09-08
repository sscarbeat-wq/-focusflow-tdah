import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import FocusFlowTDAH from "./FocusFlowTDAH";
import Paywall from "./Paywall";

const ACTIVE_STATUSES = ["active", "trialing"];

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [subscription, setSubscription] = useState(undefined); // undefined = cargando
  const saveTimeout = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
      .select("status, stripe_customer_id")
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

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) return;
    const res = await fetch("/api/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (session === undefined) return null; // cargando sesión inicial
  if (!session) return <Auth />;
  if (loadingProgress || subscription === undefined) return null; // cargando datos

  const isActive = subscription && ACTIVE_STATUSES.includes(subscription.status);

  if (!isActive) {
    return (
      <Paywall
        userId={session.user.id}
        userEmail={session.user.email}
        onSignOut={() => supabase.auth.signOut()}
      />
    );
  }

  return (
    <FocusFlowTDAH
      initialProgress={progress}
      onProgressChange={handleProgressChange}
      userEmail={session.user.email}
      onSignOut={() => supabase.auth.signOut()}
      onManageSubscription={handleManageSubscription}
    />
  );
}
