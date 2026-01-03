/* eslint-disable no-undef */
// Custom push notification handlers
// This will be imported by the generated service worker

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
