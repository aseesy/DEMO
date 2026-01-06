# Backend Test Failures - Root Cause Analysis

## Summary

**12 test suites failing (142 tests)** due to incorrect import statements in entity tests and missing factory method.

---

## Root Cause #1: Incorrect Import Statements in Entity Tests

### Problem

All entity test files use **destructuring imports** for entities that are exported as **default exports**.

### Evidence

```javascript
// ❌ WRONG - Test files use destructuring
const { Task } = require('../Task');
const { Room } = require('../Room');
const { Contact } = require('../Contact');
const { User } = require('../User');

// ✅ CORRECT - Entity files export as default
module.exports = Task;
module.exports = Room;
module.exports = Contact;
module.exports = User;
```

### Verification

```bash
# This returns undefined (wrong)
node -e "const { Task } = require('./src/domain/entities/Task'); console.log('Task:', Task);"
# Output: Task: undefined

# This works (correct)
node -e "const Task = require('./src/domain/entities/Task'); console.log('Task:', typeof Task);"
# Output: Task: function
```

### Impact

- **Task.test.js**: All 25 tests failing with `TypeError: Task is not a constructor`
- **Room.test.js**: All 25 tests failing with `TypeError: Room is not a constructor`
- **Contact.test.js**: All 24 tests failing with `TypeError: Contact is not a constructor`
- **User.test.js**: All 18 tests failing with `TypeError: User is not a constructor`

### Solution

Change all entity test imports from destructuring to default import:

**Before:**

```javascript
const { Task } = require('../Task');
```

**After (Option 1 - Direct import):**

```javascript
const Task = require('../Task');
```

**After (Option 2 - Via index):**

```javascript
const { Task } = require('../index');
```

---

## Root Cause #2: Incomplete Factory Mock in Tests

### Problem

`threadManager.test.js` mocks `ThreadServiceFactory` but the mock is missing several factory methods that `threadManager.js` uses.

### Evidence

```javascript
// threadManager.js lines 41-43 (uses these methods)
const archiveThreadUseCase = factory.getArchiveThreadUseCase();
const replyInThreadUseCase = factory.getReplyInThreadUseCase();
const moveMessageToThreadUseCase = factory.getMoveMessageToThreadUseCase();
```

```javascript
// threadManager.test.js lines 60-67 (mock only includes these)
factory: {
  getThreadRepository: () => mockThreadRepository,
  getConversationAnalyzer: () => mockConversationAnalyzer,
  getCreateThreadUseCase: () => mockCreateThreadUseCase,
  getAnalyzeConversationUseCase: jest.fn(),
  getSuggestThreadUseCase: jest.fn(),
  getAutoAssignMessageUseCase: jest.fn(),
  // ❌ MISSING: getArchiveThreadUseCase
  // ❌ MISSING: getReplyInThreadUseCase
  // ❌ MISSING: getMoveMessageToThreadUseCase
}
```

### Root Cause

The test mock is incomplete - it doesn't include all the factory methods that `threadManager.js` requires at module load time.

### Impact

- **threadManager.test.js**: Test suite fails to run with `TypeError: factory.getArchiveThreadUseCase is not a function`

### Solution

Add the missing factory methods to the test mock:

```javascript
factory: {
  getThreadRepository: () => mockThreadRepository,
  getConversationAnalyzer: () => mockConversationAnalyzer,
  getCreateThreadUseCase: () => mockCreateThreadUseCase,
  getAnalyzeConversationUseCase: jest.fn(),
  getSuggestThreadUseCase: jest.fn(),
  getAutoAssignMessageUseCase: jest.fn(),
  getArchiveThreadUseCase: jest.fn(), // ✅ ADD THIS
  getReplyInThreadUseCase: jest.fn(), // ✅ ADD THIS
  getMoveMessageToThreadUseCase: jest.fn(), // ✅ ADD THIS
}
```

---

## Root Cause #3: Message Service Test - Thread Room Validation

### Problem

Test expects thread to have `room_id` but mock returns `undefined`.

### Evidence

```javascript
// Error in messageService.test.js
Thread belongs to different room. Thread room: undefined, Message room: room-456
```

### Root Cause

The test mock for thread repository doesn't set `room_id` in the returned thread object.

### Impact

- **messageService.test.js**: 1 test failing - "should handle messages with thread information"

### Solution

Update the test mock to include `room_id` in the thread result.

---

## Root Cause #4: AI Mediator Test - Null Result

### Problem

Test expects result object but receives `null`.

### Evidence

```javascript
// Error in mediator.test.js
TypeError: Cannot read properties of null (reading 'type')
expect(result.type).toBe('ai_intervention');
```

### Root Cause

The `analyzeMessage` method is returning `null` instead of an intervention result object. This could be due to:

- Error handling returning null
- Test setup not properly mocking dependencies
- Logic path that returns null instead of throwing or returning a result

### Impact

- **mediator.test.js**: 1 test failing - "should return INTERVENE result with rewrites"

### Solution

Investigate why `analyzeMessage` returns null and fix the logic or test setup.

---

## Root Cause #5: Socket Handler Tests - Async Function Issues

### Problem

`validateActiveUser` returns a Promise but tests expect synchronous result.

### Evidence

```javascript
// Error in messageOperations.test.js
expect(received).toEqual(expected)
Expected: { valid: true, user: {...} }
Received: Promise {}
```

### Root Cause

`validateActiveUser` was likely refactored to be async but tests weren't updated to handle promises.

### Impact

- **messageOperations.test.js**: 3 tests failing related to `validateActiveUser`

### Solution

Update tests to use `await` or `.then()` to handle the Promise.

---

## Summary of Fixes Required

### High Priority (Blocking 92 tests)

1. **Fix entity test imports** (4 files)
   - `src/domain/entities/__tests__/Task.test.js`
   - `src/domain/entities/__tests__/Room.test.js`
   - `src/domain/entities/__tests__/Contact.test.js`
   - `src/domain/entities/__tests__/User.test.js`
   - Change from `const { Entity } = require('../Entity')` to `const Entity = require('../Entity')`

### Medium Priority (Blocking 1 test suite)

2. **Fix threadManager factory usage**
   - Verify factory initialization in `threadManager.js`
   - Ensure `getArchiveThreadUseCase` is available

### Low Priority (Blocking 5 tests)

3. **Fix messageService test mock** - Add `room_id` to thread mock
4. **Fix mediator test** - Investigate null return from `analyzeMessage`
5. **Fix messageOperations tests** - Add async/await to `validateActiveUser` tests

---

## Test Impact Breakdown

| Issue                    | Tests Affected      | Priority   |
| ------------------------ | ------------------- | ---------- |
| Entity import statements | 92 tests (4 suites) | **HIGH**   |
| Thread manager factory   | 1 suite (blocking)  | **MEDIUM** |
| Message service mock     | 1 test              | **LOW**    |
| Mediator null result     | 1 test              | **LOW**    |
| Socket handler async     | 3 tests             | **LOW**    |

---

## Recommended Fix Order

1. **Fix entity imports** (quickest, highest impact)
2. **Fix threadManager factory** (blocks entire suite)
3. **Fix remaining test issues** (individual test fixes)

---

## Verification Steps

After fixes:

1. Run entity tests: `npm test -- src/domain/entities/__tests__`
2. Run thread manager test: `npm test -- __tests__/threadManager.test.js`
3. Run message service test: `npm test -- __tests__/services/messageService.test.js`
4. Run mediator test: `npm test -- src/core/engine/__tests__/mediator.test.js`
5. Run socket handler tests: `npm test -- __tests__/socketHandlers/messageOperations.test.js`
