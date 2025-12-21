/**
 * Console Error Monitor
 * Captures and logs all console errors, warnings, and unhandled rejections
 * Helps identify issues before they cause blank screens
 */

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Error log storage (for debugging)
window.__errorLog = [];

// Override console.error to capture errors
console.error = function (...args) {
  // Call original console.error
  originalError.apply(console, args);

  // Store error in log
  window.__errorLog.push({
    type: 'error',
    timestamp: new Date().toISOString(),
    message: args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' '),
  });

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(new Error(args.join(' ')));
  }
};

// Override console.warn to capture warnings
console.warn = function (...args) {
  // Call original console.warn
  originalWarn.apply(console, args);

  // Store warning in log
  window.__errorLog.push({
    type: 'warning',
    timestamp: new Date().toISOString(),
    message: args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(' '),
  });
};

// Capture unhandled promise rejections
// IMPORTANT: This must be set up BEFORE any service worker code runs
window.addEventListener('unhandledrejection', event => {
  const error = event.reason;
  const errorMessage = error?.message || String(error);
  const errorString = String(error);

  // Suppress Safari service worker errors - these are expected and handled
  // Check for various forms of the error message (check both message and string representation)
  const isSafariServiceWorkerError =
    errorMessage.includes('newestWorker is null') ||
    errorString.includes('newestWorker is null') ||
    (errorMessage.includes('InvalidStateError') &&
      (errorMessage.includes('worker') ||
        errorMessage.includes('newestWorker') ||
        errorMessage.includes('installing') ||
        errorMessage.includes('waiting') ||
        errorMessage.includes('null'))) ||
    (errorString.includes('InvalidStateError') &&
      (errorString.includes('worker') ||
        errorString.includes('newestWorker') ||
        errorString.includes('installing') ||
        errorString.includes('waiting') ||
        errorString.includes('null'))) ||
    (error?.name === 'InvalidStateError' &&
      (errorMessage.includes('null') ||
        errorString.includes('null') ||
        errorMessage.includes('worker') ||
        errorString.includes('worker')));

  if (isSafariServiceWorkerError) {
    // Prevent default error handling for Safari service worker errors
    event.preventDefault();
    // Silently suppress - don't even log in production
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        '[errorMonitor] Suppressed Safari service worker error (expected):',
        errorMessage
      );
    }
    return;
  }

  console.error('🚨 Unhandled Promise Rejection:', event.reason);

  window.__errorLog.push({
    type: 'unhandledRejection',
    timestamp: new Date().toISOString(),
    message: errorMessage,
  });

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(error);
  }
});

// Capture global errors
window.addEventListener('error', event => {
  console.error('🚨 Global Error:', event.error || event.message);

  window.__errorLog.push({
    type: 'globalError',
    timestamp: new Date().toISOString(),
    message: event.error?.message || event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(event.error || new Error(event.message));
  }
});

// Utility function to get error log
window.getErrorLog = function () {
  return window.__errorLog;
};

// Utility function to clear error log
window.clearErrorLog = function () {
  window.__errorLog = [];
  console.log('✅ Error log cleared');
};

console.log('✅ Console error monitoring initialized');
console.log('💡 Use window.getErrorLog() to view captured errors');
console.log('💡 Use window.clearErrorLog() to clear the error log');
