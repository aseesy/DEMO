/**
 * messageBuilder.js
 * Pure functions for message creation and manipulation with no React/DOM dependencies.
 * Extracted from useChat.js hook.
 */

/**
 * Generate a unique message ID
 * @param {string} socketId - Optional socket ID for uniqueness
 * @returns {string} Unique message ID
 */
export function generateMessageId(socketId = 'local') {
  return `${Date.now()}-${socketId}`;
}

/**
 * Create a pending message object
 * @param {Object} params - Message parameters
 * @param {string} params.text - Message text
 * @param {string} params.username - Sender username
 * @param {string} params.socketId - Socket ID for ID generation
 * @param {boolean} params.isPreApprovedRewrite - Whether this is a pre-approved rewrite
 * @param {string} params.originalRewrite - Original text if this is a rewrite
 * @returns {Object} Pending message object
 */
export function createPendingMessage({
  text,
  username,
  socketId = 'local',
  isPreApprovedRewrite = false,
  originalRewrite = '',
}) {
  return {
    id: generateMessageId(socketId),
    text: text.trim(),
    username,
    timestamp: new Date().toISOString(),
    isPreApprovedRewrite,
    originalRewrite,
    status: 'pending',
  };
}

/**
 * Create a message payload for socket emission
 * @param {Object} params - Message parameters
 * @param {string} params.text - Message text
 * @param {boolean} params.isPreApprovedRewrite - Whether this is a pre-approved rewrite
 * @param {string} params.originalRewrite - Original text if this is a rewrite
 * @returns {Object} Socket payload
 */
export function createMessagePayload({ text, isPreApprovedRewrite = false, originalRewrite = '' }) {
  return {
    text: text.trim(),
    isPreApprovedRewrite,
    originalRewrite: originalRewrite || null,
  };
}

/**
 * Add timestamp to a message if not present
 * @param {Object} message - Message object
 * @returns {Object} Message with timestamp
 */
export function ensureMessageTimestamp(message) {
  if (!message) return message;

  return {
    ...message,
    timestamp: message.timestamp || new Date().toISOString(),
  };
}

/**
 * Check if a message is a system message (join/leave)
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function isSystemMessage(message) {
  if (!message?.text || typeof message.text !== 'string') return false;

  const lower = message.text.toLowerCase();
  return lower.includes(' left the chat') || lower.includes(' joined the chat');
}

/**
 * Filter out system messages from message list
 * @param {Array} messages - Array of message objects
 * @returns {Array} Filtered messages without system messages
 */
export function filterSystemMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.filter(msg => !isSystemMessage(msg));
}

/**
 * Check if a message is from the current user
 * Uses new sender structure (sender.email) with fallback to legacy fields
 * @param {Object} message - Message object
 * @param {string} currentUserEmail - Current user's email (or username for legacy)
 * @returns {boolean}
 */
export function isOwnMessage(message, currentUserEmail) {
  if (!message || !currentUserEmail) return false;

  // Try new structure first (sender.email)
  if (message.sender?.email) {
    return message.sender.email.toLowerCase() === currentUserEmail.toLowerCase();
  }

  // Fallback to legacy fields
  const messageEmail = message.user_email || message.email || message.username;
  if (!messageEmail) return false;

  return messageEmail.toLowerCase() === currentUserEmail.toLowerCase();
}

/**
 * Check if a message is an AI/intervention message
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function isAIMessage(message) {
  if (!message?.type) return false;
  return message.type.startsWith('ai_') || message.type === 'pending_original';
}

/**
 * Create an offline queue message for localStorage
 * @param {Object} pendingMessage - Pending message object
 * @returns {Object} Queue message object
 */
export function createQueueMessage(pendingMessage) {
  return {
    id: pendingMessage.id,
    text: pendingMessage.text,
    isPreApprovedRewrite: pendingMessage.isPreApprovedRewrite || false,
    originalRewrite: pendingMessage.originalRewrite || null,
    queuedAt: new Date().toISOString(),
  };
}

/**
 * Parse offline queue from localStorage
 * @param {string} storageKey - localStorage key
 * @returns {Array} Array of queued messages
 */
export function loadOfflineQueue(storageKey = 'liaizen_offline_queue') {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to load offline queue:', e);
    return [];
  }
}

/**
 * Save offline queue to localStorage
 * @param {Array} queue - Array of queued messages
 * @param {string} storageKey - localStorage key
 * @returns {boolean} Success status
 */
export function saveOfflineQueue(queue, storageKey = 'liaizen_offline_queue') {
  try {
    localStorage.setItem(storageKey, JSON.stringify(queue));
    return true;
  } catch (e) {
    console.warn('Failed to save offline queue:', e);
    return false;
  }
}

/**
 * Clear offline queue from localStorage
 * @param {string} storageKey - localStorage key
 * @returns {boolean} Success status
 */
export function clearOfflineQueue(storageKey = 'liaizen_offline_queue') {
  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (e) {
    console.warn('Failed to clear offline queue:', e);
    return false;
  }
}

/**
 * Remove a message from offline queue by ID
 * @param {Array} queue - Current queue
 * @param {string} messageId - Message ID to remove
 * @returns {Array} Updated queue
 */
export function removeFromQueue(queue, messageId) {
  if (!Array.isArray(queue)) return [];
  return queue.filter(msg => msg.id !== messageId);
}

/**
 * Message status constants
 */
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  DELIVERED: 'delivered',
  READ: 'read',
};

/**
 * Offline queue storage key
 */
export const OFFLINE_QUEUE_KEY = 'liaizen_offline_queue';
