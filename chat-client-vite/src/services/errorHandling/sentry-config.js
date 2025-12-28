/**
 * Sentry Configuration
 *
 * Initialize Sentry for error tracking and monitoring.
 *
 * Setup:
 * 1. Install: npm install @sentry/react
 * 2. Get DSN from https://sentry.io
 * 3. Set VITE_SENTRY_DSN in .env
 * 4. Import and call initSentry() in main.jsx
 */

/**
 * Initialize Sentry
 *
 * @param {string} dsn - Sentry DSN (from environment variable)
 */
export function initSentry(dsn) {
  // Early return if not in browser or no DSN
  if (typeof window === 'undefined' || !dsn || typeof dsn !== 'string' || dsn.trim() === '') {
    return;
  }

  // Only initialize in production
  if (!import.meta.env.PROD) {
    return;
  }

  // Use setTimeout to ensure this runs after the module is fully loaded
  // This prevents issues with dynamic imports during build
  setTimeout(() => {
    try {
      // Dynamic import to avoid bundling Sentry in development
      import('@sentry/react')
        .then(Sentry => {
          if (!Sentry || !Sentry.init) {
            console.warn('[Sentry] @sentry/react module not available');
            return;
          }

          Sentry.init({
            dsn,
            environment: import.meta.env.MODE || 'production',
            integrations: [
              Sentry.browserTracingIntegration(),
              Sentry.replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
              }),
            ],
            // Performance Monitoring
            tracesSampleRate: 0.1, // 10% of transactions
            // Session Replay
            replaysSessionSampleRate: 0.1, // 10% of sessions
            replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
            // Error filtering
            beforeSend(event, hint) {
              // Filter out known non-critical errors
              if (event.exception) {
                const error = hint.originalException;
                if (error && error.message && error.message.includes('ResizeObserver')) {
                  return null; // Ignore ResizeObserver errors
                }
              }
              return event;
            },
          });

          // Make Sentry available globally for ErrorLoggingService
          window.Sentry = Sentry;
          console.log('[Sentry] Initialized successfully');
        })
        .catch(err => {
          // Silently fail - Sentry is optional
          console.warn('[Sentry] Failed to initialize (optional dependency):', err.message);
        });
    } catch (error) {
      // Silently fail - Sentry is optional
      console.warn('[Sentry] Failed to load (optional dependency):', error.message);
    }
  }, 0);
}
