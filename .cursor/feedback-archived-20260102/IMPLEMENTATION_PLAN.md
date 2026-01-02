# Implementation Plan: Error Handling & Pattern Management

## Quick Start: Phase 1 (This Week)

### Step 1: Extract Patterns to Config (2 hours)

**Create pattern config files:**

```bash
mkdir -p chat-client-vite/src/config/patterns
mkdir -p chat-server/src/config/patterns
```

**File: `chat-client-vite/src/config/patterns/index.js`**

```javascript
export { POLITE_REQUEST_PATTERNS } from './polite-requests.js';
export { POSITIVE_PATTERNS } from './positive-messages.js';
export { SIMPLE_RESPONSES } from './simple-responses.js';
```

**File: `chat-client-vite/src/config/patterns/polite-requests.js`**

```javascript
export const POLITE_REQUEST_PATTERNS = [
  /\b(I was wondering if|would it be okay if|would you mind if|could I|can I|may I)\b/i,
  /\b(I know it'?s your|I know its your|I know you have)\b.*\b(but|and)\b/i,
  /\b(would it be possible|is it possible|is it okay if)\b/i,
  /\b(do you think|would you be open to|would you consider)\b/i,
  /\b(I'?d like to|I would like to)\b.*\b(if that'?s okay|if that works|if you don'?t mind)\b/i,
  /\b(can we|could we|shall we)\b.*\b(talk about|discuss|arrange|schedule|plan)\b/i,
  /\b(just wanted to ask|just checking if|quick question)\b/i,
  /\b(let me know if|let me know what you think)\b/i,
];
```

**File: `chat-client-vite/src/config/patterns/positive-messages.js`**

```javascript
export const POSITIVE_PATTERNS = [
  /\b(thank|thanks)\s+(you|so much|for)\b/i,
  /\b(sounds good|perfect|great|awesome)\b/i,
  /\b(appreciate|grateful)\b/i,
];
```

**File: `chat-client-vite/src/config/patterns/simple-responses.js`**

```javascript
export const SIMPLE_RESPONSES = [
  'ok',
  'okay',
  'sure',
  'yes',
  'no',
  'got it',
  'sounds good',
  'thanks',
  'thank you',
];
```

**Update `messageAnalyzer.js`:**

```javascript
// Replace hardcoded arrays with imports
import {
  POLITE_REQUEST_PATTERNS,
  POSITIVE_PATTERNS,
  SIMPLE_RESPONSES,
} from '../../config/patterns';
```

### Step 2: Error Classification (3 hours)

**Create error classification service:**

**File: `chat-client-vite/src/services/errorHandling/ErrorClassificationService.js`**

```javascript
export const ErrorCategory = {
  CRITICAL: 'critical', // Must fail-closed
  NETWORK: 'network', // Retryable
  RATE_LIMIT: 'rate_limit', // Retryable with backoff
  VALIDATION: 'validation', // Fail-closed
  SYSTEM: 'system', // Fail-open with logging
};

export function classifyError(error) {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return { category: ErrorCategory.NETWORK, retryable: true };
  }

  // Rate limit errors
  if (error.status === 429 || error.message.includes('rate limit')) {
    return { category: ErrorCategory.RATE_LIMIT, retryable: true };
  }

  // Validation errors
  if (error.status === 400 || error.name === 'ValidationError') {
    return { category: ErrorCategory.VALIDATION, retryable: false };
  }

  // Critical safety errors (if we add them)
  if (error.code === 'SAFETY_CHECK_FAILED') {
    return { category: ErrorCategory.CRITICAL, retryable: false };
  }

  // Default: system error
  return { category: ErrorCategory.SYSTEM, retryable: false };
}
```

**File: `chat-client-vite/src/services/errorHandling/ErrorHandlingStrategy.js`**

```javascript
import { ErrorCategory, classifyError } from './ErrorClassificationService.js';

export const HandlingStrategy = {
  FAIL_CLOSED: 'fail_closed', // Block message
  FAIL_OPEN: 'fail_open', // Allow message
  RETRY: 'retry', // Retry with backoff
};

export function determineStrategy(error, retryCount = 0) {
  const { category, retryable } = classifyError(error);

  // Critical errors: always fail-closed
  if (category === ErrorCategory.CRITICAL) {
    return {
      strategy: HandlingStrategy.FAIL_CLOSED,
      notifyUser: true,
      message: 'Message blocked due to safety check failure',
    };
  }

  // Validation errors: fail-closed
  if (category === ErrorCategory.VALIDATION) {
    return {
      strategy: HandlingStrategy.FAIL_CLOSED,
      notifyUser: true,
      message: error.message || 'Invalid message format',
    };
  }

  // Retryable errors: retry up to 3 times
  if (retryable && retryCount < 3) {
    return {
      strategy: HandlingStrategy.RETRY,
      retryAfter: calculateBackoff(retryCount),
      notifyUser: false,
    };
  }

  // After retries or non-retryable: fail-open with warning
  return {
    strategy: HandlingStrategy.FAIL_OPEN,
    notifyUser: true,
    message: 'Analysis temporarily unavailable. Message will be sent without analysis.',
    logError: true,
  };
}

function calculateBackoff(retryCount) {
  // Exponential backoff: 1s, 2s, 4s
  return Math.pow(2, retryCount) * 1000;
}
```

### Step 3: User Notifications (2 hours)

**Create notification service:**

**File: `chat-client-vite/src/services/errorHandling/ErrorNotificationService.js`**

```javascript
export class ErrorNotificationService {
  static showWarning(message, duration = 5000) {
    // Create a warning banner
    const banner = document.createElement('div');
    banner.className = 'error-notification warning';
    banner.textContent = message;
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => banner.remove(), 300);
    }, duration);
  }

  static showError(message, duration = 7000) {
    // Similar to showWarning but with error styling
    const banner = document.createElement('div');
    banner.className = 'error-notification error';
    banner.textContent = message;
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, duration);
  }
}
```

### Step 4: Update messageAnalyzer.js (1 hour)

**Replace error handling:**

```javascript
import { determineStrategy } from '../services/errorHandling/ErrorHandlingStrategy.js';
import { ErrorNotificationService } from '../services/errorHandling/ErrorNotificationService.js';

export async function analyzeMessage(messageText, senderProfile = {}, receiverProfile = {}) {
  let retryCount = 0;

  while (retryCount < 3) {
    try {
      const response = await apiPost('/api/mediate/analyze', {
        text: messageText,
        senderProfile,
        receiverProfile,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const strategy = determineStrategy(error, retryCount);

      // Retry logic
      if (strategy.strategy === 'retry') {
        await new Promise(resolve => setTimeout(resolve, strategy.retryAfter));
        retryCount++;
        continue;
      }

      // Fail-closed: block message
      if (strategy.strategy === 'fail_closed') {
        if (strategy.notifyUser) {
          ErrorNotificationService.showError(strategy.message);
        }
        throw new Error(strategy.message);
      }

      // Fail-open: allow message with warning
      if (strategy.strategy === 'fail_open') {
        if (strategy.notifyUser) {
          ErrorNotificationService.showWarning(strategy.message);
        }
        if (strategy.logError) {
          console.error('[messageAnalyzer] Fail-open error:', error);
          // TODO: Send to logging service
        }

        // Return safe default
        return {
          action: 'STAY_SILENT',
          escalation: { riskLevel: 'low', confidence: 0, reasons: [] },
          emotion: {
            currentEmotion: 'neutral',
            stressLevel: 0,
            stressTrajectory: 'stable',
            emotionalMomentum: 0,
            triggers: [],
            conversationEmotion: 'neutral',
          },
          intervention: null,
          error: error.message,
          failOpen: true, // Flag for tracking
        };
      }
    }
  }
}
```

---

## Phase 2: Backend Pattern Unification (Next Week)

### Step 1: Create Shared Pattern Config

**File: `chat-server/src/config/patterns/index.js`**

```javascript
// Export patterns that match frontend
export { POLITE_REQUEST_PATTERNS } from './polite-requests.js';
export { POSITIVE_PATTERNS } from './positive-messages.js';
export { SIMPLE_RESPONSES } from './simple-responses.js';
```

**Update `preFilters.js`:**

```javascript
import { POLITE_REQUEST_PATTERNS, POSITIVE_PATTERNS, SIMPLE_RESPONSES } from '../config/patterns';
```

### Step 2: Pattern Service (Optional)

**File: `chat-server/src/services/PatternService.js`**

```javascript
class PatternService {
  constructor() {
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    // Load from config files
    return {
      politeRequests: require('../config/patterns/polite-requests'),
      positiveMessages: require('../config/patterns/positive-messages'),
      simpleResponses: require('../config/patterns/simple-responses'),
    };
  }

  testMessage(messageText) {
    const results = {
      isPoliteRequest: this.patterns.politeRequests.some(p => p.test(messageText)),
      isPositive: this.patterns.positiveMessages.some(p => p.test(messageText)),
      isSimpleResponse: this.patterns.simpleResponses.includes(messageText.toLowerCase().trim()),
    };

    return results;
  }
}
```

---

## Testing Checklist

- [ ] Patterns extracted to config files
- [ ] `messageAnalyzer.js` uses imported patterns
- [ ] Error classification works for all error types
- [ ] User sees warning when fail-open occurs
- [ ] User sees error when fail-closed occurs
- [ ] Retry logic works (network errors)
- [ ] Logging captures fail-open events
- [ ] Backend patterns match frontend patterns

---

## Rollout Plan

1. **Week 1**: Extract patterns, add error classification
2. **Week 2**: Add user notifications, update error handling
3. **Week 3**: Backend pattern unification
4. **Week 4**: Testing, monitoring, refinement

---

## Success Criteria

✅ Zero hardcoded patterns in logic files  
✅ All errors classified and handled appropriately  
✅ Users notified when safety features bypassed  
✅ Fail-open events logged and tracked  
✅ Patterns synchronized between frontend/backend
