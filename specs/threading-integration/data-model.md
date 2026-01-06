# Threading Integration Data Model

## Frontend State Structure

### ThreadService State

```typescript
interface ThreadServiceState {
  threads: Thread[];
  threadMessages: Record<string, Message[]>; // threadId -> messages
  isLoading: boolean;
  isAnalysisComplete: boolean;
}

interface Thread {
  id: string;
  room_id: string;
  title: string;
  category: string;
  message_count: number;
  last_message_at: string | null;
  is_archived: number; // 0 or 1
  depth: number;
  parent_thread_id: string | null;
  root_thread_id: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  threadId: string | null;
  roomId: string;
  sender: User;
  sequenceNumber: number | null; // For thread ordering
}
```

## Socket Event Contracts

### Client → Server Events

#### `reply_in_thread`
```typescript
{
  threadId: string;
  text: string;
  messageData?: object;
}
```

#### `move_message_to_thread`
```typescript
{
  messageId: string;
  targetThreadId: string | null; // null = main chat
  roomId: string;
}
```

#### `archive_thread`
```typescript
{
  threadId: string;
  archived: boolean; // true = archive, false = unarchive
  cascade: boolean; // true = cascade to sub-threads
}
```

#### `get_thread_messages` (updated)
```typescript
{
  threadId: string;
  limit?: number; // default 50
  offset?: number; // default 0
}
```

### Server → Client Events

#### `reply_in_thread_success`
```typescript
{
  threadId: string;
  messageId: string;
}
```

#### `message_moved_to_thread_success`
```typescript
{
  messageId: string;
  oldThreadId: string | null;
  newThreadId: string | null;
  affectedThreads: Array<{
    threadId: string;
    messageCount: number;
    action: 'added' | 'removed';
  }>;
}
```

#### `thread_archived_success`
```typescript
{
  threadId: string;
  archived: boolean;
}
```

#### `thread_archived` (broadcast)
```typescript
{
  threadId: string;
  archived: boolean;
  cascade: boolean;
  affectedThreadIds: string[];
}
```

#### `thread_message_count_changed` (broadcast)
```typescript
{
  threadId: string;
  messageCount: number;
  lastMessageAt: string | null;
}
```

#### `thread_messages` (updated)
```typescript
{
  threadId: string;
  messages: Message[];
  limit: number;
  offset: number;
  totalCount?: number; // Optional: total messages in thread
}
```

## State Update Patterns

### Reply in Thread Flow

1. User submits reply → `replyInThread(threadId, text)`
2. Service emits → `socketService.emit('reply_in_thread', {...})`
3. Server processes → Creates message, adds to thread
4. Server emits → `reply_in_thread_success` (to sender)
5. Server emits → `new_message` (to all room members)
6. Server emits → `thread_message_count_changed` (to all room members)
7. Frontend updates:
   - `new_message` handler adds message to thread messages (if thread loaded)
   - `thread_message_count_changed` handler updates thread count

### Move Message Flow

1. User selects move → `moveMessageToThread(messageId, targetThreadId, roomId)`
2. Service emits → `socketService.emit('move_message_to_thread', {...})`
3. Server processes → Moves message atomically
4. Server emits → `message_moved_to_thread_success` (to sender)
5. Server emits → `thread_message_count_changed` for each affected thread (to all)
6. Frontend updates:
   - `message_moved_to_thread_success` handler moves message in state
   - `thread_message_count_changed` handlers update thread counts

### Archive Thread Flow

1. User clicks archive → `archiveThread(threadId, true, true)`
2. Service emits → `socketService.emit('archive_thread', {...})`
3. Server processes → Archives thread and sub-threads
4. Server emits → `thread_archived_success` (to sender)
5. Server emits → `thread_archived` (broadcast to all room members)
6. Frontend updates:
   - `thread_archived` handler updates `is_archived` for all affected threads
   - UI filters out archived threads (if filter enabled)

## Component Props

### ThreadReplyInput
```typescript
interface ThreadReplyInputProps {
  threadId: string;
  threadTitle: string;
  replyInThread: (threadId: string, text: string, messageData?: object) => void;
  username: string;
}
```

### MoveMessageMenu
```typescript
interface MoveMessageMenuProps {
  messageId: string;
  currentThreadId: string | null;
  threads: Thread[];
  roomId: string;
  moveMessageToThread: (messageId: string, targetThreadId: string | null, roomId: string) => void;
  onClose?: () => void;
}
```

## Error Handling

### Error Events
All operations can emit `error` event:
```typescript
{
  message: string; // User-friendly error message
}
```

### Error States
- Invalid threadId → "Thread not found"
- Thread archived → "Cannot reply to archived thread"
- Room mismatch → "Thread belongs to different room"
- Invalid messageId → "Message not found"
- Validation errors → Descriptive messages from backend

## Performance Considerations

### State Updates
- Use `useMemo` for filtered thread lists
- Batch state updates when possible
- Avoid unnecessary re-renders

### Pagination
- Load initial 50 messages
- Load more on scroll/button click
- Append to existing messages (don't replace)

### Real-time Updates
- Handle multiple simultaneous events
- Debounce rapid updates if needed
- Update UI optimistically when possible

