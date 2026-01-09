/**
 * Message Utility Functions
 *
 * Shared utilities for message processing:
 * - Date grouping and formatting
 * - Ownership detection
 * - Message filtering
 */

/**
 * Get formatted date label for a message
 * @param {Date|string|number} dateInput - Date to format
 * @param {DateFormatterCache} formatterCache - Cached formatters (optional)
 * @returns {string} Formatted date label
 */
export function formatMessageDate(dateInput, formatterCache = null) {
  const msgDate = new Date(dateInput);
  const isValidDate = !isNaN(msgDate.getTime());

  if (!isValidDate) {
    return 'Unknown Date';
  }

  const currentYear = new Date().getFullYear();
  const needsYear = msgDate.getFullYear() !== currentYear;

  // Use cache if provided, otherwise create new formatters
  let dateFormatter, dateFormatterWithYear;
  if (formatterCache) {
    dateFormatter = formatterCache.dateFormatter;
    dateFormatterWithYear = formatterCache.dateFormatterWithYear;
  } else {
    dateFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    dateFormatterWithYear = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return needsYear ? dateFormatterWithYear.format(msgDate) : dateFormatter.format(msgDate);
}

/**
 * Create formatter cache to reuse date formatters across renders
 * @returns {DateFormatterCache} Cached formatter objects
 */
export function createDateFormatterCache() {
  return {
    dateFormatter: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    dateFormatterWithYear: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

/**
 * Group messages by date
 * @param {Array} messages - Messages to group
 * @param {DateFormatterCache} formatterCache - Cached formatters (optional)
 * @returns {Array} Array of groups: [{ date: string, messages: Array }, ...]
 */
export function groupMessagesByDate(messages, formatterCache = null) {
  if (!messages || messages.length === 0) return [];

  // Filter out contact_suggestion messages
  const displayMessages = messages.filter(msg => msg.type !== 'contact_suggestion');
  if (displayMessages.length === 0) return [];

  const groups = [];
  let currentGroup = null;
  let currentDate = null;

  // Create formatter cache if not provided
  const cache = formatterCache || createDateFormatterCache();

  for (const msg of displayMessages) {
    const dateLabel = formatMessageDate(msg.created_at || msg.timestamp || Date.now(), cache);

    if (dateLabel !== currentDate) {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { date: dateLabel, messages: [] };
      currentDate = dateLabel;
    }

    currentGroup.messages.push(msg);
  }

  if (currentGroup) groups.push(currentGroup);
  return groups;
}

/**
 * Determine message ownership (whether message belongs to current user)
 * @param {Object} message - Message object
 * @param {string|number} currentUserId - Current user's ID
 * @returns {Object} { isOwn: boolean, messageUserId: string|number|null, senderDisplayName: string }
 */
export function detectMessageOwnership(message, currentUserId) {
  // UUID-based ownership detection (primary method)
  // Messages should have sender.uuid or sender_id from the server
  const messageUserId =
    message.sender?.uuid || message.sender?.id || message.sender_id || message.user_id;

  // Compare UUIDs/IDs (convert to string for safe comparison)
  const isOwn = currentUserId && messageUserId && String(currentUserId) === String(messageUserId);

  // Get display name - prefer first_name, fallback to email
  const senderDisplayName = message.sender?.first_name || message.sender?.email || 'Unknown';

  return {
    isOwn,
    messageUserId,
    senderDisplayName,
  };
}

/**
 * Check if message is from LiaiZen (AI/system)
 * @param {Object} message - Message object
 * @returns {boolean} True if message is from LiaiZen
 */
export function isAIMessage(message) {
  // Check various ways a message might be from LiaiZen
  return (
    message.isAI ||
    message.type === 'system' ||
    message.sender?.email === 'LiaiZen' ||
    message.sender?.email === 'system@liaizen.app' ||
    message.user_email === 'system@liaizen.app'
  );
}
