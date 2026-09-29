// Service worker propio de Noha (reemplaza al que vite-plugin-pwa generaba
// automáticamente) para poder recibir notificaciones push reales, incluso
// con la app cerrada o en segundo plano.
import { precacheAndRoute } from "workbox-precaching";

// Solo necesitamos el service worker para las notificaciones push (no para
// que la app funcione sin internet), así que sacamos el HTML del precache.
// Dejar que workbox interceptara la navegación principal (index.html) fue lo
// que causó que la carga de la página se quedara colgada en el Preview
// ("Waiting for server response" sin terminar nunca) — mejor que esa
// petición la maneje el navegador directo, sin pasar por el service worker.
const manifest = (self.__WB_MANIFEST || []).filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url;
  return !url.endsWith(".html");
});

precacheAndRoute(manifest);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "Noha", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Noha";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "noha-recordatorio",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.skipWaiting();
self.addEventListener("activate", () => self.clients.claim());
