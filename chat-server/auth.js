const bcrypt = require('bcrypt');
const roomManager = require('./roomManager');
const dbSafe = require('./dbSafe');
const invitationManager = require('./libs/invitation-manager');
const notificationManager = require('./libs/notification-manager');

// ============================================================================
// ERROR CODES for Registration
// ============================================================================

const RegistrationError = {
  EMAIL_EXISTS: { code: 'REG_001', message: 'Email already exists' },
  INVALID_TOKEN: { code: 'REG_002', message: 'Invalid invitation token' },
  EXPIRED: { code: 'REG_003', message: 'Invitation has expired' },
  ALREADY_ACCEPTED: { code: 'REG_004', message: 'Invitation already accepted' },
  ROOM_FAILED: { code: 'REG_005', message: 'Could not create chat room' },
  CONTACT_FAILED: { code: 'REG_006', message: 'Could not create contacts' },
  DATABASE_ERROR: { code: 'REG_007', message: 'Database error occurred' },
  INVITER_GONE: { code: 'REG_008', message: 'Inviter account no longer exists' },
  USERNAME_FAILED: { code: 'REG_009', message: 'Could not generate unique username' },
};

/**
 * Create a structured registration error
 * @param {Object} errorType - Error type from RegistrationError
 * @param {string} [details] - Additional details
 * @returns {Error} Error with code and details
 */
function createRegistrationError(errorType, details = null) {
  const error = new Error(errorType.message);
  error.code = errorType.code;
  error.details = details;
  return error;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with a hash
 */
async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
}

// Database access is now handled through dbSafe (PostgreSQL only)

/**
 * Generate a random suffix for username disambiguation
 * Uses alphanumeric characters that are easy to read
 */
function generateUsernameSuffix() {
  // Use chars that are unambiguous (no 0/O, 1/l confusion)
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return suffix;
}

/**
 * Create a new user account with email (auto-generates username from email)
 *
 * ATOMIC: Uses insert-with-retry to handle username conflicts safely.
 * If two users sign up simultaneously with the same email prefix,
 * only one will succeed with the base username, the other gets a suffix.
 */
async function createUserWithEmail(email, password, context = {}, googleId = null, oauthProvider = null, nameData = {}) {
  const emailLower = email.trim().toLowerCase();

  // Check if email already exists (fast fail)
  const emailExists = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (emailExists.length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  // If googleId provided, check if Google account already exists
  if (googleId) {
    const googleUserExists = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
    if (googleUserExists.length > 0) {
      throw new Error('Google account already registered');
    }
  }

  // Generate base username from email (part before @)
  let baseUsername = emailLower.split('@')[0];
  // Remove non-alphanumeric characters and limit length
  baseUsername = baseUsername.replace(/[^a-z0-9]/g, '').substring(0, 12);
  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = 'user';
  }

  const now = new Date().toISOString();

  // Build user data
  const userData = {
    email: emailLower,
    created_at: now,
    first_name: nameData.firstName || null,
    last_name: nameData.lastName || null,
    display_name: nameData.displayName || (nameData.firstName ? `${nameData.firstName} ${nameData.lastName || ''}`.trim() : null)
  };

  // Hash password if provided (not required for OAuth users)
  if (password) {
    userData.password_hash = await hashPassword(password);
  }

  if (googleId) {
    userData.google_id = googleId;
  }

  if (oauthProvider) {
    userData.oauth_provider = oauthProvider;
  }

  // ATOMIC USERNAME GENERATION WITH RETRY
  // Try to insert with increasing username variations until successful
  let username = baseUsername;
  let userId = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      userData.username = username;

      // Attempt insert - will throw if username constraint violated
      userId = await dbSafe.safeInsert('users', userData);

      // Success! Verify we got a valid ID
      if (!userId || userId === 0) {
        // Query to get actual ID (edge case for some PostgreSQL configs)
        const insertedUsers = await dbSafe.safeSelect('users', { username: username }, { limit: 1 });
        if (insertedUsers.length > 0) {
          userId = insertedUsers[0].id;
        } else {
          throw new Error('Failed to create user - could not retrieve user ID');
        }
      }

      break; // Success - exit loop

    } catch (err) {
      // Check if it's a unique constraint violation on username
      // PostgreSQL error code 23505 = unique_violation
      if (err.code === '23505' && err.constraint?.includes('username')) {
        attempts++;
        // Generate new username with random suffix
        username = `${baseUsername}${generateUsernameSuffix()}`.substring(0, 20);
        console.log(`⚠️ Username conflict, trying: ${username} (attempt ${attempts})`);
      } else {
        // Different error - rethrow
        throw err;
      }
    }
  }

  if (!userId) {
    throw createRegistrationError(RegistrationError.USERNAME_FAILED);
  }

  console.log(`✅ Created user ${userId} with username ${username}`);

  // Continue with context and room creation (non-atomic, but user exists)
  await setupUserContextAndRoom(userId, username, context);

  return {
    id: userId,
    username: username,
    email: emailLower,
    context: context,
    firstName: userData.first_name,
    lastName: userData.last_name,
    displayName: userData.display_name
  };
}

/**
 * Setup user context and private room after user creation
 * Separated from user creation to keep the atomic insert clean
 */
async function setupUserContextAndRoom(userId, username, context = {}) {
  const now = new Date().toISOString();

  // Insert context
  const contextData = {
    coParentName: context.coParentName || '',
    separationDate: context.separationDate || '',
    children: context.children || [],
    concerns: context.concerns || [],
    newPartner: context.newPartner || { name: '', livesWith: false }
  };

  try {
    // Check if context already exists
    const existingContext = await dbSafe.safeSelect('user_context', { user_id: username }, { limit: 1 });

    if (existingContext.length > 0) {
      await dbSafe.safeUpdate('user_context', {
        co_parent: contextData.coParentName,
        children: JSON.stringify(contextData.children),
        contacts: JSON.stringify(contextData.concerns),
        updated_at: now
      }, { user_id: username });
    } else {
      await dbSafe.safeInsert('user_context', {
        user_id: username,
        co_parent: contextData.coParentName,
        children: JSON.stringify(contextData.children),
        contacts: JSON.stringify(contextData.concerns),
        updated_at: now
      });
    }
  } catch (ctxErr) {
    console.warn('⚠️ Could not create user context:', ctxErr.message);
  }

  // Create a private room for the user
  let room = null;
  try {
    room = await roomManager.createPrivateRoom(userId, username);
  } catch (roomErr) {
    console.warn('⚠️ Could not create private room:', roomErr.message);
  }

  return { context: contextData, room };
}

/**
 * Create a new user account with explicit username
 *
 * ATOMIC: Uses insert-with-retry to handle unique constraint violations safely.
 * For explicit usernames, it throws an error if the username already exists
 * (unlike createUserWithEmail which auto-generates alternatives).
 */
async function createUser(username, password, context = {}, email = null, googleId = null, oauthProvider = null, nameData = {}) {
  const usernameLower = username.toLowerCase();

  // If email provided, check if email exists (fast fail)
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailExists = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    if (emailExists.length > 0) {
      throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
    }
  }

  // If googleId provided, check if Google account already exists
  if (googleId) {
    const googleUserExists = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
    if (googleUserExists.length > 0) {
      throw new Error('Google account already registered');
    }
  }

  const now = new Date().toISOString();

  // Build user data
  const userData = {
    username: usernameLower,
    created_at: now,
    first_name: nameData.firstName || null,
    last_name: nameData.lastName || null,
    display_name: nameData.displayName || (nameData.firstName ? `${nameData.firstName} ${nameData.lastName || ''}`.trim() : null)
  };

  // Hash password if provided (not required for OAuth users)
  if (password) {
    userData.password_hash = await hashPassword(password);
  }

  if (email) {
    userData.email = email.trim().toLowerCase();
  }

  if (googleId) {
    userData.google_id = googleId;
  }

  if (oauthProvider) {
    userData.oauth_provider = oauthProvider;
  }

  // ATOMIC INSERT - will throw on unique constraint violation
  let userId;
  try {
    userId = await dbSafe.safeInsert('users', userData);

    // Verify we got a valid ID
    if (!userId || userId === 0) {
      const insertedUsers = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
      if (insertedUsers.length > 0) {
        userId = insertedUsers[0].id;
      } else {
        throw new Error('Failed to create user - could not retrieve user ID');
      }
    }
  } catch (err) {
    // Convert PostgreSQL unique violation to friendly error
    if (err.code === '23505') {
      if (err.constraint?.includes('username')) {
        throw new Error('Username already exists');
      } else if (err.constraint?.includes('email')) {
        throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
      }
    }
    throw err;
  }

  console.log(`✅ Created user ${userId} with username ${usernameLower}`);

  // Setup context and room (non-atomic, but user exists)
  const { context: contextData, room } = await setupUserContextAndRoom(userId, usernameLower, context);

  // Create welcome and onboarding tasks
  await createWelcomeAndOnboardingTasks(userId, usernameLower);

  return {
    id: userId,
    username: usernameLower,
    email: email ? email.trim().toLowerCase() : null,
    context: contextData,
    room,
    firstName: userData.first_name,
    lastName: userData.last_name,
    displayName: userData.display_name
  };
}

/**
 * Get or create user from Google OAuth
 */
async function getOrCreateGoogleUser(googleId, email, name, picture = null) {
  // First, try to find user by Google ID
  const googleUserResult = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const googleUsers = googleUserResult;

  if (googleUsers.length > 0) {
    // User exists with this Google ID - update last login and return
    const user = googleUsers[0];
    await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

    // Get full user data including context and room
    // Assuming getUser function exists elsewhere or needs to be implemented
    // For now, returning basic user info
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name
    };
  }

  // Check if email already exists (user might have signed up with email/password)
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailUserResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    const emailUsers = emailUserResult;

    if (emailUsers.length > 0) {
      // User exists with this email - link Google account
      const user = emailUsers[0];
      await dbSafe.safeUpdate('users', {
        google_id: googleId,
        oauth_provider: 'google',
        last_login: new Date().toISOString()
      }, { id: user.id });

      // Get full user data including context and room
      // For now, returning basic user info
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name
      };
    }
  }

  // Create new user from Google account
  // Generate username from email or name
  let username = name || email?.split('@')[0] || `user${Date.now()}`;
  username = username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

  // Ensure username is unique
  let uniqueUsername = username;
  let counter = 1;
  while (true) {
    const existing = await dbSafe.safeSelect('users', { username: uniqueUsername }, { limit: 1 });
    if (existing.length === 0) {
      break;
    }
    uniqueUsername = `${username}${counter}`.substring(0, 20);
    counter++;
  }

  // Parse name into first/last
  let firstName = '';
  let lastName = '';
  if (name) {
    const parts = name.split(' ');
    firstName = parts[0];
    if (parts.length > 1) {
      lastName = parts.slice(1).join(' ');
    }
  }

  // Create user with Google OAuth (no password)
  return await createUser(uniqueUsername, null, {}, email, googleId, 'google', {
    firstName,
    lastName,
    displayName: name
  });
}

/**
 * Create welcome and onboarding tasks for new users
 */
async function createWelcomeAndOnboardingTasks(userId, username) {
  const now = new Date().toISOString();

  // Create welcome task
  try {
    const welcomeTaskDescription = `LiaiZen is contextual and adapts to your unique situation over time as it learns from your interactions.

We hope you enjoy the platform, but feedback is golden. Let us know what you like and don't like. Stay tuned for new features like calendar, expense sharing, and document sharing.`;

    await dbSafe.safeInsert('tasks', {
      user_id: userId,
      title: 'Welcome to LiaiZen',
      description: welcomeTaskDescription,
      status: 'open',
      priority: 'medium',
      due_date: null,
      created_at: now,
      updated_at: now,
      completed_at: null
    });
    console.log(`✅ Created welcome task for user: ${username}`);
  } catch (error) {
    console.warn('⚠️ Could not create welcome task:', error.message);
  }

  // Create onboarding tasks
  try {
    const onboardingTasks = [
      {
        title: 'Complete Your Profile',
        description: 'Help LiaiZen understand the dynamics of your co-parenting situation.\n\nThe more context you provide—your details, your children, your schedule—the better LiaiZen can guide your communication and tailor support to your needs.\n\n\n\nUpdate your profile to get the most accurate, personalized mediation.',
        priority: 'high'
      },
      {
        title: 'Add Your Co-parent',
        description: 'Add your co-parent as a contact to enable communication and coordination features. Go to Contacts to add them.',
        priority: 'high'
      },
      {
        title: 'Add Your Children',
        description: 'Add your children as contacts so LiaiZen can help you coordinate their care and activities.',
        priority: 'high'
      }
    ];

    for (const task of onboardingTasks) {
      // Check if task already exists before creating
      const existingTasks = await dbSafe.safeSelect('tasks', {
        user_id: userId,
        title: task.title
      }, { limit: 1 });

      if (existingTasks.length === 0) {
        await dbSafe.safeInsert('tasks', {
          user_id: userId,
          title: task.title,
          description: task.description,
          status: 'open',
          priority: task.priority,
          due_date: null,
          created_at: now,
          updated_at: now,
          completed_at: null
        });
      }
    }

    console.log(`✅ Created onboarding tasks for user: ${username}`);
  } catch (error) {
    console.warn('⚠️ Could not create onboarding tasks:', error.message);
  }
}

/**
 * Authenticate a user by email
 */
async function authenticateUserByEmail(email, password) {
  const emailLower = email.trim().toLowerCase();

  console.log(`🔐 Attempting login for email: ${emailLower}`);

  // Use safe select to get user by email
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const users = result;

  if (users.length === 0) {
    console.log(`❌ No user found with email: ${emailLower}`);
    // Return special error object to distinguish "not found" from "wrong password"
    const error = new Error('Account not found');
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  const user = users[0];
  console.log(`✅ User found: ${user.username} (id: ${user.id})`);

  // Check if user has a password (OAuth users might not)
  if (!user.password_hash) {
    console.log(`❌ User ${user.username} has no password_hash (OAuth user?)`);
    // User exists but has no password (OAuth-only user)
    const error = new Error('This account uses Google sign-in. Please sign in with Google.');
    error.code = 'OAUTH_ONLY_ACCOUNT';
    throw error;
  }

  // Compare password using bcrypt (or SHA-256 for legacy passwords)
  let isValid = false;

  // Check if password hash is bcrypt (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[ayb]\$/.test(user.password_hash);
  console.log(`🔑 Password hash type: ${isBcryptHash ? 'bcrypt' : 'legacy SHA-256'}`);

  if (isBcryptHash) {
    // Use bcrypt comparison
    isValid = await comparePassword(password, user.password_hash);
    console.log(`🔐 Bcrypt password comparison: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  } else {
    // Legacy SHA-256 hash - verify and migrate to bcrypt
    const crypto = require('crypto');
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    if (sha256Hash === user.password_hash) {
      isValid = true;
      // Migrate to bcrypt by updating the password hash
      const newBcryptHash = await hashPassword(password);
      await dbSafe.safeUpdate('users', { password_hash: newBcryptHash }, { id: user.id });
      console.log(`✅ Migrated password for user: ${user.username}`);
    } else {
      console.log(`❌ Legacy SHA-256 password comparison failed`);
    }
  }

  if (!isValid) {
    console.log(`❌ Authentication failed for user: ${user.username}`);
    // Wrong password - user exists but password is incorrect
    const error = new Error('Invalid password');
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  console.log(`✅ Authentication successful for user: ${user.username}`);

  // Update last login using safe update
  await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

  // Get context using safe select
  // Note: user_context.user_id is TEXT (username) in PostgreSQL
  const contextResult = await dbSafe.safeSelect('user_context', { user_id: user.username }, { limit: 1 });
  const contextRows = contextResult;

  let context = {
    coParentName: '',
    separationDate: '',
    children: [],
    concerns: [],
    newPartner: { name: '', livesWith: false }
  };

  if (contextRows.length > 0) {
    const contextData = contextRows[0];
    try {
      context = {
        coParentName: contextData.co_parent || '',
        separationDate: '',
        children: typeof contextData.children === 'string' ? JSON.parse(contextData.children) : (contextData.children || []),
        concerns: typeof contextData.contacts === 'string' ? JSON.parse(contextData.contacts) : (contextData.contacts || []),
        newPartner: { name: '', livesWith: false }
      };
    } catch (err) {
      console.error('Error parsing user context:', err);
    }
  }

  // Get user's room
  let room = null;
  try {
    console.log(`🔵 getUser: Fetching room for user ${user.id} (${user.username})`);
    room = await roomManager.getUserRoom(user.id);
    if (room) {
      console.log(`✅ getUser: Found room ${room.roomId} for user ${user.username}`);
    } else {
      console.log(`⚠️ getUser: No room found for user ${user.username}`);
    }
  } catch (error) {
    console.error(`❌ Error getting user room for ${user.username}:`, error);
    console.error(`❌ Error stack:`, error.stack);
    // Don't throw - return user without room
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
    context,
    room
  };
}

/**
 * Authenticate a user (legacy - by username, kept for backward compatibility)
 */
async function authenticateUser(username, password) {
  const usernameLower = username.toLowerCase();

  // Use safe select to get user
  const result = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = result;

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // Compare password using bcrypt (or SHA-256 for legacy passwords)
  let isValid = false;

  // Check if password hash is bcrypt (starts with $2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[ayb]\$/.test(user.password_hash);

  if (isBcryptHash) {
    // Use bcrypt comparison
    isValid = await comparePassword(password, user.password_hash);
  } else {
    // Legacy SHA-256 hash - verify and migrate to bcrypt
    const crypto = require('crypto');
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    if (sha256Hash === user.password_hash) {
      isValid = true;
      // Migrate to bcrypt by updating the password hash
      const newBcryptHash = await hashPassword(password);
      await dbSafe.safeUpdate('users', { password_hash: newBcryptHash }, { id: user.id });
      console.log(`✅ Migrated password for user: ${user.username}`);
    }
  }

  if (!isValid) {
    return null;
  }

  // Update last login using safe update
  await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

  // Get context using safe select
  // Note: user_context.user_id is TEXT (username) in PostgreSQL
  const contextResult = await dbSafe.safeSelect('user_context', { user_id: user.username }, { limit: 1 });
  const contextRows = contextResult;

  let context = {
    coParentName: '',
    separationDate: '',
    children: [],
    concerns: [],
    newPartner: { name: '', livesWith: false }
  };

  if (contextRows.length > 0) {
    const contextData = contextRows[0];
    try {
      context = {
        coParentName: contextData.co_parent || '',
        separationDate: '',
        children: typeof contextData.children === 'string' ? JSON.parse(contextData.children) : (contextData.children || []),
        concerns: typeof contextData.contacts === 'string' ? JSON.parse(contextData.contacts) : (contextData.contacts || []),
        newPartner: { name: '', livesWith: false }
      };
    } catch (err) {
      console.error('Error parsing user context:', err);
    }
  }

  // Get user's room
  let room = null;
  try {
    console.log(`🔵 getUser: Fetching room for user ${user.id} (${user.username})`);
    room = await roomManager.getUserRoom(user.id);
    if (room) {
      console.log(`✅ getUser: Found room ${room.roomId} for user ${user.username}`);
    } else {
      console.log(`⚠️ getUser: No room found for user ${user.username}`);
    }
  } catch (error) {
    console.error(`❌ Error getting user room for ${user.username}:`, error);
    console.error(`❌ Error stack:`, error.stack);
    // Don't throw - return user without room
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
    context,
    room
  };
}

/**
 * Update user context
 */
async function updateUserContext(username, context) {
  const usernameLower = username.toLowerCase();

  // Get user ID using safe select
  const userResult = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = userResult;

  if (users.length === 0) {
    throw new Error('User not found');
  }

  const userId = users[0].id;

  // Get existing context or create new
  // Note: user_context.user_id is TEXT (username) in PostgreSQL
  const existingResult = await dbSafe.safeSelect('user_context', { user_id: usernameLower }, { limit: 1 });
  const existingRows = existingResult;

  const contextData = {
    coParentName: context.coParentName !== undefined ? context.coParentName : '',
    separationDate: context.separationDate !== undefined ? context.separationDate : '',
    children: context.children !== undefined ? context.children : [],
    concerns: context.concerns !== undefined ? context.concerns : [],
    newPartner: context.newPartner !== undefined ? context.newPartner : { name: '', livesWith: false }
  };

  const now = new Date().toISOString();
  // PostgreSQL schema: co_parent (TEXT), children (JSONB), contacts (JSONB)
  const contextUpdateData = {
    co_parent: contextData.coParentName,
    children: JSON.stringify(contextData.children),
    contacts: JSON.stringify(contextData.concerns),
    updated_at: now
  };

  if (existingRows.length > 0) {
    // Update existing using safe update
    // Note: user_context.user_id is TEXT (username) in PostgreSQL
    await dbSafe.safeUpdate('user_context', contextUpdateData, { user_id: usernameLower });
  } else {
    // Insert new using safe insert
    // Note: user_context.user_id is TEXT (username) in PostgreSQL
    await dbSafe.safeInsert('user_context', {
      user_id: usernameLower,
      ...contextUpdateData
    });
  }

  // PostgreSQL doesn't need saveDatabase() - changes are automatically persisted

  return contextData;
}

/**
 * Get user by username
 */
async function getUser(username) {
  const usernameLower = username.toLowerCase();

  // Get user using safe select
  const userResult = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = userResult;

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // Get context using safe select
  // Note: user_context.user_id is TEXT (username) in PostgreSQL
  const contextResult = await dbSafe.safeSelect('user_context', { user_id: user.username }, { limit: 1 });
  const contextRows = contextResult;

  let context = {
    coParentName: '',
    separationDate: '',
    children: [],
    concerns: [],
    newPartner: { name: '', livesWith: false }
  };

  if (contextRows.length > 0) {
    const contextData = contextRows[0];
    try {
      context = {
        coParentName: contextData.co_parent || '',
        separationDate: '',
        children: typeof contextData.children === 'string' ? JSON.parse(contextData.children) : (contextData.children || []),
        concerns: typeof contextData.contacts === 'string' ? JSON.parse(contextData.contacts) : (contextData.contacts || []),
        newPartner: { name: '', livesWith: false }
      };
    } catch (err) {
      console.error('Error parsing user context:', err);
    }
  }

  let room = null;
  try {
    room = await roomManager.getUserRoom(user.id);
  } catch (error) {
    console.error('Error getting user room:', error);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
    context,
    room
  };
}

/**
 * Get or create user from Google OAuth
 */
async function getOrCreateGoogleUser(googleId, email, name, picture = null) {
  // First, try to find user by Google ID
  const googleUserResult = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const googleUsers = googleUserResult;

  if (googleUsers.length > 0) {
    // User exists with this Google ID - update last login and return
    const user = googleUsers[0];
    await dbSafe.safeUpdate('users', { last_login: new Date().toISOString() }, { id: user.id });

    // Get full user data including context and room
    return await getUser(user.username);
  }

  // Check if email already exists (user might have signed up with email/password)
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailUserResult = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    const emailUsers = emailUserResult;

    if (emailUsers.length > 0) {
      // User exists with this email - link Google account
      const user = emailUsers[0];
      await dbSafe.safeUpdate('users', {
        google_id: googleId,
        oauth_provider: 'google',
        last_login: new Date().toISOString()
      }, { id: user.id });

      return await getUser(user.username);
    }
  }

  // Create new user from Google account
  // Generate username from email or name
  let username = name || email?.split('@')[0] || `user${Date.now()}`;
  username = username.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);

  // Ensure username is unique
  let uniqueUsername = username;
  let counter = 1;
  while (true) {
    const existing = await dbSafe.safeSelect('users', { username: uniqueUsername }, { limit: 1 });
    if (existing.length === 0) {
      break;
    }
    uniqueUsername = `${username}${counter}`.substring(0, 20);
    counter++;
  }

  // Create user with Google OAuth (no password)
  return await createUser(uniqueUsername, null, {}, email, googleId, 'google');
}

/**
 * Get user by Google ID
 */
async function getUserByGoogleId(googleId) {
  const result = await dbSafe.safeSelect('users', { google_id: googleId }, { limit: 1 });
  const users = result;

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  return await getUser(user.username);
}

/**
 * Check if username exists
 */
async function userExists(username) {
  const usernameLower = username.toLowerCase();
  const result = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  return result.length > 0;
}

/**
 * Register a new user with REQUIRED co-parent invitation
 * This is the new registration flow for Feature 003.
 *
 * @param {object} params - Registration parameters
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.displayName - User's display name
 * @param {string} params.coParentEmail - Co-parent's email (REQUIRED)
 * @param {object} [params.context] - Additional user context
 * @param {object} db - Database connection (for invitation/notification libraries)
 * @returns {Promise<object>} Registration result with user and invitation details
 */
async function registerWithInvitation(params, db) {
  const {
    email,
    password,
    displayName,
    coParentEmail,
    context = {}
  } = params;

  // Validation
  if (!email) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }
  if (!coParentEmail) {
    throw new Error('Co-parent email is required');
  }
  if (!db) {
    throw new Error('Database connection is required');
  }

  const emailLower = email.trim().toLowerCase();
  const coParentEmailLower = coParentEmail.trim().toLowerCase();

  // Prevent inviting yourself
  if (emailLower === coParentEmailLower) {
    throw new Error('You cannot invite yourself as a co-parent');
  }

  // Create the user account using existing createUserWithEmail
  // This handles username generation, password hashing, context, and room creation
  const user = await createUserWithEmail(emailLower, password, context);

  // Update display name if provided
  if (displayName) {
    await dbSafe.safeUpdate('users', {
      display_name: displayName.trim()
    }, { id: user.id });
  }

  // Create the co-parent invitation
  const invitationResult = await invitationManager.createInvitation({
    inviterId: user.id,
    inviteeEmail: coParentEmailLower,
    roomId: user.room?.roomId || null,
    invitationType: 'coparent'
  }, db);

  // Mark user as having sent signup invitation
  await dbSafe.safeUpdate('users', {
    signup_invitation_sent: true,
    signup_completed_at: new Date().toISOString()
  }, { id: user.id });

  // If invitee is an existing user, create in-app notification (no email per user decision)
  if (invitationResult.isExistingUser && invitationResult.existingUser) {
    try {
      await notificationManager.createInvitationNotification({
        userId: invitationResult.existingUser.id,
        inviterName: displayName || user.username,
        invitationId: invitationResult.invitation.id,
        invitationToken: invitationResult.token
      }, db);
      console.log(`✅ Created in-app notification for existing user: ${invitationResult.existingUser.email}`);
    } catch (notifError) {
      console.error('Error creating invitation notification:', notifError);
      // Don't fail registration if notification fails
    }
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: displayName || user.username,
      context: user.context,
      room: user.room
    },
    invitation: {
      id: invitationResult.invitation.id,
      token: invitationResult.token, // Raw token to be sent in email
      inviteeEmail: coParentEmailLower,
      isExistingUser: invitationResult.isExistingUser,
      expiresAt: invitationResult.invitation.expires_at
    }
  };
}

/**
 * Register a new user from an invitation token (TRANSACTIONAL)
 * Used when an invited person creates their account
 *
 * All database operations are wrapped in a transaction.
 * If any step fails, everything is rolled back.
 *
 * @param {object} params - Registration parameters
 * @param {string} params.token - Invitation token
 * @param {string} params.email - User's email (must match invitation)
 * @param {string} params.password - User's password
 * @param {string} params.displayName - User's display name
 * @param {object} [params.context] - Additional user context
 * @param {object} db - Database connection (used for invitation validation)
 * @returns {Promise<object>} Registration result with user and room details
 */
async function registerFromInvitation(params, db) {
  const {
    token,
    email,
    password,
    displayName,
    context = {}
  } = params;

  // ========== PRE-TRANSACTION VALIDATION ==========
  // These checks happen before the transaction to fail fast

  if (!token) {
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, 'Token is required');
  }
  if (!email) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }

  const emailLower = email.trim().toLowerCase();

  // Check if email already exists (fast fail before transaction)
  const existingEmail = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existingEmail.length > 0) {
    throw createRegistrationError(RegistrationError.EMAIL_EXISTS);
  }

  // Validate the invitation token
  const validation = await invitationManager.validateToken(token, db);
  if (!validation.valid) {
    // Map validation errors to registration error codes
    if (validation.code === 'EXPIRED') {
      throw createRegistrationError(RegistrationError.EXPIRED);
    } else if (validation.code === 'ALREADY_ACCEPTED') {
      throw createRegistrationError(RegistrationError.ALREADY_ACCEPTED);
    }
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, validation.error);
  }

  const invitation = validation.invitation;

  // Verify email matches the invitation
  if (invitation.invitee_email.toLowerCase() !== emailLower) {
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, 'Email does not match invitation');
  }

  // Verify inviter still exists
  const inviterCheck = await dbSafe.safeSelect('users', { id: invitation.inviter_id }, { limit: 1 });
  if (inviterCheck.length === 0) {
    throw createRegistrationError(RegistrationError.INVITER_GONE);
  }

  // ========== TRANSACTIONAL REGISTRATION ==========
  // All database operations wrapped in a transaction

  console.log(`🔵 Starting transactional registration for ${emailLower}`);

  return await dbSafe.withTransaction(async (client) => {
    const now = new Date().toISOString();

    // 1. Create user account
    const passwordHash = await hashPassword(password);

    // Generate unique username from email
    let baseUsername = emailLower.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 15);
    if (baseUsername.length < 3) baseUsername = 'user';

    let username = baseUsername;
    let usernameAttempts = 0;
    let userId = null;

    // Try to create user with unique username (atomic approach)
    while (usernameAttempts < 10) {
      try {
        const result = await client.query(
          `INSERT INTO "users" ("username", "email", "password_hash", "display_name", "created_at")
           VALUES ($1, $2, $3, $4, $5) RETURNING "id", "username"`,
          [username, emailLower, passwordHash, displayName?.trim() || null, now]
        );
        userId = result.rows[0].id;
        username = result.rows[0].username;
        break;
      } catch (err) {
        if (err.code === '23505' && err.constraint?.includes('username')) {
          // Username conflict - try with suffix
          usernameAttempts++;
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          username = `${baseUsername}${randomSuffix}`.substring(0, 20);
        } else {
          throw err;
        }
      }
    }

    if (!userId) {
      throw createRegistrationError(RegistrationError.USERNAME_FAILED);
    }

    console.log(`✅ Created user ${userId} with username ${username}`);

    // 2. Accept the invitation (update status)
    await client.query(
      `UPDATE "invitations"
       SET "status" = 'accepted', "invitee_id" = $1, "accepted_at" = $2
       WHERE "id" = $3`,
      [userId, now, invitation.id]
    );

    console.log(`✅ Accepted invitation ${invitation.id}`);

    // 3. Create shared room for co-parents
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const roomName = `${validation.inviterName || 'Co-Parent'} & ${displayName || username}`;

    await client.query(
      `INSERT INTO "rooms" ("id", "name", "created_by", "is_private", "created_at")
       VALUES ($1, $2, $3, $4, $5)`,
      [roomId, roomName, invitation.inviter_id, 1, now]
    );

    // Add both users as room members
    await client.query(
      `INSERT INTO "room_members" ("room_id", "user_id", "role", "joined_at")
       VALUES ($1, $2, 'owner', $3)`,
      [roomId, invitation.inviter_id, now]
    );
    await client.query(
      `INSERT INTO "room_members" ("room_id", "user_id", "role", "joined_at")
       VALUES ($1, $2, 'member', $3)`,
      [roomId, userId, now]
    );

    console.log(`✅ Created shared room ${roomId}`);

    // 4. Create bidirectional contacts
    // Add inviter to new user's contacts
    await dbSafe.safeInsertTx(client, 'contacts', {
      user_id: userId,
      contact_name: validation.inviterName || 'Co-Parent',
      contact_email: validation.inviterEmail || null,
      relationship: 'co-parent',
      created_at: now
    });

    // Add new user to inviter's contacts
    await dbSafe.safeInsertTx(client, 'contacts', {
      user_id: invitation.inviter_id,
      contact_name: displayName || username,
      contact_email: emailLower,
      relationship: 'co-parent',
      created_at: now
    });

    console.log(`✅ Created bidirectional contacts`);

    // 5. Create notification for inviter (non-critical, don't fail transaction)
    try {
      await dbSafe.safeInsertTx(client, 'in_app_notifications', {
        user_id: invitation.inviter_id,
        type: 'invitation_accepted',
        title: 'Co-Parent Connected!',
        message: `${displayName || username} has accepted your invitation and is now connected.`,
        data: JSON.stringify({
          invitation_id: invitation.id,
          invitee_id: userId,
          room_id: roomId
        }),
        read: false,
        created_at: now
      });
      console.log(`✅ Created notification for inviter`);
    } catch (notifErr) {
      // Log but don't fail the transaction for notification errors
      console.warn('⚠️ Could not create notification:', notifErr.message);
    }

    // Transaction will commit automatically after returning
    console.log(`✅ Transaction complete - registration successful`);

    return {
      success: true,
      user: {
        id: userId,
        username: username,
        email: emailLower,
        displayName: displayName || username
      },
      coParent: {
        id: invitation.inviter_id,
        displayName: validation.inviterName,
        emailDomain: validation.inviterEmail?.split('@')[1]?.split('.')[0] || null
      },
      room: {
        id: roomId,
        name: roomName
      },
      sync: {
        contactsCreated: true,
        roomJoined: true,
        notificationSent: true
      }
    };
  });
}

/**
 * Register a new user from a short code invitation
 * Used when an invited person creates their account using a short code
 *
 * Short codes (e.g., LZ-ABC123) do NOT require email matching,
 * allowing any user to accept the invitation.
 *
 * @param {object} params - Registration parameters
 * @param {string} params.shortCode - Short invite code (e.g., LZ-ABC123)
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.displayName - User's display name
 * @param {object} [params.context] - Additional user context
 * @param {object} db - Database connection
 * @returns {Promise<object>} Registration result with user and room details
 */
async function registerFromShortCode(params, db) {
  const {
    shortCode,
    email,
    password,
    displayName,
    context = {}
  } = params;

  // Validation
  if (!shortCode) {
    throw new Error('Short code is required');
  }
  if (!email) {
    throw new Error('Email is required');
  }
  if (!password) {
    throw new Error('Password is required');
  }
  if (!db) {
    throw new Error('Database connection is required');
  }

  const emailLower = email.trim().toLowerCase();

  // Validate the short code
  const validation = await invitationManager.validateByShortCode(shortCode, db);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid invitation code');
  }

  const invitation = validation.invitation;

  // Check if user already exists with this email
  const existingUser = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existingUser.length > 0) {
    throw new Error('Email already exists');
  }

  // Create the user account
  const user = await createUserWithEmail(emailLower, password, context);

  // Update display name if provided
  if (displayName) {
    await dbSafe.safeUpdate('users', {
      display_name: displayName.trim()
    }, { id: user.id });
  }

  // Accept the invitation using short code
  const acceptResult = await invitationManager.acceptByShortCode(shortCode, user.id, db);

  // Add user to the inviter's room if room exists
  let sharedRoom = null;
  let targetRoomId = acceptResult.roomId;

  // If invitation doesn't have a room_id, try to get the inviter's existing room
  if (!targetRoomId) {
    try {
      const inviterRoom = await roomManager.getUserRoom(acceptResult.inviterId);
      if (inviterRoom && inviterRoom.roomId) {
        targetRoomId = inviterRoom.roomId;
        console.log(`📍 Found inviter's existing room: ${targetRoomId}`);
      }
    } catch (roomError) {
      console.log(`⚠️ Could not get inviter's room:`, roomError.message);
    }
  }

  if (targetRoomId) {
    try {
      console.log(`🔵 Adding user ${user.id} to room ${targetRoomId}`);
      await roomManager.addUserToRoom(targetRoomId, user.id);
      sharedRoom = await roomManager.getRoom(targetRoomId);
      console.log(`✅ User added to room successfully`);
    } catch (roomError) {
      console.error('Error adding user to room:', roomError);
      // Don't fail registration if room join fails
    }
  } else {
    // Create a shared room for the co-parents
    try {
      console.log(`🔵 Creating new co-parent room`);
      const inviterUser = await getUser(acceptResult.inviterId);
      if (inviterUser) {
        sharedRoom = await roomManager.createCoParentRoom(
          acceptResult.inviterId,
          user.id,
          inviterUser.displayName || inviterUser.username,
          displayName || user.username
        );
        console.log(`✅ Created new co-parent room: ${sharedRoom?.roomId}`);
      }
    } catch (roomError) {
      console.error('Error creating shared room:', roomError);
    }
  }

  // Create contacts between co-parents
  // FIX: Use correct schema - contacts table has: user_id (owner), contact_name, contact_email, relationship
  try {
    // Add inviter to new user's contacts
    await dbSafe.safeInsert('contacts', {
      user_id: user.id,  // Owner of contact list
      contact_name: validation.inviterName || 'Co-Parent',
      contact_email: validation.inviterEmail || null,
      relationship: 'co-parent',
      created_at: new Date().toISOString()
    });
    // Add new user to inviter's contacts
    await dbSafe.safeInsert('contacts', {
      user_id: acceptResult.inviterId,  // Owner of contact list
      contact_name: displayName || user.username,
      contact_email: user.email,
      relationship: 'co-parent',
      created_at: new Date().toISOString()
    });
    console.log('✅ Created bidirectional co-parent contacts');
  } catch (contactError) {
    console.error('Error creating contacts:', contactError);
    // Don't fail registration if contact creation fails
  }

  // Notify inviter that invitation was accepted
  try {
    await notificationManager.createInvitationAcceptedNotification({
      userId: acceptResult.inviterId,
      inviteeName: displayName || user.username,
      invitationId: invitation.id,
      roomId: sharedRoom?.roomId || null
    }, db);
  } catch (notifError) {
    console.error('Error creating accepted notification:', notifError);
  }

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: displayName || user.username,
      context: user.context,
      room: user.room
    },
    coParent: {
      id: acceptResult.inviterId,
      name: validation.inviterName,
      emailDomain: validation.inviterEmail?.split('@')[1]?.split('.')[0] || null
    },
    sharedRoom
  };
}

/**
 * Accept a co-parent invitation for an EXISTING user
 * Used when an existing user receives an invitation
 *
 * @param {string} token - Invitation token
 * @param {string} acceptingUserId - User ID of the accepting user
 * @param {object} db - Database connection
 * @returns {Promise<object>} Acceptance result with room details
 */
async function acceptCoParentInvitation(token, acceptingUserId, db) {
  if (!token || !acceptingUserId || !db) {
    throw new Error('token, acceptingUserId, and db are required');
  }

  // Validate and accept the invitation
  const acceptResult = await invitationManager.acceptInvitation(token, acceptingUserId, db);
  const invitation = await invitationManager.getInvitationById(acceptResult.invitation.id, db);

  // Get accepting user details
  const acceptingUserResult = await dbSafe.safeSelect('users', { id: acceptingUserId }, { limit: 1 });
  const acceptingUser = acceptingUserResult[0];

  // Add user to the inviter's room if room exists
  let sharedRoom = null;
  if (acceptResult.roomId) {
    try {
      await roomManager.addUserToRoom(acceptResult.roomId, acceptingUserId);
      sharedRoom = await roomManager.getRoom(acceptResult.roomId);
    } catch (roomError) {
      console.error('Error adding user to room:', roomError);
    }
  } else {
    // Create a shared room for the co-parents
    try {
      sharedRoom = await roomManager.createCoParentRoom(
        acceptResult.inviterId,
        acceptingUserId,
        invitation.inviter_name,
        acceptingUser?.display_name || acceptingUser?.username
      );
    } catch (roomError) {
      console.error('Error creating shared room:', roomError);
    }
  }

  // Create contacts between co-parents (if not already exist)
  // FIX: Use correct schema - contacts table has: user_id (owner), contact_name, contact_email, relationship
  try {
    // Check if contact already exists using correct schema
    const existingContact1 = await dbSafe.safeSelect('contacts', {
      user_id: acceptingUserId,
      contact_email: invitation.inviter_email
    }, { limit: 1 });

    if (existingContact1.length === 0) {
      // Add inviter to accepting user's contacts
      await dbSafe.safeInsert('contacts', {
        user_id: acceptingUserId,  // Owner of contact list
        contact_name: invitation.inviter_name || 'Co-Parent',
        contact_email: invitation.inviter_email || null,
        relationship: 'co-parent',
        created_at: new Date().toISOString()
      });
    }

    const existingContact2 = await dbSafe.safeSelect('contacts', {
      user_id: acceptResult.inviterId,
      contact_email: acceptingUser?.email
    }, { limit: 1 });

    if (existingContact2.length === 0) {
      // Add accepting user to inviter's contacts
      await dbSafe.safeInsert('contacts', {
        user_id: acceptResult.inviterId,  // Owner of contact list
        contact_name: acceptingUser?.display_name || acceptingUser?.username || 'Co-Parent',
        contact_email: acceptingUser?.email || null,
        relationship: 'co-parent',
        created_at: new Date().toISOString()
      });
    }
    console.log('✅ Created/verified bidirectional co-parent contacts');
  } catch (contactError) {
    console.error('Error creating contacts:', contactError);
  }

  // Notify inviter that invitation was accepted
  try {
    await notificationManager.createInvitationAcceptedNotification({
      userId: acceptResult.inviterId,
      inviteeName: acceptingUser?.display_name || acceptingUser?.username,
      invitationId: acceptResult.invitation.id,
      roomId: sharedRoom?.roomId || null
    }, db);
  } catch (notifError) {
    console.error('Error creating accepted notification:', notifError);
  }

  return {
    accepted: true,
    coParent: {
      id: acceptResult.inviterId,
      name: invitation.inviter_name,
      emailDomain: invitation.inviter_email?.split('@')[1]?.split('.')[0] || null
    },
    sharedRoom
  };
}

/**
 * Decline a co-parent invitation
 *
 * @param {string} token - Invitation token
 * @param {string} decliningUserId - User ID of the declining user
 * @param {object} db - Database connection
 * @returns {Promise<object>} Decline result
 */
async function declineCoParentInvitation(token, decliningUserId, db) {
  if (!token || !decliningUserId || !db) {
    throw new Error('token, decliningUserId, and db are required');
  }

  // Decline the invitation
  const declineResult = await invitationManager.declineInvitation(token, decliningUserId, db);

  // Get declining user details
  const decliningUserResult = await dbSafe.safeSelect('users', { id: decliningUserId }, { limit: 1 });
  const decliningUser = decliningUserResult[0];

  // Notify inviter that invitation was declined
  try {
    await notificationManager.createInvitationDeclinedNotification({
      userId: declineResult.inviterId,
      inviteeName: decliningUser?.display_name || decliningUser?.username,
      invitationId: declineResult.invitation.id
    }, db);
  } catch (notifError) {
    console.error('Error creating declined notification:', notifError);
  }

  return {
    declined: true,
    inviterId: declineResult.inviterId
  };
}

// ============================================================================
// DISPLAY NAME DISAMBIGUATION (Feature 005)
// ============================================================================

/**
 * Get disambiguated display for a user
 * If another user in the context has the same name, append email domain
 * @param {Object} user - User object with display_name, email
 * @param {Array} contextUsers - Other users to check for name collision
 * @returns {string} Display name, possibly with email domain
 */
function getDisambiguatedDisplay(user, contextUsers = []) {
  const displayName = user.display_name || user.username;

  if (!displayName) {
    return `User #${user.id}`;
  }

  // Check if any other user has the same display name
  const hasDuplicate = contextUsers.some(other =>
    other.id !== user.id &&
    (other.display_name || other.username) === displayName
  );

  if (!hasDuplicate) {
    return displayName;
  }

  // Add email domain for disambiguation
  if (user.email) {
    const domain = user.email.split('@')[1]?.split('.')[0];
    if (domain) {
      return `${displayName} (${domain})`;
    }
  }

  // Fallback: add user ID
  return `${displayName} #${user.id}`;
}

/**
 * Disambiguate a list of contacts by adding email domain to duplicates
 * @param {Array} contacts - Array of contact objects
 * @returns {Array} Contacts with disambiguated displayName property
 */
function disambiguateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return contacts;
  }

  // Group contacts by name
  const nameGroups = contacts.reduce((acc, contact) => {
    const name = contact.contact_name || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(contact);
    return acc;
  }, {});

  // Add disambiguation for duplicates
  return contacts.map(contact => {
    const name = contact.contact_name || 'Unknown';
    const group = nameGroups[name];

    if (group.length > 1 && contact.contact_email) {
      const domain = contact.contact_email.split('@')[1]?.split('.')[0];
      return {
        ...contact,
        displayName: domain ? `${name} (${domain})` : `${name} (${contact.contact_email})`
      };
    }

    return {
      ...contact,
      displayName: name
    };
  });
}

module.exports = {
  // Existing functions (preserved for backward compatibility)
  createUser,
  createUserWithEmail,
  authenticateUser,
  authenticateUserByEmail,
  updateUserContext,
  getUser,
  userExists,
  getOrCreateGoogleUser,
  getUserByGoogleId,
  hashPassword,
  comparePassword,

  // New functions for Feature 003: Account Creation with Co-Parent Invitation
  registerWithInvitation,
  registerFromInvitation,
  registerFromShortCode,
  acceptCoParentInvitation,
  declineCoParentInvitation,

  // Error codes for registration (Feature 005)
  RegistrationError,
  createRegistrationError,

  // Display name disambiguation (Feature 005)
  getDisambiguatedDisplay,
  disambiguateContacts
};
