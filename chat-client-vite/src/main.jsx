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

// Detect Safari early to prevent service worker issues
const isSafari =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /^((?!chrome|android).)*safari/i.test(navigator.vendor) ||
  (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));

// Unregister any existing service workers (from legacy app)
// This fixes Safari issues with service workers intercepting navigation
// In Safari, completely skip service worker operations to prevent errors
if ('serviceWorker' in navigator && !isSafari) {
  navigator.serviceWorker
    .getRegistrations()
    .then(registrations => {
      for (const registration of registrations) {
        registration
          .unregister()
          .then(success => {
            if (success) {
              console.log('Service worker unregistered');
            }
          })
          .catch(err => {
            console.error('Error unregistering service worker:', err);
          });
      }
    })
    .catch(err => {
      console.error('Error getting service worker registrations:', err);
    });

  // Also try to unregister by scope (with null check for Safari)
  navigator.serviceWorker.ready
    .then(registration => {
      if (registration) {
        return registration.unregister();
      }
    })
    .catch(() => {
      // Ignore if no service worker is registered or ready
    });
} else if (isSafari) {
  console.log('[main.jsx] Safari detected - skipping service worker operations to prevent errors');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
