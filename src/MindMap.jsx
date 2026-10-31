import React from "react";
import { Plus, X, CheckCircle2, ArrowRight } from "lucide-react";

// Mapa mental — función #4 de Fase 4 (inspirada en MindNode, de la lista
// "10 aplicaciones para el TDAH"). GRATIS para todas las cuentas, decisión
// confirmada con la doctora el 31 de octubre de 2026: es solo capturar
// texto suelto y mandarlo al desglosador, igual que el tablero Kanban no
// agrega ni calcula nada nuevo, así que no hay nada que valga cobrar.
//
// Pensado como el paso ANTERIOR al desglosador: aquí no hay compromiso de
// orden ni de terminar nada — solo soltar ideas relacionadas con la tarea
// grande, y cuando una ya convence, mandarla al desglosador con un clic
// ("Convertir en paso"). No tiene estado propio más allá de lo visual:
// `ideas`, `bigTask` y la conversión misma viven en FocusFlowTDAH.jsx
// (mismo patrón que KanbanBoard.jsx), así que cambiar de herramienta y
// volver nunca pierde nada que no se hubiera perdido ya en el desglosador.
//
// Las burbujas no se pueden arrastrar (sin librería nueva de drag-and-
// drop, mismo principio de "sin dependencias nuevas" que el resto del
// proyecto) — se acomodan solas en una nube con un empaque simple
// (flex-wrap) y una leve rotación alternada para que se sientan orgánicas,
// no una lista disfrazada.
//
// Segunda pasada (31 de octubre de 2026, a petición de la doctora: "ya
// puse mis ideas, pero las manda al desglosador, sería bueno un botón para
// redirigir"): el mapa mental y el desglosador son dos herramientas
// distintas en la cuadrícula, así que convertir una idea no se sentía
// conectado — la paciente tenía que salir y buscar el desglosador ella
// misma. Se agregó `onGoToDismantler` (reutiliza scrollToCompanionSection,
// la misma navegación que ya usan "Hoy" y el Compañero de apoyo para
// saltar a una herramienta — nada nuevo que construir) en dos lugares: un
// botón fijo arriba para ir cuando quieras, y otro junto al aviso de "ya
// se convirtió" para ir justo en el momento en que más tiene sentido.
const ROTATIONS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 0.8];
const ACCENT_KEYS = ["coral", "mint", "amber", "lavender"];

export default function MindMap({
  C,
  t,
  bigTask,
  onBigTaskChange,
  ideas,
  ideaDraft,
  onIdeaDraftChange,
  onAddIdea,
  onRemoveIdea,
  onConvertIdea,
  convertedMsg,
  onGoToDismantler,
}) {
  const m = t.app.mindMap;
  const atMax = ideas.length >= 12;

  const goToLinkStyle = {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: C.lavenderText,
    fontSize: "12px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: 0,
  };

  return (
    <div>
      <input
        type="text"
        value={bigTask}
        onChange={(e) => onBigTaskChange(e.target.value)}
        placeholder={t.app.dismantler.taskPlaceholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: C.lavender,
          color: C.lavenderText,
          border: "none",
          borderRadius: "999px",
          padding: "14px 20px",
          fontSize: "14px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "10px",
        }}
      />

      {onGoToDismantler && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <button type="button" onClick={onGoToDismantler} style={goToLinkStyle}>
            {m.goToDismantlerButton} <ArrowRight size={13} />
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          background: C.surfaceAlt,
          borderRadius: "18px",
          padding: "16px",
          minHeight: "70px",
          marginBottom: "14px",
        }}
      >
        {ideas.length === 0 && (
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>{m.emptyHint}</p>
        )}
        {ideas.map((idea, i) => {
          const accentColor = C[ACCENT_KEYS[i % ACCENT_KEYS.length]];
          const rotation = ROTATIONS[i % ROTATIONS.length];
          return (
            <div
              key={idea.id}
              style={{
                background: C.surface,
                borderRadius: "14px",
                padding: "9px 12px",
                fontSize: "13px",
                borderTop: `3px solid ${accentColor}`,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 6px 14px rgba(0,0,0,0.06)",
                transform: `rotate(${rotation}deg)`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                maxWidth: "220px",
              }}
            >
              <span style={{ color: C.text }}>{idea.text}</span>
              <button
                type="button"
                onClick={() => onConvertIdea(idea)}
                title={m.convertButtonTitle}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: accentColor,
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveIdea(idea.id)}
                aria-label={m.removeIdeaAria}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.textMuted,
                  display: "flex",
                  alignItems: "center",
                  padding: "2px",
                  flexShrink: 0,
                }}
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {convertedMsg && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            background: C.surfaceAlt,
            borderRadius: "10px",
            padding: "8px 12px",
            margin: "0 0 10px",
          }}
        >
          <p style={{ fontSize: "12px", color: C.lavenderText, fontWeight: 600, margin: 0, flex: 1 }}>{convertedMsg}</p>
          {onGoToDismantler && (
            <button type="button" onClick={onGoToDismantler} style={goToLinkStyle}>
              {m.goToDismantlerButton} <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="text"
          value={ideaDraft}
          onChange={(e) => onIdeaDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddIdea();
            }
          }}
          placeholder={m.ideaPlaceholder}
          disabled={atMax}
          style={{
            flex: "1 1 160px",
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "13.5px",
            color: C.text,
          }}
        />
        <button
          type="button"
          onClick={onAddIdea}
          disabled={atMax || !ideaDraft.trim()}
          style={{
            background: C.mint,
            color: C.mintText,
            border: "none",
            borderRadius: "12px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: atMax ? "default" : "pointer",
            opacity: atMax ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus size={14} /> {m.addIdeaButton}
        </button>
      </div>
      {atMax && <p style={{ fontSize: "11px", color: C.textMuted, margin: "8px 0 0" }}>{m.maxIdeasNotice}</p>}
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "12px 0 0", lineHeight: 1.5 }}>{m.hint}</p>
    </div>
  );
}
