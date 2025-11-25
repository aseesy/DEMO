const bcrypt = require('bcrypt');
const roomManager = require('./roomManager');
const dbSafe = require('./dbSafe');

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
 * Create a new user account with email (auto-generates username from email)
 */
async function createUserWithEmail(email, password, context = {}, googleId = null, oauthProvider = null) {
  const emailLower = email.trim().toLowerCase();
  
  // Check if email already exists
  const emailExists = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (emailExists.length > 0) {
    throw new Error('Email already exists');
  }

  // Generate username from email (part before @)
  let baseUsername = emailLower.split('@')[0];
  // Remove non-alphanumeric characters and limit length
  baseUsername = baseUsername.replace(/[^a-z0-9]/g, '').substring(0, 15);
  
  // Ensure username is unique
  let username = baseUsername;
  let counter = 1;
  while (true) {
    const existing = await dbSafe.safeSelect('users', { username: username }, { limit: 1 });
    if (existing.length === 0) {
      break;
    }
    // Append number if username exists
    username = `${baseUsername}${counter}`.substring(0, 20);
    counter++;
    if (counter > 1000) {
      // Fallback to timestamp if we can't find a unique username
      username = `user${Date.now()}`.substring(0, 20);
      break;
    }
  }
  
  // Create user with generated username
  return await createUser(username, password, context, emailLower, googleId, oauthProvider);
}

/**
 * Create a new user account
 */
async function createUser(username, password, context = {}, email = null, googleId = null, oauthProvider = null) {
  const usernameLower = username.toLowerCase();
  
  // Check if user exists using safe query
  const existing = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  if (existing.length > 0) {
    throw new Error('Username already exists');
  }

  // If email provided, check if email exists
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailExists = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    if (emailExists.length > 0) {
      throw new Error('Email already exists');
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

  // Insert user with optional email and OAuth info using safe insert
  const userData = {
    username: usernameLower,
    created_at: now
  };
  
  // Hash password if provided (not required for OAuth users)
  if (password) {
    const passwordHash = await hashPassword(password);
    userData.password_hash = passwordHash;
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
  
  const userId = await dbSafe.safeInsert('users', userData);

  // Validate that we got a valid user ID
  // If last_insert_rowid() returned 0 or null, query the user to get the actual ID
  let actualUserId = userId;
  if (!userId || userId === 0) {
    // Query the user we just inserted to get the actual ID
    const insertedUsers = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
    if (insertedUsers.length > 0) {
      actualUserId = insertedUsers[0].id;
      console.log(`Warning: INSERT returned ${userId}, but user ID is actually ${actualUserId}`);
    } else {
      throw new Error('Failed to create user - could not retrieve user ID');
    }
  }

  // Insert context
  const contextData = {
    coParentName: context.coParentName || '',
    separationDate: context.separationDate || '',
    children: context.children || [],
    concerns: context.concerns || [],
    newPartner: context.newPartner || { name: '', livesWith: false }
  };

  // Check if context already exists (shouldn't happen, but handle it)
  // Note: user_context.user_id is TEXT (username) in PostgreSQL, not INTEGER
  const existingContext = await dbSafe.safeSelect('user_context', { user_id: usernameLower }, { limit: 1 });
  const contexts = existingContext;
  
  if (contexts.length > 0) {
    // Update existing context
    // Note: user_context.user_id is TEXT (username) in PostgreSQL
    await dbSafe.safeUpdate('user_context', {
      co_parent: contextData.coParentName,
      children: JSON.stringify(contextData.children),
      contacts: JSON.stringify(contextData.concerns),
      updated_at: now
    }, { user_id: usernameLower });
  } else {
    // Insert new context using safe insert
    // Note: user_context.user_id is TEXT (username) in PostgreSQL
    await dbSafe.safeInsert('user_context', {
      user_id: usernameLower,
      co_parent: contextData.coParentName,
      children: JSON.stringify(contextData.children),
      contacts: JSON.stringify(contextData.concerns),
      updated_at: now
    });
  }

  // PostgreSQL doesn't need saveDatabase() - changes are automatically persisted

  // Create a private room for the user
  let room = null;
  try {
    room = await roomManager.createPrivateRoom(actualUserId, username);
  } catch (error) {
    console.error('Error creating private room:', error);
    // Don't fail user creation if room creation fails
  }

  // Create welcome task for new users
  try {
    const welcomeTaskDescription = `LiaiZen is contextual and adapts to your unique situation over time as it learns from your interactions.

We hope you enjoy the platform, but feedback is golden. Let us know what you like and don't like. Stay tuned for new features like calendar, expense sharing, and document sharing.`;

    await dbSafe.safeInsert('tasks', {
      user_id: actualUserId,
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
    console.error('Error creating welcome task:', error);
    // Don't fail user creation if welcome task creation fails
  }

  // Create onboarding tasks for new users (with duplicate checks)
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
      const existingResult = await dbSafe.safeSelect('tasks', {
        user_id: actualUserId,
        title: task.title
      }, { limit: 1 });
      
      const existingTasks = existingResult;
      
      // Only create if it doesn't exist
      if (existingTasks.length === 0) {
        await dbSafe.safeInsert('tasks', {
          user_id: actualUserId,
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
    console.error('Error creating onboarding tasks:', error);
    // Don't fail user creation if onboarding tasks creation fails
  }

  // PostgreSQL doesn't need saveDatabase() - changes are automatically persisted

  return {
    id: actualUserId,
    username,
    email: email ? email.trim().toLowerCase() : null,
    context: contextData,
    room
  };
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
    return null;
  }

  const user = users[0];
  console.log(`✅ User found: ${user.username} (id: ${user.id})`);
  
  // Check if user has a password (OAuth users might not)
  if (!user.password_hash) {
    console.log(`❌ User ${user.username} has no password_hash (OAuth user?)`);
    return null;
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
    return null;
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

module.exports = {
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
  comparePassword
};
