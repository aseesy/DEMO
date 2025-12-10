// User Context Management
// Stores personal information about users for AI mediator context
// PostgreSQL-only

const dbPostgres = require('../../../dbPostgres');
const dbSafe = require('../../../dbSafe');

  console.log('📊 UserContext: Using PostgreSQL');

/**
 * Get user context by username
 * @param {string} username - The username
 * @returns {Promise<Object|null>} - User context or null if not found
 */
async function getUserContext(username) {
  try {
    // PostgreSQL-only: user_context.user_id is TEXT (username)
    const result = await dbPostgres.query('SELECT * FROM user_context WHERE user_id = $1', [username.toLowerCase()]);
      if (result.rowCount === 0) return null;

      const row = result.rows[0];
    // Handle JSONB fields that may be parsed or string
    const children = typeof row.children === 'string' ? JSON.parse(row.children) : (row.children || []);
    const contacts = typeof row.contacts === 'string' ? JSON.parse(row.contacts) : (row.contacts || []);
    
      return {
        username: row.user_id,
      co_parent: row.co_parent || null,
      children: children,
      contacts: contacts
      };
  } catch (err) {
    console.error('Error getting user context:', err);
    return null;
  }
}

/**
 * Set or update user context
 * @param {string} username - The username
 * @param {Object} context - User context data
 * @returns {Promise<Object>} - The saved context
 */
async function setUserContext(username, context) {
  const coParent = context.co_parent || context.coParentName;
  const children = context.children || [];
  const contacts = context.contacts || [];

  try {
    // PostgreSQL-only: user_context.user_id is TEXT (username)
      await dbPostgres.query(
        `INSERT INTO user_context (user_id, co_parent, children, contacts)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET
           co_parent = EXCLUDED.co_parent,
           children = EXCLUDED.children,
           contacts = EXCLUDED.contacts,
           updated_at = NOW()`,
      [username.toLowerCase(), coParent || null, JSON.stringify(children), JSON.stringify(contacts)]
    );

    return { username, co_parent: coParent, children, contacts };
  } catch (err) {
    console.error('Error setting user context:', err);
    throw err;
  }
}

/**
 * Update specific fields in user context
 * @param {string} username - The username
 * @param {Object} updates - Partial context updates
 * @returns {Promise<Object>} - The updated context
 */
async function updateUserContext(username, updates) {
  const current = await getUserContext(username) || {};
  const merged = { ...current, ...updates };
  return setUserContext(username, merged);
}

/**
 * Format user context for AI prompt
 * @param {string} username - The username
 * @param {Object} profileData - Optional user profile data
 * @returns {Promise<string>} - Formatted context string
 */
async function formatContextForAI(username, profileData = null) {
  const context = await getUserContext(username);

  // If profileData provided, use it; otherwise try to fetch from database
  let userProfile = profileData;
  if (!userProfile) {
    try {
      // PostgreSQL-only: use dbSafe to get user
      const users = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
      if (users.length > 0) {
        userProfile = users[0];
      }
    } catch (err) {
      console.error(`Error fetching profile for ${username}:`, err.message);
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
    const childrenInfo = context.children.map(child => {
      let info = child.name || 'Child';
      if (child.age) {
        info += ` (age ${child.age})`;
      }
      return info;
    }).join(', ');
    parts.push(`Shared custody of: ${childrenInfo}`);
  }

  // Contacts
  if (context?.contacts && context.contacts.length > 0) {
    const contactsInfo = context.contacts.map(c => `${c.name} (${c.relationship})`).join(', ');
    parts.push(`Other contacts: ${contactsInfo}`);
  }

  // Profile fields - Enhanced for better contextual awareness
  if (userProfile?.occupation) {
    // Include work schedule if available for scheduling context
    const workInfo = [userProfile.occupation];
    if (userProfile.work_schedule) {
      workInfo.push(`(${userProfile.work_schedule})`);
    }
    parts.push(`Occupation: ${workInfo.join(' ')}`);
  }
  
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

  return parts.length > 0
    ? `${username}${displayName.length > 0 ? ` (${displayName.join(' ')})` : ''}: ${parts.join('; ')}`
    : `No specific context available for ${username}.`;
}

module.exports = {
  getUserContext,
  setUserContext,
  updateUserContext,
  formatContextForAI
};
