/**
 * Database Readiness Middleware
 *
 * Prevents routes from executing before database is ready.
 * Returns 503 Service Unavailable if database connection is not established.
 *
 * This is critical for Railway deployments where:
 * - Server starts before database initialization completes
 * - Health checks need to pass immediately
 * - But actual API endpoints should wait for database
 */

const db = require('../dbPostgres');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'dbReady',
});

/**
 * Middleware to check if database is ready
 * Returns 503 Service Unavailable if database is not ready
 */
function requireDatabaseReady(req, res, next) {
  // Check if database is ready
  if (!db.isReady()) {
    logger.warn('Log message', {
      value: `[dbReady] Database not ready for ${req.method} ${req.path}`,
    });
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'DATABASE_NOT_READY',
      message: 'Database connection is being established. Please try again in a moment.',
      retryAfter: 5, // Suggest retrying after 5 seconds
    });
  }

  next();
}

/**
 * Middleware to check database readiness but allow health checks
 * Health check endpoint should always work, even if DB is not ready
 */
function requireDatabaseReadyExceptHealth(req, res, next) {
  // Allow health/readiness check endpoints to pass through
  // These endpoints handle their own database status logic
  if (req.path === '/health' || req.path === '/healthcheck' || req.path === '/ready') {
    return next();
  }

  return requireDatabaseReady(req, res, next);
}

module.exports = {
  requireDatabaseReady,
  requireDatabaseReadyExceptHealth,
};
