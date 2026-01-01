# Network Failure Detection Tests

## Overview

This document describes the test suite designed to detect errors when the backend server is unavailable. These tests would have caught the `ERR_CONNECTION_REFUSED` errors you're seeing in the console.

## Test Files Created

### 1. `apiClient.test.js`
**Purpose**: Tests the core API client's handling of network failures

**What it detects**:
- `ERR_CONNECTION_REFUSED` errors for all HTTP methods (GET, POST, PUT, DELETE)
- Network timeout errors
- Error tracking and analytics
- Error message consistency

**Key test cases**:
- Connection refused errors are properly caught and tracked
- Response time is tracked even when connection fails
- Error messages are preserved and logged correctly

### 2. `useInAppNotifications.test.js`
**Purpose**: Tests notification hook's resilience to network failures

**What it detects**:
- Connection refused errors during notification count fetch
- Polling continues even after connection errors
- UI remains stable (no error state breaks the component)
- Error recovery when connection is restored

**Key test cases**:
- Errors are handled gracefully without breaking UI
- Background polling continues despite failures
- Silent error handling (errors logged but don't break UX)

### 3. `useContactsApi.network.test.js`
**Purpose**: Tests contact API hook's network failure handling

**What it detects**:
- Connection refused errors during contact loading
- Error state management
- Graceful degradation (empty arrays, no crashes)
- Error recovery on retry

**Key test cases**:
- Error state is set correctly on network failure
- Contacts array remains empty (doesn't crash)
- Error state clears on successful retry
- Component doesn't crash during initial load failures

### 4. `useChatSocket.network.test.js`
**Purpose**: Tests Socket.IO connection failure handling

**What it detects**:
- Socket.IO connection refused errors
- Transport errors (xhr poll error)
- Reconnection handling
- Error state management

**Key test cases**:
- Connection errors are handled by error handlers
- Reconnection is configured correctly
- Error state is set on connection failure
- Socket configuration includes reconnection settings

### 5. `network-failure.integration.test.jsx`
**Purpose**: End-to-end integration tests for network failures

**What it detects**:
- Multiple hooks failing simultaneously
- Component rendering with failed API calls
- Error logging for debugging
- Graceful degradation during network outages
- Error recovery when network is restored

**Key test cases**:
- Multiple API failures don't crash the app
- UI remains functional during outages
- Errors are logged for debugging
- Retry functionality works
- Recovery when network is restored

## Errors These Tests Would Detect

### 1. Connection Refused Errors (`ERR_CONNECTION_REFUSED`)
**Error**: `TypeError: Failed to fetch` when backend server is down

**Detection**: 
- `apiClient.test.js` - Tests that `apiGet`, `apiPost`, `apiPut`, `apiDelete` handle connection refused errors
- `useInAppNotifications.test.js` - Tests notification count fetch failure
- `useContactsApi.network.test.js` - Tests contact loading failure
- `network-failure.integration.test.jsx` - Tests multiple hooks failing simultaneously

### 2. Socket.IO Connection Failures
**Error**: `TransportError: xhr poll error` and `WebSocket connection failed`

**Detection**:
- `useChatSocket.network.test.js` - Tests Socket.IO connection error handling
- `network-failure.integration.test.jsx` - Tests Socket.IO failures in integration context

### 3. Error Logging Issues
**Error**: Errors not being logged or tracked properly

**Detection**:
- All test files verify that errors are logged using `console.error`
- `apiClient.test.js` verifies error tracking via analytics

### 4. UI Breaking on Network Failures
**Error**: Components crashing or showing broken UI when backend is unavailable

**Detection**:
- `useInAppNotifications.test.js` - Verifies UI remains stable
- `useContactsApi.network.test.js` - Verifies graceful degradation
- `network-failure.integration.test.jsx` - Verifies components render without crashing

## Running the Tests

```bash
# Run all network failure tests
npm test -- network-failure

# Run specific test file
npm test -- apiClient.test.js
npm test -- useInAppNotifications.test.js
npm test -- useContactsApi.network.test.js
npm test -- useChatSocket.network.test.js
npm test -- network-failure.integration.test.jsx
```

## Test Coverage

These tests cover:
- ✅ API client error handling
- ✅ Hook error handling (notifications, contacts)
- ✅ Socket.IO connection failures
- ✅ Error state management
- ✅ Error logging
- ✅ Graceful degradation
- ✅ Error recovery
- ✅ Integration scenarios

## What These Tests Don't Cover

- Actual network conditions (requires backend server to be down)
- Browser-specific network errors
- CORS errors
- SSL/TLS certificate errors
- DNS resolution failures

## Future Enhancements

1. **E2E Tests**: Add Playwright/Cypress tests that actually start/stop the backend server
2. **Network Simulation**: Use service workers or network interceptors to simulate network conditions
3. **Error Boundary Tests**: Test React error boundaries with network failures
4. **Retry Logic Tests**: Test exponential backoff and retry strategies
5. **Offline Mode Tests**: Test PWA offline functionality

## Related Issues

These tests would have detected:
- `ERR_CONNECTION_REFUSED` errors when backend is down
- Socket.IO connection failures
- Multiple hooks failing simultaneously
- Error logging issues
- UI breaking on network failures

