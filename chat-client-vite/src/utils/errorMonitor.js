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
        message: args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
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
        message: args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
    });
};

// Capture unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);

    window.__errorLog.push({
        type: 'unhandledRejection',
        timestamp: new Date().toISOString(),
        message: event.reason?.message || String(event.reason)
    });

    // Send to monitoring service if configured
    if (window.trackError) {
        window.trackError(event.reason);
    }
});

// Capture global errors
window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error || event.message);

    window.__errorLog.push({
        type: 'globalError',
        timestamp: new Date().toISOString(),
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
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
