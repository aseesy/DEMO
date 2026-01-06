# Threading Feature Integration Plan

**Feature**: Frontend and Backend Integration for Threading Features  
**Date**: 2025-01-05  
**Status**: Planning Phase

## Overview

This plan covers the integration of three new threading features into the frontend React application:
1. **Reply in Thread** - Send messages directly in threads
2. **Move Message to Thread** - Move messages between threads or to main chat
3. **Archive Thread** - Archive/unarchive threads with cascade support

**Backend Status**: ✅ Complete and tested (23/23 unit tests passing)  
**Frontend Status**: ⚠️ Integration needed

---

## Architecture Context

### Frontend Patterns

**Service Layer Pattern**:
- Services are singletons with subscription-based state management
- Services subscribe to socket events via `socketService.subscribe()`
- Services expose methods that emit socket events via `socketService.emit()`
- React hooks subscribe to service state changes

**Example Pattern** (from `ThreadService.js`):
```javascript
class ThreadService {
  setupSubscriptions() {
    socketService.subscribe('threads_list', this.handleThreads.bind(this));
    socketService.subscribe('thread_created', this.handleThreadCreated.bind(this));
  }
  
  create(roomId, title, messageId, category) {
    socketService.emit('create_thread', { roomId, title, messageId, category });
  }
}
```

**Socket Service**:
- Located at `chat-client-vite/src/services/socket/SocketService.v2.js`
- Provides `subscribe(event, callback)` and `emit(event, data)` methods
- Handles connection lifecycle and event routing

**React Hook Pattern**:
- Hooks subscribe to service state
- Expose service methods as callbacks
- Return state and methods for components

---

## Implementation Plan

### Phase 1: Update ThreadService (Backend Integration)

#### 1.1 Add New Methods to ThreadService

**File**: `chat-client-vite/src/services/chat/ThreadService.js`

**Changes**:
```javascript
/**
 * Reply in thread
 */
replyInThread(threadId, text, messageData = {}) {
  socketService.emit('reply_in_thread', { threadId, text, messageData });
}

/**
 * Move message to thread
 */
moveMessageToThread(messageId, targetThreadId, roomId) {
  socketService.emit('move_message_to_thread', { 
    messageId, 
    targetThreadId, 
    roomId 
  });
}

/**
 * Archive/unarchive thread
 */
archiveThread(threadId, archived = true, cascade = true) {
  socketService.emit('archive_thread', { threadId, archived, cascade });
}
```

**Estimated Time**: 15 minutes

---

#### 1.2 Add Event Listeners

**File**: `chat-client-vite/src/services/chat/ThreadService.js`

**Changes to `setupSubscriptions()`**:
```javascript
setupSubscriptions() {
  // Existing subscriptions...
  socketService.subscribe('threads_list', this.handleThreads.bind(this));
  socketService.subscribe('thread_created', this.handleThreadCreated.bind(this));
  socketService.subscribe('thread_messages', this.handleThreadMessages.bind(this));
  socketService.subscribe('conversation_analysis_complete', this.handleAnalysisComplete.bind(this));
  socketService.subscribe('disconnect', this.handleDisconnect.bind(this));
  
  // NEW: Add subscriptions for new events
  socketService.subscribe('reply_in_thread_success', this.handleReplySuccess.bind(this));
  socketService.subscribe('message_moved_to_thread_success', this.handleMoveSuccess.bind(this));
  socketService.subscribe('thread_archived', this.handleThreadArchived.bind(this));
  socketService.subscribe('thread_archived_success', this.handleArchiveSuccess.bind(this));
  socketService.subscribe('thread_message_count_changed', this.handleMessageCountChanged.bind(this));
}
```

**New Handler Methods**:
```javascript
handleReplySuccess(data) {
  // { threadId, messageId }
  // Message will arrive via 'new_message' event
  // Thread count will update via 'thread_message_count_changed'
  // No state update needed - handled by existing handlers
}

handleMoveSuccess(data) {
  // { messageId, oldThreadId, newThreadId, affectedThreads }
  // Update thread counts in local state
  // Remove message from old thread messages if loaded
  // Add message to new thread messages if loaded
  this.updateThreadCounts(data.affectedThreads);
  this.moveMessageInState(data.messageId, data.oldThreadId, data.newThreadId);
}

handleThreadArchived(data) {
  // { threadId, archived, cascade, affectedThreadIds }
  // Update archived state for all affected threads
  this.updateArchivedState(data.affectedThreadIds, data.archived);
}

handleArchiveSuccess(data) {
  // { threadId, archived }
  // Confirmation - state already updated by handleThreadArchived
  // Could show toast notification here
}

handleMessageCountChanged(data) {
  // { threadId, messageCount, lastMessageAt }
  // Update thread's message_count in local state
  this.updateThreadMessageCount(data.threadId, data.messageCount, data.lastMessageAt);
}
```

**Helper Methods**:
```javascript
updateThreadCounts(affectedThreads) {
  this.threads = this.threads.map(thread => {
    const affected = affectedThreads.find(a => a.threadId === thread.id);
    if (affected) {
      return { ...thread, message_count: affected.messageCount };
    }
    return thread;
  });
  this.notify();
}

moveMessageInState(messageId, oldThreadId, newThreadId) {
  // Remove from old thread messages
  if (oldThreadId && this.threadMessages[oldThreadId]) {
    this.threadMessages[oldThreadId] = this.threadMessages[oldThreadId].filter(
      msg => msg.id !== messageId
    );
  }
  
  // Add to new thread messages (if loaded)
  // Note: Message will arrive via 'new_message' event, but we need to update thread_id
  if (newThreadId && this.threadMessages[newThreadId]) {
    // Message will be added by new_message handler, but we need to ensure it has correct thread_id
    // This is handled by the message handler checking thread context
  }
  
  this.notify();
}

updateArchivedState(threadIds, archived) {
  this.threads = this.threads.map(thread => {
    if (threadIds.includes(thread.id)) {
      return { ...thread, is_archived: archived ? 1 : 0 };
    }
    return thread;
  });
  this.notify();
}

updateThreadMessageCount(threadId, messageCount, lastMessageAt) {
  this.threads = this.threads.map(thread => {
    if (thread.id === threadId) {
      return { 
        ...thread, 
        message_count: messageCount,
        last_message_at: lastMessageAt 
      };
    }
    return thread;
  });
  this.notify();
}
```

**Estimated Time**: 45 minutes

---

#### 1.3 Update useThreads Hook

**File**: `chat-client-vite/src/hooks/chat/useThreads.js`

**Changes**:
```javascript
const replyInThread = useCallback(
  (threadId, text, messageData) => threadService.replyInThread(threadId, text, messageData),
  []
);

const moveMessageToThread = useCallback(
  (messageId, targetThreadId, roomId) => 
    threadService.moveMessageToThread(messageId, targetThreadId, roomId),
  []
);

const archiveThread = useCallback(
  (threadId, archived, cascade) => 
    threadService.archiveThread(threadId, archived, cascade),
  []
);

return {
  ...state,
  create,
  loadThreads,
  loadThreadMessages,
  addToThread,
  replyInThread,        // NEW
  moveMessageToThread,  // NEW
  archiveThread,        // NEW
  clear,
};
```

**Estimated Time**: 10 minutes

---

### Phase 2: UI Components

#### 2.1 Reply in Thread Component

**File**: `chat-client-vite/src/features/chat/components/ThreadReplyInput.jsx` (NEW)

**Purpose**: Input field for replying directly in a thread

**Design**:
- Appears when a thread is selected
- Similar to main message input but contextually placed
- Shows thread title/context
- Sends via `replyInThread` method

**Implementation**:
```javascript
export function ThreadReplyInput({ threadId, threadTitle, replyInThread, username }) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    try {
      replyInThread(threadId, text.trim());
      setText('');
    } catch (error) {
      console.error('Error replying in thread:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 bg-white">
      <div className="text-xs text-gray-500 mb-2">
        Replying in: <span className="font-semibold">{threadTitle}</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply in thread..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-medium"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!text.trim() || isSending}
          className="px-4 py-2 bg-teal-medium text-white rounded-lg hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
```

**Integration Point**: Add to `ChatPage.jsx` when `selectedThreadId` is set

**Estimated Time**: 30 minutes

---

#### 2.2 Move Message Menu Component

**File**: `chat-client-vite/src/features/chat/components/MoveMessageMenu.jsx` (NEW)

**Purpose**: Context menu/dropdown for moving messages to threads

**Design**:
- Dropdown menu with list of threads
- Option to move to main chat
- Shows current thread if message is already in a thread

**Implementation**:
```javascript
export function MoveMessageMenu({ 
  messageId, 
  currentThreadId, 
  threads, 
  roomId,
  moveMessageToThread,
  onClose 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleMove = (targetThreadId) => {
    moveMessageToThread(messageId, targetThreadId, roomId);
    setIsOpen(false);
    onClose?.();
  };
  
  // Filter out archived threads
  const availableThreads = threads.filter(t => !t.is_archived);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-400 hover:text-teal-500"
        title="Move to thread"
      >
        📦
      </button>
      
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-700 mb-2 px-2">
              Move to thread:
            </div>
            
            {/* Option: Main chat */}
            <button
              onClick={() => handleMove(null)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
            >
              💬 Main Chat
            </button>
            
            {/* Thread options */}
            {availableThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => handleMove(thread.id)}
                disabled={thread.id === currentThreadId}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${
                  thread.id === currentThreadId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {thread.title} ({thread.message_count} msgs)
              </button>
            ))}
            
            {availableThreads.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">
                No threads available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Integration Point**: Add to message actions in `MessagesContainer.jsx`

**Estimated Time**: 45 minutes

---

#### 2.3 Archive Thread Button

**File**: Update `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`

**Changes**:
- Add archive button to each thread item
- Show archived state visually
- Add filter for archived threads

**Implementation**:
```javascript
// Add to thread item button
<button
  key={thread.id}
  type="button"
  onClick={(e) => {
    // Prevent thread selection when clicking archive button
    if (e.target.closest('.archive-button')) return;
    
    setSelectedThreadId(thread.id === selectedThreadId ? null : thread.id);
    if (thread.id !== selectedThreadId) getThreadMessages(thread.id);
  }}
  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-teal-lightest transition-colors ${indentClass} ${
    selectedThreadId === thread.id
      ? 'bg-teal-lightest border-l-4 border-l-teal-medium'
      : ''
  } ${thread.is_archived ? 'opacity-60' : ''}`}
>
  {/* ... existing content ... */}
  
  {/* Archive button */}
  <div className="flex items-center justify-between mt-2">
    <div className="flex items-center gap-2">
      {thread.category && <CategoryBadge category={thread.category} />}
      {thread.is_archived && (
        <span className="text-xs text-gray-400">📦 Archived</span>
      )}
    </div>
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-500 font-medium">
        {thread.message_count || 0} msgs
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          archiveThread(thread.id, !thread.is_archived, true);
        }}
        className="archive-button text-xs text-gray-400 hover:text-teal-500 p-1"
        title={thread.is_archived ? 'Unarchive thread' : 'Archive thread'}
      >
        {thread.is_archived ? '📦' : '📦'}
      </button>
    </div>
  </div>
</button>
```

**Add Archive Filter**:
```javascript
const [showArchived, setShowArchived] = useState(false);

// Filter threads
const displayThreads = useMemo(() => {
  let filtered = threads;
  
  // Filter by archive status
  if (!showArchived) {
    filtered = filtered.filter(t => !t.is_archived);
  }
  
  // Filter by category
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === categoryFilter);
  }
  
  return organizeThreadHierarchy(filtered);
}, [threads, categoryFilter, showArchived]);
```

**Estimated Time**: 30 minutes

---

#### 2.4 Update MessagesContainer for Move Action

**File**: `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`

**Changes**:
- Import `MoveMessageMenu` component
- Add move button next to existing "Add to thread" button
- Pass `moveMessageToThread` and `roomId` props

**Implementation**:
```javascript
import { MoveMessageMenu } from './MoveMessageMenu.jsx';

// In message actions section:
{threads.length > 0 && (
  <>
    <button
      onClick={() => addToThread(msg)}
      className="text-xs text-gray-400 hover:text-teal-500"
      title="Add to thread"
    >
      💬
    </button>
    <MoveMessageMenu
      messageId={msg.id}
      currentThreadId={msg.threadId}
      threads={threads}
      roomId={room?.roomId}
      moveMessageToThread={moveMessageToThread}
    />
  </>
)}
```

**Estimated Time**: 15 minutes

---

#### 2.5 Update ChatPage for Thread Reply Input

**File**: `chat-client-vite/src/features/chat/ChatPage.jsx`

**Changes**:
- Import `ThreadReplyInput` component
- Add component when thread is selected
- Pass required props from `useThreads` hook

**Implementation**:
```javascript
import { ThreadReplyInput } from './components/ThreadReplyInput.jsx';

// In ChatPage component, get new methods from useThreads:
const {
  // ... existing ...
  replyInThread,
  moveMessageToThread,
  archiveThread,
} = useThreads();

// Find selected thread
const selectedThread = selectedThreadId 
  ? threads.find(t => t.id === selectedThreadId) 
  : null;

// In JSX, replace or augment MessageInput:
{selectedThreadId && selectedThread ? (
  <ThreadReplyInput
    threadId={selectedThreadId}
    threadTitle={selectedThread.title}
    replyInThread={replyInThread}
    username={username}
  />
) : (
  <MessageInput
    // ... existing props ...
  />
)}
```

**Estimated Time**: 20 minutes

---

### Phase 3: Update ChatContext

#### 3.1 Expose New Methods

**File**: `chat-client-vite/src/features/chat/context/ChatContext.jsx`

**Changes**:
- Get new methods from `useThreads` hook
- Pass to components via context

**Implementation**:
```javascript
const {
  // ... existing thread state ...
  replyInThread,
  moveMessageToThread,
  archiveThread,
} = useThreads();

// Add to context value
return (
  <ChatContext.Provider
    value={{
      // ... existing values ...
      replyInThread,
      moveMessageToThread,
      archiveThread,
    }}
  >
    {children}
  </ChatContext.Provider>
);
```

**Estimated Time**: 10 minutes

---

### Phase 4: Pagination Support

#### 4.1 Update loadThreadMessages for Pagination

**File**: `chat-client-vite/src/services/chat/ThreadService.js`

**Changes**:
- Update `loadThreadMessages` to accept limit/offset
- Handle pagination in state
- Append messages when loading more

**Implementation**:
```javascript
loadThreadMessages(threadId, limit = 50, offset = 0) {
  this.isLoading = true;
  this.notify();
  
  socketService.emit('get_thread_messages', { threadId, limit, offset });
}

handleThreadMessages(data) {
  this.isLoading = false;
  
  const { threadId, messages, limit, offset } = data;
  
  if (offset === 0) {
    // First page - replace messages
    this.threadMessages[threadId] = messages;
  } else {
    // Subsequent pages - append messages
    const existing = this.threadMessages[threadId] || [];
    this.threadMessages[threadId] = [...existing, ...messages];
  }
  
  this.notify();
}
```

**Update useThreads hook**:
```javascript
const loadThreadMessages = useCallback(
  (threadId, limit, offset) => threadService.loadThreadMessages(threadId, limit, offset),
  []
);
```

**Estimated Time**: 20 minutes

---

### Phase 5: Testing

#### 5.1 Unit Tests for ThreadService

**File**: `chat-client-vite/src/services/chat/__tests__/ThreadService.test.js` (NEW)

**Test Cases**:
- `replyInThread` emits correct event
- `moveMessageToThread` emits correct event
- `archiveThread` emits correct event
- Event handlers update state correctly
- Thread count updates work
- Message movement updates state

**Estimated Time**: 60 minutes

---

#### 5.2 Integration Tests

**File**: `chat-client-vite/src/features/chat/__tests__/threading.integration.test.js` (NEW)

**Test Cases**:
- Reply in thread flow (emit → receive → state update)
- Move message flow (emit → receive → state update)
- Archive thread flow (emit → receive → state update)
- Real-time updates from other users
- Error handling

**Estimated Time**: 90 minutes

---

#### 5.3 E2E Tests

**File**: `chat-client-vite/src/__tests__/e2e/threading.e2e.test.js` (NEW)

**Test Cases**:
- User can reply in thread
- User can move message between threads
- User can archive thread
- Archived threads are filtered
- Thread counts update in real-time
- Pagination works for thread messages

**Estimated Time**: 120 minutes

---

## Implementation Timeline

### Week 1: Core Integration

**Day 1-2**: Phase 1 (ThreadService Updates)
- Update ThreadService with new methods
- Add event listeners
- Update useThreads hook
- **Deliverable**: Backend integration complete

**Day 3-4**: Phase 2 (UI Components)
- Create ThreadReplyInput component
- Create MoveMessageMenu component
- Update ThreadsSidebar with archive button
- **Deliverable**: UI components ready

**Day 5**: Phase 3-4 (Context & Pagination)
- Update ChatContext
- Add pagination support
- **Deliverable**: Full feature integration

### Week 2: Testing & Polish

**Day 1-2**: Phase 5 (Testing)
- Write unit tests
- Write integration tests
- Write E2E tests
- **Deliverable**: Test coverage complete

**Day 3**: Bug fixes and edge cases
- Handle error states
- Add loading states
- Improve UX
- **Deliverable**: Production-ready

**Day 4-5**: Documentation & Review
- Update component documentation
- Create user guide
- Code review
- **Deliverable**: Feature complete

---

## Dependencies

### Backend (Already Complete)
- ✅ Socket handlers implemented
- ✅ Use cases implemented
- ✅ Validation in place
- ✅ Event emissions configured

### Frontend (To Be Implemented)
- ⚠️ ThreadService methods
- ⚠️ Event listeners
- ⚠️ UI components
- ⚠️ Context updates
- ⚠️ Tests

---

## Risk Assessment

### Low Risk
- ThreadService updates (follows existing patterns)
- Event listeners (standard socket pattern)
- useThreads hook updates (simple additions)

### Medium Risk
- State management for message movement (need to handle edge cases)
- Pagination state management (append vs replace logic)
- Real-time updates coordination (multiple events)

### High Risk
- None identified

---

## Success Criteria

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
- ✅ Unit tests for ThreadService
- ✅ Integration tests for socket events
- ✅ E2E tests for user flows
- ✅ Test coverage > 80%

---

## Open Questions

1. **Archive Filter UI**: Should archived threads be in a separate section or toggle?
   - **Decision**: Toggle filter (show/hide archived) - simpler UX

2. **Move Message UX**: Should it be a dropdown or modal?
   - **Decision**: Dropdown menu - faster, less intrusive

3. **Thread Reply Input**: Should it replace main input or be separate?
   - **Decision**: Replace main input when thread selected - cleaner UX

4. **Pagination Strategy**: Infinite scroll or "Load More" button?
   - **Decision**: "Load More" button - more predictable, better for testing

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Implement Phase 1 (ThreadService)
3. ⏳ Implement Phase 2 (UI Components)
4. ⏳ Implement Phase 3-4 (Context & Pagination)
5. ⏳ Implement Phase 5 (Testing)
6. ⏳ Deploy and monitor

---

## Appendix: File Changes Summary

### New Files
- `chat-client-vite/src/features/chat/components/ThreadReplyInput.jsx`
- `chat-client-vite/src/features/chat/components/MoveMessageMenu.jsx`
- `chat-client-vite/src/services/chat/__tests__/ThreadService.test.js`
- `chat-client-vite/src/features/chat/__tests__/threading.integration.test.js`
- `chat-client-vite/src/__tests__/e2e/threading.e2e.test.js`

### Modified Files
- `chat-client-vite/src/services/chat/ThreadService.js`
- `chat-client-vite/src/hooks/chat/useThreads.js`
- `chat-client-vite/src/features/chat/components/ThreadsSidebar.jsx`
- `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`
- `chat-client-vite/src/features/chat/ChatPage.jsx`
- `chat-client-vite/src/features/chat/context/ChatContext.jsx`

---

**Total Estimated Time**: ~12-15 hours of development + 4-5 hours of testing = **16-20 hours**

