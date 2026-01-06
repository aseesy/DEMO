# Schema Standardization Plan

## Problem Statement

Currently, `schema.js` contains runtime column creation functions (`createColumnIfNotExists`, `ensureProfileColumnsExist`) that modify the database schema at runtime. This violates the principle of reproducible schema history and makes it difficult to track schema changes.

## Goal

Stop using runtime column creation for new features. All schema changes must be done via migration files in `migrations/` directory to ensure:
1. **Reproducible schema history** - All changes tracked in version control
2. **Auditability** - Clear history of when and why schema changed
3. **Environment consistency** - Same migrations run in dev, staging, and production
4. **Rollback capability** - Can see what changed and revert if needed

## Current State Analysis

### Runtime Schema Creation in `schema.js`

**File:** `chat-server/src/infrastructure/database/schema.js`

**Functions:**
- `createColumnIfNotExists()` - Creates columns at runtime
- `ensureProfileColumnsExist()` - Creates profile columns at runtime

**Columns Created by `ensureProfileColumnsExist()`:**
- `first_name`, `last_name`, `display_name`
- `address`, `additional_context`, `profile_picture`
- `household_members`
- `communication_style`, `communication_triggers`, `communication_goals`
- `last_login`

### Migration Coverage

**Migration 007:** `007_add_profile_columns.sql`
- ✅ Contains ALL columns from `ensureProfileColumnsExist()`
- ✅ Uses proper `IF NOT EXISTS` checks
- ✅ Already in migrations directory

**Migration 010:** `010_user_profile_comprehensive.sql`
- ✅ Contains 40+ additional profile columns
- ✅ Comprehensive profile system

**Conclusion:** All columns created by runtime functions already exist in migrations!

### Usage Points

1. **`profileService.js` (line 123):**
   ```javascript
   await ensureProfileColumnsExist();
   ```
   - Called before profile updates

2. **`serviceLoader.js` (line 79):**
   ```javascript
   services.ensureProfileColumnsExist = ensureProfileColumnsExist;
   ```
   - Exposed as a service (but only used by profileService)

## Standardization Strategy

### Phase 1: Remove Runtime Column Creation

1. **Remove `ensureProfileColumnsExist()` call from `profileService.js`**
   - Columns are already guaranteed by migration 007
   - If migration hasn't run, it should fail explicitly (not silently create columns)

2. **Deprecate `createColumnIfNotExists()` and `ensureProfileColumnsExist()`**
   - Keep functions but mark as deprecated
   - Change behavior to validate-only (throw error if column missing)
   - Add deprecation warnings

3. **Remove from `serviceLoader.js`**
   - No longer expose as a service

### Phase 2: Convert to Validation-Only

**New Purpose:** `schema.js` should only VALIDATE schema, not modify it.

- Keep `columnExists()` - useful for validation
- Change `createColumnIfNotExists()` to throw error instead of creating
- Remove `ensureProfileColumnsExist()` or make it validation-only

### Phase 3: Update Documentation

- Document that all schema changes must go in migrations
- Add guidelines for creating new migrations
- Update code review checklist

## Implementation Plan

### Step 1: Create Migration Verification

Since we're removing the safety net, we should verify migrations have run:

```javascript
// In schema.js - NEW function
async function verifyRequiredColumnsExist() {
  const requiredColumns = [
    'first_name', 'last_name', 'display_name',
    'address', 'additional_context', 'profile_picture',
    'household_members', 'communication_style',
    'communication_triggers', 'communication_goals', 'last_login'
  ];
  
  const missing = [];
  for (const col of requiredColumns) {
    if (!(await columnExists('users', col))) {
      missing.push(col);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing.join(', ')}. ` +
      `Please run migration 007_add_profile_columns.sql`
    );
  }
}
```

### Step 2: Update profileService.js

Replace runtime creation with validation:

```javascript
// OLD:
await ensureProfileColumnsExist();

// NEW:
// Migrations ensure columns exist - no runtime creation needed
// If column missing, migration should be run
```

### Step 3: Update schema.js

Convert to validation-only pattern:

```javascript
/**
 * @deprecated Use migrations instead. This function no longer creates columns.
 * Throws error if column is missing - forces proper migration usage.
 */
async function createColumnIfNotExists(tableName, columnName, columnType = 'TEXT') {
  const exists = await columnExists(tableName, columnName);
  
  if (!exists) {
    throw new Error(
      `Column ${tableName}.${columnName} does not exist. ` +
      `Please create a migration to add this column instead of using runtime creation.`
    );
  }
  
  return false; // Never creates anymore
}
```

## Migration Guidelines

For new features requiring schema changes:

1. **Create migration file** in `migrations/` directory
2. **Name format:** `XXX_description.sql` (where XXX is next number)
3. **Use `IF NOT EXISTS`** checks to make migrations idempotent
4. **Test migration** on development database
5. **Run migration** via `npm run migrate` before deploying

### Example Migration Template

```sql
-- Migration XXX: Add feature_name columns
-- Created: YYYY-MM-DD
-- Description: Adds columns for new feature X

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE users ADD COLUMN new_column TEXT;
    RAISE NOTICE 'Added new_column to users table';
  END IF;
END $$;
```

## Benefits of Standardization

1. **Reproducibility**: Schema changes tracked in git
2. **Consistency**: Same schema in all environments
3. **Rollback**: Can see history and revert changes
4. **Team Coordination**: Clear when schema changes were made
5. **Deployment Safety**: Migrations run explicitly, not silently

## Risk Mitigation

**Risk:** Removing safety net might cause errors if migrations haven't run

**Mitigation:**
1. Verify all required migrations have run (migration 007)
2. Add startup check to verify schema is up-to-date
3. Clear error messages directing to run migrations
4. Migration 007 already has `IF NOT EXISTS` checks (idempotent)

## Rollout Plan

1. ✅ **Analysis Complete** - Verified all columns exist in migrations
2. **Create validation function** - Add `verifyRequiredColumnsExist()`
3. **Update profileService** - Remove `ensureProfileColumnsExist()` call
4. **Deprecate functions** - Convert to validation-only with warnings
5. **Remove from serviceLoader** - No longer expose as service
6. **Add startup verification** - Optional check on server startup
7. **Update documentation** - Add migration guidelines

## Success Criteria

- [ ] No runtime column creation in production code
- [ ] All schema changes tracked in migration files
- [ ] Clear error messages if schema is missing columns
- [ ] Documentation updated with migration guidelines
- [ ] Code review checklist includes "schema changes in migrations"

