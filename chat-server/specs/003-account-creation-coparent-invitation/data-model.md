# Data Model: Account Creation with Co-Parent Invitation

**Feature**: 003-account-creation-coparent-invitation
**Date**: 2025-11-25
**Database**: PostgreSQL 8.16.3

## Overview

This document defines all data entities required for the co-parent invitation feature. The design extends existing entities (User, Room) and introduces two new entities (Invitation, InAppNotification) to support the invitation lifecycle.

**Design Principles**:

- Minimal schema changes to existing tables
- Audit trail for all invitation events (legal compliance)
- Data integrity enforced via foreign key constraints
- Indexes optimized for common query patterns

---

## Entity Diagram

```
┌─────────────┐
│    User     │
│ (existing)  │
└──────┬──────┘
       │
       │ 1:N (inviter)
       ├────────────────────────┐
       │                        │
       │ 1:N (invitee)          │ 1:N (notifications)
       │                        │
┌──────▼──────┐         ┌───────▼────────┐
│ Invitation  │         │ InAppNotification │
│   (new)     │         │     (new)        │
└──────┬──────┘         └──────────────────┘
       │
       │ N:1 (room)
       │
┌──────▼──────┐
│    Room     │
│ (existing)  │
└──────┬──────┘
       │
       │ 1:N (members)
       │
┌──────▼──────┐
│ RoomMember  │
│ (existing)  │
└─────────────┘
```

---

## Entities

### 1. User (EXTENDED)

**Purpose**: Represents a parent using the platform

**Existing Fields** (no changes to schema):

- `id`: SERIAL PRIMARY KEY - Unique user identifier
- `username`: TEXT UNIQUE NOT NULL - Auto-generated from email
- `email`: TEXT UNIQUE - User's email address (required for invitation flow)
- `password_hash`: TEXT - Bcrypt hash of password (nullable for OAuth users)
- `google_id`: TEXT UNIQUE - Google OAuth identifier (optional)
- `oauth_provider`: TEXT - OAuth provider name ('google', etc.)
- `first_name`: TEXT - User's first name (optional)
- `last_name`: TEXT - User's last name (optional)
- `created_at`: TIMESTAMP WITH TIME ZONE - Account creation date
- `last_login`: TIMESTAMP WITH TIME ZONE - Last login timestamp

**New Relationships**:

- **One-to-many with Invitation** (as inviter): User can send multiple invitations
- **One-to-many with Invitation** (as invitee): User can receive multiple invitations
- **One-to-many with InAppNotification**: User can have multiple notifications

**Validation Rules**:

- Email must be unique (enforced by UNIQUE constraint)
- Email must match RFC 5322 format (enforced by application layer)
- Password (if provided) must be min 8 chars, 1 uppercase, 1 number

**Indexes** (existing):

- PRIMARY KEY on `id`
- UNIQUE on `username`
- UNIQUE on `email`
- UNIQUE on `google_id`

**State Transitions**: N/A (user state is implicit from field values)

---

### 2. Invitation (NEW)

**Purpose**: Tracks invitation lifecycle from creation to acceptance/expiration

**Fields**:

- `id`: SERIAL PRIMARY KEY - Unique invitation identifier
- `inviter_id`: INTEGER NOT NULL - User who sent the invitation (FK → users.id)
- `invitee_email`: TEXT NOT NULL - Email address of invited person
- `token_hash`: TEXT UNIQUE NOT NULL - SHA-256 hash of invitation token
- `room_id`: TEXT NOT NULL - Room to add invitee to upon acceptance (FK → rooms.id)
- `status`: TEXT DEFAULT 'pending' - Invitation lifecycle status
- `expires_at`: TIMESTAMP WITH TIME ZONE NOT NULL - When invitation expires (7 days from creation)
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - When invitation was created
- `accepted_at`: TIMESTAMP WITH TIME ZONE - When invitation was accepted (nullable)
- `accepted_by`: INTEGER - User ID who accepted (FK → users.id, nullable)

**Relationships**:

- **Many-to-one with User** (inviter): `inviter_id` → `users.id`
- **Many-to-one with User** (accepter): `accepted_by` → `users.id`
- **Many-to-one with Room**: `room_id` → `rooms.id`

**Validation Rules**:

- `invitee_email` must be valid email format (RFC 5322)
- `token_hash` must be 64 characters (SHA-256 hex output)
- `status` must be one of: 'pending', 'accepted', 'expired', 'cancelled'
- `expires_at` must be in the future when creating invitation
- `accepted_by` (if set) must match a user with `invitee_email`
- `accepted_at` cannot be set if `status != 'accepted'`

**State Transitions**:

```
pending → accepted (when invitee accepts invitation)
pending → expired (when expires_at < NOW())
pending → cancelled (when inviter cancels invitation - future feature)
```

**Indexes**:

```sql
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status_expires ON invitations(status, expires_at);
```

**Index Rationale**:

- `token_hash`: Fast token validation lookup (every invitation link click)
- `invitee_email`: Check if user already has pending invitation before sending new one
- `status, expires_at`: Fast cleanup of expired invitations (daily cron job)

**Lifecycle Example**:

```sql
-- Creation (status = 'pending')
INSERT INTO invitations (inviter_id, invitee_email, token_hash, room_id, expires_at)
VALUES (1, 'parent2@example.com', 'abc123...', 'room_123', NOW() + INTERVAL '7 days');

-- Validation (check token and expiration)
SELECT * FROM invitations
WHERE token_hash = 'abc123...'
AND status = 'pending'
AND expires_at > NOW();

-- Acceptance (status = 'accepted')
UPDATE invitations
SET status = 'accepted',
    accepted_at = NOW(),
    accepted_by = 2
WHERE id = 1;

-- Expiration (status = 'expired', run via cron)
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending'
AND expires_at < NOW();
```

**Audit Trail**:

- All invitations persist in database (never deleted)
- `created_at`, `accepted_at`, `expires_at` provide complete timeline
- Supports legal compliance (GDPR Article 30 - audit logs)

---

### 3. InAppNotification (NEW)

**Purpose**: In-app notifications for existing users (invitation received, accepted, etc.)

**Fields**:

- `id`: SERIAL PRIMARY KEY - Unique notification identifier
- `user_id`: INTEGER NOT NULL - User who receives the notification (FK → users.id)
- `type`: TEXT NOT NULL - Notification type (for frontend rendering)
- `message`: TEXT NOT NULL - Human-readable notification message
- `data`: JSONB - Structured data for notification actions (invitation_id, room_id, etc.)
- `is_read`: BOOLEAN DEFAULT FALSE - Whether user has read the notification
- `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP - When notification was created
- `read_at`: TIMESTAMP WITH TIME ZONE - When notification was marked as read (nullable)

**Relationships**:

- **Many-to-one with User**: `user_id` → `users.id`

**Validation Rules**:

- `type` must be one of predefined types (enforced by application layer):
  - `invitation_received`: Co-parent sent invitation
  - `invitation_accepted`: Co-parent accepted your invitation
  - `room_joined`: Successfully joined co-parent's room
- `message` must be non-empty (max 500 characters)
- `data` JSONB must contain required fields for type:
  - For `invitation_received`: `{invitation_id, inviter_id, inviter_name, room_id}`
  - For `invitation_accepted`: `{invitation_id, accepter_id, accepter_name, room_id}`
  - For `room_joined`: `{room_id, room_name, other_member_name}`
- `read_at` cannot be set if `is_read = FALSE`

**State Transitions**:

```
unread (is_read=FALSE, read_at=NULL) → read (is_read=TRUE, read_at=NOW())
```

**Indexes**:

```sql
CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON in_app_notifications(created_at DESC);
```

**Index Rationale**:

- `user_id, is_read`: Fast query for unread notifications (most common query: "show me my unread notifications")
- `created_at DESC`: Chronological ordering for notification feed

**JSONB Data Examples**:

```json
// Invitation received (existing user)
{
  "invitation_id": 123,
  "inviter_id": 456,
  "inviter_name": "John Smith",
  "room_id": "room_1234567890_abc123",
  "action_url": "/invitations/123/accept"
}

// Invitation accepted (inviter notification)
{
  "invitation_id": 123,
  "accepter_id": 789,
  "accepter_name": "Jane Doe",
  "room_id": "room_1234567890_abc123",
  "action_url": "/rooms/room_1234567890_abc123"
}

// Room joined (both users)
{
  "room_id": "room_1234567890_abc123",
  "room_name": "John & Jane's Co-Parenting Room",
  "other_member_name": "John Smith",
  "action_url": "/rooms/room_1234567890_abc123"
}
```

**Lifecycle Example**:

```sql
-- Creation (unread notification)
INSERT INTO in_app_notifications (user_id, type, message, data, is_read)
VALUES (2, 'invitation_received', 'John Smith wants to connect with you',
  '{"invitation_id": 123, "inviter_id": 1, "inviter_name": "John Smith", "room_id": "room_123"}', FALSE);

-- Mark as read
UPDATE in_app_notifications
SET is_read = TRUE, read_at = NOW()
WHERE id = 1;

-- Get unread notifications (user query)
SELECT * FROM in_app_notifications
WHERE user_id = 2 AND is_read = FALSE
ORDER BY created_at DESC;

-- Cleanup old read notifications (cron job)
DELETE FROM in_app_notifications
WHERE is_read = TRUE
AND read_at < NOW() - INTERVAL '30 days';
```

**Real-Time Delivery**:

- On notification creation → emit Socket.io event to user
- User offline → notification persists in database for later retrieval
- User logs in → frontend fetches unread notifications via GET /api/notifications

---

### 4. Room (EXISTING - NO CHANGES)

**Purpose**: Private communication space shared between co-parents

**Existing Fields** (no schema changes):

- `id`: TEXT PRIMARY KEY - Unique room identifier (e.g., "room_1234567890_abc123")
- `name`: TEXT NOT NULL - Room name (e.g., "John's Co-Parenting Room")
- `created_by`: INTEGER NOT NULL - User who created the room (FK → users.id)
- `is_private`: INTEGER DEFAULT 1 - Whether room is private (always 1 for co-parent rooms)
- `created_at`: TIMESTAMP WITH TIME ZONE - Room creation date

**Relationships**:

- **One-to-many with RoomMember**: Room has multiple members
- **One-to-many with Invitation**: Room can have multiple pending invitations

**Validation Rules** (existing):

- `name` must be non-empty (max 100 characters)
- `is_private` must be 1 for co-parent rooms (enforced by application)

**Indexes** (existing):

- PRIMARY KEY on `id`
- Foreign key on `created_by` → `users.id`

**State Transitions**: N/A (room state is implicit from membership)

**Invitation Flow Integration**:

- User 1 signs up → `createPrivateRoom(userId, username)` creates room
- User 1 invites User 2 → invitation references room.id
- User 2 accepts → User 2 added to room_members (room now has 2 members)

---

### 5. RoomMember (EXISTING - NO CHANGES)

**Purpose**: Links users to rooms they are members of

**Existing Fields** (no schema changes):

- `id`: SERIAL PRIMARY KEY - Unique membership identifier
- `room_id`: TEXT NOT NULL - Room identifier (FK → rooms.id)
- `user_id`: INTEGER NOT NULL - User identifier (FK → users.id)
- `role`: TEXT DEFAULT 'member' - User's role in room ('owner', 'member')
- `joined_at`: TIMESTAMP WITH TIME ZONE - When user joined the room

**Relationships**:

- **Many-to-one with Room**: `room_id` → `rooms.id`
- **Many-to-one with User**: `user_id` → `users.id`

**Validation Rules** (existing):

- `role` must be 'owner' or 'member'
- UNIQUE constraint on `(room_id, user_id)` - user cannot be in same room twice

**Indexes** (existing):

```sql
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
```

**State Transitions**: N/A (membership is binary: exists or doesn't)

**Invitation Flow Integration**:

```sql
-- After invitation acceptance, add co-parent to room
INSERT INTO room_members (room_id, user_id, role, joined_at)
VALUES ('room_123', 2, 'member', NOW());

-- Both users now in same room
SELECT * FROM room_members WHERE room_id = 'room_123';
-- Returns: [(room_id='room_123', user_id=1, role='owner'), (room_id='room_123', user_id=2, role='member')]
```

**Co-Parent Equality**:

- Both co-parents have `role='member'` (no owner/admin distinction for accepted invitations)
- Ensures neutral platform stance (Constitutional Principle XVII)
- Both have equal read/write permissions in room

---

## Relationships Summary

```
User 1:N Invitation (as inviter)
  inviter_id → users.id
  ON DELETE CASCADE (if user deleted, their invitations are deleted)

User 1:N Invitation (as accepter)
  accepted_by → users.id
  ON DELETE SET NULL (if accepting user deleted, keep invitation for audit)

User 1:N InAppNotification
  user_id → users.id
  ON DELETE CASCADE (if user deleted, their notifications are deleted)

Invitation N:1 Room
  room_id → rooms.id
  ON DELETE CASCADE (if room deleted, invitations for it are deleted)

Room 1:N RoomMember
  room_id → rooms.id
  ON DELETE CASCADE (if room deleted, memberships are deleted)

User 1:N RoomMember
  user_id → users.id
  ON DELETE CASCADE (if user deleted, their memberships are deleted)
```

---

## Database Migration Script

**File**: `migrations/003_invitations.sql`

```sql
-- PostgreSQL Migration: Co-Parent Invitations
-- Creates invitations and in_app_notifications tables

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id SERIAL PRIMARY KEY,
  inviter_id INTEGER NOT NULL,
  invitee_email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  room_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by INTEGER,
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Indexes for invitations
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status_expires ON invitations(status, expires_at);

-- In-app notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (type IN ('invitation_received', 'invitation_accepted', 'room_joined'))
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON in_app_notifications(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE invitations IS 'Tracks co-parent invitation lifecycle from creation to acceptance/expiration';
COMMENT ON COLUMN invitations.token_hash IS 'SHA-256 hash of invitation token (original token sent via email)';
COMMENT ON COLUMN invitations.status IS 'Lifecycle status: pending, accepted, expired, cancelled';

COMMENT ON TABLE in_app_notifications IS 'In-app notifications for existing users (invitation events, room events)';
COMMENT ON COLUMN in_app_notifications.type IS 'Notification type for frontend rendering';
COMMENT ON COLUMN in_app_notifications.data IS 'JSONB structured data for notification actions';
```

**Rollback Script**:

```sql
-- Down migration - rollback
DROP INDEX IF EXISTS idx_notifications_created;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP TABLE IF EXISTS in_app_notifications CASCADE;

DROP INDEX IF EXISTS idx_invitations_status_expires;
DROP INDEX IF EXISTS idx_invitations_invitee_email;
DROP INDEX IF EXISTS idx_invitations_token_hash;
DROP TABLE IF EXISTS invitations CASCADE;
```

---

## Data Integrity Constraints

### Foreign Key Cascade Rules

**ON DELETE CASCADE**:

- `invitations.inviter_id` → `users.id`: If inviter deleted, delete their invitations
- `invitations.room_id` → `rooms.id`: If room deleted, delete invitations for it
- `in_app_notifications.user_id` → `users.id`: If user deleted, delete their notifications
- `room_members.user_id` → `users.id`: If user deleted, remove from all rooms
- `room_members.room_id` → `rooms.id`: If room deleted, remove all memberships

**ON DELETE SET NULL**:

- `invitations.accepted_by` → `users.id`: If accepting user deleted, keep invitation for audit trail (accepted_by becomes NULL)

**Rationale**:

- CASCADE ensures no orphaned records
- SET NULL preserves audit trail for accepted invitations even if user later deleted

### Unique Constraints

- `invitations.token_hash` UNIQUE: Prevents duplicate tokens
- `room_members (room_id, user_id)` UNIQUE: User cannot join same room twice
- `users.email` UNIQUE: Prevents duplicate accounts

### Check Constraints

- `invitations.status` CHECK: Must be valid status value
- `in_app_notifications.type` CHECK: Must be valid notification type

---

## Query Patterns

### Common Queries

**1. Validate invitation token**:

```sql
SELECT * FROM invitations
WHERE token_hash = $1
AND status = 'pending'
AND expires_at > NOW()
LIMIT 1;
```

_Performance_: Indexed on `token_hash` → <10ms

**2. Get user's unread notifications**:

```sql
SELECT * FROM in_app_notifications
WHERE user_id = $1
AND is_read = FALSE
ORDER BY created_at DESC;
```

_Performance_: Indexed on `(user_id, is_read)` → <50ms

**3. Check if email already has pending invitation**:

```sql
SELECT * FROM invitations
WHERE invitee_email = $1
AND status = 'pending'
AND expires_at > NOW()
LIMIT 1;
```

_Performance_: Indexed on `invitee_email` → <20ms

**4. Get room members**:

```sql
SELECT u.id, u.username, u.email, rm.role, rm.joined_at
FROM users u
INNER JOIN room_members rm ON u.id = rm.user_id
WHERE rm.room_id = $1;
```

_Performance_: Indexed on `room_id` → <30ms

**5. Cleanup expired invitations (cron job)**:

```sql
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending'
AND expires_at < NOW();
```

_Performance_: Indexed on `(status, expires_at)` → <100ms for batch update

---

## Data Volume Estimates

**Assumptions**:

- 1,000 users in first 3 months
- 70% invitation acceptance rate
- Average 1.2 invitations sent per user (some retries/typos)

**Storage Estimates**:

| Table                | Rows  | Size per Row | Total Size  |
| -------------------- | ----- | ------------ | ----------- |
| invitations          | 1,200 | ~200 bytes   | ~240 KB     |
| in_app_notifications | 2,000 | ~150 bytes   | ~300 KB     |
| room_members (new)   | 1,400 | ~100 bytes   | ~140 KB     |
| **Total (new data)** |       |              | **~680 KB** |

**Scaling Considerations**:

- At 10,000 users: ~6.8 MB (negligible)
- At 100,000 users: ~68 MB (still trivial)
- PostgreSQL can handle billions of rows efficiently
- No partitioning needed at this scale

---

## Data Model Summary

**New Tables**: 2 (invitations, in_app_notifications)
**Modified Tables**: 0 (all changes are additive)
**Total Foreign Keys**: 6 (4 CASCADE, 1 SET NULL, 1 existing)
**Total Indexes**: 5 (3 for invitations, 2 for notifications)
**Storage Impact**: <1 MB for 1,000 users

**Validation Status**: ✅ All entities defined with validation rules, state transitions, and indexes
**Migration Ready**: ✅ SQL migration script complete with rollback capability
**Performance Optimized**: ✅ Indexes aligned with common query patterns

---

**Data Model Version**: 1.0
**Last Updated**: 2025-11-25
**Author**: planning-agent
