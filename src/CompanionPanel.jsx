import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, AlertTriangle, RotateCcw, Lock, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { SITUATIONS, getSituation, nextResponseIndex } from "./companionSituations";

// El reconocimiento de voz del navegador (Web Speech API) necesita un BCP-47
// completo, no solo el código de 2 letras — mismo mapa que ya se usa en
// GoodMomentsPanel.jsx.
const SPEECH_LOCALES = { es: "es-MX", en: "en-US", fr: "fr-FR", pt: "pt-BR" };

// 25 de noviembre de 2026 ("añade que lo pueda decir con voz"): dictado del
// propio navegador para el cuadro de texto libre — mismo patrón que
// GoodMomentsPanel.jsx (a propósito NO pasa por api/quick-capture.js ni
// ninguna IA, solo transcribe; si el navegador no lo soporta, ej. Safari de
// iPhone, el botón de micrófono simplemente no aparece y el textarea sigue
// funcionando igual con el teclado).
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// 27 de noviembre de 2026 ("podría ser hablado el comentario?"): que el
// mensaje de apoyo (situación fija o respuesta al texto libre) se pueda
// escuchar en voz alta con un botón — texto a voz (SpeechSynthesis), lo
// opuesto del dictado de arriba (voz a texto). A propósito NO es automático:
// este mensaje puede llegar mientras la paciente está en un lugar donde no
// quiere que el celular hable solo, a diferencia de la narración de
// MindfulnessPanel.jsx (ahí sí es automática porque es una práctica guiada
// que la paciente ya eligió empezar). Si el navegador no lo soporta, el
// botón de "Escuchar" simplemente no aparece.
function getSpeechSynthesis() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
}

// Misma voz suave/ASMR que ya se afinó para la burbuja de respiración y
// MindfulnessPanel.jsx (rate/pitch/volume más bajos que el default, y una
// voz "natural" del navegador si hay alguna disponible) — un mensaje de
// apoyo se beneficia del mismo tono tranquilo, no de la voz robótica por
// default del sistema.
function pickSoftVoice(speechSynthesis, langCode) {
  try {
    const voices = speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    const base = (langCode || "es").slice(0, 2).toLowerCase();
    const matching = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(base));
    if (!matching.length) return null;
    const soft = matching.find((v) =>
      /female|mujer|natural|enhanced|premium|neural|siri|google|paulina|mónica|monica|lucía|lucia|lupe|sabina|helena|esperanza/i.test(
        v.name
      )
    );
    return soft || matching[0];
  } catch (_) {
    return null;
  }
}

// Compañero de apoyo situacional — botones de entrada rápida (5 situaciones
// fijas) MÁS, desde el 24 de noviembre de 2026, un cuadro de texto libre
// para que la paciente describa su propia situación con sus palabras.
//
// Hasta esa fecha esto era solo botones, a propósito (decisión explícita de
// la usuaria para acotar el riesgo clínico/legal: la paciente nunca podía
// escribirle a una IA algo que no esperábamos). La usuaria pidió
// explícitamente poder dejar que la paciente plantee su propia situación, y
// eligió resolver la tensión con la regla anterior así: el texto libre SÍ se
// manda a la IA (api/companion-response.js), con una salvaguarda nueva del
// lado de la entrada — el texto se revisa con containsRiskLanguage() ANTES
// de llegar a la IA, no solo después — además de la salvaguarda de salida
// que ya existía. El botón de crisis sigue viviendo separado del resto, con
// su propio estilo, nunca pasa por la IA (ni el de botones ni el de texto
// libre), y su mensaje nunca se genera ni se continúa — es texto fijo con
// recursos reales.
//
// Las 5 situaciones normales piden una respuesta a api/companion-response.js
// (IA, gpt-4o-mini) cada vez que se abren o se pide "otra idea". Si la IA no
// responde (límite mensual, red, error del servidor) se usa en su lugar uno
// de los textos fijos de respaldo (fallbackResponses), rotando sin repetir —
// la paciente nunca se queda sin un mensaje de apoyo. El texto libre no tiene
// un fallbackResponses fijo posible (no sabemos de antemano qué va a
// escribir la paciente), así que si la IA falla se muestra un error simple
// con opción de reintentar — nunca se deja a la paciente con un texto que no
// corresponde a lo que escribió.
// Fase 3 del sistema de planes (30 de octubre de 2026) — "companionAiReplies"
// es Plus; el botón de crisis y el menú de las 5 situaciones NUNCA se
// restringen, en ningún plan (ver el comentario de PLUS_FEATURE_KEYS en
// plans.js). El texto libre, al depender por completo de la IA (no hay
// fallback fijo posible), es Plus también — en plan Gratis el botón de
// enviar abre el mismo upsell que ya existía para las respuestas
// personalizadas, sin mandar el texto a ningún lado. isPlus=true por
// default para no afectar a quien use este componente sin pasar la prop
// todavía.
export default function CompanionPanel({ C, t, lang, userId, onNavigate, isPlus = true, onRequestUpgrade }) {
  const [activeId, setActiveId] = useState(null); // id de SITUATIONS, "crisis", "custom", o null
  const [textBySituation, setTextBySituation] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [usingFallback, setUsingFallback] = useState({});
  const [fallbackIndexBySituation, setFallbackIndexBySituation] = useState({});

  // --- Texto libre (24 de noviembre de 2026) ---
  const [freeText, setFreeText] = useState(""); // lo que la paciente va escribiendo
  const [freeTextSent, setFreeTextSent] = useState(""); // el último texto que sí se mandó (para "otra idea" y reintentar)
  const [customResponse, setCustomResponse] = useState(null);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState(false);
  const [listening, setListening] = useState(false); // dictado por voz del cuadro de texto libre
  const recognitionRef = useRef(null);
  const SpeechRecognition = getSpeechRecognition();

  // --- Escuchar la respuesta (texto a voz) ---
  const [speaking, setSpeaking] = useState(false);
  const speechSynthesis = getSpeechSynthesis();
  const speechSynthesisSupported =
    !!speechSynthesis && typeof window !== "undefined" && !!window.SpeechSynthesisUtterance;

  const speak = (text) => {
    if (!speechSynthesisSupported || !text) return;
    speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    const voice = pickSoftVoice(speechSynthesis, utterance.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.82;
    utterance.pitch = 0.92;
    utterance.volume = 0.65;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis?.cancel();
    setSpeaking(false);
  };

  // Si se cierra o navega fuera del panel con la voz todavía sonando, hay
  // que apagarla — si no, sigue hablando de fondo sin que se vea el texto.
  useEffect(() => {
    return () => {
      speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALES[lang] || SPEECH_LOCALES.es;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    // 25 de noviembre de 2026: mismo bug reportado en MoodLog.jsx ("llegué
    // Llegué temprano Llegué temprano al trabajo" — texto duplicado y
    // encimado) — en algunos navegadores/celulares onresult se dispara
    // varias veces para el mismo audio aunque interimResults esté en false.
    // Antes cada disparo se pegaba al texto anterior, duplicando todo.
    // Ahora se arma el transcript completo desde event.results en cada
    // disparo y se REEMPLAZA (texto de antes + ese transcript completo), así
    // no importa cuántas veces dispare el navegador — nunca se duplica.
    const baseText = freeText;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += (transcript ? " " : "") + (event.results[i][0]?.transcript || "");
      }
      setFreeText(baseText ? `${baseText} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const showFallback = (situationId) => {
    const responses = t.companionSituationContent[situationId].fallbackResponses;
    const idx = nextResponseIndex(responses.length, fallbackIndexBySituation[situationId]);
    setFallbackIndexBySituation((prev) => ({ ...prev, [situationId]: idx }));
    setTextBySituation((prev) => ({ ...prev, [situationId]: responses[idx] }));
    setUsingFallback((prev) => ({ ...prev, [situationId]: true }));
  };

  const requestAiResponse = async (situationId, avoidText) => {
    setLoadingId(situationId);
    try {
      const res = await fetch("/api/companion-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, situationId, avoid: avoidText || "", language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.companion.aiError);
      if (data.unsafe) {
        // Salvaguarda: la IA tocó un tema de riesgo — nunca se muestra su
        // texto, se trata exactamente como si hubieran elegido el botón de
        // crisis.
        setActiveId("crisis");
        return;
      }
      setTextBySituation((prev) => ({ ...prev, [situationId]: data.response }));
      setUsingFallback((prev) => ({ ...prev, [situationId]: false }));
    } catch (err) {
      console.error("Compañero de apoyo — fallo IA, usando respaldo fijo:", err);
      showFallback(situationId);
    } finally {
      setLoadingId(null);
    }
  };

  const openSituation = (situationId) => {
    stopSpeaking();
    setActiveId(situationId);
    // Fase 3: plan Gratis nunca llama a la IA aquí — usa directo uno de los
    // textos de respaldo fijos, los mismos que ya existían como red de
    // seguridad para cuando la IA falla. La paciente ve un mensaje de apoyo
    // real de inmediato, nunca una pantalla vacía ni un bloqueo.
    if (!isPlus) {
      showFallback(situationId);
      return;
    }
    requestAiResponse(situationId, null);
  };

  const otraIdea = (situationId) => {
    stopSpeaking();
    if (!isPlus || usingFallback[situationId]) {
      // Ya estamos en modo respaldo para esta situación (la IA falló antes,
      // o el plan Gratis nunca la llama) — seguimos rotando el texto fijo
      // en vez de pedirle algo a la IA.
      showFallback(situationId);
      return;
    }
    requestAiResponse(situationId, textBySituation[situationId]);
  };

  // Pide a la IA una respuesta para el texto libre que escribió la paciente
  // (avoidText solo se usa en "otra idea", para no repetir el mensaje
  // anterior). La salvaguarda de entrada (containsRiskLanguage sobre lo que
  // escribió la paciente) vive del lado del servidor, en
  // api/companion-response.js — acá solo se maneja la respuesta.
  const requestFreeTextResponse = async (text, avoidText) => {
    setCustomLoading(true);
    setCustomError(false);
    try {
      const res = await fetch("/api/companion-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, freeText: text, avoid: avoidText || "", language: lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.companion.aiError);
      if (data.unsafe) {
        // Misma salvaguarda que con las situaciones fijas: nunca se muestra
        // el texto (si lo hubiera) — se trata como si hubieran elegido el
        // botón de crisis.
        setActiveId("crisis");
        return;
      }
      setCustomResponse(data.response);
      setActiveId("custom");
    } catch (err) {
      console.error("Compañero de apoyo — texto libre, fallo IA:", err);
      // A diferencia de las situaciones fijas, aquí no hay un
      // fallbackResponses posible (no sabemos de antemano qué iba a
      // escribir la paciente) — se muestra un error simple con reintentar.
      setCustomError(true);
    } finally {
      setCustomLoading(false);
    }
  };

  const submitFreeText = () => {
    const text = freeText.trim();
    if (!text || customLoading) return;
    if (listening) stopListening();
    stopSpeaking();
    if (!isPlus) {
      // Plan Gratis: el texto libre nunca se manda a ningún lado — mismo
      // upsell que ya existía para las respuestas personalizadas.
      onRequestUpgrade?.();
      return;
    }
    // Mismo patrón que openSituation(): activeId cambia DE INMEDIATO (no
    // solo cuando la respuesta llega), para que la vista de "custom" —
    // la única que sabe mostrar el estado de carga y, si algo sale mal, el
    // error — quede montada mientras se espera la IA. Si esto se dejara
    // para después (como estaba antes), un fallo de red dejaba a la
    // paciente viendo el menú de siempre sin ningún aviso de error.
    setActiveId("custom");
    setFreeTextSent(text);
    setCustomResponse(null);
    requestFreeTextResponse(text, null);
  };

  const otraIdeaCustom = () => {
    if (!freeTextSent || customLoading) return;
    stopSpeaking();
    requestFreeTextResponse(freeTextSent, customResponse);
  };

  const goBackFromCustom = () => {
    stopSpeaking();
    setActiveId(null);
    setCustomResponse(null);
    setCustomError(false);
    setFreeText("");
    setFreeTextSent("");
  };

  const goBack = () => {
    stopSpeaking();
    setActiveId(null);
  };

  const btnOption = {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "11px 14px",
    color: C.text,
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "8px",
  };

  const btnCrisis = {
    ...btnOption,
    background: "transparent",
    border: `1px solid ${C.rose}`,
    color: C.rose,
    marginTop: "6px",
    marginBottom: 0,
  };

  const btnLink = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.mint,
    border: "none",
    borderRadius: "12px",
    padding: "9px 14px",
    color: C.mintText,
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const btnBack = {
    background: "transparent",
    border: "none",
    color: C.textMuted,
    fontSize: "12px",
    cursor: "pointer",
    padding: "8px 0 0",
    display: "block",
  };

  const btnDisabled = { opacity: 0.5, cursor: "default" };

  // --- Vista de crisis: mensaje fijo, sin continuar la conversación ---
  if (activeId === "crisis") {
    return (
      <div>
        <div
          style={{
            background: C.surfaceAlt,
            border: `1px solid ${C.rose}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "4px",
          }}
        >
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: 0 }}>{t.crisis.message}</p>
        </div>
        <button onClick={goBack} style={btnBack}>
          {t.companion.back}
        </button>
      </div>
    );
  }

  // --- Vista del texto libre: respuesta de la IA a lo que escribió la
  // paciente. Sin "fallbackResponses" posible (no es una de las 5
  // situaciones fijas) y sin botón de "ir a la herramienta" (no sabemos de
  // antemano cuál aplica a un texto libre) — solo el mensaje, "otra idea" y
  // volver. Si la IA falló, se muestra un error con botón de reintentar en
  // vez de un texto que no corresponde a lo que escribió la paciente. ---
  if (activeId === "custom") {
    return (
      <div>
        {customError ? (
          <div>
            <p style={{ fontSize: "13px", color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>
              {t.companion.aiError}
            </p>
            <button onClick={otraIdeaCustom} style={{ ...btnLink, marginBottom: "10px" }}>
              {t.companion.freeTextRetry}
            </button>
          </div>
        ) : customLoading && !customResponse ? (
          <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
            {t.companion.thinking}
          </p>
        ) : (
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>{customResponse}</p>
        )}
        {!customError && customResponse && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => !customLoading && otraIdeaCustom()}
              disabled={customLoading}
              style={{ ...btnBack, padding: 0, ...(customLoading ? btnDisabled : {}) }}
            >
              <RotateCcw size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
              {t.companion.anotherIdea}
            </button>
            {speechSynthesisSupported && (
              <button
                type="button"
                onClick={() => (speaking ? stopSpeaking() : speak(customResponse))}
                style={{ ...btnBack, padding: 0 }}
              >
                {speaking ? (
                  <VolumeX size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
                ) : (
                  <Volume2 size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
                )}
                {speaking ? t.companion.stopSpeaking : t.companion.listenResponse}
              </button>
            )}
          </div>
        )}
        <button onClick={goBackFromCustom} style={btnBack}>
          {t.companion.chooseOther}
        </button>
      </div>
    );
  }

  // --- Vista de una situación normal: respuesta (IA o respaldo fijo) + enlace ---
  if (activeId) {
    const situation = getSituation(activeId);
    if (!situation) {
      // Defensivo: si por algo el id no existe, no se queda atorado.
      setActiveId(null);
      return null;
    }
    const situationContent = t.companionSituationContent[activeId];
    const isLoading = loadingId === activeId;
    const text = textBySituation[activeId];
    return (
      <div>
        {isLoading && !text ? (
          <p style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 14px" }}>
            {t.companion.thinking}
          </p>
        ) : (
          <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.6, margin: "0 0 14px" }}>{text}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => onNavigate?.(situation.linkRef)} style={btnLink}>
            {situationContent.linkLabel} <ArrowRight size={14} />
          </button>
          <button
            onClick={() => !isLoading && otraIdea(activeId)}
            disabled={isLoading}
            style={{ ...btnBack, padding: 0, ...(isLoading ? btnDisabled : {}) }}
          >
            <RotateCcw size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
            {t.companion.anotherIdea}
          </button>
          {speechSynthesisSupported && !isLoading && text && (
            <button
              type="button"
              onClick={() => (speaking ? stopSpeaking() : speak(text))}
              style={{ ...btnBack, padding: 0 }}
            >
              {speaking ? (
                <VolumeX size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
              ) : (
                <Volume2 size={12} style={{ verticalAlign: "-1px", marginRight: "4px" }} />
              )}
              {speaking ? t.companion.stopSpeaking : t.companion.listenResponse}
            </button>
          )}
        </div>
        {/* Fase 3: aviso breve de que la respuesta de arriba es un texto fijo
            de respaldo, no personalizado por IA (eso es Plus) — nunca en la
            vista de crisis ni en el menú, solo aquí. */}
        {!isPlus && (
          <button
            type="button"
            onClick={onRequestUpgrade}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "10px",
              background: "transparent",
              border: "none",
              color: C.amberText || C.amber,
              fontSize: "12px",
              cursor: onRequestUpgrade ? "pointer" : "default",
              padding: 0,
            }}
          >
            <Lock size={12} /> {t.upsell.companionAiReply}
          </button>
        )}
        <button onClick={goBack} style={btnBack}>
          {t.companion.chooseOther}
        </button>
      </div>
    );
  }

  // --- Menú principal: los 5 botones fijos, el cuadro de texto libre, y el
  // botón de crisis (separado, al final, con su propio estilo). ---
  return (
    <div>
      {SITUATIONS.map((s) => (
        <button key={s.id} onClick={() => openSituation(s.id)} style={btnOption}>
          {t.companionSituationContent[s.id].label}
        </button>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 10px" }}>
        <div style={{ flex: 1, height: "1px", background: C.border }} />
        <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600 }}>{t.companion.freeTextIntro}</span>
        <div style={{ flex: 1, height: "1px", background: C.border }} />
      </div>

      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder={t.companion.freeTextPlaceholder}
        maxLength={500}
        rows={3}
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          padding: "10px 12px",
          color: C.text,
          fontSize: "13px",
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: "8px",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={submitFreeText}
          disabled={customLoading || !freeText.trim()}
          style={{ ...btnLink, ...(customLoading || !freeText.trim() ? btnDisabled : {}) }}
        >
          {customLoading ? t.companion.thinking : t.companion.freeTextSubmit}
        </button>
        {SpeechRecognition && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            disabled={customLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: listening ? C.rose : C.surfaceAlt,
              color: listening ? C.roseText || "#fff" : C.text,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "13px",
              cursor: customLoading ? "default" : "pointer",
              ...(customLoading ? btnDisabled : {}),
            }}
          >
            {listening ? <Square size={14} /> : <Mic size={14} />}
            {listening ? t.companion.freeTextStop : t.companion.freeTextRecordVoice}
          </button>
        )}
        {!isPlus && (
          <button
            type="button"
            onClick={onRequestUpgrade}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "transparent",
              border: "none",
              color: C.amberText || C.amber,
              fontSize: "12px",
              cursor: onRequestUpgrade ? "pointer" : "default",
              padding: 0,
            }}
          >
            <Lock size={12} /> {t.upsell.companionAiReply}
          </button>
        )}
      </div>
      <p style={{ fontSize: "11px", color: C.textMuted, lineHeight: 1.4, margin: "8px 0 0" }}>
        {t.companion.freeTextHint}
      </p>

      <button onClick={() => setActiveId("crisis")} style={btnCrisis}>
        <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
        {t.crisis.label}
      </button>
    </div>
  );
}
