# Data Model: Account Pairing Flow Refactor

**Feature**: 004-account-pairing-refactor
**Date**: 2025-11-27
**Constitutional Compliance**: Library-First, Contract-First, Idempotent Operations

## Overview

This data model defines the unified pairing system that replaces the dual-table architecture (`pending_connections` + `room_invites`) with a single `pairing_sessions` table. The model supports multiple pairing methods (email, link, code), mutual invitation detection, and atomic pairing operations.

---

## New Tables

### pairing_sessions

**Purpose**: Unified storage for all co-parent pairing attempts, regardless of invitation method.

**Schema (PostgreSQL)**:
```sql
CREATE TABLE pairing_sessions (
  id SERIAL PRIMARY KEY,

  -- Unique pairing code (LZ-NNNNNN format)
  pairing_code VARCHAR(10) UNIQUE NOT NULL,

  -- Participants
  parent_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_b_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_b_email TEXT,

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- Values: pending | active | canceled | expired

  -- Invitation metadata
  invite_type VARCHAR(20) NOT NULL,
  -- Values: email | link | code

  invite_token TEXT UNIQUE,
  -- Secure token for link-based invites (32+ bytes hex)

  invited_by_username TEXT,
  -- For display purposes in UI

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Associated data
  shared_room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,

  -- Constraints
  CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
  CHECK (invite_type IN ('email', 'link', 'code')),
  CHECK (parent_a_id != parent_b_id OR parent_b_id IS NULL)
);
```

**Schema (SQLite)**:
```sql
CREATE TABLE IF NOT EXISTS pairing_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pairing_code TEXT UNIQUE NOT NULL,
  parent_a_id INTEGER NOT NULL,
  parent_b_id INTEGER,
  parent_b_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  invite_type TEXT NOT NULL,
  invite_token TEXT UNIQUE,
  invited_by_username TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  shared_room_id TEXT,
  FOREIGN KEY (parent_a_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_b_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
  CHECK (invite_type IN ('email', 'link', 'code'))
);
```

**Indexes**:
```sql
CREATE INDEX idx_pairing_parent_a ON pairing_sessions(parent_a_id);
CREATE INDEX idx_pairing_parent_b ON pairing_sessions(parent_b_id);
CREATE INDEX idx_pairing_email ON pairing_sessions(parent_b_email);
CREATE INDEX idx_pairing_code ON pairing_sessions(pairing_code);
CREATE INDEX idx_pairing_token ON pairing_sessions(invite_token);
CREATE INDEX idx_pairing_status ON pairing_sessions(status);
CREATE INDEX idx_pairing_expires ON pairing_sessions(expires_at);
```

**Field Descriptions**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | INTEGER/SERIAL | NO | Primary key |
| `pairing_code` | VARCHAR(10)/TEXT | NO | Human-readable code (LZ-842396) |
| `parent_a_id` | INTEGER | NO | User ID who created the pairing |
| `parent_b_id` | INTEGER | YES | User ID who accepted (NULL until accepted) |
| `parent_b_email` | TEXT | YES | Email of invitee (for email invitations) |
| `status` | VARCHAR(20)/TEXT | NO | Current status: pending/active/canceled/expired |
| `invite_type` | VARCHAR(20)/TEXT | NO | How pairing was initiated: email/link/code |
| `invite_token` | TEXT | YES | Secure token for link-based invites (hashed) |
| `invited_by_username` | TEXT | YES | Display name for UI ("Join [Name] on LiaiZen") |
| `created_at` | TIMESTAMP/TEXT | NO | When pairing was created |
| `expires_at` | TIMESTAMP/TEXT | NO | When pairing expires (7 days email/link, 15 min code) |
| `accepted_at` | TIMESTAMP/TEXT | YES | When pairing was accepted |
| `shared_room_id` | TEXT | YES | ID of shared chat room (created on acceptance) |

**Status State Machine**:
```
pending → active   (when accepted)
pending → expired  (when expires_at < now)
pending → canceled (when inviter cancels)
active  → (terminal state, no transitions)
```

**Invite Type Differences**:

| invite_type | parent_b_email | invite_token | expires_at |
|-------------|----------------|--------------|------------|
| `email` | Required | Generated | 7 days |
| `link` | Optional | Generated | 7 days |
| `code` | NULL | NULL | 15 minutes |

---

### pairing_audit_log

**Purpose**: Comprehensive audit trail for all pairing operations (legal/custody compliance).

**Schema (PostgreSQL)**:
```sql
CREATE TABLE pairing_audit_log (
  id SERIAL PRIMARY KEY,
  pairing_session_id INTEGER REFERENCES pairing_sessions(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  -- Values: created | accepted | declined | canceled | expired

  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

**Schema (SQLite)**:
```sql
CREATE TABLE IF NOT EXISTS pairing_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pairing_session_id INTEGER,
  action TEXT NOT NULL,
  actor_user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT,
  FOREIGN KEY (pairing_session_id) REFERENCES pairing_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Indexes**:
```sql
CREATE INDEX idx_audit_pairing ON pairing_audit_log(pairing_session_id);
CREATE INDEX idx_audit_timestamp ON pairing_audit_log(timestamp DESC);
CREATE INDEX idx_audit_actor ON pairing_audit_log(actor_user_id);
```

**Field Descriptions**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | INTEGER/SERIAL | NO | Primary key |
| `pairing_session_id` | INTEGER | YES | Reference to pairing session |
| `action` | VARCHAR(50)/TEXT | NO | Action taken: created/accepted/declined/canceled/expired |
| `actor_user_id` | INTEGER | YES | User who performed the action |
| `ip_address` | INET/TEXT | YES | IP address of actor (for security) |
| `user_agent` | TEXT | YES | Browser/device of actor |
| `timestamp` | TIMESTAMP/TEXT | NO | When action occurred |
| `metadata` | JSONB/TEXT | YES | Additional context (JSON) |

**Example Audit Entry**:
```json
{
  "pairing_session_id": 123,
  "action": "accepted",
  "actor_user_id": 456,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2025-11-27T12:34:56Z",
  "metadata": {
    "method": "email_link",
    "room_created": "room_xyz789",
    "contacts_created": 2
  }
}
```

---

## Modified Tables

### users

**Changes**: No schema changes, but extended usage.

**Relevant Fields**:
- `id`: Referenced by pairing_sessions.parent_a_id and parent_b_id
- `email`: Used for mutual invitation detection (case-insensitive)
- `username`: Copied to pairing_sessions.invited_by_username

**Validation Rules**:
- Email must be unique (case-insensitive)
- Email format validated on backend

---

### rooms

**Changes**: No schema changes, reused for shared rooms.

**Relevant Fields**:
- `id`: Referenced by pairing_sessions.shared_room_id
- `name`: Set to "Co-Parent Chat" on pairing acceptance
- `is_private`: Always 1 for co-parent rooms
- `created_by`: Set to parent_a_id

**Creation Logic**:
```javascript
// On pairing acceptance
const roomId = `room_${crypto.randomBytes(8).toString('hex')}`;
await db.query(
  'INSERT INTO rooms (id, name, created_by, is_private) VALUES ($1, $2, $3, $4)',
  [roomId, 'Co-Parent Chat', parentAId, 1]
);

// Add both parents as members
await db.query(
  'INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3), ($4, $5, $6)',
  [roomId, parentAId, 'admin', roomId, parentBId, 'admin']
);
```

---

### contacts

**Changes**: No schema changes, created on pairing acceptance.

**Relevant Fields**:
- `user_id`: User who owns the contact
- `contact_name`: Partner's username
- `contact_email`: Partner's email
- `relationship`: Set to "co-parent"

**Creation Logic**:
```javascript
// Create mutual contacts on pairing acceptance
await db.query(
  `INSERT INTO contacts (user_id, contact_name, contact_email, relationship)
   VALUES ($1, $2, $3, 'co-parent'), ($4, $5, $6, 'co-parent')`,
  [parentAId, userBName, userBEmail, parentBId, userAName, userAEmail]
);
```

---

## Deprecated Tables

### pending_connections

**Status**: DEPRECATED - Migrated to pairing_sessions

**Migration Strategy**:
```sql
-- Step 1: Migrate existing pending invitations
INSERT INTO pairing_sessions (
  pairing_code, parent_a_id, parent_b_email, parent_b_id,
  status, invite_type, invite_token, created_at, expires_at, accepted_at
)
SELECT
  CONCAT('LZ-', LPAD(CAST((id % 1000000) AS VARCHAR), 6, '0')),
  inviter_id,
  invitee_email,
  NULL, -- parent_b_id set in step 2
  status,
  'email',
  token,
  created_at,
  expires_at,
  accepted_at
FROM pending_connections
WHERE status = 'pending' AND expires_at > CURRENT_TIMESTAMP;

-- Step 2: Link accepted connections to parent_b_id
UPDATE pairing_sessions ps
SET parent_b_id = u.id, status = 'active'
FROM pending_connections pc
INNER JOIN users u ON LOWER(u.email) = LOWER(pc.invitee_email)
WHERE ps.invite_token = pc.token AND pc.status = 'accepted';

-- Step 3: After 30 days, drop table
-- DROP TABLE pending_connections;
```

**Backward Compatibility Layer**:
```javascript
// In GET /api/pairing/status
async function getPairingStatus(userId) {
  // Check new table first
  let pairing = await db.query(
    'SELECT * FROM pairing_sessions WHERE (parent_a_id = $1 OR parent_b_id = $1) AND status = $2',
    [userId, 'active']
  );

  if (pairing.rows.length > 0) return pairing.rows[0];

  // Fallback to old table (30-day transition period)
  let oldPending = await db.query(
    'SELECT * FROM pending_connections WHERE inviter_id = $1 AND status = $2',
    [userId, 'pending']
  );

  if (oldPending.rows.length > 0) {
    // Auto-migrate old invitation to new table
    await migrateOldInvitation(oldPending.rows[0]);
  }

  return null;
}
```

---

### room_invites

**Status**: EVALUATE - May keep for other features

**Analysis**:
- Currently used for room-level invitations (not co-parent pairing)
- May be useful for group rooms, family member invitations
- Decision: Keep table, do NOT deprecate
- Refactor: Ensure clear separation from pairing_sessions

---

## Entity Relationships

```
users (1) ──┬── (0..1) pairing_sessions (as parent_a)
            └── (0..1) pairing_sessions (as parent_b)

pairing_sessions (1) ── (0..1) rooms (shared_room)

pairing_sessions (1) ── (N) pairing_audit_log

users (1) ── (N) contacts

rooms (1) ── (N) room_members ── (1) users
```

**Cardinality Rules**:
- A user can be parent_a in at most 1 active pairing (co-parent limit)
- A user can be parent_b in at most 1 active pairing (co-parent limit)
- A pairing creates exactly 1 shared room on acceptance
- A pairing creates exactly 2 mutual contacts on acceptance
- A pairing can have many audit log entries

---

## Data Validation Rules

### Pairing Creation

**Server-Side**:
```javascript
// Validation rules for POST /api/pairing/create
{
  inviteType: {
    required: true,
    enum: ['email', 'link', 'code']
  },
  inviteeEmail: {
    required: inviteType === 'email',
    format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    transform: (email) => email.toLowerCase().trim()
  }
}

// Business logic validation
async function validatePairingCreation(inviterId, inviteeEmail) {
  // 1. Check co-parent limit (MVP: 1)
  const existingPairing = await db.query(
    `SELECT id FROM pairing_sessions
     WHERE (parent_a_id = $1 OR parent_b_id = $1) AND status = 'active'`,
    [inviterId]
  );
  if (existingPairing.rows.length > 0) {
    throw new Error('COPARENT_LIMIT_REACHED');
  }

  // 2. Check for existing active invitation
  const existingInvite = await db.query(
    `SELECT id FROM pairing_sessions
     WHERE parent_a_id = $1 AND LOWER(parent_b_email) = LOWER($2) AND status = 'pending'`,
    [inviterId, inviteeEmail]
  );
  if (existingInvite.rows.length > 0) {
    throw new Error('INVITATION_ALREADY_EXISTS');
  }

  // 3. Check for mutual invitation (auto-pair if found)
  const mutualInvite = await detectMutualInvitation(inviterId, inviteeEmail);
  if (mutualInvite) {
    return autoCompleteMutualPairing(inviterId, mutualInvite);
  }
}
```

### Pairing Acceptance

**Server-Side**:
```javascript
// Validation rules for POST /api/pairing/accept
{
  pairingCode: {
    required: true,
    format: /^LZ-\d{6}$/
  }
}

// Business logic validation
async function validatePairingAcceptance(pairingCode, acceptingUserId) {
  // 1. Lock row to prevent concurrent acceptance
  const pairing = await db.query(
    `SELECT * FROM pairing_sessions
     WHERE pairing_code = $1 AND status = 'pending' AND expires_at > NOW()
     FOR UPDATE`,
    [pairingCode]
  );

  if (pairing.rows.length === 0) {
    throw new Error('PAIRING_NOT_FOUND_OR_EXPIRED');
  }

  // 2. Validate email match (for email invitations)
  if (pairing.rows[0].parent_b_email) {
    const acceptingUser = await db.query(
      'SELECT email FROM users WHERE id = $1',
      [acceptingUserId]
    );
    if (acceptingUser.rows[0].email.toLowerCase() !== pairing.rows[0].parent_b_email.toLowerCase()) {
      throw new Error('EMAIL_MISMATCH');
    }
  }

  // 3. Check accepting user doesn't already have a co-parent
  const existingPairing = await db.query(
    `SELECT id FROM pairing_sessions
     WHERE (parent_a_id = $1 OR parent_b_id = $1) AND status = 'active'`,
    [acceptingUserId]
  );
  if (existingPairing.rows.length > 0) {
    throw new Error('ALREADY_PAIRED');
  }
}
```

---

## Performance Considerations

### Index Strategy

**Query Patterns**:
1. Find active pairing for user: `WHERE (parent_a_id = ? OR parent_b_id = ?) AND status = 'active'`
   - Index: idx_pairing_parent_a, idx_pairing_parent_b, idx_pairing_status

2. Find pending invitations by email: `WHERE LOWER(parent_b_email) = LOWER(?) AND status = 'pending'`
   - Index: idx_pairing_email, idx_pairing_status

3. Validate pairing code: `WHERE pairing_code = ? AND status = 'pending' AND expires_at > NOW()`
   - Index: idx_pairing_code, idx_pairing_status, idx_pairing_expires

**Optimization**:
- Composite index for common queries: `(status, parent_a_id)`
- Partial index for active pairings: `WHERE status = 'active'`
- B-tree indexes for timestamp range queries

### Caching Strategy

**Redis Cache** (optional, for scale):
```javascript
// Cache active pairing status (5-minute TTL)
const cacheKey = `pairing:status:${userId}`;
let status = await redis.get(cacheKey);

if (!status) {
  status = await getPairingStatusFromDB(userId);
  await redis.setex(cacheKey, 300, JSON.stringify(status));
}
```

**Invalidation**:
- Invalidate on pairing acceptance, cancellation, expiration
- Invalidate both users' cache keys on mutual pairing

---

## Migration Timeline

**Week 1**: Database Schema
- [x] Create migration script (008_pairing_sessions.sql)
- [x] Test in SQLite (development)
- [ ] Test in PostgreSQL (staging)
- [ ] Deploy to production

**Week 2**: Backward Compatibility
- [ ] Implement dual-read in status endpoint
- [ ] Auto-migration on user login
- [ ] Migration notice banner

**Week 3**: Monitoring
- [ ] Monitor migration success rate
- [ ] Identify unmigrated users
- [ ] Manual migration assistance if needed

**Week 4+**: Cleanup (30 days after deployment)
- [ ] Verify 100% migration completion
- [ ] Remove backward compatibility layer
- [ ] Drop pending_connections table
- [ ] Remove deprecated code

---

*Data Model for coparentliaizen.com - Better Co-Parenting Through Better Communication*
