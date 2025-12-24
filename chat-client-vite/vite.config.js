// vite.config.js – split vendor libraries into a separate chunk for better caching
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  plugins: [react()],
  server: {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
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
        assetFileNames: (assetInfo) => {
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
