// User Context Management
// Stores personal information about users for AI mediator context
// PostgreSQL-only

const dbPostgres = require('../../../dbPostgres');
const dbSafe = require('../../../dbSafe');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'userContext',
});

logger.debug('📊 UserContext: Using PostgreSQL');

/**
 * Get user context by email
 * @param {string} email - The user's email
 * @returns {Promise<Object|null>} - User context or null if not found
 */
async function getUserContext(email) {
  try {
    const emailLower = email.trim().toLowerCase();
    // Use user_email instead of user_id (which stored username)
    const result = await dbPostgres.query('SELECT * FROM user_context WHERE user_email = $1', [
      emailLower,
    ]);
    if (result.rowCount === 0) return null;

    const row = result.rows[0];
    // Handle JSONB fields that may be parsed or string
    const children =
      typeof row.children === 'string' ? JSON.parse(row.children) : row.children || [];
    const contacts =
      typeof row.contacts === 'string' ? JSON.parse(row.contacts) : row.contacts || [];

    return {
      email: row.user_email,
      co_parent: row.co_parent || null,
      children: children,
      contacts: contacts,
    };
  } catch (err) {
    logger.error('Error getting user context', {
      err: err,
    });
    return null;
  }
}

/**
 * Set or update user context
 * @param {string} email - The user's email
 * @param {Object} context - User context data
 * @returns {Promise<Object>} - The saved context
 */
async function setUserContext(email, context) {
  const emailLower = email.trim().toLowerCase();
  const coParent = context.co_parent || context.coParentName;
  const children = context.children || [];
  const contacts = context.contacts || [];

  try {
    // Use user_email instead of user_id (which stored username)
    await dbPostgres.query(
      `INSERT INTO user_context (user_email, co_parent, children, contacts)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
         ON CONFLICT (user_email) DO UPDATE SET
           co_parent = EXCLUDED.co_parent,
           children = EXCLUDED.children,
           contacts = EXCLUDED.contacts,
           updated_at = NOW()`,
      [emailLower, coParent || null, JSON.stringify(children), JSON.stringify(contacts)]
    );

    return { email: emailLower, co_parent: coParent, children, contacts };
  } catch (err) {
    logger.error('Error setting user context', {
      err: err,
    });
    throw err;
  }
}

/**
 * Update specific fields in user context
 * @param {string} email - The user's email
 * @param {Object} updates - Partial context updates
 * @returns {Promise<Object>} - The updated context
 */
async function updateUserContext(email, updates) {
  const current = (await getUserContext(email)) || {};
  const merged = { ...current, ...updates };
  return setUserContext(email, merged);
}

/**
 * Format user context for AI prompt
 * @param {string} email - The user's email
 * @param {Object} profileData - Optional user profile data
 * @returns {Promise<string>} - Formatted context string
 */
async function formatContextForAI(email, profileData = null) {
  const emailLower = email.trim().toLowerCase();
  const context = await getUserContext(emailLower);

  // If profileData provided, use it; otherwise try to fetch from database
  let userProfile = profileData;
  if (!userProfile) {
    try {
      // Use email to get user
      const users = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
      if (users.length > 0) {
        userProfile = users[0];
      }
    } catch (err) {
      logger.error('Log message', {
        arg0: `Error getting profile for ${emailLower}:`,
        message: err.message,
      });
    }
  }

  const parts = [];

  // Name
  const displayName = [];
  if (userProfile?.first_name) displayName.push(userProfile.first_name);
  if (userProfile?.last_name) displayName.push(userProfile.last_name);
  if (displayName.length > 0) {
    parts.push(`Name: ${displayName.join(' ')}`);
  }

  // Co-parent
  if (context?.co_parent) {
    parts.push(`Co-parenting with: ${context.co_parent}`);
  }

  // Children
  if (context?.children && context.children.length > 0) {
    const childrenInfo = context.children
      .map(child => {
        let info = child.name || 'Child';
        if (child.age) {
          info += ` (age ${child.age})`;
        }
        return info;
      })
      .join(', ');
    parts.push(`Shared custody of: ${childrenInfo}`);
  }

  // Contacts
  if (context?.contacts && context.contacts.length > 0) {
    const contactsInfo = context.contacts.map(c => `${c.name} (${c.relationship})`).join(', ');
    parts.push(`Other contacts: ${contactsInfo}`);
  }

  // Profile fields - Enhanced for better contextual awareness
  if (userProfile?.communication_style) {
    parts.push(`Communication style: "${userProfile.communication_style}"`);
  }
  if (userProfile?.communication_triggers) {
    parts.push(`Communication triggers: "${userProfile.communication_triggers}"`);
  }
  if (userProfile?.communication_goals) {
    parts.push(`Communication goals: "${userProfile.communication_goals}"`);
  }

  // Additional context fields
  if (userProfile?.additional_context) {
    parts.push(`Additional context: "${userProfile.additional_context}"`);
  }

  if (userProfile?.address) {
    parts.push(`Location: ${userProfile.address}`);
  }

  // Household context (for understanding family dynamics)
  if (userProfile?.household_members) {
    parts.push(`Household: ${userProfile.household_members}`);
  }

  // Timezone for temporal awareness
  if (userProfile?.timezone) {
    parts.push(`Timezone: ${userProfile.timezone}`);
  }

  const userIdentifier = displayName.length > 0 ? displayName.join(' ') : emailLower;
  return parts.length > 0
    ? `${userIdentifier}: ${parts.join('; ')}`
    : `No specific context available for ${userIdentifier}.`;
}

module.exports = {
  getUserContext,
  setUserContext,
  updateUserContext,
  formatContextForAI,
};
