# Conversation Threading - Quick Reference

**Last Updated**: 2025-12-29

## TL;DR

Add conversation threading to LiaiZen to help co-parents organize messages by topic (medical, education, schedule, etc.). Reduces confusion and conflict by grouping related discussions.

---

## Current State (Already Implemented)

✅ **Backend**:

- Database schema exists (`threads` table with hierarchy support)
- Socket.io handlers implemented (`threadHandler.js`)
- Thread services layer (`/src/services/threads/`)
- 9 default categories (safety, medical, education, schedule, finances, activities, travel, co-parenting, logistics)
- Hierarchical threads (sub-threads, max depth 3)
- Real-time delta updates

✅ **Frontend**:

- Thread sidebar component (`ThreadsSidebar.jsx`)
- Category configuration (`threadCategories.js`)
- Socket.io event handlers

---

## What's Missing (Needs Implementation)

❌ **User-Facing Features**:

- Thread creation UI from messages (right-click → "Start Thread")
- Thread reply input box
- Thread view component (full message history)
- Thread filtering by category in sidebar
- Archive/reopen thread UI
- Thread notifications
- Mobile gestures (swipe to archive)

❌ **Integration**:

- AI mediation context for thread messages
- Thread message search
- Unread badge on threads
- Keyboard navigation
- Accessibility (ARIA labels, screen reader)

❌ **Polish**:

- Onboarding tooltips ("Start a thread to organize this topic")
- Empty states ("No threads yet")
- Error handling UI (network failures, retry)

---

## Key User Flows

### Flow 1: Create Thread from Message

1. User long-press (mobile) or right-click (desktop) on message
2. Select "Start Thread" from menu
3. Modal appears with:
   - Auto-populated title (from message text, editable)
   - Category dropdown (9 options + custom)
4. User confirms → Thread created
5. Sidebar updates with new thread (real-time)
6. Original message shows "Thread started: [Title]" indicator

### Flow 2: Reply in Thread

1. User clicks thread in sidebar
2. Thread view opens (replaces main chat)
3. User types reply in thread input box
4. Message runs through AI mediation (same as main chat)
5. Reply appears in thread (real-time)
6. Thread moves to top of sidebar (sorted by last activity)

### Flow 3: Archive Resolved Thread

1. User right-clicks thread in sidebar
2. Select "Archive Thread"
3. Thread hidden from main view
4. "Show Archived" toggle reveals archived threads
5. User can reopen archived thread if needed

---

## Socket.io Events (API Contract)

### Client → Server

- `create_thread` - Create new thread
- `create_sub_thread` - Create sub-thread from thread message
- `get_threads` - Fetch all threads for room
- `get_thread_messages` - Fetch messages in thread
- `add_to_thread` - Add message to thread
- `remove_from_thread` - Remove message from thread

### Server → Client

- `thread_created` - New thread created (delta)
- `sub_thread_created` - New sub-thread created (delta)
- `thread_message_count_changed` - Message count updated (delta)
- `threads_list` - Full thread list (initial load only)
- `thread_messages` - Thread message history

---

## Database Schema (Reference)

```sql
CREATE TABLE threads (
  id TEXT PRIMARY KEY,                          -- UUID
  room_id TEXT NOT NULL,
  title TEXT NOT NULL,                          -- 3-100 characters
  created_by TEXT NOT NULL,                     -- User email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,              -- Atomic counter
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_archived INTEGER DEFAULT 0,
  category TEXT DEFAULT 'logistics',            -- Custom categories allowed
  parent_thread_id TEXT REFERENCES threads(id), -- For sub-threads
  root_thread_id TEXT REFERENCES threads(id),   -- Top-level thread
  parent_message_id TEXT REFERENCES messages(id), -- Originating message
  depth INTEGER DEFAULT 0,                      -- 0-3 nesting
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

---

## Co-Parenting Use Cases

### Medical Thread

**Example**: "Dr. Smith Appointment - Dec 15"

- Parent A: "Doctor confirmed 3pm appointment"
- Parent B: "I'll take her. What's the address?"
- Parent A: "123 Main St, bring insurance card"
- Parent B: "Got it, thanks"

**Benefit**: All medical info in one place, easy to reference later.

### Schedule Thread

**Example**: "Soccer Practice - Winter Schedule"

- Parent A: "Practice moved to Tuesdays at 5pm"
- Parent B: "Can you take her on Tuesdays? I have work."
- Parent A: "Yes, I'll handle Tuesdays"

**Benefit**: Clear custody coordination, reduces pickup/dropoff confusion.

### Education Thread

**Example**: "Science Fair Project"

- Parent A: "Teacher emailed, project due Feb 1"
- Parent B: "What's the topic?"
- Parent A: "Volcanoes. She needs poster board."
- Parent B: "I'll buy supplies this weekend"

**Benefit**: Both parents stay informed about school, teacher can be added later.

---

## Design System Reference

**Colors**:

- Primary: `#275559` (teal-dark)
- Success: `#6dd4b0`
- Focus: `#46BD92`

**Categories** (from `threadCategories.js`):

- Safety: 🛡️ Yellow (bg-yellow-100)
- Medical: 🏥 Red (bg-red-100)
- Education: 📚 Purple (bg-purple-100)
- Schedule: 📅 Blue (bg-blue-100)
- Finances: 💰 Green (bg-green-100)
- Activities: ⚽ Orange (bg-orange-100)
- Travel: ✈️ Cyan (bg-cyan-100)
- Co-Parenting: 🤝 Teal (bg-teal-100)
- Logistics: 📦 Gray (bg-gray-100)

**Components**:

- Buttons: Squoval (rounded-lg), min 44px height
- Cards: Glass morphism (bg-white/80)
- Typography: 0.02em letter spacing

---

## Performance Targets

- Thread list load: **< 500ms** (100 threads)
- Thread messages load: **< 1s** (500 messages)
- Thread creation: **< 300ms** (optimistic UI)
- WebSocket latency: **< 500ms** (p95)
- Mobile scroll: **60fps**

---

## Testing Checklist

### Unit Tests

- [ ] Thread creation service
- [ ] Message count atomic update
- [ ] Thread hierarchy validation (max depth 3)
- [ ] Category validation

### Integration Tests

- [ ] Socket.io event flow (create → broadcast → update)
- [ ] Database transactions (create thread + add message)
- [ ] AI mediation integration

### E2E Tests

- [ ] User creates thread from message
- [ ] User replies in thread
- [ ] User archives thread
- [ ] Thread updates appear real-time on both devices

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces thread updates
- [ ] Contrast ratios meet WCAG AA
- [ ] Focus indicators visible

---

## Next Steps

1. **Review Specification**: `/specs/conversation-threading/spec.md`
2. **Create Implementation Plan**: Use `/plan` command
3. **Generate Task List**: Use `/tasks` command
4. **Design Mockups**: UI designer creates high-fidelity designs
5. **User Testing**: Recruit 5 co-parent pairs for beta

---

## Questions? Issues?

- **Spec Document**: `/specs/conversation-threading/spec.md`
- **Existing Code**:
  - Backend: `/chat-server/src/services/threads/`
  - Frontend: `/chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`
- **Database Migrations**: `/chat-server/migrations/025_thread_hierarchy.sql`
