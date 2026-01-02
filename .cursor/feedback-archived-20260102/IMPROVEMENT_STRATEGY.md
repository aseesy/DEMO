# Improvement Strategy: Error Handling & Pattern Management

## Problem Summary

Based on feedback analysis, two critical areas need attention:

1. **Error Handling Strategy** - Fail-open behavior may bypass safety features
2. **Pattern Management** - Hardcoded arrays scattered across codebase

---

## 1. Error Handling Strategy

### Current Issues

**Location 1: `messageAnalyzer.js` (Frontend)**

```javascript
catch (error) {
  // On error, default to PASS (allow message through)
  return { action: 'STAY_SILENT', ... }; // Fail-open
}
```

**Location 2: `useSendMessage.refactored.js`**

```javascript
catch (error) {
  // Fail open - allow message through
  await sendValidatedMessage(clean);
}
```

**Location 3: `mediatorErrors.js` (Backend)**

```javascript
// For non-retryable errors, fail open (allow message through)
return { shouldFailOpen: true };
```

### Problems

- ❌ Safety features silently bypassed during outages
- ❌ No user notification when analysis fails
- ❌ No logging/metrics for fail-open events
- ❌ No distinction between critical vs non-critical failures

### Proposed Strategy

#### A. Error Classification System

Create error categories with different handling strategies:

```javascript
// Error Categories
const ErrorCategory = {
  CRITICAL: 'critical', // Must fail-closed (safety risk)
  NETWORK: 'network', // Retryable, then fail-open with warning
  RATE_LIMIT: 'rate_limit', // Retryable, then fail-open with warning
  VALIDATION: 'validation', // Fail-closed (invalid input)
  SYSTEM: 'system', // Fail-open with logging
};
```

#### B. Fail-Open vs Fail-Closed Decision Matrix

| Error Type       | Initial Action       | Retry? | After Retry   | User Notification     |
| ---------------- | -------------------- | ------ | ------------- | --------------------- |
| Critical Safety  | Fail-Closed          | No     | Block message | Show error + reason   |
| Network Error    | Retry (3x)           | Yes    | Fail-Open     | Show warning banner   |
| Rate Limit       | Retry (with backoff) | Yes    | Fail-Open     | Show warning banner   |
| Validation Error | Fail-Closed          | No     | Block message | Show validation error |
| System Error     | Log + Fail-Open      | No     | Allow message | Silent (logged)       |

#### C. Implementation Plan

**Phase 1: Error Classification** (Week 1)

1. Create `ErrorClassificationService`
2. Categorize all existing error types
3. Add error metadata (retryable, critical, etc.)

**Phase 2: User Notification** (Week 1-2)

1. Create `ErrorNotificationService`
2. Add warning banners for fail-open scenarios
3. Add error messages for fail-closed scenarios

**Phase 3: Logging & Metrics** (Week 2)

1. Add structured logging for all error paths
2. Track fail-open vs fail-closed rates
3. Alert on high fail-open rates

**Phase 4: Configuration** (Week 2-3)

1. Add environment-based error handling config
2. Allow per-deployment strategy (staging vs production)
3. Add feature flags for gradual rollout

### Code Structure

```
src/services/errorHandling/
  ├── ErrorClassificationService.js    # Categorize errors
  ├── ErrorHandlingStrategy.js         # Decision logic
  ├── ErrorNotificationService.js      # User notifications
  └── errorTypes.js                    # Error definitions
```

---

## 2. Pattern Management Strategy

### Current Issues

**Location 1: `messageAnalyzer.js` (Frontend)**

```javascript
const POLITE_REQUEST_PATTERNS = [
  /* hardcoded */
];
const POSITIVE_PATTERNS = [
  /* hardcoded */
];
const SIMPLE_RESPONSES = [
  /* hardcoded */
];
```

**Location 2: `preFilters.js` (Backend)**

```javascript
const ALLOWED_POLITE = [
  /* hardcoded */
];
// Similar patterns scattered
```

**Location 3: `language-analyzer/patterns/` (Backend)**

- Multiple pattern files with hardcoded arrays
- No central management
- Difficult to update/maintain

### Problems

- ❌ Patterns duplicated across frontend/backend
- ❌ No single source of truth
- ❌ Hard to test patterns in isolation
- ❌ No versioning or A/B testing capability
- ❌ Patterns mixed with business logic

### Proposed Strategy

#### A. Centralized Pattern Configuration

Create a pattern management system:

```
src/config/patterns/
  ├── index.js                    # Main export
  ├── polite-requests.js          # Polite request patterns
  ├── positive-messages.js       # Positive message patterns
  ├── simple-responses.js        # Simple response patterns
  ├── conflict-patterns.js       # Conflict detection patterns
  └── pattern-utils.js           # Pattern utilities (test, validate)
```

#### B. Pattern Structure

```javascript
// patterns/polite-requests.js
export const POLITE_REQUEST_PATTERNS = {
  version: '1.0.0',
  patterns: [
    {
      id: 'polite-request-1',
      regex: /\b(I was wondering if|would it be okay if)\b/i,
      description: 'Polite inquiry patterns',
      category: 'request',
      enabled: true,
      priority: 1,
    },
    // ...
  ],
  metadata: {
    lastUpdated: '2025-01-27',
    maintainer: 'ai-team',
    testCases: [
      { input: 'I was wondering if we could...', expected: true },
      // ...
    ],
  },
};
```

#### C. Pattern Service

```javascript
// services/PatternService.js
class PatternService {
  // Load patterns from config
  // Validate patterns
  // Test patterns against messages
  // Enable/disable patterns dynamically
  // Version patterns
  // A/B test patterns
}
```

#### D. Implementation Plan

**Phase 1: Extract Patterns** (Week 1)

1. Create `src/config/patterns/` directory
2. Extract all hardcoded patterns to config files
3. Create pattern structure with metadata

**Phase 2: Pattern Service** (Week 1-2)

1. Create `PatternService` class
2. Add pattern loading/validation
3. Add pattern testing utilities

**Phase 3: Unification** (Week 2)

1. Replace hardcoded arrays with PatternService
2. Ensure frontend/backend use same patterns
3. Add pattern synchronization check

**Phase 4: Advanced Features** (Week 3+)

1. Pattern versioning
2. A/B testing framework
3. Pattern analytics (which patterns match most)
4. Dynamic pattern updates (without code deploy)

### Code Structure

```
src/
  ├── config/
  │   └── patterns/              # Pattern definitions
  │       ├── index.js
  │       ├── polite-requests.js
  │       ├── positive-messages.js
  │       └── ...
  ├── services/
  │   └── PatternService.js      # Pattern management
  └── utils/
      └── pattern-utils.js       # Pattern utilities
```

---

## 3. Implementation Priority

### High Priority (Do First)

1. ✅ **Error Classification** - Categorize errors properly
2. ✅ **User Notifications** - Warn users when safety features bypassed
3. ✅ **Pattern Extraction** - Move patterns to config files

### Medium Priority (Do Next)

4. ⚠️ **Error Logging** - Structured logging for all error paths
5. ⚠️ **Pattern Service** - Centralized pattern management
6. ⚠️ **Pattern Testing** - Test patterns in isolation

### Low Priority (Nice to Have)

7. 📋 **Error Metrics** - Track fail-open rates
8. 📋 **Pattern Versioning** - Version control for patterns
9. 📋 **A/B Testing** - Test pattern effectiveness

---

## 4. Success Metrics

### Error Handling

- ✅ Zero silent fail-open events (all logged)
- ✅ 100% user notification rate for fail-open
- ✅ <5% fail-open rate (target: <1%)
- ✅ Error categorization coverage: 100%

### Pattern Management

- ✅ Zero hardcoded patterns in logic files
- ✅ Single source of truth for all patterns
- ✅ Pattern test coverage: >80%
- ✅ Pattern update time: <5 minutes (no deploy needed)

---

## 5. Next Steps

1. **Review this strategy** - Get approval on approach
2. **Create tickets** - Break down into actionable tasks
3. **Start with Phase 1** - Error classification + pattern extraction
4. **Iterate** - Get feedback, adjust approach

---

## 6. Questions to Answer

- [ ] What's the acceptable fail-open rate? (Target: <1%)
- [ ] Should fail-open require user confirmation?
- [ ] How often should patterns be updated?
- [ ] Should patterns be database-driven or file-based?
- [ ] Do we need pattern A/B testing?

---

## References

- Feedback entries: `.cursor/feedback/feedback.json`
- Current error handling: `mediatorErrors.js`, `messageAnalyzer.js`
- Current patterns: `messageAnalyzer.js`, `preFilters.js`
