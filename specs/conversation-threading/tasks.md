# Task List - Conversation Threading Feature

**Feature ID**: CONV-THREAD-001
**Version**: 1.0.0
**Status**: Ready for Execution
**Generated**: 2025-12-29
**Total Tasks**: 42
**Estimated Timeline**: 3-4 weeks

---

## Task Organization

**Legend**:

- `[P]` - Can be executed in parallel with other [P] tasks in same phase
- `→` - Dependency arrow (Task A → Task B means B depends on A)
- Agent assignments based on expertise areas
- Complexity: S (Small: 1-2h), M (Medium: 2-4h), L (Large: 4-8h)

---

## Phase 1: Foundation & Service Layer Enhancements

**Duration**: Week 1 (Days 1-3)
**Focus**: Backend infrastructure, Socket handlers, AI mediation

### Task 1: Verify Database Schema & Indexes

- **Agent**: database-specialist
- **Depends on**: none
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Verify all migrations 025-030 are applied
  - [ ] Confirm all indexes exist (7 thread indexes)
  - [ ] Run performance benchmarks on thread queries (<500ms for 100 threads)
  - [ ] Document any missing indexes or optimizations needed
- **Files**:
  - `/chat-server/migrations/025_thread_hierarchy.sql`
  - `/chat-server/migrations/030_allow_custom_thread_categories.sql`
- **Estimate**: S (1h)

---

### Task 2: Implement Missing Use Case - ReplyInThreadUseCase

- **Agent**: backend-architect
- **Depends on**: Task 1
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ReplyInThreadUseCase.js` following existing use case pattern
  - [ ] Handle message validation (belongs to same room as thread)
  - [ ] Call AI mediation with thread context
  - [ ] Add message to thread_messages junction table
  - [ ] Atomically increment thread.message_count
  - [ ] Return updated thread metadata (count, last_message_at)
  - [ ] Unit tests with 80%+ coverage
- **Files**:
  - `/chat-server/src/services/threads/useCases/ReplyInThreadUseCase.js` (NEW)
  - `/chat-server/src/services/threads/useCases/__tests__/ReplyInThreadUseCase.test.js` (NEW)
- **Estimate**: M (3h)

---

### Task 3: Implement Missing Use Case - ArchiveThreadUseCase

- **Agent**: backend-architect
- **Depends on**: Task 1
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ArchiveThreadUseCase.js`
  - [ ] Set is_archived = 1 for thread
  - [ ] Archive all sub-threads recursively (cascade archival)
  - [ ] Emit thread_archived event to room
  - [ ] Support reopen functionality (is_archived = 0)
  - [ ] Unit tests for archive/reopen/cascade scenarios
- **Files**:
  - `/chat-server/src/services/threads/useCases/ArchiveThreadUseCase.js` (NEW)
  - `/chat-server/src/services/threads/useCases/__tests__/ArchiveThreadUseCase.test.js` (NEW)
- **Estimate**: M (2h)

---

### Task 4: Implement Missing Use Case - MoveMessageToThreadUseCase

- **Agent**: backend-architect
- **Depends on**: Task 1
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `MoveMessageToThreadUseCase.js`
  - [ ] Remove message from old thread (update count atomically)
  - [ ] Add message to new thread (update count atomically)
  - [ ] Use database transaction for atomicity
  - [ ] Emit thread_message_count_changed for both threads
  - [ ] Unit tests for move scenarios
- **Files**:
  - `/chat-server/src/services/threads/useCases/MoveMessageToThreadUseCase.js` (NEW)
  - `/chat-server/src/services/threads/useCases/__tests__/MoveMessageToThreadUseCase.test.js` (NEW)
- **Estimate**: M (3h)

---

### Task 5: Enhance AI Mediation Context Builder

- **Agent**: backend-architect
- **Depends on**: none
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Modify `aiContextHelper.js` to detect if message belongs to thread
  - [ ] Query thread metadata (title, category, depth) via threadOperations.getThread()
  - [ ] Add thread context to mediation context object:
    - threadId, threadTitle, threadCategory, threadDepth
  - [ ] Update AI prompt in `mediator.js` to include thread-specific coaching
  - [ ] Add category descriptions for context enrichment
  - [ ] Unit tests for context enrichment with/without threads
- **Files**:
  - `/chat-server/socketHandlers/aiContextHelper.js` (MODIFY)
  - `/chat-server/src/liaizen/core/mediator.js` (MODIFY)
  - `/chat-server/__tests__/aiContextHelper.test.js` (MODIFY)
- **Estimate**: M (3h)

---

### Task 6: Add Domain Events for Thread Operations

- **Agent**: backend-architect
- **Depends on**: Tasks 2, 3, 4
- **Parallel**: No (requires use cases)
- **Acceptance**:
  - [ ] Emit ThreadArchived event in ArchiveThreadUseCase
  - [ ] Emit MessageAddedToThread event in ReplyInThreadUseCase
  - [ ] Emit MessageMovedBetweenThreads event in MoveMessageToThreadUseCase
  - [ ] Events include metadata for analytics (roomId, threadId, userId, timestamp)
  - [ ] Add event listeners for analytics tracking (future integration)
- **Files**:
  - `/chat-server/src/services/threads/events/` (NEW directory)
  - `/chat-server/src/services/threads/events/ThreadArchived.js` (NEW)
  - `/chat-server/src/services/threads/events/MessageAddedToThread.js` (NEW)
- **Estimate**: S (2h)

---

### Task 7: Contract Tests for Socket.io Events

- **Agent**: testing-specialist
- **Depends on**: Tasks 2, 3, 4, 5
- **Parallel**: No (requires backend implementation)
- **Acceptance**:
  - [ ] Test create_thread event (success + validation errors)
  - [ ] Test create_sub_thread event (depth limit enforcement)
  - [ ] Test get_threads event (returns correct thread list)
  - [ ] Test get_thread_messages event (pagination works)
  - [ ] Test add_to_thread event (atomic count updates)
  - [ ] Test remove_from_thread event (atomic count decrements)
  - [ ] Test get_sub_threads event (returns direct children)
  - [ ] Test get_thread_ancestors event (breadcrumb data correct)
  - [ ] Verify delta updates broadcast to all room members
  - [ ] All events tested with Jest + Socket.io-client
- **Files**:
  - `/chat-server/__tests__/threads-socket.test.js` (NEW)
- **Estimate**: L (6h)

---

## Phase 2: Frontend State Management & Core Hooks

**Duration**: Week 1-2 (Days 4-7)
**Focus**: React hooks, state management, Socket integration

### Task 8: Create useThreadActions Hook (Socket Wrappers)

- **Agent**: frontend-specialist
- **Depends on**: none
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `useThreadActions.js` hook
  - [ ] Implement createThread(roomId, title, category?, messageId?) → Promise<string>
  - [ ] Implement createSubThread(roomId, title, parentId, messageId?) → Promise<string>
  - [ ] Implement getThreads(roomId) → Promise<Thread[]>
  - [ ] Implement getThreadMessages(threadId) → Promise<Message[]>
  - [ ] Implement addToThread(messageId, threadId) → Promise<void>
  - [ ] Implement removeFromThread(messageId) → Promise<void>
  - [ ] Implement getSubThreads(threadId) → Promise<Thread[]>
  - [ ] Implement getAncestors(threadId) → Promise<Thread[]>
  - [ ] All functions return Promises with Socket.io emit/once pattern
  - [ ] Error handling for all operations
- **Files**:
  - `/chat-client-vite/src/features/chat/hooks/useThreadActions.js` (NEW)
- **Estimate**: M (4h)

---

### Task 9: Create useThreadSocket Hook (Event Listeners)

- **Agent**: frontend-specialist
- **Depends on**: Task 8
- **Parallel**: No (requires useThreadActions)
- **Acceptance**:
  - [ ] Create `useThreadSocket.js` hook
  - [ ] Listen for thread_created (delta update → add to state)
  - [ ] Listen for sub_thread_created (delta update → add under parent)
  - [ ] Listen for thread_message_count_changed (delta merge)
  - [ ] Listen for threads_list (full replace on initial load)
  - [ ] Listen for thread_messages (set thread messages)
  - [ ] Listen for sub_threads_list (set sub-threads)
  - [ ] Listen for thread_ancestors (set breadcrumb data)
  - [ ] Cleanup listeners on unmount
  - [ ] Reconnection logic: re-fetch threads on socket reconnect
- **Files**:
  - `/chat-client-vite/src/features/chat/hooks/useThreadSocket.js` (NEW)
- **Estimate**: M (4h)

---

### Task 10: Create useThreads Hook (Unified State Management)

- **Agent**: frontend-specialist
- **Depends on**: Tasks 8, 9
- **Parallel**: No (requires both hooks)
- **Acceptance**:
  - [ ] Create `useThreads.js` hook combining useThreadActions + useThreadSocket
  - [ ] State: threads (Array<Thread>), selectedThreadId, threadMessages (Map<id, Message[]>)
  - [ ] State: loading (boolean), error (Error | null)
  - [ ] Function: createThread(data) → optimistic update + sync
  - [ ] Function: createSubThread(parentId, data) → optimistic update + sync
  - [ ] Function: selectThread(id) → load messages if not cached
  - [ ] Function: addMessageToThread(messageId, threadId)
  - [ ] Function: archiveThread(id) → filter from UI (unless "Show Archived" on)
  - [ ] Function: updateThread(id, updates)
  - [ ] Function: loadThreadMessages(id, offset?) → pagination support
  - [ ] Delta merge logic for real-time updates
  - [ ] Client-side caching of thread messages
- **Files**:
  - `/chat-client-vite/src/features/chat/hooks/useThreads.js` (NEW)
- **Estimate**: L (6h)

---

### Task 11: Unit Tests for Thread Hooks

- **Agent**: testing-specialist
- **Depends on**: Task 10
- **Parallel**: No (requires hooks implementation)
- **Acceptance**:
  - [ ] Test useThreadActions: All socket emits work correctly
  - [ ] Test useThreadSocket: Delta updates merge correctly
  - [ ] Test useThreads: State updates on thread creation
  - [ ] Test useThreads: Optimistic updates with rollback on error
  - [ ] Test useThreads: Message count delta merge
  - [ ] Test useThreads: Pagination loads more messages
  - [ ] Mock Socket.io client for isolated testing
  - [ ] 80%+ code coverage for all hooks
- **Files**:
  - `/chat-client-vite/src/features/chat/hooks/__tests__/useThreadActions.test.js` (NEW)
  - `/chat-client-vite/src/features/chat/hooks/__tests__/useThreadSocket.test.js` (NEW)
  - `/chat-client-vite/src/features/chat/hooks/__tests__/useThreads.test.js` (NEW)
- **Estimate**: M (4h)

---

## Phase 3: Frontend UI Components

**Duration**: Week 2 (Days 8-11)
**Focus**: Thread view, modals, message input, context menus

### Task 12: Create ThreadView Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ThreadView.jsx` component
  - [ ] Display thread title and category badge
  - [ ] Show thread breadcrumb if sub-thread (integrate Task 16)
  - [ ] Display message list (chronological order)
  - [ ] Implement infinite scroll (load more on scroll up)
  - [ ] Show "Back to Main Chat" button
  - [ ] Show thread options menu (archive, edit, change category)
  - [ ] Responsive layout (mobile full-screen, desktop side-by-side)
  - [ ] Loading states for message fetch
  - [ ] Empty state ("No messages yet")
  - [ ] Follow LiaiZen design system (Tailwind classes, glass morphism)
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadView.jsx` (NEW)
- **Estimate**: L (6h)

---

### Task 13: Create ThreadCreationModal Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ThreadCreationModal.jsx` modal component
  - [ ] Auto-populate title from message text (editable)
  - [ ] Category dropdown (9 defaults + custom option)
  - [ ] Preview of originating message (if creating from message)
  - [ ] "Create Sub-Thread" mode (when parentThread provided)
  - [ ] Form validation (3-100 chars title, required)
  - [ ] Submit calls createThread or createSubThread from useThreads
  - [ ] Loading state during creation
  - [ ] Error display for validation failures
  - [ ] Keyboard shortcuts (Enter to submit, Escape to close)
  - [ ] Accessible (ARIA labels, focus management)
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadCreationModal.jsx` (NEW)
- **Estimate**: M (4h)

---

### Task 14: Create ThreadMessageInput Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ThreadMessageInput.jsx` input component
  - [ ] Text input with auto-resize
  - [ ] AI mediation on send (same pipeline as main chat)
  - [ ] Thread context in intervention UI ("This reply in the Medical thread...")
  - [ ] "Replying in [Thread Title]" indicator above input
  - [ ] Character count (optional, 1000 char limit)
  - [ ] Send button (disabled when empty)
  - [ ] Keyboard shortcuts (Enter to send, Shift+Enter for newline)
  - [ ] Loading state during mediation
  - [ ] Error handling for send failures
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadMessageInput.jsx` (NEW)
- **Estimate**: M (4h)

---

### Task 15: Create ThreadContextMenu Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ThreadContextMenu.jsx` context menu component
  - [ ] Support two modes: 'message' and 'thread'
  - [ ] Message mode options: "Start Thread", "Add to Thread", "Copy Message"
  - [ ] Thread mode options: "Open Thread", "Edit Title", "Change Category", "Archive", "Reopen"
  - [ ] Position menu at click/long-press coordinates
  - [ ] Close on outside click or Escape key
  - [ ] Execute actions via useThreads hook
  - [ ] Accessible (keyboard navigation, ARIA menu role)
  - [ ] Responsive (mobile-friendly touch targets 44px+)
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadContextMenu.jsx` (NEW)
- **Estimate**: M (3h)

---

### Task 16: Create ThreadBreadcrumb Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create `ThreadBreadcrumb.jsx` navigation component
  - [ ] Display thread hierarchy: "Root > Parent > Current"
  - [ ] Clickable parent links (navigate to parent thread)
  - [ ] Chevron separators (>)
  - [ ] Current thread highlighted (bold, teal-dark color)
  - [ ] Truncate long titles with hover tooltip
  - [ ] Accessible (nav element, aria-label "Thread hierarchy")
  - [ ] Fetch ancestors via getAncestors() from useThreads
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadBreadcrumb.jsx` (NEW)
- **Estimate**: S (2h)

---

### Task 17: Enhance ThreadsSidebar Component

- **Agent**: frontend-specialist
- **Depends on**: Task 10
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Modify existing `ThreadsSidebar.jsx` to integrate with useThreads hook
  - [ ] Add "Show Archived" toggle (filter is_archived = 1 threads)
  - [ ] Add unread badge indicator (message_count > user's last_read_count)
  - [ ] Add context menu on right-click/long-press (use ThreadContextMenu)
  - [ ] Highlight selected thread
  - [ ] Sort threads by last_message_at DESC by default
  - [ ] Category filter dropdown (existing, ensure integration)
  - [ ] Loading state while fetching threads
  - [ ] Empty state ("Create your first thread")
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx` (MODIFY)
- **Estimate**: M (3h)

---

### Task 18: Integrate Thread Components into ChatRoom

- **Agent**: frontend-specialist
- **Depends on**: Tasks 12, 13, 14, 15, 16, 17
- **Parallel**: No (requires all components)
- **Acceptance**:
  - [ ] Modify `ChatRoom.jsx` to use useThreads hook
  - [ ] Add state for selectedThreadId, showThreadView, showThreadCreationModal
  - [ ] Render ThreadsSidebar in left sidebar (existing)
  - [ ] Render ThreadView when selectedThreadId !== null
  - [ ] Render ThreadCreationModal when showThreadCreationModal = true
  - [ ] Wire up "Start Thread" action from message context menu
  - [ ] Wire up "Back to Main Chat" button in ThreadView
  - [ ] Responsive: ThreadView replaces main chat on mobile (full-screen)
  - [ ] Desktop: ThreadView in right panel (side-by-side with main chat)
  - [ ] Keyboard shortcuts: Escape to close thread view
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ChatRoom.jsx` (MODIFY)
- **Estimate**: L (5h)

---

### Task 19: Component Unit Tests

- **Agent**: testing-specialist
- **Depends on**: Tasks 12-18
- **Parallel**: No (requires all components)
- **Acceptance**:
  - [ ] Test ThreadView: Renders thread messages correctly
  - [ ] Test ThreadView: Infinite scroll loads more messages
  - [ ] Test ThreadCreationModal: Form validation works
  - [ ] Test ThreadCreationModal: Submit calls createThread
  - [ ] Test ThreadMessageInput: AI mediation triggers on hostile message
  - [ ] Test ThreadContextMenu: Menu options execute correct actions
  - [ ] Test ThreadBreadcrumb: Displays correct hierarchy
  - [ ] Test ThreadsSidebar: Archive toggle filters threads
  - [ ] Test ChatRoom: Thread view toggles correctly
  - [ ] All tests use React Testing Library
  - [ ] 80%+ code coverage for all components
- **Files**:
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadView.test.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadCreationModal.test.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadMessageInput.test.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadContextMenu.test.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadBreadcrumb.test.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/__tests__/ThreadsSidebar.test.jsx` (MODIFY)
  - `/chat-client-vite/src/features/chat/components/__tests__/ChatRoom.test.jsx` (MODIFY)
- **Estimate**: L (8h)

---

## Phase 4: Mobile UX & Gestures

**Duration**: Week 3 (Days 12-14)
**Focus**: Touch gestures, responsive design, mobile-specific interactions

### Task 20: Implement Long-Press Gesture for Messages

- **Agent**: frontend-specialist
- **Depends on**: Task 15
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Add long-press detection to message components
  - [ ] Trigger after 500ms press (standard mobile threshold)
  - [ ] Show ThreadContextMenu at touch coordinates
  - [ ] Cancel on touchmove (user is scrolling)
  - [ ] Visual feedback (slight scale or highlight on press)
  - [ ] Works on mobile Safari (iOS) and Chrome (Android)
  - [ ] Does not interfere with message text selection
- **Files**:
  - `/chat-client-vite/src/features/chat/components/MessageItem.jsx` (MODIFY - existing)
  - `/chat-client-vite/src/features/chat/hooks/useLongPress.js` (NEW - helper hook)
- **Estimate**: M (3h)

---

### Task 21: Implement Swipe Gestures for Threads

- **Agent**: frontend-specialist
- **Depends on**: Task 17
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Add swipe detection to thread items in sidebar
  - [ ] Swipe left (50px threshold) → Archive thread (with undo toast)
  - [ ] Swipe right (50px threshold) → Mark as read (future feature, optional)
  - [ ] Visual feedback: thread slides with finger, shows archive icon
  - [ ] Cancel if vertical scroll detected (< 45° angle)
  - [ ] Undo toast appears for 5 seconds with "Undo" button
  - [ ] Works on mobile Safari and Chrome
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx` (MODIFY)
  - `/chat-client-vite/src/features/chat/hooks/useSwipeGesture.js` (NEW - helper hook)
- **Estimate**: M (4h)

---

### Task 22: Responsive Design Testing & Fixes

- **Agent**: frontend-specialist
- **Depends on**: Tasks 20, 21
- **Parallel**: No (requires gestures implemented)
- **Acceptance**:
  - [ ] Test all components on 375px width (iPhone SE)
  - [ ] Test all components on 768px width (iPad)
  - [ ] Test all components on 1024px+ width (desktop)
  - [ ] ThreadView: Full-screen on mobile, side panel on desktop
  - [ ] ThreadsSidebar: Collapsible on mobile, always visible on desktop
  - [ ] ThreadCreationModal: Centered modal, max-width 500px
  - [ ] Touch targets: All buttons ≥ 44px height (iOS guidelines)
  - [ ] Fix any layout issues found during testing
  - [ ] Test on real devices (iOS Safari, Android Chrome)
- **Files**:
  - All component files (review and fix)
- **Estimate**: M (4h)

---

### Task 23: Accessibility Audit & Fixes

- **Agent**: frontend-specialist
- **Depends on**: Task 22
- **Parallel**: No (requires responsive fixes)
- **Acceptance**:
  - [ ] Run axe DevTools on all thread UI components
  - [ ] Fix all violations (target: 0 violations)
  - [ ] Verify keyboard navigation works:
    - Tab through thread list, Enter to open, Escape to close
    - Arrow keys to navigate threads (optional enhancement)
  - [ ] Verify screen reader announcements:
    - "Thread created: [Title]" on creation
    - "New message in [Thread]" on message count update
    - Breadcrumb reads correctly ("in Schedule, in Soccer Practice")
  - [ ] ARIA labels on all interactive elements
  - [ ] Focus management on modal open/close
  - [ ] Contrast ratios meet WCAG 2.1 AA (4.5:1 for text)
  - [ ] Focus indicators visible (3px border, high contrast)
- **Files**:
  - All component files (review and fix)
  - `/chat-client-vite/src/utils/a11y.js` (NEW - accessibility utilities)
- **Estimate**: M (4h)

---

## Phase 5: Integration Testing & E2E Scenarios

**Duration**: Week 3 (Days 15-17)
**Focus**: End-to-end user flows, AI mediation, real-time updates

### Task 24: E2E Test - Create Thread from Message

- **Agent**: testing-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] User sends message in main chat
  - [ ] User right-clicks (desktop) or long-presses (mobile) message
  - [ ] User selects "Start Thread" from context menu
  - [ ] ThreadCreationModal appears with auto-populated title
  - [ ] User selects category and submits
  - [ ] Thread appears in ThreadsSidebar
  - [ ] Original message shows "Thread started" indicator
  - [ ] Both co-parents see new thread in real-time
  - [ ] Test passes on Chrome, Safari, Firefox
- **Files**:
  - `/chat-client-vite/e2e/threads-create.spec.js` (NEW - Playwright test)
- **Estimate**: M (3h)

---

### Task 25: E2E Test - Reply in Thread with AI Intervention

- **Agent**: testing-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] User opens existing thread from sidebar
  - [ ] User types hostile message in ThreadMessageInput
  - [ ] AI intervention modal appears with thread-specific tip
  - [ ] User accepts rewrite
  - [ ] Rewritten message appears in thread
  - [ ] Thread message count updates in sidebar
  - [ ] Co-parent sees new message in real-time
  - [ ] Thread moves to top of sidebar (sorted by last_message_at)
  - [ ] Test passes on Chrome, Safari
- **Files**:
  - `/chat-client-vite/e2e/threads-reply-mediation.spec.js` (NEW - Playwright test)
- **Estimate**: M (3h)

---

### Task 26: E2E Test - Archive Thread

- **Agent**: testing-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] User right-clicks thread in sidebar
  - [ ] User selects "Archive" from context menu
  - [ ] Confirmation modal appears (if unread messages)
  - [ ] User confirms archival
  - [ ] Thread disappears from main sidebar view
  - [ ] User toggles "Show Archived" filter
  - [ ] Archived thread appears grayed out
  - [ ] User clicks "Reopen Thread" button
  - [ ] Thread returns to active state
  - [ ] Test passes on Chrome, Safari
- **Files**:
  - `/chat-client-vite/e2e/threads-archive.spec.js` (NEW - Playwright test)
- **Estimate**: M (2h)

---

### Task 27: E2E Test - Create Sub-Thread (Hierarchy)

- **Agent**: testing-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] User opens existing thread
  - [ ] User right-clicks message in thread
  - [ ] User selects "Create Sub-Thread"
  - [ ] Modal shows "Create Sub-Thread" title (not "Create Thread")
  - [ ] User creates sub-thread
  - [ ] Sub-thread appears indented in sidebar under parent
  - [ ] Breadcrumb shows hierarchy (e.g., "Schedule > Soccer > Uniform")
  - [ ] Depth limit: Cannot create sub-sub-sub-sub-thread (max 3 levels)
  - [ ] Test passes on Chrome, Safari
- **Files**:
  - `/chat-client-vite/e2e/threads-hierarchy.spec.js` (NEW - Playwright test)
- **Estimate**: M (3h)

---

### Task 28: E2E Test - Mobile Gestures

- **Agent**: testing-specialist
- **Depends on**: Tasks 20, 21
- **Parallel**: No (requires gestures implemented)
- **Acceptance**:
  - [ ] Long-press message shows context menu (mobile viewport)
  - [ ] Swipe left on thread archives it
  - [ ] Undo toast appears after swipe archive
  - [ ] Clicking "Undo" reopens thread
  - [ ] Swipe gesture does not trigger during vertical scroll
  - [ ] Test on real iOS device (Safari)
  - [ ] Test on real Android device (Chrome)
  - [ ] Test passes on Playwright mobile emulation
- **Files**:
  - `/chat-client-vite/e2e/threads-mobile-gestures.spec.js` (NEW - Playwright test)
- **Estimate**: M (4h)

---

### Task 29: Integration Test - AI Mediation with Thread Context

- **Agent**: testing-specialist
- **Depends on**: Task 5
- **Parallel**: No (requires AI context enhancement)
- **Acceptance**:
  - [ ] Create test thread with category "medical"
  - [ ] Send hostile message in thread
  - [ ] Verify AI context includes threadId, threadTitle, threadCategory
  - [ ] Verify AI prompt includes thread-specific coaching
  - [ ] Verify intervention message references thread category
  - [ ] Example: "This reply in the Medical thread may sound accusatory..."
  - [ ] Test with different categories (education, schedule, etc.)
  - [ ] Mock OpenAI API responses for deterministic tests
- **Files**:
  - `/chat-server/__tests__/ai-mediation-threads.test.js` (NEW - Jest test)
- **Estimate**: M (3h)

---

### Task 30: Integration Test - Real-Time Delta Updates

- **Agent**: testing-specialist
- **Depends on**: Task 18
- **Parallel**: No (requires frontend integration)
- **Acceptance**:
  - [ ] Create thread from User A's socket
  - [ ] Verify User B receives thread_created event
  - [ ] Verify User B's UI shows new thread (delta merge)
  - [ ] User A adds message to thread
  - [ ] Verify User B receives thread_message_count_changed event
  - [ ] Verify User B's UI shows updated count (not full thread refresh)
  - [ ] Measure bandwidth: delta update < 100 bytes
  - [ ] Test reconnection logic: User B disconnects, reconnects, gets full list
- **Files**:
  - `/chat-client-vite/e2e/threads-realtime-updates.spec.js` (NEW - Playwright test)
- **Estimate**: M (3h)

---

## Phase 6: Performance Optimization & Polish

**Duration**: Week 4 (Days 18-21)
**Focus**: Performance tuning, error handling, documentation

### Task 31: Performance Testing & Optimization

- **Agent**: frontend-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Benchmark thread list render time with 100 threads (target: <500ms)
  - [ ] Benchmark thread messages load with 500 messages (target: <1s)
  - [ ] Benchmark delta update merge time (target: <100ms)
  - [ ] Optimize useThreads hook with useMemo/useCallback
  - [ ] Add React.memo to ThreadView, ThreadMessageInput components
  - [ ] Consider virtual scrolling if thread list >100 (deferred if not needed)
  - [ ] Run Lighthouse audit (target: Performance ≥90, Accessibility ≥90)
  - [ ] Fix any performance bottlenecks identified
- **Files**:
  - All component files (optimization review)
  - `/docs/PERFORMANCE_BENCHMARKS.md` (NEW - document results)
- **Estimate**: M (4h)

---

### Task 32: Error Handling & Recovery UI

- **Agent**: frontend-specialist
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Handle thread creation errors (show inline error, preserve draft)
  - [ ] Handle message send errors (show retry button)
  - [ ] Handle thread not found (redirect to main chat with toast)
  - [ ] Handle network failures (show "Reconnecting..." indicator)
  - [ ] Handle permission errors (show "You don't have access" message)
  - [ ] Graceful degradation: If WebSocket fails, show "Try refreshing"
  - [ ] All errors logged to console with context (for debugging)
  - [ ] Error boundary wraps thread components (prevent full app crash)
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadErrorBoundary.jsx` (NEW)
  - All component files (add error handling)
- **Estimate**: M (3h)

---

### Task 33: Onboarding Tooltips & Empty States

- **Agent**: ui-designer
- **Depends on**: Task 18
- **Parallel**: [P]
- **Acceptance**:
  - [ ] First-time user sees tooltip on first message: "Start a thread to organize this topic"
  - [ ] Empty state in ThreadsSidebar: "Create your first thread" with illustration
  - [ ] Empty state in ThreadView: "No messages yet" with "Reply below" hint
  - [ ] Help icon in ThreadsSidebar links to "How to Use Threads" guide
  - [ ] Tooltips dismissible (never show again after dismissal)
  - [ ] Tooltips follow LiaiZen design system (glass morphism, teal accents)
- **Files**:
  - `/chat-client-vite/src/features/chat/components/ThreadOnboardingTooltip.jsx` (NEW)
  - `/chat-client-vite/src/features/chat/components/ThreadEmptyState.jsx` (NEW)
- **Estimate**: S (2h)

---

### Task 34: User Guide Documentation

- **Agent**: product-manager
- **Depends on**: none
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create "How to Use Threads" user guide with screenshots
  - [ ] Cover: Creating threads, replying in threads, sub-threads, archiving
  - [ ] Include visual examples of thread hierarchy
  - [ ] Explain category system (medical, education, schedule, etc.)
  - [ ] Describe mobile gestures (long-press, swipe)
  - [ ] Add FAQ section (common questions)
  - [ ] Publish to Help Center (link from app)
  - [ ] Review with co-parent focus group for clarity
- **Files**:
  - `/docs/user-guides/THREADING_USER_GUIDE.md` (NEW)
  - Screenshots: `/docs/user-guides/images/threading-*.png` (NEW)
- **Estimate**: M (3h)

---

### Task 35: Developer API Documentation

- **Agent**: backend-architect
- **Depends on**: Task 7
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Document all Socket.io events in API reference
  - [ ] Include request/response payloads with examples
  - [ ] Document delta update pattern (why and how)
  - [ ] Document thread hierarchy (depth limits, root_thread_id)
  - [ ] Document AI mediation context enrichment
  - [ ] Include code examples for common operations
  - [ ] Add migration guide for existing chat implementations
  - [ ] Review with engineering team for accuracy
- **Files**:
  - `/docs/api/THREADING_API_REFERENCE.md` (NEW)
  - `/docs/guides/THREADING_MIGRATION_GUIDE.md` (NEW)
- **Estimate**: M (3h)

---

### Task 36: Changelog & Release Notes

- **Agent**: product-manager
- **Depends on**: none
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Create CHANGELOG.md entry for threading feature
  - [ ] Include feature summary (what's new)
  - [ ] List all user-facing changes (UI, UX, mobile)
  - [ ] List all developer-facing changes (API, events, hooks)
  - [ ] Add migration notes (any breaking changes)
  - [ ] Include link to user guide
  - [ ] Version bump: v2.1.0 (minor feature release)
- **Files**:
  - `/CHANGELOG.md` (MODIFY)
  - `/docs/releases/v2.1.0-RELEASE_NOTES.md` (NEW)
- **Estimate**: S (1h)

---

## Phase 7: User Acceptance Testing & Beta

**Duration**: Week 4 (Days 22-28)
**Focus**: Beta testing with real co-parents, feedback collection

### Task 37: Beta Testing Recruitment

- **Agent**: product-manager
- **Depends on**: Task 36
- **Parallel**: [P]
- **Acceptance**:
  - [ ] Recruit 5 co-parent pairs (10 total users)
  - [ ] Diverse profiles: high-conflict, low-conflict, tech-savvy, non-tech
  - [ ] Provide beta access to staging environment
  - [ ] Send onboarding email with user guide
  - [ ] Schedule kick-off call (explain feature, answer questions)
  - [ ] 1-week beta period (users test feature daily)
- **Files**:
  - `/docs/beta/THREADING_BETA_PLAN.md` (NEW)
- **Estimate**: S (2h - coordination)

---

### Task 38: Beta Feedback Collection

- **Agent**: product-manager
- **Depends on**: Task 37
- **Parallel**: No (requires beta period)
- **Acceptance**:
  - [ ] Daily check-ins with beta testers (Slack/email)
  - [ ] Collect qualitative feedback (what works, what's confusing)
  - [ ] Collect quantitative data (thread creation rate, messages per thread)
  - [ ] Track critical bugs reported
  - [ ] Track feature requests
  - [ ] End-of-week survey (satisfaction score, likelihood to recommend)
  - [ ] Compile feedback into report
- **Files**:
  - `/docs/beta/THREADING_BETA_FEEDBACK.md` (NEW)
- **Estimate**: M (2h daily for 7 days = 14h)

---

### Task 39: Beta Bug Fixes & Refinements

- **Agent**: frontend-specialist, backend-architect
- **Depends on**: Task 38
- **Parallel**: No (requires feedback)
- **Acceptance**:
  - [ ] Fix all critical bugs reported in beta
  - [ ] Address usability issues (if blocking)
  - [ ] Make minor UX improvements based on feedback
  - [ ] Re-deploy to staging for re-testing
  - [ ] Verify fixes with beta testers
  - [ ] Document all fixes in changelog
- **Files**:
  - Various (bug-specific)
  - `/CHANGELOG.md` (MODIFY - add bug fixes)
- **Estimate**: L (8h - depends on bug count)

---

### Task 40: Final Regression Testing

- **Agent**: testing-specialist
- **Depends on**: Task 39
- **Parallel**: No (requires bug fixes)
- **Acceptance**:
  - [ ] Re-run all E2E tests (Tasks 24-28)
  - [ ] Re-run integration tests (Tasks 29-30)
  - [ ] Re-run unit tests (all tests green)
  - [ ] Run full accessibility audit (axe DevTools)
  - [ ] Run Lighthouse audit (Performance, Accessibility, Best Practices)
  - [ ] Verify performance benchmarks still met
  - [ ] Test on production-like environment (Railway backend, Vercel frontend)
  - [ ] Sign-off from QA team
- **Files**:
  - All test files (re-run)
  - `/docs/testing/THREADING_REGRESSION_REPORT.md` (NEW)
- **Estimate**: M (4h)

---

## Phase 8: Deployment & Monitoring

**Duration**: Week 4 (Day 29+)
**Focus**: Production deployment, monitoring, post-launch support

### Task 41: Production Deployment

- **Agent**: backend-architect, frontend-specialist
- **Depends on**: Task 40
- **Parallel**: No (requires final testing)
- **Acceptance**:
  - [ ] Deploy backend to Railway (production environment)
  - [ ] Deploy frontend to Vercel (production environment)
  - [ ] Verify database migrations run successfully
  - [ ] Smoke test: Create thread, reply, archive (production)
  - [ ] Monitor error logs (Sentry, Railway logs)
  - [ ] Verify Socket.io connections stable
  - [ ] Send announcement email to all users (feature launch)
  - [ ] Update Help Center with user guide
- **Files**:
  - Deployment scripts
  - `/docs/deployment/THREADING_DEPLOYMENT_LOG.md` (NEW)
- **Estimate**: M (2h deployment + 2h monitoring)

---

### Task 42: Post-Launch Monitoring (30 Days)

- **Agent**: backend-architect, product-manager
- **Depends on**: Task 41
- **Parallel**: No (post-deployment)
- **Acceptance**:
  - [ ] Monitor adoption metrics (60% of pairs create ≥1 thread)
  - [ ] Monitor engagement metrics (5+ messages per thread)
  - [ ] Monitor performance (thread load <500ms p95)
  - [ ] Monitor error rates (<1% error rate)
  - [ ] Track support tickets related to threading
  - [ ] Weekly report to stakeholders (metrics + feedback)
  - [ ] Iterate on UX based on real usage data
  - [ ] Plan v2 features (thread analytics, templates)
- **Files**:
  - `/docs/metrics/THREADING_ADOPTION_REPORT.md` (NEW - weekly updates)
- **Estimate**: S (1h weekly for 4 weeks = 4h)

---

## Summary: Task Dependencies & Critical Path

### Critical Path (Longest Sequential Chain)

```
Task 1 (DB Verify) →
Task 2 (ReplyInThreadUseCase) →
Task 5 (AI Context) →
Task 7 (Contract Tests) →
Task 8 (useThreadActions) →
Task 9 (useThreadSocket) →
Task 10 (useThreads) →
Task 12 (ThreadView) →
Task 18 (ChatRoom Integration) →
Task 24 (E2E Create Thread) →
Task 40 (Regression Testing) →
Task 41 (Deployment) →
Task 42 (Monitoring)
```

**Critical Path Duration**: ~18 days (with daily work)

### Parallelization Opportunities

**Week 1 (Phase 1 - Backend)**:

- Tasks 1, 2, 3, 4, 5 can run in parallel (4 backend engineers)
- Task 6 requires Tasks 2, 3, 4 complete
- Task 7 requires all backend complete

**Week 1-2 (Phase 2 - Frontend Hooks)**:

- Task 8 can start immediately (parallel with backend)
- Tasks 9, 10 sequential
- Task 11 requires Task 10

**Week 2 (Phase 3 - UI Components)**:

- Tasks 12, 13, 14, 15, 16, 17 can run in parallel (3 frontend engineers)
- Task 18 requires all components
- Task 19 requires Task 18

**Week 3 (Phase 4 - Mobile & Testing)**:

- Tasks 20, 21, 22, 23 sequential
- Tasks 24, 25, 26, 27 can run in parallel (2 QA engineers)
- Tasks 28, 29, 30 sequential after gestures

**Week 4 (Phase 5-6 - Polish & Deployment)**:

- Tasks 31, 32, 33, 34, 35, 36 can run in parallel
- Tasks 37-42 sequential (beta → fixes → deploy)

### Resource Allocation

**Backend Engineers (2)**:

- Week 1: Tasks 1-7 (foundation, use cases, tests)
- Week 3: Task 29 (AI integration test)
- Week 4: Task 39 (bug fixes), Task 41 (deployment)

**Frontend Engineers (2)**:

- Week 1-2: Tasks 8-11 (hooks, state management)
- Week 2: Tasks 12-18 (UI components, integration)
- Week 3: Tasks 20-23 (mobile gestures, responsive)
- Week 4: Tasks 31-33 (performance, error handling)

**QA Engineers (1)**:

- Week 1: Task 7 (contract tests)
- Week 2: Task 11, 19 (hook + component tests)
- Week 3: Tasks 24-30 (E2E + integration tests)
- Week 4: Task 40 (regression testing)

**Product/Design (1)**:

- Week 3: Task 33 (onboarding tooltips)
- Week 4: Tasks 34, 36, 37, 38, 42 (docs, beta, monitoring)

### Estimated Total Effort

- **Backend**: 40 hours (1 week, 2 engineers)
- **Frontend**: 80 hours (2 weeks, 2 engineers)
- **QA**: 48 hours (1.5 weeks, 1 engineer)
- **Product/Design**: 30 hours (1 week part-time)

**Total**: ~200 hours across 4 team members over 4 weeks

---

## Acceptance Criteria Mapping

### From Spec (Must Have for Release)

- [x] Task 1: Database schema verified ✅
- [ ] Tasks 12, 13, 18, 24: Create thread from message (Story 1)
- [ ] Tasks 14, 18, 25: Reply in thread (Story 2)
- [ ] Tasks 12, 18, 24: View thread history (Story 3)
- [ ] Tasks 12, 17: Thread categories with 9 defaults (Story 4)
- [ ] Tasks 17, 18: Thread sidebar UI (desktop + mobile)
- [ ] Tasks 9, 10, 30: Real-time thread updates via Socket.io
- [ ] Tasks 5, 14, 25, 29: AI mediation works in threads
- [ ] Tasks 15, 17, 26: Archive threads manually
- [ ] Task 12: Thread search within messages
- [ ] Task 23: Accessibility (keyboard navigation + screen reader)
- [ ] Tasks 22, 28: Mobile responsiveness (≥ 375px)

### Performance Benchmarks

- [ ] Task 31: Thread list load < 500ms (100 threads)
- [ ] Task 31: Thread messages load < 1s (500 messages)
- [ ] Task 30: WebSocket latency < 500ms (p95)
- [ ] Task 31: Lighthouse score ≥ 90 (Performance, Accessibility)

### Quality Gates

- [ ] Task 19: 80% unit test coverage for thread services
- [ ] Task 7: All Socket.io events tested (integration)
- [ ] Tasks 24-28: Critical user flows tested (E2E)
- [ ] Task 23: 0 axe violations (accessibility)

---

## Risk Mitigation Tasks

### Risk: State Drift (Delta Updates)

- **Mitigation**: Task 9 (reconnection logic), Task 30 (delta update tests)

### Risk: Performance Degradation (100+ Threads)

- **Mitigation**: Task 31 (performance testing), defer virtual scrolling if not needed

### Risk: AI Context Confusion

- **Mitigation**: Task 5 (careful context enrichment), Task 29 (integration tests)

### Risk: Thread Overload (Too Many Threads)

- **Mitigation**: Task 33 (onboarding tooltips), Task 42 (monitor adoption patterns)

### Risk: Mobile Gesture Accidents

- **Mitigation**: Task 21 (undo toast), Task 28 (gesture testing)

---

## Next Steps for Execution

1. **Assign Tasks**: Distribute tasks to team members based on skill areas
2. **Set Up Kanban Board**: Use GitHub Projects or Jira with task cards
3. **Daily Standups**: Track progress, blockers, dependencies
4. **Code Review**: All PRs reviewed by 2 team members before merge
5. **Continuous Deployment**: Deploy to staging after each phase
6. **Beta Testing**: Schedule week 4 for beta period
7. **Launch Preparation**: Coordinate deployment, announcement, support

---

**Task Generation Completed By**: tasks-agent
**Date**: 2025-12-29
**Status**: ✅ Ready for Team Assignment & Execution
**Constitutional Compliance**: All tasks follow TDD, Library-First, Contract-First principles
