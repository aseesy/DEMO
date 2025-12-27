# PWA Code Organization

## Overview

This document describes the organization and structure of PWA-related code in the application.

## File Structure

```
chat-client-vite/
├── public/
│   └── sw.js                          # Service worker (caching + custom web-push)
├── src/
│   ├── components/
│   │   ├── PWAUpdateBanner.jsx       # Update notification banner
│   │   └── PWAUpdateBanner.test.jsx  # Banner component tests
│   ├── hooks/
│   │   └── pwa/
│   │       ├── usePWA.js              # Main PWA hook
│   │       ├── usePWA.test.js        # Hook unit tests
│   │       └── README.md             # Hook documentation
│   └── App.jsx                        # App component (PWA initialization)
└── docs/
    ├── PWA_AUTO_UPDATE.md            # Auto-update documentation
    └── PWA_CODE_ORGANIZATION.md       # This file
```

## Code Organization Principles

### 1. Separation of Concerns

- **Service Worker** (`public/sw.js`): Handles caching, offline support, and custom web-push notifications
- **PWA Hook** (`usePWA.js`): Manages PWA state and provides API for components
- **Update Banner** (`PWAUpdateBanner.jsx`): UI component for update notifications
- **App Integration** (`App.jsx`): Orchestrates PWA features with auth and routing

### 2. Constants and Configuration

All magic numbers and configuration values are extracted as named constants:

```javascript
// In App.jsx
const PUSH_SUBSCRIPTION_DELAY = 2000; // 2 seconds
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISS_REMINDER_DELAY = 60 * 60 * 1000; // 1 hour

// In usePWA.js
const VAPID_PUBLIC_KEY = '...'; // VAPID key constant
```

### 3. Documentation

- **JSDoc comments** on all exported functions
- **README.md** in hook directory explaining usage
- **Inline comments** for complex logic
- **Type annotations** in JSDoc for better IDE support

### 4. Error Handling

- All async operations wrapped in try-catch
- Errors logged with context
- Graceful degradation (don't block app if PWA features fail)
- User-friendly error messages

### 5. Testing

- **Unit tests** for hook logic
- **Component tests** for UI components
- **Integration tests** for update flow
- **Mocking** of browser APIs (Service Worker, Notification, etc.)

## Code Quality Standards

### Naming Conventions

- **Hooks**: `usePWA`, `useToast` (camelCase, starts with "use")
- **Components**: `PWAUpdateBanner` (PascalCase)
- **Constants**: `UPDATE_CHECK_INTERVAL` (UPPER_SNAKE_CASE)
- **Functions**: `applyUpdate`, `checkForUpdates` (camelCase, verb-based)

### Function Organization

Functions are organized in logical groups:

1. **State Management** - useState hooks
2. **Effects** - useEffect hooks
3. **Service Worker** - Registration and update handling
4. **Push Notifications** - Subscription management
5. **Install Prompt** - Installation handling
6. **Helpers** - Utility functions

### Code Comments

- **File-level**: Explains purpose and features
- **Function-level**: JSDoc with parameters and return values
- **Complex logic**: Inline comments explaining "why"
- **TODO/FIXME**: Marked for future improvements

## Testing Strategy

### Unit Tests

- Test individual functions in isolation
- Mock browser APIs
- Test error cases
- Test edge cases

### Component Tests

- Test rendering
- Test user interactions
- Test accessibility
- Test styling

### Integration Tests

- Test complete flows (update detection → notification → application)
- Test with real service worker (if possible)
- Test error recovery

## Maintenance Guidelines

### When Adding Features

1. **Update documentation** - Add to README.md
2. **Add tests** - Unit tests for new functions
3. **Extract constants** - Don't use magic numbers
4. **Add JSDoc** - Document new functions
5. **Update types** - Add to JSDoc return types

### When Refactoring

1. **Keep tests passing** - Don't break existing tests
2. **Update documentation** - Reflect new structure
3. **Maintain API** - Don't break existing usage
4. **Add migration notes** - If API changes

### Code Review Checklist

- [ ] Constants extracted (no magic numbers)
- [ ] JSDoc comments added
- [ ] Tests written and passing
- [ ] Error handling implemented
- [ ] Code follows naming conventions
- [ ] No console.log in production code (use proper logging)
- [ ] Accessibility considered
- [ ] Performance implications considered

## Future Improvements

- [ ] Add TypeScript types
- [ ] Add E2E tests for update flow
- [ ] Add update progress indicator
- [ ] Add changelog display in update banner
- [ ] Add "Check for Updates" button in settings
- [ ] Add update scheduling (update at convenient time)

