-- Common SQLite Queries for LiaiZen Database
-- Use these with SQLite MCP server

-- ============================================
-- USER QUERIES
-- ============================================

-- Get all users with profile information
SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    created_at,
    updated_at
FROM users
ORDER BY created_at DESC;

-- Find users with incomplete profiles
SELECT 
    id,
    username,
    email,
    CASE 
        WHEN first_name IS NULL OR first_name = '' THEN 'Missing'
        ELSE first_name
    END as first_name,
    CASE 
        WHEN last_name IS NULL OR last_name = '' THEN 'Missing'
        ELSE last_name
    END as last_name
FROM users
WHERE first_name IS NULL OR first_name = '' 
   OR last_name IS NULL OR last_name = '';

-- Count users by registration date
SELECT 
    DATE(created_at) as registration_date,
    COUNT(*) as user_count
FROM users
GROUP BY DATE(created_at)
ORDER BY registration_date DESC;

-- ============================================
-- CONTACT QUERIES
-- ============================================

-- Get all contacts with user information
SELECT 
    c.id,
    u.username as user,
    c.contact_name,
    c.relationship,
    c.contact_email,
    c.created_at
FROM contacts c
JOIN users u ON c.user_id = u.id
ORDER BY u.username, c.relationship;

-- Count contacts by relationship type
SELECT 
    relationship,
    COUNT(*) as count
FROM contacts
GROUP BY relationship
ORDER BY count DESC;

-- Find co-parent relationships
SELECT 
    u1.username as user1,
    u2.username as user2,
    c1.contact_name,
    c1.contact_email
FROM contacts c1
JOIN users u1 ON c1.user_id = u1.id
JOIN contacts c2 ON c1.contact_email = c2.contact_email
JOIN users u2 ON c2.user_id = u2.id
WHERE c1.relationship LIKE '%Co-Parent%'
  AND u1.id != u2.id;

-- Users with their contact counts
SELECT 
    u.username,
    COUNT(c.id) as contact_count,
    COUNT(CASE WHEN c.relationship LIKE '%Child%' THEN 1 END) as children_count,
    COUNT(CASE WHEN c.relationship LIKE '%Co-Parent%' THEN 1 END) as coparent_count
FROM users u
LEFT JOIN contacts c ON u.id = c.user_id
GROUP BY u.id, u.username
ORDER BY contact_count DESC;

-- ============================================
-- TASK QUERIES
-- ============================================

-- Get all tasks with user information
SELECT 
    t.id,
    u.username,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at
FROM tasks t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- Task statistics by user
SELECT 
    u.username,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN t.status = 'open' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_priority_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.username
ORDER BY total_tasks DESC;

-- Tasks by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks), 2) as percentage
FROM tasks
GROUP BY status;

-- Overdue tasks
SELECT 
    t.id,
    u.username,
    t.title,
    t.due_date,
    t.priority,
    JULIANDAY('now') - JULIANDAY(t.due_date) as days_overdue
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'open'
  AND t.due_date IS NOT NULL
  AND t.due_date < date('now')
ORDER BY days_overdue DESC;

-- Tasks assigned to contacts
SELECT 
    t.id,
    t.title,
    u.username as task_owner,
    c.contact_name as assigned_to,
    t.status,
    t.priority
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN contacts c ON t.assigned_to = c.id
WHERE t.assigned_to IS NOT NULL AND t.assigned_to != ''
ORDER BY t.created_at DESC;

-- ============================================
-- MESSAGE QUERIES
-- ============================================

-- Recent messages with user and room info
SELECT 
    m.id,
    u.username as sender,
    r.room_name,
    SUBSTR(m.message, 1, 50) as message_preview,
    m.timestamp
FROM messages m
JOIN users u ON m.user_id = u.id
JOIN rooms r ON m.room_id = r.id
ORDER BY m.timestamp DESC
LIMIT 50;

-- Message count by room
SELECT 
    r.room_name,
    COUNT(m.id) as message_count,
    MAX(m.timestamp) as last_message_time
FROM rooms r
LEFT JOIN messages m ON r.id = m.room_id
GROUP BY r.id, r.room_name
ORDER BY message_count DESC;

-- Messages in last 24 hours
SELECT 
    u.username,
    r.room_name,
    COUNT(*) as message_count
FROM messages m
JOIN users u ON m.user_id = u.id
JOIN rooms r ON m.room_id = r.id
WHERE m.timestamp > datetime('now', '-1 day')
GROUP BY u.id, r.id
ORDER BY message_count DESC;

-- ============================================
-- ROOM QUERIES
-- ============================================

-- Room memberships
SELECT 
    r.room_name,
    u.username,
    rm.joined_at
FROM rooms r
JOIN room_members rm ON r.id = rm.room_id
JOIN users u ON rm.user_id = u.id
ORDER BY r.room_name, u.username;

-- Rooms with member counts
SELECT 
    r.room_name,
    COUNT(DISTINCT rm.user_id) as member_count,
    COUNT(DISTINCT m.id) as message_count,
    MAX(m.timestamp) as last_activity
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
LEFT JOIN messages m ON r.id = m.room_id
GROUP BY r.id, r.room_name
ORDER BY last_activity DESC;

-- ============================================
-- DATABASE SCHEMA QUERIES
-- ============================================

-- Get all table names
SELECT name FROM sqlite_master 
WHERE type='table' 
ORDER BY name;

-- Get schema for a specific table
-- Usage: Replace 'users' with table name
PRAGMA table_info(users);
PRAGMA table_info(contacts);
PRAGMA table_info(tasks);
PRAGMA table_info(messages);
PRAGMA table_info(rooms);
PRAGMA table_info(room_members);

-- Get foreign key relationships
SELECT 
    m.name as table_name,
    p."from" as from_column,
    p."table" as references_table,
    p."to" as references_column
FROM sqlite_master m
JOIN pragma_foreign_key_list(m.name) p
WHERE m.type = 'table'
ORDER BY m.name, p.id;

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- User engagement metrics
SELECT 
    u.username,
    COUNT(DISTINCT t.id) as tasks_created,
    COUNT(DISTINCT c.id) as contacts_added,
    COUNT(DISTINCT m.id) as messages_sent,
    COUNT(DISTINCT r.id) as rooms_joined
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN contacts c ON u.id = c.user_id
LEFT JOIN messages m ON u.id = m.user_id
LEFT JOIN room_members rm ON u.id = rm.user_id
LEFT JOIN rooms r ON rm.room_id = r.id
GROUP BY u.id, u.username
ORDER BY tasks_created DESC, messages_sent DESC;

-- Daily activity summary
SELECT 
    DATE(timestamp) as activity_date,
    'task' as activity_type,
    COUNT(*) as count
FROM tasks
GROUP BY DATE(created_at)
UNION ALL
SELECT 
    DATE(timestamp) as activity_date,
    'message' as activity_type,
    COUNT(*) as count
FROM messages
GROUP BY DATE(timestamp)
ORDER BY activity_date DESC, activity_type;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Find orphaned records (tasks without users)
SELECT * FROM tasks 
WHERE user_id NOT IN (SELECT id FROM users);

-- Find orphaned contacts
SELECT * FROM contacts 
WHERE user_id NOT IN (SELECT id FROM users);

-- Database size information
SELECT 
    name as table_name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as row_count
FROM sqlite_master m
WHERE type='table' AND name NOT LIKE 'sqlite_%';

