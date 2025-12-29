/**
 * Thread Operations Module
 *
 * Handles CRUD operations for threads:
 * - Create threads
 * - Get threads (by room, by ID)
 * - Update threads (title, category)
 * - Archive threads
 */

const dbSafe = require('../../../dbSafe');
const { normalizeCategory } = require('./threadCategories');

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('../../infrastructure/database/neo4jClient');
} catch (err) {
  console.warn('⚠️  Neo4j client not available - semantic threading will use fallback');
}

/**
 * Create a new top-level thread
 * For sub-threads, use createSubThread() instead
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 * @param {string} createdBy - Username who created
 * @param {string|null} initialMessageId - Optional initial message to add
 * @param {string} category - Thread category (defaults to 'logistics')
 * @param {Function} addMessageToThread - Function to add message to thread (from threadMessages)
 */
async function createThread(
  roomId,
  title,
  createdBy,
  initialMessageId = null,
  category = 'logistics',
  addMessageToThread = null
) {
  try {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const normalizedCategory = normalizeCategory(category);

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      message_count: initialMessageId ? 1 : 0,
      last_message_at: initialMessageId ? now : null,
      is_archived: 0,
      category: normalizedCategory,
      // Top-level thread: no parent, root is self, depth is 0
      parent_thread_id: null,
      root_thread_id: threadId, // Self-reference for top-level
      parent_message_id: null,
      depth: 0,
    });

    // Create thread node in Neo4j for semantic search
    if (neo4jClient && neo4jClient.isAvailable()) {
      try {
        await neo4jClient.createOrUpdateThreadNode(threadId, roomId, title);
      } catch (err) {
        console.warn('⚠️  Failed to create Neo4j thread node (non-fatal):', err.message);
      }
    }

    // If initial message provided, associate it with the thread
    if (initialMessageId && addMessageToThread) {
      await addMessageToThread(initialMessageId, threadId);
    }

    // PostgreSQL auto-commits, no manual save needed
    return threadId;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

/**
 * Get thread details
 */
async function getThread(threadId) {
  try {
    const result = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
    const threads = dbSafe.parseResult(result);
    return threads.length > 0 ? threads[0] : null;
  } catch (error) {
    console.error('Error getting thread:', error);
    return null;
  }
}

/**
 * Get threads for a room (limited to most recent)
 * @param {string} roomId - Room ID
 * @param {boolean} includeArchived - Include archived threads
 * @param {number} limit - Maximum number of threads to return (default 10)
 */
async function getThreadsForRoom(roomId, includeArchived = false, limit = 10) {
  try {
    const whereClause = includeArchived ? { room_id: roomId } : { room_id: roomId, is_archived: 0 };

    const result = await dbSafe.safeSelect('threads', whereClause, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
      limit: limit,
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads:', error);
    return [];
  }
}

/**
 * Update thread title
 */
async function updateThreadTitle(threadId, newTitle) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        title: newTitle,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error updating thread title:', error);
    return false;
  }
}

/**
 * Update thread category
 * @param {string} threadId - Thread ID
 * @param {string} newCategory - New category (must be valid)
 * @returns {Promise<boolean>} Success status
 */
async function updateThreadCategory(threadId, newCategory) {
  try {
    const normalizedCategory = normalizeCategory(newCategory);

    await dbSafe.safeUpdate(
      'threads',
      {
        category: normalizedCategory,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    return true;
  } catch (error) {
    console.error('Error updating thread category:', error);
    return false;
  }
}

/**
 * Archive/unarchive thread
 */
async function archiveThread(threadId, archived = true) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        is_archived: archived ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error archiving thread:', error);
    return false;
  }
}

module.exports = {
  createThread,
  getThread,
  getThreadsForRoom,
  updateThreadTitle,
  updateThreadCategory,
  archiveThread,
};
