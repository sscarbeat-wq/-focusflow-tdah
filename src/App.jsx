import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./Auth";
import FocusFlowTDAH from "./FocusFlowTDAH";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
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

  if (session === undefined) return null; // cargando sesión inicial
  if (!session) return <Auth />;
  if (loadingProgress) return null; // cargando progreso guardado

  return (
    <FocusFlowTDAH
      initialProgress={progress}
      onProgressChange={handleProgressChange}
      userEmail={session.user.email}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}
