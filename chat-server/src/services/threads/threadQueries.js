/**
 * Thread Queries Module
 *
 * Handles query operations for threads:
 * - Get threads by category
 * - Other filtered queries
 */

const dbSafe = require('../../../dbSafe');
const { normalizeCategory } = require('./threadCategories');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'threadQueries',
});

/**
 * Get threads by category for a room
 * @param {string} roomId - Room ID
 * @param {string} category - Category to filter by
 * @param {number} limit - Maximum number of threads
 * @returns {Promise<Array>} Threads in category
 */
async function getThreadsByCategory(roomId, category, limit = 10) {
  try {
    const normalizedCategory = normalizeCategory(category);
    const result = await dbSafe.safeSelect(
      'threads',
      { room_id: roomId, category: normalizedCategory, is_archived: 0 },
      { orderBy: 'updated_at', orderDirection: 'DESC', limit }
    );

    return dbSafe.parseResult(result);
  } catch (error) {
    logger.error('Error getting threads by category', {
      error: error,
    });
    return [];
  }
}

module.exports = {
  getThreadsByCategory,
};
