// LiaiZen Service Worker for PWA and Push Notifications
// Version 1.0.0

const CACHE_NAME = 'liaizen-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache important assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('localhost:3001') ||
      event.request.url.includes('railway.app')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((err) => {
                console.error('[Service Worker] Error caching response:', err);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Try to return cached index.html as fallback
            return caches.match('/index.html').then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cache, return a basic error response
              return new Response('Offline - content not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Cache match failed:', error);
        // Try to fetch from network as last resort
        return fetch(event.request).catch(() => {
          // If all else fails, return error response
          return new Response('Offline - content not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Push notification event - show notification when message received
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  let notificationData = {
    title: 'LiaiZen',
    body: 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'liaizen-message',
    requireInteraction: false,
    data: {
      url: '/?view=chat'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || `New message from ${data.sender || 'Co-parent'}`,
        body: data.message || data.body || 'You have a new message',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag || 'liaizen-message',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: {
          url: data.url || '/?view=chat',
          sender: data.sender,
          timestamp: data.timestamp || new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - open app when notification clicked
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/?view=chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // App is open - focus it
            return client.focus().then(() => {
              // Try to navigate if supported, otherwise just focus
              if (client.navigate && typeof client.navigate === 'function') {
                return client.navigate(urlToOpen).catch(() => {
                  // If navigate fails, just focus (already done)
                  return Promise.resolve();
                });
              }
              return Promise.resolve();
            });
          }
        }

        // App is not open - open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen).catch((error) => {
            console.error('[Service Worker] Error opening window:', error);
            return Promise.resolve();
          });
        }
        
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('[Service Worker] Error handling notification click:', error);
        return Promise.resolve();
      })
  );
});

// Background sync event - for sending messages when back online
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(
      // You can implement message sync logic here
      Promise.resolve()
    );
  }
});

// Message event - receive messages from main app
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Send response back to client
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage({
      type: 'SW_RESPONSE',
      message: 'Service Worker received your message'
    });
  }
});

console.log('[Service Worker] Loaded and ready');
