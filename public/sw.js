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
    icon: payload.icon || "/images/logo.svg",
    badge: payload.badge || "/images/logo.svg",
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
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If an existing tab is open on the destination URL, focus it
        for (const client of windowClients) {
          try {
            const clientUrl = new URL(client.url);
            const destinationUrl = new URL(targetUrl, self.location.origin);
            if (clientUrl.pathname === destinationUrl.pathname && "focus" in client) {
              return client.focus();
            }
          } catch {
            if (client.url === targetUrl && "focus" in client) {
              return client.focus();
            }
          }
        }

        // If an existing window is on our origin, navigate and focus
        for (const client of windowClients) {
          if ("focus" in client && "navigate" in client) {
            return client.navigate(targetUrl).then((c) => c?.focus());
          }
        }

        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      })
  );
});
