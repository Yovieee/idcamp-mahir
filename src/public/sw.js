self.addEventListener("install", () => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("Push message received:", event);
  let data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.options.body,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  const { url } = event.notification.data;

  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
