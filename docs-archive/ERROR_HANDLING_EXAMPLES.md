# Error Handling Pattern - Example Refactorings

This document shows how to apply the new error handling and logging pattern to existing code.

## Example 1: `mediator.js` - analyzeMessage Function

### Before (Current Code)

```javascript
async function analyzeMessage(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null, taskContextForAI = null, flaggedMessagesContext = null, roleContext = null) {
  // ... existing code ...
  
  } catch (error) {
    console.error('❌ Error in AI mediator:', error.message);
    return null;
  }
}
```

**Problems**:
- No error context (user, room, message)
- No error categorization
- No stack trace
- Silent failure (returns null)

### After (Refactored)

```javascript
const { defaultLogger } = require('../utils/logger');
const { OperationalError, RetryableError } = require('../utils/errors');

async function analyzeMessage(message, recentMessages, participantUsernames = [], existingContacts = [], contactContextForAI = null, roomId = null, taskContextForAI = null, flaggedMessagesContext = null, roleContext = null) {
  const logger = defaultLogger.child({
    operation: 'analyzeMessage',
    roomId,
    messageId: message?.id,
    username: message?.username
  });

  try {
    // ... existing code ...
    
  } catch (error) {
    logger.error('AI mediator analysis failed', error, {
      messageLength: message?.length,
      recentMessagesCount: recentMessages?.length,
      hasContacts: existingContacts?.length > 0
    });

    // Categorize error for appropriate handling
    if (error.status === 429 || error.code === 'ETIMEDOUT') {
      throw new RetryableError(
        'AI analysis temporarily unavailable, please try again',
        'AI_RATE_LIMIT',
        { roomId, username: message?.username }
      );
    }

    // For graceful degradation (fail open), return null but log with full context
    // This allows messages through when AI fails, preventing system-wide outages
    logger.warn('AI mediator failed, allowing message through (fail open)', {
      errorType: error.name,
      errorCode: error.code,
      roomId,
      username: message?.username
    });

    return null;
  }
}
```

**Improvements**:
- ✅ Structured logging with context
- ✅ Error categorization (retryable vs fatal)
- ✅ Full error details (stack, code, type)
- ✅ Graceful degradation with monitoring

---

## Example 2: `feedbackLearner.js` - recordExplicitFeedback Function

### Before (Current Code)

```javascript
async function recordExplicitFeedback(username, feedbackType, context, reason = null) {
  try {
    const db = await require('../../../db').getDb();
    
    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) return;  // ❌ Silent failure

    // ... rest of code ...

    console.log(`📝 Recorded ${feedbackType} feedback from ${username}`);

  } catch (error) {
    console.error('Error recording explicit feedback:', error.message);
    // ❌ Silent failure - caller doesn't know operation failed
  }
}
```

**Problems**:
- Silent failure (no return value indicating success/failure)
- No error context
- No retry mechanism
- Caller can't distinguish between "user not found" and "database error"

### After (Refactored)

```javascript
const { defaultLogger } = require('../../utils/logger');
const { OperationalError } = require('../../utils/errors');

async function recordExplicitFeedback(username, feedbackType, context, reason = null) {
  const logger = defaultLogger.child({
    operation: 'recordExplicitFeedback',
    username,
    feedbackType
  });

  try {
    const db = await require('../../../db').getDb();
    
    // Get user ID
    const userResult = await dbSafe.safeSelect('users', { username: username.toLowerCase() }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    
    if (users.length === 0) {
      logger.warn('User not found for feedback recording', { username });
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          type: 'operational'
        }
      };
    }

    const userId = users[0].id;

    // Check if feedback table exists, create if not
    try {
      await dbSafe.safeSelect('user_feedback', { user_id: userId }, { limit: 1 });
    } catch (e) {
      // Table doesn't exist, create it
      logger.info('Creating user_feedback table', { userId });
      db.run(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          feedback_type TEXT NOT NULL,
          context_json TEXT,
          reason TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id)`);
      require('../../../db').saveDatabase();
    }

    // Record feedback
    await dbSafe.safeInsert('user_feedback', {
      user_id: userId,
      feedback_type: feedbackType,
      context_json: JSON.stringify(context),
      reason: reason,
      created_at: new Date().toISOString()
    });

    logger.info('Feedback recorded successfully', {
      userId,
      feedbackType,
      hasReason: !!reason
    });

    return { success: true };

  } catch (error) {
    logger.error('Failed to record explicit feedback', error, {
      username,
      feedbackType,
      hasContext: !!context,
      hasReason: !!reason
    });

    // Return structured error instead of silent failure
    return {
      success: false,
      error: {
        code: 'FEEDBACK_RECORDING_FAILED',
        message: 'Failed to record feedback',
        type: error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' ? 'retryable' : 'operational',
        retryable: error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED'
      }
    };
  }
}
```

**Improvements**:
- ✅ Returns structured result (success/error)
- ✅ Distinguishes between error types (user not found vs database error)
- ✅ Full error context for debugging
- ✅ Caller can handle errors appropriately

---

## Example 3: `server.js` - send_message Handler

### Before (Current Code)

```javascript
socket.on('send_message', async ({ text, isPreApprovedRewrite, originalRewrite, bypassMediation }) => {
  // ... existing code ...
  
  // Broadcast message normally if AI fails
  messageStore.saveMessage({
    ...message,
    roomId: user.roomId
  }).catch(err => {
    console.error('Error saving message to database:', err);
    // ❌ Error logged but operation continues - message may be lost
  });

  // ... rest of code ...

} catch (error) {
  console.error('Error in send_message handler:', error);
  socket.emit('error', { message: 'Failed to send message.' });  // ❌ Too vague
}
```

**Problems**:
- Promise chain without proper error handling
- Vague error message to client
- No error categorization
- Message may be broadcast but not saved

### After (Refactored)

```javascript
const { defaultLogger } = require('./src/utils/logger');
const { OperationalError, RetryableError } = require('./src/utils/errors');

socket.on('send_message', async ({ text, isPreApprovedRewrite, originalRewrite, bypassMediation }) => {
  const requestId = `${socket.id}-${Date.now()}`;
  const logger = defaultLogger.child({
    operation: 'send_message',
    socketId: socket.id,
    requestId,
    username: user?.username,
    roomId: user?.roomId
  });

  try {
    // ... existing code for message processing ...

    // Handle message saving with proper error handling
    try {
      await messageStore.saveMessage({
        ...message,
        roomId: user.roomId
      });
      logger.info('Message saved successfully', {
        messageId: message.id,
        roomId: user.roomId
      });
    } catch (saveError) {
      logger.error('Failed to save message to database', saveError, {
        messageId: message.id,
        roomId: user.roomId,
        textLength: text?.length
      });

      // Emit error to client but don't block message broadcast
      // This is a "best effort" approach - message is sent but may not persist
      socket.emit('error', {
        code: 'MESSAGE_SAVE_FAILED',
        message: 'Message sent but may not be saved. Please try again.',
        retryable: true,
        requestId
      });
    }

    // Broadcast to room
    io.to(user.roomId).emit('new_message', message);

  } catch (error) {
    logger.error('Error in send_message handler', error, {
      textLength: text?.length,
      bypassMediation,
      username: user?.username,
      roomId: user?.roomId,
      requestId
    });

    // Categorize error for appropriate client handling
    let errorResponse;
    if (error instanceof RetryableError) {
      errorResponse = {
        code: error.code,
        message: error.message,
        retryable: true,
        requestId
      };
    } else if (error instanceof OperationalError) {
      errorResponse = {
        code: error.code || 'MESSAGE_SEND_FAILED',
        message: error.message || 'Failed to send message. Please try again.',
        retryable: false,
        requestId
      };
    } else {
      // Unknown error - be conservative
      errorResponse = {
        code: 'MESSAGE_SEND_FAILED',
        message: 'An unexpected error occurred. Please try again.',
        retryable: true,  // Allow retry for unknown errors
        requestId
      };
    }

    socket.emit('error', errorResponse);
  }
});
```

**Improvements**:
- ✅ Request ID for tracking
- ✅ Structured error responses with codes
- ✅ Error categorization (retryable vs fatal)
- ✅ Proper async/await error handling
- ✅ Client can handle errors appropriately

---

## Example 4: `server.js` - Uncaught Exception Handlers

### Before (Current Code)

```javascript
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - let the server try to handle it
  // In production, you might want to exit after logging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - log and continue
});
```

**Problems**:
- Doesn't exit in production (should exit after logging)
- No graceful shutdown
- No error reporting to monitoring service

### After (Refactored)

```javascript
const { defaultLogger } = require('./src/utils/logger');

// Graceful shutdown handler
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  defaultLogger.warn('Received shutdown signal', { signal });

  // Give connections time to close
  setTimeout(() => {
    defaultLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  try {
    // Close server
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          defaultLogger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Close database connections
    // ... close DB connections ...

    defaultLogger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    defaultLogger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
}

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  defaultLogger.error('Uncaught exception - fatal error', error, {
    fatal: true,
    requiresRestart: true
  });

  // In production, exit after logging
  // In development, allow debugging
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  defaultLogger.error('Unhandled promise rejection', reason, {
    promise: promise.toString(),
    fatal: false,
    requiresRestart: false
  });

  // In production, log and continue (but monitor these)
  // These are often recoverable
  if (process.env.NODE_ENV === 'production') {
    // Could send to monitoring service here
  }
});

// Shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Improvements**:
- ✅ Graceful shutdown with timeout
- ✅ Proper exit in production
- ✅ Structured logging for monitoring
- ✅ Distinguishes fatal vs recoverable errors

---

## Summary

### Key Improvements Across All Examples

1. **Structured Logging**: All logs include context (operation, user, request ID)
2. **Error Categorization**: Errors classified as retryable, fatal, or operational
3. **Client Communication**: Structured error responses with codes and retry guidance
4. **Graceful Degradation**: Fail open for non-critical operations with monitoring
5. **Production Ready**: JSON logs in production, proper shutdown handling

### Migration Strategy

1. **Phase 1**: Create logger and error utilities (✅ Done)
2. **Phase 2**: Refactor critical paths (mediator, feedback, server handlers)
3. **Phase 3**: Update uncaught exception handlers
4. **Phase 4**: Gradually migrate remaining code
5. **Phase 5**: Add monitoring/alerting integration

---

**Last Updated**: 2025-01-27

