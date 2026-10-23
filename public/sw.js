/**
 * MESCO Trust CMS - Browser Push Notification Service Worker
 * Root scope: /
 */

/* eslint-disable no-restricted-globals */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "MESCO Trust",
      message: event.data.text(),
    };
  }

  const title = payload.title || "MESCO Trust";
  const options = {
    body: payload.message || "",
    icon: payload.icon || "/images/logo-192.png",
    badge: payload.badge || "/images/logo-192.png",
    image: payload.image || payload.imageUrl || undefined,
    data: {
      url: payload.clickUrl || "/",
      notificationId: payload.notificationId || null,
    },
    vibrate: [100, 50, 100],
    tag: payload.notificationId ? `mesco-${payload.notificationId}` : "mesco-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      let destinationUrl;
      try {
        destinationUrl = new URL(rawUrl, self.location.origin).href;
      } catch {
        destinationUrl = self.location.origin + "/";
      }

      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // 1. If an existing tab is open on the exact destination URL, focus it
      for (const client of windowClients) {
        try {
          const clientUrl = new URL(client.url, self.location.origin).href;
          if (clientUrl === destinationUrl && "focus" in client) {
            return await client.focus();
          }
        } catch {}
      }

      // 2. Otherwise, open the destination URL in a new window/tab
      if (self.clients.openWindow) {
        return await self.clients.openWindow(destinationUrl);
      }
    })()
  );
});
