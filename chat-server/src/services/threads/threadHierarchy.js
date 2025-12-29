/**
 * Thread Hierarchy Module
 *
 * Handles hierarchical thread operations:
 * - Create sub-threads
 * - Get thread ancestors
 * - Get sub-threads
 * - Get thread hierarchy
 * - Get threads by root
 */

const dbSafe = require('../../../dbSafe');
const { normalizeCategory } = require('./threadCategories');
const { factory: semanticIndexFactory } = require('../../infrastructure/semantic/SemanticIndexFactory');
const { eventEmitter } = require('../../core/events/DomainEventEmitter');
const { SUB_THREAD_CREATED } = require('../../core/events/ThreadEvents');

/**
 * Create a sub-thread (spawned from a message in an existing thread)
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 * @param {string} createdBy - Username who created
 * @param {string} parentThreadId - Parent thread ID
 * @param {string} parentMessageId - Message that spawned this sub-thread
 * @param {string} category - Thread category (defaults to parent's category)
 * @returns {Promise<string>} New thread ID
 */
async function createSubThread(
  roomId,
  title,
  createdBy,
  parentThreadId,
  parentMessageId,
  category = null
) {
  try {
    const db = require('../../../dbPostgres');
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Get parent thread to determine root, depth, and default category
    const parentResult = await db.query(
      'SELECT root_thread_id, depth, category FROM threads WHERE id = $1',
      [parentThreadId]
    );

    if (!parentResult.rows[0]) {
      throw new Error(`Parent thread not found: ${parentThreadId}`);
    }

    const parentThread = parentResult.rows[0];
    // Root is always the top-level ancestor (parent's root, or parent itself if parent is top-level)
    const rootThreadId = parentThread.root_thread_id || parentThreadId;
    const depth = (parentThread.depth || 0) + 1;
    // Inherit category from parent if not specified
    const normalizedCategory = category
      ? normalizeCategory(category)
      : normalizeCategory(parentThread.category || 'logistics');

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      message_count: 0,
      last_message_at: null,
      is_archived: 0,
      category: normalizedCategory,
      parent_thread_id: parentThreadId,
      root_thread_id: rootThreadId,
      parent_message_id: parentMessageId,
      depth: depth,
    });

    // Index thread and link to parent in semantic graph (fail-open: errors are non-fatal)
    const semanticIndex = semanticIndexFactory.getSemanticIndex();
    if (semanticIndex) {
      try {
        await semanticIndex.indexThread(threadId, roomId, title);
        await semanticIndex.linkThreadToParent(threadId, parentThreadId);
      } catch (err) {
        console.warn('⚠️  Failed to index sub-thread (non-fatal):', err.message);
      }
    }

    console.log(
      `[threadManager] Created sub-thread: ${threadId} (parent: ${parentThreadId}, root: ${rootThreadId}, depth: ${depth})`
    );
    return threadId;
  } catch (error) {
    console.error('Error creating sub-thread:', error);
    throw error;
  }
}

/**
 * Get all ancestor threads (parent chain up to root)
 * @param {string} threadId - Thread ID to get ancestors for
 * @returns {Promise<Array>} Array of ancestor threads, from immediate parent to root
 */
async function getThreadAncestors(threadId) {
  try {
    const db = require('../../../dbPostgres');

    // Use recursive CTE to get all ancestors
    const result = await db.query(
      `
      WITH RECURSIVE ancestors AS (
        -- Start with the parent of the given thread
        SELECT t.*, 1 as level
        FROM threads t
        WHERE t.id = (SELECT parent_thread_id FROM threads WHERE id = $1)

        UNION ALL

        -- Recursively get each parent's parent
        SELECT t.*, a.level + 1
        FROM threads t
        INNER JOIN ancestors a ON t.id = a.parent_thread_id
      )
      SELECT * FROM ancestors
      ORDER BY level ASC
    `,
      [threadId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting thread ancestors:', error);
    return [];
  }
}

/**
 * Get direct child threads (sub-threads)
 * @param {string} threadId - Parent thread ID
 * @returns {Promise<Array>} Array of direct child threads
 */
async function getSubThreads(threadId) {
  try {
    const result = await dbSafe.safeSelect(
      'threads',
      { parent_thread_id: threadId, is_archived: 0 },
      {
        orderBy: 'updated_at',
        orderDirection: 'DESC',
      }
    );

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting sub-threads:', error);
    return [];
  }
}

/**
 * Get complete thread hierarchy (all descendants)
 * @param {string} threadId - Root thread ID to get hierarchy for
 * @returns {Promise<Array>} Flat array of all threads in hierarchy with depth info
 */
async function getThreadHierarchy(threadId) {
  try {
    const db = require('../../../dbPostgres');

    // Use recursive CTE to get all descendants
    const result = await db.query(
      `
      WITH RECURSIVE descendants AS (
        -- Start with the given thread
        SELECT t.*, 0 as relative_depth
        FROM threads t
        WHERE t.id = $1

        UNION ALL

        -- Recursively get all children
        SELECT t.*, d.relative_depth + 1
        FROM threads t
        INNER JOIN descendants d ON t.parent_thread_id = d.id
        WHERE t.is_archived = 0
      )
      SELECT * FROM descendants
      ORDER BY relative_depth ASC, updated_at DESC
    `,
      [threadId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting thread hierarchy:', error);
    return [];
  }
}

/**
 * Get all threads in a room that share the same root (entire conversation tree)
 * @param {string} rootThreadId - Root thread ID
 * @returns {Promise<Array>} All threads in the hierarchy
 */
async function getThreadsByRoot(rootThreadId) {
  try {
    const result = await dbSafe.safeSelect(
      'threads',
      { root_thread_id: rootThreadId, is_archived: 0 },
      {
        orderBy: 'depth',
        orderDirection: 'ASC',
      }
    );

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads by root:', error);
    return [];
  }
}

module.exports = {
  createSubThread,
  getThreadAncestors,
  getSubThreads,
  getThreadHierarchy,
  getThreadsByRoot,
};
