# Database Constraints

**Backend Truth** - Complete reference of all database constraints, check constraints, unique constraints, and foreign keys.

## Overview

This document centralizes all database constraints for the LiaiZen PostgreSQL database. These constraints are enforced at the database level and must be validated in application code before database operations.

---

## CHECK Constraints

### room_members.role

**Constraint Name**: `chk_room_members_role`

**Table**: `room_members`

**Column**: `role`

**Definition**:
```sql
CHECK (role IN ('owner', 'member', 'readonly'))
```

**Allowed Values**:
- `'owner'` - Room creator, full control
- `'member'` - Co-parent member, full access
- `'readonly'` - Read-only access (future use)

**Migration**: `023_schema_normalization.sql:86`

**Error Code**: `23514` (check_violation)

**Application Validation**: Always validate role before database operations

**Related Doc**: `chat-server/docs/room-membership.md`

---

### room_invites.status

**Constraint Name**: `chk_room_invites_status`

**Table**: `room_invites`

**Column**: `status`

**Definition**:
```sql
CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'canceled'))
```

**Allowed Values**:
- `'pending'` - Invitation sent, awaiting response
- `'accepted'` - Invitation accepted
- `'declined'` - Invitation declined
- `'expired'` - Invitation expired
- `'canceled'` - Invitation canceled

**Migration**: `023_schema_normalization.sql:26`

**Error Code**: `23514` (check_violation)

---

### pending_connections.status

**Constraint Name**: `chk_pending_connections_status`

**Table**: `pending_connections`

**Column**: `status`

**Definition**:
```sql
CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'canceled'))
```

**Allowed Values**:
- `'pending'` - Connection request pending
- `'accepted'` - Connection accepted
- `'declined'` - Connection declined
- `'expired'` - Connection request expired
- `'canceled'` - Connection request canceled

**Migration**: `023_schema_normalization.sql:41`

**Error Code**: `23514` (check_violation)

---

### tasks.status

**Constraint Name**: `chk_tasks_status`

**Table**: `tasks`

**Column**: `status`

**Definition**:
```sql
CHECK (status IN ('open', 'in_progress', 'completed', 'canceled'))
```

**Note**: Migration 035 uses `'cancelled'` (two l's), but migration 023 uses `'canceled'` (one l). Check both.

**Allowed Values** (from migration 035):
- `'open'` - Task is open
- `'in_progress'` - Task in progress
- `'completed'` - Task completed
- `'cancelled'` - Task cancelled (migration 035)

**Allowed Values** (from migration 023):
- `'open'` - Task is open
- `'in_progress'` - Task in progress
- `'completed'` - Task completed
- `'canceled'` - Task canceled (migration 023)

**Migration**: `023_schema_normalization.sql:56`, `035_data_integrity_constraints.sql:58`

**Error Code**: `23514` (check_violation)

**Note**: There's an inconsistency between migrations. Use `'canceled'` (one l) to match migration 023.

---

### tasks.priority

**Constraint Name**: `chk_tasks_priority`

**Table**: `tasks`

**Column**: `priority`

**Definition**:
```sql
CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
```

**Allowed Values**:
- `'low'` - Low priority
- `'medium'` - Medium priority
- `'high'` - High priority
- `'urgent'` - Urgent priority

**Migration**: `023_schema_normalization.sql:71`

**Error Code**: `23514` (check_violation)

---

### users.status

**Constraint Name**: `check_status_values`

**Table**: `users`

**Column**: `status`

**Definition**:
```sql
CHECK (status IN ('active', 'suspended', 'deleted', 'pending_verification'))
```

**Allowed Values**:
- `'active'` - Account is active
- `'suspended'` - Account is suspended
- `'deleted'` - Account is deleted
- `'pending_verification'` - Account pending email verification

**Migration**: `053_users_email_verified_status.sql:38`

**Error Code**: `23514` (check_violation)

---

### threads.is_archived

**Constraint Name**: `chk_threads_is_archived`

**Table**: `threads`

**Column**: `is_archived`

**Definition**:
```sql
CHECK (is_archived IN (0, 1))
```

**Allowed Values**:
- `0` - Thread is not archived
- `1` - Thread is archived

**Migration**: `035_data_integrity_constraints.sql:24`

**Error Code**: `23514` (check_violation)

**Note**: Uses integer boolean (0/1) instead of boolean type

---

### threads.depth

**Constraint Name**: `chk_threads_depth`

**Table**: `threads`

**Column**: `depth`

**Definition**:
```sql
CHECK (depth >= 0)
```

**Allowed Values**: Non-negative integers (0, 1, 2, ...)

**Migration**: `035_data_integrity_constraints.sql:39`

**Error Code**: `23514` (check_violation)

---

### threads.ai_confidence

**Constraint Name**: `chk_threads_ai_confidence`

**Table**: `threads`

**Column**: `ai_confidence`

**Definition**:
```sql
CHECK (ai_confidence >= 0 AND ai_confidence <= 1)
```

**Allowed Values**: Decimal between 0 and 1 (inclusive)

**Migration**: `047_thread_decisions_and_summaries.sql:18`

**Error Code**: `23514` (check_violation)

---

### messages.private

**Constraint Name**: `chk_messages_private`

**Table**: `messages`

**Column**: `private`

**Definition**:
```sql
CHECK (private IN (0, 1))
```

**Allowed Values**:
- `0` - Message is not private
- `1` - Message is private

**Migration**: `035_data_integrity_constraints.sql:80`

**Error Code**: `23514` (check_violation)

**Note**: Uses integer boolean (0/1) instead of boolean type

---

### messages.flagged

**Constraint Name**: `chk_messages_flagged`

**Table**: `messages`

**Column**: `flagged`

**Definition**:
```sql
CHECK (flagged IN (0, 1))
```

**Allowed Values**:
- `0` - Message is not flagged
- `1` - Message is flagged

**Migration**: `035_data_integrity_constraints.sql:102`

**Error Code**: `23514` (check_violation)

**Note**: Uses integer boolean (0/1) instead of boolean type

---

### messages.edited

**Constraint Name**: `chk_messages_edited`

**Table**: `messages`

**Column**: `edited`

**Definition**:
```sql
CHECK (edited IN (0, 1))
```

**Allowed Values**:
- `0` - Message is not edited
- `1` - Message is edited

**Migration**: `035_data_integrity_constraints.sql:124`

**Error Code**: `23514` (check_violation)

**Note**: Uses integer boolean (0/1) instead of boolean type

---

### rooms.is_private

**Constraint Name**: `chk_rooms_is_private`

**Table**: `rooms`

**Column**: `is_private`

**Definition**:
```sql
CHECK (is_private IN (0, 1))
```

**Allowed Values**:
- `0` - Room is not private (public)
- `1` - Room is private

**Migration**: `035_data_integrity_constraints.sql:142`

**Error Code**: `23514` (check_violation)

**Note**: Uses integer boolean (0/1) instead of boolean type

---

### pairing_sessions.use_count

**Constraint Name**: `chk_pairing_use_count`

**Table**: `pairing_sessions`

**Definition**:
```sql
CHECK (use_count <= max_uses)
```

**Constraint**: `use_count` must not exceed `max_uses`

**Migration**: `050_enhance_pairing_sessions.sql:52`

**Error Code**: `23514` (check_violation)

---

### pairing_sessions.max_uses

**Constraint Name**: `chk_pairing_max_uses`

**Table**: `pairing_sessions`

**Column**: `max_uses`

**Definition**:
```sql
CHECK (max_uses > 0)
```

**Allowed Values**: Positive integers (1, 2, 3, ...)

**Migration**: `050_enhance_pairing_sessions.sql:56`

**Error Code**: `23514` (check_violation)

---

## UNIQUE Constraints

### room_members (room_id, user_id)

**Constraint Name**: Implicit unique constraint

**Table**: `room_members`

**Columns**: `room_id`, `user_id`

**Definition**:
```sql
UNIQUE(room_id, user_id)
```

**Purpose**: Ensures each user can only have one membership per room

**Migration**: `001_initial_schema.sql:60`

**Error Code**: `23505` (unique_violation)

---

### users.email

**Constraint Name**: Implicit unique constraint

**Table**: `users`

**Column**: `email`

**Definition**:
```sql
UNIQUE(email)
```

**Purpose**: Ensures each email can only have one user account

**Migration**: `001_initial_schema.sql:8`

**Error Code**: `23505` (unique_violation)

---

### users.username

**Constraint Name**: Implicit unique constraint

**Table**: `users`

**Column**: `username`

**Definition**:
```sql
UNIQUE(username)
```

**Purpose**: Ensures each username is unique

**Migration**: `001_initial_schema.sql:7`

**Error Code**: `23505` (unique_violation)

---

### users.google_id

**Constraint Name**: Implicit unique constraint

**Table**: `users`

**Column**: `google_id`

**Definition**:
```sql
UNIQUE(google_id)
```

**Purpose**: Ensures each Google ID maps to one user

**Migration**: `001_initial_schema.sql:10`

**Error Code**: `23505` (unique_violation)

---

### sessions.session_token

**Constraint Name**: `idx_sessions_token`

**Table**: `sessions`

**Column**: `session_token`

**Definition**:
```sql
UNIQUE(session_token)
```

**Purpose**: Ensures each session token is unique

**Migration**: `052_sessions_and_refresh_tokens.sql:20`

**Error Code**: `23505` (unique_violation)

---

### refresh_tokens.token_hash

**Constraint Name**: Implicit unique constraint

**Table**: `refresh_tokens`

**Column**: `token_hash`

**Definition**:
```sql
UNIQUE(token_hash)
```

**Purpose**: Ensures each refresh token hash is unique

**Migration**: `052_sessions_and_refresh_tokens.sql:34`

**Error Code**: `23505` (unique_violation)

---

### auth_identities (provider, provider_subject)

**Constraint Name**: Implicit unique constraint

**Table**: `auth_identities`

**Columns**: `provider`, `provider_subject`

**Definition**:
```sql
UNIQUE(provider, provider_subject)
```

**Purpose**: Ensures one identity per provider + provider_subject combination

**Migration**: `051_auth_identities_table.sql:19`

**Error Code**: `23505` (unique_violation)

---

### roles.name

**Constraint Name**: Implicit unique constraint

**Table**: `roles`

**Column**: `name`

**Definition**:
```sql
UNIQUE(name)
```

**Purpose**: Ensures each role name is unique

**Migration**: `048_rbac_system.sql:13`

**Error Code**: `23505` (unique_violation)

---

### permissions.name

**Constraint Name**: Implicit unique constraint

**Table**: `permissions`

**Column**: `name`

**Definition**:
```sql
UNIQUE(name)
```

**Purpose**: Ensures each permission name is unique

**Migration**: `048_rbac_system.sql:38`

**Error Code**: `23505` (unique_violation)

---

## NOT NULL Constraints

### threads.room_id

**Table**: `threads`

**Column**: `room_id`

**Migration**: `035_data_integrity_constraints.sql:170`

---

### threads.title

**Table**: `threads`

**Column**: `title`

**Migration**: `035_data_integrity_constraints.sql:191`

---

### messages.room_id

**Table**: `messages`

**Column**: `room_id`

**Migration**: `035_data_integrity_constraints.sql:212`

---

### messages.timestamp

**Table**: `messages`

**Column**: `timestamp`

**Migration**: `035_data_integrity_constraints.sql:233`

---

### messages.type

**Table**: `messages`

**Column**: `type`

**Migration**: `035_data_integrity_constraints.sql:254`

---

## FOREIGN KEY Constraints

### room_members.room_id → rooms.id

**Constraint Name**: Implicit foreign key

**Table**: `room_members`

**Column**: `room_id`

**References**: `rooms(id)`

**On Delete**: `CASCADE`

**Migration**: `001_initial_schema.sql:58`

**Error Code**: `23503` (foreign_key_violation)

---

### room_members.user_id → users.id

**Constraint Name**: Implicit foreign key

**Table**: `room_members`

**Column**: `user_id`

**References**: `users(id)`

**On Delete**: `CASCADE`

**Migration**: `001_initial_schema.sql:59`

**Error Code**: `23503` (foreign_key_violation)

---

### rooms.created_by → users.id

**Constraint Name**: Implicit foreign key

**Table**: `rooms`

**Column**: `created_by`

**References**: `users(id)`

**On Delete**: `CASCADE`

**Migration**: `001_initial_schema.sql:48`

**Error Code**: `23503` (foreign_key_violation)

---

### messages.thread_id → threads.id

**Constraint Name**: `fk_messages_thread_id`

**Table**: `messages`

**Column**: `thread_id`

**References**: `threads(id)`

**Migration**: `022_threading.sql` (verified in migration 035)

**Error Code**: `23503` (foreign_key_violation)

---

## Error Mapping

### PostgreSQL Error Codes

| Error Code | Name | Description | Example |
|------------|------|-------------|---------|
| `23503` | `foreign_key_violation` | Foreign key constraint violation | User doesn't exist |
| `23505` | `unique_violation` | Unique constraint violation | Duplicate email |
| `23514` | `check_violation` | Check constraint violation | Invalid role value |

### Error Handling

```javascript
// Example error handling
try {
  await db.query('INSERT INTO room_members ...', [roomId, userId, role]);
} catch (error) {
  if (error.code === '23505') {
    // Unique violation - duplicate membership
    return { success: false, error: 'ALREADY_MEMBER' };
  }
  if (error.code === '23514') {
    // Check violation - invalid role
    return { success: false, error: 'INVALID_ROLE' };
  }
  if (error.code === '23503') {
    // Foreign key violation - room/user doesn't exist
    return { success: false, error: 'NOT_FOUND' };
  }
  throw error;
}
```

---

## Application Validation

### Pre-Insert Validation

**Always validate constraints in application code before database operations:**

1. **CHECK Constraints**: Validate allowed values
2. **UNIQUE Constraints**: Check for duplicates
3. **FOREIGN KEY Constraints**: Verify referenced records exist
4. **NOT NULL Constraints**: Ensure required fields are provided

### Example Validation

```javascript
// Validate before database operation
const VALID_ROLES = ['owner', 'member', 'readonly'];

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
  }
}

// Use in application code
function addMember(roomId, userId, role) {
  validateRole(role); // Validate before database operation
  // ... rest of function
}
```

---

## Migration History

| Migration | Constraint Type | Tables Affected |
|-----------|----------------|-----------------|
| `001_initial_schema.sql` | Foreign Keys, Unique | `users`, `rooms`, `room_members` |
| `022_threading.sql` | Foreign Key | `messages` |
| `023_schema_normalization.sql` | CHECK | `room_members`, `room_invites`, `pending_connections`, `tasks` |
| `035_data_integrity_constraints.sql` | CHECK, NOT NULL | `threads`, `messages`, `tasks`, `rooms` |
| `047_thread_decisions_and_summaries.sql` | CHECK | `threads` |
| `048_rbac_system.sql` | Unique | `roles`, `permissions` |
| `050_enhance_pairing_sessions.sql` | CHECK | `pairing_sessions` |
| `051_auth_identities_table.sql` | Unique | `auth_identities` |
| `052_sessions_and_refresh_tokens.sql` | Unique | `sessions`, `refresh_tokens` |
| `053_users_email_verified_status.sql` | CHECK | `users` |

---

## Related Documentation

- `docs/auth-flow.md` - Authentication lifecycle
- `docs/room-membership.md` - Room membership rules
- `docs/RBAC_RLS_IMPLEMENTATION.md` - Role-based access control
- `migrations/` - Migration files with constraint definitions

---

**Last Updated**: 2025-01-07

