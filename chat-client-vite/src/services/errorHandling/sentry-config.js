/**
 * Sentry Configuration (Stub)
 *
 * This file is a stub for Sentry configuration.
 * Sentry has been removed from the project, but some build processes
 * may still reference this file.
 *
 * If you need to re-add Sentry:
 * 1. Install @sentry/react
 * 2. Configure it here
 * 3. Import and initialize in main.jsx
 */

// Export empty config object to satisfy imports
export default {};

// Export initialization function (no-op)
export function initSentry() {
  // No-op: Sentry is not configured
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry] Sentry is not configured (stub file)');
  }
}
