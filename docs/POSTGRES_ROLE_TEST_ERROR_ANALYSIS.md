# PostgreSQL "role 'test' does not exist" Error - Root Cause Analysis

**Date**: 2025-01-28  
**Error**: `⚠️ PostgreSQL connection test failed, retrying... role "test" does not exist`  
**Status**: 🔍 **ROOT CAUSE IDENTIFIED**

## Root Cause

The error occurs because the code is trying to connect to PostgreSQL using a **default test DATABASE_URL** that specifies a user/role named "test" which doesn't exist in your PostgreSQL database.

### Source of the Problem

**File**: `chat-server/jest.setup.js` (line 9)

```javascript
// Example: Replace with your actual DATABASE_URL
// Format: DATABASE_URL=postgresql://user:password@host:port/database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'your-database-url-here';
```

This line sets a **fallback DATABASE_URL** for tests that uses:
- **Username**: `test`
- **Password**: `test`
- **Database**: `test`
- **Host**: `localhost:5432`

### When This Happens

1. **DATABASE_URL is not set** in environment variables
2. **Code runs** (not necessarily in Jest - this file may be imported)
3. **Fallback is used**: A connection string with username "test" (example format: postgresql://user:password@host:port/database)
4. **PostgreSQL connection attempt** with username "test"
5. **PostgreSQL error**: "role 'test' does not exist"

### Why It Fails

PostgreSQL requires that the **role (user)** specified in the connection string exists in the database. The default PostgreSQL installation typically has:
- ✅ `postgres` role (superuser)
- ❌ `test` role (doesn't exist by default)

## Solutions

### Solution 1: Set DATABASE_URL Environment Variable (RECOMMENDED)

**For Development**:
```bash
# In chat-server/.env file
# Format: DATABASE_URL=postgresql://user@host:port/database
DATABASE_URL=your-database-url-here
```

**For Production (Railway)**:
- Railway automatically provides `DATABASE_URL` when PostgreSQL service is added
- No action needed if Railway PostgreSQL is configured

**For Local Testing**:
```bash
# Set before running server
# Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
export DATABASE_URL=postgresql://[USER]@localhost:5432/[DATABASE]
npm start
```

### Solution 2: Create the "test" Role in PostgreSQL

If you want to use the test default, create the role:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the test role
CREATE ROLE test WITH LOGIN PASSWORD 'test';

# Create the test database
CREATE DATABASE test OWNER test;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE test TO test;
```

**Note**: This is **not recommended** - better to set a proper DATABASE_URL.

### Solution 3: Fix jest.setup.js to Use Valid Default

**Change the default** in `chat-server/jest.setup.js`:

```javascript
// OLD (causes error):
// Uses 'test' role which doesn't exist
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://[INVALID_USER]@localhost:5432/[DATABASE]';

// NEW (use postgres role which exists by default):
// Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://[USER]@localhost:5432/[DATABASE]';
```

**Or better yet**, don't set a default at all - require DATABASE_URL to be explicitly set:

```javascript
// Only set if not already set AND we're in test environment
if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
  // Use postgres role (exists by default)
  // Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
  process.env.DATABASE_URL = 'postgresql://[USER]@localhost:5432/[DATABASE]';
}
```

## Recommended Fix

### Option A: Set DATABASE_URL (Best for Development/Production)

1. **Create/Update `.env` file** in `chat-server/`:
   ```bash
   cd chat-server
   # Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
   echo "DATABASE_URL=postgresql://[USER]@localhost:5432/[DATABASE]" >> .env
   ```

2. **Or use the setup script**:
   ```bash
   cd chat-server
   ./setup-local-db.sh
   ```

### Option B: Fix jest.setup.js (Best for Tests)

Update `chat-server/jest.setup.js` to use a valid default:

```javascript
// Only set test default if in test environment and DATABASE_URL not set
if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
  // Use 'postgres' role which exists by default
  // Format: postgresql://[USER]@[HOST]:[PORT]/[DATABASE]
  process.env.DATABASE_URL = 'postgresql://[USER]@localhost:5432/[DATABASE]';
}
```

**Why this is better**:
- Only applies in test environment
- Uses `postgres` role which exists by default
- Doesn't interfere with production/development DATABASE_URL

## Verification

After fixing, verify the connection:

```bash
cd chat-server
node test-postgres-connection.js
```

Should see:
```
✅ Connection successful!
```

## Impact

**Current Impact**:
- ❌ Server starts but database connection fails
- ❌ Connection retries every 5 seconds (wasteful)
- ❌ Database operations will fail
- ⚠️ Health check may report database as unavailable

**After Fix**:
- ✅ Database connects successfully
- ✅ All database operations work
- ✅ Health check reports database as healthy
- ✅ No retry spam in logs

## Summary

**Root Cause**: `jest.setup.js` sets a default DATABASE_URL with username "test" that doesn't exist.

**Fix**: Either:
1. Set proper DATABASE_URL in `.env` file (recommended)
2. Update `jest.setup.js` to use "postgres" role instead of "test"

**Priority**: Medium - Server runs but database is unavailable

---

**Next Steps**: Set DATABASE_URL or fix jest.setup.js default

