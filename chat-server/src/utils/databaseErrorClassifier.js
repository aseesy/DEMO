/**
 * Database Error Classifier Utility
 *
 * Centralized utility for classifying database-related errors.
 * Replaces fragile string matching with robust error code and type detection.
 *
 * @module utils/databaseErrorClassifier
 */

/**
 * PostgreSQL error code categories
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const POSTGRES_ERROR_CATEGORIES = {
  // Connection errors (08xxx)
  CONNECTION_EXCEPTION: '08000',
  CONNECTION_DOES_NOT_EXIST: '08003',
  CONNECTION_FAILURE: '08006',
  SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION: '08001',
  SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION: '08004',
  TRANSACTION_RESOLUTION_UNKNOWN: '08007',

  // Shutdown errors (57Pxx)
  ADMIN_SHUTDOWN: '57P01',
  CRASH_SHUTDOWN: '57P02',
  CANNOT_CONNECT_NOW: '57P03',

  // Query errors that might indicate connection issues
  QUERY_CANCELED: '57014',
  QUERY_INTERNAL_ERROR: 'XX000',
};

/**
 * System-level connection error codes
 */
const SYSTEM_CONNECTION_ERROR_CODES = [
  'ECONNREFUSED', // Connection refused
  'ECONNRESET', // Connection reset by peer
  'ETIMEDOUT', // Operation timed out
  'ENOTFOUND', // DNS lookup failed
  'EPIPE', // Broken pipe
  'EHOSTUNREACH', // No route to host
  'EAI_AGAIN', // Temporary DNS failure
];

/**
 * Keywords that indicate database connection issues
 */
const CONNECTION_KEYWORDS = [
  'connection',
  'connect',
  'database',
  'postgresql',
  'postgres',
  'econnrefused',
  'econnreset',
  'timeout',
  'socket',
  'network',
  'unable to connect',
  'connection refused',
  'connection closed',
  'connection lost',
  'connection pool',
  'pool',
];

/**
 * Keywords that indicate database query/operation errors (not connection)
 */
const QUERY_ERROR_KEYWORDS = [
  'syntax error',
  'invalid',
  'duplicate',
  'constraint',
  'foreign key',
  'not null',
  'unique',
  'violation',
];

/**
 * Classify database error type
 * @param {Error} error - The error to classify
 * @returns {Object} Classification result with type and details
 */
function classifyDatabaseError(error) {
  if (!error) {
    return { isDatabaseError: false, type: null, details: null };
  }

  // Early return for clearly non-database errors
  const message = (error.message || '').toLowerCase();
  if (
    message &&
    (message.includes('file not found') ||
      message.includes('permission denied') ||
      message.includes('enoent') ||
      message.includes('eacces'))
  ) {
    return { isDatabaseError: false, type: null, details: null };
  }

  // Check for explicit database not ready marker
  if (error.message === 'DATABASE_NOT_READY') {
    return {
      isDatabaseError: true,
      type: 'CONNECTION',
      category: 'NOT_READY',
      isRetryable: true,
      details: { code: 'DATABASE_NOT_READY' },
    };
  }

  // Check error code first (most reliable)
  const errorCode = error.code || error.errno || error.sqlState;

  // PostgreSQL error codes
  if (errorCode) {
    // Connection errors
    if (
      POSTGRES_ERROR_CATEGORIES.CONNECTION_EXCEPTION === errorCode ||
      POSTGRES_ERROR_CATEGORIES.CONNECTION_DOES_NOT_EXIST === errorCode ||
      POSTGRES_ERROR_CATEGORIES.CONNECTION_FAILURE === errorCode ||
      POSTGRES_ERROR_CATEGORIES.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION === errorCode ||
      POSTGRES_ERROR_CATEGORIES.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION === errorCode ||
      POSTGRES_ERROR_CATEGORIES.TRANSACTION_RESOLUTION_UNKNOWN === errorCode
    ) {
      return {
        isDatabaseError: true,
        type: 'CONNECTION',
        category: 'POSTGRES_CONNECTION',
        isRetryable: true,
        details: { code: errorCode, postgresCode: true },
      };
    }

    // Shutdown errors
    if (
      POSTGRES_ERROR_CATEGORIES.ADMIN_SHUTDOWN === errorCode ||
      POSTGRES_ERROR_CATEGORIES.CRASH_SHUTDOWN === errorCode ||
      POSTGRES_ERROR_CATEGORIES.CANNOT_CONNECT_NOW === errorCode
    ) {
      return {
        isDatabaseError: true,
        type: 'CONNECTION',
        category: 'SHUTDOWN',
        isRetryable: true,
        details: { code: errorCode, postgresCode: true },
      };
    }
  }

  // System-level connection errors
  if (errorCode && SYSTEM_CONNECTION_ERROR_CODES.includes(errorCode)) {
    return {
      isDatabaseError: true,
      type: 'CONNECTION',
      category: 'SYSTEM',
      isRetryable: true,
      details: { code: errorCode, systemCode: true },
    };
  }

  // Check error message for connection keywords (already defined above)
  const stack = (error.stack || '').toLowerCase();

  // Check for connection-related keywords
  const hasConnectionKeyword = CONNECTION_KEYWORDS.some(
    keyword => message.includes(keyword) || stack.includes(keyword)
  );

  if (hasConnectionKeyword) {
    // Exclude query errors that happen to mention "connection" in a different context
    const isQueryError = QUERY_ERROR_KEYWORDS.some(keyword => message.includes(keyword));

    if (!isQueryError) {
      return {
        isDatabaseError: true,
        type: 'CONNECTION',
        category: 'MESSAGE_MATCH',
        isRetryable: true,
        details: {
          code: errorCode || 'UNKNOWN',
          matchedKeyword: CONNECTION_KEYWORDS.find(k => message.includes(k)),
        },
      };
    }
  }

  // Check if error has database-related properties (PostgreSQL error structure)
  if (error.severity || error.hint || error.position || error.internalPosition) {
    // PostgreSQL error object structure
    return {
      isDatabaseError: true,
      type: 'QUERY',
      category: 'POSTGRES_QUERY',
      isRetryable: false,
      details: {
        code: errorCode || error.code,
        severity: error.severity,
      },
    };
  }

  // Check for query error keywords in message (syntax errors, etc.)
  if (message && QUERY_ERROR_KEYWORDS.some(keyword => message.includes(keyword))) {
    return {
      isDatabaseError: true,
      type: 'QUERY',
      category: 'QUERY_ERROR',
      isRetryable: false,
      details: {
        code: errorCode || 'UNKNOWN',
        matchedKeyword: QUERY_ERROR_KEYWORDS.find(k => message.includes(k)),
      },
    };
  }

  // Not a database error
  return { isDatabaseError: false, type: null, details: null };
}

/**
 * Check if error is a database connection error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a database connection error
 */
function isDatabaseConnectionError(error) {
  const classification = classifyDatabaseError(error);
  return classification.isDatabaseError && classification.type === 'CONNECTION';
}

/**
 * Check if error is a database error (connection or query)
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's any database error
 */
function isDatabaseError(error) {
  return classifyDatabaseError(error).isDatabaseError;
}

/**
 * Check if error is retryable (transient database error)
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
function isRetryableDatabaseError(error) {
  const classification = classifyDatabaseError(error);
  return classification.isDatabaseError && classification.isRetryable === true;
}

/**
 * Get HTTP status code for database error
 * @param {Error} error - The error to check
 * @returns {number} HTTP status code (503 for connection errors, 500 for query errors)
 */
function getDatabaseErrorStatusCode(error) {
  const classification = classifyDatabaseError(error);

  if (!classification.isDatabaseError) {
    return 500; // Not a database error, default to 500
  }

  if (classification.type === 'CONNECTION') {
    return 503; // Service Unavailable
  }

  return 500; // Internal Server Error for query errors
}

/**
 * Get user-friendly error response for database errors
 * @param {Error} error - The error to format
 * @returns {Object|null} Formatted error response or null if not a database error
 */
function getDatabaseErrorResponse(error) {
  const classification = classifyDatabaseError(error);

  if (!classification.isDatabaseError) {
    return null;
  }

  if (classification.type === 'CONNECTION') {
    return {
      error: 'Service temporarily unavailable',
      code: 'DATABASE_NOT_READY',
      message: 'Database connection is being established. Please try again in a moment.',
      retryAfter: 5,
    };
  }

  // Query errors - don't expose internal details
  return {
    error: 'Database operation failed',
    code: 'DATABASE_ERROR',
    message: 'An error occurred while processing your request. Please try again.',
  };
}

module.exports = {
  classifyDatabaseError,
  isDatabaseConnectionError,
  isDatabaseError,
  isRetryableDatabaseError,
  getDatabaseErrorStatusCode,
  getDatabaseErrorResponse,
  // Export constants for testing
  POSTGRES_ERROR_CATEGORIES,
  SYSTEM_CONNECTION_ERROR_CODES,
  CONNECTION_KEYWORDS,
};
