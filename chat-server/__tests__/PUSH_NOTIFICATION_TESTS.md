# Push Notification Test Suite

## Overview

Comprehensive test suite for the push notification system to detect bugs and ensure reliability.

## Test Files

### 1. Unit Tests: `pushNotificationService.test.js`
**Location**: `__tests__/services/pushNotificationService.test.js`

Tests all service methods in isolation:
- ✅ `saveSubscription` - Creates and updates subscriptions
- ✅ `deleteSubscription` - Deactivates subscriptions
- ✅ `getUserSubscriptions` - Retrieves active subscriptions
- ✅ `sendNotificationToUser` - Sends notifications to all user devices
- ✅ `notifyNewMessage` - Formats and sends message notifications

**Coverage**:
- Success paths
- Error handling (database errors, invalid subscriptions)
- Edge cases (missing fields, empty subscriptions)
- Invalid subscription cleanup (410/404 errors)

### 2. Integration Tests: `pushNotifications.routes.test.js`
**Location**: `__tests__/routes/pushNotifications.routes.test.js`

Tests API endpoints with mocked services:
- ✅ `POST /api/push/subscribe` - Save subscription (authenticated)
- ✅ `DELETE /api/push/unsubscribe` - Remove subscription
- ✅ `GET /api/push/vapid-key` - Get public key (no auth required)

**Coverage**:
- Authentication requirements
- Request validation
- Error responses (400, 401, 500)
- User-agent header handling

### 3. Integration Tests: `pushNotification.integration.test.js`
**Location**: `__tests__/integration/pushNotification.integration.test.js`

Tests the complete flow from message to notification:
- ✅ Message approval triggers notification
- ✅ Recipient identification from room members
- ✅ Case-insensitive username matching
- ✅ Error handling (graceful degradation)
- ✅ Subscription lifecycle (save → send)

## Running Tests

```bash
# Run all push notification tests
cd chat-server
npm test -- --testNamePattern="pushNotification|PushNotification"

# Run specific test file
npm test -- pushNotificationService.test.js
npm test -- pushNotifications.routes.test.js
npm test -- pushNotification.integration.test.js

# Run with coverage
npm run test:coverage -- --testNamePattern="pushNotification"
```

## Test Results

✅ **21 tests passing** across 3 test files

## Bugs Detected and Prevented

### 1. Invalid Subscription Handling
- **Test**: `saveSubscription` validation tests
- **Bug Prevented**: Missing endpoint, keys, or p256dh would cause database errors
- **Fix**: Validation throws clear error before database call

### 2. Invalid Subscription Cleanup
- **Test**: `sendNotificationToUser` with 410/404 errors
- **Bug Prevented**: Dead subscriptions accumulating in database
- **Fix**: Automatic deactivation of invalid subscriptions

### 3. Partial Notification Failures
- **Test**: `sendNotificationToUser` with mixed success/failure
- **Bug Prevented**: One failed subscription blocking others
- **Fix**: Continue sending to other subscriptions, track sent/failed counts

### 4. Missing Authentication
- **Test**: `POST /api/push/subscribe` without auth
- **Bug Prevented**: Unauthorized subscription creation
- **Fix**: `verifyAuth` middleware required

### 5. Invalid Request Data
- **Test**: Missing subscription fields in API
- **Bug Prevented**: Database errors from invalid data
- **Fix**: Request validation returns 400 before service call

### 6. Case-Sensitive Username Matching
- **Test**: Case-insensitive username comparison
- **Bug Prevented**: Notifications not sent due to case mismatch
- **Fix**: `.toLowerCase()` comparison in recipient finding

### 7. Missing Recipient Handling
- **Test**: No recipient found in room
- **Bug Prevented**: Errors when only sender in room
- **Fix**: Graceful check before sending notification

## Test Coverage Goals

- ✅ Unit tests: All service methods covered
- ✅ Integration tests: All API endpoints covered
- ✅ Error cases: All error paths tested
- ✅ Edge cases: Boundary conditions tested

## Future Test Additions

1. **Frontend Tests**: Test `usePWA` hook push subscription flow
2. **E2E Tests**: Test full flow from message send to notification delivery
3. **Performance Tests**: Test notification sending to many subscriptions
4. **Security Tests**: Test VAPID key validation and subscription security

## Maintenance

- Update tests when adding new notification types
- Add tests for new error scenarios as they're discovered
- Keep mocks in sync with actual service implementations
- Review test coverage when modifying push notification code

