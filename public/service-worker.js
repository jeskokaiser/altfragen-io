 
const CACHE_NAME = 'altfragen-io-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/pwa-icon.png',
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
  // Only cache GET requests and same-origin requests
  const request = event.request;
  const isGetRequest = request.method === 'GET';
  const isSameOrigin = request.url.startsWith(self.location.origin);
  
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful GET responses from same-origin
        if (isGetRequest && isSameOrigin && response.status === 200) {
          // Clone the response
          const responseClone = response.clone();
          
          // Cache the fetched response (don't await, just fire and forget)
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          }).catch(() => {
            // Silently fail if caching fails
          });
        }
        
        return response;
      })
      .catch(() => {
        // If fetch fails and it's a GET request, try to get from cache
        if (isGetRequest) {
          return caches.match(request);
        }
        // For non-GET requests, just fail
        throw new Error('Network request failed');
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

