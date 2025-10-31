/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'altfragen-io-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo.png',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, falling back to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // If fetch fails, try to get from cache
        return caches.match(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Altfragen.io',
    body: 'Neue Benachrichtigung',
    url: '/',
    tag: 'altfragen-notification',
    icon: '/logo.png'
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        url: data.url || notificationData.url,
        tag: data.tag || notificationData.tag,
        icon: data.icon || notificationData.icon
      };
    } catch (e) {
      // Fallback to text if JSON parsing fails
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: notificationData.tag,
    requireInteraction: false,
    data: {
      url: notificationData.url,
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Öffnen',
      },
      {
        action: 'close',
        title: 'Schließen',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL from notification data or default to home
  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'close') {
    // Just close, do nothing
    return;
  }

  // Default action or 'open' action
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (optional, for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-questions') {
    event.waitUntil(
      // Implement your sync logic here
      Promise.resolve()
    );
  }
});

