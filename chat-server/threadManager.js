/**
 * Thread Manager - Facade
 *
 * This file serves as a facade that re-exports all thread management functions
 * from the extracted modules. This maintains backward compatibility while
 * allowing the codebase to be organized into smaller, focused modules.
 *
 * All functions are now organized in:
 * - src/services/threads/threadCategories.js - Category validation
 * - src/services/threads/threadKeywords.js - Keyword extraction
 * - src/services/threads/threadOperations.js - CRUD operations
 * - src/services/threads/threadHierarchy.js - Hierarchical operations
 * - src/services/threads/threadMessages.js - Message-thread operations
 * - src/services/threads/threadAnalysis.js - AI analysis
 */

const threadCategories = require('./src/services/threads/threadCategories');
const threadKeywords = require('./src/services/threads/threadKeywords');
const threadOperations = require('./src/services/threads/threadOperations');
const threadHierarchy = require('./src/services/threads/threadHierarchy');
const threadMessages = require('./src/services/threads/threadMessages');
const threadAnalysis = require('./src/services/threads/threadAnalysis');

// Re-export constants
const THREAD_CATEGORIES = threadCategories.THREAD_CATEGORIES;
const validateCategory = threadCategories.validateCategory;

// Re-export operations (with dependency injection for createThread)
const createThread = async (roomId, title, createdBy, initialMessageId = null, category = 'logistics') => {
  return threadOperations.createThread(roomId, title, createdBy, initialMessageId, category, threadMessages.addMessageToThread);
};
const getThread = threadOperations.getThread;
const getThreadsForRoom = threadOperations.getThreadsForRoom;
const getThreadMessages = threadOperations.getThreadMessages;
const updateThreadTitle = threadOperations.updateThreadTitle;
const updateThreadCategory = threadOperations.updateThreadCategory;
const getThreadsByCategory = threadOperations.getThreadsByCategory;
const archiveThread = threadOperations.archiveThread;

// Re-export hierarchy operations
const createSubThread = threadHierarchy.createSubThread;
const getThreadAncestors = threadHierarchy.getThreadAncestors;
const getSubThreads = threadHierarchy.getSubThreads;
const getThreadHierarchy = threadHierarchy.getThreadHierarchy;
const getThreadsByRoot = threadHierarchy.getThreadsByRoot;

// Re-export message operations
const addMessageToThread = threadMessages.addMessageToThread;
const removeMessageFromThread = threadMessages.removeMessageFromThread;

// Auto-assign with dependency injection
const autoAssignMessageToThread = async (message) => {
  return threadMessages.autoAssignMessageToThread(message, getThreadsForRoom);
};

// Re-export analysis operations (with dependency injection)
const suggestThreadForMessage = async (message, recentMessages, roomId) => {
  return threadAnalysis.suggestThreadForMessage(message, recentMessages, roomId, getThreadsForRoom);
};

const analyzeConversationHistory = async (roomId, limit = 100) => {
  return threadAnalysis.analyzeConversationHistory(roomId, limit, {
    getThreadsForRoom,
    createThread: async (roomId, title, createdBy, initialMessageId, category) => {
      return createThread(roomId, title, createdBy, initialMessageId, category);
    },
    addMessageToThread,
    archiveThread,
    generateEmbeddingForText: threadAnalysis.generateEmbeddingForText,
  });
};

const generateEmbeddingForText = threadAnalysis.generateEmbeddingForText;

module.exports = {
  // Constants
  THREAD_CATEGORIES,
  // Top-level thread operations
  createThread,
  getThreadsForRoom,
  getThreadMessages,
  addMessageToThread,
  removeMessageFromThread,
  autoAssignMessageToThread,
  updateThreadTitle,
  updateThreadCategory,
  getThreadsByCategory,
  archiveThread,
  suggestThreadForMessage,
  getThread,
  analyzeConversationHistory,
  // Hierarchical thread operations
  createSubThread,
  getThreadAncestors,
  getSubThreads,
  getThreadHierarchy,
  getThreadsByRoot,
  // Utilities
  validateCategory,
  // Analysis
  generateEmbeddingForText,
};
