# Phase 2 Migration Testing Guide

## Overview

This guide helps you test the Phase 2 migrations (051, 052, 053) on your development database before deploying to production.

---

## Prerequisites

1. **Development Database**: Access to a development/staging PostgreSQL database
2. **Environment Variables**: `DATABASE_URL` set to your development database
3. **Backup**: Backup of your development database (optional but recommended)

---

## Testing Steps

### Step 1: Check Current Migration Status

```bash
cd chat-server
node scripts/check-migration-status.js
```

This will show:
- Which migrations have already run
- Which migrations are pending
- Any failed migrations

**Expected Output**:
- Migrations 001-050 should be executed
- Migrations 051, 052, 053 should be pending

---

### Step 2: Run Migrations

```bash
cd chat-server
npm run migrate
```

Or manually:
```bash
node run-migration.js
```

**What to Watch For**:
- ✅ Migration 051 runs successfully
- ✅ Migration 052 runs successfully  
- ✅ Migration 053 runs successfully
- ⚠️ Any warnings or errors

---

### Step 3: Run Validation Script

```bash
cd chat-server
node scripts/test-phase2-migrations.js
```

This script will automatically validate:
- ✅ All tables created correctly
- ✅ All columns exist
- ✅ Data migration completed
- ✅ Constraints and indexes created
- ✅ Data integrity maintained

**Expected Output**:
```
🧪 Phase 2 Migration Testing

============================================================
Database: postgresql://user:****@host:5432/dbname
============================================================
✅ Database connection successful

📋 Testing Migration 051: auth_identities table
✅ auth_identities table exists
✅ auth_identities.id column exists
...
✅ Google OAuth users migrated (X/Y)
✅ Email/password users migrated (X/Y)

📋 Testing Migration 052: sessions and refresh_tokens tables
✅ sessions table exists
...
✅ refresh_tokens table exists
...

📋 Testing Migration 053: users table enhancements
✅ users.email_verified column exists
✅ users.status column exists
...

📊 Test Summary
============================================================
✅ Passed: 25
❌ Failed: 0
⚠️  Warnings: 0

✅ All critical tests passed!
```

---

### Step 4: Manual Verification

#### 4.1 Check auth_identities Table

```sql
-- Check table structure
\d auth_identities

-- Count identities by provider
SELECT provider, COUNT(*) as count
FROM auth_identities
GROUP BY provider;

-- Verify Google users migrated
SELECT COUNT(*) as google_users FROM users WHERE google_id IS NOT NULL;
SELECT COUNT(*) as google_identities FROM auth_identities WHERE provider = 'google';

-- Should match (or close - some users might have multiple identities)
```

#### 4.2 Check sessions and refresh_tokens Tables

```sql
-- Check sessions table
\d sessions

-- Check refresh_tokens table
\d refresh_tokens

-- Verify cleanup functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('cleanup_expired_sessions', 'cleanup_expired_refresh_tokens');
```

#### 4.3 Check users Table Enhancements

```sql
-- Check new columns
\d users

-- Verify email_verified column
SELECT email_verified, COUNT(*) 
FROM users 
GROUP BY email_verified;

-- Verify status column
SELECT status, COUNT(*) 
FROM users 
GROUP BY status;

-- Should all be 'active' for existing users
```

#### 4.4 Data Integrity Checks

```sql
-- Check that Google users have auth_identities
SELECT u.id, u.email, u.google_id
FROM users u
LEFT JOIN auth_identities ai ON u.id = ai.user_id AND ai.provider = 'google'
WHERE u.google_id IS NOT NULL
  AND ai.id IS NULL;

-- Should return 0 rows (all Google users should have identities)

-- Check that email/password users have auth_identities
SELECT u.id, u.email
FROM users u
LEFT JOIN auth_identities ai ON u.id = ai.user_id AND ai.provider = 'email_password'
WHERE u.email IS NOT NULL
  AND u.password_hash IS NOT NULL
  AND u.google_id IS NULL
  AND ai.id IS NULL;

-- Should return 0 rows (all email/password users should have identities)
```

---

### Step 5: Test OAuth Flow

After migrations are complete, test the OAuth flow:

1. **Test Google Login**:
   - Navigate to login page
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Verify user is created/linked correctly

2. **Check auth_identities**:
   ```sql
   SELECT * FROM auth_identities 
   WHERE user_id = <your_user_id> 
   ORDER BY created_at DESC;
   ```

3. **Verify Session Creation**:
   ```sql
   SELECT * FROM sessions 
   WHERE user_id = <your_user_id> 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

---

## Troubleshooting

### Issue: Migration Fails

**Symptoms**: Error during migration execution

**Solutions**:
1. Check error message for specific issue
2. Verify database connection
3. Check if tables already exist (might need to drop and recreate in dev)
4. Review migration SQL for syntax errors

### Issue: Data Not Migrated

**Symptoms**: auth_identities table empty after migration

**Possible Causes**:
1. No users in database yet (normal)
2. Migration condition not met (check WHERE clauses)
3. Constraint violations (check unique constraints)

**Solutions**:
```sql
-- Check if users exist
SELECT COUNT(*) FROM users;

-- Check migration conditions
SELECT COUNT(*) FROM users WHERE google_id IS NOT NULL;
SELECT COUNT(*) FROM users WHERE password_hash IS NOT NULL AND google_id IS NULL;

-- Manually check migration queries
-- (Review migration 051 SQL)
```

### Issue: Constraint Violations

**Symptoms**: Unique constraint errors during migration

**Solutions**:
```sql
-- Check for duplicate provider_subject
SELECT provider, provider_subject, COUNT(*) 
FROM auth_identities 
GROUP BY provider, provider_subject 
HAVING COUNT(*) > 1;

-- If found, investigate and fix before re-running migration
```

### Issue: Missing Columns

**Symptoms**: Validation script reports missing columns

**Solutions**:
1. Check if migration actually ran: `SELECT * FROM migrations WHERE filename LIKE '05%'`
2. Verify migration file syntax
3. Check for transaction rollback errors

---

## Rollback Plan

If migrations need to be rolled back:

### Rollback Migration 053

```sql
BEGIN;

-- Remove status column constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_status_values;

-- Remove columns (data will be lost)
ALTER TABLE users DROP COLUMN IF EXISTS status;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_email_verified;

COMMIT;
```

### Rollback Migration 052

```sql
BEGIN;

-- Drop cleanup functions
DROP FUNCTION IF EXISTS cleanup_expired_refresh_tokens();
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- Drop tables (data will be lost)
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS sessions;

COMMIT;
```

### Rollback Migration 051

```sql
BEGIN;

-- Drop table (data will be lost)
DROP TABLE IF EXISTS auth_identities;

COMMIT;
```

**⚠️ WARNING**: Rolling back will lose all data in these tables. Only do this on development/staging databases.

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Migrations tested on development database
- [ ] Validation script passes all tests
- [ ] OAuth flow tested with new migrations
- [ ] Data integrity verified
- [ ] Rollback plan documented
- [ ] Database backup created
- [ ] Migration scripts reviewed
- [ ] Stakeholders notified of maintenance window (if needed)

---

## Next Steps

After migrations are verified:

1. ✅ Proceed to OAuth flow testing (see `PHASE_2_PRE_NEXT_FEATURE_PLAN.md`)
2. ✅ Write unit tests for new services
3. ✅ Test refresh token endpoint
4. ✅ Deploy to production (when ready)

---

*Testing Guide Created: 2026-01-06*

