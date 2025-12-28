/**
 * Shared Socket Helper Functions
 */

/**
 * Emit error to socket with consistent logging
 * @param {Object} socket - Socket.io socket instance
 * @param {string} message - User-facing error message
 * @param {Error|null} error - Optional error for logging
 * @param {string} context - Context string for logging
 */
function emitError(socket, message, error = null, context = '') {
  if (error) {
    console.error(`Error in ${context}:`, error);
  }
  socket.emit('error', { message });
}

/**
 * Get user display name: first_name > display_name > username
 */
async function getUserDisplayName(username, dbSafe) {
  try {
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    if (users.length > 0) {
      const user = users[0];
      return user.first_name || user.display_name || username;
    }
  } catch (err) {
    console.error(`Error getting display name for ${username}:`, err);
  }
  return username;
}

module.exports = {
  emitError,
  getUserDisplayName,
};
