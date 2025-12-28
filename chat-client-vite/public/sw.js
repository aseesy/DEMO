/* eslint-disable no-undef */
// Custom service worker for LiaiZen - no third-party dependencies
// Push notifications handled via Web Push API (VAPID keys)

// Service Worker Version - increment this to force update
// v6: Added push event handler for iOS PWA notifications
const CACHE_VERSION = 'liaizen-v6';
const CACHE_NAME = `${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = ['/', '/index.html', '/icon-192.png', '/icon-512.png'];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker, version:', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err);
        // Don't fail installation if some assets fail to cache
      });
    })
  );

  // Activate new service worker immediately (skip waiting)
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker, version:', CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - network-first strategy for HTML, cache-first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first for HTML files (ensures immediate updates)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to index.html for navigation requests
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache-first for other assets (images, CSS, JS, etc.)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response.ok) {
          return response;
        }

        // Cache successful responses
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Message event - handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating immediately');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENT_CLAIM') {
    console.log('[SW] Claiming clients');
    self.clients.claim();
  }
});

// Push event - handle incoming push notifications
// This is CRITICAL for iOS PWA - without this, push notifications won't display
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  // Get notification data
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[SW] Push data:', data);
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      data = {
        title: 'LiaiZen',
        body: event.data.text() || 'You have a new message',
      };
    }
  }

  // Build notification options
  // iOS requires specific format - icon and badge must be absolute URLs
  const iconUrl = data.icon
    ? data.icon.startsWith('http')
      ? data.icon
      : new URL(data.icon, self.location.origin).href
    : new URL('/icon-192.png', self.location.origin).href;

  const badgeUrl = data.badge
    ? data.badge.startsWith('http')
      ? data.badge
      : new URL(data.badge, self.location.origin).href
    : new URL('/icon-192.png', self.location.origin).href;

  const options = {
    body: data.body || 'You have a new message',
    icon: iconUrl,
    badge: badgeUrl,
    tag: data.tag || 'liaizen-message',
    requireInteraction: true, // Keep visible until user dismisses
    vibrate: [200, 100, 200], // iOS ignores vibrate but it's safe to include
    data: data.data || { url: '/?view=chat' },
    // iOS-specific: ensure notification is persistent
    silent: false,
  };

  // Show the notification
  event.waitUntil(
    self.registration
      .showNotification(data.title || 'LiaiZen', options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
      })
      .catch(err => {
        console.error('[SW] Error showing notification:', err);
      })
  );
});

// Handle notification clicks - deep link to chat when user taps notification
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.data);

  // Close the notification
  event.notification.close();

  // Get the URL from notification data, default to chat view
  const urlToOpen = event.notification.data?.url || '/?view=chat';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(clientList => {
        // Check if app is already open in a window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // App is open - focus it and navigate
            console.log('[SW] App already open, focusing and navigating to:', fullUrl);
            return client.focus().then(() => {
              // Send message to client to navigate
              return client.postMessage({
                type: 'NAVIGATE',
                url: fullUrl,
              });
            });
          }
        }

        // App is not open - open it with the deep link
        console.log('[SW] App not open, opening:', fullUrl);
        return clients.openWindow(fullUrl);
      })
  );
});
