const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Support environment variable for Railway volumes or custom paths
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'chat.db');

// Ensure directory exists if using custom path
if (process.env.DB_PATH) {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`✅ Created database directory: ${dbDir}`);
  }
}

let db = null;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  let buffer;
  try {
    buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('✅ Database loaded from file');
  } catch (err) {
    // Database doesn't exist, create new one
    db = new SQL.Database();
    console.log('✅ Database created');
  }

  // Enable foreign key constraints (required for CASCADE to work)
  db.run('PRAGMA foreign_keys = ON');

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      oauth_provider TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT
    )
  `);

  // Add email column if it doesn't exist (migration for existing databases)
  try {
    // Check if email column exists by trying to query it
    const testResult = db.exec(`SELECT email FROM users LIMIT 1`);
    // If we get here, column exists, no need to add it
  } catch (err) {
    // Column doesn't exist, try to add it
    try {
      db.run(`ALTER TABLE users ADD COLUMN email TEXT`);
      // SQLite doesn't support UNIQUE in ALTER TABLE ADD COLUMN, so we need to create a unique index
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL`);
    } catch (alterErr) {
      console.warn('Could not add email column (may already exist):', alterErr.message);
    }
  }

  // Add Google OAuth columns if they don't exist (migration for existing databases)
  const oauthColumns = ['google_id', 'oauth_provider'];
  for (const column of oauthColumns) {
    try {
      // Try to query the column to see if it exists
      const testResult = db.exec(`SELECT ${column} FROM users LIMIT 1`);
      // If we get here, column exists
    } catch (err) {
      // Column doesn't exist, try to add it
      try {
        if (column === 'google_id') {
          db.run(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
          // Create unique index for google_id
          db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(${column}) WHERE ${column} IS NOT NULL`);
          console.log(`✅ Added OAuth column: ${column}`);
        } else {
          db.run(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
          console.log(`✅ Added OAuth column: ${column}`);
        }
      } catch (alterErr) {
        console.warn(`Could not add ${column} column (may already exist):`, alterErr.message);
      }
    }
  }
  
  // Update password_hash to be nullable (for OAuth users)
  try {
    // Try to insert a user with null password_hash - if it fails, column needs to be updated
    const testResult = db.exec(`SELECT password_hash FROM users LIMIT 1`);
    // Column exists - we'll handle nullable in the application logic
  } catch (err) {
    // Column doesn't exist (shouldn't happen, but handle it)
    console.warn('password_hash column not found');
  }

  // Add profile columns if they don't exist (migration for existing databases)
  const profileColumns = [
    'first_name',
    'last_name',
    'address',
    'household_members',
    'occupation',
    'parenting_philosophy',
    'personal_growth'
  ];

  for (const column of profileColumns) {
    try {
      // Try to query the column to see if it exists
      const testResult = db.exec(`SELECT ${column} FROM users LIMIT 1`);
      // If we get here, column exists
    } catch (err) {
      // Column doesn't exist, try to add it
      try {
        db.run(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
        console.log(`✅ Added profile column: ${column}`);
      } catch (alterErr) {
        console.warn(`Could not add ${column} column (may already exist):`, alterErr.message);
      }
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS user_context (
      user_id INTEGER PRIMARY KEY,
      co_parent_name TEXT,
      separation_date TEXT,
      children TEXT,
      concerns TEXT,
      new_partner TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT,
      timestamp TEXT NOT NULL,
      socket_id TEXT,
      room_id TEXT,
      private INTEGER DEFAULT 0,
      flagged INTEGER DEFAULT 0,
      validation TEXT,
      tip1 TEXT,
      tip2 TEXT,
      rewrite TEXT,
      original_message TEXT,
      edited INTEGER DEFAULT 0,
      edited_at TEXT,
      deleted INTEGER DEFAULT 0,
      deleted_at TEXT,
      reactions TEXT,
      user_flagged_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Add new columns for message editing/deletion/reactions/user flagging (migration)
  const messageColumns = ['edited', 'edited_at', 'deleted', 'deleted_at', 'reactions', 'user_flagged_by'];
  for (const column of messageColumns) {
    try {
      // Try to query the column to see if it exists
      const testResult = db.exec(`SELECT ${column} FROM messages LIMIT 1`);
      // If we get here, column exists
    } catch (err) {
      // Column doesn't exist, try to add it
      try {
        if (column === 'edited' || column === 'deleted') {
          db.run(`ALTER TABLE messages ADD COLUMN ${column} INTEGER DEFAULT 0`);
        } else if (column === 'reactions') {
          db.run(`ALTER TABLE messages ADD COLUMN ${column} TEXT`);
        } else {
          db.run(`ALTER TABLE messages ADD COLUMN ${column} TEXT`);
        }
        console.log(`✅ Added message column: ${column}`);
      } catch (alterErr) {
        console.warn(`Could not add ${column} column (may already exist):`, alterErr.message);
      }
    }
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_by INTEGER NOT NULL,
      is_private INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(room_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS room_invites (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      invited_by INTEGER NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      expires_at TEXT,
      used_by INTEGER,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_username ON users(username)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_room_members ON room_members(room_id, user_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_invite_code ON room_invites(invite_code)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pending_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      accepted_at TEXT,
      FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Note: Unique index for email is created above if needed during migration
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_users_email_lookup ON users(email)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pending_token ON pending_connections(token)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pending_email ON pending_connections(invitee_email)
  `);

  // Create contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT,
      relationship TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add relationship-specific fields to contacts table (migration)
  const relationshipFields = [
    'separation_date',
    'address',
    'difficult_aspects',
    'friction_situations',
    'legal_matters',
    'safety_concerns',
    'substance_mental_health',
    'neglect_abuse_concerns',
    'additional_thoughts',
    'other_parent', // For children contacts - links to co-parent's contact (name or ID)
    'triggering_reasons', // JSON array of triggering reasons from flagged messages
    'child_age', // For child contacts
    'child_birthdate', // For child contacts
    'school', // For child/teacher contacts
    'phone', // For professional contacts
    'partner_duration', // For partner contacts - how long together
    'has_children', // For partner contacts - boolean (stored as TEXT "true"/"false")
    'custody_arrangement', // For child contacts - custody details
    'linked_contact_id' // For linking related contacts (e.g., child to other parent)
  ];

  for (const field of relationshipFields) {
    try {
      // Try to query the column to see if it exists
      const testResult = db.exec(`SELECT ${field} FROM contacts LIMIT 1`);
      // If we get here, column exists
    } catch (err) {
      // Column doesn't exist, try to add it
      try {
        db.run(`ALTER TABLE contacts ADD COLUMN ${field} TEXT`);
        console.log(`✅ Added relationship field to contacts: ${field}`);
      } catch (alterErr) {
        console.warn(`Could not add ${field} column (may already exist):`, alterErr.message);
      }
    }
  }

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)
  `);

  // Create tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
  `);

  // Add task assignment and related people columns (migration)
  const taskColumns = ['assigned_to', 'related_people'];
  for (const column of taskColumns) {
    try {
      // Try to query the column to see if it exists
      const testResult = db.exec(`SELECT ${column} FROM tasks LIMIT 1`);
      // If we get here, column exists
    } catch (err) {
      // Column doesn't exist, try to add it
      try {
        db.run(`ALTER TABLE tasks ADD COLUMN ${column} TEXT`);
        console.log(`✅ Added task column: ${column}`);
      } catch (alterErr) {
        console.warn(`Could not add ${column} column (may already exist):`, alterErr.message);
      }
    }
  }

  // Save database to file
  saveDatabase();

  return db;
}

// Save database to file (batched to prevent race conditions)
let writeTimer = null;
let isSaving = false;

function saveDatabase() {
  // If database not initialized yet, queue the save
  if (!dbPromise) {
    console.warn('⚠️ Database not initialized, cannot save');
    return;
  }

  // If already saving, skip (will be saved on next batch)
  if (isSaving) {
    return;
  }

  // Batch writes - wait for initialization, then save after a short delay
  clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    try {
      // Wait for database to be ready
      await dbPromise;
      
      if (!db) {
        console.error('❌ Database not available for saving');
        return;
      }

      isSaving = true;
    const data = db.export();
    const buffer = Buffer.from(data);
      
      // Ensure directory exists
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
    fs.writeFileSync(DB_PATH, buffer);
      isSaving = false;
      console.log(`✅ Database saved to: ${DB_PATH}`);
    } catch (err) {
      isSaving = false;
      console.error('❌ Error saving database:', err);
  }
  }, 100); // Batch writes every 100ms
}

// Initialize and export
const dbPromise = initDatabase();

// Export database with helper methods
module.exports = {
  getDb: async () => {
    await dbPromise;
    return db;
  },
  saveDatabase
};
