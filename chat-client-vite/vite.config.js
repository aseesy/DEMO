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
    // Optional: raise the warning limit if you just want to silence it
    // chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.split('node_modules/')[1].split('/');
            const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            if (VENDOR_LIBS.includes(pkg)) {
              return 'vendor';
            }
          }
        },
      },
    },
  },
});
