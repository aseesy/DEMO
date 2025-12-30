-- Migration 030: Allow custom thread categories
-- Changes category column from ENUM to TEXT to allow user-defined categories
-- This removes the hardcoded domain rule from the database schema

-- Step 1: Add a new TEXT column for categories
ALTER TABLE threads ADD COLUMN IF NOT EXISTS category_text TEXT;

-- Step 2: Copy existing enum values to the new TEXT column
UPDATE threads SET category_text = category::TEXT WHERE category_text IS NULL;

-- Step 3: Set default for new column
ALTER TABLE threads ALTER COLUMN category_text SET DEFAULT 'logistics';

-- Step 4: Make the new column NOT NULL (after data migration)
UPDATE threads SET category_text = 'logistics' WHERE category_text IS NULL;
ALTER TABLE threads ALTER COLUMN category_text SET NOT NULL;

-- Step 5: Drop the old enum column
ALTER TABLE threads DROP COLUMN IF EXISTS category;

-- Step 6: Rename the new column to the original name
ALTER TABLE threads RENAME COLUMN category_text TO category;

-- Step 7: Drop the enum type (optional - keeps schema clean)
-- Note: This will fail if other tables use this enum, so we use IF EXISTS
DROP TYPE IF EXISTS thread_category;

-- Step 8: Recreate index (if it was dropped)
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(room_id, category);

-- Note: The application code should now accept any category string
-- Default categories are suggestions only, not enforced constraints

