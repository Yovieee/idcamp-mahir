import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

// Precache the dynamically hashed Vite assets (HTML, JS, CSS, Images)
precacheAndRoute(self.__WB_MANIFEST);

// Strategy for API Data
registerRoute(
  ({ url }) => url.hostname === "story-api.dicoding.dev",
  new StaleWhileRevalidate({
    cacheName: "storyapp-dynamic-api-v1",
  }),
);

// Push and Notification Handlers (Preserved)
self.addEventListener("push", (event) => {
  console.log("Push message received:", event);

  let notificationData = {
    title: "New Notification",
    options: {
      body: "You have a new message.",
    },
  };

  if (event.data) {
    try {
      const dataJson = event.data.json();
      notificationData = dataJson;
    } catch (e) {
      notificationData.options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options,
    ),
  );
  event.waitUntil(new Notification("My Great Song"));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-stories") {
    event.waitUntil(syncPendingStories());
  }
});

async function syncPendingStories() {
  const db = await openIndexedDB();
  const stories = await getAllPendingStories(db);

  for (const story of stories) {
    try {
      const formData = new FormData();
      formData.append("description", story.description);
      formData.append("photo", story.photo);
      if (story.lat) formData.append("lat", story.lat);
      if (story.lon) formData.append("lon", story.lon);

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/stories",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${story.token}`,
          },
          body: formData,
        },
      );

      const result = await response.json();
      if (!result.error) {
        await deletePendingStory(db, story.id);

        // Notify user
        self.registration.showNotification("Story Synced!", {
          body: "Your offline story has been posted successfully.",
          icon: "images/icon-192.png",
        });
      }
    } catch (error) {
      console.error("Failed to sync story:", error);
    }
  }
}

// Minimal IndexedDB Helpers for SW (avoiding library issues)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("story-app-db", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingStories(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pending-stories", "readonly");
    const store = transaction.objectStore("pending-stories");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingStory(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("pending-stories", "readwrite");
    const store = transaction.objectStore("pending-stories");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
