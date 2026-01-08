/**
 * OAuth Management Logic
 * 
 * Updated to use auth_identities table (Phase 2).
 * Maintains backwards compatibility with legacy google_id field.
 */
const dbSafe = require('../dbSafe');
const { getUser, createUser } = require('./user');
const { AuthIdentityService } = require('../src/services/auth/authIdentityService');

const authIdentityService = new AuthIdentityService();

/**
 * Get or create Google user using auth_identities table
 * @param {string} googleSub - Google 'sub' identifier
 * @param {string} email - User email
 * @param {string} name - User full name
 * @param {string} picture - Profile picture URL
 * @param {boolean} emailVerified - Whether email is verified
 * @returns {Promise<Object>} User object
 */
async function getOrCreateGoogleUser(googleSub, email, name, picture = null, emailVerified = true) {
  if (!email) {
    throw new Error('Email is required for OAuth user creation');
  }

  if (!googleSub) {
    throw new Error('Google sub is required');
  }

  // Try to find existing identity
  const existingIdentity = await authIdentityService.findByIdentity('google', googleSub);

  if (existingIdentity) {
    // Identity exists - get user by ID and update last_login
    const userResult = await dbSafe.safeSelect('users', { id: existingIdentity.user_id }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    if (users.length > 0) {
      const user = users[0];
      // Get full user object with context using getUser (requires email)
      const fullUser = await getUser(existingIdentity.provider_email || user.email);
      if (fullUser) {
        await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: fullUser.id });
        // Update email verification status if changed
        if (existingIdentity.email_verified !== emailVerified) {
          await authIdentityService.updateEmailVerification(existingIdentity.id, emailVerified);
        }
        return fullUser;
      }
    }
  }

  // No identity found - check if user exists by email
  const emailLower = email.trim().toLowerCase();
  const emailUserResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const emailUsers = dbSafe.parseResult(emailUserResult);

  if (emailUsers.length > 0) {
    // User exists - link Google identity to existing user
    const user = emailUsers[0];
    await authIdentityService.linkIdentityToUser(
      user.id,
      'google',
      googleSub,
      email,
      emailVerified
    );
    await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });
    
    // Update user email_verified status if needed
    if (emailVerified && !user.email_verified) {
      await dbSafe.safeUpdate('users', { email_verified: true }, { id: user.id });
    }
    
    return await getUser(user.email);
  }

  // Create new user with email (no username needed)
  // Parse Google name into first_name and last_name
  let firstName = '';
  let lastName = '';
  let displayName = name || '';

  if (name) {
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 1) {
      firstName = nameParts[0];
    } else if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }
  }

  // Create user (legacy createUser function still writes google_id to users table for backwards compatibility)
  // Migration 051 will automatically create auth_identity entry, but we create it explicitly here for consistency
  const user = await createUser(email, null, {}, googleSub, 'google', {
    firstName: firstName || null,
    lastName: lastName || null,
    displayName: displayName || null,
  });

  // Create auth identity entry (migration handles existing data, but new users need explicit entry)
  await authIdentityService.findOrCreateIdentity({
    provider: 'google',
    providerSubject: googleSub,
    userId: user.id,
    providerEmail: email,
    emailVerified: emailVerified,
  });

  // Update user email_verified status
  if (emailVerified && !user.email_verified) {
    await dbSafe.safeUpdate('users', { email_verified: true }, { id: user.id });
  }

  return user;
}

/**
 * Get user by Google ID (using auth_identities table)
 * @param {string} googleSub - Google 'sub' identifier
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByGoogleId(googleSub) {
  const user = await authIdentityService.findUserByIdentity('google', googleSub);
  if (!user) {
    return null;
  }
  return await getUser(user.email);
}

module.exports = {
  getOrCreateGoogleUser,
  getUserByGoogleId,
};

