# PostgreSQL "role 'test' does not exist" - Fix Applied

**Date**: 2025-01-28  
**Status**: ✅ **FIX APPLIED**

## Problem

PostgreSQL connection was failing with:
```
⚠️ PostgreSQL connection test failed, retrying... role "test" does not exist
```

## Root Cause

`jest.setup.js` was setting a default `DATABASE_URL` with username "test" that doesn't exist in PostgreSQL:
```javascript
// OLD: Uses 'test' role which doesn't exist
// Example format: postgresql://user:password@host:port/database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'connection-string-with-test-user';
```

This default was being used when:
- `DATABASE_URL` was not set in environment
- Code was running (even outside test environment)

## Fix Applied

Updated `chat-server/jest.setup.js` to:
1. **Only set default in test environment** (`NODE_ENV === 'test'`)
2. **Use 'postgres' role** instead of 'test' (exists by default)
3. **Respect existing DATABASE_URL** (don't override if already set)

### Before:
```javascript
// Uses 'test' role which doesn't exist
// Example format: postgresql://user:password@host:port/database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'connection-string-with-test-user';
```

### After:
```javascript
// Only set default if in test environment and DATABASE_URL not already set
// Use 'postgres' role which exists by default in PostgreSQL installations
// Example format: postgresql://user@host:port/database
if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
  // Replace with your actual connection string
  process.env.DATABASE_URL = 'your-postgres-connection-string-here';
}
```

## Impact

### Before Fix:
- ❌ Default DATABASE_URL used "test" role (doesn't exist)
- ❌ Connection failed with "role 'test' does not exist"
- ❌ Retries every 5 seconds (wasteful)
- ⚠️ Applied even outside test environment

### After Fix:
- ✅ Default only applies in test environment
- ✅ Uses "postgres" role (exists by default)
- ✅ Doesn't interfere with production/development DATABASE_URL
- ✅ No connection errors when DATABASE_URL is properly set

## Next Steps

### For Development:
Set `DATABASE_URL` in `chat-server/.env`:
```bash
# Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
DATABASE_URL=postgresql://[USER]@localhost:5432/[DATABASE]
```

Or use the setup script:
```bash
cd chat-server
./setup-local-db.sh
```

### For Production (Railway):
- Railway automatically provides `DATABASE_URL` when PostgreSQL service is added
- No action needed

### For Tests:
- Tests will use format `postgresql://[USER]@localhost:5432/[DATABASE]` if `DATABASE_URL` not set
- This requires the test database to exist (create with `createdb test`)
- Replace `[USER]` and `[DATABASE]` with actual values

## Verification

After setting proper DATABASE_URL, verify connection:
```bash
cd chat-server
node test-postgres-connection.js
```

Should see:
```
✅ Connection successful!
```

## Files Changed

- ✅ `chat-server/jest.setup.js` - Updated default DATABASE_URL logic

---

**Status**: ✅ Fix applied, ready for commit

