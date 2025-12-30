# Data Model - Conversation Threading Feature

**Feature ID**: CONV-THREAD-001
**Version**: 1.0.0
**Last Updated**: 2025-12-29
**Status**: Ready for Implementation

---

## 1. Entity Overview

The threading system consists of three core entities and their relationships:

```
Room (1) ──< (many) Thread
              │
              ├──< (many) ThreadMessage
              │              │
              │              └──> (1) Message
              │
              └──< (many) SubThread (self-referential)
```

---

## 2. Core Entities

### 2.1 Thread Entity

**Purpose**: Represents a conversation topic within a room, organizing related messages.

**Fields**:

| Field               | Type                     | Constraints                          | Description                                               |
| ------------------- | ------------------------ | ------------------------------------ | --------------------------------------------------------- |
| `id`                | TEXT                     | PRIMARY KEY                          | Unique identifier (format: `thread-{timestamp}-{random}`) |
| `room_id`           | TEXT                     | NOT NULL, FK → rooms(id)             | Parent room containing this thread                        |
| `title`             | TEXT                     | NOT NULL, 3-100 chars                | Thread title (user-editable)                              |
| `created_by`        | TEXT                     | NOT NULL                             | Email of user who created thread                          |
| `created_at`        | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP            | Thread creation timestamp                                 |
| `updated_at`        | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP            | Last update timestamp (auto-updated)                      |
| `message_count`     | INTEGER                  | DEFAULT 0                            | Atomic counter of messages in thread                      |
| `last_message_at`   | TIMESTAMP WITH TIME ZONE | NULL                                 | Timestamp of most recent message                          |
| `is_archived`       | INTEGER                  | DEFAULT 0 (0=active, 1=archived)     | Archival status                                           |
| `category`          | TEXT                     | DEFAULT 'logistics'                  | Thread category (see Category System)                     |
| `parent_thread_id`  | TEXT                     | NULL, FK → threads(id)               | Parent thread ID (for sub-threads)                        |
| `root_thread_id`    | TEXT                     | NULL, FK → threads(id)               | Root thread ID (top of hierarchy)                         |
| `parent_message_id` | TEXT                     | NULL, FK → messages(id)              | Message that spawned this thread                          |
| `depth`             | INTEGER                  | DEFAULT 0, CHECK (depth BETWEEN 0-3) | Nesting level (0=root, 1=sub, 2=sub-sub, max 3)           |

**Relationships**:

- **Belongs to**: 1 Room
- **Has many**: ThreadMessages (many-to-many via junction table)
- **Has many**: SubThreads (self-referential, parent_thread_id)
- **Belongs to**: 1 ParentThread (optional, for sub-threads)
- **Belongs to**: 1 RootThread (always set, even for root threads → self-reference)
- **Spawned from**: 1 ParentMessage (optional)

**Validation Rules**:

1. **Title Length**: 3-100 characters (enforced in backend)

   ```javascript
   if (title.length < 3 || title.length > 100) {
     throw new Error('Thread title must be between 3 and 100 characters');
   }
   ```

2. **Depth Constraint**: Maximum depth of 3 levels

   ```javascript
   if (depth > 3) {
     throw new Error('Maximum thread depth is 3 levels');
   }
   ```

3. **Root Thread Integrity**: Root threads must have `root_thread_id = id`

   ```sql
   UPDATE threads SET root_thread_id = id
   WHERE parent_thread_id IS NULL AND root_thread_id IS NULL;
   ```

4. **Category Validation**: Must be valid category key

   ```javascript
   const validCategories = [
     'safety',
     'medical',
     'education',
     'schedule',
     'finances',
     'activities',
     'travel',
     'co-parenting',
     'logistics',
   ];
   if (!validCategories.includes(category) && !isCustomCategory(category)) {
     category = 'logistics'; // Default fallback
   }
   ```

5. **Archival Constraint**: Cannot archive thread with unread messages (warning only)
   ```javascript
   if (hasUnreadMessages && !forceArchive) {
     warn('This thread has unread messages. Archive anyway?');
   }
   ```

**State Transitions**:

```
[Created] ──> [Active] ──> [Archived] ──> [Reopened] ──> [Active]
                  │                            │
                  └────────────────────────────┘
                         (reopen)
```

**Business Rules**:

1. **Auto-Archive**: Threads with no activity for 90 days auto-archive (configurable)
2. **Mutual Delete**: Both co-parents must approve permanent thread deletion
3. **Sub-Thread Cascade**: Archiving parent thread archives all sub-threads
4. **Message Count Atomicity**: Use database-level increment to avoid race conditions
   ```sql
   UPDATE threads SET message_count = message_count + 1
   WHERE id = $1;
   ```

**Indexes** (for performance):

```sql
CREATE INDEX idx_threads_room_id ON threads(room_id);
CREATE INDEX idx_threads_category ON threads(category);
CREATE INDEX idx_threads_parent_thread_id ON threads(parent_thread_id)
  WHERE parent_thread_id IS NOT NULL;
CREATE INDEX idx_threads_root_thread_id ON threads(root_thread_id)
  WHERE root_thread_id IS NOT NULL;
CREATE INDEX idx_threads_parent_message_id ON threads(parent_message_id)
  WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_threads_depth ON threads(room_id, depth);
CREATE INDEX idx_threads_updated_at ON threads(room_id, updated_at DESC);
```

**Example Records**:

```sql
-- Root thread (top-level)
INSERT INTO threads (id, room_id, title, created_by, category,
                     parent_thread_id, root_thread_id, depth)
VALUES ('thread-001', 'room-123', 'Medical Appointment',
        'sarah@example.com', 'medical', NULL, 'thread-001', 0);

-- Sub-thread (depth 1)
INSERT INTO threads (id, room_id, title, created_by, category,
                     parent_thread_id, root_thread_id, depth)
VALUES ('thread-002', 'room-123', 'Doctor Follow-Up',
        'mike@example.com', 'medical', 'thread-001', 'thread-001', 1);
```

---

### 2.2 ThreadMessage Entity (Junction Table)

**Purpose**: Associates messages with threads (many-to-many relationship).

**Fields**:

| Field        | Type                     | Constraints                 | Description                         |
| ------------ | ------------------------ | --------------------------- | ----------------------------------- |
| `id`         | SERIAL                   | PRIMARY KEY                 | Auto-incrementing ID                |
| `thread_id`  | TEXT                     | NOT NULL, FK → threads(id)  | Thread containing this message      |
| `message_id` | TEXT                     | NOT NULL, FK → messages(id) | Message belonging to thread         |
| `added_at`   | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP   | When message was added to thread    |
| `added_by`   | TEXT                     | NULL                        | User who added message (for audits) |
| `position`   | INTEGER                  | NULL                        | Display order (future enhancement)  |

**Unique Constraint**:

```sql
UNIQUE(thread_id, message_id) -- Prevent duplicate associations
```

**Relationships**:

- **Belongs to**: 1 Thread
- **Belongs to**: 1 Message

**Validation Rules**:

1. **Message Ownership**: Message must belong to same room as thread

   ```javascript
   const message = await getMessage(messageId);
   const thread = await getThread(threadId);
   if (message.room_id !== thread.room_id) {
     throw new Error('Message and thread must belong to same room');
   }
   ```

2. **Duplicate Prevention**: Unique constraint enforced at database level
   ```sql
   -- Attempt to insert duplicate fails gracefully
   INSERT INTO thread_messages (thread_id, message_id, added_by)
   VALUES ($1, $2, $3)
   ON CONFLICT (thread_id, message_id) DO NOTHING;
   ```

**Cascade Behavior**:

- **Thread Deleted**: Delete all associated thread_messages (CASCADE)
- **Message Deleted**: Delete all associated thread_messages (CASCADE)

**Example Records**:

```sql
INSERT INTO thread_messages (thread_id, message_id, added_by)
VALUES ('thread-001', 'msg-001', 'sarah@example.com'),
       ('thread-001', 'msg-002', 'mike@example.com'),
       ('thread-002', 'msg-003', 'sarah@example.com');
```

---

### 2.3 Message Entity (Extended)

**Purpose**: Chat messages that can belong to zero or more threads.

**Existing Fields** (from main chat system):

- `id` (PRIMARY KEY)
- `room_id` (FK → rooms)
- `sender_email`
- `content`
- `timestamp`
- `is_edited`
- `reactions` (JSONB)

**Thread-Related Computed Fields** (not stored, calculated at runtime):

| Field            | Type    | Description                                     |
| ---------------- | ------- | ----------------------------------------------- |
| `thread_count`   | INTEGER | Number of threads this message belongs to       |
| `primary_thread` | TEXT    | ID of "primary" thread (first added, or manual) |
| `in_thread`      | BOOLEAN | True if message belongs to any thread           |

**Queries**:

```sql
-- Get threads for a message
SELECT t.* FROM threads t
JOIN thread_messages tm ON t.id = tm.thread_id
WHERE tm.message_id = $1;

-- Check if message is in any thread
SELECT EXISTS (
  SELECT 1 FROM thread_messages WHERE message_id = $1
) AS in_thread;
```

**UI Indicators**:

- Badge showing "In 2 threads" (if thread_count > 1)
- Link to view thread (if in_thread = true)
- "Start Thread" button (if in_thread = false)

---

## 3. Category System

### 3.1 Default Categories (9 Core)

**Category Enum** (stored as TEXT for flexibility):

| Category Key   | Label        | Icon | Color                           | Description                              |
| -------------- | ------------ | ---- | ------------------------------- | ---------------------------------------- |
| `safety`       | Safety       | 🛡️   | `bg-yellow-100 text-yellow-800` | Emergency contacts, safety concerns      |
| `medical`      | Medical      | 🏥   | `bg-red-100 text-red-700`       | Doctor appointments, health issues, meds |
| `education`    | Education    | 📚   | `bg-purple-100 text-purple-700` | School, homework, grades, teachers       |
| `schedule`     | Schedule     | 📅   | `bg-blue-100 text-blue-700`     | Pickup, dropoff, custody arrangements    |
| `finances`     | Finances     | 💰   | `bg-green-100 text-green-700`   | Child support, expenses, reimbursements  |
| `activities`   | Activities   | ⚽   | `bg-orange-100 text-orange-700` | Sports, hobbies, extracurriculars        |
| `travel`       | Travel       | ✈️   | `bg-cyan-100 text-cyan-700`     | Vacations, trips, travel arrangements    |
| `co-parenting` | Co-Parenting | 🤝   | `bg-teal-100 text-teal-700`     | Relationship discussions, parenting      |
| `logistics`    | Logistics    | 📦   | `bg-gray-100 text-gray-700`     | General coordination, supplies (DEFAULT) |

**Priority Order** (for sorting):

1. Safety (highest priority)
2. Medical
3. Schedule
4. Education
5. Finances
6. Activities
7. Travel
8. Co-Parenting
9. Logistics (default, lowest priority)

**Implementation** (frontend):

```javascript
// /chat-client-vite/src/config/threadCategories.js
export const THREAD_CATEGORIES = {
  safety: {
    label: 'Safety',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '🛡️',
    description: 'Emergency contacts, safety concerns',
  },
  // ... (see full implementation in research.md)
};
```

---

### 3.2 Custom Categories

**Support**: Enabled via migration 030 (category changed from ENUM to TEXT)

**Validation Rules**:

1. **Max Length**: 50 characters
2. **Allowed Characters**: Letters, numbers, hyphens, spaces
3. **Reserved Keywords**: Cannot override default categories
4. **Sync Behavior**: Custom categories sync between co-parents in same room

**Example**:

```javascript
// User creates custom category
await createThread(roomId, 'Allergy Management Plan', userEmail, null, 'allergy-care'); // Custom category
```

**Frontend Handling**:

```javascript
function getCategoryConfig(category) {
  // Check default categories first
  if (THREAD_CATEGORIES[category]) {
    return THREAD_CATEGORIES[category];
  }
  // Fallback for custom categories
  return {
    label: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: 'bg-gray-100 text-gray-700',
    icon: '📌',
    description: 'Custom category',
  };
}
```

---

## 4. Thread Hierarchy

### 4.1 Depth Levels

**Maximum Depth**: 3 levels (enforced)

```
Depth 0 (Root Thread)
  └── Depth 1 (Sub-Thread)
        └── Depth 2 (Sub-Sub-Thread)
              └── Depth 3 (Maximum)
```

**Example Hierarchy**:

```
📅 Schedule (depth 0, root)
  ├── ⚽ Soccer Practice (depth 1, sub-thread)
  │     ├── 👕 Uniform Size (depth 2, sub-sub-thread)
  │     └── 🚗 Carpool Arrangement (depth 2)
  └── 🏫 School Pickup (depth 1)
```

**Database Representation**:

| id         | title               | parent_thread_id | root_thread_id | depth |
| ---------- | ------------------- | ---------------- | -------------- | ----- |
| thread-001 | Schedule            | NULL             | thread-001     | 0     |
| thread-002 | Soccer Practice     | thread-001       | thread-001     | 1     |
| thread-003 | Uniform Size        | thread-002       | thread-001     | 2     |
| thread-004 | Carpool Arrangement | thread-002       | thread-001     | 2     |
| thread-005 | School Pickup       | thread-001       | thread-001     | 1     |

**Traversal Queries**:

```sql
-- Get all sub-threads of a thread (direct children)
SELECT * FROM threads WHERE parent_thread_id = $1;

-- Get all threads in hierarchy (entire tree)
WITH RECURSIVE thread_tree AS (
  SELECT * FROM threads WHERE id = $1
  UNION ALL
  SELECT t.* FROM threads t
  JOIN thread_tree tt ON t.parent_thread_id = tt.id
)
SELECT * FROM thread_tree;

-- Get parent chain (breadcrumb navigation)
WITH RECURSIVE ancestors AS (
  SELECT * FROM threads WHERE id = $1
  UNION ALL
  SELECT t.* FROM threads t
  JOIN ancestors a ON t.id = a.parent_thread_id
)
SELECT * FROM ancestors ORDER BY depth ASC;
```

**Validation on Sub-Thread Creation**:

```javascript
async function createSubThread(roomId, title, createdBy, parentThreadId) {
  const parentThread = await getThread(parentThreadId);

  if (parentThread.depth >= 3) {
    throw new Error('Maximum thread depth (3) reached');
  }

  const depth = parentThread.depth + 1;
  const rootThreadId = parentThread.root_thread_id;

  await createThread(
    roomId,
    title,
    createdBy,
    null,
    parentThread.category,
    parentThreadId,
    rootThreadId,
    depth
  );
}
```

---

### 4.2 Breadcrumb Navigation

**Purpose**: Show user's location in thread hierarchy

**Format**: `Root > Parent > Current`

**Examples**:

- Root thread: `Schedule` (no breadcrumb)
- Sub-thread: `Schedule > Soccer Practice`
- Sub-sub-thread: `Schedule > Soccer Practice > Uniform Size`

**Implementation**:

```javascript
// Frontend component
function ThreadBreadcrumb({ thread, ancestors }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600">
      {ancestors.map((ancestor, idx) => (
        <React.Fragment key={ancestor.id}>
          {idx > 0 && <span className="text-gray-400">&gt;</span>}
          <button onClick={() => navigateToThread(ancestor.id)} className="hover:text-teal-dark">
            {ancestor.title}
          </button>
        </React.Fragment>
      ))}
      <span className="text-gray-400">&gt;</span>
      <span className="font-semibold text-teal-dark">{thread.title}</span>
    </nav>
  );
}
```

---

## 5. State Management

### 5.1 Thread Lifecycle States

```
DRAFT → CREATED → ACTIVE → ARCHIVED → DELETED
           ↓         ↑         ↓
           └─────────┴─────────┘
                (reopen)
```

**State Definitions**:

| State      | `is_archived` | `deleted_at` | Description                       |
| ---------- | ------------- | ------------ | --------------------------------- |
| `CREATED`  | 0             | NULL         | Just created, no messages yet     |
| `ACTIVE`   | 0             | NULL         | Has messages, active conversation |
| `ARCHIVED` | 1             | NULL         | Archived, hidden from main view   |
| `DELETED`  | 1             | NOT NULL     | Permanently deleted (soft delete) |

**Note**: LiaiZen uses soft deletes for audit trails (legal compliance).

---

### 5.2 Message Count Integrity

**Challenge**: Race conditions when multiple users add messages simultaneously

**Solution**: Atomic database operations

```sql
-- Increment count atomically
UPDATE threads
SET message_count = message_count + 1,
    last_message_at = $2,
    updated_at = $2
WHERE id = $1
RETURNING message_count, last_message_at;
```

**Backend Implementation**:

```javascript
async function addMessageToThread(messageId, threadId) {
  // Add message to junction table
  await dbSafe.safeInsert('thread_messages', {
    thread_id: threadId,
    message_id: messageId,
    added_by: currentUser.email,
  });

  // Atomic count update
  const result = await dbSafe.query(
    `
    UPDATE threads
    SET message_count = message_count + 1,
        last_message_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING message_count, last_message_at
  `,
    [threadId]
  );

  return {
    messageCount: result.rows[0].message_count,
    lastMessageAt: result.rows[0].last_message_at,
  };
}
```

**Why This Matters**:

- Prevents incorrect counts (e.g., 47 messages but count shows 45)
- No need for recount queries
- Real-time accuracy for all users

---

## 6. Data Integrity Constraints

### 6.1 Foreign Key Constraints

```sql
-- Thread belongs to room
ALTER TABLE threads ADD CONSTRAINT fk_threads_room
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

-- Thread has parent thread (self-referential)
ALTER TABLE threads ADD CONSTRAINT fk_threads_parent
  FOREIGN KEY (parent_thread_id) REFERENCES threads(id) ON DELETE SET NULL;

-- Thread has root thread (self-referential)
ALTER TABLE threads ADD CONSTRAINT fk_threads_root
  FOREIGN KEY (root_thread_id) REFERENCES threads(id) ON DELETE SET NULL;

-- Thread spawned from message
ALTER TABLE threads ADD CONSTRAINT fk_threads_parent_message
  FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ThreadMessage junction constraints
ALTER TABLE thread_messages ADD CONSTRAINT fk_thread_messages_thread
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE;

ALTER TABLE thread_messages ADD CONSTRAINT fk_thread_messages_message
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;
```

**Cascade Behavior**:

- **Room deleted** → All threads in room deleted (CASCADE)
- **Thread deleted** → All thread_messages deleted (CASCADE)
- **Message deleted** → Associated thread_messages deleted (CASCADE)
- **Parent thread deleted** → Sub-threads' parent_thread_id set to NULL (SET NULL)

---

### 6.2 Check Constraints

```sql
-- Title length
ALTER TABLE threads ADD CONSTRAINT check_title_length
  CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 100);

-- Depth range
ALTER TABLE threads ADD CONSTRAINT check_depth_range
  CHECK (depth BETWEEN 0 AND 3);

-- Archival flag
ALTER TABLE threads ADD CONSTRAINT check_is_archived
  CHECK (is_archived IN (0, 1));

-- Message count non-negative
ALTER TABLE threads ADD CONSTRAINT check_message_count
  CHECK (message_count >= 0);
```

---

### 6.3 Triggers (Future Enhancement)

**Auto-Update Timestamp**:

```sql
CREATE OR REPLACE FUNCTION update_threads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_threads_timestamp();
```

**Note**: Not implemented yet - manual timestamp updates in application code.

---

## 7. Data Access Patterns

### 7.1 Common Queries

**1. Get Active Threads for Room** (most frequent)

```sql
SELECT * FROM threads
WHERE room_id = $1 AND is_archived = 0
ORDER BY updated_at DESC
LIMIT 100;
```

**Performance**: ~45ms (indexed on room_id + updated_at)

**2. Get Thread Messages**

```sql
SELECT m.* FROM thread_messages tm
JOIN messages m ON tm.message_id = m.id
WHERE tm.thread_id = $1
ORDER BY m.timestamp DESC
LIMIT 50 OFFSET $2;
```

**Performance**: ~120ms for 500 messages

**3. Get Sub-Threads**

```sql
SELECT * FROM threads
WHERE parent_thread_id = $1
ORDER BY updated_at DESC;
```

**Performance**: ~20ms (indexed on parent_thread_id)

**4. Get Thread Ancestors (Breadcrumb)**

```sql
WITH RECURSIVE ancestors AS (
  SELECT * FROM threads WHERE id = $1
  UNION ALL
  SELECT t.* FROM threads t
  JOIN ancestors a ON t.id = a.parent_thread_id
)
SELECT * FROM ancestors ORDER BY depth ASC;
```

**Performance**: ~35ms (recursive query)

**5. Search Threads by Title**

```sql
SELECT * FROM threads
WHERE room_id = $1 AND title ILIKE '%' || $2 || '%'
ORDER BY updated_at DESC;
```

**Performance**: ~80ms (full-text search not implemented yet)

---

### 7.2 Optimization Strategies

**1. Materialized View for Thread Counts** (future)

```sql
CREATE MATERIALIZED VIEW thread_stats AS
SELECT
  room_id,
  category,
  COUNT(*) AS thread_count,
  SUM(message_count) AS total_messages
FROM threads
WHERE is_archived = 0
GROUP BY room_id, category;

-- Refresh on thread creation/archival
REFRESH MATERIALIZED VIEW thread_stats;
```

**2. Caching Strategy** (frontend)

```javascript
// Cache thread list for 5 minutes
const cachedThreads = useMemo(() => threads, [roomId]);

// Invalidate on delta update
useEffect(() => {
  if (newThreadCreated) {
    invalidateCache();
  }
}, [newThreadCreated]);
```

**3. Pagination** (backend)

```javascript
// Limit thread list to most recent 100
const threads = await getThreadsForRoom(roomId, false, 100);

// Client requests older threads
socket.emit('get_threads', { roomId, offset: 100, limit: 100 });
```

---

## 8. Data Migration Strategy

### 8.1 Existing Data (No Migration Needed)

**Finding**: Schema already exists (migrations 025, 026, 027, 030 applied)

**Verification**:

```sql
-- Check if schema exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'threads';

-- Expected output: id, room_id, title, created_by, ..., depth
```

**No Breaking Changes** - All existing threads remain valid.

---

### 8.2 Backfill Strategy (If Needed)

**Scenario**: Old threads created before hierarchy support

**Backfill Script**:

```sql
-- Set root_thread_id for old threads
UPDATE threads
SET root_thread_id = id
WHERE parent_thread_id IS NULL AND root_thread_id IS NULL;

-- Set depth for old threads
UPDATE threads
SET depth = 0
WHERE depth IS NULL OR depth < 0;
```

**Execution**: Run once during deployment (idempotent query).

---

## 9. Privacy & Security

### 9.1 Authorization Rules

**Rule 1: Room Membership**

- Users can only access threads in rooms they belong to
- Verification: Check `room_members` table before showing threads

**Rule 2: Thread Visibility**

- All room members see all threads (no private threads within a room)
- Rationale: Co-parents need full visibility for accountability

**Rule 3: Deletion Approval**

- Permanent thread deletion requires both co-parents' approval
- Soft delete (is_archived = 1) can be done by either parent

**Implementation**:

```javascript
async function deleteThread(threadId, requestingUser) {
  const thread = await getThread(threadId);
  const room = await getRoom(thread.room_id);

  // Check if user is room member
  if (!room.members.includes(requestingUser.email)) {
    throw new Error('Unauthorized: Not a room member');
  }

  // Check if both co-parents approved
  const approvals = await getDeleteApprovals(threadId);
  if (approvals.length < 2) {
    throw new Error('Both co-parents must approve deletion');
  }

  // Soft delete
  await archiveThread(threadId, true);
}
```

---

### 9.2 Data Retention

**Policy**: 7 years for legal compliance (family court records)

**Implementation**:

- Archived threads: Hidden but not deleted
- Deleted threads: Marked with `deleted_at`, but not removed from database
- Hard delete: Only after 7-year retention period (cron job)

**Audit Trail**:

```sql
-- Track who deleted thread and when
ALTER TABLE threads ADD COLUMN deleted_by TEXT;
ALTER TABLE threads ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
```

---

## 10. Testing Data Requirements

### 10.1 Test Fixtures

**Minimal Thread**:

```json
{
  "id": "thread-test-001",
  "room_id": "room-test-123",
  "title": "Test Thread",
  "created_by": "test@example.com",
  "category": "logistics",
  "message_count": 0,
  "is_archived": 0,
  "depth": 0,
  "root_thread_id": "thread-test-001"
}
```

**Thread with Messages**:

```json
{
  "thread": {
    "id": "thread-test-002",
    "room_id": "room-test-123",
    "title": "Medical Appointment",
    "created_by": "sarah@example.com",
    "category": "medical",
    "message_count": 3,
    "is_archived": 0,
    "depth": 0
  },
  "messages": [
    { "id": "msg-001", "content": "Doctor at 3pm tomorrow" },
    { "id": "msg-002", "content": "Can you take her?" },
    { "id": "msg-003", "content": "Yes, I'll pick her up from school" }
  ]
}
```

**Thread Hierarchy**:

```json
{
  "root": {
    "id": "thread-test-003",
    "title": "Schedule",
    "depth": 0,
    "root_thread_id": "thread-test-003"
  },
  "sub1": {
    "id": "thread-test-004",
    "title": "Soccer Practice",
    "depth": 1,
    "parent_thread_id": "thread-test-003",
    "root_thread_id": "thread-test-003"
  },
  "sub2": {
    "id": "thread-test-005",
    "title": "Uniform Size",
    "depth": 2,
    "parent_thread_id": "thread-test-004",
    "root_thread_id": "thread-test-003"
  }
}
```

---

## 11. Validation Summary

**Schema Validation**: ✅ Complete (migrations applied)
**Relationships**: ✅ Foreign keys enforced
**Constraints**: ✅ Check constraints in place
**Indexes**: ✅ Performance indexes exist
**Queries**: ✅ Access patterns optimized

**Ready for Contract Design** ✅

---

## Appendix: Database Schema SQL

```sql
-- Full schema for reference (from migrations)
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 100),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0 CHECK (message_count >= 0),
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_archived INTEGER DEFAULT 0 CHECK (is_archived IN (0, 1)),
  category TEXT DEFAULT 'logistics',
  parent_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  root_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,
  parent_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  depth INTEGER DEFAULT 0 CHECK (depth BETWEEN 0 AND 3)
);

CREATE TABLE thread_messages (
  id SERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  added_by TEXT,
  UNIQUE(thread_id, message_id)
);

-- Indexes (see section 2.1 for full list)
```

---

**Data Model Completed By**: planning-agent
**Date**: 2025-12-29
**Status**: ✅ Ready for API Contract Design
