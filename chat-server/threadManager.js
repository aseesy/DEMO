/**
 * Thread Manager - Use Case Interactor
 *
 * This file orchestrates thread management through Use Cases.
 * It depends on abstractions (IConversationAnalyzer, IThreadRepository), not concrete implementations.
 *
 * Clean Architecture Pattern:
 * - Use Cases orchestrate business logic
 * - Repository handles persistence (can swap PostgreSQL for MongoDB)
 * - Analyzer handles AI logic (can swap OpenAI for Anthropic)
 * - This file has ONE reason to change: business workflow changes
 *
 * All functions are now organized in:
 * - src/core/interfaces/IConversationAnalyzer.js - AI analysis interface
 * - src/repositories/interfaces/IThreadRepository.js - Persistence interface
 * - src/services/threads/analyzers/AIThreadAnalyzer.js - AI implementation
 * - src/repositories/postgres/PostgresThreadRepository.js - Persistence implementation
 * - src/services/threads/useCases/*.js - Use case orchestrators
 * - src/services/threads/threadCategories.js - Category validation and keywords
 * - src/services/threads/threadKeywords.js - Keyword extraction
 * - src/services/threads/threadHierarchy.js - Hierarchical operations
 * - src/services/threads/threadEmbeddings.js - Embedding generation
 */

const { factory } = require('./src/services/threads/ThreadServiceFactory');
const threadCategories = require('./src/services/threads/threadCategories');
const threadKeywords = require('./src/services/threads/threadKeywords');
const threadHierarchy = require('./src/services/threads/threadHierarchy');
const threadEmbeddings = require('./src/services/threads/threadEmbeddings');

// Re-export constants
const THREAD_CATEGORIES = threadCategories.THREAD_CATEGORIES;
const validateCategory = threadCategories.validateCategory;

// Get use cases and repository
const threadRepository = factory.getThreadRepository();
const createThreadUseCase = factory.getCreateThreadUseCase();
const analyzeConversationUseCase = factory.getAnalyzeConversationUseCase();
const suggestThreadUseCase = factory.getSuggestThreadUseCase();
const autoAssignMessageUseCase = factory.getAutoAssignMessageUseCase();

// Use Case: Create Thread
const createThread = async (roomId, title, createdBy, initialMessageId = null, category = 'logistics') => {
  return createThreadUseCase.execute({ roomId, title, createdBy, initialMessageId, category });
};

// Repository: Get Thread
const getThread = async (threadId) => {
  return threadRepository.findById(threadId);
};

// Repository: Get Threads for Room
const getThreadsForRoom = async (roomId, includeArchived = false, limit = 10) => {
  try {
    return await threadRepository.findByRoomId(roomId, { includeArchived, limit });
  } catch (error) {
    console.error('Error getting threads:', error);
    return [];
  }
};

// Repository: Get Thread Messages
const getThreadMessages = async (threadId, limit = 50) => {
  return threadRepository.getMessages(threadId, limit);
};

// Repository: Update Thread Title
const updateThreadTitle = async (threadId, newTitle) => {
  return threadRepository.updateTitle(threadId, newTitle);
};

// Repository: Update Thread Category
const updateThreadCategory = async (threadId, newCategory) => {
  return threadRepository.updateCategory(threadId, newCategory);
};

// Repository: Get Threads by Category
const getThreadsByCategory = async (roomId, category, limit = 10) => {
  return threadRepository.findByCategory(roomId, category, limit);
};

// Repository: Archive Thread
const archiveThread = async (threadId, archived = true) => {
  return threadRepository.archive(threadId, archived);
};

// Re-export hierarchy operations
const createSubThread = threadHierarchy.createSubThread;
const getThreadAncestors = threadHierarchy.getThreadAncestors;
const getSubThreads = threadHierarchy.getSubThreads;
const getThreadHierarchy = threadHierarchy.getThreadHierarchy;
const getThreadsByRoot = threadHierarchy.getThreadsByRoot;

// Repository: Add Message to Thread
const addMessageToThread = async (messageId, threadId) => {
  return threadRepository.addMessage(messageId, threadId);
};

// Repository: Remove Message from Thread
const removeMessageFromThread = async (messageId) => {
  return threadRepository.removeMessage(messageId);
};

// Use Case: Auto Assign Message to Thread
const autoAssignMessageToThread = async (message) => {
  return autoAssignMessageUseCase.execute({ message });
};

// Use Case: Suggest Thread for Message
const suggestThreadForMessage = async (message, recentMessages, roomId) => {
  return suggestThreadUseCase.execute({ message, recentMessages, roomId });
};

// Use Case: Analyze Conversation History
const analyzeConversationHistory = async (roomId, limit = 100) => {
  return analyzeConversationUseCase.execute({ roomId, limit });
};

const generateEmbeddingForText = threadEmbeddings.generateEmbeddingForText;

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
