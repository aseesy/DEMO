-- Create threads for athena-yashir conversation based on topic analysis
-- Run this via: railway connect postgres < scripts/create-threads-sql.sql

-- Topic 1: Pickup/Dropoff
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-pickup-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'Pickup and Dropoff Times',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Topic 2: School Schedule
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-school-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'School Schedule and Activities',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Topic 3: Soccer/Activities
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-soccer-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'Soccer and Activity Payments',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Topic 4: Bedtime/Sleep
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-bedtime-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'Bedtime and Sleep Schedule',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Topic 5: Travel/Dates
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-travel-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'Travel Plans and Dates',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Topic 6: Location/Meeting
INSERT INTO threads (id, room_id, title, created_by, created_at, updated_at, message_count, is_archived)
VALUES (
  'thread-location-' || EXTRACT(EPOCH FROM NOW())::text,
  'room_1765827298745_878fce74a53e7',
  'Meeting Locations',
  'system',
  NOW(),
  NOW(),
  0,
  0
) ON CONFLICT (id) DO NOTHING;

-- Now associate messages with threads based on content
-- Pickup/Dropoff messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'Pickup and Dropoff Times' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%pickup%' 
    OR LOWER(text) LIKE '%pick up%' 
    OR LOWER(text) LIKE '%drop off%' 
    OR LOWER(text) LIKE '%pick her%' 
    OR LOWER(text) LIKE '%get her%'
    OR LOWER(text) LIKE '%pick vira%'
    OR LOWER(text) LIKE '%pickup vira%'
  );

-- School Schedule messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'School Schedule and Activities' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%school%' 
    OR LOWER(text) LIKE '%teacher%' 
    OR LOWER(text) LIKE '%homework%' 
    OR LOWER(text) LIKE '%3:15%' 
    OR LOWER(text) LIKE '%after school%'
    OR LOWER(text) LIKE '%semester%'
    OR LOWER(text) LIKE '%winter fair%'
  );

-- Soccer/Activities messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'Soccer and Activity Payments' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%soccer%' 
    OR LOWER(text) LIKE '%practice%' 
    OR LOWER(text) LIKE '%game%' 
    OR LOWER(text) LIKE '%venmo%' 
    OR LOWER(text) LIKE '%pay%'
    OR LOWER(text) LIKE '%payment%'
    OR LOWER(text) LIKE '%225%'
    OR LOWER(text) LIKE '%register%'
  );

-- Bedtime/Sleep messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'Bedtime and Sleep Schedule' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%bed%' 
    OR LOWER(text) LIKE '%sleep%' 
    OR LOWER(text) LIKE '%tired%' 
    OR (LOWER(text) LIKE '%8%' AND LOWER(text) LIKE '%tonight%')
    OR LOWER(text) LIKE '%go to bed%'
    OR LOWER(text) LIKE '%falls asleep%'
  );

-- Travel/Dates messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'Travel Plans and Dates' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%mexico%' 
    OR LOWER(text) LIKE '%trip%' 
    OR (LOWER(text) LIKE '%22%' AND LOWER(text) LIKE '%24%')
    OR LOWER(text) LIKE '%winter%'
    OR LOWER(text) LIKE '%29%'
    OR LOWER(text) LIKE '%30%'
    OR LOWER(text) LIKE '%3rd%'
  );

-- Location/Meeting messages
UPDATE messages
SET thread_id = (SELECT id FROM threads WHERE room_id = 'room_1765827298745_878fce74a53e7' AND title = 'Meeting Locations' LIMIT 1)
WHERE room_id = 'room_1765827298745_878fce74a53e7'
  AND (thread_id IS NULL OR thread_id = '')
  AND type != 'system'
  AND (private = 0 OR private IS NULL)
  AND (flagged = 0 OR flagged IS NULL)
  AND (
    LOWER(text) LIKE '%address%' 
    OR LOWER(text) LIKE '%fargo%' 
    OR LOWER(text) LIKE '%chevron%' 
    OR LOWER(text) LIKE '%grocery%'
    OR LOWER(text) LIKE '%roscrans%'
    OR LOWER(text) LIKE '%el cajon%'
  );

-- Update thread message counts
UPDATE threads t
SET message_count = (
  SELECT COUNT(*) 
  FROM messages m 
  WHERE m.thread_id = t.id
),
updated_at = NOW(),
last_message_at = (
  SELECT MAX(timestamp) 
  FROM messages m 
  WHERE m.thread_id = t.id
)
WHERE t.room_id = 'room_1765827298745_878fce74a53e7';

-- Show summary
SELECT 
  t.title,
  t.message_count,
  COUNT(m.id) as actual_message_count,
  MIN(m.timestamp) as first_message,
  MAX(m.timestamp) as last_message
FROM threads t
LEFT JOIN messages m ON m.thread_id = t.id
WHERE t.room_id = 'room_1765827298745_878fce74a53e7'
GROUP BY t.id, t.title, t.message_count
ORDER BY t.created_at DESC;

