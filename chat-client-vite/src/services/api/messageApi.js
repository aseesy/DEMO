/**
 * Message API Client
 *
 * REST API client for message operations.
 * Provides a clean interface for fetching and managing messages.
 */

import { tokenManager } from '../auth/tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get authentication headers
 */
function getAuthHeaders() {
  const token = tokenManager.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data.data || data;
  } catch (error) {
    console.error(`[messageApi] Error:`, error);
    throw error;
  }
}

/**
 * Get messages for a room
 * @param {string} roomId - Room ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum messages to fetch (default: 50, max: 500)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {string} options.before - Timestamp for cursor-based pagination (before this time)
 * @param {string} options.after - Timestamp for cursor-based pagination (after this time)
 * @param {string} options.threadId - Filter by thread ID
 * @returns {Promise<Object>} { messages, total, hasMore, limit, offset }
 */
export async function getRoomMessages(roomId, options = {}) {
  const { limit = 50, offset = 0, before, after, threadId } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (before) params.append('before', before);
  if (after) params.append('after', after);
  if (threadId) params.append('threadId', threadId);

  return apiRequest(`/api/messages/room/${roomId}?${params.toString()}`);
}

/**
 * Get messages for a thread
 * @param {string} threadId - Thread ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum messages to fetch (default: 50, max: 500)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<Object>} { messages, total, hasMore, limit, offset }
 */
export async function getThreadMessages(threadId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return apiRequest(`/api/messages/thread/${threadId}?${params.toString()}`);
}

/**
 * Get a single message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Message object
 */
export async function getMessage(messageId) {
  return apiRequest(`/api/messages/${messageId}`);
}

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @param {string} messageData.roomId - Room ID
 * @param {string} messageData.text - Message text
 * @param {string} [messageData.threadId] - Thread ID (optional)
 * @param {string} [messageData.type] - Message type (default: 'user')
 * @param {Object} [messageData.metadata] - AI intervention metadata
 * @returns {Promise<Object>} Created message
 */
export async function createMessage(messageData) {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
}

/**
 * Update a message (edit)
 * @param {string} messageId - Message ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.text] - New message text
 * @param {Object} [updates.metadata] - Updated metadata
 * @returns {Promise<Object>} Updated message
 */
export async function updateMessage(messageId, updates) {
  return apiRequest(`/api/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export async function deleteMessage(messageId) {
  return apiRequest(`/api/messages/${messageId}`, {
    method: 'DELETE',
  });
}

/**
 * Add a reaction to a message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji string
 * @returns {Promise<Object>} Updated message
 */
export async function addReaction(messageId, emoji) {
  return apiRequest(`/api/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  });
}

/**
 * Remove a reaction from a message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji string
 * @returns {Promise<Object>} Updated message
 */
export async function removeReaction(messageId, emoji) {
  return apiRequest(`/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
    method: 'DELETE',
  });
}

/**
 * Message API client object (for convenience)
 */
export const messageApi = {
  getRoomMessages,
  getThreadMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  addReaction,
  removeReaction,
};

export default messageApi;

