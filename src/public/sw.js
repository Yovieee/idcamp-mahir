const CACHE_NAME = "storyapp-v1";
const DYNAMIC_CACHE_NAME = "storyapp-dynamic-v1";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.png",
  "/manifest.json",
  "/images/icon-192.png",
  "/images/icon-512.png",
  "/scripts/index.js",
  "/styles/styles.css",
];

// Combine all logic into the service worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching App Shell...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log("Service Worker: Clearing Old Cache...");
            return caches.delete(cache);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy for API Data (Dynamic)
  if (url.hostname === "story-api.dicoding.dev") {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE_NAME));
  } 
  // Strategy for static assets and images
  else {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchRes) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            // Only cache successful GET requests
            if (request.method === "GET" && fetchRes.status === 200) {
              cache.put(request.url, fetchRes.clone());
            }
            return fetchRes;
          });
        });
      })
    );
  }
});

// Stale-While-Revalidate Implementation
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // If network fails, return cached response if available
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Push and Notification Handlers (Preserved)
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
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncPendingStories());
  }
});

async function syncPendingStories() {
  const db = await openIndexedDB();
  const stories = await getAllPendingStories(db);

  for (const story of stories) {
    try {
      const formData = new FormData();
      formData.append('description', story.description);
      formData.append('photo', story.photo);
      if (story.lat) formData.append('lat', story.lat);
      if (story.lon) formData.append('lon', story.lon);

      const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${story.token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!result.error) {
        await deletePendingStory(db, story.id);
        
        // Notify user
        self.registration.showNotification('Story Synced!', {
          body: 'Your offline story has been posted successfully.',
          icon: '/images/icon-192.png',
        });
      }
    } catch (error) {
      console.error('Failed to sync story:', error);
    }
  }
}

// Minimal IndexedDB Helpers for SW (avoiding library issues)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('story-app-db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingStories(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-stories', 'readonly');
    const store = transaction.objectStore('pending-stories');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingStory(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending-stories', 'readwrite');
    const store = transaction.objectStore('pending-stories');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
