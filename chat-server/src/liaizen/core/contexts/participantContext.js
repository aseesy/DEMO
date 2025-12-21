/**
 * Participant Context
 *
 * Gets user profiles for conversation participants.
 *
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 *
 * @module liaizen/core/contexts/participantContext
 */

/**
 * Get profiles for all conversation participants
 *
 * @param {Array<string>} usernames - Participant usernames
 * @returns {Promise<Map>} Map of username -> profile
 */
async function getParticipantProfiles(usernames) {
  const profiles = new Map();

  try {
    const dbSafe = require('../../../../dbSafe');

    for (const username of usernames) {
      try {
        const userResult = await dbSafe.safeSelect(
          'users',
          { username: username.toLowerCase() },
          { limit: 1 }
        );
        const users = dbSafe.parseResult(userResult);
        if (users.length > 0) {
          profiles.set(username.toLowerCase(), users[0]);
        }
      } catch (err) {
        console.error(`Error getting profile for ${username}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error getting participant profiles:', err.message);
  }

  return profiles;
}

module.exports = {
  getParticipantProfiles,
  // Deprecated alias - use getParticipantProfiles instead
  fetchParticipantProfiles: getParticipantProfiles,
};
