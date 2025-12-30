# Error Handling & Logging Analysis - chat-server

## 🔴 Issues Found

### 1. Swallowed Errors with Vague Messages

**Location**: Multiple files

**Examples**:

#### `mediator.js:1061-1064`

```javascript
} catch (error) {
  console.error('❌ Error in AI mediator:', error.message);
  return null;  // ❌ Swallows error, returns null without context
}
```

**Problems**:

- No error context (user, message, request ID)
- No stack trace logged
- Returns `null` without indicating what failed
- No error categorization (retryable vs fatal)

#### `feedbackLearner.js:58-60`

```javascript
} catch (error) {
  console.error('Error recording explicit feedback:', error.message);
  // ❌ Silent failure - no indication to caller that operation failed
}
```

**Problems**:

- Silent failure - caller doesn't know operation failed
- No error context (username, feedback type)
- No retry mechanism
- No monitoring/alerting

#### `contactIntelligence.js:97-99`

```javascript
} catch (error) {
  console.error('Error detecting contact mentions:', error.message);
  return null;  // ❌ Swallows error, loses context
}
```

**Problems**:

- No context about what message was being analyzed
- No distinction between API errors vs parsing errors
- Returns null without explanation

### 2. Missing Try/Catch or Improper Promise Handling

#### `server.js:1825-1830`

```javascript
messageStore
  .saveMessage({
    ...message,
    roomId: user.roomId,
  })
  .catch(err => {
    console.error('Error saving message to database:', err);
    // ❌ Error logged but operation continues - message may be lost
  });
```

**Problems**:

- Promise chain without proper error handling
- Error logged but operation continues
- No retry mechanism
- No user notification
- Message may be broadcast but not saved

#### `server.js:1805-1815`

```javascript
setImmediate(async () => {
  try {
    // ...
    await aiMediator.extractRelationshipInsights(context.recentMessages, user.roomId);
  } catch (insightErr) {
    console.error('Error extracting relationship insights:', insightErr);
    // ❌ Error swallowed, no context, no retry
  }
});
```

**Problems**:

- Fire-and-forget async operation
- No error context (roomId, message count)
- No retry mechanism
- No monitoring

### 3. Production-Inappropriate console.log Statements

#### `client.js:100`

```javascript
console.log(
  `✅ OpenAI request completed in ${duration}ms (model: ${params.model}, tokens: ${response.usage?.total_tokens || 'unknown'})`
);
```

**Problems**:

- Uses emoji (not production-appropriate)
- No structured logging
- No log levels
- Can't be filtered/monitored easily

#### `mediator.js:1053`

```javascript
console.log(`🤖 AI Mediator: Unknown action "${action}" - defaulting to STAY_SILENT`);
```

**Problems**:

- Should be `warn` or `error` level
- No structured data
- Can't be queried/monitored

#### `server.js:1822`

```javascript
console.log(`⚠️ AI moderation failed for ${user.username} - allowing message through (fail open)`);
```

**Problems**:

- Should be `warn` level
- No structured data
- No error categorization

### 4. Vague Error Messages

#### `server.js:1843-1844`

```javascript
} catch (error) {
  console.error('Error in send_message handler:', error);
  socket.emit('error', { message: 'Failed to send message.' });  // ❌ Too vague
}
```

**Problems**:

- User gets generic "Failed to send message"
- No indication of what went wrong
- No error code for client handling
- No retry guidance

#### `codeLayer/index.js:224`

```javascript
console.error('[CodeLayer] ❌ Parse error:', error.message);
```

**Problems**:

- No context about what message failed
- No stack trace
- No error categorization

### 5. Uncaught Exception Handling

#### `server.js:8511-8522`

```javascript
process.on('uncaughtException', error => {
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
- No distinction between recoverable and fatal errors

---

## ✅ Proposed Error Handling & Logging Pattern

### Core Principles

1. **Structured Logging**: Use structured logs with consistent fields
2. **Error Context**: Always include context (user, request ID, operation)
3. **Error Categorization**: Distinguish retryable vs fatal errors
4. **Graceful Degradation**: Fail gracefully with fallbacks when possible
5. **Monitoring Ready**: Logs should be queryable and monitorable

### Logger Utility

Create a centralized logger with:

- Log levels (error, warn, info, debug)
- Structured output (JSON in production)
- Context injection (request ID, user, operation)
- Error categorization

### Error Types

```javascript
// Error categories
const ERROR_TYPES = {
  RETRYABLE: 'retryable', // Can be retried (network, rate limits)
  FATAL: 'fatal', // Should not be retried (auth, validation)
  OPERATIONAL: 'operational', // Expected errors (not found, validation)
};
```

### Error Response Pattern

```javascript
// Consistent error response structure
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly message',
    type: 'retryable' | 'fatal' | 'operational',
    context: { /* operation context */ },
    retryable: boolean,
    timestamp: ISO8601
  }
}
```

---

## 📋 Implementation Plan

### Step 1: Create Logger Utility

**File**: `chat-server/src/utils/logger.js`

```javascript
/**
 * Structured Logger for Production
 *
 * Features:
 * - Log levels (error, warn, info, debug)
 * - Structured JSON output in production
 * - Context injection (request ID, user, operation)
 * - Error categorization
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

const ERROR_TYPES = {
  RETRYABLE: 'retryable',
  FATAL: 'fatal',
  OPERATIONAL: 'operational',
};

class Logger {
  constructor(context = {}) {
    this.context = context;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext) {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log error with full context
   */
  error(message, error, metadata = {}) {
    const logEntry = {
      level: LOG_LEVELS.ERROR,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        type: this._categorizeError(error),
      };
    }

    this._output(logEntry);
    return logEntry;
  }

  /**
   * Log warning
   */
  warn(message, metadata = {}) {
    this._output({
      level: LOG_LEVELS.WARN,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log info
   */
  info(message, metadata = {}) {
    this._output({
      level: LOG_LEVELS.INFO,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...metadata,
    });
  }

  /**
   * Log debug (only in development)
   */
  debug(message, metadata = {}) {
    if (!this.isProduction) {
      this._output({
        level: LOG_LEVELS.DEBUG,
        message,
        timestamp: new Date().toISOString(),
        ...this.context,
        ...metadata,
      });
    }
  }

  /**
   * Categorize error type
   */
  _categorizeError(error) {
    // Network/timeout errors are retryable
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return ERROR_TYPES.RETRYABLE;
    }

    // Rate limit errors are retryable
    if (error.status === 429) {
      return ERROR_TYPES.RETRYABLE;
    }

    // Auth errors are fatal
    if (error.status === 401 || error.status === 403) {
      return ERROR_TYPES.FATAL;
    }

    // Validation errors are operational
    if (error.name === 'ValidationError' || error.status === 400) {
      return ERROR_TYPES.OPERATIONAL;
    }

    // Server errors (5xx) are retryable
    if (error.status >= 500) {
      return ERROR_TYPES.RETRYABLE;
    }

    // Default to operational
    return ERROR_TYPES.OPERATIONAL;
  }

  /**
   * Output log entry
   */
  _output(entry) {
    if (this.isProduction) {
      // JSON structured logging for production
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print for development
      const emoji =
        {
          error: '❌',
          warn: '⚠️',
          info: '✅',
          debug: '🔍',
        }[entry.level] || '📝';
      console.log(`${emoji} [${entry.level.toUpperCase()}] ${entry.message}`, entry);
    }
  }
}

// Create default logger instance
const defaultLogger = new Logger({
  service: 'chat-server',
  environment: process.env.NODE_ENV || 'development',
});

module.exports = {
  Logger,
  defaultLogger,
  ERROR_TYPES,
  LOG_LEVELS,
};
```

### Step 2: Create Error Utility

**File**: `chat-server/src/utils/errors.js`

```javascript
/**
 * Custom Error Classes and Error Handling Utilities
 */

const { ERROR_TYPES } = require('./logger');

/**
 * Base application error
 */
class AppError extends Error {
  constructor(message, code, type = ERROR_TYPES.OPERATIONAL, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;
    this.metadata = metadata;
    this.retryable = type === ERROR_TYPES.RETRYABLE;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        type: this.type,
        retryable: this.retryable,
        context: this.metadata,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Retryable errors (network, rate limits, temporary failures)
 */
class RetryableError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.RETRYABLE, metadata);
  }
}

/**
 * Fatal errors (auth, configuration, validation)
 */
class FatalError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.FATAL, metadata);
  }
}

/**
 * Operational errors (expected errors like not found, validation)
 */
class OperationalError extends AppError {
  constructor(message, code, metadata = {}) {
    super(message, code, ERROR_TYPES.OPERATIONAL, metadata);
  }
}

/**
 * Wrap async function with error handling
 */
function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log error with context
      const logger = require('./logger').defaultLogger.child(context);
      logger.error(`Error in ${fn.name || 'async function'}`, error, {
        args: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg).substring(0, 100) : String(arg)
        ),
      });

      // Re-throw if it's already an AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Wrap unknown errors
      throw new OperationalError(
        error.message || 'An unexpected error occurred',
        'INTERNAL_ERROR',
        { originalError: error.name }
      );
    }
  };
}

module.exports = {
  AppError,
  RetryableError,
  FatalError,
  OperationalError,
  withErrorHandling,
};
```

---

## 🔧 Example Refactorings

### Example 1: `mediator.js` - analyzeMessage

**Before**:

```javascript
} catch (error) {
  console.error('❌ Error in AI mediator:', error.message);
  return null;
}
```

**After**:

```javascript
const { defaultLogger } = require('../utils/logger');
const { OperationalError, RetryableError } = require('../utils/errors');

async function analyzeMessage(
  message,
  recentMessages,
  participantUsernames = [],
  existingContacts = [],
  contactContextForAI = null,
  roomId = null,
  taskContextForAI = null,
  flaggedMessagesContext = null,
  roleContext = null
) {
  const logger = defaultLogger.child({
    operation: 'analyzeMessage',
    roomId,
    messageId: message?.id,
    username: message?.username,
  });

  try {
    // ... existing code ...
  } catch (error) {
    logger.error('AI mediator analysis failed', error, {
      messageLength: message?.length,
      recentMessagesCount: recentMessages?.length,
    });

    // Categorize error
    if (error.status === 429 || error.code === 'ETIMEDOUT') {
      throw new RetryableError(
        'AI analysis temporarily unavailable, please try again',
        'AI_RATE_LIMIT',
        { roomId, username: message?.username }
      );
    }

    // Return null for graceful degradation (fail open)
    // But log with full context for monitoring
    logger.warn('AI mediator failed, allowing message through (fail open)', {
      errorType: error.name,
      errorCode: error.code,
    });

    return null;
  }
}
```

### Example 2: `feedbackLearner.js` - recordExplicitFeedback

**Before**:

```javascript
} catch (error) {
  console.error('Error recording explicit feedback:', error.message);
}
```

**After**:

```javascript
const { defaultLogger } = require('../../utils/logger');
const { OperationalError, withErrorHandling } = require('../../utils/errors');

async function recordExplicitFeedback(username, feedbackType, context, reason = null) {
  const logger = defaultLogger.child({
    operation: 'recordExplicitFeedback',
    username,
    feedbackType,
  });

  try {
    const db = await require('../../../db').getDb();

    // Get user ID
    const userResult = await dbSafe.safeSelect(
      'users',
      { username: username.toLowerCase() },
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    if (users.length === 0) {
      logger.warn('User not found for feedback recording', { username });
      return { success: false, error: 'USER_NOT_FOUND' };
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
      created_at: new Date().toISOString(),
    });

    logger.info('Feedback recorded successfully', {
      userId,
      feedbackType,
      hasReason: !!reason,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to record explicit feedback', error, {
      username,
      feedbackType,
      hasContext: !!context,
    });

    // Return error info instead of silent failure
    return {
      success: false,
      error: {
        code: 'FEEDBACK_RECORDING_FAILED',
        message: 'Failed to record feedback',
        retryable: error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED',
      },
    };
  }
}
```

### Example 3: `server.js` - send_message handler

**Before**:

```javascript
} catch (error) {
  console.error('Error in send_message handler:', error);
  socket.emit('error', { message: 'Failed to send message.' });
}
```

**After**:

```javascript
const { defaultLogger } = require('./src/utils/logger');
const { OperationalError, RetryableError } = require('./src/utils/errors');

socket.on(
  'send_message',
  async ({ text, isPreApprovedRewrite, originalRewrite, bypassMediation }) => {
    const requestId = `${socket.id}-${Date.now()}`;
    const logger = defaultLogger.child({
      operation: 'send_message',
      socketId: socket.id,
      requestId,
      username: user?.username,
    });

    try {
      // ... existing code ...

      // Handle message saving with proper error handling
      try {
        await messageStore.saveMessage({
          ...message,
          roomId: user.roomId,
        });
        logger.info('Message saved successfully', { messageId: message.id });
      } catch (saveError) {
        logger.error('Failed to save message to database', saveError, {
          messageId: message.id,
          roomId: user.roomId,
        });

        // Emit error to client but don't block message broadcast
        socket.emit('error', {
          code: 'MESSAGE_SAVE_FAILED',
          message: 'Message sent but may not be saved. Please try again.',
          retryable: true,
        });
      }
    } catch (error) {
      logger.error('Error in send_message handler', error, {
        textLength: text?.length,
        bypassMediation,
        username: user?.username,
      });

      // Categorize error for client
      let errorResponse;
      if (error instanceof RetryableError) {
        errorResponse = {
          code: error.code,
          message: error.message,
          retryable: true,
        };
      } else {
        errorResponse = {
          code: 'MESSAGE_SEND_FAILED',
          message: 'Failed to send message. Please try again.',
          retryable: false,
        };
      }

      socket.emit('error', errorResponse);
    }
  }
);
```

---

## 📊 Summary

### Issues Found

1. **Swallowed Errors**: 8+ instances of errors caught and silently ignored
2. **Vague Messages**: 10+ instances of generic error messages without context
3. **Missing Try/Catch**: 5+ instances of unhandled promises or async operations
4. **Production Logging**: 60+ console.log statements that need structured logging
5. **Error Handling**: Uncaught exception handlers don't exit in production

### Recommended Pattern

1. **Structured Logger**: JSON logs in production, pretty print in development
2. **Error Categorization**: Retryable vs Fatal vs Operational
3. **Context Injection**: Always include operation, user, request ID
4. **Graceful Degradation**: Fail open for non-critical operations
5. **Client Communication**: Structured error responses with codes and retry guidance

### Next Steps

1. Create `logger.js` utility
2. Create `errors.js` utility
3. Refactor 2-3 critical paths (mediator, feedback, server handlers)
4. Update uncaught exception handlers
5. Gradually migrate remaining code

---

**Last Updated**: 2025-01-27
