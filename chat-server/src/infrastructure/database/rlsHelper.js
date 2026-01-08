/**
 * Row-Level Security (RLS) Helper
 *
 * Sets PostgreSQL session variables for RLS policies.
 * RLS policies use current_user_id() function which reads from session context.
 */

const dbPostgres = require('../../../dbPostgres');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'rlsHelper',
});

/**
 * Set current user ID in PostgreSQL session for RLS policies
 * This must be called before executing queries that rely on RLS
 *
 * Note: This uses a session-level variable. For connection pooling,
 * this should be set per-request or per-transaction.
 *
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function setCurrentUserId(userId) {
  try {
    // Set session variable that current_user_id() function reads
    await dbPostgres.query(`SET LOCAL app.current_user_id = $1`, [userId]);
  } catch (error) {
    logger.error('[RLS Helper] Error setting current user ID', {
      error: error,
    });
    // Don't throw - RLS will fail closed (deny access) if variable not set
  }
}

/**
 * Clear current user ID from session
 * @returns {Promise<void>}
 */
async function clearCurrentUserId() {
  try {
    await dbPostgres.query(`RESET app.current_user_id`);
  } catch (error) {
    // Ignore errors when clearing
  }
}

/**
 * Middleware to set RLS context for Express requests
 * Call this after authentication middleware
 *
 * Usage:
 *   app.use(authenticate);
 *   app.use(setRLSContext);
 */
function setRLSContext(req, res, next) {
  // Set RLS context if user is authenticated
  if (req.user && req.user.id) {
    // For connection pooling, we need to set this per-query or use a transaction
    // This is a placeholder - actual implementation depends on pooling strategy
    req.rlsUserId = req.user.id;
  }
  next();
}

/**
 * Execute a query with RLS context
 * Wraps query execution with RLS context setting
 *
 * @param {number} userId - User ID
 * @param {Function} queryFn - Function that returns a promise with query
 * @returns {Promise<any>} Query result
 */
async function withRLSContext(userId, queryFn) {
  // Note: For connection pooling, this may not work as expected
  // because SET LOCAL only affects the current transaction/connection
  // Consider using a transaction or connection-level variable setting
  try {
    await setCurrentUserId(userId);
    return await queryFn();
  } finally {
    await clearCurrentUserId();
  }
}

module.exports = {
  setCurrentUserId,
  clearCurrentUserId,
  setRLSContext,
  withRLSContext,
};
