/**
 * Data Transform Debug Utility
 *
 * Provides consistent debug logging for data transformations across the app.
 * Used for debugging relationship transformations, user data, and conversation data.
 *
 * Enable via environment variable: VITE_DEBUG_DATA_TRANSFORM=true
 */

const DEBUG_ENABLED =
  import.meta.env.VITE_DEBUG_DATA_TRANSFORM === 'true' || import.meta.env.DEV || false;

/**
 * Log data transformation details
 * @param {string} entityType - Type of entity being transformed (e.g., 'Contact', 'User', 'Conversation')
 * @param {Object} data - Transformation data to log
 * @param {Object} data.raw - Raw data from backend
 * @param {Object} data.transformed - Transformed data for display
 * @param {Object} data.metadata - Optional metadata (id, name, email, etc.)
 */
export function logDataTransform(entityType, { raw, transformed, metadata = {} }) {
  if (!DEBUG_ENABLED) return;

  const logData = {
    entityType,
    ...metadata,
    raw,
    transformed,
    timestamp: new Date().toISOString(),
  };

  console.log(`[DataTransform Debug: ${entityType}]`, logData);
}

/**
 * Log relationship transformation specifically
 * @param {string} entityType - Type of entity (e.g., 'Contact', 'User')
 * @param {Object} data - Relationship transformation data
 * @param {string} data.name - Entity name/identifier
 * @param {string} data.rawRelationship - Raw relationship from backend
 * @param {string} data.transformedRelationship - Transformed relationship for display
 * @param {Object} metadata - Additional metadata (id, email, etc.)
 */
export function logRelationshipTransform(
  entityType,
  { name, rawRelationship, transformedRelationship },
  metadata = {}
) {
  if (!DEBUG_ENABLED) return;

  logDataTransform(entityType, {
    raw: { relationship: rawRelationship },
    transformed: { relationship: transformedRelationship },
    metadata: {
      name,
      ...metadata,
    },
  });
}

/**
 * Log user data transformation
 * @param {Object} user - User data
 * @param {Object} transformed - Transformed user data
 */
export function logUserTransform(user, transformed) {
  logDataTransform('User', {
    raw: user,
    transformed,
    metadata: {
      id: user?.id,
      email: user?.email,
      username: user?.username,
    },
  });
}

/**
 * Log conversation/message data transformation
 * @param {Object} message - Message/conversation data
 * @param {Object} transformed - Transformed message data
 */
export function logConversationTransform(message, transformed) {
  logDataTransform('Conversation', {
    raw: message,
    transformed,
    metadata: {
      id: message?.id,
      type: message?.type,
      roomId: message?.room_id,
      threadId: message?.thread_id,
    },
  });
}

/**
 * Log contact data transformation
 * @param {Object} contact - Contact data
 * @param {Object} transformed - Transformed contact data
 */
export function logContactTransform(contact, transformed) {
  logRelationshipTransform(
    'Contact',
    {
      name: contact?.contact_name,
      rawRelationship: contact?.relationship,
      transformedRelationship: transformed?.relationship,
    },
    {
      id: contact?.id,
      email: contact?.contact_email || 'NULL',
    }
  );
}

export default {
  logDataTransform,
  logRelationshipTransform,
  logUserTransform,
  logConversationTransform,
  logContactTransform,
  DEBUG_ENABLED,
};
