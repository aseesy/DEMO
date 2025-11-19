// User Context Management
// Stores personal information about users for AI mediator context

const userContexts = new Map(); // username -> user context object

/**
 * Get user context by username
 * @param {string} username - The username
 * @returns {Object|null} - User context or null if not found
 */
function getUserContext(username) {
  return userContexts.get(username.toLowerCase()) || null;
}

/**
 * Set or update user context
 * @param {string} username - The username
 * @param {Object} context - User context data
 * @returns {Object} - The saved context
 */
function setUserContext(username, context) {
  const usernameKey = username.toLowerCase();
  const existing = userContexts.get(usernameKey) || {};
  
  const updatedContext = {
    ...existing,
    ...context,
    updatedAt: new Date().toISOString(),
    username: username // Preserve original username case
  };
  
  userContexts.set(usernameKey, updatedContext);
  return updatedContext;
}

/**
 * Update specific fields in user context
 * @param {string} username - The username
 * @param {Object} updates - Partial context updates
 * @returns {Object} - The updated context
 */
function updateUserContext(username, updates) {
  const usernameKey = username.toLowerCase();
  const existing = userContexts.get(usernameKey) || { username };
  
  const updatedContext = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  userContexts.set(usernameKey, updatedContext);
  return updatedContext;
}

/**
 * Get all user contexts (for admin/debugging)
 * @returns {Object} - Map of all contexts
 */
function getAllContexts() {
  return Object.fromEntries(userContexts);
}

/**
 * Delete user context
 * @param {string} username - The username
 * @returns {boolean} - True if deleted, false if not found
 */
function deleteUserContext(username) {
  return userContexts.delete(username.toLowerCase());
}

/**
 * Format user context for AI prompt
 * @param {string} username - The username
 * @param {Object} profileData - Optional user profile data from database
 * @returns {string} - Formatted context string
 */
async function formatContextForAI(username, profileData = null) {
  const context = getUserContext(username);
  
  // If profileData provided, use it; otherwise try to fetch from database
  let userProfile = profileData;
  if (!userProfile) {
    try {
      const db = require('./db');
      const dbSafe = require('./dbSafe');
      const dbInstance = await db.getDb();
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
  
  // Name (from profile)
  const displayName = [];
  if (userProfile?.first_name) displayName.push(userProfile.first_name);
  if (userProfile?.last_name) displayName.push(userProfile.last_name);
  if (displayName.length > 0) {
    parts.push(`Name: ${displayName.join(' ')}`);
  }
  
  // Co-parent name
  if (context?.coParentName) {
    parts.push(`Co-parenting with: ${context.coParentName}`);
  }
  
  // Separation date
  if (context?.separationDate) {
    parts.push(`Separation/Living apart since: ${context.separationDate}`);
  }
  
  // Children
  if (context?.children && context.children.length > 0) {
    const childrenInfo = context.children.map(child => {
      let info = child.name || 'Child';
      if (child.birthday) {
        info += ` (born ${child.birthday})`;
      }
      return info;
    }).join(', ');
    parts.push(`Shared custody of: ${childrenInfo}`);
  }
  
  // Parenting philosophy (from profile)
  if (userProfile?.parenting_philosophy) {
    parts.push(`Parenting philosophy: "${userProfile.parenting_philosophy}"`);
  }
  
  // Occupation (from profile) - useful for scheduling context
  if (userProfile?.occupation) {
    parts.push(`Occupation: ${userProfile.occupation}`);
  }
  
  // Address (from profile) - useful for location context
  if (userProfile?.address) {
    parts.push(`Location: ${userProfile.address}`);
  }
  
  // Personal growth goals (from profile)
  if (userProfile?.personal_growth) {
    parts.push(`Personal growth focus: ${userProfile.personal_growth}`);
  }
  
  // Concerns
  if (context?.concerns && context.concerns.length > 0) {
    parts.push(`Concerns: ${context.concerns.join(', ')}`);
  }
  
  // New partner
  if (context?.newPartner) {
    let partnerInfo = `New partner: ${context.newPartner.name || 'Unknown'}`;
    if (context.newPartner.livesWith !== undefined) {
      partnerInfo += context.newPartner.livesWith ? ' (lives with them)' : ' (does not live with them)';
    }
    parts.push(partnerInfo);
  }
  
  return parts.length > 0 
    ? `${username}${displayName.length > 0 ? ` (${displayName.join(' ')})` : ''}: ${parts.join('; ')}`
    : `No specific context available for ${username}.`;
}

/**
 * Format user context for AI prompt (synchronous version for backward compatibility)
 * @param {string} username - The username
 * @returns {string} - Formatted context string
 */
function formatContextForAISync(username) {
  const context = getUserContext(username);
  if (!context) {
    return `No context available for ${username}.`;
  }

  const parts = [];
  
  // Co-parent name
  if (context.coParentName) {
    parts.push(`Co-parenting with: ${context.coParentName}`);
  }
  
  // Separation date
  if (context.separationDate) {
    parts.push(`Separation/Living apart since: ${context.separationDate}`);
  }
  
  // Children
  if (context.children && context.children.length > 0) {
    const childrenInfo = context.children.map(child => {
      let info = child.name || 'Child';
      if (child.birthday) {
        info += ` (born ${child.birthday})`;
      }
      return info;
    }).join(', ');
    parts.push(`Shared custody of: ${childrenInfo}`);
  }
  
  // Concerns
  if (context.concerns && context.concerns.length > 0) {
    parts.push(`Concerns: ${context.concerns.join(', ')}`);
  }
  
  // New partner
  if (context.newPartner) {
    let partnerInfo = `New partner: ${context.newPartner.name || 'Unknown'}`;
    if (context.newPartner.livesWith !== undefined) {
      partnerInfo += context.newPartner.livesWith ? ' (lives with them)' : ' (does not live with them)';
    }
    parts.push(partnerInfo);
  }
  
  return parts.length > 0 
    ? `${username}'s context: ${parts.join('; ')}`
    : `No specific context available for ${username}.`;
}

module.exports = {
  getUserContext,
  setUserContext,
  updateUserContext,
  getAllContexts,
  deleteUserContext,
  formatContextForAI,
  formatContextForAISync // Backward compatibility
};

