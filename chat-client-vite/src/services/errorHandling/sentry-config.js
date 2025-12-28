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
  if (!dsn || typeof window === 'undefined') {
    return;
  }

  // Dynamic import to avoid bundling Sentry in development
  if (import.meta.env.PROD) {
    import('@sentry/react')
      .then(Sentry => {
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
        console.error('[Sentry] Failed to initialize:', err);
      });
  }
}
