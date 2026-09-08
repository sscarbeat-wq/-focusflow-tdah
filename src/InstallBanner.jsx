import React, { useEffect, useState } from "react";
import { Download, Share, X, ExternalLink } from "lucide-react";

const C = {
  surface: "#1D2740",
  surfaceAlt: "#24304D",
  border: "#34405F",
  text: "#E8EAF0",
  textMuted: "#8E96AC",
  mint: "#8FCBB0",
  mintText: "#12261E",
  amber: "#D9A15C",
};

function detectEnv() {
  const ua = navigator.userAgent || "";
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|BytedanceWebview/i.test(ua);
  const isChromeIOS = isIOS && /CriOS/.test(ua);
  const isDesktop = !isIOS && !isAndroid;
  return { isStandalone, isIOS, isAndroid, isInAppBrowser, isChromeIOS, isDesktop };
}

export default function InstallBanner() {
  const [env] = useState(detectEnv);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("ff_install_dismissed") === "1");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem("ff_install_dismissed", "1");
    setDismissed(true);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (env.isStandalone || dismissed || installed) return null;

  const wrapperStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "14px 16px",
    marginBottom: "20px",
    position: "relative",
    fontSize: "13px",
    color: C.text,
    lineHeight: 1.6,
  };

  const closeBtnStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "transparent",
    border: "none",
    color: C.textMuted,
    cursor: "pointer",
  };

  const titleStyle = { display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, marginBottom: "6px" };

  // In-app browser (TikTok, Instagram, Facebook, etc.)
  if (env.isInAppBrowser) {
    return (
      <div style={{ ...wrapperStyle, borderColor: C.amber }}>
        <button onClick={dismiss} style={closeBtnStyle} aria-label="Cerrar">
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <ExternalLink size={16} color={C.amber} /> Abre esto en tu navegador
        </div>
        Para instalar la app, toca los tres puntos <strong>(⋯)</strong> o el menú de esta pantalla y elige{" "}
        <strong>"Abrir en el navegador"</strong> (Chrome o Safari). Desde aquí dentro no se puede instalar.
      </div>
    );
  }

  // Android
  if (env.isAndroid) {
    return (
      <div style={wrapperStyle}>
        <button onClick={dismiss} style={closeBtnStyle} aria-label="Cerrar">
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <Download size={16} color={C.mint} /> Instala FocusFlow en tu celular
        </div>
        {deferredPrompt ? (
          <>
            <p style={{ margin: "0 0 10px" }}>Tenla como una app, con su ícono y sin barra del navegador.</p>
            <button
              onClick={handleAndroidInstall}
              style={{
                background: C.mint,
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                color: C.mintText,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Instalar app
            </button>
          </>
        ) : (
          <>
            Toca los tres puntos <strong>⋮</strong> arriba del navegador → <strong>"Instalar aplicación"</strong> o{" "}
            <strong>"Añadir a pantalla de inicio"</strong>.
          </>
        )}
      </div>
    );
  }

  // iOS
  if (env.isIOS) {
    if (env.isChromeIOS) {
      return (
        <div style={wrapperStyle}>
          <button onClick={dismiss} style={closeBtnStyle} aria-label="Cerrar">
            <X size={16} />
          </button>
          <div style={titleStyle}>
            <Download size={16} color={C.mint} /> Instala FocusFlow en tu iPhone
          </div>
          Para instalarla necesitas abrir este link en <strong>Safari</strong> (no en Chrome) — en iPhone, solo
          Safari puede agregarla a tu pantalla de inicio.
        </div>
      );
    }
    return (
      <div style={wrapperStyle}>
        <button onClick={dismiss} style={closeBtnStyle} aria-label="Cerrar">
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <Download size={16} color={C.mint} /> Instala FocusFlow en tu iPhone
        </div>
        Toca <Share size={14} style={{ verticalAlign: "-2px" }} /> <strong>Compartir</strong> (abajo, al centro) →{" "}
        <strong>"Agregar a pantalla de inicio"</strong>.
      </div>
    );
  }

  // Desktop
  return (
    <div style={wrapperStyle}>
      <button onClick={dismiss} style={closeBtnStyle} aria-label="Cerrar">
        <X size={16} />
      </button>
      <div style={titleStyle}>
        <Download size={16} color={C.mint} /> ¿La vas a usar desde el celular?
      </div>
      Abre este mismo link desde tu celular para instalarla como app, con ícono propio.
    </div>
  );
}
