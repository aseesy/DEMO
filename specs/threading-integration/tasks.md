# Threading Integration Task List

**Feature**: Frontend and Backend Integration for Threading Features  
**Generated**: 2025-01-05  
**Status**: Ready for Execution

## Task Summary

- **Total Tasks**: 19
- **Sequential Tasks**: 8
- **Parallel Tasks**: 11 (marked with [P])
- **Estimated Time**: 16-20 hours
- **Dependencies**: Backend complete ✅

---

## Phase 1: Foundation Layer [Sequential]

### Task 1: Add New Methods to ThreadService
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: None  
**Estimated Time**: 15 minutes

**Acceptance Criteria**:
- [ ] `replyInThread(threadId, text, messageData)` method added
- [ ] `moveMessageToThread(messageId, targetThreadId, roomId)` method added
- [ ] `archiveThread(threadId, archived, cascade)` method added
- [ ] All methods emit correct socket events via `socketService.emit()`
- [ ] Methods follow existing ThreadService patterns

**Implementation Notes**:
- Add methods after existing `addToThread` method
- Use same JSDoc style as existing methods
- Verify socket events match backend contracts in `data-model.md`

---

### Task 2: Add Event Subscriptions to ThreadService
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 1  
**Estimated Time**: 20 minutes

**Acceptance Criteria**:
- [ ] `reply_in_thread_success` subscription added
- [ ] `message_moved_to_thread_success` subscription added
- [ ] `thread_archived` subscription added
- [ ] `thread_archived_success` subscription added
- [ ] `thread_message_count_changed` subscription added
- [ ] All subscriptions call bound handler methods

**Implementation Notes**:
- Add to `setupSubscriptions()` method
- Follow existing subscription pattern
- Use `.bind(this)` for handler methods

---

### Task 3: Implement Event Handler Methods
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 2  
**Estimated Time**: 25 minutes

**Acceptance Criteria**:
- [ ] `handleReplySuccess(data)` method implemented
- [ ] `handleMoveSuccess(data)` method implemented
- [ ] `handleThreadArchived(data)` method implemented
- [ ] `handleArchiveSuccess(data)` method implemented
- [ ] `handleMessageCountChanged(data)` method implemented
- [ ] All handlers call `this.notify()` after state updates

**Implementation Notes**:
- Handlers should be minimal - delegate to helper methods
- `handleReplySuccess` can be empty (handled by existing `new_message` handler)
- See implementation plan for handler logic details

---

### Task 4: Implement State Update Helper Methods
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 3  
**Estimated Time**: 20 minutes

**Acceptance Criteria**:
- [ ] `updateThreadCounts(affectedThreads)` method implemented
- [ ] `moveMessageInState(messageId, oldThreadId, newThreadId)` method implemented
- [ ] `updateArchivedState(threadIds, archived)` method implemented
- [ ] `updateThreadMessageCount(threadId, messageCount, lastMessageAt)` method implemented
- [ ] All helpers call `this.notify()` after state changes
- [ ] State updates are immutable (create new arrays/objects)

**Implementation Notes**:
- Use `.map()` for immutable updates
- Filter messages when removing from old thread
- See implementation plan for detailed logic

---

### Task 5: Update useThreads Hook
**File**: `chat-client-vite/src/hooks/chat/useThreads.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 1  
**Estimated Time**: 10 minutes

**Acceptance Criteria**:
- [ ] `replyInThread` callback added using `useCallback`
- [ ] `moveMessageToThread` callback added using `useCallback`
- [ ] `archiveThread` callback added using `useCallback`
- [ ] All callbacks exported in return object
- [ ] Callbacks have empty dependency arrays

**Implementation Notes**:
- Follow existing pattern for `create`, `loadThreads`, etc.
- Use `useCallback` to prevent unnecessary re-renders

---

### Task 6: Update ChatContext to Expose New Methods
**File**: `chat-client-vite/src/features/chat/context/ChatContext.jsx`  
**Agent**: frontend-specialist  
**Depends on**: Task 5  
**Estimated Time**: 10 minutes

**Acceptance Criteria**:
- [ ] `replyInThread` destructured from `useThreads()`
- [ ] `moveMessageToThread` destructured from `useThreads()`
- [ ] `archiveThread` destructured from `useThreads()`
- [ ] All methods added to context provider value
- [ ] Methods available to all consuming components

**Implementation Notes**:
- Add to existing context value object
- No breaking changes to existing context shape

---

## Phase 2: UI Components [Parallel After Phase 1]

### Task 7: [P] Create ThreadReplyInput Component
**File**: `chat-client-vite/src/features/chat/components/ThreadReplyInput.jsx` (NEW)  
**Agent**: ui-designer  
**Depends on**: Task 6  
**Estimated Time**: 30 minutes

**Acceptance Criteria**:
- [ ] Component accepts `threadId`, `threadTitle`, `replyInThread`, `username` props
- [ ] Form with input field and submit button
- [ ] Shows thread context ("Replying in: [thread title]")
- [ ] Calls `replyInThread` on form submit
- [ ] Handles loading state (`isSending`)
- [ ] Clears input after successful submit
- [ ] Disables submit when input is empty or sending
- [ ] Matches existing design system (teal colors, rounded corners)

**Implementation Notes**:
- Use existing Tailwind classes from `MessageInput` component
- Follow form submission pattern from main message input
- See implementation plan for full component code

---

### Task 8: [P] Create MoveMessageMenu Component
**File**: `chat-client-vite/src/features/chat/components/MoveMessageMenu.jsx` (NEW)  
**Agent**: ui-designer  
**Depends on**: Task 6  
**Estimated Time**: 45 minutes

**Acceptance Criteria**:
- [ ] Component accepts `messageId`, `currentThreadId`, `threads`, `roomId`, `moveMessageToThread`, `onClose` props
- [ ] Dropdown menu with button trigger
- [ ] Shows "Main Chat" option (targetThreadId = null)
- [ ] Lists all available threads (filtered to exclude archived)
- [ ] Disables current thread option
- [ ] Calls `moveMessageToThread` on selection
- [ ] Closes menu after selection
- [ ] Handles empty thread list gracefully
- [ ] Proper z-index for dropdown overlay
- [ ] Click outside to close functionality

**Implementation Notes**:
- Use absolute positioning for dropdown
- Filter threads: `threads.filter(t => !t.is_archived)`
- See implementation plan for full component code

---

### Task 9: [P] Add Archive Button to ThreadsSidebar
**File**: `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`  
**Agent**: ui-designer  
**Depends on**: Task 6  
**Estimated Time**: 20 minutes

**Acceptance Criteria**:
- [ ] Archive button added to each thread item
- [ ] Button positioned in thread item footer
- [ ] Button calls `archiveThread` with correct parameters
- [ ] Button prevents thread selection when clicked (`e.stopPropagation()`)
- [ ] Button shows appropriate icon/tooltip
- [ ] Archived threads show visual indicator (opacity or badge)

**Implementation Notes**:
- Add button in thread item's action area
- Use `archiveThread(thread.id, !thread.is_archived, true)`
- See implementation plan for button placement

---

### Task 10: [P] Add Archive Filter to ThreadsSidebar
**File**: `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`  
**Agent**: ui-designer  
**Depends on**: Task 9  
**Estimated Time**: 10 minutes

**Acceptance Criteria**:
- [ ] `showArchived` state added
- [ ] Toggle button/checkbox for showing archived threads
- [ ] `displayThreads` useMemo updated to filter by `showArchived`
- [ ] Archived threads hidden by default
- [ ] Filter works with existing category filter

**Implementation Notes**:
- Add filter after category filter in header
- Update `displayThreads` useMemo dependencies
- Filter: `filtered.filter(t => showArchived || !t.is_archived)`

---

### Task 11: [P] Integrate MoveMessageMenu into MessagesContainer
**File**: `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`  
**Agent**: frontend-specialist  
**Depends on**: Task 8, Task 6  
**Estimated Time**: 15 minutes

**Acceptance Criteria**:
- [ ] `MoveMessageMenu` imported
- [ ] Move button added next to "Add to thread" button
- [ ] `moveMessageToThread` prop passed from context
- [ ] `roomId` prop passed (from `room?.roomId`)
- [ ] `currentThreadId` passed from `msg.threadId`
- [ ] Button only shows when threads exist

**Implementation Notes**:
- Add in message actions section (same area as flag and add-to-thread buttons)
- Use same styling pattern as existing action buttons

---

### Task 12: [P] Integrate ThreadReplyInput into ChatPage
**File**: `chat-client-vite/src/features/chat/ChatPage.jsx`  
**Agent**: frontend-specialist  
**Depends on**: Task 7, Task 6  
**Estimated Time**: 20 minutes

**Acceptance Criteria**:
- [ ] `ThreadReplyInput` imported
- [ ] `replyInThread` destructured from `useThreads()`
- [ ] `selectedThread` found from `threads` array
- [ ] Conditional rendering: `ThreadReplyInput` when thread selected, `MessageInput` otherwise
- [ ] All required props passed to `ThreadReplyInput`
- [ ] No breaking changes to existing MessageInput usage

**Implementation Notes**:
- Replace or conditionally render MessageInput
- Find selected thread: `threads.find(t => t.id === selectedThreadId)`
- See implementation plan for conditional rendering pattern

---

## Phase 3: Pagination Support [Parallel]

### Task 13: [P] Update loadThreadMessages for Pagination
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 4  
**Estimated Time**: 15 minutes

**Acceptance Criteria**:
- [ ] `loadThreadMessages` accepts `limit` and `offset` parameters
- [ ] Default values: `limit = 50`, `offset = 0`
- [ ] Method emits `get_thread_messages` with pagination params
- [ ] `isLoading` state set correctly

**Implementation Notes**:
- Update method signature: `loadThreadMessages(threadId, limit = 50, offset = 0)`
- Emit: `socketService.emit('get_thread_messages', { threadId, limit, offset })`

---

### Task 14: [P] Update handleThreadMessages for Pagination
**File**: `chat-client-vite/src/services/chat/ThreadService.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 13  
**Estimated Time**: 10 minutes

**Acceptance Criteria**:
- [ ] `handleThreadMessages` extracts `limit` and `offset` from data
- [ ] When `offset === 0`: replace messages (first page)
- [ ] When `offset > 0`: append messages (subsequent pages)
- [ ] State updates are immutable

**Implementation Notes**:
- Check `data.offset` to determine replace vs append
- Replace: `this.threadMessages[threadId] = messages`
- Append: `this.threadMessages[threadId] = [...existing, ...messages]`

---

### Task 15: [P] Update useThreads Hook for Pagination
**File**: `chat-client-vite/src/hooks/chat/useThreads.js`  
**Agent**: frontend-specialist  
**Depends on**: Task 14  
**Estimated Time**: 5 minutes

**Acceptance Criteria**:
- [ ] `loadThreadMessages` callback updated to accept `limit` and `offset`
- [ ] Parameters passed through to `threadService.loadThreadMessages`
- [ ] Backward compatible (defaults work if not provided)

**Implementation Notes**:
- Update callback: `(threadId, limit, offset) => threadService.loadThreadMessages(threadId, limit, offset)`
- Components can call with or without pagination params

---

## Phase 4: Testing [Sequential After Implementation]

### Task 16: Write ThreadService Unit Tests
**File**: `chat-client-vite/src/services/chat/__tests__/ThreadService.test.js` (NEW)  
**Agent**: testing-specialist  
**Depends on**: Task 4, Task 14  
**Estimated Time**: 60 minutes

**Acceptance Criteria**:
- [ ] Test: `replyInThread` emits correct socket event
- [ ] Test: `moveMessageToThread` emits correct socket event
- [ ] Test: `archiveThread` emits correct socket event
- [ ] Test: `handleMoveSuccess` updates thread counts
- [ ] Test: `handleThreadArchived` updates archived state
- [ ] Test: `handleMessageCountChanged` updates message count
- [ ] Test: `moveMessageInState` removes from old thread, adds to new
- [ ] Test: Pagination replaces on offset 0, appends on offset > 0
- [ ] All tests use mocks for `socketService`
- [ ] Test coverage > 80% for new methods

**Implementation Notes**:
- Mock `socketService` using Jest
- Test state updates using `getState()`
- Verify `notify()` is called after state changes

---

### Task 17: Write Integration Tests
**File**: `chat-client-vite/src/features/chat/__tests__/threading.integration.test.js` (NEW)  
**Agent**: testing-specialist  
**Depends on**: Task 12, Task 11  
**Estimated Time**: 90 minutes

**Acceptance Criteria**:
- [ ] Test: Reply in thread flow (emit → receive → state update)
- [ ] Test: Move message flow (emit → receive → state update)
- [ ] Test: Archive thread flow (emit → receive → state update)
- [ ] Test: Real-time updates from other users (broadcast events)
- [ ] Test: Error handling (invalid threadId, archived thread, etc.)
- [ ] Test: Thread count updates in real-time
- [ ] Test: Message movement updates both thread states
- [ ] All tests use real socket service (or mocked socket.io-client)

**Implementation Notes**:
- Test full flow from user action to state update
- Mock socket events to simulate server responses
- Verify UI updates correctly

---

### Task 18: Write E2E Tests
**File**: `chat-client-vite/src/__tests__/e2e/threading.e2e.test.js` (NEW)  
**Agent**: testing-specialist  
**Depends on**: Task 17  
**Estimated Time**: 120 minutes

**Acceptance Criteria**:
- [ ] Test: User can reply in thread (full user flow)
- [ ] Test: User can move message between threads
- [ ] Test: User can move message to main chat
- [ ] Test: User can archive thread
- [ ] Test: User can unarchive thread
- [ ] Test: Archived threads are filtered/hidden
- [ ] Test: Thread counts update in real-time
- [ ] Test: Pagination loads more messages
- [ ] Test: Cascade archive works for sub-threads
- [ ] All tests use Playwright or Cypress
- [ ] Tests run in headless browser

**Implementation Notes**:
- Use E2E testing framework (Playwright recommended)
- Test actual user interactions (click, type, submit)
- Verify UI state changes
- Test with real backend (or fully mocked)

---

## Phase 5: Documentation & Polish [Sequential]

### Task 19: Update Documentation and Code Review
**File**: Multiple  
**Agent**: product-manager  
**Depends on**: Task 18  
**Estimated Time**: 30 minutes

**Acceptance Criteria**:
- [ ] Component documentation updated (JSDoc comments)
- [ ] README updated with new features
- [ ] User guide created (if needed)
- [ ] Code review completed
- [ ] All TODOs resolved
- [ ] No console warnings/errors
- [ ] Linter passes
- [ ] TypeScript types correct (if using TS)

**Implementation Notes**:
- Add JSDoc to all new methods and components
- Document props interfaces
- Update feature list in main README

---

## Dependency Graph

```
Phase 1 (Sequential):
Task 1 → Task 2 → Task 3 → Task 4
Task 1 → Task 5 → Task 6

Phase 2 (Parallel after Phase 1):
Task 6 → Task 7 [P]
Task 6 → Task 8 [P]
Task 6 → Task 9 → Task 10 [P]
Task 6 + Task 8 → Task 11 [P]
Task 6 + Task 7 → Task 12 [P]

Phase 3 (Parallel):
Task 4 → Task 13 → Task 14 → Task 15 [P]

Phase 4 (Sequential after Implementation):
Task 4 + Task 14 → Task 16
Task 12 + Task 11 → Task 17
Task 17 → Task 18

Phase 5 (Final):
Task 18 → Task 19
```

## Parallel Execution Opportunities

**After Task 6 completes**, these can run in parallel:
- Tasks 7, 8, 9, 10, 11, 12, 13, 14, 15 (all UI and pagination work)

**After Phase 2-3 complete**, these can run in parallel:
- Task 16 (unit tests) can start while integration tests are being written

## Agent Assignment Recommendations

- **frontend-specialist**: Tasks 1-6, 11-15 (Service layer, hooks, context, integration)
- **ui-designer**: Tasks 7-10 (UI components, styling, UX)
- **testing-specialist**: Tasks 16-18 (All testing)
- **product-manager**: Task 19 (Documentation, review)

## Critical Path

**Longest path to completion**:
Task 1 → Task 2 → Task 3 → Task 4 → Task 6 → Task 12 → Task 17 → Task 18 → Task 19

**Estimated Critical Path Time**: ~8-10 hours

## Risk Mitigation

### High Priority Risks
1. **State Management Complexity** (Task 4)
   - Mitigation: Follow existing patterns, test thoroughly
   - Review: Have frontend-specialist review before proceeding

2. **Real-time Update Coordination** (Task 3, Task 4)
   - Mitigation: Test with multiple simultaneous events
   - Review: Integration tests should cover this

3. **UI Component Integration** (Task 11, Task 12)
   - Mitigation: Test in isolation first, then integrate
   - Review: UI-designer should review component placement

## Acceptance Criteria Summary

### Functional Requirements
- ✅ Users can reply directly in threads
- ✅ Users can move messages between threads
- ✅ Users can archive/unarchive threads
- ✅ Thread counts update in real-time
- ✅ Pagination works for thread messages
- ✅ Archived threads are filtered/hidden

### Non-Functional Requirements
- ✅ No performance degradation
- ✅ Error handling for all operations
- ✅ Loading states for async operations
- ✅ Accessible UI components
- ✅ Responsive design maintained

### Testing Requirements
- ✅ Unit tests for ThreadService (>80% coverage)
- ✅ Integration tests for socket events
- ✅ E2E tests for user flows
- ✅ All tests passing

---

## Next Steps

1. ✅ Review task list with team
2. ⏳ Assign tasks to developers
3. ⏳ Set up development environment
4. ⏳ Begin Phase 1 (Foundation Layer)
5. ⏳ Execute parallel tasks after Phase 1
6. ⏳ Complete testing phase
7. ⏳ Finalize documentation

---

**Total Estimated Time**: 16-20 hours  
**Parallelization Potential**: ~40% of tasks can run in parallel  
**Recommended Team Size**: 2-3 developers

