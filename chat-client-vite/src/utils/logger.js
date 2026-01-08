/**
 * Centralized Logging Utility
 * 
 * Provides structured logging that:
 * - Only logs in development (gated by import.meta.env.DEV)
 * - Prevents sensitive data leakage (PII, tokens, etc.)
 * - Supports log levels (info, warn, error, debug)
 * - Can be extended to send logs to services (Datadog, Sentry) in production
 */

const isDev = import.meta.env.DEV;

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
 * Create a logger with context prefix
 * @param {string} context - Context prefix (e.g., '[ChatContext]')
 * @returns {Object} Logger object with info, warn, error, debug methods
 */
export function createLogger(context) {
  return {
    info: (...args) => {
      if (!isDev) return;
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.log(`[${context}]`, ...sanitized);
    },
    warn: (...args) => {
      if (!isDev) return;
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.warn(`[${context}]`, ...sanitized);
    },
    error: (...args) => {
      // Always log errors (even in production) but sanitize sensitive data
      const sanitized = args.map(arg => (typeof arg === 'object' ? sanitizeData(arg) : arg));
      console.error(`[${context}]`, ...sanitized);
    },
    debug: (...args) => {
      if (!isDev) return;
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
