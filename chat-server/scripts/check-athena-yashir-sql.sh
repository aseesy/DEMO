#!/bin/bash
# Check athena-yashir relationship using Railway psql connection

echo "🔍 Checking production database for athena and yashir..."
echo ""

# Connect to Railway postgres and run queries
railway connect postgres <<EOF
\echo '👤 Finding Athena user...'
SELECT id, username, email FROM users WHERE email = 'athenasees@gmail.com';

\echo ''
\echo '👤 Finding Yashir user...'
SELECT id, username, email FROM users WHERE email = 'yashir91lora@gmail.com';

\echo ''
\echo '🔗 Checking for co-parent room...'
SELECT r.id, r.name, r.created_at, 
       array_agg(DISTINCT u.username) as usernames
FROM rooms r
JOIN room_members rm ON r.id = rm.room_id
JOIN users u ON rm.user_id = u.id
WHERE rm.user_id IN (
  (SELECT id FROM users WHERE email = 'athenasees@gmail.com'),
  (SELECT id FROM users WHERE email = 'yashir91lora@gmail.com')
)
GROUP BY r.id, r.name, r.created_at
HAVING COUNT(DISTINCT rm.user_id) = 2;
EOF

