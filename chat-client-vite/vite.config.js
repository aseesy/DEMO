// vite.config.js – split vendor libraries into a separate chunk for better caching
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// List of large third‑party packages you want to separate
const VENDOR_LIBS = [
  'react',
  'react-dom',
  'react-router-dom',
  'socket.io-client',
  // add more libs here if needed
];

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
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
              cacheName: 'google-fonts-static-cache',
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
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.railway\.app\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // Cache for a day
              },
            },
          },
        ],
        // Clean up old caches on activation
        cleanupOutdatedCaches: true,
        // Skip waiting and claim clients immediately
        skipWaiting: true,
        clientsClaim: true,
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
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB (images are large)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/')[1].split('/');
            const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            if (VENDOR_LIBS.includes(pkg)) {
              return 'vendor';
            }
            // Split other large dependencies
            if (pkg.includes('socket.io') || pkg.includes('socketio')) {
              return 'vendor-socket';
            }
          }
          // Split blog routes (they have large images)
          if (id.includes('features/blog')) {
            return 'blog';
          }
        },
        // Optimize asset handling
        assetFileNames: assetInfo => {
          // Keep images in assets folder but optimize naming
          if (assetInfo.name && /\.(png|jpe?g|svg|gif|webp)$/.test(assetInfo.name)) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
