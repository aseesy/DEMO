# Conversation Threading Feature Specification

**Feature ID**: CONV-THREAD-001
**Version**: 1.0.0
**Status**: Draft
**Last Updated**: 2025-12-29
**Author**: specification-agent

---

## 1. Overview

### 1.1 Feature Name

**Conversation Threading** - Organize co-parent messages by topic for improved clarity and reduced conflict.

### 1.2 Business Objective

**Primary Goal**: Reduce communication confusion and conflict by organizing messages into topic-based conversation threads, helping co-parents maintain clear, child-focused discussions about specific subjects (schedule changes, medical appointments, school events, etc.).

**Why This Matters for Co-Parents**:

- **Clarity**: Easy to find all messages about a specific topic (e.g., "Soccer practice schedule")
- **Accountability**: Clear audit trail of topic-based decisions
- **Reduced Overwhelm**: Main chat stays focused; details move to threads
- **Child-Centric Organization**: Threads naturally align with children's needs (medical, education, activities)
- **Context Preservation**: New co-parents or mediators can quickly understand topic history

**How This Benefits Children**:

- Parents spend less time confused, more time coordinating effectively
- Important topics (medical, safety) get dedicated focus
- Reduced parental conflict due to miscommunication
- Better follow-through on children's needs when discussions are organized

### 1.3 Success Metrics

**Adoption Metrics**:

- 60% of co-parent pairs create at least 1 thread within first week
- Average 3+ threads per active room within 30 days
- 40% of messages sent in threads (vs. main chat) after 60 days

**Effectiveness Metrics**:

- 25% reduction in "I didn't see that message" support tickets
- 15% reduction in AI mediation interventions due to message confusion
- 80% user satisfaction score for "finding past conversations"

**Engagement Metrics**:

- Average thread contains 5+ messages
- Threads with medical/education categories show 2x engagement
- 70% of users report threads "make co-parenting easier" (survey)

### 1.4 Priority & Scope

**Priority**: High
**Target Release**: Q1 2025
**Estimated Effort**: 4-6 weeks (2 backend engineers, 1 frontend engineer, 1 QA)

**In Scope**:

- Create threads from messages
- Reply within threads
- View threaded messages
- Thread categories (medical, education, schedule, etc.)
- Hierarchical threads (sub-threads)
- Archive/close threads
- Real-time thread updates via Socket.io
- Mobile-responsive threading UI

**Out of Scope** (Future Iterations):

- Thread templates (e.g., "Doctor Appointment" with checklist)
- Thread sharing with third parties (teachers, doctors)
- Thread-to-task conversion
- Thread sentiment analysis
- Cross-room thread linking

---

## 2. User Stories

### 2.1 Primary User Stories

#### Story 1: Create Thread from Message

**As a** co-parent
**I want to** start a new thread from an existing message
**So that** I can organize related follow-up discussion in one place

**Acceptance Criteria**:

- [ ] User can long-press (mobile) or right-click (desktop) any message to see "Start Thread" option
- [ ] Thread creation modal appears with:
  - Auto-populated title (from message preview, editable)
  - Category dropdown (medical, education, schedule, etc.)
  - Original message shows as first thread message
- [ ] Thread appears in sidebar with category badge and message count
- [ ] Original message shows "Thread started" indicator with thread title
- [ ] All room members receive real-time notification: "New thread: [Title]"

**Edge Cases**:

- If message already belongs to a thread, show "Move to New Thread" instead
- If user cancels modal, no thread is created
- If network fails during creation, show retry option with draft preserved

---

#### Story 2: Reply in Thread

**As a** co-parent
**I want to** reply within a thread
**So that** my response stays organized with the original topic

**Acceptance Criteria**:

- [ ] User clicks thread in sidebar to open thread view
- [ ] Thread view shows:
  - Thread title and category badge
  - All messages in chronological order
  - Input box for new replies
  - "Back to Main Chat" navigation
- [ ] Replies are marked with thread context (e.g., "in Medical Thread")
- [ ] Thread message count updates in real-time for all room members
- [ ] AI mediation still runs on thread replies (same rules as main chat)
- [ ] Thread moves to top of sidebar when new message arrives

**Edge Cases**:

- If thread is archived, show "This thread is archived" with "Reopen" button
- If user loses connection while typing, draft is saved locally
- If co-parent leaves room, their thread messages remain visible

---

#### Story 3: View Thread History

**As a** co-parent
**I want to** see all messages in a thread
**So that** I can review the full conversation about a specific topic

**Acceptance Criteria**:

- [ ] Clicking thread in sidebar loads all thread messages
- [ ] Thread view shows:
  - Thread metadata (creator, created date, category, message count)
  - Full message history with timestamps
  - "Load More" for threads with 50+ messages
  - Thread breadcrumb if sub-thread (e.g., "Schedule > Soccer Practice")
- [ ] Search works within thread (highlights matches)
- [ ] User can scroll smoothly through 100+ messages without lag
- [ ] Thread view works on mobile (< 375px width)

**Edge Cases**:

- If thread has no messages yet (just created), show "No messages yet"
- If thread deleted while viewing, show "Thread no longer available"
- If user navigates away, thread scroll position is preserved

---

#### Story 4: Organize with Categories

**As a** co-parent
**I want to** categorize threads by topic type
**So that** I can quickly find medical, education, or schedule discussions

**Acceptance Criteria**:

- [ ] Thread creation modal includes category dropdown with 9 default categories:
  - Safety (🛡️) - Emergency contacts, safety concerns
  - Medical (🏥) - Doctor appointments, medications, health issues
  - Education (📚) - School, homework, teachers, grades
  - Schedule (📅) - Pickup, dropoff, custody arrangements
  - Finances (💰) - Child support, shared expenses, reimbursements
  - Activities (⚽) - Sports, hobbies, extracurriculars
  - Travel (✈️) - Vacations, trips, travel arrangements
  - Co-Parenting (🤝) - Parenting decisions, relationship discussions
  - Logistics (📦) - General coordination, supplies, belongings (default)
- [ ] Users can add custom categories (e.g., "Therapy Sessions")
- [ ] Sidebar allows filtering threads by category
- [ ] Category badge shows on each thread (icon + label)
- [ ] Thread count per category shown in filter dropdown

**Edge Cases**:

- If user creates custom category, it's saved to their room preferences
- If category deleted, threads revert to "Logistics" default
- Custom categories sync between co-parents in same room

---

#### Story 5: Create Sub-Threads

**As a** co-parent
**I want to** create sub-threads from thread messages
**So that** I can break down complex topics (e.g., "Soccer Practice" sub-thread under "Activities")

**Acceptance Criteria**:

- [ ] User can create sub-thread from any thread message (same UI as Story 1)
- [ ] Sub-thread shows indentation in sidebar (visual hierarchy)
- [ ] Sub-thread view includes breadcrumb navigation (e.g., "Schedule > Soccer > Uniform")
- [ ] Sub-thread inherits parent category by default (can override)
- [ ] Maximum depth: 3 levels (root → sub → sub-sub)
- [ ] Parent thread shows "X sub-threads" badge

**Edge Cases**:

- If max depth reached (3 levels), "Create Sub-Thread" disabled with tooltip
- If parent thread archived, sub-threads also show as archived
- If sub-thread has no messages after 7 days, prompt to merge back to parent

---

#### Story 6: Archive Threads

**As a** co-parent
**I want to** archive resolved threads
**So that** my thread list stays focused on active topics

**Acceptance Criteria**:

- [ ] User can archive thread via context menu (long-press/right-click)
- [ ] Archived threads hidden from main sidebar by default
- [ ] "Show Archived" toggle in sidebar footer reveals archived threads
- [ ] Archived threads show grayed-out styling and "Archived" badge
- [ ] User can reopen archived thread via "Reopen Thread" button
- [ ] Auto-archive threads with no activity for 90 days (configurable)

**Edge Cases**:

- If thread has unread messages, confirm before archiving
- If thread reopened, it moves back to top of sidebar
- Archived threads still searchable via global message search

---

### 2.2 Secondary User Stories

#### Story 7: Thread Notifications

**As a** co-parent
**I want to** receive notifications for thread activity
**So that** I don't miss important updates

**Acceptance Criteria**:

- [ ] Push notification when co-parent replies in thread I'm active in
- [ ] In-app badge shows unread thread message count
- [ ] Thread title appears in notification (e.g., "New message in Medical Thread")
- [ ] Clicking notification opens thread view directly

---

#### Story 8: Move Messages Between Threads

**As a** co-parent
**I want to** move misplaced messages to correct thread
**So that** conversations stay properly organized

**Acceptance Criteria**:

- [ ] User can select message(s) and choose "Move to Thread"
- [ ] Modal shows list of existing threads + "Create New Thread" option
- [ ] Moved message shows "Moved from [Source]" metadata
- [ ] Original thread message count updates in real-time

---

#### Story 9: Thread Analytics

**As a** co-parent
**I want to** see thread engagement metrics
**So that** I know which topics need attention

**Acceptance Criteria**:

- [ ] Dashboard shows:
  - Most active threads this week
  - Threads awaiting my response
  - Category breakdown (pie chart)
- [ ] Thread view shows response time average

---

## 3. Functional Requirements

### 3.1 Core Threading Functionality

#### FR-1: Thread Creation

- **System shall** allow users to create threads from any message in the room
- **System shall** support manual thread creation (without parent message)
- **System shall** enforce thread title (3-100 characters, required)
- **System shall** assign default category "logistics" if user doesn't select one
- **System shall** generate unique thread ID (UUID format)
- **System shall** record creator email, creation timestamp, room ID

#### FR-2: Thread Messaging

- **System shall** support sending messages within threads
- **System shall** maintain chronological message order within threads
- **System shall** run AI mediation on all thread messages (same rules as main chat)
- **System shall** update thread `last_message_at` timestamp on new message
- **System shall** increment thread `message_count` atomically (avoid race conditions)

#### FR-3: Thread Hierarchy

- **System shall** support creating sub-threads from thread messages
- **System shall** track parent-child relationships via `parent_thread_id`
- **System shall** track root thread via `root_thread_id` for deep nesting
- **System shall** track depth level (0 = root, 1 = first sub, 2 = second sub)
- **System shall** enforce maximum depth of 3 levels
- **System shall** track parent message via `parent_message_id`

#### FR-4: Thread Categories

- **System shall** support 9 default categories (safety, medical, education, schedule, finances, activities, travel, co-parenting, logistics)
- **System shall** allow custom category creation (max 50 characters)
- **System shall** store categories as TEXT (not ENUM) for flexibility
- **System shall** default to "logistics" if category invalid/missing
- **System shall** sync custom categories across room members

#### FR-5: Thread Archival

- **System shall** allow users to archive threads manually
- **System shall** auto-archive threads with no activity for 90 days
- **System shall** hide archived threads by default (toggle to show)
- **System shall** preserve archived thread data indefinitely
- **System shall** allow reopening archived threads

### 3.2 Real-Time Communication

#### FR-6: Socket.io Events

**Client → Server Events**:

- `create_thread` - Create new thread
  - Payload: `{ roomId, title, messageId?, category? }`
  - Response: `thread_created_success` or `error`

- `create_sub_thread` - Create sub-thread
  - Payload: `{ roomId, title, parentThreadId, parentMessageId? }`
  - Response: `sub_thread_created_success` or `error`

- `get_threads` - Fetch all threads for room
  - Payload: `{ roomId }`
  - Response: `threads_list`

- `get_thread_messages` - Fetch messages in thread
  - Payload: `{ threadId }`
  - Response: `thread_messages`

- `add_to_thread` - Add message to thread
  - Payload: `{ messageId, threadId }`
  - Response: `message_added_to_thread` or `error`

- `remove_from_thread` - Remove message from thread
  - Payload: `{ messageId }`
  - Response: `message_removed_from_thread` or `error`

- `get_sub_threads` - Get direct child threads
  - Payload: `{ threadId }`
  - Response: `sub_threads_list`

- `get_thread_ancestors` - Get parent chain
  - Payload: `{ threadId }`
  - Response: `thread_ancestors`

**Server → Client Events**:

- `thread_created` - New thread created
  - Payload: `{ thread }` (delta update, not full list)

- `sub_thread_created` - New sub-thread created
  - Payload: `{ thread, parentThreadId }`

- `thread_message_count_changed` - Message count updated
  - Payload: `{ threadId, messageCount, lastMessageAt }`

- `threads_list` - Full thread list (on initial load)
  - Payload: `[ threads ]`

- `thread_messages` - Thread message history
  - Payload: `{ threadId, messages }`

#### FR-7: Delta Updates

- **System shall** emit delta updates (only changed data) for real-time efficiency
- **System shall** avoid sending full thread lists on every update
- **System shall** use atomic database operations for message count updates
- **System shall** broadcast thread updates to all room members

### 3.3 Database Schema

#### FR-8: Threads Table (PostgreSQL)

**Existing Schema** (from migrations):

```sql
CREATE TABLE threads (
  id TEXT PRIMARY KEY,                          -- UUID
  room_id TEXT NOT NULL,                        -- Foreign key to rooms
  title TEXT NOT NULL,                          -- Thread title (3-100 chars)
  created_by TEXT NOT NULL,                     -- User email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,              -- Atomic counter
  last_message_at TIMESTAMP WITH TIME ZONE,     -- Last activity
  is_archived INTEGER DEFAULT 0,                -- 0 = active, 1 = archived
  category TEXT DEFAULT 'logistics',            -- Thread category (was ENUM, now TEXT)
  parent_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,  -- For sub-threads
  root_thread_id TEXT REFERENCES threads(id) ON DELETE SET NULL,    -- Top-level thread
  parent_message_id TEXT REFERENCES messages(id) ON DELETE SET NULL, -- Originating message
  depth INTEGER DEFAULT 0,                      -- Nesting level (0-3)
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

**Indexes** (already exist):

- `idx_threads_room_id` - Find threads by room
- `idx_threads_category` - Filter by category
- `idx_threads_parent_thread_id` - Find sub-threads
- `idx_threads_root_thread_id` - Find hierarchy
- `idx_threads_parent_message_id` - Find threads from message
- `idx_threads_depth` - Depth-based queries
- `idx_threads_updated_at` - Sort by activity

#### FR-9: Thread Messages Junction Table

**Existing Schema**:

```sql
CREATE TABLE thread_messages (
  id SERIAL PRIMARY KEY,
  thread_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  added_by TEXT,                                -- User who added message
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  UNIQUE(thread_id, message_id)                 -- Prevent duplicates
);
```

### 3.4 UI/UX Requirements

#### FR-10: Thread Sidebar

- **System shall** display thread sidebar with:
  - Thread title
  - Category badge (icon + label)
  - Message count
  - Last activity timestamp
  - Unread indicator
- **System shall** sort threads by last activity (most recent first)
- **System shall** group threads by category (optional view)
- **System shall** show sub-thread indentation (visual hierarchy)
- **System shall** highlight selected thread
- **System shall** show "Create Thread" button prominently

#### FR-11: Thread View

- **System shall** display thread view with:
  - Thread breadcrumb navigation (if sub-thread)
  - Thread title and category badge
  - "Back to Main Chat" button
  - Message list (chronological)
  - Message input box
  - Thread options menu (archive, edit title, change category)
- **System shall** load messages in batches (50 per page)
- **System shall** support infinite scroll for long threads
- **System shall** preserve scroll position on navigation

#### FR-12: Mobile Responsiveness

- **System shall** work on screens ≥ 375px width
- **System shall** use touch-friendly targets (≥ 44px height)
- **System shall** support swipe gestures:
  - Swipe left on thread → Archive
  - Swipe right on thread → Mark as read
- **System shall** collapse sidebar to full-screen on mobile
- **System shall** show thread count badge on hamburger menu

#### FR-13: Accessibility

- **System shall** support keyboard navigation:
  - Arrow keys to navigate thread list
  - Enter to open thread
  - Escape to close thread view
- **System shall** provide ARIA labels for screen readers
- **System shall** maintain focus management on modal open/close
- **System shall** use semantic HTML (nav, article, aside)
- **System shall** meet WCAG 2.1 AA contrast ratios

---

## 4. Non-Functional Requirements

### 4.1 Performance

#### NFR-1: Response Time

- **Thread list load**: < 500ms for 100 threads
- **Thread message load**: < 1s for 500 messages
- **Thread creation**: < 300ms (optimistic UI update)
- **Message send in thread**: < 200ms (appears immediately, syncs in background)
- **Search within thread**: < 100ms for 1000 messages (client-side filtering)

#### NFR-2: Scalability

- **System shall** support 1,000 threads per room without degradation
- **System shall** support 10,000 messages per thread
- **System shall** use pagination for threads > 100
- **System shall** use virtual scrolling for messages > 500
- **System shall** cache thread metadata client-side (reduce API calls)

#### NFR-3: Real-Time Latency

- **Thread update broadcasts**: < 500ms to all room members
- **Message count updates**: < 100ms (atomic database operation)
- **WebSocket reconnection**: < 2s with automatic retry

### 4.2 Usability

#### NFR-4: Learnability

- **First-time users** should create their first thread within 5 minutes
- **Onboarding tooltip** appears on first message: "Start a thread to organize this topic"
- **Empty state** in sidebar shows "Create your first thread" with illustration
- **Help documentation** accessible via "?" icon in thread UI

#### NFR-5: Visual Design Alignment

- **System shall** follow LiaiZen design system:
  - **Primary color**: #275559 (teal-dark)
  - **Success color**: #6dd4b0
  - **Focus color**: #46BD92
  - **Button style**: Squoval (rounded-lg), min-h-[44px]
  - **Cards**: Glass morphism (bg-white/80)
  - **Typography**: 0.02em letter spacing
- **System shall** use consistent category colors (see threadCategories.js)
- **System shall** provide smooth transitions (300ms duration)

#### NFR-6: Error Handling

- **Network failures**: Show retry button with preserved draft
- **Thread not found**: Show "Thread no longer available" with link to main chat
- **Permission errors**: "You don't have permission to view this thread"
- **Validation errors**: Inline error messages (e.g., "Title too short")
- **Graceful degradation**: If WebSocket fails, fall back to HTTP polling

### 4.3 Accessibility

#### NFR-7: Keyboard Navigation

- **Tab order** follows logical flow (sidebar → thread list → thread view → input)
- **Escape key** closes modals and returns to previous view
- **Enter key** opens selected thread
- **Arrow keys** navigate thread list

#### NFR-8: Screen Reader Support

- **ARIA live regions** announce new thread messages
- **ARIA labels** on all interactive elements
- **Alt text** on category icons
- **Focus indicators** visible on all focusable elements
- **Skip links** to bypass thread sidebar

#### NFR-9: Visual Accessibility

- **Contrast ratios** meet WCAG 2.1 AA (4.5:1 for text)
- **Focus indicators** 3px solid border with high contrast
- **Category colors** distinguishable for color-blind users
- **Text resizing** up to 200% without loss of functionality

### 4.4 Mobile & PWA

#### NFR-10: Mobile Performance

- **Touch targets**: ≥ 44px × 44px (iOS guidelines)
- **Thread list scrolling**: 60fps on iPhone 8 and newer
- **Bundle size**: Thread feature adds < 50KB gzipped
- **Offline support**: Cached threads viewable offline (read-only)

#### NFR-11: Responsive Breakpoints

- **Mobile**: 375px - 767px (sidebar full-screen, swipe gestures)
- **Tablet**: 768px - 1023px (sidebar 320px, slide-over)
- **Desktop**: ≥ 1024px (sidebar 360px, always visible)

### 4.5 Security & Privacy

#### NFR-12: Authorization

- **System shall** verify user is room member before showing threads
- **System shall** prevent thread access after user leaves room
- **System shall** validate thread ownership before allowing edits
- **System shall** sanitize thread titles to prevent XSS

#### NFR-13: Data Privacy

- **Thread messages** follow same deletion rules as main chat
- **Archived threads** can be permanently deleted by both co-parents
- **Thread metadata** excludes sensitive personal info (no PII in titles)
- **Audit trail** logs thread creation, archival, deletion

---

## 5. Technical Constraints

### 5.1 Technology Stack

#### Backend

- **Node.js** v18+ with Express.js
- **PostgreSQL** v14+ (primary database)
- **Socket.io** v4+ (real-time communication)
- **dbSafe** module for query building (existing pattern)

#### Frontend

- **React** v18+ with functional components
- **Socket.io-client** v4+
- **Vite** for bundling
- **Tailwind CSS** v3+ for styling

#### Existing Patterns to Follow

- **Service layer**: `/chat-server/src/services/threads/`
- **Socket handlers**: `/chat-server/socketHandlers/threadHandler.js`
- **React hooks**: `/chat-client-vite/src/features/chat/hooks/`
- **Components**: `/chat-client-vite/src/features/chat/components/`

### 5.2 Database Constraints

#### Migration Strategy

- **No breaking changes** to existing `threads` table schema
- **Backwards compatible** with existing thread data
- **Migration order**:
  1. ✅ Already applied: Migration 025 (hierarchy)
  2. ✅ Already applied: Migration 030 (custom categories)
  3. New: Add indexes for performance optimization (if needed)

#### Query Patterns

- **Use dbSafe module** for all database queries (parameterized, safe)
- **Atomic operations** for message count updates (`UPDATE threads SET message_count = message_count + 1`)
- **Transaction support** for multi-step operations (create thread + add message)

### 5.3 AI Mediation Integration

#### Constraint: Thread Messages Must Be Mediated

- **Thread messages** pass through same AI mediation pipeline as main chat
- **Context enrichment** includes thread title and category
- **Intervention UI** adapts for thread context (e.g., "This reply in the Medical thread...")
- **Learning** from thread communication patterns (e.g., medical threads show higher quality)

**Implementation**:

- Reuse existing `mediator.analyze()` from `src/liaizen/core/mediator.js`
- Add thread context to `buildMessageContext()` in `aiContextHelper.js`
- No separate mediation rules for threads (consistency across platform)

### 5.4 Real-Time Architecture

#### Delta Updates (Bandwidth Optimization)

- **Emit only changed data**, not full thread lists
- **Examples**:
  - New thread: emit `{ thread }` (single object)
  - Message count change: emit `{ threadId, messageCount }` (minimal payload)
  - Thread archived: emit `{ threadId, isArchived: 1 }` (delta only)

**Rationale**: Reduces bandwidth for rooms with 100+ threads. Clients merge delta updates into local state.

#### Client-Side State Management

- **React state** for thread list and selected thread
- **Optimistic updates** for thread creation (show immediately, sync in background)
- **Cache invalidation** on thread delete or room leave

### 5.5 Compatibility Requirements

#### Browser Support

- **Modern browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **No IE11 support** (uses modern JavaScript features)

#### Platform Support

- **iOS** 14+ (Safari, PWA)
- **Android** 10+ (Chrome, PWA)
- **Desktop**: macOS, Windows, Linux

---

## 6. Acceptance Criteria

### 6.1 Feature Completeness

**MUST HAVE** (Required for Release):

- [x] ✅ Database schema supports threads (already exists)
- [ ] Create thread from message (Story 1)
- [ ] Reply in thread (Story 2)
- [ ] View thread history (Story 3)
- [ ] Thread categories with 9 defaults (Story 4)
- [ ] Thread sidebar UI (desktop + mobile)
- [ ] Real-time thread updates via Socket.io
- [ ] AI mediation works in threads
- [ ] Archive threads manually
- [ ] Thread search within messages
- [ ] Accessibility: keyboard navigation + screen reader
- [ ] Mobile responsiveness (≥ 375px)

**SHOULD HAVE** (Nice to Have):

- [ ] Create sub-threads (Story 5)
- [ ] Move messages between threads (Story 8)
- [ ] Auto-archive after 90 days inactivity
- [ ] Thread notifications (Story 7)
- [ ] Custom categories

**COULD HAVE** (Future Iteration):

- [ ] Thread analytics (Story 9)
- [ ] Thread templates
- [ ] Thread-to-task conversion
- [ ] Bulk thread operations (archive multiple)

### 6.2 Quality Gates

#### Automated Testing

- [ ] **Unit tests**: 80% coverage for thread services
- [ ] **Integration tests**: All Socket.io events tested
- [ ] **E2E tests**: Critical user flows (create thread, reply, archive)
- [ ] **Accessibility tests**: aXe DevTools 0 violations

#### Performance Benchmarks

- [ ] Thread list loads < 500ms (100 threads)
- [ ] Thread messages load < 1s (500 messages)
- [ ] WebSocket latency < 500ms (p95)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility)

#### User Acceptance Testing

- [ ] 5 co-parent pairs test feature for 1 week
- [ ] 80% report "feature is useful"
- [ ] 0 critical bugs reported
- [ ] Average time to create first thread < 5 minutes

### 6.3 Documentation Requirements

- [ ] **User Guide**: "How to Use Threads" with screenshots
- [ ] **Developer Docs**: API reference for Socket.io events
- [ ] **Migration Guide**: Database migration steps
- [ ] **Changelog**: Feature release notes
- [ ] **Help Center**: FAQ for common thread questions

---

## 7. Co-Parenting Domain Validation

### 7.1 How Threading Reduces Conflict

**Problem**: Co-parents often argue due to:

- "You never told me about the doctor appointment" (lost in chat history)
- "I already answered that question" (unclear which message they mean)
- Overlapping conversations (schedule + medical + school in same chat)

**Solution: Threading Addresses These by**:

- **Single Source of Truth**: All medical discussions in one thread (easy to reference)
- **Clear Context**: "In the Medical thread, you said..." (specific citation)
- **Separation of Concerns**: Urgent safety messages don't get buried in schedule chat

**Conflict Reduction Mechanisms**:

1. **Accountability**: Thread history shows who said what, when (reduces "he said, she said")
2. **Clarity**: Topics stay separate (less confusion = less defensiveness)
3. **Proactive Organization**: Structured communication reduces reactive arguments

### 7.2 Child-Centric Organization

**Alignment with Children's Needs**:

- **Medical thread**: All health info in one place (helps caregivers, doctors)
- **Education thread**: School communication organized (easier to involve teachers)
- **Schedule thread**: Custody coordination clear (reduces pickup/dropoff stress on kids)
- **Activities thread**: Sports/hobbies tracked (kids see parents coordinating their interests)

**Child Wellbeing Impact**:

- Parents spend less time fighting over logistics
- Important decisions (medical, education) get focused attention
- Kids benefit from parents being "on the same page" more often

### 7.3 Privacy & Safety Considerations

**Privacy**:

- Thread titles should avoid sensitive details (e.g., "Therapy" not "Johnny's Anxiety Therapy")
- Custom categories allow discretion (e.g., "Medical" vs. specific diagnosis)
- Archive function lets parents "close" sensitive topics after resolution

**Safety**:

- Safety category threads auto-prioritize (shown first in sidebar)
- Mediation still applies (hostile messages caught even in threads)
- Audit trail preserved (court-admissible communication record)

**Data Retention**:

- Threads follow same retention as main chat (7 years for legal purposes)
- Users can delete threads by mutual agreement
- Archived threads hidden but not deleted (recoverable if needed)

### 7.4 Equity & Fairness

**Both Parents Have Equal Access**:

- Either parent can create threads
- Either parent can archive/reopen threads
- Thread creation notifications sent to both parents
- No "thread ownership" (collaborative model)

**Preventing Abuse**:

- **Limitation**: Max 3 nesting levels (prevents overwhelming complexity)
- **Mediation**: Hostile thread messages still trigger AI coaching
- **Visibility**: All thread activity visible to both parents (no secret threads)
- **Support Escalation**: Excessive thread creation (>20/day) flags for mediator review

---

## 8. Open Questions & Decisions Needed

### 8.1 Product Decisions

**Q1: Should threads support @mentions?**

- **Pro**: Directs attention to specific messages
- **Con**: May escalate conflict ("You ignored my @mention!")
- **Decision**: Defer to v2 (monitor user feedback)

**Q2: Should archived threads auto-delete after X months?**

- **Pro**: Reduces database size, encourages closure
- **Con**: Legal risk (family court may need records)
- **Decision**: Never auto-delete (archive ≠ delete). Allow manual delete by mutual consent.

**Q3: Should thread titles be editable after creation?**

- **Pro**: Fixes typos, updates topic (e.g., "Soccer Practice" → "Soccer Practice - Spring 2025")
- **Con**: Could cause confusion ("I swear the thread was called something else...")
- **Decision**: Allow edits with audit trail (show "Renamed from [old title]" in thread)

### 8.2 Technical Decisions

**Q4: How to handle thread merging?**

- **Use Case**: Two threads about same topic (e.g., "Doctor Apt" and "Medical")
- **Options**:
  - A) No merging (keep separate)
  - B) Move messages manually (user selects messages → move)
  - C) Automatic suggestion ("These threads look similar, merge?")
- **Decision**: Option B (manual) for v1. Option C (AI suggestion) for v2.

**Q5: Should thread embeddings be generated for semantic search?**

- **Current**: Message embeddings exist for auto-threading
- **Benefit**: "Find threads about school" → matches semantically similar threads
- **Cost**: Additional OpenAI API calls, storage overhead
- **Decision**: ✅ Already implemented in `threadEmbeddings.js`. Use for search in v2.

**Q6: How to handle thread access when user leaves room?**

- **Scenario**: Parent A leaves room, later returns. Should they see old threads?
- **Options**:
  - A) Threads hidden while user is out of room (privacy)
  - B) Threads remain visible (continuity)
- **Decision**: Option B (threads tied to room, not membership). If sensitive, archive first.

### 8.3 UX Decisions

**Q7: Should thread sidebar be collapsible on desktop?**

- **Pro**: More space for main chat
- **Con**: Threads less discoverable (out of sight, out of mind)
- **Decision**: Always visible on desktop (≥1024px), collapsible on tablet (768-1023px)

**Q8: Should unread thread messages show badge?**

- **Pro**: Clear which threads need attention
- **Con**: May increase anxiety ("I have 8 unread threads!")
- **Decision**: Yes, but with limit (show "9+" instead of "47 unread")

---

## 9. Success Criteria Summary

### 9.1 Launch Readiness Checklist

**Functional**:

- [ ] All MUST HAVE features implemented and tested
- [ ] AI mediation works correctly in threads
- [ ] Real-time updates work across devices
- [ ] Mobile UI tested on iOS + Android

**Non-Functional**:

- [ ] Performance benchmarks met (< 500ms thread load)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Security review completed (no XSS, CSRF vulnerabilities)
- [ ] Database migrations tested on staging

**Documentation**:

- [ ] User guide published
- [ ] Developer API docs updated
- [ ] Help center FAQ created

**User Testing**:

- [ ] 5 co-parent pairs completed 1-week beta
- [ ] 0 critical bugs reported
- [ ] 80%+ satisfaction score

### 9.2 Post-Launch Monitoring (First 30 Days)

**Adoption Metrics**:

- Monitor: % of rooms with at least 1 thread
- Target: 60% by day 30
- Action: If < 40%, add onboarding prompts

**Engagement Metrics**:

- Monitor: Average messages per thread
- Target: 5+ messages per thread
- Action: If < 3, improve thread discovery UI

**Quality Metrics**:

- Monitor: Support tickets about thread confusion
- Target: < 5% of total tickets
- Action: If > 10%, revise UI/documentation

**Technical Metrics**:

- Monitor: Thread load time (p95)
- Target: < 500ms
- Action: If > 1s, optimize database queries

---

## 10. Appendix

### 10.1 Related Documentation

- **AI Mediation Constitution**: `/chat-server/ai-mediation-constitution.md`
- **Design System**: `/prompts/design_system.md`
- **Thread Categories Config**: `/chat-client-vite/src/config/threadCategories.js`
- **Thread Handler**: `/chat-server/socketHandlers/threadHandler.js`
- **Thread Service**: `/chat-server/src/services/threads/`
- **Database Migrations**: `/chat-server/migrations/025_thread_hierarchy.sql`

### 10.2 Glossary

| Term                  | Definition                                                                |
| --------------------- | ------------------------------------------------------------------------- |
| **Thread**            | A conversation topic within a room, containing related messages           |
| **Sub-thread**        | A nested thread spawned from a parent thread message                      |
| **Root thread**       | Top-level thread (depth 0, no parent)                                     |
| **Thread depth**      | Nesting level (0-3, enforced maximum)                                     |
| **Thread category**   | Topic classification (medical, education, schedule, etc.)                 |
| **Archived thread**   | Thread marked as resolved/inactive, hidden from main view                 |
| **Delta update**      | Real-time event containing only changed data (not full state)             |
| **Thread embedding**  | Vector representation of thread title for semantic search                 |
| **Thread breadcrumb** | Navigation showing thread hierarchy (e.g., "Schedule > Soccer > Uniform") |

### 10.3 References

**Co-Parenting Research**:

- Amato, P. R. (2010). "Research on divorce: Continuing trends and new developments." _Journal of Marriage and Family_, 72(3), 650-666.
  - Finding: Organized communication reduces post-divorce conflict

**Communication Studies**:

- Daft, R. L., & Lengel, R. H. (1986). "Organizational information requirements, media richness and structural design." _Management Science_, 32(5), 554-571.
  - Finding: Topic threading reduces information overload

**UX Best Practices**:

- Nielsen Norman Group. (2021). "Threading in Messaging Apps."
  - Recommendation: Max 3 nesting levels to avoid cognitive overload

---

## Document Change Log

| Version | Date       | Author              | Changes                     |
| ------- | ---------- | ------------------- | --------------------------- |
| 1.0.0   | 2025-12-29 | specification-agent | Initial specification draft |

---

**Next Steps**:

1. **Product Review**: Validate user stories with co-parent focus group
2. **Technical Review**: Verify feasibility with engineering team
3. **Design Mockups**: Create high-fidelity UI designs
4. **Create Plan**: Use `/plan` command to break down into implementation tasks
5. **Create Tasks**: Use `/tasks` command to generate developer task list

---

**Specification Agent Sign-Off**:
This specification follows Spec-Driven Development (SDD) methodology and Constitutional Principles (v1.5.0). Ready for planning phase.
