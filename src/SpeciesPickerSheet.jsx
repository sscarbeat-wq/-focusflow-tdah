import React, { useEffect, useState } from "react";
import { X, Lock, Check, Eye, ArrowLeft } from "lucide-react";
import { tint } from "./theme";
import { MascotArt } from "./MascotSprite";
import { PlusUpsellBadge } from "./PlusUpsellCard";
import { SPECIES_OPTIONS, isUnlockableSpecies, isPlusSpecies, matureEmoji, emojiFor, STAGE_GROUP_KEYS } from "./mascotLogic";
import { XP_MILESTONES, isUnlocked } from "./xpMilestones";

// Selector de mascota (10 de noviembre de 2026) — reemplaza al globito
// chico de 6 emojis del encabezado, que no daba para 18 personajes. Es una
// hoja que sube desde abajo (mismo patrón que "Editar accesos de la
// brújula", CompassEditSheet.jsx) con una cuadrícula:
//   - Personaje libre o ya desbloqueado: tocarlo lo elige.
//   - Bloqueado: se ve en gris con candado y cuántos puntos faltan;
//     tocarlo abre su vista previa (nunca se puede elegir sin los puntos).
//   - El ojito de cada tarjeta abre la vista previa de cualquiera: las 4
//     etapas por las que pasa con la racha.
// Lo que se desbloquea depende SOLO de los puntos de foco acumulado (que
// nunca bajan), nunca de la racha — perder una racha jamás quita un
// personaje (decisión ya aprobada en la propuesta de mascotas).

// Una etapa interna representativa por grupo, para la vista previa de los
// personajes de emoji (0 → recién nacida, 1 → pequeña, 3 → juvenil, 5 →
// adulta).
const REPRESENTATIVE_STAGE = { reciennacida: 0, pequena: 1, juvenil: 3, adulta: 5 };

function lockInfo(key, xp, isPlus) {
  // Mascotas de ANRO Plus: sin Plus, candado "Plus" (sin importar los XP).
  // (Hoy no hay mascotas exclusivas de Plus: PLUS_SPECIES está vacía.)
  if (isPlusSpecies(key)) return isPlus ? { unlocked: true, plus: true } : { unlocked: false, plus: true };
  if (!isUnlockableSpecies(key)) return { unlocked: true };
  const milestone = XP_MILESTONES.find((m) => m.kind === "species" && m.key === key);
  const unlocked = isUnlocked(key, "species", xp);
  if (unlocked || !milestone) return { unlocked: true };
  return {
    unlocked: false,
    xpNeeded: milestone.xp,
    // Redondeado hacia arriba a puntos enteros: "te faltan 459" se lee
    // mejor que "te faltan 458.35".
    remaining: Math.max(1, Math.ceil(milestone.xp - xp)),
  };
}

export default function SpeciesPickerSheet({ C, t, accent, xp = 0, isPlus = false, onRequestUpgrade, selected, onSelect, onClose }) {
  const [previewKey, setPreviewKey] = useState(null);
  const sp = t.app.speciesPicker;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (previewKey) setPreviewKey(null);
      else onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, previewKey]);

  const choose = (key) => {
    onSelect(key);
    onClose();
  };

  const preview = previewKey ? lockInfo(previewKey, xp, isPlus) : null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={sp.label}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "560px",
          maxHeight: "88vh",
          background: C.surface,
          color: C.text,
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 28px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "16px 18px 10px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            {previewKey && (
              <button
                onClick={() => setPreviewKey(null)}
                aria-label={sp.back}
                style={{
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  color: C.textMuted,
                  cursor: "pointer",
                  borderRadius: "8px",
                  flexShrink: 0,
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                {previewKey ? sp.names[previewKey] : sp.label}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: C.textMuted, lineHeight: 1.4 }}>
                {previewKey ? sp.stagesNote : sp.interactionHint}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={sp.close}
            style={{
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: C.textMuted,
              cursor: "pointer",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {previewKey ? (
          <div style={{ overflowY: "auto", padding: "18px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              {STAGE_GROUP_KEYS.map((group) => (
                <div key={group} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: "16px",
                      background: C.surfaceAlt,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "6px",
                      filter: preview.unlocked ? undefined : "grayscale(0.6)",
                      opacity: preview.unlocked ? 1 : 0.75,
                    }}
                  >
                    <MascotArt visual={emojiFor(previewKey, REPRESENTATIVE_STAGE[group])} size={64} />
                  </div>
                  <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600 }}>{sp.stageGroups[group]}</span>
                </div>
              ))}
            </div>
            {preview.unlocked ? (
              <button
                onClick={() => choose(previewKey)}
                style={{
                  width: "100%",
                  background: accent,
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {sp.useButton}
              </button>
            ) : preview.plus ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p
                  style={{
                    margin: 0,
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                    background: tint(accent, 0.1),
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  <Lock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{sp.plusNote}</span>
                </p>
                {onRequestUpgrade && (
                  <button
                    onClick={() => {
                      onClose();
                      onRequestUpgrade();
                    }}
                    style={{
                      width: "100%",
                      background: accent,
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {sp.plusButton}
                  </button>
                )}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  background: tint(accent, 0.1),
                  borderRadius: "12px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <Lock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{sp.lockedNote(preview.xpNeeded, preview.remaining)}</span>
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              overflowY: "auto",
              padding: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              gap: "10px",
            }}
          >
            {SPECIES_OPTIONS.map((key) => {
              const info = lockInfo(key, xp, isPlus);
              const isSelected = key === selected;
              return (
                <div key={key} style={{ position: "relative" }}>
                  <button
                    onClick={() => (info.unlocked ? choose(key) : setPreviewKey(key))}
                    aria-pressed={isSelected}
                    aria-label={info.unlocked ? sp.names[key] : t.app.rewardsLockedShort(sp.names[key])}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 6px 10px",
                      borderRadius: "16px",
                      background: isSelected ? tint(accent, 0.16) : C.surfaceAlt,
                      border: isSelected ? `2px solid ${accent}` : "2px solid transparent",
                      cursor: "pointer",
                      color: C.text,
                    }}
                  >
                    <span
                      style={{
                        position: "relative",
                        width: "64px",
                        height: "64px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // Las de Plus se ven casi a color (para que se antojen);
                        // las que faltan por XP, en gris.
                        filter: info.unlocked ? "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" : info.plus ? "grayscale(0.35)" : "grayscale(1)",
                        opacity: info.unlocked ? 1 : info.plus ? 0.8 : 0.45,
                      }}
                    >
                      <MascotArt visual={matureEmoji(key)} size={64} />
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 600, textAlign: "center" }}>{sp.names[key]}</span>
                    {info.plus ? (
                      <PlusUpsellBadge C={C} t={t} />
                    ) : (
                      !info.unlocked && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "10px",
                            color: C.textMuted,
                            textAlign: "center",
                          }}
                        >
                          <Lock size={10} /> {t.app.rewardsRemaining(info.remaining)}
                        </span>
                      )
                    )}
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: accent,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setPreviewKey(key)}
                    aria-label={sp.previewAria(sp.names[key])}
                    title={sp.previewAria(sp.names[key])}
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.textMuted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Eye size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
