/* eslint-disable no-undef */
// Custom Service Worker logic
// This will be imported by the generated service worker from vite-plugin-pwa
// Workbox modules are available as globals when imported via vite-plugin-pwa's generateSW

// Service worker version (should match CACHE_VERSION in vite.config.js)
const SW_VERSION = 'liaizen-v1.0.0';

// Listen for messages from client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message, activating new service worker');
    self.skipWaiting();
  }

  // Respond to version requests
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({
      type: 'VERSION_INFO',
      version: SW_VERSION,
    });
  }

  // Handle background sync requests from client
  if (event.data && event.data.type === 'QUEUE_MESSAGE') {
    console.log('[SW] Received message to queue for background sync:', event.data.messageId);
    // The background sync plugin (configured in vite.config.js) will handle this automatically
  }
});

// Track service worker lifecycle events
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker version:', SW_VERSION);
  // Don't wait - activate immediately if no clients
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker version:', SW_VERSION);
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());

  // Note: Offline fallback navigation is configured in vite.config.js via navigateFallback
  // The generated service worker will handle this automatically
  console.log('[SW] Service worker activated');
  console.log('[SW] - Offline fallback: /offline.html (configured in vite.config.js)');
  console.log('[SW] - Background Sync: message-queue (configured in vite.config.js)');
});

// Background Sync for offline messages
// Workbox Background Sync is configured in vite.config.js runtimeCaching
// This listener handles the sync event when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'sync-messages' || event.tag.startsWith('workbox-background-sync')) {
    console.log('[SW] Background sync triggered:', event.tag);
    // Workbox Background Sync will automatically retry queued requests
    // We can also notify the client to flush its local queue
    event.waitUntil(notifyClientToSync());
  }
});

// Notify client app to flush its message queue when sync occurs
async function notifyClientToSync() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_MESSAGES',
        timestamp: Date.now(),
      });
    });
    console.log('[SW] Notified clients to sync messages');
  } catch (error) {
    console.error('[SW] Error notifying clients to sync:', error);
  }
}

// Push event - handle incoming push notifications
// This is CRITICAL for iOS PWA - without this, push notifications won't display
self.addEventListener('push', event => {
  // Get notification data
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
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
  event.waitUntil(self.registration.showNotification(data.title || 'LiaiZen', options));
});

// Handle notification clicks - deep link to chat when user taps notification
self.addEventListener('notificationclick', event => {
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

            return client.focus().then(() => {
              return client.postMessage({
                type: 'NAVIGATE',
                url: fullUrl,
              });
            });
          }
        }

        // App is not open - open it with the deep link

        return clients.openWindow(fullUrl);
      })
      .catch(error => {
        console.error('[SW] Error handling notification click:', error);
      })
  );
});
