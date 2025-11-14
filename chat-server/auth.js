const bcrypt = require('bcrypt');
const dbModule = require('./db');
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

/**
 * Get database instance
 */
async function getDb() {
  return await dbModule.getDb();
}

/**
 * Create a new user account
 */
async function createUser(username, password, context = {}, email = null) {
  const usernameLower = username.toLowerCase();
  
  // Check if user exists using safe query
  const existing = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  if (dbSafe.parseResult(existing).length > 0) {
    throw new Error('Username already exists');
  }

  // If email provided, check if email exists
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const emailExists = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
    if (dbSafe.parseResult(emailExists).length > 0) {
      throw new Error('Email already exists');
    }
  }

  // Hash password with bcrypt
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  // Insert user with optional email using safe insert
  const userData = {
    username: usernameLower,
    password_hash: passwordHash,
    created_at: now
  };
  
  if (email) {
    userData.email = email.trim().toLowerCase();
  }
  
  const userId = await dbSafe.safeInsert('users', userData);

  // Validate that we got a valid user ID
  // If last_insert_rowid() returned 0 or null, query the user to get the actual ID
  let actualUserId = userId;
  if (!userId || userId === 0) {
    // Query the user we just inserted to get the actual ID
    const insertedUserResult = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
    const insertedUsers = dbSafe.parseResult(insertedUserResult);
    if (insertedUsers.length > 0) {
      actualUserId = insertedUsers[0].id;
      console.log(`Warning: last_insert_rowid() returned ${userId}, but user ID is actually ${actualUserId}`);
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
  const existingContext = await dbSafe.safeSelect('user_context', { user_id: actualUserId }, { limit: 1 });
  const contexts = dbSafe.parseResult(existingContext);
  
  if (contexts.length > 0) {
    // Update existing context
    await dbSafe.safeUpdate('user_context', {
      co_parent_name: contextData.coParentName,
      separation_date: contextData.separationDate,
      children: JSON.stringify(contextData.children),
      concerns: JSON.stringify(contextData.concerns),
      new_partner: JSON.stringify(contextData.newPartner),
      updated_at: now
    }, { user_id: actualUserId });
  } else {
    // Insert new context using safe insert
    await dbSafe.safeInsert('user_context', {
      user_id: actualUserId,
      co_parent_name: contextData.coParentName,
      separation_date: contextData.separationDate,
      children: JSON.stringify(contextData.children),
      concerns: JSON.stringify(contextData.concerns),
      new_partner: JSON.stringify(contextData.newPartner),
      updated_at: now
    });
  }

  dbModule.saveDatabase();

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
        description: 'Add your profile information to help LiaiZen understand your situation better. Go to Profile to add your name, email, and other details.',
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
      
      const existingTasks = dbSafe.parseResult(existingResult);
      
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

  dbModule.saveDatabase();

  return {
    id: actualUserId,
    username,
    email: email ? email.trim().toLowerCase() : null,
    context: contextData,
    room
  };
}

/**
 * Authenticate a user
 */
async function authenticateUser(username, password) {
  const usernameLower = username.toLowerCase();
  
  // Use safe select to get user
  const result = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  
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
  const contextResult = await dbSafe.safeSelect('user_context', { user_id: user.id }, { limit: 1 });
  const contextRows = dbSafe.parseResult(contextResult);
  
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
        coParentName: contextData.co_parent_name || '',
        separationDate: contextData.separation_date || '',
        children: contextData.children ? JSON.parse(contextData.children) : [],
        concerns: contextData.concerns ? JSON.parse(contextData.concerns) : [],
        newPartner: contextData.new_partner ? JSON.parse(contextData.new_partner) : { name: '', livesWith: false }
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
  const users = dbSafe.parseResult(userResult);
  
  if (users.length === 0) {
    throw new Error('User not found');
  }

  const userId = users[0].id;

  // Get existing context or create new
  const existingResult = await dbSafe.safeSelect('user_context', { user_id: userId }, { limit: 1 });
  const existingRows = dbSafe.parseResult(existingResult);

  const contextData = {
    coParentName: context.coParentName !== undefined ? context.coParentName : '',
    separationDate: context.separationDate !== undefined ? context.separationDate : '',
    children: context.children !== undefined ? context.children : [],
    concerns: context.concerns !== undefined ? context.concerns : [],
    newPartner: context.newPartner !== undefined ? context.newPartner : { name: '', livesWith: false }
  };

  const now = new Date().toISOString();
  const contextUpdateData = {
    co_parent_name: contextData.coParentName,
    separation_date: contextData.separationDate,
    children: JSON.stringify(contextData.children),
    concerns: JSON.stringify(contextData.concerns),
    new_partner: JSON.stringify(contextData.newPartner),
    updated_at: now
  };

  if (existingRows.length > 0) {
    // Update existing using safe update
    await dbSafe.safeUpdate('user_context', contextUpdateData, { user_id: userId });
  } else {
    // Insert new using safe insert
    await dbSafe.safeInsert('user_context', {
      user_id: userId,
      ...contextUpdateData
    });
  }

  dbModule.saveDatabase();

  return contextData;
}

/**
 * Get user by username
 */
async function getUser(username) {
  const usernameLower = username.toLowerCase();
  
  // Get user using safe select
  const userResult = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);
  
  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  // Get context using safe select
  const contextResult = await dbSafe.safeSelect('user_context', { user_id: user.id }, { limit: 1 });
  const contextRows = dbSafe.parseResult(contextResult);
  
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
        coParentName: contextData.co_parent_name || '',
        separationDate: contextData.separation_date || '',
        children: contextData.children ? JSON.parse(contextData.children) : [],
        concerns: contextData.concerns ? JSON.parse(contextData.concerns) : [],
        newPartner: contextData.new_partner ? JSON.parse(contextData.new_partner) : { name: '', livesWith: false }
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
 * Check if username exists
 */
async function userExists(username) {
  const usernameLower = username.toLowerCase();
  const result = await dbSafe.safeSelect('users', { username: usernameLower }, { limit: 1 });
  return dbSafe.parseResult(result).length > 0;
}

module.exports = {
  createUser,
  authenticateUser,
  updateUserContext,
  getUser,
  userExists,
  hashPassword,
  comparePassword
};
