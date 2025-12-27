# Notification Navigation Tests

## Overview

Unit tests for push notification deep linking functionality, following single responsibility principle.

## Test Files

### 1. `src/utils/__tests__/notificationNavigation.test.js`
**Single Responsibility**: Test pure utility functions for URL parsing and navigation.

**Functions Tested**:
- `extractViewFromUrl()` - Extracts view parameter from URL
- `buildViewUrl()` - Builds URL with view parameter
- `navigateToView()` - Updates URL and triggers navigation
- `handleServiceWorkerNavigation()` - Handles service worker messages

**Coverage**:
- ✅ URL parsing with view parameter
- ✅ Default view handling
- ✅ Invalid URL handling
- ✅ Navigation event dispatching
- ✅ Authentication checks
- ✅ Missing data handling

### 2. `src/utils/__tests__/serviceWorkerNotification.test.js`
**Single Responsibility**: Test service worker notification click handler logic.

**Logic Tested**:
- Notification closing
- URL extraction from notification data
- Client window focusing
- New window opening
- Cross-origin handling

**Coverage**:
- ✅ Notification close on click
- ✅ Default URL when no data
- ✅ Existing client focus
- ✅ New window opening
- ✅ Client without focus method
- ✅ Different origin handling

### 3. `src/__tests__/App.notificationNavigation.test.jsx`
**Single Responsibility**: Test App component's service worker message handling.

**Functionality Tested**:
- Service worker message listener registration
- NAVIGATE message handling
- URL updating
- Navigation event dispatching
- Event listener cleanup

**Coverage**:
- ✅ Message listener registration
- ✅ NAVIGATE message handling
- ✅ URL update
- ✅ Navigation event dispatch
- ✅ Non-NAVIGATE message filtering
- ✅ Event listener cleanup

### 4. `src/__tests__/ChatRoom.notificationNavigation.test.jsx`
**Single Responsibility**: Test ChatRoom's URL parameter reading and event handling logic.

**Logic Tested**:
- View extraction from events
- Authentication checks
- URL parameter reading
- View validation
- Navigation state updates

**Coverage**:
- ✅ Event view extraction
- ✅ Authentication requirement
- ✅ URL parameter reading
- ✅ View validation
- ✅ Current view comparison
- ✅ Integration scenarios

## Single Responsibility Principle

Each test file and function has a single, well-defined responsibility:

1. **notificationNavigation.js**: Pure utility functions (no side effects)
2. **serviceWorkerNotification.test.js**: Service worker logic (isolated)
3. **App.notificationNavigation.test.jsx**: Component message handling
4. **ChatRoom.notificationNavigation.test.jsx**: Component navigation logic

## Running Tests

```bash
# Run all notification navigation tests
npm test -- notificationNavigation

# Run specific test file
npm test -- notificationNavigation.test.js
npm test -- serviceWorkerNotification.test.js
npm test -- App.notificationNavigation.test.jsx
npm test -- ChatRoom.notificationNavigation.test.jsx

# Run with coverage
npm run test:coverage -- notificationNavigation
```

## Test Coverage Goals

- **Unit Tests**: 100% coverage of utility functions
- **Component Tests**: Test navigation logic in isolation
- **Integration Tests**: End-to-end flow (separate test file)

## Maintenance

When modifying notification navigation:
1. Update corresponding test file
2. Ensure single responsibility is maintained
3. Add tests for new edge cases
4. Verify all tests pass before committing

