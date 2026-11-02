import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Cambiado de "autoUpdate" a "prompt" el 2 de noviembre de 2026 —
      // bug real encontrado probando la función #6 de Fase 4: con
      // "autoUpdate" + skipWaiting/clientsClaim en true (como estaba antes),
      // cada vez que se publicaba una versión nueva el service worker se
      // actualizaba solo y RECARGABA LA PÁGINA SIN AVISAR en cuanto el
      // navegador volvía a revisar la pestaña (típicamente al volver de
      // otra pestaña) — eso borraba lo que no estuviera guardado todavía,
      // como una sesión de Modo Enfoque corriendo (ver UpdatePrompt.jsx,
      // que ahora avisa y deja que la persona decida cuándo actualizar).
      registerType: "prompt",
      workbox: {
        // En false a propósito (antes true): así el service worker nuevo
        // se queda "esperando" hasta que UpdatePrompt.jsx mande la señal de
        // aplicar la actualización, en vez de tomar control solo.
        skipWaiting: false,
        clientsClaim: false,
        // Agrega los listeners de push/notificationclick al service worker
        // que genera el plugin, sin tocar su manejo de caché/precarga (eso
        // es lo que causaba que la app se congelara — ver notas en el PR).
        importScripts: ["push-sw.js"],
        // Sin esto, el service worker intercepta TODA navegación de página
        // completa (incluyendo window.location.href hacia /api/...) y
        // regresa el index.html cacheado en vez de dejarla llegar al
        // servidor — eso es lo que rompía "Conectar con Google Calendar"
        // (nunca llegaba a /api/auth/google/start). Excluimos /api/ para
        // que esas navegaciones siempre pasen directo a la red.
        navigateFallbackDenylist: [/^\/api\//],
      },
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable-512.png"],
      manifest: {
        name: "ANRO TDAH",
        short_name: "ANRO TDAH",
        description: "Sistema de habituación y regulación para TDAH",
        theme_color: "#141B2E",
        background_color: "#141B2E",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Respiración guiada",
            short_name: "Respirar",
            description: "Abrir directo la burbuja de respiración",
            url: "/?atajo=respirar",
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Freno de impulsividad",
            short_name: "Freno",
            description: "Abrir directo el freno de impulsividad",
            url: "/?atajo=freno",
            icons: [{ src: "icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
    }),
  ],
});
