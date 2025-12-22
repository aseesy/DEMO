/**
 * Name Detector
 *
 * Detects person names in messages using AI.
 *
 * @module liaizen/core/ai/nameDetector
 */

const openaiClient = require('../client');
const { AI, VALIDATION } = require('../../../utils/constants');

/**
 * Detect names in a message using AI
 *
 * @param {string} text - Message text
 * @param {Array} existingContacts - Existing contact names
 * @param {Array} participantUsernames - Participant usernames
 * @returns {Promise<Array>} Detected new names
 */
async function detectNamesInMessage(text, existingContacts = [], participantUsernames = []) {
  if (!openaiClient.isConfigured()) {
    console.log('[NameDetector] OpenAI not configured, skipping');
    return [];
  }
  console.log('[NameDetector] Detecting names in:', text.substring(0, 100));

  try {
    const existingNames = [
      ...existingContacts.map(c => c.toLowerCase()),
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
    console.log('[NameDetector] OpenAI response:', response);
    if (response === 'NONE' || !response) {
      console.log('[NameDetector] No names found (NONE response)');
      return [];
    }

    const names = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== 'NONE')
      .filter(line => line.length > VALIDATION.MIN_MESSAGE_LENGTH && /^[A-Z]/.test(line));
    console.log('[NameDetector] Detected names after filtering:', names);
    return names;
  } catch (error) {
    console.error('[NameDetector] Error detecting names:', error.message);
    return [];
  }
}

module.exports = {
  detectNamesInMessage,
};
