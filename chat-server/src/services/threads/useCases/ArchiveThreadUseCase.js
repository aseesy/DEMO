/**
 * Archive Thread Use Case
 *
 * Orchestrates archiving/unarchiving a thread.
 * Supports cascade archival of sub-threads.
 * Emits domain events for decoupled side effects.
 */

const { eventEmitter } = require('../../../core/events/DomainEventEmitter');
const { THREAD_ARCHIVED } = require('../../../core/events/ThreadEvents');

/**
 * Archive Thread Use Case
 * Orchestrates thread archival using repository abstraction
 */
class ArchiveThreadUseCase {
  /**
   * @param {IThreadRepository} threadRepository - Thread repository
   */
  constructor(threadRepository) {
    this.threadRepository = threadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.threadId - Thread ID to archive
   * @param {boolean} params.archived - Archive status (true = archive, false = unarchive)
   * @param {boolean} params.cascade - Whether to cascade to sub-threads (default: true)
   * @returns {Promise<Object>} Result with success status and affected thread IDs
   */
  async execute({ threadId, archived = true, cascade = true }) {
    // Get thread to verify it exists and get room ID
    const thread = await this.threadRepository.findById(threadId);
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`);
    }

    const affectedThreadIds = [threadId];

    // Archive/unarchive the thread
    await this.threadRepository.archive(threadId, archived);

    // Cascade to sub-threads if requested
    if (cascade && archived) {
      // Only cascade when archiving (not when unarchiving)
      const subThreads = await this._getAllSubThreads(threadId);
      for (const subThread of subThreads) {
        await this.threadRepository.archive(subThread.id, archived);
        affectedThreadIds.push(subThread.id);
      }
    }

    // Emit domain event (fire and forget - decouples from side effects)
    eventEmitter.emit(THREAD_ARCHIVED, {
      threadId,
      roomId: thread.room_id,
      archived,
      cascade,
      affectedThreadIds,
    });

    return {
      success: true,
      threadId,
      archived,
      affectedThreadIds,
    };
  }

  /**
   * Recursively get all sub-threads (direct and nested)
   * @param {string} parentThreadId - Parent thread ID
   * @returns {Promise<Array>} Array of all sub-threads
   * @private
   */
  async _getAllSubThreads(parentThreadId) {
    const db = require('../../../../dbPostgres');
    
    // Use recursive CTE to get all descendants
    const result = await db.query(
      `
      WITH RECURSIVE descendants AS (
        -- Start with direct children
        SELECT id, title, depth
        FROM threads
        WHERE parent_thread_id = $1 AND is_archived = 0

        UNION ALL

        -- Recursively get all nested children
        SELECT t.id, t.title, t.depth
        FROM threads t
        INNER JOIN descendants d ON t.parent_thread_id = d.id
        WHERE t.is_archived = 0
      )
      SELECT id, title, depth FROM descendants
      ORDER BY depth ASC
    `,
      [parentThreadId]
    );

    return result.rows;
  }
}

module.exports = { ArchiveThreadUseCase };

