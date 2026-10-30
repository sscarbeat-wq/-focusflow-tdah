import React, { useState } from "react";
import { ArrowRight, AlertTriangle, RotateCcw, Lock } from "lucide-react";
import { SITUATIONS, getSituation, nextResponseIndex } from "./companionSituations";

// Compañero de apoyo situacional — SOLO botones de entrada rápida, nunca
// texto libre (decisión explícita de la usuaria, para acotar el riesgo
// clínico/legal: la paciente nunca puede escribirle a una IA algo que no
// esperamos; el "tema" que recibe la IA siempre es uno de los 5 ids fijos
// de SITUATIONS, nunca texto de la paciente). El botón de crisis vive
// separado del resto, con su propio estilo, nunca pasa por la IA, y su
// mensaje nunca se genera ni se continúa — es texto fijo con recursos reales.
//
// Las 5 situaciones normales piden una respuesta a api/companion-response.js
// (IA, gpt-4o-mini) cada vez que se abren o se pide "otra idea". Si la IA no
// responde (límite mensual, red, error del servidor) se usa en su lugar uno
// de los textos fijos de respaldo (fallbackResponses), rotando sin repetir —
// la paciente nunca se queda sin un mensaje de apoyo.
// Fase 3 del sistema de planes (30 de octubre de 2026) — "companionAiReplies"
// es Plus; el botón de crisis y el menú de las 5 situaciones NUNCA se
// restringen, en ningún plan (ver el comentario de PLUS_FEATURE_KEYS en
// plans.js). isPlus=true por default para no afectar a quien use este
// componente sin pasar la prop todavía.
export default function CompanionPanel({ C, t, lang, userId, onNavigate, isPlus = true, onRequestUpgrade }) {
  const [activeId, setActiveId] = useState(null); // id de SITUATIONS, "crisis", o null
  const [textBySituation, setTextBySituation] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [usingFallback, setUsingFallback] = useState({});
  const [fallbackIndexBySituation, setFallbackIndexBySituation] = useState({});

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
    if (!isPlus || usingFallback[situationId]) {
      // Ya estamos en modo respaldo para esta situación (la IA falló antes,
      // o el plan Gratis nunca la llama) — seguimos rotando el texto fijo
      // en vez de pedirle algo a la IA.
      showFallback(situationId);
      return;
    }
    requestAiResponse(situationId, textBySituation[situationId]);
  };

  const goBack = () => setActiveId(null);

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

  // --- Menú principal: solo botones, nunca texto libre ---
  return (
    <div>
      {SITUATIONS.map((s) => (
        <button key={s.id} onClick={() => openSituation(s.id)} style={btnOption}>
          {t.companionSituationContent[s.id].label}
        </button>
      ))}
      <button onClick={() => setActiveId("crisis")} style={btnCrisis}>
        <AlertTriangle size={13} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
        {t.crisis.label}
      </button>
    </div>
  );
}
