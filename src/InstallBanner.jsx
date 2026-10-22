import React, { useEffect, useState } from "react";
import { Download, Share, X, ExternalLink } from "lucide-react";
import { DARK_THEME } from "./theme";
import DEFAULT_T from "./i18n/es.js";

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

export default function InstallBanner({ C = DARK_THEME, t = DEFAULT_T }) {
  const tb = t.installBanner;
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
        <button onClick={dismiss} style={closeBtnStyle} aria-label={tb.closeAria}>
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <ExternalLink size={16} color={C.amber} /> {tb.inAppTitle}
        </div>
        {tb.inAppBody1}
        <strong>{tb.inAppBodyEllipsis}</strong>
        {tb.inAppBody2}
        <strong>{tb.inAppOpenInBrowser}</strong>
        {tb.inAppBody3}
      </div>
    );
  }

  // Android
  if (env.isAndroid) {
    return (
      <div style={wrapperStyle}>
        <button onClick={dismiss} style={closeBtnStyle} aria-label={tb.closeAria}>
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <Download size={16} color={C.mint} /> {tb.androidTitle}
        </div>
        {deferredPrompt ? (
          <>
            <p style={{ margin: "0 0 10px" }}>{tb.androidPromptBody}</p>
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
              {tb.androidInstallButton}
            </button>
          </>
        ) : (
          <>
            {tb.androidManualBody1}
            <strong>{tb.androidManualDots}</strong>
            {tb.androidManualBody2}
            <strong>{tb.androidManualInstall}</strong>
            {tb.androidManualBody3}
            <strong>{tb.androidManualAddHome}</strong>
            {tb.androidManualBody4}
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
          <button onClick={dismiss} style={closeBtnStyle} aria-label={tb.closeAria}>
            <X size={16} />
          </button>
          <div style={titleStyle}>
            <Download size={16} color={C.mint} /> {tb.iosChromeTitle}
          </div>
          {tb.iosChromeBody}
        </div>
      );
    }
    return (
      <div style={wrapperStyle}>
        <button onClick={dismiss} style={closeBtnStyle} aria-label={tb.closeAria}>
          <X size={16} />
        </button>
        <div style={titleStyle}>
          <Download size={16} color={C.mint} /> {tb.iosSafariTitle}
        </div>
        {tb.iosSafariBody1}
        <Share size={14} style={{ verticalAlign: "-2px" }} /> <strong>{tb.iosSafariShare}</strong>
        {tb.iosSafariBody2}
        <strong>{tb.iosSafariAddHome}</strong>
        {tb.iosSafariBody3}
      </div>
    );
  }

  // Desktop
  return (
    <div style={wrapperStyle}>
      <button onClick={dismiss} style={closeBtnStyle} aria-label={tb.closeAria}>
        <X size={16} />
      </button>
      <div style={titleStyle}>
        <Download size={16} color={C.mint} /> {tb.desktopTitle}
      </div>
      {tb.desktopBody}
    </div>
  );
}
