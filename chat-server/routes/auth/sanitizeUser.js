/**
 * User Response Sanitization
 * 
 * Returns a safe subset of user data for API responses.
 * Never includes: password_hash, tokens, internal IDs, sensitive context data.
 */

function sanitizeUserResponse(user) {
  if (!user) {
    return null;
  }

  // Return only safe, public-facing fields
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.display_name || null,
    firstName: user.firstName || user.first_name || null,
    lastName: user.lastName || user.last_name || null,
    // Include room info if present (public data)
    room: user.room ? {
      roomId: user.room.roomId || user.room.id,
      name: user.room.roomName || user.room.name,
    } : null,
    // Exclude: password_hash, context (private), google_id, oauth_provider, etc.
  };
}

module.exports = {
  sanitizeUserResponse,
};
