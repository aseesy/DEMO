import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to inject Google Tag into HTML files
    {
      name: 'inject-google-tag',
      transformIndexHtml(html) {
        const googleTag = process.env.VITE_GOOGLE_TAG || process.env.GOOGLE_TAG;
        
        if (!googleTag) {
          return html;
        }

        // Check if Google Tag already exists
        if (html.includes('googletagmanager.com') || html.includes('google-analytics.com') || html.includes('data-gtag')) {
          console.log('Google Tag already present in HTML, skipping injection');
          return html;
        }

        // Inject Google Tag immediately after <head> opening tag
        const headIndex = html.indexOf('<head>');
        if (headIndex !== -1) {
          const insertPosition = headIndex + 6; // After '<head>'
          return html.slice(0, insertPosition) + '\n    ' + googleTag.trim() + '\n    ' + html.slice(insertPosition);
        }

        return html;
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true, // Show error overlay on screen
    },
    watch: {
      usePolling: true, // Better file watching on some systems
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
