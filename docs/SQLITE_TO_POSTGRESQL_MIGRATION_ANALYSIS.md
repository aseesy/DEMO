# 🔍 SQLite to PostgreSQL Migration Analysis

**Date**: 2025-12-30  
**Status**: ⚠️ **POTENTIAL ISSUES IDENTIFIED**

## 📋 Executive Summary

The system migrated from SQLite to PostgreSQL. While most of the migration is complete, there are **potential issues** that could cause persistence problems:

1. ✅ **ID Format**: PostgreSQL uses `SERIAL` (INTEGER) - same as SQLite numeric IDs
2. ⚠️ **user_context.user_id Mismatch**: `TEXT` instead of `INTEGER` (legacy issue)
3. ⚠️ **Migration Status**: Need to verify all migrations ran on Railway
4. ⚠️ **Local Storage**: Stores `CHAT_USER` object with `id` field - could be stale

---

## 🔍 Issue Analysis

### 1. **ID Format Consistency** ✅

**PostgreSQL Schema**:
- `users.id`: `SERIAL PRIMARY KEY` (INTEGER, auto-incrementing)
- `room_members.user_id`: `INTEGER NOT NULL`
- `contacts.user_id`: `INTEGER NOT NULL`
- `tasks.user_id`: `INTEGER NOT NULL`
- Most tables: `INTEGER` references to `users.id`

**SQLite Behavior**:
- SQLite uses `INTEGER PRIMARY KEY` (also numeric)
- Auto-incrementing IDs are compatible

**Conclusion**: ✅ **No issue** - Both use numeric INTEGER IDs, so IDs should match if migrations ran correctly.

---

### 2. **user_context.user_id Type Mismatch** ⚠️

**Problem**:
```sql
-- From migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS user_context (
  user_id TEXT PRIMARY KEY,  -- ⚠️ TEXT, not INTEGER!
  co_parent TEXT,
  children JSONB DEFAULT '[]'::jsonb,
  contacts JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Impact**:
- `user_context.user_id` is `TEXT`, not `INTEGER`
- No foreign key constraint to `users.id`
- Could store string IDs from SQLite that don't match PostgreSQL INTEGER IDs
- Migration 028 notes: "user_context.user_id can be migrated to user_email in a future migration"

**Current Usage**:
- Code likely stores user IDs as strings in `user_context`
- This could cause lookup failures if IDs don't match

**Recommendation**: 
- Check if `user_context` is still actively used
- If yes, migrate `user_id` to `INTEGER` or use `user_email` instead
- Add foreign key constraint if using INTEGER

---

### 3. **Migration Status on Railway** ⚠️

**Current Behavior**:
- Migrations run automatically on server startup (non-blocking)
- Located in `chat-server/migrations/` (000-031)
- Tracked in `migrations` table

**Potential Issues**:
- If Railway instance was created before all migrations existed, some may not have run
- If migrations failed silently, schema might be incomplete
- Missing columns could cause runtime errors

**Verification Steps**:
1. Check Railway logs for migration execution
2. Query `migrations` table: `SELECT filename FROM migrations ORDER BY executed_at`
3. Compare with files in `migrations/` directory
4. Run `npm run migrate` manually if needed

**Recommendation**:
- Add migration status check to health endpoint
- Log migration execution clearly
- Consider blocking server startup if critical migrations fail

---

### 4. **Local Storage Stale IDs** ⚠️

**What's Stored**:
```javascript
// From StorageAdapter.js
StorageKeys.CHAT_USER: 'chatUser'  // Stores full user object
StorageKeys.USERNAME: 'username'    // Stores username/email
StorageKeys.USER_EMAIL: 'userEmail' // Stores email
```

**Potential Issue**:
- `CHAT_USER` object includes `id` field
- If user logged in with SQLite database, `id` might be from old system
- After migration, new PostgreSQL IDs might not match
- Frontend could send stale IDs in API requests

**Current Code Behavior**:
- `AuthContext` stores `CHAT_USER` object: `storage.set(StorageKeys.CHAT_USER, user)`
- User object comes from backend: `{ id, email, username, ... }`
- Backend always returns current PostgreSQL ID

**Risk Assessment**:
- ⚠️ **Low-Medium Risk**: If user logged in before migration, `CHAT_USER.id` might be stale
- ✅ **Mitigation**: Backend always returns fresh user data on login/verify
- ✅ **Mitigation**: Most API calls use JWT token, not stored user ID

**Recommendation**:
- Clear `CHAT_USER` on logout/login to ensure fresh data
- Verify API endpoints don't rely on client-provided user IDs
- Use JWT token for user identification (already implemented)

---

## 🔧 Recommended Fixes

### Fix 1: Verify Migration Status

**Action**: Create a script to check migration status

```bash
# Check which migrations have run
node -e "
const db = require('./dbPostgres');
db.query('SELECT filename FROM migrations ORDER BY executed_at')
  .then(r => console.log('Executed:', r.rows.map(x => x.filename)))
  .then(() => process.exit(0));
"
```

**Action**: Add migration status to health check

```javascript
// In utils.js healthCheckHandler
const migrationStatus = await getMigrationStatus();
response.migrations = {
  executed: migrationStatus.executed,
  total: migrationStatus.total,
  pending: migrationStatus.pending,
};
```

---

### Fix 2: Fix user_context.user_id Type

**Option A**: Migrate to INTEGER (if still using user_context)
```sql
-- Migration: Fix user_context.user_id type
ALTER TABLE user_context 
  ALTER COLUMN user_id TYPE INTEGER USING user_id::INTEGER;

ALTER TABLE user_context
  ADD CONSTRAINT fk_user_context_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Option B**: Migrate to user_email (as noted in migration 028)
```sql
-- Migration: Replace user_id with user_email
ALTER TABLE user_context 
  ADD COLUMN user_email TEXT REFERENCES users(email);

-- Migrate existing data
UPDATE user_context uc
SET user_email = u.email
FROM users u
WHERE uc.user_id::INTEGER = u.id;

-- Make user_email primary key, drop user_id
ALTER TABLE user_context DROP CONSTRAINT user_context_pkey;
ALTER TABLE user_context DROP COLUMN user_id;
ALTER TABLE user_context ADD PRIMARY KEY (user_email);
```

---

### Fix 3: Clear Stale Local Storage

**Action**: Add migration check on frontend

```javascript
// In AuthContext.jsx
React.useEffect(() => {
  // Check if CHAT_USER.id matches current user
  const storedUser = storage.get(StorageKeys.CHAT_USER);
  if (storedUser && storedUser.id) {
    // Verify ID is still valid on next API call
    // If 404, clear stale data
  }
}, []);
```

**Action**: Clear CHAT_USER on logout (already implemented)

---

## 📊 Testing Checklist

- [ ] Verify all migrations ran on Railway
- [ ] Check `migrations` table has all 31 migrations
- [ ] Test login with fresh account → verify `CHAT_USER.id` matches database
- [ ] Test login with old account → verify ID migration worked
- [ ] Check `user_context` table usage → verify `user_id` type is correct
- [ ] Test API endpoints → verify they don't rely on client-provided IDs
- [ ] Check JWT token → verify it contains correct user ID
- [ ] Test pairing_sessions → verify foreign keys work correctly

---

## 🎯 Key Findings

### ✅ **No Critical Issues Found**

1. **ID Format**: PostgreSQL `SERIAL` (INTEGER) is compatible with SQLite `INTEGER`
2. **Most Tables**: Use `INTEGER` foreign keys correctly
3. **JWT Tokens**: Use current user ID from database
4. **API Design**: Most endpoints use JWT, not client-provided IDs

### ⚠️ **Potential Issues**

1. **user_context.user_id**: `TEXT` type mismatch (low impact if table unused)
2. **Migration Status**: Need to verify all migrations ran on Railway
3. **Stale Local Storage**: `CHAT_USER.id` could be old, but mitigated by JWT usage

---

## 🔄 Next Steps

1. **Immediate**: Verify migration status on Railway
2. **Short-term**: Fix `user_context.user_id` type if table is still used
3. **Long-term**: Add migration status monitoring to health check
4. **Prevention**: Add migration validation on startup

---

## 📚 References

- `chat-server/migrations/001_initial_schema.sql` - Initial schema
- `chat-server/migrations/028_replace_username_with_email.sql` - Notes on user_context
- `chat-server/run-migration.js` - Migration runner
- `chat-client-vite/src/adapters/storage/StorageAdapter.js` - Local storage keys
- `chat-server/database.js` - Migration execution on startup

