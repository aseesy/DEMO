/**
 * Contact Suggestion Business Logic (Decoupled from React)
 *
 * This module contains pure business logic functions that are completely
 * independent of React. They can be tested, reused, and understood without
 * any knowledge of React hooks or component lifecycle.
 *
 * This proves that our business logic is decoupled from the framework.
 */

/**
 * Detects the most recent contact suggestion from a list of messages
 *
 * @param {Array} messages - Array of message objects
 * @param {Object|null} currentSuggestion - Currently pending suggestion (if any)
 * @param {Set} dismissedIds - Set of suggestion IDs that have been dismissed
 * @returns {Object|null} The latest contact suggestion to show, or null
 */
export function detectContactSuggestion(messages, currentSuggestion, dismissedIds) {
  // Filter for contact suggestion messages
  const suggestions = messages.filter(msg => msg.type === 'contact_suggestion' && msg.detectedName);

  if (suggestions.length === 0) {
    return null;
  }

  // Get the most recent suggestion
  const latestSuggestion = suggestions[suggestions.length - 1];

  // Don't show if one is already showing
  if (currentSuggestion) {
    return null;
  }

  // Don't show if already dismissed
  if (dismissedIds.has(latestSuggestion.id)) {
    return null;
  }

  return latestSuggestion;
}

/**
 * Creates contact data structure for storage
 *
 * @param {Object} suggestion - Contact suggestion object
 * @param {string} suggestion.detectedName - The detected name
 * @param {string} suggestion.detectedRelationship - The detected relationship (in display format, e.g., "My Child", "My Co-Parent", "My Partner", etc.)
 * @param {string} suggestion.text - The suggestion text
 * @returns {Object} Contact data ready for storage
 */
export function createContactData(suggestion) {
  return {
    name: suggestion.detectedName,
    // Relationship is in display format (matches frontend dropdown options):
    // "My Child", "My Co-Parent", "My Partner", "My Child's Teacher", "My Family", "My Friend", "Other"
    relationship: suggestion.detectedRelationship || null,
    context: suggestion.text,
  };
}

/**
 * Determines if a suggestion should be tracked as dismissed
 *
 * @param {Object|null} suggestion - Contact suggestion object
 * @returns {boolean} True if suggestion has an ID and should be tracked
 */
export function shouldTrackDismissal(suggestion) {
  return !!(suggestion && suggestion.id != null);
}
