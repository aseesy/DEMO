# Implementation Plan: User Account Creation & Invitation Flow

## Technical Context (from Codebase Analysis)

### Architecture

- **Frontend**: React 18 + Vite, Tailwind CSS
- **Backend**: Node.js + Express.js, Socket.io
- **Database**: PostgreSQL via `pg` pool (`chat-server/dbPostgres.js`)
- **Query Layer**: Parameterized queries via `chat-server/dbSafe.js`
- **Deployment**: Vercel (frontend), Railway (backend)

### Key Files

| File                                                       | Purpose                                         |
| ---------------------------------------------------------- | ----------------------------------------------- |
| `chat-server/auth.js`                                      | User creation, invitation registration          |
| `chat-server/dbSafe.js`                                    | SQL injection prevention, parameterized queries |
| `chat-server/dbPostgres.js`                                | PostgreSQL connection pool                      |
| `chat-server/roomManager.js`                               | Room creation, membership                       |
| `chat-server/libs/invitation-manager/`                     | Invitation token/code management                |
| `chat-client-vite/src/components/AcceptInvitationPage.jsx` | Invitation acceptance UI                        |
| `chat-client-vite/src/components/LoginSignup.jsx`          | Registration UI                                 |
| `chat-client-vite/src/hooks/useAuth.js`                    | Authentication hook                             |

### Existing Patterns

- **Database Queries**: Use `dbSafe.safeSelect()`, `dbSafe.safeInsert()`, `dbSafe.safeUpdate()`
- **Error Handling**: Try-catch with console.error, throw for API handlers
- **Migrations**: Non-blocking SQL files in `chat-server/migrations/`
- **Authentication**: JWT tokens in cookies + localStorage backup

---

## Implementation Phases

### Phase 1: Fix Critical Contact Creation Bug (CRITICAL)

**Priority**: Immediate - Currently breaking all invitation acceptances

#### Problem

Code in `auth.js:884-895` inserts `owner_id` but `contacts` table only has `user_id`:

```javascript
// CURRENT (BROKEN)
await dbSafe.safeInsert('contacts', {
  owner_id: user.id,        // Column doesn't exist!
  user_id: acceptResult.inviterId,
  relationship: 'co-parent',
  ...
});
```

#### Solution: Use Existing Schema Correctly

The `contacts` table schema is:

```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,      -- Owner of the contact list
  contact_name TEXT NOT NULL,    -- Name to display
  contact_email TEXT,            -- Email for disambiguation
  relationship TEXT,             -- 'co-parent', 'teacher', etc.
  ...
);
```

#### File Changes

**File: `chat-server/auth.js`**

Location: Lines 881-899 (`registerFromInvitation` function)

```javascript
// CHANGE FROM:
await dbSafe.safeInsert('contacts', {
  owner_id: user.id,
  user_id: acceptResult.inviterId,
  relationship: 'co-parent',
  created_at: new Date().toISOString(),
});
await dbSafe.safeInsert('contacts', {
  owner_id: acceptResult.inviterId,
  user_id: user.id,
  relationship: 'co-parent',
  created_at: new Date().toISOString(),
});

// CHANGE TO:
// Add inviter to new user's contacts
await dbSafe.safeInsert('contacts', {
  user_id: user.id, // Owner of contact list
  contact_name: inviterUser.display_name || inviterUser.username,
  contact_email: inviterUser.email,
  relationship: 'co-parent',
  created_at: new Date().toISOString(),
});

// Add new user to inviter's contacts
await dbSafe.safeInsert('contacts', {
  user_id: acceptResult.inviterId, // Owner of contact list
  contact_name: displayName || user.username,
  contact_email: user.email,
  relationship: 'co-parent',
  created_at: new Date().toISOString(),
});
```

Location: Lines 1044-1062 (`registerFromShortCode` function) - Same fix

Location: Lines 1140-1166 (`acceptInvitationForExistingUser` function) - Same fix

#### Validation

- [ ] Contact records created with correct schema
- [ ] Both users can see each other in Contacts panel
- [ ] No console errors during invitation acceptance

---

### Phase 2: Add Transaction Wrapper for Atomic Registration (HIGH)

**Priority**: High - Prevents partial/orphaned records

#### Problem

Registration operations are not atomic. If room creation fails after user creation, user exists but has no room.

#### Solution: Add PostgreSQL Transaction Support to dbSafe

**File: `chat-server/dbSafe.js`**

Add new transaction helper functions:

```javascript
/**
 * Begin a PostgreSQL transaction
 * @returns {Promise<pg.PoolClient>} Client with active transaction
 */
async function beginTransaction() {
  const client = await dbPostgres.connect();
  await client.query('BEGIN');
  return client;
}

/**
 * Commit a transaction
 * @param {pg.PoolClient} client - Client with active transaction
 */
async function commitTransaction(client) {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
}

/**
 * Rollback a transaction
 * @param {pg.PoolClient} client - Client with active transaction
 */
async function rollbackTransaction(client) {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
}

/**
 * Execute a function within a transaction
 * Automatically commits on success, rolls back on error
 * @param {Function} fn - Async function receiving (client) parameter
 * @returns {Promise<any>} Result of fn
 */
async function withTransaction(fn) {
  const client = await dbPostgres.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Add transaction-aware versions of safe functions
async function safeInsertWithClient(client, table, data) {
  // Same logic as safeInsert but uses client.query instead of dbPostgres.query
  const safeTable = escapeIdentifier(table);
  const columns = Object.keys(data).map(escapeIdentifier);
  const params = Object.values(data);
  const placeholders = params.map((_, index) => `$${index + 1}`);

  let primaryKeyColumn = 'id';
  if (table === 'user_context') primaryKeyColumn = 'user_id';

  const query = `INSERT INTO ${safeTable} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING ${escapeIdentifier(primaryKeyColumn)}`;

  const result = await client.query(query, params);
  return result.rows[0]?.[primaryKeyColumn] ?? null;
}

// Export new functions
module.exports = {
  // ... existing exports
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  withTransaction,
  safeInsertWithClient,
  safeSelectWithClient,
  safeUpdateWithClient,
};
```

**File: `chat-server/auth.js`**

Wrap registration in transaction:

```javascript
async function registerFromInvitation(params, db) {
  const { inviteToken, email, password, displayName, context = {} } = params;

  // Validation (outside transaction)
  if (!inviteToken) throw new Error('Invitation token is required');
  if (!email) throw new Error('Email is required');
  if (!password) throw new Error('Password is required');

  const emailLower = email.trim().toLowerCase();

  // Check email doesn't exist (outside transaction for fast fail)
  const existingUser = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  if (existingUser.length > 0) {
    throw new Error('Email already exists');
  }

  // Validate invitation (outside transaction)
  const validation = await invitationManager.validateByToken(inviteToken, db);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid invitation');
  }

  // Execute all DB operations in a single transaction
  return await dbSafe.withTransaction(async client => {
    // 1. Create user
    const user = await createUserWithEmailTx(client, email, password, displayName, context);

    // 2. Accept invitation
    const acceptResult = await invitationManager.acceptByTokenTx(client, inviteToken, user.id);

    // 3. Get inviter info
    const inviterResult = await client.query(
      'SELECT id, username, email, display_name FROM users WHERE id = $1',
      [acceptResult.inviterId]
    );
    const inviterUser = inviterResult.rows[0];
    if (!inviterUser) {
      throw new Error('Inviter account no longer exists');
    }

    // 4. Create shared room
    const sharedRoom = await roomManager.createCoParentRoomTx(
      client,
      acceptResult.inviterId,
      user.id,
      inviterUser.display_name || inviterUser.username,
      displayName || user.username
    );

    // 5. Create bidirectional contacts
    await dbSafe.safeInsertWithClient(client, 'contacts', {
      user_id: user.id,
      contact_name: inviterUser.display_name || inviterUser.username,
      contact_email: inviterUser.email,
      relationship: 'co-parent',
      created_at: new Date().toISOString(),
    });

    await dbSafe.safeInsertWithClient(client, 'contacts', {
      user_id: acceptResult.inviterId,
      contact_name: displayName || user.username,
      contact_email: emailLower,
      relationship: 'co-parent',
      created_at: new Date().toISOString(),
    });

    // 6. Create notification for inviter
    await notificationManager.createInvitationAcceptedNotificationTx(client, {
      userId: acceptResult.inviterId,
      inviteeName: displayName || user.username,
      invitationId: acceptResult.invitationId,
      roomId: sharedRoom?.roomId || null,
    });

    // All succeeded - transaction will commit
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: displayName || user.username,
      },
      coParent: {
        id: acceptResult.inviterId,
        displayName: inviterUser.display_name,
        emailDomain: inviterUser.email?.split('@')[1]?.split('.')[0],
      },
      room: sharedRoom,
      sync: {
        contactsCreated: true,
        roomJoined: true,
        notificationSent: true,
      },
    };
  });
}
```

#### Error Codes

Add structured error responses:

```javascript
// In auth.js
const RegistrationError = {
  EMAIL_EXISTS: { code: 'REG_001', message: 'Email already exists' },
  INVALID_TOKEN: { code: 'REG_002', message: 'Invalid invitation token' },
  EXPIRED: { code: 'REG_003', message: 'Invitation has expired' },
  ALREADY_ACCEPTED: { code: 'REG_004', message: 'Invitation already accepted' },
  ROOM_FAILED: { code: 'REG_005', message: 'Could not create chat room' },
  CONTACT_FAILED: { code: 'REG_006', message: 'Could not create contacts' },
  DATABASE_ERROR: { code: 'REG_007', message: 'Database error occurred' },
  INVITER_GONE: { code: 'REG_008', message: 'Inviter account no longer exists' },
};
```

---

### Phase 3: Fix Username Generation Race Condition (MEDIUM)

**Priority**: Medium - Rare but possible under high concurrency

#### Problem

Username uniqueness check and insert are not atomic:

```javascript
// CURRENT (RACE CONDITION)
while (true) {
  const existing = await dbSafe.safeSelect('users', { username }, { limit: 1 });
  if (existing.length === 0) break; // <- Another request could insert here
  username = `${baseUsername}${counter++}`;
}
// User creation happens AFTER loop - possible duplicate key error
```

#### Solution: Use Atomic Insert with Retry

**File: `chat-server/auth.js`**

```javascript
const crypto = require('crypto');

/**
 * Generate a unique username atomically using INSERT with retry on conflict
 * @param {pg.PoolClient} client - Transaction client
 * @param {string} baseEmail - Email to derive username from
 * @param {Object} userData - Other user data to insert
 * @returns {Promise<{id: number, username: string}>} Created user
 */
async function createUserWithUniqueUsername(client, baseEmail, userData, maxRetries = 5) {
  // Extract base username from email
  let base = baseEmail
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (base.length < 3) base = 'user';
  base = base.substring(0, 12); // Leave room for suffix

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // First attempt: use base only
    // Subsequent: add random suffix
    const suffix = attempt === 0 ? '' : `_${crypto.randomBytes(3).toString('hex')}`;
    const username = `${base}${suffix}`.substring(0, 20);

    try {
      const columns = Object.keys({ username, ...userData })
        .map(c => `"${c}"`)
        .join(', ');
      const values = [username, ...Object.values(userData)];
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

      const result = await client.query(
        `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING id, username`,
        values
      );

      return result.rows[0];
    } catch (error) {
      // PostgreSQL unique violation error code
      if (error.code === '23505' && error.constraint?.includes('username')) {
        // Username conflict - retry with different suffix
        continue;
      }
      throw error; // Other error - propagate
    }
  }

  throw new Error('Could not generate unique username after maximum retries');
}
```

---

### Phase 4: Add Display Name Disambiguation (MEDIUM)

**Priority**: Medium - Improves UX when names collide

#### Problem

Multiple users can have the same display name, causing confusion.

#### Solution: Add Helper Functions and UI Updates

**File: `chat-server/auth.js`** - Add helper function

```javascript
/**
 * Get disambiguated display for a user
 * If another user in the context has the same name, append email domain
 * @param {Object} user - User object with display_name, email
 * @param {Array} contextUsers - Other users to check for name collision
 * @returns {string} Display name, possibly with email domain
 */
function getDisambiguatedDisplay(user, contextUsers = []) {
  const displayName = user.display_name || user.username;

  // Check if any other user has the same display name
  const hasDuplicate = contextUsers.some(
    other => other.id !== user.id && (other.display_name || other.username) === displayName
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

module.exports = {
  // ... existing exports
  getDisambiguatedDisplay,
};
```

**File: `chat-client-vite/src/components/ContactsPanel.jsx`**

```jsx
// Add utility function for client-side disambiguation
function disambiguateContacts(contacts) {
  // Group contacts by name
  const nameGroups = contacts.reduce((acc, contact) => {
    const name = contact.contact_name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(contact);
    return acc;
  }, {});

  // Add disambiguation for duplicates
  return contacts.map(contact => {
    const group = nameGroups[contact.contact_name];
    if (group.length > 1 && contact.contact_email) {
      const domain = contact.contact_email.split('@')[1]?.split('.')[0];
      return {
        ...contact,
        displayName: `${contact.contact_name} (${domain || contact.contact_email})`,
      };
    }
    return {
      ...contact,
      displayName: contact.contact_name,
    };
  });
}

// In component render:
const disambiguatedContacts = disambiguateContacts(contacts);
```

**File: `chat-client-vite/src/components/ProfilePanel.jsx`**

Always show email below display name:

```jsx
<div className="profile-header">
  <h2 className="text-xl font-semibold text-[#275559]">{user.display_name || user.username}</h2>
  <p className="text-sm text-gray-600">{user.email}</p>
  <p className="text-xs text-gray-400">User ID: {user.id}</p>
</div>
```

---

### Phase 5: Improve Invitation Acceptance UI (MEDIUM)

**Priority**: Medium - Better UX and error handling

#### Changes to AcceptInvitationPage.jsx

**1. Show Inviter Info During Registration**

```jsx
{
  validationResult?.valid && (
    <div className="mb-6 p-4 bg-[#275559]/10 rounded-lg border border-[#275559]/20">
      <p className="text-sm text-[#275559] mb-1">You've been invited by:</p>
      <p className="font-semibold text-[#275559]">
        {validationResult.inviterName || 'Your co-parent'}
        {validationResult.inviterEmailDomain && (
          <span className="font-normal text-gray-600 ml-1">
            ({validationResult.inviterEmailDomain})
          </span>
        )}
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Not your co-parent? Don't proceed with this invitation.
      </p>
    </div>
  );
}
```

**2. Add Confirmation Step for Short Codes**

```jsx
const [isConfirmingInviter, setIsConfirmingInviter] = useState(false);
const [confirmedInviter, setConfirmedInviter] = useState(false);

// Before showing signup form for short codes:
{
  shortCode && validationResult?.valid && !confirmedInviter && (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#275559]">Confirm Your Co-Parent</h2>
      <p className="text-gray-700">You're accepting an invitation from:</p>
      <div className="p-4 bg-white rounded-lg border-2 border-[#275559]">
        <p className="font-bold text-lg text-[#275559]">{validationResult.inviterName}</p>
        {validationResult.inviterEmailDomain && (
          <p className="text-sm text-gray-600">Email: ...@{validationResult.inviterEmailDomain}</p>
        )}
      </div>
      <div className="flex gap-4">
        <Button onClick={() => setConfirmedInviter(true)} className="flex-1">
          Yes, this is my co-parent
        </Button>
        <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
          No, wrong person
        </Button>
      </div>
    </div>
  );
}
```

**3. Better Error States**

```jsx
const errorMessages = {
  REG_001: {
    title: 'Email Already Registered',
    message: 'This email is already associated with an account.',
    action: 'Try logging in instead.',
    actionButton: { label: 'Go to Login', href: '/signin' },
  },
  REG_002: {
    title: 'Invalid Invitation',
    message: 'This invitation link is not valid.',
    action: 'Ask your co-parent to send a new invitation.',
  },
  REG_003: {
    title: 'Invitation Expired',
    message: 'This invitation has expired.',
    action: 'Ask your co-parent to send a new invitation.',
  },
  REG_004: {
    title: 'Already Accepted',
    message: 'This invitation has already been used.',
    action: 'If this was you, try logging in.',
    actionButton: { label: 'Go to Login', href: '/signin' },
  },
  REG_008: {
    title: 'Inviter Not Found',
    message: 'The account that sent this invitation no longer exists.',
    action: 'Contact support if you need assistance.',
  },
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to reach the server.',
    action: 'Check your internet connection and try again.',
    actionButton: { label: 'Retry', onClick: () => window.location.reload() },
  },
};

// Render error:
{
  formError && (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="font-semibold text-red-800">
        {errorMessages[formError.code]?.title || 'Error'}
      </h3>
      <p className="text-red-700 mt-1">
        {errorMessages[formError.code]?.message || formError.message}
      </p>
      <p className="text-sm text-red-600 mt-2">{errorMessages[formError.code]?.action}</p>
      {errorMessages[formError.code]?.actionButton && (
        <Button
          variant="outline"
          className="mt-3"
          onClick={errorMessages[formError.code].actionButton.onClick}
          href={errorMessages[formError.code].actionButton.href}
        >
          {errorMessages[formError.code].actionButton.label}
        </Button>
      )}
    </div>
  );
}
```

**4. Success State with Animation**

```jsx
{
  successMessage && (
    <div className="text-center py-8 animate-fade-in">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#6dd4b0] flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[#275559] mb-2">Connected!</h2>
      <p className="text-gray-700">
        You and {validationResult?.inviterName} can now message each other.
      </p>
      <p className="text-sm text-gray-500 mt-4">Redirecting to chat...</p>
    </div>
  );
}
```

---

## Database Migration

**File: `chat-server/migrations/005_co_parent_relationships.sql`**

```sql
-- Migration 005: Co-Parent Relationships Table
-- Adds dedicated table for tracking bidirectional co-parent relationships

-- Create co_parent_relationships table
CREATE TABLE IF NOT EXISTS co_parent_relationships (
  id SERIAL PRIMARY KEY,

  -- Both user IDs (enforce user_a_id < user_b_id to prevent duplicates)
  user_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reference to shared room
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,

  -- Reference to original invitation
  invitation_id INTEGER REFERENCES invitations(id) ON DELETE SET NULL,

  -- Relationship status
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_coparent_rel_user_a ON co_parent_relationships(user_a_id);
CREATE INDEX IF NOT EXISTS idx_coparent_rel_user_b ON co_parent_relationships(user_b_id);
CREATE INDEX IF NOT EXISTS idx_coparent_rel_room ON co_parent_relationships(room_id);
CREATE INDEX IF NOT EXISTS idx_coparent_rel_status ON co_parent_relationships(status);

-- Helper view to get all co-parent pairs for a user
CREATE OR REPLACE VIEW user_co_parents AS
SELECT
  r.id AS relationship_id,
  CASE
    WHEN r.user_a_id = u.id THEN r.user_b_id
    ELSE r.user_a_id
  END AS co_parent_id,
  u.id AS user_id,
  r.room_id,
  r.status,
  r.created_at
FROM co_parent_relationships r
CROSS JOIN users u
WHERE u.id = r.user_a_id OR u.id = r.user_b_id;

COMMENT ON TABLE co_parent_relationships IS 'Bidirectional co-parent relationships with room references';
COMMENT ON COLUMN co_parent_relationships.user_a_id IS 'First user ID (always < user_b_id)';
COMMENT ON COLUMN co_parent_relationships.user_b_id IS 'Second user ID (always > user_a_id)';
COMMENT ON COLUMN co_parent_relationships.status IS 'active, paused, ended';
```

---

## API Response Changes

### POST /api/auth/register-with-invite

**New Response Structure:**

```json
{
  "success": true,
  "user": {
    "id": 123,
    "username": "john_abc123",
    "email": "john@example.com",
    "displayName": "John Doe"
  },
  "coParent": {
    "id": 456,
    "displayName": "Jane Doe",
    "emailDomain": "gmail"
  },
  "room": {
    "id": "room_abc123",
    "name": "John & Jane"
  },
  "sync": {
    "contactsCreated": true,
    "roomJoined": true,
    "notificationSent": true
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "REG_006",
    "message": "Could not complete co-parent connection",
    "details": "Contact creation failed."
  }
}
```

### GET /api/invitations/validate/:token

**Enhanced Response:**

```json
{
  "valid": true,
  "inviterName": "Jane Doe",
  "inviterEmailDomain": "gmail",
  "inviterJoinedDate": "2024-01-15",
  "expiresAt": "2025-12-01T00:00:00Z",
  "isOpenInvite": false,
  "invitationType": "coparent"
}
```

---

## Design System Compliance

Per LiaiZen design patterns:

| Element                | Value                          |
| ---------------------- | ------------------------------ |
| Primary Color          | `#275559`                      |
| Success Color          | `#6dd4b0`                      |
| Error Background       | `bg-red-50`                    |
| Button Shape           | `rounded-lg` (squoval)         |
| Min Touch Target       | `min-h-[44px]`                 |
| Card Style             | `bg-white/80` with border      |
| Font Weight (Headings) | `font-semibold` or `font-bold` |

---

## Testing Checklist

### Unit Tests

- [ ] `createUserWithUniqueUsername` generates unique usernames
- [ ] `getDisambiguatedDisplay` adds email domain when needed
- [ ] Transaction rollback works on failure
- [ ] Contact creation uses correct schema

### Integration Tests

- [ ] Full registration flow with token invitation
- [ ] Full registration flow with short code
- [ ] Existing user accepting invitation
- [ ] Concurrent username generation
- [ ] Room creation failure triggers rollback

### Manual Tests

1. **Happy Path - Token Invite**
   - User A creates invitation
   - User B clicks link, registers
   - Both see each other in contacts
   - Both in shared room

2. **Happy Path - Short Code**
   - User A generates code
   - User B enters code at /accept-invite
   - Confirms inviter identity
   - Registers and connects

3. **Error Handling**
   - Expired invitation shows clear message
   - Already-used invitation handled gracefully
   - Network error shows retry option

4. **Disambiguation**
   - Two users named "John Smith"
   - Both distinguishable in contacts
   - Profile shows email for clarity

---

## Implementation Order

1. **Phase 1** - Contact schema fix (30 min)
   - Update `auth.js` in 3 locations
   - Test contact creation

2. **Phase 2** - Transaction wrapper (2 hours)
   - Add transaction functions to `dbSafe.js`
   - Update `registerFromInvitation` and `registerFromShortCode`
   - Add error codes

3. **Phase 3** - Username generation fix (1 hour)
   - Replace loop with atomic insert
   - Add retry logic

4. **Phase 4** - Display name disambiguation (1 hour)
   - Add helper function
   - Update `ContactsPanel.jsx`
   - Update `ProfilePanel.jsx`

5. **Phase 5** - UI improvements (2 hours)
   - Show inviter info
   - Add confirmation step for short codes
   - Better error states
   - Success animation

6. **Phase 6** - Migration and cleanup (30 min)
   - Add `005_co_parent_relationships.sql`
   - Run tests
   - Deploy

---

## Validation Checklist

- [x] Follows architecture from Codebase Context (Express + PostgreSQL + React)
- [x] Uses existing patterns (`dbSafe`, parameterized queries)
- [x] Uses design tokens (colors, spacing, button styles)
- [x] References existing API patterns (JWT auth, JSON responses)
- [x] Mobile-first design (44px touch targets)
- [x] Domain compliance (co-parenting best practices)

---

_Plan created: 2025-11-25_
_Based on Specification: 005-user-account-invite-flow_
