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

// Sentry removed - ErrorLoggingService handles error tracking via console logging
// If you need production error tracking, consider:
// 1. Server-side error logging endpoint
// 2. Custom error tracking service
// 3. Re-add Sentry as a regular dependency (not optional)

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

// Detect Safari and iOS
const isSafari =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  /^((?!chrome|android).)*safari/i.test(navigator.vendor) ||
  (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));

const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Check if app is installed as PWA (standalone mode)
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone ||
  document.referrer.includes('android-app://');

// Register service worker for PWA functionality (production only)
// iOS Safari DOES support service workers for PWAs installed to home screen (iOS 11.3+)
// Only skip service worker for regular Safari (not installed as PWA)
const shouldRegisterServiceWorker =
  'serviceWorker' in navigator && import.meta.env.PROD && (!isSafari || (isIOS && isStandalone));

if (shouldRegisterServiceWorker) {
  window.addEventListener('load', () => {
    if (!navigator.serviceWorker.controller) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  });
}

// Ensure root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Try to create it if missing
  const body = document.body;
  if (body) {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    body.appendChild(newRoot);
    createRoot(newRoot).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    throw new Error('Root element #root not found in DOM and cannot create it');
  }
} else {
  // Clear any existing content
  rootElement.innerHTML = '';

  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    // Show error message in the DOM
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: system-ui; color: #dc2626;">
        <h1>Error Loading App</h1>
        <p>${error.message}</p>
        <p>Check the console for details.</p>
      </div>
    `;
    throw error;
  }
}
