/**
 * Response Parser
 *
 * Parses AI response JSON.
 *
 * @module liaizen/core/response/parser
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'responseParser' });

/**
 * Parse AI response JSON
 *
 * @param {string} responseText - Raw AI response
 * @returns {Object|null} Parsed response or null on error
 */
function parseResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    logger.error('Failed to parse AI response as JSON', {
      error: parseError.message,
      responsePreview: responseText?.substring(0, 200),
      responseLength: responseText?.length,
    });
    return null;
  }
}

/**
 * Extract action from parsed response
 *
 * @param {Object} result - Parsed AI response
 * @returns {string} Normalized action (STAY_SILENT, INTERVENE, COMMENT)
 */
function extractAction(result) {
  return (result?.action || 'STAY_SILENT').toUpperCase();
}

/**
 * Check if intervention has all required fields
 *
 * @param {Object} intervention - Intervention object
 * @returns {Object} { valid: boolean, missing: string[] }
 */
function validateInterventionFields(intervention) {
  // Removed 'insight' from required fields per user request
  const required = ['validation', 'rewrite1', 'rewrite2'];
  const missing = required.filter(field => !intervention?.[field]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

module.exports = {
  parseResponse,
  extractAction,
  validateInterventionFields,
};
