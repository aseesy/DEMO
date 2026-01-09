/**
 * Message Utilities - Pure functions for message handling
 *
 * Single Responsibility: Each function does ONE thing
 * - isOwnMessage: Determines message ownership
 * - isSystemMessage: Identifies system messages to filter
 * - isOptimisticMessage: Identifies optimistic (pending) messages
 * - findMatchingOptimisticIndex: Finds matching optimistic message for replacement
 * - messageExistsById: Checks if message already exists by ID
 * - messageExistsByContent: Checks if message exists by content matching
 *
 * All functions are pure (no side effects) for easy testing.
 */

/**
 * Check if a message is from the current user
 * Uses new sender structure (sender.email) with fallback to legacy fields
 * @param {Object} message - Message object
 * @param {string} currentUserEmail - Current user's email
 * @returns {boolean}
 */
export function isOwnMessage(message, currentUserEmail) {
  if (!message || !currentUserEmail) return false;

  // Try new structure first (sender.email)
  if (message.sender?.email) {
    return message.sender.email.toLowerCase() === currentUserEmail.toLowerCase();
  }

  // Fallback to legacy fields (username is deprecated, set to email for backward compatibility)
  const messageEmail = message.user_email || message.email || message.username;
  if (!messageEmail) return false;

  return messageEmail.toLowerCase() === currentUserEmail.toLowerCase();
}

/**
 * Check if a message is a system message that should be filtered
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function isSystemMessage(message) {
  if (typeof message?.text !== 'string') return false;
  const lower = message.text.toLowerCase();
  return lower.includes(' left the chat') || lower.includes(' joined the chat');
}

/**
 * Check if a message is an optimistic (pending) message
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function isOptimisticMessage(message) {
  return Boolean(message?.isOptimistic || message?.id?.startsWith('pending_'));
}

/**
 * Check if a message already exists in the list by ID
 * @param {Array} messages - List of messages
 * @param {string} messageId - Message ID to check
 * @returns {boolean}
 */
export function messageExistsById(messages, messageId) {
  if (!messageId || !Array.isArray(messages)) return false;
  return messages.some(msg => msg.id === messageId);
}

/**
 * Check if a message exists by content matching (for duplicate detection)
 * @param {Array} messages - List of messages
 * @param {Object} message - Message to check
 * @param {number} [timeWindowMs=5000] - Time window for matching in milliseconds
 * @returns {boolean}
 */
export function messageExistsByContent(messages, message, timeWindowMs = 5000) {
  if (!Array.isArray(messages) || !message) return false;

  const normalizedText = (message.text || '').trim().toLowerCase();
  // Use new sender structure (sender.email) with fallback to legacy fields
  // username is deprecated (set to email for backward compatibility)
  const messageEmail =
    message.sender?.email || message.user_email || message.email || message.username || '';
  const normalizedEmail = messageEmail.toLowerCase();
  const messageTime = new Date(message.timestamp || message.created_at || 0).getTime();

  return messages.some(msg => {
    // First check ID match
    if (msg.id === message.id) return true;

    // Then check content match
    const msgText = (msg.text || '').trim().toLowerCase();
    const msgEmail = msg.sender?.email || msg.user_email || msg.email || msg.username || '';
    const normalizedMsgEmail = msgEmail.toLowerCase();
    const msgTime = new Date(msg.timestamp || msg.created_at || 0).getTime();

    const textMatches = msgText === normalizedText;
    const emailMatches = normalizedMsgEmail === normalizedEmail;
    const timeMatches = Math.abs(messageTime - msgTime) < timeWindowMs;

    return textMatches && emailMatches && timeMatches;
  });
}

/**
 * Find the index of a matching optimistic message for a server message
 *
 * Matching priority:
 * 1. By optimisticId (most reliable - server echoes back client's ID)
 * 2. By text + username + time window (fallback)
 *
 * @param {Array} messages - List of messages
 * @param {Object} serverMessage - Server message to match
 * @param {string} currentUsername - Current user's email (parameter name kept for backward compatibility)
 * @param {number} [timeWindowMs=10000] - Time window for fallback matching
 * @returns {number} Index of matching message, or -1 if not found
 */
export function findMatchingOptimisticIndex(
  messages,
  serverMessage,
  currentUsername,
  timeWindowMs = 10000
) {
  if (!Array.isArray(messages) || !serverMessage || !currentUsername) return -1;

  // Use new sender structure (sender.email) with fallback to legacy fields
  const serverEmail =
    serverMessage.sender?.email ||
    serverMessage.user_email ||
    serverMessage.email ||
    serverMessage.username ||
    '';
  const normalizedServerEmail = serverEmail.toLowerCase();
  const normalizedCurrentEmail = currentUsername.toLowerCase();

  // Only match own messages
  if (normalizedServerEmail !== normalizedCurrentEmail) return -1;

  const normalizedServerText = (serverMessage.text || '').trim().toLowerCase();
  const serverTime = new Date(serverMessage.timestamp || serverMessage.created_at || 0).getTime();

  // PASS 1: Look for optimisticId match first (highest priority)
  if (serverMessage.optimisticId) {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!isOptimisticMessage(msg)) continue;

      // CRITICAL: Don't match blocked messages - they should stay visible as blocked
      if (msg.isBlocked || msg.status === 'blocked' || msg.needsMediation) continue;

      const msgEmail = msg.sender?.email || msg.user_email || msg.email || msg.username || '';
      const normalizedMsgEmail = msgEmail.toLowerCase();
      if (normalizedMsgEmail !== normalizedCurrentEmail) continue;

      if (msg.id === serverMessage.optimisticId) {
        return i;
      }
    }
  }

  // PASS 2: Fall back to text + time matching
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Only consider optimistic messages
    if (!isOptimisticMessage(msg)) continue;

    // CRITICAL: Don't match blocked messages - they should stay visible as blocked
    if (msg.isBlocked || msg.status === 'blocked' || msg.needsMediation) continue;

    // Only consider messages from the same user
    const msgEmail = msg.sender?.email || msg.user_email || msg.email || msg.username || '';
    const normalizedMsgEmail = msgEmail.toLowerCase();
    if (normalizedMsgEmail !== normalizedCurrentEmail) continue;

    // Match by text + time
    const normalizedMsgText = (msg.text || '').trim().toLowerCase();
    const msgTime = new Date(msg.timestamp || msg.created_at || 0).getTime();
    const timeDiff = Math.abs(serverTime - msgTime);

    if (normalizedMsgText === normalizedServerText && timeDiff < timeWindowMs) {
      return i;
    }
  }

  return -1;
}

/**
 * Process a new message and determine what action to take
 *
 * Returns an object describing what should happen:
 * - { action: 'ignore' } - Message should be ignored
 * - { action: 'skip' } - Message already exists, no action needed
 * - { action: 'replace', removeIndex: n } - Replace optimistic message at index
 * - { action: 'append' } - Append as new message
 *
 * @param {Array} messages - Current messages list
 * @param {Object} serverMessage - New message from server
 * @param {string} currentUsername - Current user's email (parameter name kept for backward compatibility)
 * @returns {Object} Action to take
 */
export function determineMessageAction(messages, serverMessage, currentUsername) {
  // Filter system messages
  if (isSystemMessage(serverMessage)) {
    return { action: 'ignore', reason: 'system_message' };
  }

  // Check if message already exists by ID
  if (messageExistsById(messages, serverMessage.id)) {
    return { action: 'skip', reason: 'already_exists_by_id' };
  }

  const ownMessage = isOwnMessage(serverMessage, currentUsername);

  if (ownMessage) {
    // For own messages, try to find and replace optimistic version
    const matchingIndex = findMatchingOptimisticIndex(messages, serverMessage, currentUsername);

    if (matchingIndex >= 0) {
      // CRITICAL: Don't replace blocked messages - they need to stay visible
      const matchedMessage = messages[matchingIndex];
      if (
        matchedMessage.isBlocked ||
        matchedMessage.status === 'blocked' ||
        matchedMessage.needsMediation
      ) {
        // This is a blocked message that should stay visible - don't replace it
        return { action: 'skip', reason: 'blocked_message_must_stay_visible' };
      }

      return {
        action: 'replace',
        removeIndex: matchingIndex,
        matchedBy: serverMessage.optimisticId ? 'optimisticId' : 'text_time',
      };
    }

    // No matching optimistic message, just append
    return { action: 'append', reason: 'no_optimistic_match' };
  } else {
    // For messages from others, check for duplicates by content
    if (messageExistsByContent(messages, serverMessage)) {
      return { action: 'skip', reason: 'duplicate_content' };
    }

    return { action: 'append', reason: 'new_message' };
  }
}

/**
 * Apply a message action to the messages array
 *
 * @param {Array} messages - Current messages list
 * @param {Object} newMessage - New message to add
 * @param {Object} action - Action from determineMessageAction
 * @returns {Array} Updated messages list (new array, doesn't mutate original)
 */
export function applyMessageAction(messages, newMessage, action) {
  switch (action.action) {
    case 'ignore':
    case 'skip':
      return messages;

    case 'replace': {
      // CRITICAL SAFEGUARD: Double-check we're not removing a blocked message
      // Even though determineMessageAction should prevent this, add extra protection
      const messageToReplace = messages[action.removeIndex];
      if (
        messageToReplace &&
        (messageToReplace.isBlocked ||
          messageToReplace.status === 'blocked' ||
          messageToReplace.needsMediation)
      ) {
        if (import.meta.env.DEV) {
          console.error(
            '[applyMessageAction] BLOCKED: Attempted to replace blocked message - skipping replace:',
            {
              messageId: messageToReplace.id,
              text: messageToReplace.text?.substring(0, 30),
              action: action,
            }
          );
        }
        // Don't replace - just append the new message instead
        return [...messages, newMessage];
      }

      const result = [...messages];
      result.splice(action.removeIndex, 1);
      return [...result, newMessage];
    }

    case 'append':
      return [...messages, newMessage];

    default:
      return messages;
  }
}
