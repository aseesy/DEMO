import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      // Plugin to inject Google Tag into HTML files
      {
        name: 'inject-google-tag',
        transformIndexHtml(html) {
          // Try multiple ways to get the Google Tag
          const googleTag = env.VITE_GOOGLE_TAG || env.GOOGLE_TAG || process.env.VITE_GOOGLE_TAG || process.env.GOOGLE_TAG;
          
          if (!googleTag || !googleTag.trim()) {
            console.log('[Vite Plugin] No GOOGLE_TAG found in environment variables');
            return html;
          }

          // Check if Google Tag already exists
          if (html.includes('googletagmanager.com') || 
              html.includes('google-analytics.com') || 
              html.includes('data-gtag') ||
              html.includes('gtag') ||
              html.includes('GTM-')) {
            console.log('[Vite Plugin] Google Tag already present in HTML, skipping injection');
            return html;
          }

          // Inject Google Tag immediately after <head> opening tag
          const headIndex = html.indexOf('<head>');
          if (headIndex !== -1) {
            const insertPosition = headIndex + 6; // After '<head>'
            const injectedHtml = html.slice(0, insertPosition) + '\n    ' + googleTag.trim() + '\n    ' + html.slice(insertPosition);
            console.log('[Vite Plugin] Google Tag injected into HTML');
            return injectedHtml;
          }

          console.warn('[Vite Plugin] Could not find <head> tag in HTML');
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
  }
})
