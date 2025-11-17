// Service Worker for LiaiZen PWA
// Update version to bust cache when needed
const CACHE_NAME = 'liaizen-v3';
const CACHE_VERSION = '3';
const urlsToCache = [
  '/',
  '/index.html',
  '/join.html',
  '/privacy.html',
  '/terms.html',
  '/assets/CEECE0%20(8).svg',
  '/config.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// External resources that we'll cache individually (with error handling)
const externalResources = [
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.socket.io/4.6.1/socket.io.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache');
        
        // Cache local resources first (these should always work)
        try {
          await cache.addAll(urlsToCache);
          console.log('✅ Local resources cached');
        } catch (err) {
          console.warn('⚠️ Some local resources failed to cache:', err);
        }
        
        // Cache external resources individually (with error handling)
        // Note: Tailwind CDN is excluded as it doesn't support CORS caching
        for (const url of externalResources) {
          try {
            await cache.add(url);
            console.log(`✅ Cached: ${url}`);
          } catch (err) {
            console.warn(`⚠️ Failed to cache ${url}:`, err.message);
            // Continue with other resources even if one fails
          }
        }
      })
      .catch((err) => {
        console.error('Cache install failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip caching for:
  // - Socket.io connections (WebSocket, not cacheable)
  // - API calls (should always be fresh)
  // - Backend server (Railway/localhost)
  // - Tailwind CDN (doesn't support CORS caching, loads fresh each time)
  if (event.request.url.includes('socket.io') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('localhost:3001') ||
      event.request.url.includes('railway.app') ||
      event.request.url.includes('cdn.tailwindcss.com')) {
    // For these, just fetch from network (no caching)
    return;
  }

  // For HTML files, always check network first (stale-while-revalidate strategy)
  // This allows you to see changes immediately without clearing cache
  if (event.request.destination === 'document' || 
      event.request.url.endsWith('.html') ||
      url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network request succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                console.warn('Failed to update cache:', err);
              });
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // For other resources, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          // Also fetch in background to update cache (stale-while-revalidate)
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache).catch((err) => {
                  console.warn('Failed to update cache:', err);
                });
              });
            }
          }).catch(() => {
            // Network fetch failed, that's okay - we have cache
          });
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses or opaque responses (CORS issues)
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }

          // Only cache same-origin requests or CORS-enabled responses
          if (response.type === 'basic' || response.type === 'cors') {
            // Clone the response before caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
                cache.put(event.request, responseToCache).catch((err) => {
                  console.warn('Failed to cache response:', err);
                });
            });
          }

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        // Always return a Response so the promise resolves correctly
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      })
  );
});

