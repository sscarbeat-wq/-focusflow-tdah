import React, { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { tint } from "./theme";
import { computeSpotlightLayout } from "./onboardingTourGeometry";

const DISMISS_KEY = "anro-onboarding-seen";

function readSeen() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

// Fase 1 (29 de octubre de 2026): la doctora reportó que su esposo —usuario
// real con TDAH— entró a la app y no supo "qué hacer" ni por dónde
// empezar. Se agregó una bienvenida de 3 pantallas centradas, SOLO la
// primera vez (preferencia de dispositivo en localStorage, igual que
// PostDiagnosisCard.jsx/InstallBanner.jsx — nunca un dato clínico en
// Supabase), que se puede saltar en cualquier momento y nunca vuelve a
// aparecer después de cerrarse.
//
// Fase 2 (8 de noviembre de 2026): a petición explícita de la doctora
// ("que se le dé un recorrido por la app y cómo podría usarla"), el mismo
// recorrido se extiende con 4 pasos de "spotlight" que señalan un elemento
// REAL dentro de la app (en vez de solo describirlo con texto): la
// mascota/racha, el contador de "foco acumulado" (que resuelve además una
// confusión real que la doctora reportó — ver abajo), el botón flotante de
// Memoria ANRO, y el panel de Modo Enfoque. Se decidió NO incluir un paso
// sobre medicamentos/recordatorios (la doctora no lo seleccionó al
// elegir el contenido de este recorrido).
//
// Qué pasos son "modal" (centrado, sin señalar nada) y cuáles son
// "spotlight" (señalan un elemento real por su `id` de DOM) vive aquí en
// código, NO en los textos de i18n — los 4 idiomas solo aportan el
// título/cuerpo de cada paso (t.onboarding.steps, mismo arreglo de
// siempre, ahora con 7 elementos en vez de 3), en el mismo orden que este
// arreglo. Se usa el `id` de DOM (en vez de pasar refs por props a través
// de varios componentes) para no tener que tocar la firma de props de
// Mascot.jsx/MemoriaAnroLauncher.jsx — ver dónde se agregó cada id:
// FocusFlowTDAH.jsx (mascota, contador de XP, panel de Modo Enfoque) y
// MemoriaAnroLauncher.jsx (botón flotante).
const STEP_META = [
  { kind: "modal" },
  { kind: "modal" },
  { kind: "modal" },
  { kind: "spotlight", targetId: "anro-tour-mascot" },
  { kind: "spotlight", targetId: "anro-tour-xp" },
  { kind: "spotlight", targetId: "anro-tour-memoria-anro" },
  // "focusMode" es la misma llave que ya usa scrollToCompanionSection en
  // FocusFlowTDAH.jsx — con esto el recorrido reutiliza la navegación que
  // YA existe (cambiar a la pestaña "Herramientas" y abrir ese panel) en
  // vez de inventar una ruta paralela.
  { kind: "spotlight", targetId: "anro-tour-focus-mode", navigate: "focusMode" },
];

// Accesibilidad: cada paso es un diálogo modal (role="dialog"
// aria-modal="true"), se cierra con Escape o tocando fuera, el foco entra
// al diálogo al abrirse y queda atrapado adentro mientras está abierto
// (Tab/Shift+Tab solo se mueve entre los controles del diálogo), y al
// cerrarse el foco regresa a donde estaba antes de que se abriera — mismo
// patrón en los pasos "modal" y en los "spotlight" (el globo de texto ES
// el diálogo en ambos casos, solo cambia dónde y cómo se dibuja alrededor).
export default function OnboardingTour({ C, t, accent, onNavigate }) {
  const [open, setOpen] = useState(() => !readSeen());
  const [step, setStep] = useState(0);
  const [layout, setLayout] = useState(null);
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const steps = t.onboarding.steps;
  const isLast = step === steps.length - 1;
  const meta = STEP_META[step] || { kind: "modal" };
  const isSpotlight = meta.kind === "spotlight";

  // El alto real de la tarjeta varía según cuánto ocupe el texto de cada
  // paso (2 líneas en unos idiomas, 3 en otros, con o sin botón "Atrás",
  // etc.), así que no se puede adivinar con una sola constante — se
  // arranca con un estimado razonable (180px) para no tener que esperar a
  // medir antes de mostrar algo, y abajo (el efecto que mide
  // dialogRef.current) se corrige al alto real en cuanto la tarjeta ya
  // está en el DOM, recalculando la posición si hiciera falta. El valor
  // persiste entre pasos (useRef, no useState) porque sirve de buen punto
  // de partida para el siguiente paso de spotlight.
  const cardHeightRef = useRef(180);

  const measure = useCallback(() => {
    if (meta.kind !== "spotlight") {
      setLayout(null);
      return;
    }
    const el = typeof document !== "undefined" ? document.getElementById(meta.targetId) : null;
    if (!el) {
      // El elemento no existe (id cambiado, o aún no montado) — se
      // degrada a un overlay oscuro simple en vez de romper el recorrido.
      setLayout(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setLayout(
      computeSpotlightLayout(rect, window.innerWidth, window.innerHeight, {
        tooltipHeight: cardHeightRef.current,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.kind, meta.targetId]);

  // Una vez que la tarjeta ya se dibujó con la posición estimada, se mide
  // su alto REAL y, si se aleja del estimado usado, se vuelve a calcular
  // la posición con ese alto real — esto es lo que evita que la tarjeta
  // quede recortada contra el borde de la pantalla cuando el texto
  // traducido ocupa más (o menos) de los 180px que se asumieron al
  // principio.
  useEffect(() => {
    if (!open || !isSpotlight || !layout) return;
    const raf = requestAnimationFrame(() => {
      const h = dialogRef.current?.getBoundingClientRect().height;
      if (h && Math.abs(h - cardHeightRef.current) > 4) {
        cardHeightRef.current = h;
        measure();
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, isSpotlight, open]);

  // Al entrar a un paso de spotlight: si hace falta navegar primero (ej.
  // "Modo Enfoque" vive dentro de la pestaña Herramientas), se le pide a
  // FocusFlowTDAH que cambie de pestaña/herramienta con scroll INSTANTÁNEO
  // (no "smooth" — si el elemento sigue moviéndose por la animación de
  // scroll cuando medimos su posición, el agujero del spotlight quedaría
  // mal calculado). Después se espera varios requestAnimationFrame para
  // dar tiempo a que React re-renderice (display:none -> block) y el
  // scroll instantáneo se aplique antes de medir — mismo motivo del doble
  // requestAnimationFrame que ya usa scrollToCompanionSection en
  // FocusFlowTDAH.jsx, solo que aquí se espera un poco más porque hay dos
  // pasos encadenados (navegar y LUEGO medir) en vez de uno.
  useEffect(() => {
    if (!open) return;
    if (meta.kind !== "spotlight") {
      setLayout(null);
      return;
    }
    let cancelled = false;
    if (meta.navigate && onNavigate) {
      onNavigate(meta.navigate, { instant: true });
    }
    let raf = null;
    const tick = (framesLeft) => {
      if (cancelled) return;
      if (framesLeft > 0) {
        raf = requestAnimationFrame(() => tick(framesLeft - 1));
        return;
      }
      measure();
    };
    raf = requestAnimationFrame(() => tick(3));
    // Mientras este paso está activo, re-medir si cambia el tamaño de la
    // ventana o si algo hace scroll (ej. el teclado del celular, o la
    // paciente girando el teléfono).
    const onRemeasure = () => measure();
    window.addEventListener("resize", onRemeasure);
    window.addEventListener("scroll", onRemeasure, true);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onRemeasure);
      window.removeEventListener("scroll", onRemeasure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const toFocus = dialogRef.current?.querySelector("[data-autofocus]") || dialogRef.current;
    toFocus?.focus();
    return () => {
      previouslyFocused.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      /* localStorage no disponible (modo privado, etc.) — la bienvenida
         simplemente se volvería a mostrar en la próxima visita, no es un
         dato crítico. */
    }
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  // Contenido del globo/tarjeta — idéntico en ambos tipos de paso, solo
  // cambia el contenedor que lo envuelve (centrado vs. posicionado junto
  // al elemento señalado).
  const card = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="anro-onboarding-title"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        background: C.surface,
        borderRadius: "22px",
        padding: "26px 24px 20px",
        width: isSpotlight ? `${layout?.tooltip.width ?? 320}px` : "min(420px, 100%)",
        maxWidth: "calc(100vw - 24px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
        <button
          onClick={close}
          aria-label={t.onboarding.skip}
          style={{
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            cursor: "pointer",
            borderRadius: "8px",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {!isSpotlight && (
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          style={{ width: "48px", height: "48px", display: "block", margin: "0 auto 14px" }}
        />
      )}

      <h2
        id="anro-onboarding-title"
        data-autofocus
        tabIndex={-1}
        style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 10px", color: C.text, textAlign: "center", outline: "none" }}
      >
        {steps[step].title}
      </h2>
      <p style={{ fontSize: "13.5px", color: C.textMuted, lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
        {steps[step].body}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "20px" }}>
        {steps.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: i === step ? accent : tint(C.textMuted, 0.3),
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{
              flex: 1,
              minHeight: "44px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              color: C.text,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.onboarding.back}
          </button>
        )}
        <button
          onClick={() => (isLast ? close() : setStep((s) => s + 1))}
          style={{
            flex: 2,
            minHeight: "44px",
            background: accent,
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {isLast ? t.onboarding.start : t.onboarding.next}
        </button>
      </div>

      {!isLast && (
        <button
          onClick={close}
          style={{
            display: "block",
            margin: "14px auto 0",
            background: "transparent",
            border: "none",
            color: C.textMuted,
            fontSize: "12px",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {t.onboarding.skip}
        </button>
      )}
    </div>
  );

  if (!isSpotlight) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px",
          zIndex: 100,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {card}
      </div>
    );
  }

  // Paso de spotlight: un "agujero" iluminado sobre el elemento real (truco
  // clásico del box-shadow gigante, igual que react-joyride/driver.js) más
  // un bloqueador de clics a pantalla completa (para que no se pueda usar
  // la app real mientras el recorrido está abierto) y el globo de texto
  // posicionado junto al elemento. Si por algún motivo no se pudo medir el
  // elemento (`layout` es null — ver measure() arriba), se degrada a un
  // overlay oscuro simple con el globo centrado, para que el recorrido
  // nunca se vea roto.
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {layout ? (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: `${layout.spotlight.top}px`,
            left: `${layout.spotlight.left}px`,
            width: `${layout.spotlight.width}px`,
            height: `${layout.spotlight.height}px`,
            borderRadius: "14px",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      )}

      <div
        style={{
          position: "fixed",
          top: layout ? `${layout.tooltip.top}px` : "50%",
          left: layout ? `${layout.tooltip.left}px` : "50%",
          transform: layout ? undefined : "translate(-50%, -50%)",
        }}
      >
        {card}
      </div>
    </div>
  );
}
