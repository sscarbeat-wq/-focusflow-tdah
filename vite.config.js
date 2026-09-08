import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable-512.png"],
      manifest: {
        name: "FocusFlow TDAH",
        short_name: "FocusFlow",
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
