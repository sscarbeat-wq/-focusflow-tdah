// Se agrega al service worker que genera vite-plugin-pwa vía
// workbox.importScripts (ver vite.config.js) — solo añade los listeners de
// notificaciones push, sin tocar el manejo de caché/precarga del plugin.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: "ANRO TDAH", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "ANRO TDAH";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "senda-recordatorio",
    // 26 de noviembre de 2026 ("que funcione con el celular bloqueado, sin
    // necesidad de estar en la app" + el recordatorio de medicamento que
    // ahora insiste cada 15 min, ver api/send-reminders.js): sin esto, un
    // push con el mismo `tag` que uno ya mostrado en pantalla lo REEMPLAZA
    // en silencio — sin volver a sonar ni vibrar (así lo define la propia
    // Notifications API). Eso rompía justo el objetivo de insistir cada 15
    // minutos: el celular sonaba la primera vez y luego solo se actualizaba
    // el texto en la pantalla de bloqueo sin avisar de nuevo. Con
    // renotify:true, cada reemplazo vuelve a sonar/vibrar igual que la
    // primera vez.
    renotify: true,
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
