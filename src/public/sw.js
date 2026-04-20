self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Error parsing push data:', error);
    data = {
      title: 'New Story!',
      message: 'Someone just shared a new story.',
      icon: '/favicon.png',
      id: null,
    };
  }

  const { title, message, icon, id } = data;

  const options = {
    body: message,
    icon: icon || '/favicon.png',
    badge: '/favicon.png',
    data: {
      url: id ? `/#/detail/${id}` : '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  const { url } = event.notification.data;

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url.includes(url) && 'focus' in client) {
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
