-- Migration 027: Add thread categories
-- Threads must belong to one of the predefined co-parenting categories

-- Create enum type for thread categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'thread_category') THEN
    CREATE TYPE thread_category AS ENUM (
      'schedule',      -- Pickup, dropoff, custody arrangements
      'medical',       -- Doctor appointments, health issues, medications
      'education',     -- School, homework, grades, teachers
      'finances',      -- Child support, shared expenses, reimbursements
      'activities',    -- Sports, hobbies, extracurriculars
      'travel',        -- Vacations, trips, travel arrangements
      'safety',        -- Emergency contacts, safety concerns
      'logistics',     -- General coordination, supplies, belongings
      'co-parenting'   -- Relationship discussions, parenting decisions
    );
  END IF;
END$$;

-- Add category column to threads
ALTER TABLE threads ADD COLUMN IF NOT EXISTS category thread_category DEFAULT 'logistics';

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(room_id, category);

-- Update existing threads with AI-suggested categories based on title keywords
UPDATE threads SET category = 'schedule' WHERE
  LOWER(title) SIMILAR TO '%(pickup|dropoff|drop-off|custody|schedule|weekend|visitation|time|arrangement)%';

UPDATE threads SET category = 'medical' WHERE
  LOWER(title) SIMILAR TO '%(doctor|medical|health|appointment|medication|sick|hospital|dentist|therapy)%'
  AND category = 'logistics';

UPDATE threads SET category = 'education' WHERE
  LOWER(title) SIMILAR TO '%(school|education|homework|teacher|grade|class|tutor|college|learning)%'
  AND category = 'logistics';

UPDATE threads SET category = 'finances' WHERE
  LOWER(title) SIMILAR TO '%(money|payment|expense|cost|bill|support|reimburse|financial|budget)%'
  AND category = 'logistics';

UPDATE threads SET category = 'activities' WHERE
  LOWER(title) SIMILAR TO '%(sport|soccer|basketball|practice|game|activity|hobby|lesson|camp|club)%'
  AND category = 'logistics';

UPDATE threads SET category = 'travel' WHERE
  LOWER(title) SIMILAR TO '%(travel|trip|vacation|flight|passport|visit|holiday)%'
  AND category = 'logistics';

UPDATE threads SET category = 'safety' WHERE
  LOWER(title) SIMILAR TO '%(emergency|safety|concern|danger|worry|secure|protect)%'
  AND category = 'logistics';

UPDATE threads SET category = 'co-parenting' WHERE
  LOWER(title) SIMILAR TO '%(parenting|decision|agree|discuss|relationship|communication|boundary)%'
  AND category = 'logistics';
