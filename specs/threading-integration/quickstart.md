# Threading Integration Quickstart Guide

## Overview

This guide provides step-by-step instructions for implementing the threading feature integration between frontend and backend.

## Prerequisites

- ✅ Backend threading features complete and tested
- ✅ Frontend React application running
- ✅ Socket connection established
- ✅ User authenticated and in a room

## Implementation Steps

### Step 1: Update ThreadService (30 minutes)

1. Open `chat-client-vite/src/services/chat/ThreadService.js`
2. Add three new methods:
   - `replyInThread(threadId, text, messageData)`
   - `moveMessageToThread(messageId, targetThreadId, roomId)`
   - `archiveThread(threadId, archived, cascade)`
3. Add event subscriptions in `setupSubscriptions()`
4. Add handler methods for new events
5. Add helper methods for state updates

**Test**: Verify methods emit correct socket events in browser console

---

### Step 2: Update useThreads Hook (10 minutes)

1. Open `chat-client-vite/src/hooks/chat/useThreads.js`
2. Add three new callbacks using `useCallback`
3. Export in return object

**Test**: Verify hooks expose new methods

---

### Step 3: Create ThreadReplyInput Component (30 minutes)

1. Create `chat-client-vite/src/features/chat/components/ThreadReplyInput.jsx`
2. Implement form with input and submit button
3. Show thread context
4. Call `replyInThread` on submit

**Test**: Component renders and submits correctly

---

### Step 4: Create MoveMessageMenu Component (45 minutes)

1. Create `chat-client-vite/src/features/chat/components/MoveMessageMenu.jsx`
2. Implement dropdown menu
3. List available threads
4. Include "Main Chat" option
5. Call `moveMessageToThread` on selection

**Test**: Menu opens, shows threads, moves message

---

### Step 5: Update ThreadsSidebar (30 minutes)

1. Open `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`
2. Add archive button to each thread
3. Add archive filter toggle
4. Show archived state visually
5. Call `archiveThread` on button click

**Test**: Archive button works, threads update state

---

### Step 6: Update MessagesContainer (15 minutes)

1. Open `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`
2. Import `MoveMessageMenu`
3. Add move button next to "Add to thread" button
4. Pass required props

**Test**: Move button appears and works

---

### Step 7: Update ChatPage (20 minutes)

1. Open `chat-client-vite/src/features/chat/ChatPage.jsx`
2. Import `ThreadReplyInput`
3. Get new methods from `useThreads`
4. Conditionally render `ThreadReplyInput` when thread selected
5. Pass required props

**Test**: Reply input appears when thread selected

---

### Step 8: Update ChatContext (10 minutes)

1. Open `chat-client-vite/src/features/chat/context/ChatContext.jsx`
2. Get new methods from `useThreads`
3. Add to context provider value

**Test**: Methods available in components

---

### Step 9: Add Pagination Support (20 minutes)

1. Update `ThreadService.loadThreadMessages` to accept limit/offset
2. Update `handleThreadMessages` to append vs replace
3. Update `useThreads` hook signature

**Test**: Pagination works for thread messages

---

### Step 10: Write Tests (3 hours)

1. Unit tests for ThreadService
2. Integration tests for socket events
3. E2E tests for user flows

**Test**: All tests passing

---

## Testing Checklist

### Manual Testing

- [ ] Reply in thread creates message in correct thread
- [ ] Reply updates thread message count
- [ ] Move message updates both thread counts
- [ ] Archive thread hides from active list
- [ ] Unarchive thread shows in active list
- [ ] Cascade archive works for sub-threads
- [ ] Pagination loads more messages
- [ ] Real-time updates work (test with two browsers)
- [ ] Error handling shows user-friendly messages
- [ ] Loading states appear during operations

### Automated Testing

- [ ] ThreadService unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Linter passes

---

## Common Issues & Solutions

### Issue: Socket events not received
**Solution**: Check `socketService.subscribe()` is called in `setupSubscriptions()`

### Issue: State not updating
**Solution**: Ensure `this.notify()` is called after state changes

### Issue: Messages not appearing in thread
**Solution**: Check `new_message` handler includes thread context

### Issue: Thread count not updating
**Solution**: Verify `thread_message_count_changed` handler updates state

---

## Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] User guide created
- [ ] Feature flag (if needed)
- [ ] Monitoring set up

---

## Rollback Plan

If issues arise:
1. Revert ThreadService changes
2. Remove new UI components
3. Restore previous ChatPage
4. Deploy previous version

---

## Support

For questions or issues:
- Check `BROWSER_TEST_SCRIPT.md` for debugging
- Review `THREADING_IMPROVEMENTS_SUMMARY.md` for backend details
- Check console logs for socket events

