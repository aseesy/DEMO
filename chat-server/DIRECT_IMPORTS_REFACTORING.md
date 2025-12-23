# Direct Imports Refactoring Guide

This document tracks all routes and modules that use direct database imports instead of service layer dependency injection. These direct imports make unit testing difficult and violate the dependency inversion principle.

## Status: ✅ Completed

### `routes/profile.js`
- **Status**: ✅ Refactored
- **Previous Issues**:
  - Direct `db` import (`require('../dbPostgres')`)
  - `getProfileColumns()` helper function querying schema directly
  - Direct SQL queries in all endpoints
- **Solution**:
  - Added methods to `ProfileService`:
    - `getProfileColumns()` - Gets all profile column names
    - `getComprehensiveProfile(userId)` - Gets full profile with all columns
    - `getPrivacySettings(userId)` - Gets privacy settings
    - `updateComprehensiveProfile(userId, updates, calculateCompletion)` - Updates profile with dynamic columns
    - `updatePrivacySettings(userId, settings)` - Updates privacy settings
  - Route now uses `router.setServices()` for dependency injection
  - All endpoints delegate to `profileService` methods
  - Error handling uses `handleServiceError` middleware

---

## Status: ⚠️ Pending Refactoring

### `routes/dashboard.js`
- **Direct Imports**: 
  - `const dbSafe = require('../dbSafe');`
  - `const db = require('../dbPostgres');`
- **Lines**: 11-12
- **Impact**: Medium - Used for dashboard updates and communication stats
- **Recommended Solution**: Create `DashboardService` or extend existing service

### `routes/notifications.js`
- **Direct Imports**: 
  - `const dbSafe = require('../dbSafe');`
  - `const db = require('../dbPostgres');`
- **Lines**: 11-12
- **Impact**: Medium - Used for in-app notification management
- **Recommended Solution**: Create `NotificationService` or use existing notification manager

### `routes/connections.js`
- **Direct Imports**: 
  - `const dbSafe = require('../dbSafe');`
- **Lines**: 13
- **Impact**: Low - Limited usage
- **Recommended Solution**: Inject via `setHelpers` or create service

### `routes/ai.js`
- **Direct Imports**: 
  - `const dbSafe = require('../dbSafe');`
  - `const db = require('../dbPostgres');`
- **Lines**: 11-12
- **Impact**: Medium - AI mediation features
- **Recommended Solution**: Use existing `aiMediator` service

### `routes/activities.js`
- **Direct Imports**: 
  - `const dbSafe = require('../dbSafe');`
  - `const db = require('../dbPostgres');`
- **Lines**: 11-12
- **Impact**: Medium - Activity tracking
- **Recommended Solution**: Create `ActivityService`

### `routes/auth/verification.js`
- **Direct Imports**: 
  - `const dbSafe = require('../../dbSafe');`
  - `const db = require('../../dbPostgres');`
- **Lines**: 11-12
- **Impact**: High - Authentication verification
- **Recommended Solution**: Use existing `auth` service

### `routes/auth/password.js`
- **Direct Imports**: 
  - `const db = require('../../dbPostgres');`
- **Lines**: 6
- **Impact**: High - Password management
- **Recommended Solution**: Use existing `auth` service or create `PasswordService`

### `routes/waitlist.js`
- **Direct Imports**: 
  - `const db = require('../dbPostgres');`
- **Lines**: 10
- **Impact**: Low - Waitlist management
- **Recommended Solution**: Create `WaitlistService`

### `routes/invitations.js`
- **Direct Imports**: 
  - Inline `require('../dbPostgres')` in functions (lines 173, 212)
- **Impact**: Medium - Invitation acceptance/decline
- **Recommended Solution**: Use existing `invitationService` or `invitationManager`

---

## Refactoring Pattern

### Step 1: Create or Extend Service
```javascript
// chat-server/src/services/[feature]/[feature]Service.js
const { BaseService } = require('../BaseService');
const { PostgresGenericRepository } = require('../../repositories');

class FeatureService extends BaseService {
  constructor() {
    super(null, new PostgresGenericRepository('table_name'));
  }

  async getData(id) {
    return this.findById(id);
  }

  async updateData(id, updates) {
    return this.updateById(id, updates);
  }
}

const featureService = new FeatureService();
module.exports = { featureService, FeatureService };
```

### Step 2: Export from Services Index
```javascript
// chat-server/src/services/index.js
const { featureService } = require('./feature');
module.exports = {
  // ... other services
  featureService,
};
```

### Step 3: Add to loadServices
```javascript
// chat-server/database.js
const { featureService } = require('./src/services');
services.featureService = featureService;
```

### Step 4: Refactor Route
```javascript
// chat-server/routes/feature.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleServiceError } = require('../middleware/errorHandlers');

let featureService;

router.setServices = function (services) {
  featureService = services.featureService;
};

router.get('/:id', authenticate, async (req, res) => {
  try {
    const data = await featureService.getData(req.params.id);
    res.json(data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

module.exports = router;
```

### Step 5: Inject in routeManager
```javascript
// chat-server/routeManager.js
const featureRoutes = require('./routes/feature');

// ... other setup

if (services.featureService && featureRoutes.setServices) {
  featureRoutes.setServices({ featureService: services.featureService });
}

app.use('/api/feature', featureRoutes);
```

---

## Benefits of Refactoring

1. **Testability**: Services can be easily mocked in unit tests
2. **Maintainability**: Business logic centralized in services
3. **Reusability**: Services can be used across multiple routes
4. **Dependency Inversion**: Routes depend on abstractions, not concrete implementations
5. **Error Handling**: Consistent error handling via `handleServiceError` middleware

---

## Priority Order

1. **High Priority** (Authentication-related):
   - `routes/auth/verification.js`
   - `routes/auth/password.js`

2. **Medium Priority** (Core features):
   - `routes/dashboard.js`
   - `routes/notifications.js`
   - `routes/ai.js`
   - `routes/activities.js`
   - `routes/invitations.js` (inline requires)

3. **Low Priority** (Supporting features):
   - `routes/connections.js`
   - `routes/waitlist.js`

---

## Notes

- All routes should use `handleServiceError` middleware for consistent error responses
- Services should extend `BaseService` for common database operations
- Use repositories for data access, services for business logic
- Keep route handlers thin - delegate to services immediately

