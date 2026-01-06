# Database Migration Guidelines

## Standard: All Schema Changes Must Be in Migration Files

**CRITICAL RULE:** Never create columns, tables, or modify schema at runtime in application code.

All schema changes must be done via `.sql` migration files in the `migrations/` directory.

## Why Migrations?

1. **Reproducible History**: Every schema change is tracked in version control
2. **Auditability**: Clear record of when and why schema changed
3. **Environment Consistency**: Same schema in dev, staging, and production
4. **Rollback Capability**: Can see what changed and revert if needed
5. **Team Coordination**: Everyone knows exactly what schema changes were made

## Creating a New Migration

### Step 1: Determine Migration Number

Check the highest numbered migration:
```bash
ls migrations/ | grep -E '^[0-9]+' | sort -n | tail -1
```

Use the next available number (e.g., if highest is `040`, use `041`).

### Step 2: Create Migration File

Create file: `migrations/041_feature_description.sql`

**Naming Convention:**
- Format: `XXX_description.sql`
- `XXX` = 3-digit migration number (zero-padded)
- `description` = kebab-case description of the change
- Examples:
  - `041_add_notification_preferences.sql`
  - `042_remove_deprecated_columns.sql`
  - `043_add_indexes_for_performance.sql`

### Step 3: Write Migration SQL

Use this template:

```sql
-- Migration XXX: Feature Description
-- Created: YYYY-MM-DD
-- Description: Clear description of what this migration does and why

-- ============================================================================
-- PART 1: Add columns (if applicable)
-- ============================================================================

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

-- ============================================================================
-- PART 2: Create tables (if applicable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS new_table (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PART 3: Add indexes (if applicable)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_new_table_user_id ON new_table(user_id);

-- ============================================================================
-- PART 4: Add constraints (if applicable)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_new_table_status'
  ) THEN
    ALTER TABLE new_table
    ADD CONSTRAINT chk_new_table_status
    CHECK (status IN ('active', 'inactive'));
    RAISE NOTICE 'Added CHECK constraint chk_new_table_status';
  END IF;
END $$;
```

### Step 4: Make Migrations Idempotent

**Always use `IF NOT EXISTS` checks!**

This ensures migrations can be run multiple times safely:
- If migration has already run, it skips the change
- If migration is new, it applies the change
- Prevents errors on re-runs

### Step 5: Test Migration

```bash
# Run migration locally
cd chat-server
npm run migrate

# Verify it worked
npm run verify:constraints  # If adding constraints
```

### Step 6: Commit Migration

```bash
git add migrations/041_feature_description.sql
git commit -m "feat: add notification preferences (migration 041)"
```

## Migration Best Practices

### 1. One Migration Per Feature

Don't mix unrelated changes in one migration:
- ✅ Good: `041_add_notification_preferences.sql`
- ❌ Bad: `041_add_notifications_and_fix_bugs.sql`

### 2. Use Descriptive Names

Migration name should clearly describe what changed:
- ✅ Good: `041_add_notification_preferences.sql`
- ❌ Bad: `041_update.sql`

### 3. Add Comments

Include comments explaining:
- What the migration does
- Why it's needed
- Any special considerations

### 4. Handle Data Migration

If changing existing data:
```sql
-- Migrate existing data
UPDATE users SET new_column = COALESCE(old_column, 'default_value')
WHERE new_column IS NULL;
```

### 5. Consider Rollback

For complex migrations, consider adding rollback instructions in comments:
```sql
-- ROLLBACK (if needed):
-- ALTER TABLE users DROP COLUMN IF EXISTS new_column;
-- DROP TABLE IF EXISTS new_table;
```

### 6. Test on Dev First

Always test migrations on development database before deploying to production.

## Common Migration Patterns

### Adding a Column

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to users table';
  END IF;
END $$;
```

### Adding NOT NULL Column (with default)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'status'
  ) THEN
    -- Add column with default first
    ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
    
    -- Update existing rows
    UPDATE users SET status = 'active' WHERE status IS NULL;
    
    -- Make NOT NULL
    ALTER TABLE users ALTER COLUMN status SET NOT NULL;
    
    RAISE NOTICE 'Added status column to users table';
  END IF;
END $$;
```

### Adding CHECK Constraint

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_status'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT chk_users_status
    CHECK (status IN ('active', 'inactive', 'suspended'));
    RAISE NOTICE 'Added CHECK constraint chk_users_status';
  END IF;
END $$;
```

### Creating a Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = false;
```

### Adding Foreign Key

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_messages_thread_id'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT fk_messages_thread_id
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key fk_messages_thread_id';
  END IF;
END $$;
```

## Running Migrations

### Manual Run

```bash
cd chat-server
npm run migrate
```

### Check Migration Status

```bash
cd chat-server
npm run migrate:status
```

### Verify Constraints

```bash
cd chat-server
npm run verify:constraints
```

## What NOT to Do

### ❌ Don't Create Columns at Runtime

**BAD:**
```javascript
// In application code
await createColumnIfNotExists('users', 'phone', 'TEXT');
```

**GOOD:**
```sql
-- In migrations/041_add_phone.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
```

### ❌ Don't Modify Schema in JavaScript

**BAD:**
```javascript
await db.query('ALTER TABLE users ADD COLUMN phone TEXT');
```

**GOOD:**
Create a migration file instead.

### ❌ Don't Skip Migration Numbers

**BAD:**
- Migration 041 exists
- Next migration is 043 (skipping 042)

**GOOD:**
- Migration 041 exists
- Next migration is 042 (sequential)

## Troubleshooting

### Migration Fails

1. Check error message
2. Fix the SQL in the migration file
3. If migration was partially applied, you may need to manually fix the database
4. Re-run migration: `npm run migrate`

### Column Already Exists

If you see "column already exists" error:
- Migration likely ran partially
- Add `IF NOT EXISTS` check to make migration idempotent
- Re-run migration

### Migration Not Applied

If migration hasn't run:
1. Check `migrations` table: `SELECT * FROM migrations ORDER BY executed_at DESC;`
2. Run migration manually: `npm run migrate`
3. Verify it executed: `npm run migrate:status`

## Migration Checklist

Before committing a new migration:

- [ ] Migration file named correctly (`XXX_description.sql`)
- [ ] Migration number is sequential (no gaps)
- [ ] Uses `IF NOT EXISTS` checks (idempotent)
- [ ] Includes descriptive comments
- [ ] Tested on development database
- [ ] No runtime schema creation in application code
- [ ] Documentation updated if needed

## Related Files

- Migration runner: `run-migration.js`
- Migration status: `scripts/check-migration-status.js`
- Schema utilities: `src/infrastructure/database/schema.js` (validation only)
- Constraints verification: `scripts/verify-migration-035.js`

## Questions?

If you need to add a schema change:
1. Create a migration file (don't modify schema at runtime)
2. Follow the patterns above
3. Test the migration
4. Commit and deploy

For complex migrations or questions, consult with the team before implementing.

