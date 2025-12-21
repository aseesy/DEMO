/**
 * User Context and Room Setup
 */
const dbSafe = require('../dbSafe');
const roomManager = require('../roomManager');

async function setupUserContextAndRoom(userId, username, context) {
  try {
    // Create user context record
    const userContextData = {
      user_id: userId,
      co_parent: context.coParentName || null,
      children: context.children ? JSON.stringify(context.children) : null,
      contacts: context.contacts ? JSON.stringify(context.contacts) : null,
      triggers: context.triggers ? JSON.stringify(context.triggers) : null,
      updated_at: new Date().toISOString(),
    };

    await dbSafe.safeInsert('user_context', userContextData);

    // Update comprehensive profile fields in users table
    const userUpdates = {};
    if (context.communicationStyle) userUpdates.communication_style = context.communicationStyle;
    if (context.communicationTriggers)
      userUpdates.communication_triggers = context.communicationTriggers;
    if (context.communicationGoals) userUpdates.communication_goals = context.communicationGoals;
    if (context.coParentName) userUpdates.preferred_name = context.coParentName; // Optional: use as hint

    if (Object.keys(userUpdates).length > 0) {
      await dbSafe.safeUpdate('users', userUpdates, { id: userId });
    }

    // Create private room for user
    const room = await roomManager.createPrivateRoom(userId, username);

    return { context: userContextData, room };
  } catch (error) {
    console.error('Error in setupUserContextAndRoom:', error);
    // Still try to create room even if context fails
    try {
      const room = await roomManager.createPrivateRoom(userId, username);
      return { context: null, room };
    } catch (roomError) {
      console.error('Error creating room:', roomError);
      return { context: null, room: null };
    }
  }
}

module.exports = { setupUserContextAndRoom };
