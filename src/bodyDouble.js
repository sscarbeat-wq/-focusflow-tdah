// "Cuerpo doble virtual": una sala de presencia en vivo donde el paciente
// puede sentir que hay otras personas trabajando al mismo tiempo que él —
// la técnica de "body doubling", bien documentada para TDAH (sostener el
// enfoque solo con la compañía silenciosa de alguien más, sin que esa
// persona tenga que hacer nada ni hablar).
//
// A propósito NO es un chat ni una lista de usuarios: usa Supabase
// Realtime Presence, que es efímero — nunca se guarda en una tabla, no
// sobrevive a que todos se desconecten, y no queda ningún historial. Lo
// único que se transmite por paciente es un emoji anónimo (siempre el
// mismo para la misma cuenta, para poder distinguir "cuántas personas
// distintas" hay, pero sin revelar nombre, correo ni nada identificable)
// y un estado de dos valores ("aquí" o "enfocando"). Nadie puede escribirle
// a nadie ni ver quién es quién.
//
// La lógica pura (el emoji anónimo, cómo se arma la lista de
// participantes, y el vocabulario fijo de reacciones) vive en
// ./bodyDoublePure.js, probada aparte con Node antes de subir este cambio.
//
// Las reacciones (👋 💪 🎉) se mandan por un broadcast efímero del mismo
// canal de Supabase Realtime — nunca se guardan en ningún lado, no quedan
// en ninguna tabla, y solo viajan mientras la sala está en vivo. A
// propósito es un vocabulario fijo y pequeño, no texto libre, para no
// necesitar ninguna moderación.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { avatarFor, participantsFromPresenceState, isValidReaction } from "./bodyDoublePure";

const ROOM = "senda-cuerpo-doble";
const REACTION_TOAST_MS = 4000;

export function useBodyDouble(userId) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [incomingReactions, setIncomingReactions] = useState([]);
  const channelRef = useRef(null);
  const reactionTimers = useRef([]);

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

  const leave = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    clearReactionTimers();
    setJoined(false);
    setParticipants([]);
    setIncomingReactions([]);
  }, [clearReactionTimers]);

  const join = useCallback(() => {
    if (channelRef.current || !userId) return;
    const channel = supabase.channel(ROOM, { config: { presence: { key: userId } } });
    channel
      .on("presence", { event: "sync" }, () => syncParticipants(channel))
      .on("broadcast", { event: "reaction" }, ({ payload }) => {
        pushReactionToast(payload.avatar, payload.emoji);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId, avatar: avatarFor(userId), status: "aqui" });
          setJoined(true);
        }
      });
    channelRef.current = channel;
  }, [userId, syncParticipants, pushReactionToast]);

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
      const avatar = avatarFor(userId);
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
      channelRef.current.track({ userId, avatar: avatarFor(userId), status });
    },
    [userId]
  );

  // Salir de la sala al cerrar/cambiar de pantalla, para no dejar
  // presencias "fantasma" colgadas.
  useEffect(() => () => leave(), [leave]);

  return { joined, participants, incomingReactions, join, leave, setStatus, sendReaction };
}
