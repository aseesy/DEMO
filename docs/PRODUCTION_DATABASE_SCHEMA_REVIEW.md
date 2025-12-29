# PostgreSQL Production Database Schema Review

**Date:** 2025-12-29  
**Environment:** Production (Railway)  
**Database:** PostgreSQL

## Executive Summary

The production database schema is well-structured with proper normalization, appropriate indexes, and good separation of concerns. The schema has evolved through 30+ migrations, transitioning from a simple chat app to a comprehensive co-parenting communication platform.

### Overall Assessment: **GOOD** ✅

**Key Strengths:**

- ✅ Proper normalization (user profile split into 5 tables)
- ✅ Good indexing strategy for common queries
- ✅ Email-based identification (migrated from username)
- ✅ Comprehensive audit logging for compliance
- ✅ Proper foreign key relationships with CASCADE deletes
- ✅ Type safety with CHECK constraints

**Areas of Concern:**

- ⚠️ Some deprecated columns still exist (for backward compatibility)
- ⚠️ Mixed TEXT and JSONB usage (some could be normalized further)
- ⚠️ No explicit partitioning for large tables (messages, threads)

---

## Core Tables

### 1. `users` - Identity and Authentication

**Purpose:** Core user identity and authentication only

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `username` (TEXT, nullable) - **Deprecated**, kept for backward compatibility
- `email` (TEXT UNIQUE NOT NULL) - **Primary identifier**
- `password_hash` (TEXT)
- `google_id` (TEXT UNIQUE) - OAuth
- `first_name` (TEXT)
- `last_name` (TEXT)
- `display_name` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `last_login` (TIMESTAMP WITH TIME ZONE)

**Indexes:**

- Primary key on `id`
- Unique index on `email`
- Unique index on `google_id` (if OAuth)

**Notes:**

- Username is nullable after migration 028
- Email is now the primary identifier
- Profile data moved to normalized tables (migration 023)

---

### 2. Normalized User Profile Tables

**Created by:** Migration 023 (Schema Normalization)

#### 2a. `user_demographics`

- Personal info (preferred_name, pronouns, birthdate, location)
- Actor: Product/UX
- Changes when: User updates profile

#### 2b. `user_employment`

- Work-related info (occupation, schedule, commute)
- Actor: Product/UX
- Changes when: Job situation changes

#### 2c. `user_health_context`

- **HIGHLY SENSITIVE** - Health information
- Physical/mental conditions, treatment, recovery
- Actor: Compliance
- Changes when: Health status changes

#### 2d. `user_financials`

- **SENSITIVE** - Financial information
- Income, housing, debt, support
- Actor: Compliance
- Changes when: Financial status changes

#### 2e. `user_background`

- Cultural, educational background
- Actor: Product/UX
- Changes when: User updates profile

**All normalized tables:**

- Primary key: `user_id` (references `users.id`)
- `created_at`, `updated_at` timestamps
- CASCADE delete on user deletion

---

### 3. `rooms` - Chat Rooms

**Purpose:** Chat room containers

**Columns:**

- `id` (TEXT PRIMARY KEY) - e.g., `room_1765827298745_878fce74a53e7`
- `name` (TEXT NOT NULL)
- `created_by` (INTEGER) - References `users.id`
- `is_private` (INTEGER DEFAULT 1)
- `created_at` (TIMESTAMP WITH TIME ZONE)

**Foreign Keys:**

- `created_by` → `users(id)` ON DELETE CASCADE

**Indexes:**

- Primary key on `id`
- Index on `created_by`

---

### 4. `room_members` - Room Membership

**Purpose:** Many-to-many relationship between users and rooms

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `room_id` (TEXT) - References `rooms(id)`
- `user_id` (INTEGER) - References `users(id)`
- `role` (TEXT DEFAULT 'member') - CHECK: 'owner', 'member', 'readonly'
- `joined_at` (TIMESTAMP WITH TIME ZONE)

**Constraints:**

- UNIQUE(room_id, user_id)
- CHECK constraint on `role`

**Indexes:**

- `idx_room_members_room` on `room_id`
- `idx_room_members_user` on `user_id`

**Notes:**

- Used to find "other" participant in two-person rooms
- Critical for message receiver lookup

---

### 5. `messages` - Chat Messages

**Purpose:** All chat messages

**Columns:**

- `id` (TEXT PRIMARY KEY) - UUID or timestamp-based
- `type` (TEXT NOT NULL) - 'user', 'system', 'ai'
- `username` (TEXT) - **Deprecated**, kept for backward compatibility
- `user_email` (TEXT NOT NULL) - **Primary sender identifier**
- `text` (TEXT)
- `timestamp` (TIMESTAMP WITH TIME ZONE NOT NULL)
- `room_id` (TEXT) - References `rooms(id)`
- `thread_id` (TEXT) - References `threads(id)`
- `sender` (JSONB) - **New format**: `{uuid, email, first_name, last_name}`
- `receiver` (JSONB) - **New format**: `{uuid, email, first_name, last_name}`
- `user_id` (INTEGER) - References `users(id)` - May be NULL if user doesn't exist

**Foreign Keys:**

- `room_id` → `rooms(id)` ON DELETE CASCADE
- `thread_id` → `threads(id)` ON DELETE SET NULL

**Indexes:**

- `idx_messages_room` on `room_id`
- `idx_messages_thread` on `thread_id`
- `idx_messages_user_email` on `user_email`
- `idx_messages_timestamp` on `timestamp DESC`

**Notes:**

- Migration 028 added `user_email` column
- Migration 006 added `sender` and `receiver` JSONB columns
- `username` field is deprecated but still populated for backward compatibility
- `user_id` may be NULL if user record doesn't exist (data integrity issue)

---

### 6. `pairing_sessions` - Co-Parent Pairing

**Purpose:** Unified pairing system for co-parent account linking

**Created by:** Migration 008

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `pairing_code` (VARCHAR(10) UNIQUE) - Format: LZ-NNNNNN
- `parent_a_id` (INTEGER) - Initiator, references `users(id)`
- `parent_b_id` (INTEGER) - Acceptor, references `users(id)`
- `parent_b_email` (TEXT) - Email of invitee
- `status` (VARCHAR(20)) - CHECK: 'pending', 'active', 'canceled', 'expired'
- `invite_type` (VARCHAR(20)) - CHECK: 'email', 'link', 'code'
- `invite_token` (VARCHAR(64) UNIQUE) - SHA-256 hash
- `invited_by_username` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `expires_at` (TIMESTAMP WITH TIME ZONE)
- `accepted_at` (TIMESTAMP WITH TIME ZONE)
- `shared_room_id` (TEXT) - References `rooms(id)`

**Constraints:**

- CHECK: `parent_a_id != parent_b_id OR parent_b_id IS NULL`
- CHECK constraints on `status` and `invite_type`

**Indexes:**

- `idx_pairing_code` on `pairing_code`
- `idx_pairing_token` on `invite_token`
- `idx_pairing_email` on `parent_b_email`
- `idx_pairing_parent_a` on `parent_a_id`
- `idx_pairing_parent_b` on `parent_b_id`
- `idx_pairing_status` on `status`
- `idx_pairing_active` on `(parent_a_id, parent_b_id, status)` WHERE `status = 'active'`

**View:**

- `user_pairing_status` - Quick lookup of current pairing state

**Notes:**

- Replaces old `pending_connections` and `room_invites` tables
- `shared_room_id` is set when pairing is accepted
- Used by `pairingManager.getActivePairing()` for room lookup

---

### 7. `contacts` - User Contacts

**Purpose:** User's contact list (children, co-parents, partners, etc.)

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `contact_name` (TEXT NOT NULL) - **Deprecated**, use `first_name`
- `first_name` (TEXT) - **New** (migration 029)
- `last_name` (TEXT)
- `contact_email` (TEXT)
- `relationship` (TEXT) - e.g., 'My Child', 'My Co-Parent'
- `phone` (TEXT)
- `address` (TEXT)
- `linked_user_id` (INTEGER) - References `users(id)` if contact is a user
- Extended fields (migration 011):
  - Child health, activities, appointments
  - Co-parent separation details
  - Partner relationship info
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)

**Indexes:**

- `idx_contacts_user_id` on `user_id`
- `idx_contacts_linked_user` on `linked_user_id`
- Unique constraint on `(user_id, contact_email)` (migration 018)

**Notes:**

- Migration 029 renamed `contact_name` to `first_name`
- Migration 021 added `linked_user_id` for contacts who are users
- Extended fields added in migration 011

---

### 8. `threads` - Conversation Threads

**Purpose:** AI-organized conversation threads

**Columns:**

- `id` (TEXT PRIMARY KEY)
- `room_id` (TEXT) - References `rooms(id)`
- `title` (TEXT NOT NULL)
- `created_by` (TEXT) - **Deprecated**, use `created_by_email`
- `created_by_email` (TEXT) - **New** (migration 028)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)
- `message_count` (INTEGER DEFAULT 0)
- `last_message_at` (TIMESTAMP WITH TIME ZONE)
- `is_archived` (INTEGER DEFAULT 0)
- `category` (TEXT) - Custom categories (migration 030)
- `parent_thread_id` (TEXT) - Hierarchy support (migration 025)

**Indexes:**

- `idx_threads_room` on `room_id`
- `idx_threads_updated` on `updated_at DESC`
- Foreign key indexes (migration 022)

**Notes:**

- AI-driven semantic analysis creates threads
- Supports hierarchy (parent/child threads)
- Custom categories allowed (migration 030)

---

### 9. `communication_profiles` - AI Communication Patterns

**Purpose:** AI-learned communication patterns per user

**Created by:** Migration 023

**Columns:**

- `user_id` (INTEGER PRIMARY KEY) - References `users(id)`
- `tone_tendencies` (TEXT[]) - Array: ['direct', 'formal', 'casual']
- `avg_message_length` (INTEGER)
- `vocabulary_complexity` (TEXT) - 'simple', 'moderate', 'complex'
- `emoji_usage` (TEXT) - 'none', 'minimal', 'moderate', 'frequent'
- `profile_version` (INTEGER DEFAULT 1)
- `last_updated` (TIMESTAMP WITH TIME ZONE)
- `created_at` (TIMESTAMP WITH TIME ZONE)

**Indexes:**

- `idx_communication_profiles_updated` on `last_updated`

**Notes:**

- Replaces `communication_patterns` JSONB column
- Updated by AI analysis engine

---

### 10. `communication_triggers` - Conflict Triggers

**Purpose:** User-specific conflict triggers

**Created by:** Migration 023

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `trigger_type` (TEXT) - CHECK: 'topic', 'phrase', 'pattern'
- `trigger_value` (TEXT) - The actual trigger
- `intensity` (DECIMAL(3,2)) - CHECK: 0.0 to 1.0
- `detection_count` (INTEGER DEFAULT 1)
- `last_detected` (TIMESTAMP WITH TIME ZONE)
- `created_at` (TIMESTAMP WITH TIME ZONE)

**Indexes:**

- `idx_triggers_user_id` on `user_id`
- `idx_triggers_type` on `trigger_type`

**Notes:**

- Replaces `triggers` JSONB column
- Used by AI to detect potential conflicts

---

### 11. `intervention_rewrites` - AI Rewrite History

**Purpose:** History of AI suggestions and outcomes

**Created by:** Migration 023

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `original_text` (TEXT NOT NULL)
- `rewrite_text` (TEXT NOT NULL)
- `outcome` (TEXT) - CHECK: 'accepted', 'rejected', 'modified', 'ignored'
- `pattern_detected` (TEXT)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `room_id` (TEXT) - References `rooms(id)`

**Indexes:**

- `idx_rewrites_user_id` on `user_id`
- `idx_rewrites_outcome` on `outcome`
- `idx_rewrites_created_at` on `created_at`

**Notes:**

- Replaces `successful_rewrites` JSONB array
- Used to learn user preferences

---

### 12. `intervention_statistics` - Intervention Stats

**Purpose:** Aggregated intervention statistics

**Created by:** Migration 023

**Columns:**

- `user_id` (INTEGER PRIMARY KEY) - References `users(id)`
- `total_interventions` (INTEGER DEFAULT 0)
- `accepted_count` (INTEGER DEFAULT 0)
- `rejected_count` (INTEGER DEFAULT 0)
- `modified_count` (INTEGER DEFAULT 0)
- `ignored_count` (INTEGER DEFAULT 0)
- `last_intervention_at` (TIMESTAMP WITH TIME ZONE)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)

**View:**

- `intervention_stats_with_rate` - Includes computed acceptance_rate

**Notes:**

- Replaces `intervention_history` JSONB column
- Updated when interventions are recorded

---

### 13. `push_subscriptions` - PWA Push Notifications

**Purpose:** Web Push API subscriptions

**Created by:** Migration 024

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `endpoint` (TEXT UNIQUE NOT NULL) - Push service endpoint
- `p256dh` (TEXT NOT NULL) - Public key
- `auth` (TEXT NOT NULL) - Auth secret
- `user_agent` (TEXT)
- `created_at`, `updated_at`, `last_used_at` (TIMESTAMP WITH TIME ZONE)
- `is_active` (BOOLEAN DEFAULT TRUE)

**Indexes:**

- `idx_push_subscriptions_user_id` on `user_id`
- `idx_push_subscriptions_user_active` on `(user_id, is_active)` WHERE `is_active = TRUE`
- `idx_push_subscriptions_endpoint` on `endpoint`

---

### 14. `tasks` - User Tasks

**Purpose:** Task management

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `title` (TEXT NOT NULL)
- `description` (TEXT)
- `status` (TEXT DEFAULT 'open') - CHECK: 'open', 'in_progress', 'completed', 'canceled'
- `priority` (TEXT DEFAULT 'medium') - CHECK: 'low', 'medium', 'high', 'urgent'
- `type` (TEXT DEFAULT 'general')
- `due_date` (TIMESTAMP WITH TIME ZONE)
- `completed_at` (TIMESTAMP WITH TIME ZONE)
- `created_at`, `updated_at` (TIMESTAMP WITH TIME ZONE)
- `assigned_to` (TEXT)
- `related_people` (TEXT)

**Indexes:**

- `idx_tasks_user_id` on `user_id`
- `idx_tasks_status` on `status`

**Constraints:**

- CHECK constraints on `status` and `priority` (migration 023)

---

### 15. `invitations` - Co-Parent Invitations

**Purpose:** Co-parent pairing invitations (legacy)

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `inviter_id` (INTEGER) - References `users(id)`
- `invitee_email` (TEXT NOT NULL)
- `token` (TEXT UNIQUE NOT NULL)
- `status` (TEXT DEFAULT 'pending')
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `expires_at` (TIMESTAMP WITH TIME ZONE)
- `accepted_at` (TIMESTAMP WITH TIME ZONE)

**Notes:**

- **Legacy table** - Replaced by `pairing_sessions`
- Kept for backward compatibility
- Should be migrated to `pairing_sessions`

---

### 16. `notifications` - In-App Notifications

**Purpose:** User notifications

**Columns:**

- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER) - References `users(id)`
- `type` (TEXT NOT NULL)
- `title` (TEXT NOT NULL)
- `message` (TEXT)
- `is_read` (BOOLEAN DEFAULT FALSE)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `related_id` (TEXT) - Related entity ID
- `related_type` (TEXT) - Related entity type

**Indexes:**

- `idx_notifications_user_id` on `user_id`
- `idx_notifications_user_unread` on `(user_id, is_read)` WHERE `is_read = FALSE`

---

## Views

### `user_pairing_status`

**Purpose:** Quick lookup of current pairing state for each user

**Created by:** Migration 008

**Columns:**

- `user_id`, `username`
- `pairing_id`, `pairing_code`, `status`, `invite_type`
- `user_role` - 'initiator' or 'acceptor'
- `partner_id` - Other user in pairing
- `shared_room_id` - Associated chat room
- `created_at`, `expires_at`, `accepted_at`
- `is_expired` - Computed boolean

**Notes:**

- Used by `pairingManager.getActivePairing()`
- Filters for `status IN ('pending', 'active')`
- Critical for room lookup

---

## Indexes Summary

### High-Priority Indexes (Frequently Queried)

1. **Messages:**
   - `idx_messages_room` - Room message history
   - `idx_messages_user_email` - User's messages
   - `idx_messages_timestamp` - Chronological sorting

2. **Room Members:**
   - `idx_room_members_room` - Room participants
   - `idx_room_members_user` - User's rooms

3. **Pairing Sessions:**
   - `idx_pairing_code` - Code lookup
   - `idx_pairing_active` - Active pairing check
   - `idx_pairing_email` - Email-based lookup

4. **Contacts:**
   - `idx_contacts_user_id` - User's contacts
   - `idx_contacts_linked_user` - User-linked contacts

5. **Notifications:**
   - `idx_notifications_user_unread` - Unread notifications

---

## Data Integrity Concerns

### 1. **Missing User Records**

**Issue:** Some messages have `user_email` but no corresponding `users.id`

**Evidence:**

- `messages.user_id` can be NULL
- `buildUserObject` returns null for missing users
- Messages still display with minimal sender object

**Impact:**

- Messages display but sender info is incomplete
- Room member lookup may fail
- Receiver identification may be incorrect

**Recommendation:**

- Run data integrity check script
- Create missing user records or clean up orphaned messages

### 2. **Email Mismatches**

**Issue:** `messages.user_email` may not match `users.email` (case, whitespace)

**Evidence:**

- Logging shows email mismatches in production
- JOIN queries may fail to match

**Recommendation:**

- Normalize emails (lowercase, trim)
- Run data integrity fix script

### 3. **Deprecated Columns**

**Issue:** Several deprecated columns still exist:

- `users.username` (nullable, but still populated)
- `messages.username` (deprecated, use `user_email`)
- `threads.created_by` (deprecated, use `created_by_email`)

**Recommendation:**

- Keep for backward compatibility during transition
- Plan removal after code migration complete

---

## Performance Considerations

### 1. **Message Table Size**

**Current:** ~27K messages in production (room `room_1765827298745_878fce74a53e7`)

**Concerns:**

- No partitioning strategy
- Indexes may become large
- Query performance may degrade

**Recommendation:**

- Monitor query performance
- Consider partitioning by `timestamp` or `room_id` if > 1M messages
- Archive old messages to separate table

### 2. **Composite Indexes**

**Missing:**

- `(room_id, timestamp)` for message history queries
- `(user_id, status)` for task filtering
- `(room_id, user_id)` for room member lookups

**Recommendation:**

- Add composite indexes for common query patterns
- Monitor query plans

### 3. **JSONB Columns**

**Usage:**

- `messages.sender` and `messages.receiver` (JSONB)
- `user_context.children` and `user_context.contacts` (JSONB)

**Concerns:**

- JSONB queries can be slower than relational queries
- No type safety

**Recommendation:**

- Consider normalizing if query patterns emerge
- Use GIN indexes for JSONB if needed

---

## Security Considerations

### 1. **Sensitive Data Separation**

**Good:**

- Health data in `user_health_context` (separate table)
- Financial data in `user_financials` (separate table)
- Allows fine-grained access control

### 2. **Audit Logging**

**Good:**

- `pairing_audit_log` for pairing operations
- Timestamps on all tables
- Soft deletes where appropriate (`is_active` flags)

### 3. **Password Security**

**Good:**

- `password_hash` stored (not plaintext)
- OAuth support for Google

---

## Migration Status

### Completed Migrations: 30

**Key Migrations:**

- ✅ 001: Initial schema
- ✅ 006: Message columns (sender/receiver JSONB)
- ✅ 008: Pairing sessions (unified pairing)
- ✅ 023: Schema normalization (user profile split)
- ✅ 024: Push subscriptions
- ✅ 028: Email-based identification
- ✅ 029: Contact name migration

### Pending Cleanup

**After code migration complete:**

- Drop deprecated columns:
  - `users.username`
  - `messages.username`
  - `threads.created_by`
- Migrate `invitations` to `pairing_sessions`
- Drop legacy tables: `pending_connections`, `room_invites`

---

## Recommendations

### Immediate (High Priority)

1. **Data Integrity:**
   - Run `check-data-integrity.js` script
   - Fix missing user records
   - Normalize email addresses

2. **Indexes:**
   - Add composite index: `(room_id, timestamp DESC)` on `messages`
   - Add composite index: `(user_id, status)` on `tasks`
   - Monitor query performance

3. **Monitoring:**
   - Set up query performance monitoring
   - Track table sizes
   - Monitor index usage

### Short-Term (Medium Priority)

1. **Schema Cleanup:**
   - Remove deprecated columns after code migration
   - Migrate `invitations` to `pairing_sessions`
   - Drop legacy tables

2. **Documentation:**
   - Document all CHECK constraints
   - Document all foreign key relationships
   - Create ER diagram

### Long-Term (Low Priority)

1. **Partitioning:**
   - Consider partitioning `messages` by `timestamp` if > 1M rows
   - Consider partitioning `threads` by `room_id` if > 100K rows

2. **Normalization:**
   - Consider normalizing JSONB columns if query patterns emerge
   - Consider splitting large tables if they grow significantly

---

## Conclusion

The production database schema is well-designed with proper normalization, good indexing, and appropriate security measures. The migration from username-based to email-based identification is complete, and the schema normalization (migration 023) has properly separated concerns.

**Main concerns:**

1. Data integrity issues (missing users, email mismatches)
2. Some deprecated columns still present
3. No partitioning strategy for large tables

**Overall:** The schema is production-ready with minor cleanup needed.
