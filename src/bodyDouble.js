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
// La lógica pura (el emoji anónimo, y cómo se arma la lista de
// participantes) vive en ./bodyDoublePure.js, probada aparte con Node
// antes de subir este cambio.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import { avatarFor, participantsFromPresenceState } from "./bodyDoublePure";

const ROOM = "senda-cuerpo-doble";

export function useBodyDouble(userId) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const channelRef = useRef(null);

  const syncParticipants = useCallback(
    (channel) => {
      setParticipants(participantsFromPresenceState(channel.presenceState(), userId));
    },
    [userId]
  );

  const leave = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setJoined(false);
    setParticipants([]);
  }, []);

  const join = useCallback(() => {
    if (channelRef.current || !userId) return;
    const channel = supabase.channel(ROOM, { config: { presence: { key: userId } } });
    channel.on("presence", { event: "sync" }, () => syncParticipants(channel)).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ userId, avatar: avatarFor(userId), status: "aqui" });
        setJoined(true);
      }
    });
    channelRef.current = channel;
  }, [userId, syncParticipants]);

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

  return { joined, participants, join, leave, setStatus };
}
