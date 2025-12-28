# Socket Handlers Unit Tests

## Overview

This directory contains comprehensive unit tests for the socket handler modules, with a focus on the AI mediation flow.

## Test Files

### `aiHelper.test.js`

Tests the main AI mediation handler (`handleAiMediation` function) which orchestrates:

- Pre-approved rewrite handling (similarity checking)
- Bypass mediation handling
- AI analysis orchestration
- Intervention processing
- Error handling
- Participant username handling

**Coverage:**

- ✅ Pre-approved rewrite skipping (>= 95% similarity)
- ✅ Edited rewrite processing (< 95% similarity)
- ✅ Bypass mediation flow
- ✅ AI mediator integration with correct parameters
- ✅ Intervention processing
- ✅ Approved message processing with contact suggestions
- ✅ Error handling and graceful degradation
- ✅ Participant filtering for role context

### `aiContextHelper.test.js`

Tests the context gathering functions used in mediation:

- `getRecentMessages` - Fetches recent messages from database
- `getParticipantUsernames` - **CRITICAL**: Tests userSessionService integration (fixes the activeUsers bug)
- `getContactContext` - Gathers contact information
- `getTaskContext` - Gathers task information
- `getFlaggedContext` - Gathers flagged message context

**Coverage:**

- ✅ Database query handling
- ✅ Error handling and fallbacks
- ✅ userSessionService integration (replaces deprecated activeUsers)
- ✅ Edge cases (empty results, missing data)

## Running Tests

```bash
# Run all socket handler tests
npm test -- __tests__/socketHandlers/

# Run specific test file
npm test -- __tests__/socketHandlers/aiHelper.test.js

# Run with coverage
npm test -- --coverage __tests__/socketHandlers/
```

## Key Fixes Verified

### 1. userSessionService Integration

The tests verify that `getParticipantUsernames` correctly:

- Uses `userSessionService.getUsersInRoom()` instead of deprecated `activeUsers` Map
- Falls back to userSessionService when database queries fail
- Handles missing userSessionService gracefully

### 2. Async Flow Handling

Tests properly handle the `setImmediate` async flow in `handleAiMediation`:

- Uses `await new Promise(resolve => setImmediate(resolve))` to wait for callbacks
- Verifies all async operations complete before assertions

## Test Patterns

### Mocking Strategy

- **Services**: Mocked at the service level (aiMediator, dbSafe, userSessionService)
- **Helpers**: Mocked helper functions (aiContextHelper, aiActionHelper)
- **Dependencies**: External libraries mocked (string-similarity)

### Async Testing

```javascript
// Wait for setImmediate callbacks
await new Promise(resolve => setImmediate(resolve));
```

### Error Testing

```javascript
// Test graceful error handling
mockService.method.mockRejectedValue(new Error('Error'));
// Verify error handler is called
expect(errorHandler).toHaveBeenCalled();
```

## Future Improvements

1. **Integration Tests**: Add tests that verify the full flow with real database
2. **Performance Tests**: Measure mediation latency
3. **Edge Cases**: Add more boundary condition tests
4. **Error Scenarios**: Test more complex error recovery paths

## Related Files

- `socketHandlers/aiHelper.js` - Main mediation handler
- `socketHandlers/aiContextHelper.js` - Context gathering functions
- `socketHandlers/aiActionHelper.js` - Action processing functions
- `src/services/session/userSessionService.js` - User session management
