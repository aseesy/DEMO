# useSendMessage Refactoring Guide

## Problem Statement

The original `useSendMessage.js` is a **God Object** that violates the Single Responsibility Principle:

1. **UI State Management**: Managing pending messages and scrolling
2. **Networking**: Direct coupling to `socketRef` and `socket.emit`
3. **Core Business Logic**: Observer/Mediator Framework analysis logic hard-coded in event handler
4. **Traffic Control**: Deciding if a message is safe to send inside a UI controller

### Why This Is Bad

- **View layer knows about conflict detection** - UI shouldn't know about business rules
- **Network transport mixed with validation logic** - Can't change transport without touching validation
- **Tight coupling** - Changing analysis engine requires opening UI component file
- **Hard to test** - Can't test validation logic without mocking socket.io

## Solution: Separation of Concerns

### New Architecture

```
┌─────────────────────────────────────┐
│   useSendMessage (UI Hook)          │
│   - Pending message state            │
│   - Message statuses                 │
│   - UI feedback (scrolling, etc.)    │
└──────────────┬──────────────────────┘
               │ orchestrates
               ↓
┌─────────────────────────────────────┐
│   MessageValidationService           │
│   - Message analysis                 │
│   - Traffic control decisions        │
│   - Conflict detection               │
└──────────────┬──────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────┐
│   MessageTransportService            │
│   - Socket.io abstraction            │
│   - HTTP fallback (future)           │
│   - Connection management            │
└──────────────┬──────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────┐
│   SocketAdapter                      │
│   - socket.io-client wrapper         │
└─────────────────────────────────────┘
```

### Services Created

1. **MessageTransportService** (`src/services/message/MessageTransportService.js`)
   - **Responsibility**: Transport only
   - **What it does**: Sends messages via any transport (Socket.io, HTTP, WebSocket)
   - **What it doesn't do**: No validation, no business logic

2. **MessageValidationService** (`src/services/message/MessageValidationService.js`)
   - **Responsibility**: Business logic only
   - **What it does**: Analyzes messages, makes traffic control decisions
   - **What it doesn't do**: No UI concerns, no transport concerns

3. **MessageQueueService** (`src/services/message/MessageQueueService.js`)
   - **Responsibility**: Queue management only
   - **What it does**: Manages offline queue, localStorage persistence
   - **What it doesn't do**: No UI state, no transport

4. **useSendMessage (Refactored)** (`src/features/chat/model/useSendMessage.refactored.js`)
   - **Responsibility**: UI state management only
   - **What it does**: Manages pending messages, statuses, UI feedback
   - **What it doesn't do**: No direct socket calls, no validation logic

## Migration Steps

### Step 1: Create Service Instances

In your component that uses `useSendMessage`, create service instances:

```javascript
import { createMessageTransportService } from '../../../services/message/MessageTransportService.js';
import { createMessageValidationService } from '../../../services/message/MessageValidationService.js';
import { createMessageQueueService } from '../../../services/message/MessageQueueService.js';

// In your component
const transportService = React.useMemo(
  () => createMessageTransportService(socketRef.current),
  [socketRef]
);

const validationService = React.useMemo(() => createMessageValidationService(), []);

const queueService = React.useMemo(() => createMessageQueueService(), []);
```

### Step 2: Update useSendMessage Call

```javascript
// OLD
const { sendMessage, pendingMessages, messageStatuses, markMessageSent, markMessageFailed } =
  useSendMessage({
    socketRef,
    username,
    inputMessage,
    isPreApprovedRewrite,
    originalRewrite,
    clearInput,
    stopTyping,
    setDraftCoaching,
    setError,
    offlineQueueRef,
    scrollToBottom,
  });

// NEW
const { sendMessage, pendingMessages, messageStatuses, markMessageSent, markMessageFailed } =
  useSendMessage({
    transport: transportService,
    validationService: validationService,
    queueService: queueService,
    username,
    inputMessage,
    isPreApprovedRewrite,
    originalRewrite,
    clearInput,
    stopTyping,
    setDraftCoaching,
    setError,
    scrollToBottom,
  });
```

### Step 3: Handle Offline Queue Processing

The queue service now manages the queue. You'll need to process it when connection is restored:

```javascript
// When socket connects, process queue
React.useEffect(() => {
  if (socketRef.current?.connected) {
    const queue = queueService.getQueue();
    queue.forEach(message => {
      transportService.sendMessage({
        text: message.text,
        isPreApprovedRewrite: message.isPreApprovedRewrite,
        originalRewrite: message.originalRewrite,
      });
      queueService.dequeue(message.id);
    });
  }
}, [isConnected, transportService, queueService]);
```

## Benefits

### 1. **Testability**

```javascript
// Can test validation service independently
const validationService = createMessageValidationService();
const result = await validationService.validateMessage('test message');
expect(result.shouldSend).toBe(true);

// Can test transport service independently
const mockTransport = { emit: jest.fn(), connected: true };
const transportService = createMessageTransportService(mockTransport);
await transportService.sendMessage({ text: 'test' });
expect(mockTransport.emit).toHaveBeenCalled();
```

### 2. **Flexibility**

- **Change transport**: Switch from Socket.io to HTTP REST? Only change `MessageTransportService`
- **Change analysis engine**: Switch analysis providers? Only change `MessageValidationService`
- **Change queue storage**: Switch from localStorage to IndexedDB? Only change `MessageQueueService`

### 3. **Maintainability**

- Each service has a single, clear responsibility
- Changes are isolated to one service
- Easy to understand what each piece does

### 4. **Reusability**

- Services can be used in other components
- Can be shared between different features
- Can be used in tests without UI

## File Structure

```
src/
  services/
    message/
      MessageTransportService.js    # Transport abstraction
      MessageValidationService.js    # Business logic
      MessageQueueService.js        # Queue management
      index.js                      # Exports
  features/
    chat/
      model/
        useSendMessage.js           # OLD (God Object)
        useSendMessage.refactored.js # NEW (UI only)
```

## Next Steps

1. ✅ Services created
2. ⏳ Update consumers to use new architecture
3. ⏳ Add tests for each service
4. ⏳ Migrate from old to new version
5. ⏳ Remove old `useSendMessage.js` once migration complete

## Example: Testing Services Independently

```javascript
// Test MessageValidationService
describe('MessageValidationService', () => {
  it('should block messages with high conflict', async () => {
    const service = createMessageValidationService();
    const result = await service.validateMessage('You always do this!');
    expect(result.shouldSend).toBe(false);
    expect(result.observerData).toBeDefined();
  });
});

// Test MessageTransportService
describe('MessageTransportService', () => {
  it('should send message when connected', async () => {
    const mockSocket = { emit: jest.fn(), connected: true, id: 'test-id' };
    const service = createMessageTransportService(mockSocket);
    const sent = await service.sendMessage({ text: 'test' });
    expect(sent).toBe(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object));
  });
});
```
