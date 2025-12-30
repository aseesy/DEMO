/**
 * Thread Event Listeners
 *
 * Decoupled event handlers for thread-related domain events.
 * These listeners handle side effects like embedding generation and Neo4j updates.
 */

const { THREAD_CREATED, SUB_THREAD_CREATED } = require('../ThreadEvents');

/**
 * Register all thread event listeners
 * Called once at application startup
 */
function registerThreadEventListeners() {
  const { eventEmitter } = require('../DomainEventEmitter');

  // Register ThreadCreated listener for embedding generation
  eventEmitter.on(THREAD_CREATED, handleThreadCreated);

  // Register SubThreadCreated listener for embedding generation
  eventEmitter.on(SUB_THREAD_CREATED, handleSubThreadCreated);

  console.log('✅ Thread event listeners registered');
}

/**
 * Handle ThreadCreated event
 * Generates embeddings for semantic search (decoupled from thread creation)
 * @param {Object} event - ThreadCreated event data
 */
async function handleThreadCreated(event) {
  const { threadId, roomId, title } = event;

  try {
    // Lazy load autoThreading to avoid circular dependency
    const autoThreading = require('../../../../services/autoThreading');
    
    if (autoThreading && autoThreading.ensureThreadEmbedding) {
      await autoThreading.ensureThreadEmbedding(threadId, roomId, title);
      console.log(`[ThreadEventListeners] Generated embedding for thread: ${threadId}`);
    }
  } catch (error) {
    console.error(`[ThreadEventListeners] Error generating embedding for thread ${threadId}:`, error.message);
    // Fail-open: embedding generation is optional
  }
}

/**
 * Handle SubThreadCreated event
 * Generates embeddings for semantic search (decoupled from sub-thread creation)
 * @param {Object} event - SubThreadCreated event data
 */
async function handleSubThreadCreated(event) {
  const { threadId, roomId, title } = event;

  try {
    // Lazy load autoThreading to avoid circular dependency
    const autoThreading = require('../../../../services/autoThreading');
    
    if (autoThreading && autoThreading.ensureThreadEmbedding) {
      await autoThreading.ensureThreadEmbedding(threadId, roomId, title);
      console.log(`[ThreadEventListeners] Generated embedding for sub-thread: ${threadId}`);
    }
  } catch (error) {
    console.error(`[ThreadEventListeners] Error generating embedding for sub-thread ${threadId}:`, error.message);
    // Fail-open: embedding generation is optional
  }
}

module.exports = {
  registerThreadEventListeners,
  handleThreadCreated,
  handleSubThreadCreated,
};

