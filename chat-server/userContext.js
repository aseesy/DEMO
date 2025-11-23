// User Context Management
// Stores personal information about users for AI mediator context
// Supports both PostgreSQL (production) and SQLite (dev/fallback)

const dbPostgres = require('./dbPostgres');
const dbSqlite = require('./db');
const dbSafe = require('./dbSafe');

// Check if Postgres is configured
const usePostgres = !!process.env.DATABASE_URL;

/**
 * Get user context by username
 * @param {string} username - The username
 * @returns {Promise<Object|null>} - User context or null if not found
 */
async function getUserContext(username) {
  try {
    if (usePostgres) {
      const result = await dbPostgres.query('SELECT * FROM user_context WHERE user_id = $1', [username]);
      if (result.rowCount === 0) return null;

      const row = result.rows[0];
      return {
        username: row.user_id,
        co_parent: row.co_parent,
        children: row.children || [],
        contacts: row.contacts || []
      };
    } else {
      // SQLite fallback
      // Need to get user ID from username first
      const userResult = await dbSafe.safeSelect('users', { username }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
      if (users.length === 0) return null;

      const userId = users[0].id;
      const contextResult = await dbSafe.safeSelect('user_context', { user_id: userId }, { limit: 1 });
      const contexts = dbSafe.parseResult(contextResult);

      if (contexts.length === 0) return null;

      const row = contexts[0];
      return {
        username: username,
        co_parent: row.co_parent_name,
        children: row.children ? JSON.parse(row.children) : [],
        contacts: row.contacts ? JSON.parse(row.contacts) : []
      };
    }
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
    if (usePostgres) {
      await dbPostgres.query(
        `INSERT INTO user_context (user_id, co_parent, children, contacts)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET
           co_parent = EXCLUDED.co_parent,
           children = EXCLUDED.children,
           contacts = EXCLUDED.contacts,
           updated_at = NOW()`,
        [username, coParent || null, children, contacts]
      );
    } else {
      // SQLite fallback
      const db = await dbSqlite.getDb();

      // Get user ID
      const userResult = await dbSafe.safeSelect('users', { username }, { limit: 1 });
      let users = dbSafe.parseResult(userResult);
      let userId;

      if (users.length === 0) {
        // Create user if not exists (might happen if context is set before login? unlikely but possible in dev)
        // Actually, we should probably error if user doesn't exist, but for now let's assume they do or we can't link.
        console.error(`User ${username} not found for setting context`);
        throw new Error('User not found');
      } else {
        userId = users[0].id;
      }

      // Check if context exists
      const contextResult = await dbSafe.safeSelect('user_context', { user_id: userId }, { limit: 1 });
      const contexts = dbSafe.parseResult(contextResult);

      const childrenJson = JSON.stringify(children);
      const contactsJson = JSON.stringify(contacts);
      const now = new Date().toISOString();

      if (contexts.length > 0) {
        // Update
        await dbSafe.safeUpdate('user_context',
          { user_id: userId },
          {
            co_parent_name: coParent,
            children: childrenJson,
            contacts: contactsJson,
            updated_at: now
          }
        );
      } else {
        // Insert
        await dbSafe.safeInsert('user_context', {
          user_id: userId,
          co_parent_name: coParent,
          children: childrenJson,
          contacts: contactsJson,
          updated_at: now
        });
      }

      // Save DB to file
      dbSqlite.saveDatabase();
    }

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
      const db = await dbSqlite.getDb();
      const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
      const users = dbSafe.parseResult(userResult);
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

  // Profile fields
  if (userProfile?.parenting_philosophy) {
    parts.push(`Parenting philosophy: "${userProfile.parenting_philosophy}"`);
  }
  if (userProfile?.occupation) {
    parts.push(`Occupation: ${userProfile.occupation}`);
  }
  if (userProfile?.address) {
    parts.push(`Location: ${userProfile.address}`);
  }
  if (userProfile?.personal_growth) {
    parts.push(`Personal growth focus: ${userProfile.personal_growth}`);
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
