# Routes Directory

This directory contains Express route handlers for the LiaiZen API.

## Dependency Injection Patterns

Routes use one of two patterns for dependencies:

### 1. Direct Import Pattern (`@di-pattern: direct`)

Routes directly import their dependencies at the module level. Used for routes that:
- Only need database access (via `dbSafe` or `dbPostgres`)
- Use stateless services from `src/services/`
- Have no external dependencies that need runtime injection

```javascript
// @di-pattern: direct
const express = require('express');
const router = express.Router();
const { someService } = require('../src/services');

router.get('/', async (req, res) => {
  const result = await someService.doSomething();
  res.json(result);
});

module.exports = router;
```

**Examples:** `activities.js`, `dashboard.js`, `notifications.js`, `waitlist.js`, `invitations.js`, `pushNotifications.js`, `blogImages.js`, `userContext.js`, `auth/*`

### 2. Injected Pattern (`@di-pattern: injected`)

Routes receive dependencies at runtime via `router.setHelpers()`. Used for routes that:
- Need access to shared services (e.g., `dbSafe`, `communicationStats`)
- Require dependencies that are configured at server startup
- Need services that have circular dependency issues with direct imports

```javascript
// @di-pattern: injected
const express = require('express');
const router = express.Router();

let myService;

router.setHelpers = function (helpers) {
  myService = helpers.myService;
};

router.get('/', async (req, res) => {
  const result = await myService.doSomething();
  res.json(result);
});

module.exports = router;
```

**Examples:** `admin.js`, `ai.js`, `connections.js`, `contacts.js`, `figma.js`, `pairing.js`, `profile.js`, `rooms.js`, `tasks.js`, `user.js`

## Method Naming Convention

Always use `setHelpers` (not `setServices`) for consistency across all routes.

## Route Registration

Routes are registered in `routeManager.js`. For injected routes:

```javascript
// In routeManager.js
const myRoutes = require('./routes/myroutes');

function setupRoutes(app, services) {
  // Inject dependencies
  if (myRoutes.setHelpers) {
    myRoutes.setHelpers({
      dbSafe: services.dbSafe,
      myService: services.myService
    });
  }

  // Register route
  app.use('/api/myroutes', myRoutes);
}
```

## Directory Structure

```
routes/
├── README.md               # This file
├── auth.js                 # Auth entry point (re-exports from auth/)
├── auth/                   # Auth sub-routes
│   ├── login.js
│   ├── signup.js
│   ├── oauth.js
│   ├── password.js
│   ├── verification.js
│   ├── signupValidation.js
│   └── utils.js
├── user.js                 # User entry point
├── user/                   # User sub-routes
│   ├── profile.js
│   ├── password.js
│   └── onboarding.js
├── activities.js           # Activity feed
├── admin.js                # Admin endpoints
├── ai.js                   # AI mediation endpoints
├── blogImages.js           # Blog image generation
├── connections.js          # Co-parent connections
├── contacts.js             # Contact management
├── dashboard.js            # Dashboard data
├── figma.js                # Figma integration
├── invitations.js          # Invitation system
├── notifications.js        # Notifications
├── pairing.js              # Co-parent pairing
├── profile.js              # Profile management
├── pushNotifications.js    # Push notification subscriptions
├── rooms.js                # Room management
├── tasks.js                # Task management
├── userContext.js          # User context queries
└── waitlist.js             # Waitlist management
```

## Adding a New Route

1. Create your route file with the appropriate DI pattern
2. Add `// @di-pattern: direct` or `// @di-pattern: injected` comment at the top
3. If using injected pattern, implement `router.setHelpers`
4. Register the route in `routeManager.js`
5. If injected, call `setHelpers()` before registration
