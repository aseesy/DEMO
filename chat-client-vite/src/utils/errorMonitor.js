/**
 * Console Error Monitor
 * Captures and logs all console errors, warnings, and unhandled rejections
 * Helps identify issues before they cause blank screens
 */

// Environment detection (Vite-compatible)
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Store original console methods
const originalError = console.error;
const originalWarn = console.warn;

// Error log storage (for debugging) - only in development
if (isDevelopment) {
  window.__errorLog = [];
}

// Override console.error to capture errors
console.error = function (...args) {
  const errorMessage = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');

  // Suppress Socket.IO internal reconnection errors - these are expected during connection attempts
  // Socket.IO logs these internally, but they flood the console during connection issues
  const isSocketIOReconnectionError =
    errorMessage.includes('WebSocket connection to') &&
    errorMessage.includes('socket.io') &&
    (errorMessage.includes('failed') ||
      errorMessage.includes('closed before the connection is established'));

  if (isSocketIOReconnectionError) {
    // Suppress these errors - they're handled by our connect_error handler
    // Only log in development if needed for debugging
    if (isDevelopment) {
      // Optionally log once per session instead of every attempt
      if (!window.__socketErrorLogged) {
        console.debug('[errorMonitor] Socket.IO reconnection attempts in progress (suppressing verbose logs)');
        window.__socketErrorLogged = true;
      }
    }
    return; // Don't log or track these errors
  }

  // Call original console.error
  originalError.apply(console, args);

  // Store error in log (development only)
  if (isDevelopment && window.__errorLog) {
    window.__errorLog.push({
      type: 'error',
      timestamp: new Date().toISOString(),
      message: errorMessage,
    });
  }

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(new Error(errorMessage));
  }
};

// Override console.warn to capture warnings
console.warn = function (...args) {
  const warningMessage = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ');

  // Suppress Socket.IO internal reconnection warnings - these are expected during connection attempts
  const isSocketIOReconnectionWarning =
    warningMessage.includes('WebSocket connection to') &&
    warningMessage.includes('socket.io') &&
    (warningMessage.includes('failed') ||
      warningMessage.includes('closed before the connection is established'));

  if (isSocketIOReconnectionWarning) {
    // Check if server is marked as down - if so, suppress these warnings
    try {
      const serverDownUntil = sessionStorage.getItem('liaizen:server-down-until');
      if (serverDownUntil && parseInt(serverDownUntil, 10) > Date.now()) {
        // Server is marked as down - suppress these warnings to avoid spam
        return;
      }
    } catch {
      // Ignore storage errors
    }
    
    // Suppress these warnings - they're handled by our connect_error handler
    return; // Don't log these warnings
  }
  
  // Suppress "Unexpected disconnect: transport close" warnings when server is down
  if (warningMessage.includes('Unexpected disconnect') && warningMessage.includes('transport close')) {
    try {
      const serverDownUntil = sessionStorage.getItem('liaizen:server-down-until');
      if (serverDownUntil && parseInt(serverDownUntil, 10) > Date.now()) {
        // Server is marked as down - suppress disconnect warnings
        return;
      }
    } catch {
      // Ignore storage errors
    }
  }

  // Call original console.warn
  originalWarn.apply(console, args);

  // Store warning in log (development only)
  if (isDevelopment && window.__errorLog) {
    window.__errorLog.push({
      type: 'warning',
      timestamp: new Date().toISOString(),
      message: warningMessage,
    });
  }
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
    if (isDevelopment) {
      console.debug(
        '[errorMonitor] Suppressed Safari service worker error (expected):',
        errorMessage
      );
    }
    return;
  }

  console.error('🚨 Unhandled Promise Rejection:', event.reason);

  // Store in error log (development only)
  if (isDevelopment && window.__errorLog) {
    window.__errorLog.push({
      type: 'unhandledRejection',
      timestamp: new Date().toISOString(),
      message: errorMessage,
    });
  }

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(error);
  }
});

// Capture global errors
window.addEventListener('error', event => {
  console.error('🚨 Global Error:', event.error || event.message);

  // Store in error log (development only)
  if (isDevelopment && window.__errorLog) {
    window.__errorLog.push({
      type: 'globalError',
      timestamp: new Date().toISOString(),
      message: event.error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  }

  // Send to monitoring service if configured
  if (window.trackError) {
    window.trackError(event.error || new Error(event.message));
  }
});

// Utility functions (development only)
if (isDevelopment) {
  // Utility function to get error log
  window.getErrorLog = function () {
    return window.__errorLog || [];
  };

  // Utility function to clear error log
  window.clearErrorLog = function () {
    if (window.__errorLog) {
      window.__errorLog = [];
      console.log('✅ Error log cleared');
    }
  };

  console.log('✅ Console error monitoring initialized');
  console.log('💡 Use window.getErrorLog() to view captured errors');
  console.log('💡 Use window.clearErrorLog() to clear the error log');
}
