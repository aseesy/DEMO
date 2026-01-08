/**
 * Participant Context
 *
 * Gets user profiles for conversation participants.
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @module liaizen/core/contexts/participantContext
 */

const { defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({ module: 'participantContext' });

/**
 * Get profiles for all conversation participants
 *
 * @param {Array<string>} identifiers - Participant usernames or emails
 * @returns {Promise<Map>} Map of identifier -> profile
 */
async function getParticipantProfiles(identifiers) {
  const profiles = new Map();

  try {
    const dbSafe = require('../../../../dbSafe');

    for (const identifier of identifiers) {
      if (!identifier) continue;
      const normalized = identifier.toLowerCase();

      try {
        // Try email first (most common case - identifiers are usually emails)
        let userResult = await dbSafe.safeSelect('users', { email: normalized }, { limit: 1 });
        let users = dbSafe.parseResult(userResult);

        // Fall back to username if not found by email
        if (users.length === 0) {
          userResult = await dbSafe.safeSelect('users', { username: normalized }, { limit: 1 });
          users = dbSafe.parseResult(userResult);
        }

        if (users.length > 0) {
          // Normalize first_name to remove trailing whitespace
          const user = users[0];
          if (user.first_name) {
            user.first_name = user.first_name.trim();
          }
          profiles.set(normalized, user);
        }
      } catch (err) {
        logger.error('Error getting profile for participant', {
          identifier,
          error: err.message,
        });
      }
    }
  } catch (err) {
    logger.error('Error getting participant profiles', {
      error: err.message,
      identifierCount: identifiers.length,
    });
  }

  return profiles;
}

module.exports = {
  getParticipantProfiles,
  // Deprecated alias - use getParticipantProfiles instead
  fetchParticipantProfiles: getParticipantProfiles,
};
