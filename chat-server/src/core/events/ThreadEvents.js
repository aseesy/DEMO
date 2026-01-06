/**
 * Thread Domain Events
 *
 * Defines thread-related domain events and their payloads.
 * These events are emitted by thread operations and consumed by event listeners.
 */

/**
 * ThreadCreated event
 * Emitted when a new thread is created
 * @typedef {Object} ThreadCreatedEvent
 * @property {string} threadId - Thread ID
 * @property {string} roomId - Room ID
 * @property {string} title - Thread title
 * @property {string} createdBy - User who created the thread
 * @property {string|null} initialMessageId - Optional initial message ID
 * @property {string} category - Thread category
 */
const THREAD_CREATED = 'ThreadCreated';

/**
 * ThreadMessageAdded event
 * Emitted when a message is added to a thread
 * @typedef {Object} ThreadMessageAddedEvent
 * @property {string} messageId - Message ID
 * @property {string} threadId - Thread ID
 * @property {string} roomId - Room ID
 */
const THREAD_MESSAGE_ADDED = 'ThreadMessageAdded';

/**
 * SubThreadCreated event
 * Emitted when a sub-thread is created
 * @typedef {Object} SubThreadCreatedEvent
 * @property {string} threadId - Sub-thread ID
 * @property {string} roomId - Room ID
 * @property {string} title - Thread title
 * @property {string} parentThreadId - Parent thread ID
 * @property {string} createdBy - User who created the thread
 */
const SUB_THREAD_CREATED = 'SubThreadCreated';

/**
 * ThreadArchived event
 * Emitted when a thread is archived or unarchived
 * @typedef {Object} ThreadArchivedEvent
 * @property {string} threadId - Thread ID
 * @property {string} roomId - Room ID
 * @property {boolean} archived - Archive status (true = archived, false = unarchived)
 * @property {boolean} cascade - Whether sub-threads were also archived
 * @property {Array<string>} affectedThreadIds - All thread IDs affected (including sub-threads)
 */
const THREAD_ARCHIVED = 'ThreadArchived';

module.exports = {
  THREAD_CREATED,
  THREAD_MESSAGE_ADDED,
  SUB_THREAD_CREATED,
  THREAD_ARCHIVED,
};

