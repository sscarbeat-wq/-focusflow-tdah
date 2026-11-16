// "Cuerpo doble virtual": una sala de presencia en vivo donde el paciente
// puede sentir que hay otras personas trabajando al mismo tiempo que él —
// la técnica de "body doubling", bien documentada para TDAH (sostener el
// enfoque solo con la compañía silenciosa de alguien más, sin que esa
// persona tenga que hacer nada ni hablar).
//
// A propósito NO es un chat ni una lista de usuarios: usa Supabase
// Realtime Presence, que es efímero — nunca se guarda en una tabla, no
// sobrevive a que todos se desconecten, y no queda ningún historial. Lo
// único que se transmite por paciente es un avatar (ver avatarFor en
// bodyDoublePure.js — el animal que eligió como mascota, o un emoji
// anónimo si todavía no elige uno) y un estado de dos valores ("aquí" o
// "enfocando"). Nadie puede escribirle a nadie ni ver quién es quién más
// allá de ese avatar.
//
// La lógica pura (el avatar, cómo se arma la lista de participantes, y el
// vocabulario fijo de reacciones) vive en ./bodyDoublePure.js, probada
// aparte con Node antes de subir este cambio.
//
// Las reacciones (👋 💪 🎉) se mandan por un broadcast efímero del mismo
// canal de Supabase Realtime — nunca se guardan en ningún lado, no quedan
// en ninguna tabla, y solo viajan mientras la sala está en vivo. A
// propósito es un vocabulario fijo y pequeño, no texto libre, para no
// necesitar ninguna moderación.
//
// 15 de noviembre de 2026 ("quisiera que el paciente viera a las personas
// conectadas fácilmente"): antes el canal de Supabase Realtime solo se
// abría al tocar "Unirme a la sala" — así que no había forma de ver quién
// estaba conectado sin unirse primero. Ahora el canal se abre apenas esta
// pantalla existe (en cuanto `userId` está listo), escuchando presencia
// de entrada — eso es lo que llena `participants` incluso sin haberte
// unido. SOLO al llamar `join()` se manda `channel.track(...)`, que es lo
// que de verdad te agrega como alguien presente (antes de eso, estás
// mirando, no estás en la sala). `leave()` deja de transmitir tu propia
// presencia (`untrack`) pero no cierra el canal — sigues viendo quién hay,
// como antes de unirte. El canal se cierra de verdad solo cuando este
// componente se desmonta (se sale de Inicio).
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { avatarFor, participantsFromPresenceState, isValidReaction } from "./bodyDoublePure";

const ROOM = "senda-cuerpo-doble";
const REACTION_TOAST_MS = 4000;

export function useBodyDouble(userId, species) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [incomingReactions, setIncomingReactions] = useState([]);
  const channelRef = useRef(null);
  const reactionTimers = useRef([]);
  // `species` cambia con el tiempo (la paciente puede cambiar de mascota
  // mientras está en la sala) — una ref para que join()/setStatus() de
  // abajo siempre lean el valor más nuevo sin tener que reabrir el canal
  // cada vez que cambia.
  const speciesRef = useRef(species);
  speciesRef.current = species;

  const syncParticipants = useCallback(
    (channel) => {
      setParticipants(participantsFromPresenceState(channel.presenceState(), userId));
    },
    [userId]
  );

  const clearReactionTimers = useCallback(() => {
    reactionTimers.current.forEach(clearTimeout);
    reactionTimers.current = [];
  }, []);

  // Agrega una reacción a la lista visible (se usa tanto para las que
  // llegan de alguien más por broadcast, como para la propia al presionar
  // un botón — Supabase Realtime Broadcast, por default, NO le regresa su
  // propio mensaje a quien lo manda, así que sin esto, presionar un emoji
  // estando solo en la sala no mostraba ningún cambio.
  const pushReactionToast = useCallback((avatar, emoji) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setIncomingReactions((prev) => [...prev, { id, avatar, emoji }]);
    const timer = setTimeout(() => {
      setIncomingReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_TOAST_MS);
    reactionTimers.current.push(timer);
  }, []);

  // Abre el canal en modo "solo mirar" (sin track todavía) apenas hay
  // userId — es lo que deja ver quién está conectado sin unirse. Si ya
  // había un canal abierto, no hace nada (evita duplicar la suscripción).
  const ensureChannel = useCallback(() => {
    if (channelRef.current || !userId) return channelRef.current;
    const channel = supabase.channel(ROOM, { config: { presence: { key: userId } } });
    channel
      .on("presence", { event: "sync" }, () => syncParticipants(channel))
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        pushReactionToast(payload.avatar, payload.emoji);
      })
      .subscribe();
    channelRef.current = channel;
    return channel;
  }, [userId, syncParticipants, pushReactionToast]);

  // Deja de transmitir tu presencia, pero mantiene el canal abierto para
  // seguir viendo quién hay (no es lo mismo que desconectarse del todo).
  const leave = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.untrack();
    }
    clearReactionTimers();
    setJoined(false);
    setIncomingReactions([]);
  }, [clearReactionTimers]);

  const join = useCallback(() => {
    if (!userId) return;
    const channel = ensureChannel();
    if (!channel) return;
    channel.track({ userId, avatar: avatarFor(userId, speciesRef.current), status: "aqui" }).then(() => {
      setJoined(true);
      // "Memoria ANRO" (3 de noviembre de 2026): avisa por push a las
      // demás personas (nunca a esta) de que hay actividad en la sala
      // AHORA — ver api/body-double-ping.js para el porqué de este
      // diseño (la sala sigue siendo 100% efímera, sin servidor
      // escuchando el canal). "Fire and forget": si falla (sin
      // internet un instante, por ejemplo), no afecta en nada la
      // experiencia de unirse a la sala, así que el error solo se
      // registra en consola, nunca se le muestra a la paciente.
      fetch("/api/body-double-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch((err) => console.error("No se pudo avisar de la actividad en el cuerpo doble:", err.message));
    });
  }, [userId, ensureChannel]);

  // Manda una reacción sin texto a quien esté en la sala — no hace nada si
  // no estás en la sala o si el emoji no es parte del vocabulario fijo
  // (REACTIONS en bodyDoublePure.js), así que se puede llamar siempre sin
  // validar antes, igual que setStatus. También la muestra de inmediato
  // para quien la manda (ver pushReactionToast arriba), para que presionar
  // un botón siempre se sienta como que hizo algo, aunque esté solo en la
  // sala.
  const sendReaction = useCallback(
    (emoji) => {
      if (!channelRef.current || !userId || !isValidReaction(emoji)) return;
      const avatar = avatarFor(userId, speciesRef.current);
      channelRef.current.send({
        type: "broadcast",
        event: "reaction",
        payload: { avatar, emoji },
      });
      pushReactionToast(avatar, emoji);
    },
    [userId, pushReactionToast]
  );

  // Si el paciente está en la sala y empieza o termina una sesión de Modo
  // Enfoque, esto actualiza su estado visible para los demás — nunca truena
  // si no está en la sala (no hace nada en ese caso), así que se puede
  // llamar siempre sin preguntar antes, igual que scheduleStepsOnCalendar.
  const setStatus = useCallback(
    (status) => {
      if (!channelRef.current || !userId) return;
      channelRef.current.track({ userId, avatar: avatarFor(userId, speciesRef.current), status });
    },
    [userId]
  );

  // Apenas hay userId, se abre el canal en modo "solo mirar" (ver
  // ensureChannel arriba) — así `participants` ya refleja quién está
  // conectado desde que se ve Inicio, sin necesidad de unirse. Al
  // desmontarse (salir de Inicio del todo) se cierra el canal de verdad.
  useEffect(() => {
    ensureChannel();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      clearReactionTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { joined, participants, incomingReactions, join, leave, setStatus, sendReaction };
}
