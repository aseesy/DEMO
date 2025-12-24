import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { injectGoogleTag } from './utils/injectGoogleTag.js';
import { initAnalytics } from './utils/analytics.js';
import { setupGlobalErrorHandler } from './utils/errorHandler.jsx';
import { trackPagePerformance } from './utils/analyticsEnhancements.js';
import { runMigrations } from './utils/storageMigration.js';
import { registerAllModalHooks } from './hooks/ui/modalHooks.registration.js';
import { getRegisteredModals } from './hooks/ui/modalRegistry.js';

// ============================================================================
// COMPOSITION ROOT - Application Bootstrap
// ============================================================================
// This is where all application-level initialization happens.
// Side-effects are explicitly called here, not hidden in module imports.
// This makes the application's dependencies explicit and testable.
// ============================================================================

// Bootstrap: Register all modal hooks
// This happens at application startup, not as a side-effect of importing useModalController
// This allows tests to control when registration happens
registerAllModalHooks();

// Initialize error monitoring FIRST - before any other code runs
// This ensures Safari service worker errors are caught early
import './utils/errorMonitor.js';

// Inject Google Tag immediately (before React loads)
// This runs synchronously to ensure tag is present before any other scripts
try {
  injectGoogleTag();
} catch (error) {
  console.error('Failed to inject Google Tag:', error);
}

// Initialize analytics on app load (only if GOOGLE_TAG is not set, use VITE_GA_MEASUREMENT_ID)
initAnalytics();

// Set up global error handler
setupGlobalErrorHandler();

// Run localStorage migrations on app startup
runMigrations();

// Track page load performance after a short delay to ensure all resources are loaded
setTimeout(() => {
  trackPagePerformance();
}, 1000);

// Detect Safari early to handle service worker differently
const isSafari =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /^((?!chrome|android).)*safari/i.test(navigator.vendor) ||
  (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));

// Register service worker for PWA functionality (production only)
// Safari has buggy service worker support, so we skip it there
if ('serviceWorker' in navigator && !isSafari && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('[PWA] Service Worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
} else if (isSafari) {
  console.log('[main.jsx] Safari detected - PWA install available via Share menu');
} else if (import.meta.env.DEV) {
  console.log('[main.jsx] Development mode - Service Worker disabled');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
