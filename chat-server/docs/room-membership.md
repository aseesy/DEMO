# Room Membership

**Backend Truth** - This document describes room membership rules, roles, constraints, and invariants.

## Overview

Room membership in LiaiZen controls access to co-parent communication spaces. This document defines the rules, constraints, and error handling for room membership operations.

---

## Database Schema

### room_members Table

```sql
CREATE TABLE room_members (
  id SERIAL PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(room_id, user_id)
);
```

---

## Invariants

### Role Constraint

**Database Constraint**: `chk_room_members_role`

```sql
CHECK (role IN ('owner', 'member', 'readonly'))
```

**Allowed Roles**:
- `'owner'` - Room creator, full control
- `'member'` - Co-parent member, full access
- `'readonly'` - Read-only access (future use)

**Constraint Location**: `migrations/023_schema_normalization.sql:86`

**Critical**: This constraint is enforced at the database level. Attempts to insert invalid roles will fail with a constraint violation error.

### Membership Uniqueness

**Database Constraint**: `UNIQUE(room_id, user_id)`

- Each user can only have one membership per room
- Prevents duplicate memberships
- Violation: `23505` (unique_violation)

### Foreign Key Constraints

- `room_id` → `rooms(id)` (CASCADE on delete)
- `user_id` → `users(id)` (CASCADE on delete)

---

## Role Definitions

### owner

- **Assigned**: Room creator
- **Permissions**: Full control
  - Edit room settings
  - Remove members
  - Delete room
  - All `member` permissions

### member

- **Assigned**: Co-parent members (default)
- **Permissions**: Full access
  - Send messages
  - Create tasks
  - Manage contacts
  - View message history
  - Cannot edit room settings
  - Cannot remove other members
  - Cannot delete room

### readonly

- **Assigned**: Observer role (future use)
- **Permissions**: Read-only access
  - View messages
  - View tasks
  - View contacts
  - Cannot send messages
  - Cannot create tasks
  - Cannot manage contacts

---

## Membership Lifecycle

### Creation

#### When Room is Created

1. **Room Creation**: `createCoParentRoom()` or `createRoom()`
2. **Creator Membership**: Room creator automatically added as `'owner'`
3. **Default Role**: First member always gets `'owner'` role

#### When Invitation is Accepted

1. **Invitation Accept**: User accepts co-parent invitation
2. **Membership Created**: Both users added to shared room
3. **Role Assignment**: 
   - Inviter: `'owner'` (if room creator) or `'member'`
   - Invitee: `'member'` (default for co-parents)

#### Code Example

```javascript
// Invitation acceptance creates memberships
INSERT INTO room_members (room_id, user_id, role)
VALUES 
  ($1, $2, 'member'),  -- inviter
  ($1, $3, 'member')   -- invitee
```

### Preconditions

Before creating membership:

1. **Room Exists**: `room_id` must reference existing room
2. **User Exists**: `user_id` must reference existing user
3. **Not Duplicate**: User must not already be member
4. **Valid Role**: Role must be in `('owner', 'member', 'readonly')`

### Failure Cases

| Error | Cause | Code | Response |
|-------|-------|------|----------|
| `UNIQUE_VIOLATION` | User already member | `23505` | "User is already a member" |
| `FOREIGN_KEY_VIOLATION` | Room/user doesn't exist | `23503` | "Room or user not found" |
| `CHECK_VIOLATION` | Invalid role | `23514` | "Invalid role: must be 'owner', 'member', or 'readonly'" |

---

## Role Assignment Rules

### Default Role

- **New Members**: `'member'` (default)
- **Room Creator**: `'owner'` (override)

### Role Updates

- **Current**: Role updates not implemented
- **Future**: Only `'owner'` can change roles

### Role Validation

**Always validate role before database operation**:

```javascript
// Valid roles
const VALID_ROLES = ['owner', 'member', 'readonly'];

// Validation function
function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

// Use before database operations
if (!isValidRole(role)) {
  throw new Error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
}
```

---

## Error Mapping

### Database Errors → API Errors → UX Messages

| Database Error | Code | API Error | Status | UX Message |
|----------------|------|-----------|--------|------------|
| `CHECK_VIOLATION` (invalid role) | `23514` | `INVALID_ROLE` | 400 | "Invalid role. Please select a valid role." |
| `UNIQUE_VIOLATION` (duplicate membership) | `23505` | `ALREADY_MEMBER` | 409 | "User is already a member of this room." |
| `FOREIGN_KEY_VIOLATION` (room not found) | `23503` | `ROOM_NOT_FOUND` | 404 | "Room not found." |
| `FOREIGN_KEY_VIOLATION` (user not found) | `23503` | `USER_NOT_FOUND` | 404 | "User not found." |

### Error Handling Example

```javascript
async function addMember(roomId, userId, role) {
  // Validate role before database operation
  if (!isValidRole(role)) {
    return {
      success: false,
      error: 'INVALID_ROLE',
      message: `Invalid role: ${role}. Must be one of: owner, member, readonly`
    };
  }

  try {
    await db.query(
      'INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)',
      [roomId, userId, role]
    );
    return { success: true };
  } catch (error) {
    // Map database errors to user-friendly messages
    if (error.code === '23505') {
      return {
        success: false,
        error: 'ALREADY_MEMBER',
        message: 'User is already a member of this room'
      };
    }
    if (error.code === '23514') {
      return {
        success: false,
        error: 'INVALID_ROLE',
        message: `Invalid role: ${role}. Must be one of: owner, member, readonly`
      };
    }
    if (error.code === '23503') {
      return {
        success: false,
        error: 'NOT_FOUND',
        message: 'Room or user not found'
      };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

---

## Graceful Recovery

### Duplicate Membership

**Scenario**: User tries to join room they're already in

**Handling**:
1. Check membership before insert
2. If exists, return success (idempotent)
3. If not, insert new membership

**Code**:
```javascript
async function ensureMember(roomId, userId, role) {
  // Check if already member
  const existing = await db.query(
    'SELECT * FROM room_members WHERE room_id = $1 AND user_id = $2',
    [roomId, userId]
  );
  
  if (existing.rows.length > 0) {
    return { success: true, alreadyMember: true };
  }
  
  // Add member
  return addMember(roomId, userId, role);
}
```

### Invalid Role

**Scenario**: Code attempts to use invalid role (e.g., `'admin'`)

**Handling**:
1. Validate role before database operation
2. Return clear error message
3. Don't expose database constraint violation

**Code**:
```javascript
const VALID_ROLES = ['owner', 'member', 'readonly'];

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}. Valid roles: ${VALID_ROLES.join(', ')}`);
  }
}
```

---

## Room Membership Queries

### Check Membership

```sql
SELECT * FROM room_members 
WHERE room_id = $1 AND user_id = $2;
```

### Get Room Members

```sql
SELECT rm.*, u.email, u.display_name
FROM room_members rm
JOIN users u ON rm.user_id = u.id
WHERE rm.room_id = $1
ORDER BY rm.joined_at;
```

### Get User's Rooms

```sql
SELECT r.*, rm.role, rm.joined_at
FROM rooms r
JOIN room_members rm ON r.id = rm.room_id
WHERE rm.user_id = $1;
```

### Count Members

```sql
SELECT COUNT(*) FROM room_members WHERE room_id = $1;
```

---

## API Endpoints

### Membership Endpoints

- `POST /api/room/:roomId/members` - Add member
- `DELETE /api/room/:roomId/members/:userId` - Remove member
- `GET /api/room/:roomId/members` - List members
- `PUT /api/room/:roomId/members/:userId/role` - Update role (future)

### WebSocket Events

- `join_room` - Join room (creates membership if needed)
- `leave_room` - Leave room (removes membership)
- `room_members` - List room members

---

## Testing

### Unit Tests

```javascript
describe('Room Membership', () => {
  it('should create membership with valid role', async () => {
    const result = await addMember(roomId, userId, 'member');
    expect(result.success).toBe(true);
  });

  it('should reject invalid role', async () => {
    const result = await addMember(roomId, userId, 'admin');
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_ROLE');
  });

  it('should reject duplicate membership', async () => {
    await addMember(roomId, userId, 'member');
    const result = await addMember(roomId, userId, 'member');
    expect(result.success).toBe(false);
    expect(result.error).toBe('ALREADY_MEMBER');
  });
});
```

### Integration Tests

```javascript
describe('Room Membership Integration', () => {
  it('should create room with owner membership', async () => {
    const room = await createRoom(userId);
    const members = await getRoomMembers(room.id);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
  });

  it('should add co-parent as member', async () => {
    const room = await createRoom(userId1);
    const result = await addMember(room.id, userId2, 'member');
    expect(result.success).toBe(true);
    
    const members = await getRoomMembers(room.id);
    expect(members).toHaveLength(2);
    expect(members.find(m => m.user_id === userId2).role).toBe('member');
  });
});
```

---

## Related Documentation

- `docs/auth-flow.md` - Authentication lifecycle
- `docs/db-constraints.md` - All database constraints
- `docs/RBAC_RLS_IMPLEMENTATION.md` - Role-based access control
- `migrations/023_schema_normalization.sql` - Schema constraints

---

## Migration History

- **Migration 023**: Added `chk_room_members_role` constraint
- **Migration 001**: Created `room_members` table with unique constraint

---

**Last Updated**: 2025-01-07

