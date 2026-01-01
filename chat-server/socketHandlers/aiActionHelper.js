/**
 * AI Action Helpers for Socket Messages
 *
 * Modular entry point - re-exports from submodules for backward compatibility.
 *
 * Submodules:
 * - contactDetection.js: Name detection and contact suggestions
 * - interventionProcessing.js: AI intervention (coaching moment) handling
 * - messageApproval.js: Approved message processing and broadcasting
 * - aiFailure.js: Graceful AI failure handling
 */

const { detectContactSuggestion, detectAndStorePendingSuggestion, handleNameDetection } = require('./aiActionHelper/contactDetection');
const { processIntervention } = require('./aiActionHelper/interventionProcessing');
const { processApprovedMessage } = require('./aiActionHelper/messageApproval');
const { handleAiFailure } = require('./aiActionHelper/aiFailure');

module.exports = {
  // Contact Detection
  detectContactSuggestion,
  detectAndStorePendingSuggestion,
  handleNameDetection, // @deprecated - use detectAndStorePendingSuggestion

  // Intervention Processing
  processIntervention,

  // Message Approval
  processApprovedMessage,

  // Failure Handling
  handleAiFailure,
};
