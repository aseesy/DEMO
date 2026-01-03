/**
 * Quick check for direct hostility in message text
 * Used to prevent bypassing mediation for direct insults
 *
 * This is a lightweight check that uses the same patterns as AXIOM_D101
 * but doesn't require full code layer parsing
 */

const directInsult = require('../../src/core/engine/codeLayer/axioms/direct/directInsult');

/**
 * Check if message contains direct hostility
 * @param {string} messageText - Message text to check
 * @returns {boolean} - True if direct hostility detected
 */
function hasDirectHostility(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return false;
  }

  // Use the directInsult axiom's check function
  // Create a minimal parsed message object
  const parsed = {
    raw: messageText,
    text: messageText.toLowerCase().trim(),
  };

  const result = directInsult.check(parsed);

  // If axiom fired, message has direct hostility
  return result.fired === true;
}

module.exports = {
  hasDirectHostility,
};
