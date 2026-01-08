/**
 * Name Detector
 *
 * Detects person names in messages using regex (default) or AI (fallback).
 * Regex-based detection is faster and cheaper, with LLM as optional fallback.
 *
 * @module liaizen/core/ai/nameDetector
 */

const openaiClient = require('../client');
const { AI, VALIDATION } = require('../../../infrastructure/config/constants');
const { isEnabled } = require('../../../infrastructure/config/featureFlags');
const { defaultLogger } = require('../../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'nameDetector' });

// Common words that look like names but aren't
const COMMON_WORDS = new Set([
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'you',
  'all',
  'can',
  'her',
  'was',
  'one',
  'our',
  'out',
  'day',
  'get',
  'has',
  'him',
  'his',
  'how',
  'its',
  'may',
  'new',
  'now',
  'old',
  'see',
  'two',
  'way',
  'who',
  'boy',
  'did',
  'let',
  'put',
  'say',
  'she',
  'too',
  'use',
  'mom',
  'dad',
  'yes',
  'no',
  'ok',
  'okay',
  'hey',
  'hi',
  'bye',
  'thanks',
  'thank',
  'please',
  'sorry',
  'sure',
  'well',
  'good',
  'bad',
  'fine',
  'great',
  'nice',
  'cool',
  'okay',
  'maybe',
  'sure',
  'right',
  'left',
  'here',
  'there',
  'where',
  'when',
  'what',
  'why',
  'how',
  'this',
  'that',
  'then',
  'than',
  'them',
  'they',
  'their',
  'there',
  'these',
  'those',
  'which',
  'while',
  'where',
]);

// Months and days that might be capitalized
const TIME_WORDS = new Set([
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

/**
 * Simple regex-based name detection
 * Matches capitalized words that look like names
 *
 * @param {string} text - Message text
 * @param {Array} existingContacts - Existing contact names
 * @param {Array} participantUsernames - Participant usernames
 * @returns {Array} Detected new names
 */
function detectNamesWithRegex(text, existingContacts = [], participantUsernames = []) {
  const existingNames = new Set([
    ...existingContacts.map(c => (c.name || c).toLowerCase()),
    ...participantUsernames.map(u => u.toLowerCase()),
  ]);

  // Pattern: Capitalized word(s) - matches "John", "Mary Jane", "Dr. Smith"
  // Excludes words at start of sentence (common false positives)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const matches = text.match(namePattern) || [];

  const detectedNames = matches
    .map(name => name.trim())
    .filter(name => {
      const lower = name.toLowerCase();

      // Exclude common words
      if (COMMON_WORDS.has(lower)) return false;

      // Exclude time words
      if (TIME_WORDS.has(lower)) return false;

      // Exclude existing contacts/participants
      if (existingNames.has(lower)) return false;

      // Must be 2+ characters
      if (name.length < 2) return false;

      // Exclude if it's a date/time pattern (numbers)
      if (/^\d/.test(name)) return false;

      // Exclude single letters
      if (name.length === 1) return false;

      // Exclude if it contains only common words (e.g., "The", "And")
      const words = name.split(/\s+/);
      if (words.length > 1 && words.every(w => COMMON_WORDS.has(w.toLowerCase()))) {
        return false;
      }

      return true;
    })
    .filter((name, index, arr) => arr.indexOf(name) === index); // Unique

  return detectedNames;
}

/**
 * Detect names using LLM (fallback method)
 * Only used if AI_NAME_DETECTION feature flag is enabled
 *
 * @param {string} text - Message text
 * @param {Array} existingContacts - Existing contact names
 * @param {Array} participantUsernames - Participant usernames
 * @returns {Promise<Array>} Detected new names
 */
async function detectNamesWithLLM(text, existingContacts = [], participantUsernames = []) {
  if (!openaiClient.isConfigured()) {
    logger.debug('OpenAI not configured, skipping LLM name detection');
    return [];
  }

  logger.debug('Using LLM for name detection', { textPreview: text.substring(0, 100) });

  try {
    const existingNames = [
      ...existingContacts.map(c => (c.name || c).toLowerCase()),
      ...participantUsernames.map(u => u.toLowerCase()),
    ];
    const existingNamesString =
      existingNames.length > 0
        ? `\n\nExisting contacts/participants to EXCLUDE: ${existingNames.join(', ')}`
        : '';

    const prompt = `Extract NEW person names from this message (not already in contacts).

Message: "${text}"${existingNamesString}

Return ONLY names, one per line, or "NONE" if no new names found.`;

    const completion = await openaiClient.createChatCompletion({
      model: AI.NAME_DETECTION_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Extract proper names of NEW people. Return one name per line, or "NONE".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: AI.NAME_DETECTION_MAX_TOKENS,
      temperature: AI.NAME_DETECTION_TEMPERATURE,
    });

    const response = completion.choices[0].message.content.trim();
    logger.debug('LLM name detection response', { response });

    if (response === 'NONE' || !response) {
      logger.debug('No names found via LLM');
      return [];
    }

    const names = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'NONE')
      .filter(line => line.length >= VALIDATION.MIN_USERNAME_LENGTH && /^[A-Z]/.test(line));

    logger.debug('Names detected via LLM', { names, count: names.length });
    return names;
  } catch (error) {
    logger.error('Error detecting names with LLM', {
      error: error.message,
      stack: error.stack,
    });
    return [];
  }
}

/**
 * Detect names in a message
 * Uses regex by default, falls back to LLM if feature flag enabled
 *
 * @param {string} text - Message text
 * @param {Array} existingContacts - Existing contact names
 * @param {Array} participantUsernames - Participant usernames
 * @returns {Promise<Array>} Detected new names
 */
async function detectNamesInMessage(text, existingContacts = [], participantUsernames = []) {
  // Use regex by default (fast, free)
  const regexNames = detectNamesWithRegex(text, existingContacts, participantUsernames);

  logger.debug('Name detection complete', {
    method: 'regex',
    namesFound: regexNames.length,
    names: regexNames,
  });

  // If AI name detection is enabled, use LLM as fallback/validation
  // This allows A/B testing regex vs LLM accuracy
  if (isEnabled('AI_NAME_DETECTION')) {
    const llmNames = await detectNamesWithLLM(text, existingContacts, participantUsernames);

    // Merge results (LLM might catch names regex missed)
    const allNames = [...new Set([...regexNames, ...llmNames])];

    logger.debug('Name detection with LLM fallback', {
      regexCount: regexNames.length,
      llmCount: llmNames.length,
      totalCount: allNames.length,
    });

    return allNames;
  }

  return regexNames;
}

module.exports = {
  detectNamesInMessage,
};
