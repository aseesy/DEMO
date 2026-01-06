// vite.config.js – split vendor libraries into a separate chunk for better caching
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Cache version - increment this to force cache invalidation on all clients
// Format: liaizen-v{major}.{minor}.{patch}
// Example: liaizen-v1.0.0 -> liaizen-v1.0.1 (patch update)
// Example: liaizen-v1.0.0 -> liaizen-v1.1.0 (minor update)
// Example: liaizen-v1.0.0 -> liaizen-v2.0.0 (major update)
const CACHE_VERSION = 'liaizen-v1.0.0';

// List of large third‑party packages you want to separate
const VENDOR_LIBS = [
  'react',
  'react-dom',
  'react-router-dom',
  'socket.io-client',
  // add more libs here if needed
];

export default defineConfig({
  // Exclude socket.io-client from optimization to prevent bundler issues
  optimizeDeps: {
    exclude: ['socket.io-client', 'socket.io-parser', 'engine.io-client', 'engine.io-parser'],
  },
  plugins: [
    react(),
    VitePWA({
      // User-prompted updates: Users control when to update (prevents unexpected reloads)
      registerType: 'promptUpdate',
      includeAssets: [
        'favicon-32.png',
        'favicon-16.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
      ],
      manifest: {
        name: 'LiaiZen',
        short_name: 'LiaiZen',
        description: 'Collaborative Co-parenting',
        theme_color: '#00908B',
        background_color: '#00908B',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude large files from precaching (they'll be cached at runtime)
        globIgnores: ['**/game_theory_matrix-*.png', '**/why_arguments_repeat_vector-*.png'],
        // Increase max file size for precaching (default is 2MB)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        // Import custom push notification handlers
        importScripts: ['/sw-custom.js'],
        // NetworkFirst strategy for HTML navigation - ensures fresh content on slow connections
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/admin/],
        // Additional Workbox modules to include (for Background Sync)
        additionalManifestEntries: [],
        runtimeCaching: [
          {
            // NetworkFirst for HTML pages - try network first, fallback to cache after 3s
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: `html-cache-${CACHE_VERSION}`,
              networkTimeoutSeconds: 3, // Fallback to cache if network takes > 3s
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `google-fonts-cache-${CACHE_VERSION}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: `google-fonts-static-cache-${CACHE_VERSION}`,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: `images-cache-${CACHE_VERSION}`,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // API cache - EXCLUDE critical endpoints that must never be cached
            urlPattern: ({ url }) => {
              // Only cache non-critical API endpoints
              const criticalPatterns = [
                /\/api\/auth\//, // Auth endpoints - never cache
                /\/api\/push\//, // Push subscriptions - never cache
                /\/api\/room\/messages/, // Real-time messages - never cache
              ];

              // If matches critical pattern, don't cache
              if (criticalPatterns.some(pattern => pattern.test(url.pathname))) {
                return false;
              }

              // Only cache Railway API endpoints
              return /^https:\/\/.*\.railway\.app\/.*/i.test(url.href);
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: `api-cache-${CACHE_VERSION}`,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // Cache for a day
              },
            },
          },
          // Note: Background Sync for offline messages
          // Currently using manual queue system (MessageQueueService + localStorage)
          // To implement Workbox Background Sync, switch to injectManifest strategy:
          // 1. Change strategies: 'generateSW' to strategies: 'injectManifest'
          // 2. Import BackgroundSyncPlugin in sw-custom.js
          // 3. Configure in runtimeCaching plugins array
          // Current manual queue system works well and handles offline messages reliably
        ],
        // Clean up old caches on activation
        cleanupOutdatedCaches: true,
        // User-controlled updates: Don't skip waiting, let user decide when to update
        skipWaiting: false,
        clientsClaim: false,
      },
      // Use generateSW strategy - vite-plugin-pwa will generate the service worker
      // and we'll add our custom push handlers via workbox's additionalManifestEntries
      strategies: 'generateSW',
      // Disable automatic registration - we'll handle it manually for iOS Safari
      injectRegister: false,
    }),
  ],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  },
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, './src/features'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@config': path.resolve(__dirname, './src/config'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@adapters': path.resolve(__dirname, './src/adapters'),
      // Socket.io-client alias: Point to dist build to avoid bundler issues
      // This is a Vite-specific workaround for socket.io-client bundling problems
      // Alternative: Use CDN (currently used - see index.html line 134)
      // If switching from CDN to npm package, uncomment this alias:
      // 'socket.io-client': path.resolve(__dirname, './node_modules/socket.io-client/dist/socket.io.min.js'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB (images are large)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Extract package name (handle scoped packages like @vitejs/plugin-react)
            const parts = id.split('node_modules/')[1].split('/');
            const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            if (VENDOR_LIBS.includes(pkg)) {
              return 'vendor';
            }
          }
          // Blog routes are lazily loaded and have large images
          if (id.includes('features/blog')) {
            return 'blog';
          }
        },
      },
    },
  },
  // Inject app version into build for runtime access
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(CACHE_VERSION),
  },
});
