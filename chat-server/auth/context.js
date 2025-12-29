/**
 * User Context and Room Setup
 */
const dbSafe = require('../dbSafe');
const roomManager = require('../roomManager');

async function setupUserContextAndRoom(userId, email, context) {
  try {
    // Get user email if not provided
    let userEmail = email;
    if (!userEmail) {
      const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
      if (users.length > 0) {
        userEmail = users[0].email;
      }
    }

    // Create user context record (using email instead of username)
    const userContextData = {
      user_email: userEmail,
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

    // Users should not have their own room - only shared rooms with co-parents
    // Personal rooms are no longer created during registration

    return { context: userContextData, room: null };
  } catch (error) {
    console.error('Error in setupUserContextAndRoom:', error);
      return { context: null, room: null };
  }
}

module.exports = { setupUserContextAndRoom };
