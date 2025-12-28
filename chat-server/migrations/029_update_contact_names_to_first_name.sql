-- Migration 029: Update contact names to use first_name instead of username
-- For contacts with linked_user_id, update contact_name to use the linked user's first_name
-- This ensures contacts display first names instead of usernames

-- Update contacts that have linked_user_id to use first_name from the linked user
UPDATE contacts c
SET contact_name = COALESCE(
  u.first_name,
  u.display_name,
  SPLIT_PART(u.email, '@', 1), -- Use email prefix if no name available
  c.contact_name -- Keep existing if nothing else available
),
updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE c.linked_user_id = u.id
  AND c.linked_user_id IS NOT NULL
  AND (
    -- Only update if contact_name appears to be a username (no spaces, matches username pattern)
    -- OR if contact_name matches the username exactly
    c.contact_name = u.username
    OR (c.contact_name NOT LIKE '% %' AND LENGTH(c.contact_name) < 20) -- Likely username pattern
  )
  AND (
    -- Only update if we have a better name available
    u.first_name IS NOT NULL
    OR u.display_name IS NOT NULL
    OR u.email IS NOT NULL
  );

-- Log the number of contacts updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % contacts to use first_name instead of username', updated_count;
END $$;

