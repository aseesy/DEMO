/**
 * Centralized Logging Utility (Python-style)
 *
 * Provides structured logging that:
 * - Only logs in development (gated by import.meta.env.DEV)
 * - Prevents sensitive data leakage (PII, tokens, etc.)
 * - Supports log levels (ERROR, WARN, INFO, DEBUG) like Python logging
 * - Filterable via localStorage flags for quieter development
 * - Can be extended to send logs to services (Datadog, Sentry) in production
 */

const isDev = import.meta.env.DEV;

// Python-style log levels (matching Python's logging module)
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Get current log level from localStorage or default to INFO (suppress DEBUG by default)
const getLogLevel = () => {
  if (typeof window === 'undefined') return LOG_LEVELS.INFO;
  const stored = window.localStorage?.getItem('logLevel');
  if (stored && LOG_LEVELS[stored.toUpperCase()] !== undefined) {
    return LOG_LEVELS[stored.toUpperCase()];
  }
  return LOG_LEVELS.INFO; // Default: show INFO, WARN, ERROR (hide DEBUG)
};

// Check if a specific context should be silenced
const isContextSilenced = context => {
  if (typeof window === 'undefined') return false;
  const silenced = window.localStorage?.getItem('logSilence')?.split(',') || [];
  return silenced.some(pattern => context.includes(pattern));
};

// Suppress noisy routine debug messages by default
const NOISY_PATTERNS = [
  'Token changed', // Socket token updates are routine
  'GOOGLE_TAG detected', // Analytics init is routine
  'Socket connection state changed', // Connection state changes are routine (we already handle this)
];

/**
 * Sanitize data to prevent logging sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} Sanitized data
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'authorization',
    'auth',
    'cookie',
    'session',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'email', // Redact email addresses to prevent PII leakage
    'userEmail',
    'username', // May contain email
    'socketId', // Can be used to track users
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'string' && sanitized[key].includes('Bearer ')) {
      sanitized[key] = '[REDACTED_TOKEN]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Create a logger with context prefix (Python-style logging)
 * @param {string} context - Context prefix (e.g., '[ChatContext]')
 * @returns {Object} Logger object with info, warn, error, debug methods
 *
 * Usage:
 *   const logger = createLogger('[MyComponent]');
 *   logger.debug('Detailed debug info'); // Only if logLevel=DEBUG
 *   logger.info('General information');  // Shown by default
 *   logger.warn('Warning message');      // Always shown
 *   logger.error('Error occurred');      // Always shown
 *
 * Control via localStorage:
 *   localStorage.logLevel = 'DEBUG';  // Show all logs (including debug)
 *   localStorage.logLevel = 'INFO';   // Show INFO, WARN, ERROR (default)
 *   localStorage.logLevel = 'WARN';   // Show only WARN and ERROR
 *   localStorage.logLevel = 'ERROR';  // Show only ERROR
 *   localStorage.logSilence = 'SocketService,Analytics';  // Silence specific contexts
 */
export function createLogger(context) {
  // Check if this context is silenced
  if (isContextSilenced(context)) {
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    };
  }

  const currentLevel = getLogLevel();

  return {
    info: (...args) => {
      if (!isDev) return;
      if (currentLevel > LOG_LEVELS.INFO) return;

      // Suppress noisy routine messages at INFO level
      const messageStr = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
      if (NOISY_PATTERNS.some(pattern => messageStr.includes(pattern))) {
        return; // Suppress noisy routine messages
      }

      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.log(`[${context}]`, ...sanitized);
    },
    warn: (...args) => {
      if (!isDev) return;
      if (currentLevel > LOG_LEVELS.WARN) return;
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.warn(`[${context}]`, ...sanitized);
    },
    error: (...args) => {
      // Always log errors (even in production) but sanitize sensitive data
      if (currentLevel > LOG_LEVELS.ERROR) return;
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.error(`[${context}]`, ...sanitized);
    },
    debug: (...args) => {
      if (!isDev) return;
      if (currentLevel > LOG_LEVELS.DEBUG) return; // Suppress DEBUG by default
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.debug(`[${context}]`, ...sanitized);
    },
  };
}

/**
 * Default logger for backwards compatibility
 */
export const logger = createLogger('App');

export default logger;
