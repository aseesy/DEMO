/**
 * Authentication Logic (Login, Password Verification)
 */
const crypto = require('crypto');
const dbSafe = require('../dbSafe');
const roomManager = require('../roomManager');
const { comparePassword, hashPassword } = require('./utils');

async function authenticateUserByEmail(email, password) {
  console.log(`Attempting login for email: ${email}`);
  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);

  if (users.length === 0) {
    const error = new Error('Account not found');
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  const user = users[0];
  if (!user.password_hash) {
    const error = new Error('This account uses Google sign-in. Please sign in with Google.');
    error.code = 'OAUTH_ONLY_ACCOUNT';
    throw error;
  }

  const isBcryptHash = /^\$2[ayb]\$/.test(user.password_hash);
  let isValid = false;

  if (isBcryptHash) {
    isValid = await comparePassword(password, user.password_hash);
  } else {
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    if (sha256Hash === user.password_hash) {
      isValid = true;
      const newBcryptHash = await hashPassword(password);
      await dbSafe.safeUpdate('users', { password_hash: newBcryptHash }, { id: user.id });
    }
  }

  if (!isValid) {
    const error = new Error('Invalid password');
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

  // Use email-based user context
  const { getUserContext: getUserContextByEmail } = require('../src/core/profiles/userContext');
  const context = await getUserContextByEmail(user.email);
  const room = await roomManager.getUserRoom(user.id);

  return { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, displayName: user.display_name || user.first_name || user.email, context, room };
}

/**
 * @deprecated Use authenticateUserByEmail instead
 * Legacy function kept for backward compatibility - redirects to email-based auth
 */
async function authenticateUser(username, password) {
  // MIGRATION: Username-based auth is deprecated
  // Try to find user by username and get their email, then use email-based auth
  console.warn('[DEPRECATED] authenticateUser called with username - use authenticateUserByEmail instead');

  const result = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
  const users = dbSafe.parseResult(result);

  if (users.length === 0) {
    const error = new Error('Account not found');
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  // Redirect to email-based authentication
  return authenticateUserByEmail(users[0].email, password);
}

/**
 * Get user context data from database (DEPRECATED - use getUserContext from userContext.js with email instead)
 * NAMING: Using `get*` for consistency with codebase data retrieval convention.
 */
async function getUserContext(userId) {
  const result = await dbSafe.safeSelect('user_context', { user_id: String(userId) }, { limit: 1 });
  const rows = dbSafe.parseResult(result);

  const defaultContext = {
    coParentName: '',
    children: [],
    concerns: [],
    newPartner: { name: '', livesWith: false },
  };

  if (rows.length > 0) {
    const data = rows[0];
    try {
      return {
        coParentName: data.co_parent || '',
        children:
          typeof data.children === 'string' ? JSON.parse(data.children) : data.children || [],
        concerns:
          typeof data.contacts === 'string' ? JSON.parse(data.contacts) : data.contacts || [],
        newPartner: { name: '', livesWith: false },
      };
    } catch (err) {
      console.error('Error parsing user context:', err);
    }
  }
  return defaultContext;
}

module.exports = {
  authenticateUser,
  authenticateUserByEmail,
};
