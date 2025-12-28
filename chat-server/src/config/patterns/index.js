/**
 * Pattern Configuration
 * 
 * Centralized pattern definitions for message analysis.
 * These patterns are used for quick local checks before full AI analysis.
 */

const { ALLOWED_GREETINGS } = require('./greetings');
const { ALLOWED_POLITE } = require('./polite-responses');
const { POLITE_REQUEST_PATTERNS } = require('./polite-requests');
const { POSITIVE_PATTERNS } = require('./positive-messages');

module.exports = {
  ALLOWED_GREETINGS,
  ALLOWED_POLITE,
  POLITE_REQUEST_PATTERNS,
  POSITIVE_PATTERNS,
};

