# Browser Testing Script for Threading Features

This document provides a manual testing script to verify all threading improvements in the browser.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:5173`
3. User logged in and connected to a room

## Test Script

Open browser console (F12) and run these tests:

### 1. Test Reply in Thread

```javascript
// First, get a thread ID (create one or use existing)
// Then test replying in thread
const testReplyInThread = async () => {
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  // Wait for connection
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  // Get room ID (you'll need to get this from your session)
  const roomId = 'your-room-id'; // Replace with actual room ID
  const threadId = 'your-thread-id'; // Replace with actual thread ID
  
  // Listen for success
  socket.on('reply_in_thread_success', (data) => {
    console.log('✅ Reply in thread success:', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
  
  // Emit reply
  socket.emit('reply_in_thread', {
    threadId: threadId,
    text: 'This is a test reply in thread',
    messageData: {}
  });
  
  console.log('📤 Sent reply_in_thread event');
};

testReplyInThread();
```

### 2. Test Move Message to Thread

```javascript
const testMoveMessageToThread = async () => {
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  const roomId = 'your-room-id';
  const messageId = 'your-message-id'; // Message to move
  const targetThreadId = 'your-thread-id'; // Target thread (or null for main chat)
  
  socket.on('message_moved_to_thread_success', (data) => {
    console.log('✅ Message moved successfully:', data);
  });
  
  socket.on('thread_message_count_changed', (data) => {
    console.log('📊 Thread count changed:', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
  
  socket.emit('move_message_to_thread', {
    messageId: messageId,
    targetThreadId: targetThreadId,
    roomId: roomId
  });
  
  console.log('📤 Sent move_message_to_thread event');
};

testMoveMessageToThread();
```

### 3. Test Archive Thread

```javascript
const testArchiveThread = async () => {
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  const threadId = 'your-thread-id';
  
  socket.on('thread_archived_success', (data) => {
    console.log('✅ Thread archived successfully:', data);
  });
  
  socket.on('thread_archived', (data) => {
    console.log('📢 Thread archived event (broadcast):', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
  
  // Archive thread
  socket.emit('archive_thread', {
    threadId: threadId,
    archived: true,
    cascade: true
  });
  
  console.log('📤 Sent archive_thread event (archive)');
  
  // Wait 2 seconds, then unarchive
  setTimeout(() => {
    socket.emit('archive_thread', {
      threadId: threadId,
      archived: false,
      cascade: false
    });
    console.log('📤 Sent archive_thread event (unarchive)');
  }, 2000);
};

testArchiveThread();
```

### 4. Test Get Thread Messages with Pagination

```javascript
const testGetThreadMessagesPagination = async () => {
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  const threadId = 'your-thread-id';
  
  socket.on('thread_messages', (data) => {
    console.log('✅ Thread messages received:', {
      threadId: data.threadId,
      messageCount: data.messages.length,
      limit: data.limit,
      offset: data.offset,
      totalCount: data.totalCount
    });
  });
  
  socket.on('error', (error) => {
    console.error('❌ Error:', error);
  });
  
  // Get first page
  socket.emit('get_thread_messages', {
    threadId: threadId,
    limit: 10,
    offset: 0
  });
  
  console.log('📤 Sent get_thread_messages (page 1)');
  
  // Get second page
  setTimeout(() => {
    socket.emit('get_thread_messages', {
      threadId: threadId,
      limit: 10,
      offset: 10
    });
    console.log('📤 Sent get_thread_messages (page 2)');
  }, 1000);
};

testGetThreadMessagesPagination();
```

### 5. Test Input Validation

```javascript
const testInputValidation = async () => {
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  socket.on('error', (error) => {
    console.log('✅ Validation error caught:', error.message);
  });
  
  // Test invalid threadId
  socket.emit('reply_in_thread', {
    threadId: '', // Invalid: empty string
    text: 'Test'
  });
  
  // Test invalid text
  setTimeout(() => {
    socket.emit('reply_in_thread', {
      threadId: 'thread-123',
      text: '' // Invalid: empty string
    });
  }, 500);
  
  // Test invalid messageId
  setTimeout(() => {
    socket.emit('move_message_to_thread', {
      messageId: '', // Invalid: empty string
      targetThreadId: 'thread-123',
      roomId: 'room-123'
    });
  }, 1000);
  
  console.log('📤 Sent validation test events');
};

testInputValidation();
```

### 6. Complete Integration Test

```javascript
const runCompleteThreadingTest = async () => {
  console.log('🧪 Starting complete threading test suite...');
  
  const socket = window.__socket || window.socket || io('http://localhost:3000');
  
  await new Promise(resolve => {
    if (socket.connected) resolve();
    else socket.on('connect', resolve);
  });
  
  console.log('✅ Socket connected:', socket.id);
  
  // Setup event listeners
  const events = [
    'reply_in_thread_success',
    'message_moved_to_thread_success',
    'thread_archived_success',
    'thread_archived',
    'thread_message_count_changed',
    'thread_messages',
    'error'
  ];
  
  events.forEach(event => {
    socket.on(event, (data) => {
      console.log(`📨 [${event}]:`, data);
    });
  });
  
  // You'll need to replace these with actual IDs from your session
  const roomId = prompt('Enter room ID:');
  const threadId = prompt('Enter thread ID (or create one first):');
  const messageId = prompt('Enter message ID to test move:');
  
  if (!roomId || !threadId) {
    console.error('❌ Missing required IDs');
    return;
  }
  
  console.log('\n1️⃣ Testing reply_in_thread...');
  socket.emit('reply_in_thread', {
    threadId: threadId,
    text: 'Test reply from browser console',
    messageData: {}
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  if (messageId) {
    console.log('\n2️⃣ Testing move_message_to_thread...');
    socket.emit('move_message_to_thread', {
      messageId: messageId,
      targetThreadId: threadId,
      roomId: roomId
    });
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n3️⃣ Testing archive_thread...');
  socket.emit('archive_thread', {
    threadId: threadId,
    archived: true,
    cascade: true
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n4️⃣ Testing get_thread_messages with pagination...');
  socket.emit('get_thread_messages', {
    threadId: threadId,
    limit: 5,
    offset: 0
  });
  
  console.log('\n✅ Test suite complete! Check console for results.');
};

// Run the test
runCompleteThreadingTest();
```

## Expected Results

### Reply in Thread
- ✅ Should receive `reply_in_thread_success` event
- ✅ Should receive `thread_message_count_changed` event
- ✅ Should receive `new_message` event with the reply
- ✅ Message should appear in thread

### Move Message to Thread
- ✅ Should receive `message_moved_to_thread_success` event
- ✅ Should receive `thread_message_count_changed` for both old and new threads
- ✅ Message should move from old thread to new thread

### Archive Thread
- ✅ Should receive `thread_archived_success` event
- ✅ Should receive `thread_archived` broadcast event
- ✅ Thread should be marked as archived
- ✅ If cascade=true, sub-threads should also be archived

### Get Thread Messages with Pagination
- ✅ Should receive `thread_messages` event with pagination metadata
- ✅ Should include `limit`, `offset`, and `totalCount` in response
- ✅ Messages should be ordered by sequence number

### Input Validation
- ✅ Should receive `error` event with descriptive message
- ✅ Invalid inputs should be rejected before processing

## Notes

- Replace placeholder IDs (`your-room-id`, `your-thread-id`, etc.) with actual values from your session
- You may need to create a thread first using `create_thread` event
- Check browser console and network tab for any errors
- Verify database state after each test

