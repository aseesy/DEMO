/**
 * Contact Detection for AI Action Helper
 *
 * Pure and side-effect detection functions for contact mentions in messages.
 */

const contactIntelligence = require('../../src/core/intelligence/contactIntelligence');

const { defaultLogger: defaultLogger } = require('../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'contactDetection',
});

/**
 * Detect contact mentions in message text and generate contact suggestion with relationship
 * PURE FUNCTION: Only analyzes text, does not store or emit anything
 *
 * Uses detectContactMentions which detects both name AND relationship (unlike detectNamesInMessage)
 *
 * @param {Object} aiMediator - AI mediator service
 * @param {Object} context - Detection context
 * @param {string} context.text - Message text to analyze
 * @param {Array} context.existingContacts - User's existing contacts
 * @param {Array} context.participantUsernames - Room participant usernames
 * @param {Array} context.recentMessages - Recent conversation messages for context
 * @returns {Promise<Object|null>} Contact suggestion with relationship or null
 */
async function detectContactSuggestion(aiMediator, context) {
  const { text, existingContacts, participantUsernames, recentMessages = [] } = context;

  try {
    // Use detectContactMentions which detects both name AND relationship
    const detectionResult = await contactIntelligence.detectContactMentions(
      text,
      existingContacts,
      recentMessages,
      participantUsernames // Pass participant usernames to exclude them from detection
    );

    if (
      detectionResult &&
      detectionResult.detectedPeople &&
      detectionResult.detectedPeople.length > 0
    ) {
      // Get the first detected person (highest confidence)
      // Note: detectContactMentions returns relationships in display format:
      // "My Child", "My Co-Parent", "My Partner", "My Child's Teacher", "My Family", "My Friend", "Other"
      const detectedPerson = detectionResult.detectedPeople[0];
      const detectedName = detectedPerson.name;
      const detectedRelationship = detectedPerson.relationship; // Already in display format

      // Generate suggestion text
      const contactSuggestion = await aiMediator.generateContactSuggestion(detectedName, text);

      if (contactSuggestion) {
        // Include relationship in the suggestion (in display format, matches frontend dropdown options)
        return {
          ...contactSuggestion,
          detectedRelationship, // Will be pre-filled in contact form
        };
      }
    }
  } catch (err) {
    logger.error('Error detecting contact mentions', {
      err: err,
    });
  }
  return null;
}

/**
 * Detect names and store pending suggestion on socket
 * SIDE EFFECT: Mutates socket.data.pendingContactSuggestion
 *
 * @param {Object} socket - Socket.io connection (will be mutated)
 * @param {Object} aiMediator - AI mediator service
 * @param {Object} context - Detection context
 * @param {string} context.text - Message text to analyze
 * @param {Array} context.existingContacts - User's existing contacts
 * @param {Array} context.participantUsernames - Room participant usernames
 * @returns {Promise<Object|null>} Contact suggestion or null
 */
async function detectAndStorePendingSuggestion(socket, aiMediator, context) {
  const contactSuggestion = await detectContactSuggestion(aiMediator, context);

  if (contactSuggestion) {
    // SIDE EFFECT: Store on socket for later retrieval
    socket.data = socket.data || {};
    socket.data.pendingContactSuggestion = {
      detectedName: contactSuggestion.detectedName,
      detectedRelationship: contactSuggestion.detectedRelationship, // Store relationship
      messageContext: contactSuggestion.messageContext,
      timestamp: Date.now(),
    };
  }

  return contactSuggestion;
}

/**
 * @deprecated Use detectContactSuggestion() for pure detection
 * or detectAndStorePendingSuggestion() for detection with socket storage
 */
async function handleNameDetection(socket, aiMediator, context) {
  return detectAndStorePendingSuggestion(socket, aiMediator, context);
}

module.exports = {
  detectContactSuggestion,
  detectAndStorePendingSuggestion,
  handleNameDetection,
};
