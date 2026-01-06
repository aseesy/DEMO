/**
 * PWA Observability
 *
 * Single Responsibility: Track and log PWA/service worker lifecycle events.
 *
 * Tracks:
 * - Service worker installation/update success/failure
 * - App version adoption
 * - Offline vs server errors
 * - Users stuck on old versions
 */

import { trackEvent } from './analytics.js';
import { trackError } from './analyticsEnhancements.js';

// Get current app version from vite.config.js CACHE_VERSION
// This should match the version in vite.config.js
// In production, this should be set via environment variable or build-time injection
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 
                    (typeof window !== 'undefined' && window.APP_VERSION) || 
                    'liaizen-v1.0.0'; // Fallback to match vite.config.js default

/**
 * Get current app version
 * @returns {string} App version
 */
export function getAppVersion() {
  return APP_VERSION;
}

/**
 * Track service worker lifecycle event
 * @param {string} event - Event name (install, update, activate, etc.)
 * @param {Object} data - Event data
 */
export function trackServiceWorkerEvent(event, data = {}) {
  const eventData = {
    event_category: 'service_worker',
    event_label: event,
    app_version: APP_VERSION,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log to console
  console.log(`[PWA Observability] SW Event: ${event}`, eventData);

  // Track with analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'service_worker_event', {
      event_category: 'service_worker',
      event_label: event,
      app_version: APP_VERSION,
      ...data,
    });
  }

  return eventData;
}

/**
 * Track service worker installation
 * @param {ServiceWorkerRegistration} registration - SW registration
 * @param {boolean} success - Whether installation succeeded
 * @param {Error} error - Error if failed
 */
export function trackServiceWorkerInstall(registration, success, error = null) {
  const data = {
    success,
    scope: registration?.scope || 'unknown',
    installing: !!registration?.installing,
    waiting: !!registration?.waiting,
    active: !!registration?.active,
  };

  if (error) {
    data.error_message = error.message;
    data.error_name = error.name;
    data.error_stack = error.stack?.substring(0, 500);
  }

  trackServiceWorkerEvent('install', data);

  if (!success && error) {
    trackError(error, 'service_worker_install_failed', true);
  }
}

/**
 * Track service worker update
 * @param {ServiceWorkerRegistration} registration - SW registration
 * @param {boolean} success - Whether update succeeded
 * @param {Error} error - Error if failed
 * @param {string} oldVersion - Previous version
 * @param {string} newVersion - New version
 */
export function trackServiceWorkerUpdate(
  registration,
  success,
  error = null,
  oldVersion = 'unknown',
  newVersion = APP_VERSION
) {
  const data = {
    success,
    old_version: oldVersion,
    new_version: newVersion,
    scope: registration?.scope || 'unknown',
    waiting: !!registration?.waiting,
    updatefound: !!registration?.installing,
  };

  if (error) {
    data.error_message = error.message;
    data.error_name = error.name;
    data.error_stack = error.stack?.substring(0, 500);
  }

  trackServiceWorkerEvent('update', data);

  if (!success && error) {
    trackError(error, 'service_worker_update_failed', true);
  }
}

/**
 * Track service worker activation
 * @param {ServiceWorkerRegistration} registration - SW registration
 * @param {boolean} success - Whether activation succeeded
 * @param {Error} error - Error if failed
 */
export function trackServiceWorkerActivate(registration, success, error = null) {
  const data = {
    success,
    scope: registration?.scope || 'unknown',
    active: !!registration?.active,
    controller: !!navigator.serviceWorker?.controller,
  };

  if (error) {
    data.error_message = error.message;
    data.error_name = error.name;
  }

  trackServiceWorkerEvent('activate', data);

  if (!success && error) {
    trackError(error, 'service_worker_activate_failed', true);
  }
}

/**
 * Track app version (on page load)
 * This helps identify users stuck on old versions
 */
export function trackAppVersion() {
  const data = {
    app_version: APP_VERSION,
    user_agent: navigator.userAgent,
    is_pwa: window.matchMedia('(display-mode: standalone)').matches,
    service_worker_available: 'serviceWorker' in navigator,
    service_worker_controller: !!navigator.serviceWorker?.controller,
  };

  // Get service worker version if available
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
  }

  // Track with analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_version', {
      event_category: 'pwa',
      app_version: APP_VERSION,
      is_pwa: data.is_pwa,
      has_service_worker: data.service_worker_available,
      has_controller: data.service_worker_controller,
    });

    // Set user property for version tracking
    window.gtag('set', 'user_properties', {
      app_version: APP_VERSION,
    });
  }

  console.log('[PWA Observability] App version tracked:', data);
  return data;
}

/**
 * Track user stuck on old version
 * Called when update is available but user hasn't updated
 * @param {string} currentVersion - Current version user is on
 * @param {string} latestVersion - Latest available version
 * @param {number} daysSinceUpdate - Days since update became available
 */
export function trackStuckOnOldVersion(currentVersion, latestVersion, daysSinceUpdate = 0) {
  const data = {
    current_version: currentVersion,
    latest_version: latestVersion,
    days_since_update: daysSinceUpdate,
    is_stuck: daysSinceUpdate > 7, // Consider "stuck" if > 7 days
  };

  trackServiceWorkerEvent('stuck_on_old_version', data);

  // Track as error if stuck for > 7 days
  if (data.is_stuck) {
    trackError(
      new Error(`User stuck on old version: ${currentVersion} (latest: ${latestVersion})`),
      'user_stuck_on_old_version',
      false
    );
  }
}

/**
 * Classify error as offline or server error
 * @param {Error} error - Error to classify
 * @returns {Object} { type: 'offline' | 'server' | 'unknown', details: {...} }
 */
export function classifyErrorType(error) {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorName = error?.name || '';

  // Offline indicators
  const offlineIndicators = [
    'failed to fetch',
    'networkerror',
    'network error',
    'offline',
    'no internet',
    'err_internet_disconnected',
    'err_network_changed',
    'navigator.online is false',
  ];

  // Server error indicators
  const serverIndicators = [
    '500',
    '502',
    '503',
    '504',
    'internal server error',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
    'timeout',
  ];

  // Check for offline - but be more conservative
  // navigator.onLine is unreliable, so only use it as a hint
  // Don't classify as offline just because of TypeError - could be CORS, DNS, etc.
  const isDefinitelyOffline = 
    !navigator.onLine && 
    (offlineIndicators.some(indicator => errorMessage.includes(indicator)) || errorName === 'NetworkError');
  
  if (isDefinitelyOffline) {
    return {
      type: 'offline',
      details: {
        navigator_online: navigator.onLine,
        error_message: errorMessage,
        error_name: errorName,
      },
    };
  }
  
  // If navigator.onLine is false but error doesn't clearly indicate offline,
  // classify as network error (not offline) - could be server issue, CORS, DNS, etc.
  if (!navigator.onLine && (errorName === 'TypeError' || errorMessage.includes('fetch'))) {
    return {
      type: 'network', // Not offline, but network issue
      details: {
        navigator_online: navigator.onLine,
        error_message: errorMessage,
        error_name: errorName,
      },
    };
  }

  // Check for server error
  if (
    serverIndicators.some(indicator => errorMessage.includes(indicator)) ||
    (error?.status >= 500 && error?.status < 600)
  ) {
    return {
      type: 'server',
      details: {
        status: error?.status,
        error_message: errorMessage,
        error_name: errorName,
      },
    };
  }

  // Unknown
  return {
    type: 'unknown',
    details: {
      error_message: errorMessage,
      error_name: errorName,
      navigator_online: navigator.onLine,
    },
  };
}

/**
 * Track error with offline/server classification
 * @param {Error} error - Error to track
 * @param {string} context - Error context
 */
export function trackErrorWithClassification(error, context = 'unknown') {
  const classification = classifyErrorType(error);

  const data = {
    error_type: classification.type,
    context,
    app_version: APP_VERSION,
    ...classification.details,
  };

  // Track with analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'error_classified', {
      event_category: 'error',
      error_type: classification.type,
      context,
      app_version: APP_VERSION,
      ...classification.details,
    });
  }

  // Log to console
  console.log(`[PWA Observability] Error classified as ${classification.type}:`, data);

  // Track as error
  trackError(error, `error_${classification.type}`, false);

  return data;
}

/**
 * Initialize PWA observability
 * Sets up listeners for service worker events
 */
export function initPWAObservability() {
  if (typeof window === 'undefined') {
    return;
  }

  // Track app version on load
  trackAppVersion();

  // Initialize version tracking
  import('./versionTracker.js').then(({ initVersionTracking }) => {
    initVersionTracking(APP_VERSION);
  }).catch(() => {
    // Silently ignore if module not available
  });

  if (!('serviceWorker' in navigator)) {
    return;
  }

  // Listen for service worker controller changes
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    trackServiceWorkerEvent('controller_change', {
      new_controller: !!navigator.serviceWorker?.controller,
    });
  });

  // Listen for service worker messages (for version info)
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'VERSION_INFO') {
      trackServiceWorkerEvent('version_info', {
        sw_version: event.data.version,
        app_version: APP_VERSION,
        versions_match: event.data.version === APP_VERSION,
      });
    }
  });

  console.log('[PWA Observability] Initialized');
}

export default {
  getAppVersion,
  trackServiceWorkerEvent,
  trackServiceWorkerInstall,
  trackServiceWorkerUpdate,
  trackServiceWorkerActivate,
  trackAppVersion,
  trackStuckOnOldVersion,
  classifyErrorType,
  trackErrorWithClassification,
  initPWAObservability,
};

