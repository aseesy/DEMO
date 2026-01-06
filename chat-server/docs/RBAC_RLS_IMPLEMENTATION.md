# RBAC and RLS Implementation Guide

This document describes the RBAC (Role-Based Access Control) and RLS (Row-Level Security) implementation.

## Overview

### RBAC System

- **Roles**: user, coparent, attorney, admin
- **Permissions**: Fine-grained permissions like `message:create`, `room:read`, etc.
- **Authorization Middleware**: Express middleware for permission checks

### RLS Policies

- **Database-level security**: PostgreSQL enforces data isolation
- **Defense in depth**: Works even if application checks are bypassed
- **Session context**: Uses PostgreSQL session variables for user context

## Migration Files

1. **048_rbac_system.sql** - Creates RBAC tables and permissions
2. **049_row_level_security.sql** - Enables RLS and creates policies

## Running Migrations

```bash
# Run migrations
npm run migrate
# or
node run-migration.js
```

## Verification

```bash
# Verify RLS policies are enabled
node scripts/verify-rls-policies.js
```

## Usage

### 1. Assign Roles to Users

```javascript
const { permissionService } = require('./src/services');

// Assign default role (called during registration)
await permissionService.ensureDefaultRole(userId);

// Assign additional roles
await permissionService.assignRole(userId, 'admin');
await permissionService.assignRole(userId, 'coparent');
```

### 2. Check Permissions in Code

```javascript
const { permissionService } = require('./src/services');

// Check single permission
const canCreate = await permissionService.hasPermission(userId, 'message:create');

// Check multiple permissions
const canManage = await permissionService.hasAllPermissions(userId, [
  'message:create',
  'message:update',
  'message:delete',
]);
```

### 3. Use Authorization Middleware

```javascript
const { requirePermission, requireRole } = require('./middleware/authorization');
const { verifyAuth } = require('./middleware/auth');

// Require specific permission
router.post('/api/messages', verifyAuth, requirePermission('message:create'), handler);

// Require role
router.get('/api/admin/stats', verifyAuth, requireRole('admin'), handler);
```

### 4. Example: Updated Message Routes

```javascript
const { requirePermission } = require('../middleware/authorization');

// Create message - requires permission
router.post(
  '/',
  verifyAuth,
  requirePermission('message:create'),
  asyncHandler(async (req, res) => {
    // Handler code
  })
);

// Update message - requires permission
router.put(
  '/:messageId',
  verifyAuth,
  requirePermission('message:update'),
  asyncHandler(async (req, res) => {
    // Handler code
  })
);

// Delete message - requires permission
router.delete(
  '/:messageId',
  verifyAuth,
  requirePermission('message:delete'),
  asyncHandler(async (req, res) => {
    // Handler code
  })
);
```

## RLS Context Setting

For RLS to work properly, the current user ID must be set in the PostgreSQL session.

### Option 1: Transaction-based (Recommended)

```javascript
const { withRLSContext } = require('./src/infrastructure/database/rlsHelper');

await withRLSContext(userId, async () => {
  const messages = await dbPostgres.query('SELECT * FROM messages WHERE room_id = $1', [roomId]);
  // RLS policies will automatically filter results
});
```

### Option 2: Connection-level (if using single connection per request)

```javascript
const { setCurrentUserId } = require('./src/infrastructure/database/rlsHelper');

// Set at start of request
await setCurrentUserId(req.user.id);

// All queries in this connection will use RLS
const messages = await dbPostgres.query('SELECT * FROM messages');

// Clear at end of request
await clearCurrentUserId();
```

## Default Permissions

### User Role

- `message:create`, `message:read`, `message:update`, `message:delete`
- `room:read`, `room:invite`
- `task:create`, `task:read`, `task:update`, `task:delete`
- `contact:create`, `contact:read`, `contact:update`, `contact:delete`
- `profile:read`, `profile:update`

### Co-parent Role

- All user permissions plus:
- `room:create`, `room:update`
- `profile:read:coparent`

### Attorney Role

- `message:read`
- `room:read`
- `task:read`
- `profile:read:coparent`

### Admin Role

- All permissions

## Security Notes

1. **Defense in Depth**: RLS provides database-level security even if application checks fail
2. **Fail Closed**: Permission checks return `false` on errors (deny access)
3. **Session Context**: RLS requires session variable to be set (see rlsHelper.js)
4. **Connection Pooling**: RLS context must be set per-request or per-transaction

## Testing

```javascript
// Test permission check
const hasPermission = await permissionService.hasPermission(userId, 'message:create');
expect(hasPermission).toBe(true);

// Test RLS policy
// (Queries automatically filtered by RLS when context is set)
const messages = await dbPostgres.query('SELECT * FROM messages');
// Only returns messages user has access to
```

## Troubleshooting

### RLS Not Working

1. Verify RLS is enabled: `node scripts/verify-rls-policies.js`
2. Check that session variable is set: `SELECT current_setting('app.current_user_id', true);`
3. Ensure migration 049 was run successfully

### Permission Checks Failing

1. Verify user has role assigned: `SELECT * FROM user_roles WHERE user_id = ?`
2. Check role has permission: `SELECT * FROM role_permissions WHERE role_id = ?`
3. Verify default 'user' role is assigned during registration
