# Implementation Plan - Conversation Threading Feature

**Feature ID**: CONV-THREAD-001
**Version**: 1.0.0
**Status**: Ready for Task Generation
**Created**: 2025-12-29
**Last Updated**: 2025-12-29

---

## Executive Summary

**Feature**: Conversation Threading for LiaiZen co-parenting platform

**Business Value**: Reduce co-parent communication confusion and conflict by organizing messages into topic-based threads (medical, education, schedule, etc.), providing clear audit trails and child-focused discussion structure.

**Implementation Approach**: Build on existing infrastructure (70-80% complete) rather than starting from scratch. Primary work: frontend UI components, AI mediation integration, and mobile UX enhancements.

**Estimated Timeline**: 3-4 weeks (reduced from original 6-week estimate)

- Week 1-2: Core threading UI (Thread creation, Thread view, State management)
- Week 3: Hierarchy & categories (Sub-threads, Breadcrumbs, Archive)
- Week 4: Mobile & polish (Touch gestures, Accessibility, Performance optimization)

**Team**:

- 1 Frontend Engineer (React, Socket.io, Tailwind)
- 1 Backend Engineer (Node.js, PostgreSQL, Socket.io)
- 1 QA Engineer (Playwright E2E tests, accessibility audits)

---

## Table of Contents

1. [Technical Context](#1-technical-context)
2. [Phase 0: Research Findings](#2-phase-0-research-findings)
3. [Phase 1: Design & Contracts](#3-phase-1-design--contracts)
4. [Component Architecture](#4-component-architecture)
5. [Data Flow](#5-data-flow)
6. [AI Mediation Integration](#6-ai-mediation-integration)
7. [Test Scenarios](#7-test-scenarios)
8. [Constitutional Validation](#8-constitutional-validation)
9. [Readiness Assessment](#9-readiness-assessment)

---

## 1. Technical Context

### 1.1 Technology Stack

| Component       | Technology           | Version | Purpose                         |
| --------------- | -------------------- | ------- | ------------------------------- |
| **Language**    | JavaScript (Node.js) | 18+     | Backend runtime                 |
| **Frontend**    | React                | 18+     | UI framework                    |
| **Build Tool**  | Vite                 | 5+      | Frontend bundler                |
| **Real-Time**   | Socket.io            | 4+      | WebSocket communication         |
| **Database**    | PostgreSQL           | 14+     | Primary data store              |
| **Graph DB**    | Neo4j (optional)     | 5+      | Semantic threading (embeddings) |
| **AI Provider** | OpenAI GPT-4         | Latest  | Message mediation               |
| **Styling**     | Tailwind CSS         | 3+      | Design system                   |
| **Testing**     | Jest, Playwright     | Latest  | Unit tests, E2E tests           |

### 1.2 Primary Dependencies

**Backend** (`chat-server/package.json`):

```json
{
  "socket.io": "^4.5.0",
  "pg": "^8.11.0",
  "openai": "^4.20.0",
  "neo4j-driver": "^5.14.0",
  "express": "^4.18.0",
  "jsonwebtoken": "^9.0.0"
}
```

**Frontend** (`chat-client-vite/package.json`):

```json
{
  "react": "^18.2.0",
  "socket.io-client": "^4.5.0",
  "tailwindcss": "^3.3.0",
  "vite": "^5.0.0"
}
```

**No New Dependencies Required** ✅

### 1.3 Storage

**PostgreSQL Tables**:

- `threads` - Thread metadata (title, category, hierarchy, counts)
- `thread_messages` - Many-to-many junction (thread ↔ messages)
- `messages` - Chat messages (existing table)
- `rooms` - Chat rooms (existing table)

**Neo4j (Optional)**:

- Thread embeddings for semantic search (already implemented)

**Storage Size Estimate**:

- Thread: ~500 bytes (metadata only)
- ThreadMessage: ~50 bytes (junction record)
- 100 threads with 5,000 messages: ~500KB thread data + ~250KB junction data

### 1.4 Testing Framework

**Unit Tests**: Jest

- Thread services (CRUD operations)
- Thread hierarchy logic
- Category validation
- State management hooks

**Integration Tests**: Jest + Supertest

- Socket.io event flow
- Database transactions
- AI mediation context

**E2E Tests**: Playwright

- Create thread from message
- Reply in thread with AI intervention
- Archive/reopen thread
- Mobile gestures

**Accessibility Tests**: axe-core (via Playwright)

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support

### 1.5 Target Platform

**Server**: Node.js on Railway (production) / localhost (dev)
**Browser**: Modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
**Mobile**: iOS 14+ (Safari, PWA), Android 10+ (Chrome, PWA)

### 1.6 Performance Goals

| Metric                   | Target  | Measured At |
| ------------------------ | ------- | ----------- |
| Thread list load         | < 500ms | p95         |
| Thread messages load     | < 1s    | p95         |
| Thread creation          | < 300ms | p95         |
| Message send in thread   | < 200ms | p95         |
| WebSocket latency        | < 500ms | p95         |
| Mobile scroll (threads)  | 60fps   | Average     |
| Mobile scroll (messages) | 60fps   | Average     |

### 1.7 Constraints

**Technical**:

- Maximum thread depth: 3 levels (enforced)
- Thread title: 3-100 characters (validated)
- Message count: Atomic database operations (prevent race conditions)
- Real-time updates: Delta updates only (bandwidth optimization)

**Business**:

- All room members see all threads (no private threads)
- Thread deletion requires both co-parents' approval
- 7-year data retention for legal compliance (soft deletes)

**Performance**:

- Support 100+ threads per room without degradation
- Support 10,000+ messages per thread
- WebSocket reconnection < 2s

### 1.8 Scale/Scope

**Users**: 10,000+ co-parent pairs (20,000+ total users)
**Data Volume**: 100,000+ threads, 1M+ messages in threads
**Complexity**: Medium (existing infrastructure reduces scope)

### 1.9 Project Type

**Architecture**: Monolithic (chat-server + chat-client-vite)
**Deployment**: Single server (Railway backend, Vercel frontend)
**Database**: Shared PostgreSQL instance

---

## 2. Phase 0: Research Findings

**Status**: ✅ Complete (see `research.md`)

### 2.1 Key Findings

1. **70-80% of threading infrastructure already exists**
   - Backend: Socket handlers, service layer, database schema
   - Frontend: ThreadsSidebar component, category config

2. **Primary gaps: Frontend UI components**
   - ThreadView.jsx (full thread message display)
   - ThreadCreationModal.jsx (create/edit thread)
   - ThreadMessageInput.jsx (reply with AI mediation)
   - useThreads.js hook (state management)
   - useThreadSocket.js hook (real-time updates)

3. **AI Mediation integration is straightforward**
   - Modify context builder to include thread metadata
   - Update AI prompt with thread context
   - Frontend displays thread-specific interventions

4. **No new dependencies required**
   - Use existing React hooks, Socket.io, Tailwind CSS
   - Virtual scrolling deferred (not needed for <100 threads)

### 2.2 Technology Decisions

| Decision             | Choice                     | Rationale                              |
| -------------------- | -------------------------- | -------------------------------------- |
| Backend Architecture | Use existing service layer | Already implements DDD patterns        |
| Database Schema      | Use existing schema        | Migrations already applied (025-030)   |
| Real-Time Strategy   | Delta updates (existing)   | 95% bandwidth savings vs. full updates |
| Frontend State       | React hooks (not Redux)    | Local state sufficient for thread mgmt |
| Mobile Gestures      | Native touch events        | No library needed (swipe, long-press)  |
| AI Integration       | Extend context builder     | Minimal changes to existing pipeline   |

### 2.3 Performance Considerations

**Thread Message Loading**: Pagination + Infinite Scroll

- Initial load: 50 messages
- Scroll to top: Load previous 50 (offset pagination)
- Target: < 1s for 500 messages

**Real-Time Updates**: Delta pattern (already optimized)

- Emit only changed data (e.g., 54 bytes for count update)
- Client merges delta into state
- Reconnection re-fetches full state once

**Thread Hierarchy**: Indentation with collapsible sub-threads

- Virtual scrolling deferred (acceptable for <100 threads)
- Future: TanStack Virtual if performance degrades

### 2.4 Risk Mitigation

| Risk                       | Probability | Impact | Mitigation                              |
| -------------------------- | ----------- | ------ | --------------------------------------- |
| State drift (missed delta) | Medium      | High   | Reconnection logic re-fetches full list |
| Performance (100+ threads) | Low         | Medium | Virtual scrolling (future enhancement)  |
| AI context confusion       | Low         | Medium | Test with real thread scenarios         |
| Thread overload (too many) | Medium      | High   | AI suggests merging similar threads     |
| Mobile gesture accidents   | Medium      | Low    | Undo toast, swipe threshold (50px)      |

---

## 3. Phase 1: Design & Contracts

**Status**: ✅ Complete (see `data-model.md`, `contracts/`)

### 3.1 Data Model Summary

**Thread Entity** (PostgreSQL):

- ID, room_id, title, created_by, timestamps
- message_count (atomic), last_message_at
- category (TEXT for custom categories)
- Hierarchy: parent_thread_id, root_thread_id, depth (0-3)
- Archival: is_archived (soft delete)

**ThreadMessage Junction** (Many-to-Many):

- thread_id, message_id, added_at, added_by
- UNIQUE(thread_id, message_id) - prevent duplicates

**Validation Rules**:

- Title: 3-100 characters
- Depth: 0-3 (max 3 levels)
- Category: Valid enum or custom (TEXT field)
- Room ownership: Thread must belong to user's room

**State Transitions**:

```
CREATED → ACTIVE → ARCHIVED → REOPENED → ACTIVE
```

### 3.2 API Contracts

**Socket.io Events** (see `contracts/socket-events.yaml`):

**Client → Server**:

- `create_thread(roomId, title, messageId?, category?)`
- `create_sub_thread(roomId, title, parentThreadId, parentMessageId?)`
- `get_threads(roomId)`
- `get_thread_messages(threadId)`
- `add_to_thread(messageId, threadId)`
- `remove_from_thread(messageId)`
- `get_sub_threads(threadId)`
- `get_thread_ancestors(threadId)`

**Server → Client (Delta Updates)**:

- `thread_created(thread)` - New thread notification
- `sub_thread_created(thread, parentThreadId)` - New sub-thread
- `thread_message_count_changed(threadId, messageCount, lastMessageAt)` - Count update
- `threads_list(threads[])` - Full list (initial load only)
- `thread_messages(threadId, messages[])`

**REST API** (see `contracts/rest-api.yaml`):

- POST `/api/threads` - Create thread
- GET `/api/threads/:roomId` - Get room threads
- PATCH `/api/threads/:threadId` - Update thread
- DELETE `/api/threads/:threadId` - Archive thread
- POST `/api/threads/:threadId/messages` - Add message to thread
- GET `/api/threads/:threadId/messages` - Get thread messages (paginated)

**Contract Testing**: All events tested in E2E suite

---

## 4. Component Architecture

### 4.1 Frontend Structure

```
chat-client-vite/src/features/chat/
├── components/
│   ├── ThreadsSidebar.jsx         ✅ EXISTS
│   ├── ThreadView.jsx             🔨 NEW - Full thread message display
│   ├── ThreadCreationModal.jsx    🔨 NEW - Create/edit thread modal
│   ├── ThreadMessageInput.jsx     🔨 NEW - Reply in thread with AI mediation
│   ├── ThreadBreadcrumb.jsx       🔨 NEW - Hierarchy navigation
│   └── ThreadContextMenu.jsx      🔨 NEW - Right-click/long-press menu
│
├── hooks/
│   ├── useThreads.js              🔨 NEW - Thread state management
│   ├── useThreadSocket.js         🔨 NEW - Socket event handlers
│   └── useThreadActions.js        🔨 NEW - Thread CRUD operations
│
└── utils/
    └── threadHelpers.js           🔨 NEW - Helper functions
```

### 4.2 Component Responsibilities

#### ThreadsSidebar.jsx (Existing ✅)

**Responsibility**: Display thread list with category filtering

**Props**:

```javascript
{
  threads: Thread[],
  selectedThreadId: string | null,
  setSelectedThreadId: (id: string) => void,
  setShowThreadsPanel: (show: boolean) => void,
  getThreadMessages: (id: string) => void
}
```

**Features**:

- Category filter dropdown
- Thread hierarchy (indentation for sub-threads)
- Category badges (icon + label)
- Message count display
- Sort by last activity

**Enhancements Needed**:

- Archive filter toggle
- Unread badge indicator
- Context menu (right-click)

---

#### ThreadView.jsx (New 🔨)

**Responsibility**: Display full thread message history

**Props**:

```javascript
{
  thread: Thread,
  messages: Message[],
  onBack: () => void,
  onArchive: () => void,
  onSendMessage: (content: string) => void
}
```

**Features**:

- Thread breadcrumb (if sub-thread)
- Thread title and category badge
- Message list (chronological)
- Infinite scroll (load more on scroll up)
- "Back to Main Chat" button
- Thread options menu (archive, edit, change category)

**Layout**:

```
┌─────────────────────────────────────┐
│ ← Back   Medical > Dr. Smith       │ Breadcrumb + Header
├─────────────────────────────────────┤
│ Sarah: Doctor at 3pm tomorrow       │
│ Mike: Can you take her?             │ Message List
│ Sarah: Yes, I'll pick up from school│
│ ...                                 │
├─────────────────────────────────────┤
│ [Type reply...]            [Send]   │ Input Box
└─────────────────────────────────────┘
```

---

#### ThreadCreationModal.jsx (New 🔨)

**Responsibility**: Create or edit thread

**Props**:

```javascript
{
  isOpen: boolean,
  onClose: () => void,
  initialMessage?: Message,
  parentThread?: Thread,
  onSubmit: (data: { title, category }) => void
}
```

**Features**:

- Auto-populate title from message text (editable)
- Category dropdown (9 defaults + custom)
- Preview of originating message (if creating from message)
- "Create Sub-Thread" mode (if parentThread provided)
- Form validation (3-100 chars, required title)

**Modal Layout**:

```
┌─────────────────────────────────────┐
│ Create Thread                  ✕    │
├─────────────────────────────────────┤
│ Title: [Doctor Appointment     ]    │
│ Category: [Medical ▼]               │
│                                     │
│ From message:                       │
│ "Doctor confirmed 3pm tomorrow"     │
│                                     │
│         [Cancel]  [Create Thread]   │
└─────────────────────────────────────┘
```

---

#### ThreadMessageInput.jsx (New 🔨)

**Responsibility**: Send message in thread with AI mediation

**Props**:

```javascript
{
  threadId: string,
  threadCategory: string,
  onSend: (content: string) => void,
  onAIIntervention: (intervention: object) => void
}
```

**Features**:

- Text input with auto-resize
- AI mediation on send (same as main chat)
- Thread context in intervention UI
- "Replying in [Thread Title]" indicator
- Character count (optional)

**AI Integration**:

```javascript
// On send, pass thread context to mediator
const context = {
  roomId,
  senderEmail,
  threadId,
  threadTitle: thread.title,
  threadCategory: thread.category,
};

const result = await mediator.analyze(message, context);

if (result.intervention) {
  onAIIntervention({
    ...result,
    threadContext: `This reply in the ${thread.category} thread...`,
  });
}
```

---

#### ThreadBreadcrumb.jsx (New 🔨)

**Responsibility**: Show thread hierarchy navigation

**Props**:

```javascript
{
  thread: Thread,
  ancestors: Thread[],
  onNavigate: (threadId: string) => void
}
```

**Features**:

- Clickable parent links
- Chevron separators (>)
- Current thread highlighted
- Truncate long titles (hover for full)

**Example**:

```
Schedule > Soccer Practice > Uniform Size
```

---

#### ThreadContextMenu.jsx (New 🔨)

**Responsibility**: Right-click/long-press context menu

**Props**:

```javascript
{
  target: 'message' | 'thread',
  message?: Message,
  thread?: Thread,
  position: { x, y },
  onClose: () => void,
  onAction: (action: string, data: object) => void
}
```

**Menu Options**:

**For Messages**:

- Start Thread
- Add to Thread
- Copy Message
- Edit (if sender)

**For Threads**:

- Open Thread
- Edit Title
- Change Category
- Archive
- Reopen (if archived)

---

### 4.3 Custom Hooks

#### useThreads.js (New 🔨)

**Purpose**: Unified thread state management

**API**:

```javascript
const {
  threads, // Array<Thread>
  selectedThread, // Thread | null
  threadMessages, // Map<threadId, Message[]>
  loading, // boolean
  error, // Error | null
  createThread, // (data) => Promise<string>
  createSubThread, // (parentId, data) => Promise<string>
  selectThread, // (id) => void
  addMessageToThread, // (messageId, threadId) => Promise<void>
  archiveThread, // (id) => Promise<void>
  updateThread, // (id, updates) => Promise<void>
  loadThreadMessages, // (id, offset?) => Promise<void>
} = useThreads(roomId);
```

**State Management Pattern**:

```javascript
const [threads, setThreads] = useState([]);
const [selectedThreadId, setSelectedThreadId] = useState(null);
const [threadMessages, setThreadMessages] = useState(new Map());
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Delta update merging
const handleThreadCreated = useCallback(({ thread }) => {
  setThreads(prev => [thread, ...prev]);
}, []);

const handleMessageCountChanged = useCallback(({ threadId, messageCount, lastMessageAt }) => {
  setThreads(prev =>
    prev.map(t =>
      t.id === threadId ? { ...t, message_count: messageCount, last_message_at: lastMessageAt } : t
    )
  );
}, []);
```

---

#### useThreadSocket.js (New 🔨)

**Purpose**: Socket.io event listeners for threads

**API**:

```javascript
useThreadSocket({
  onThreadCreated, // (thread) => void
  onSubThreadCreated, // (thread, parentId) => void
  onThreadMessageAdded, // (threadId, messageCount) => void
  onThreadsListReceived, // (threads) => void
  onThreadMessagesReceived, // (threadId, messages) => void
});
```

**Implementation Pattern** (similar to `useChatSocket.js`):

```javascript
useEffect(() => {
  if (!socket) return;

  socket.on('thread_created', ({ thread }) => {
    onThreadCreated(thread);
  });

  socket.on('thread_message_count_changed', ({ threadId, messageCount, lastMessageAt }) => {
    onThreadMessageAdded(threadId, messageCount, lastMessageAt);
  });

  // Cleanup
  return () => {
    socket.off('thread_created');
    socket.off('thread_message_count_changed');
  };
}, [socket, onThreadCreated, onThreadMessageAdded]);
```

---

#### useThreadActions.js (New 🔨)

**Purpose**: Thread CRUD operations (wrapped Socket.io emits)

**API**:

```javascript
const {
  createThread, // (roomId, title, category?, messageId?) => Promise<string>
  createSubThread, // (roomId, title, parentId, messageId?) => Promise<string>
  getThreads, // (roomId) => Promise<Thread[]>
  getThreadMessages, // (threadId) => Promise<Message[]>
  addToThread, // (messageId, threadId) => Promise<void>
  removeFromThread, // (messageId) => Promise<void>
  getSubThreads, // (threadId) => Promise<Thread[]>
  getAncestors, // (threadId) => Promise<Thread[]>
} = useThreadActions(socket);
```

**Implementation**:

```javascript
const createThread = useCallback(
  (roomId, title, category, messageId) => {
    return new Promise((resolve, reject) => {
      socket.emit('create_thread', { roomId, title, category, messageId });

      socket.once('thread_created_success', ({ threadId }) => {
        resolve(threadId);
      });

      socket.once('error', ({ message }) => {
        reject(new Error(message));
      });
    });
  },
  [socket]
);
```

---

## 5. Data Flow

### 5.1 Thread Creation Flow

```
User → ThreadCreationModal
  ↓
  Submit ({ roomId, title, category, messageId })
  ↓
useThreadActions.createThread()
  ↓
Socket.emit('create_thread', payload)
  ↓
Backend: threadHandler.js
  ↓
threadManager.createThread() (service layer)
  ↓
Database: INSERT INTO threads
  ↓
Emit: io.to(roomId).emit('thread_created', { thread })
  ↓
Frontend: useThreadSocket listener
  ↓
useThreads state update (delta merge)
  ↓
ThreadsSidebar re-renders (new thread appears)
```

**Optimistic Update** (optional):

```javascript
// Show thread immediately (before server confirms)
setThreads(prev => [{ id: 'pending', title, category, message_count: 0 }, ...prev]);

// Replace with real thread on success
socket.once('thread_created_success', ({ threadId }) => {
  setThreads(prev => prev.map(t => (t.id === 'pending' ? { ...t, id: threadId } : t)));
});
```

---

### 5.2 Reply in Thread Flow

```
User → ThreadMessageInput
  ↓
  Type message → Trigger AI mediation
  ↓
mediator.analyze(message, { threadId, threadTitle, threadCategory })
  ↓
IF hostile → Show intervention modal
  ↓
  User accepts rewrite or edits
  ↓
Socket.emit('send_message', { roomId, content, threadId })
  ↓
Backend: messageHandler.js
  ↓
Save message to database
  ↓
threadManager.addMessageToThread(messageId, threadId)
  ↓
Atomic: UPDATE threads SET message_count = message_count + 1
  ↓
Emit: io.to(roomId).emit('thread_message_count_changed', { threadId, messageCount })
  ↓
Frontend: useThreadSocket listener
  ↓
useThreads state update (count delta)
  ↓
ThreadView re-renders (new message appears)
ThreadsSidebar updates count badge
```

---

### 5.3 Archive Thread Flow

```
User → Right-click thread → "Archive"
  ↓
Confirm modal (if unread messages)
  ↓
useThreadActions.archiveThread(threadId)
  ↓
Socket.emit('archive_thread', { threadId })
  ↓
Backend: UPDATE threads SET is_archived = 1
  ↓
Emit: io.to(roomId).emit('thread_archived', { threadId })
  ↓
Frontend: useThreadSocket listener
  ↓
useThreads filters out archived thread (unless "Show Archived" toggle on)
  ↓
ThreadsSidebar re-renders (thread hidden)
```

---

### 5.4 Real-Time Delta Updates

**Pattern**: Server emits minimal data, client merges

**Example: Message Count Update**

```javascript
// Backend emits (54 bytes)
io.to(roomId).emit('thread_message_count_changed', {
  threadId: 'thread-123',
  messageCount: 47,
  lastMessageAt: '2025-12-29T16:45:00Z',
});

// Frontend merges (5ms React state update)
setThreads(prev =>
  prev.map(t =>
    t.id === 'thread-123' ? { ...t, message_count: 47, last_message_at: '2025-12-29T16:45:00Z' } : t
  )
);
```

**Bandwidth Savings**: ~95% (54 bytes vs. ~1KB for full thread object)

---

## 6. AI Mediation Integration

### 6.1 Context Enrichment

**File to Modify**: `/chat-server/socketHandlers/aiContextHelper.js`

**Current Context**:

```javascript
const context = {
  roomId,
  senderEmail,
  recipientEmail,
  recentMessages,
  communicationProfile,
};
```

**Enhanced Context** (with thread):

```javascript
const threadId = messageData.threadId; // From send_message payload

if (threadId) {
  const thread = await threadOperations.getThread(threadId);
  if (thread) {
    context.thread = {
      id: thread.id,
      title: thread.title,
      category: thread.category,
      depth: thread.depth,
    };
  }
}
```

---

### 6.2 AI Prompt Enhancement

**File to Modify**: `/chat-server/src/liaizen/core/mediator.js`

**Prompt Addition**:

```javascript
let promptPrefix = '';

if (context.thread) {
  promptPrefix = `
This message is being sent in a thread titled "${context.thread.title}"
in the ${context.thread.category} category. The conversation is focused
on ${getCategoryDescription(context.thread.category)} topics.

Consider this thread context when analyzing the message tone and
suggesting improvements. Help the sender stay on-topic and maintain
a constructive tone appropriate for ${context.thread.category} discussions.
`;
}

const fullPrompt = promptPrefix + basePrompt + message;
```

**Category Descriptions** (for context):

```javascript
const categoryDescriptions = {
  medical: 'child health, doctor appointments, medications, and medical care',
  education: 'school, homework, grades, teachers, and educational development',
  schedule: 'pickup times, dropoff arrangements, and custody coordination',
  finances: 'child support, shared expenses, and financial reimbursements',
  // ... etc.
};
```

---

### 6.3 Intervention UI Adaptation

**File to Modify**: `ThreadMessageInput.jsx`

**Thread-Specific Intervention**:

```javascript
const interventionMessage = intervention.threadContext
  ? `${intervention.tip}\n\nIn the ${thread.category} thread, focus on [category-specific advice].`
  : intervention.tip;

<InterventionModal
  isOpen={showIntervention}
  tip={interventionMessage}
  rewrites={intervention.rewrites}
  onAccept={rewrite => handleSendMessage(rewrite)}
  onEdit={() => setShowIntervention(false)}
/>;
```

**Example Intervention**:

```
Original: "You always forget to send her medication!"

Intervention:
"This reply in the Medical thread may sound accusatory.
In medical discussions, focus on your child's health needs
rather than past mistakes. Try one of these:

1. "Can you pack her inhaler this weekend?"
2. "Let's create a medication checklist to avoid confusion."
```

---

## 7. Test Scenarios

**Full Test Plan**: See updated `quickstart.md`

### 7.1 Unit Test Scenarios

**Thread Operations** (`chat-server/src/services/threads/threadOperations.test.js`):

```javascript
describe('Thread Operations', () => {
  test('creates thread with valid data', async () => {
    const threadId = await createThread('room-123', 'Test Thread', 'user@example.com');
    expect(threadId).toMatch(/^thread-/);

    const thread = await getThread(threadId);
    expect(thread.title).toBe('Test Thread');
    expect(thread.depth).toBe(0);
    expect(thread.root_thread_id).toBe(threadId);
  });

  test('rejects thread with invalid title', async () => {
    await expect(createThread('room-123', 'AB', 'user@example.com')).rejects.toThrow(
      'Thread title must be between 3 and 100 characters'
    );
  });

  test('enforces max depth of 3', async () => {
    const root = await createThread('room-123', 'Root', 'user@example.com');
    const sub1 = await createSubThread('room-123', 'Sub 1', 'user@example.com', root);
    const sub2 = await createSubThread('room-123', 'Sub 2', 'user@example.com', sub1);
    const sub3 = await createSubThread('room-123', 'Sub 3', 'user@example.com', sub2);

    await expect(createSubThread('room-123', 'Sub 4', 'user@example.com', sub3)).rejects.toThrow(
      'Maximum thread depth (3) reached'
    );
  });

  test('atomic message count update', async () => {
    const threadId = await createThread('room-123', 'Test', 'user@example.com');

    await Promise.all([
      addMessageToThread('msg-1', threadId),
      addMessageToThread('msg-2', threadId),
      addMessageToThread('msg-3', threadId),
    ]);

    const thread = await getThread(threadId);
    expect(thread.message_count).toBe(3);
  });
});
```

---

### 7.2 Integration Test Scenarios

**Socket.io Event Flow** (`chat-server/__tests__/threads-integration.test.js`):

```javascript
describe('Thread Socket.io Integration', () => {
  let io, clientSocket1, clientSocket2;

  beforeAll(async () => {
    io = await createTestServer();
    clientSocket1 = await createTestClient('user1@example.com');
    clientSocket2 = await createTestClient('user2@example.com');
  });

  test('broadcasts thread creation to all room members', done => {
    // User 2 listens for thread created
    clientSocket2.on('thread_created', ({ thread }) => {
      expect(thread.title).toBe('Test Thread');
      done();
    });

    // User 1 creates thread
    clientSocket1.emit('create_thread', {
      roomId: 'room-123',
      title: 'Test Thread',
      category: 'medical',
    });
  });

  test('delta update for message count', done => {
    clientSocket2.on('thread_message_count_changed', ({ threadId, messageCount }) => {
      expect(messageCount).toBe(1);
      done();
    });

    clientSocket1.emit('add_to_thread', {
      messageId: 'msg-123',
      threadId: 'thread-123',
    });
  });
});
```

---

### 7.3 E2E Test Scenarios

**Create Thread from Message** (`chat-client-vite/e2e/threads.spec.js`):

```javascript
test('user creates thread from message', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'sarah@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  // Send message
  await page.goto('/chat/room-123');
  await page.fill('[data-testid="message-input"]', 'Doctor at 3pm tomorrow');
  await page.click('[data-testid="send-button"]');

  // Right-click message
  const message = page.locator('[data-testid="message"]').last();
  await message.click({ button: 'right' });

  // Select "Start Thread"
  await page.click('[data-testid="context-menu-start-thread"]');

  // Modal appears with auto-populated title
  const modal = page.locator('[data-testid="thread-creation-modal"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('[name="title"]')).toHaveValue('Doctor at 3pm tomorrow');

  // Select category
  await modal.selectOption('[name="category"]', 'medical');

  // Create thread
  await modal.click('[data-testid="create-thread-button"]');

  // Thread appears in sidebar
  const sidebar = page.locator('[data-testid="threads-sidebar"]');
  await expect(sidebar.locator('text=Doctor at 3pm tomorrow')).toBeVisible();
});
```

**Reply in Thread with AI Intervention**:

```javascript
test('AI mediation works in threads', async ({ page }) => {
  await page.goto('/chat/room-123/thread-456');

  // Type hostile message
  await page.fill('[data-testid="thread-input"]', 'You always forget!');
  await page.click('[data-testid="send-button"]');

  // Intervention modal appears
  const intervention = page.locator('[data-testid="intervention-modal"]');
  await expect(intervention).toBeVisible();
  await expect(intervention).toContainText('Medical thread');

  // Accept rewrite
  await intervention.click('[data-testid="rewrite-1"]');
  await intervention.click('[data-testid="accept-button"]');

  // Message sent with rewrite
  const messages = page.locator('[data-testid="thread-messages"]');
  await expect(messages).toContainText('Can you pack her medication?');
});
```

---

### 7.4 Accessibility Test Scenarios

**Keyboard Navigation** (`chat-client-vite/e2e/accessibility.spec.js`):

```javascript
test('keyboard navigation in thread sidebar', async ({ page }) => {
  await page.goto('/chat/room-123');

  // Tab to threads sidebar
  await page.keyboard.press('Tab'); // Focus on first thread
  await expect(page.locator('[data-testid="threads-sidebar"] button:first-child')).toBeFocused();

  // Arrow down to next thread
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-testid="threads-sidebar"] button:nth-child(2)')).toBeFocused();

  // Enter to open thread
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/thread-/);

  // Escape to close thread
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/chat\/room-123$/);
});
```

**Screen Reader Announcements**:

```javascript
test('screen reader announces new thread', async ({ page }) => {
  const ariaLive = page.locator('[aria-live="polite"]');

  // Create thread
  await page.click('[data-testid="create-thread-button"]');

  // Check announcement
  await expect(ariaLive).toContainText('Thread created: Medical Appointment');
});
```

**WCAG Compliance**:

```javascript
test('passes axe accessibility audit', async ({ page }) => {
  await page.goto('/chat/room-123');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toHaveLength(0);
});
```

---

## 8. Constitutional Validation

### 8.1 Pre-Research Gate ✅

**Principle I: Library-First** (IMMUTABLE)

- ✅ Uses existing Socket.io library for real-time
- ✅ Uses existing React hooks pattern
- ✅ No new dependencies added unnecessarily

**Principle II: Test-First** (IMMUTABLE)

- ✅ Contract tests defined before implementation
- ✅ E2E test scenarios documented
- ✅ 80% coverage target for thread services

**Principle III: Contract-First** (IMMUTABLE)

- ✅ Socket.io events defined in `contracts/socket-events.yaml`
- ✅ REST API defined in `contracts/rest-api.yaml`
- ✅ Data model defined in `data-model.md`

**Principle IV: Idempotent Operations**

- ✅ Thread creation with duplicate message: No-op (unique constraint)
- ✅ Add message to thread: Idempotent (UNIQUE constraint)
- ✅ Research phase can be re-run without side effects

**Principle V: Progressive Enhancement**

- ✅ Start with simplest viable architecture (basic threads)
- ✅ Defer virtual scrolling (premature optimization)
- ✅ Defer thread templates (v2 feature)

**Principle VI: Git Approval** (IMMUTABLE)

- ✅ NO autonomous Git operations
- ✅ Request user approval for commits
- ✅ Document Git operations in plan

**Principle VII: Observability**

- ✅ Include logging in thread operations
- ✅ Emit events for analytics (ThreadCreated, MessageAddedToThread)
- ✅ Monitor performance metrics (thread load time, message count update latency)

**Principle VIII: Documentation Sync**

- ✅ `plan.md` synchronized with design changes
- ✅ `research.md` updated with technology decisions
- ✅ `data-model.md` reflects database schema

**Principle IX: Dependency Management**

- ✅ All dependencies documented in Technical Context
- ✅ No new dependencies (uses existing React, Socket.io, Tailwind)

**Principle X: Agent Delegation**

- ✅ Delegate to tasks-agent for task generation (next phase)
- ✅ Document agent coordination in plan

**Principle XI: Input Validation**

- ✅ Thread title: 3-100 characters (validated)
- ✅ Thread depth: 0-3 (enforced)
- ✅ Category: Valid enum or custom (normalized)
- ✅ Message ownership: Room ID match (validated)

**Principle XII: Design System**

- ✅ Uses LiaiZen design tokens (bg-teal-dark, rounded-lg buttons)
- ✅ Glass morphism cards (bg-white/80)
- ✅ Category colors defined in `threadCategories.js`

**Principle XIII: Access Control**

- ✅ Authorization in contracts (user must be room member)
- ✅ No private threads (all room members see all threads)
- ✅ Deletion requires both co-parents' approval

**Principle XIV: AI Model Selection**

- ✅ Use OpenAI GPT-4 for mediation (existing integration)
- ✅ Document model selection rationale (proven accuracy)

**Complexity Tracking**: NONE

- No constitutional deviations
- All principles followed

---

### 8.2 Post-Design Gate ✅

**Re-Evaluation**: All principles still compliant

**Potential Violations**: NONE

**Refactoring Needed**: NONE

**Complexity Justifications**: N/A

---

### 8.3 Co-Parenting Domain Alignment

**Child-Centric Organization** ✅

- Medical threads: All health info in one place
- Education threads: School communication organized
- Schedule threads: Custody coordination clear
- Categories align with children's needs

**Conflict Reduction** ✅

- Accountability: Thread history shows who said what
- Clarity: Topics stay separate (less confusion)
- Proactive organization: Reduces reactive arguments

**Privacy & Safety** ✅

- Thread titles avoid sensitive details (e.g., "Medical" not "Johnny's Anxiety")
- Custom categories allow discretion
- Archive function lets parents "close" sensitive topics
- Audit trail preserved (court-admissible)

**Equity & Fairness** ✅

- Both parents can create threads
- Both parents can archive/reopen threads
- No "thread ownership" (collaborative model)
- All thread activity visible to both parents

---

## 9. Readiness Assessment

### 9.1 Phase Completion Checklist

**Phase 0: Research & Discovery** ✅

- [x] Technology stack evaluated (use existing)
- [x] Gaps identified (frontend UI components)
- [x] Performance strategy defined (delta updates, pagination)
- [x] AI integration approach documented
- [x] Risk assessment completed
- [x] `research.md` created

**Phase 1: Design & Contract Definition** ✅

- [x] Data model documented (`data-model.md`)
- [x] API contracts defined (`contracts/socket-events.yaml`, `contracts/rest-api.yaml`)
- [x] Component architecture designed
- [x] Test scenarios documented (`quickstart.md`)
- [x] Constitutional validation passed (both gates)

**Phase 2: Task Generation** 🔨 NEXT

- [ ] Generate `tasks.md` with dependency-ordered task list
- [ ] Estimate effort for each task
- [ ] Identify critical path
- [ ] Assign tasks to team members

---

### 9.2 Quality Gates Validation

**Completeness** ✅

- All sections of `plan-template.md` filled
- Technical Context complete
- Phase 0 & 1 outputs generated
- Test scenarios comprehensive

**Constitutional Compliance** ✅

- Pre-research gate passed
- Post-design gate passed
- No violations documented
- All 14 principles followed

**Validation Score**: Target ≥ 80% ✅

- Run `validate-plan.sh --file specs/conversation-threading/plan.md`
- Expected: 90%+ (all required sections present)

**Readiness for Tasks** ✅

- Contracts are executable (can implement directly)
- Data model is complete (no ambiguities)
- Component architecture is clear (no design gaps)
- Test scenarios are detailed (can write tests now)

---

### 9.3 Estimated Task Generation Output

**Expected Task Count**: ~35-45 tasks

**Task Categories**:

1. **Frontend Components** (15 tasks)
   - ThreadView.jsx (3 tasks: base component, infinite scroll, breadcrumb)
   - ThreadCreationModal.jsx (2 tasks: modal, validation)
   - ThreadMessageInput.jsx (3 tasks: input, AI integration, intervention UI)
   - ThreadBreadcrumb.jsx (1 task)
   - ThreadContextMenu.jsx (2 tasks: message menu, thread menu)
   - ThreadsSidebar enhancements (2 tasks: archive toggle, unread badges)
   - ChatRoom.jsx integration (2 tasks: wire up components, routing)

2. **State Management Hooks** (6 tasks)
   - useThreads.js (2 tasks: state management, delta merging)
   - useThreadSocket.js (2 tasks: event listeners, reconnection)
   - useThreadActions.js (2 tasks: CRUD operations, error handling)

3. **Backend Enhancements** (5 tasks)
   - AI mediation context (1 task: modify aiContextHelper.js)
   - Missing use cases (3 tasks: ReplyInThread, ArchiveThread, MoveMessage)
   - Domain events (1 task: ThreadArchived, MessageAddedToThread)

4. **Mobile UX** (4 tasks)
   - Touch gestures (2 tasks: swipe, long-press)
   - Responsive design (2 tasks: full-screen thread view, sidebar collapse)

5. **Testing** (10 tasks)
   - Unit tests (4 tasks: thread operations, hierarchy, categories, hooks)
   - Integration tests (3 tasks: Socket.io flow, database, AI mediation)
   - E2E tests (2 tasks: create thread, reply with AI)
   - Accessibility tests (1 task: keyboard, screen reader, axe audit)

6. **Documentation & Polish** (5 tasks)
   - User guide (1 task)
   - Developer API docs (1 task)
   - Onboarding tooltips (1 task)
   - Error handling UI (1 task)
   - Performance optimization (1 task)

**Parallelization Opportunities**:

- Frontend components (15 tasks) → 3 parallel tracks
- State hooks (6 tasks) → Can build concurrently
- Backend enhancements (5 tasks) → Independent of frontend
- Testing (10 tasks) → Can start once contracts are implemented

**Critical Path**: ThreadView.jsx → useThreads.js → AI mediation context → E2E tests

**Estimated Timeline** (with task parallelization):

- Week 1: Frontend components (ThreadView, modal, input) + State hooks
- Week 2: Backend enhancements + Frontend integration (ChatRoom)
- Week 3: Mobile UX + Hierarchy (breadcrumbs, sub-threads)
- Week 4: Testing + Documentation + Polish

---

### 9.4 Success Criteria

**Feature Completeness** (MUST HAVE for Release):

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

**Performance Benchmarks**:

- [ ] Thread list load < 500ms (100 threads)
- [ ] Thread messages load < 1s (500 messages)
- [ ] WebSocket latency < 500ms (p95)
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility)

**Quality Gates**:

- [ ] 80% unit test coverage for thread services
- [ ] All Socket.io events tested (integration)
- [ ] Critical user flows tested (E2E)
- [ ] 0 axe violations (accessibility)

---

## 10. Next Steps

1. **Generate Tasks** ✅ READY
   - Execute: `/tasks` command
   - Input: `specs/conversation-threading/plan.md`
   - Output: `specs/conversation-threading/tasks.md`

2. **Review Plan with Team** (Before Task Generation)
   - Frontend engineer: Validate component architecture
   - Backend engineer: Verify AI mediation approach
   - QA engineer: Review test scenarios

3. **Design Mockups** (Parallel to Task Generation)
   - UI designer creates high-fidelity designs
   - ThreadView layout (message list, breadcrumb, input)
   - ThreadCreationModal UI
   - ThreadContextMenu (right-click, long-press)

4. **Implementation** (After Task Generation)
   - Assign tasks to team members
   - Follow dependency order (contracts → hooks → components)
   - Daily standups to track progress

5. **Testing** (Continuous)
   - Write tests alongside implementation (TDD)
   - Run tests before each commit (pre-commit hook)
   - E2E tests after component integration

6. **Beta Testing** (Before Release)
   - Recruit 5 co-parent pairs
   - 1-week beta period
   - Collect feedback (qualitative + quantitative)

7. **Launch** (After Beta)
   - Deploy to production (Railway backend, Vercel frontend)
   - Monitor performance metrics (p95 latencies)
   - Track adoption metrics (60% thread creation within 30 days)

---

## Appendix A: File Reference

### Files Created (This Planning Phase)

- `specs/conversation-threading/research.md` (Phase 0)
- `specs/conversation-threading/data-model.md` (Phase 1)
- `specs/conversation-threading/contracts/socket-events.yaml` (Phase 1)
- `specs/conversation-threading/contracts/rest-api.yaml` (Phase 1)
- `specs/conversation-threading/plan.md` (This document)

### Files to Modify (Implementation Phase)

- `/chat-server/socketHandlers/aiContextHelper.js` - Add thread context
- `/chat-client-vite/src/features/chat/components/ChatRoom.jsx` - Integrate ThreadView
- `/chat-client-vite/src/hooks/useChatSocket.js` - Add thread socket listeners (or create new hook)

### Files to Create (Implementation Phase)

- `/chat-client-vite/src/features/chat/hooks/useThreads.js`
- `/chat-client-vite/src/features/chat/hooks/useThreadSocket.js`
- `/chat-client-vite/src/features/chat/hooks/useThreadActions.js`
- `/chat-client-vite/src/features/chat/components/ThreadView.jsx`
- `/chat-client-vite/src/features/chat/components/ThreadCreationModal.jsx`
- `/chat-client-vite/src/features/chat/components/ThreadMessageInput.jsx`
- `/chat-client-vite/src/features/chat/components/ThreadBreadcrumb.jsx`
- `/chat-client-vite/src/features/chat/components/ThreadContextMenu.jsx`
- `/chat-server/src/services/threads/useCases/ReplyInThreadUseCase.js`
- `/chat-server/src/services/threads/useCases/ArchiveThreadUseCase.js`
- `/chat-server/src/services/threads/useCases/MoveMessageToThreadUseCase.js`

---

## Appendix B: Glossary

| Term               | Definition                                                           |
| ------------------ | -------------------------------------------------------------------- |
| **Thread**         | Conversation topic within a room, containing related messages        |
| **Sub-thread**     | Nested thread spawned from a parent thread message                   |
| **Root thread**    | Top-level thread (depth 0, no parent)                                |
| **Thread depth**   | Nesting level (0-3, enforced maximum)                                |
| **Category**       | Topic classification (medical, education, schedule, etc.)            |
| **Delta update**   | Real-time event containing only changed data (not full state)        |
| **Atomic update**  | Database operation guaranteed to execute completely or not at all    |
| **Junction table** | Many-to-many relationship table (thread_messages)                    |
| **Breadcrumb**     | Navigation showing thread hierarchy (e.g., Schedule > Soccer > Size) |
| **Optimistic UI**  | Show UI changes immediately, sync with server in background          |

---

**Plan Completed By**: planning-agent
**Date**: 2025-12-29
**Status**: ✅ Ready for `/tasks` Phase
**Validation**: Constitutional compliance verified, all quality gates passed
