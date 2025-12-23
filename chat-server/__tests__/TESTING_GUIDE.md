# Testing Guide: Dependency Injection Pattern

This guide demonstrates how to test routes and services that use dependency injection.

## Overview

With the refactored architecture, routes receive services via `router.setServices()`, making them easily testable by injecting mock services.

## Testing Routes with Mocked Services

### Example: Testing Profile Routes

```javascript
const request = require('supertest');
const express = require('express');
const { mockProfileService } = require('../utils/serviceMocks');

// Mock the service module
jest.mock('../../src/services/profile/profileService', () => ({
  profileService: mockProfileService(),
}));

describe('Profile Routes', () => {
  let app;
  let profileService;

  beforeEach(() => {
    // Get the mocked service
    profileService = require('../../src/services/profile/profileService').profileService;

    // Create Express app
    app = express();
    app.use(express.json());

    // Load route module
    const profileRoutes = require('../../routes/profile');

    // Inject mocked service
    profileRoutes.setServices({ profileService });

    // Mount routes
    app.use('/api/profile', profileRoutes);
  });

  it('should return user profile', async () => {
    // Setup mock behavior
    profileService.getComprehensiveProfile.mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
    });

    // Make request
    const response = await request(app)
      .get('/api/profile/me')
      .expect(200);

    // Verify response
    expect(response.body).toHaveProperty('username', 'testuser');
    
    // Verify service was called correctly
    expect(profileService.getComprehensiveProfile).toHaveBeenCalledWith(1);
  });
});
```

## Testing Services with Mocked Repositories

### Example: Testing ProfileService

```javascript
const { ProfileService } = require('../../src/services/profile/profileService');
const { mockRepository } = require('../utils/serviceMocks');

describe('ProfileService', () => {
  let profileService;
  let mockUserRepository;

  beforeEach(() => {
    // Create mock repository
    mockUserRepository = mockRepository();

    // Create service with mocked repository
    profileService = new ProfileService();
    profileService.userRepository = mockUserRepository;
  });

  it('should get profile by userId', async () => {
    // Setup mock behavior
    profileService.getProfileColumns = jest.fn().mockResolvedValue(['username', 'email']);
    profileService.query = jest.fn().mockResolvedValue([{
      username: 'testuser',
      email: 'test@example.com',
    }]);

    // Call service method
    const result = await profileService.getComprehensiveProfile(1);

    // Verify result
    expect(result.username).toBe('testuser');
    expect(profileService.query).toHaveBeenCalled();
  });
});
```

## Test Utilities

### `serviceMocks.js`

Provides reusable mock factories:

- `mockProfileService(overrides)` - Creates a mock ProfileService
- `mockRepository(overrides)` - Creates a mock repository
- `mockRequest(overrides)` - Creates a mock Express request
- `mockResponse()` - Creates a mock Express response
- `mockNext()` - Creates a mock Express next function

### Usage

```javascript
const { mockProfileService, mockRequest, mockResponse } = require('../utils/serviceMocks');

// Create mocks with default behavior
const profileService = mockProfileService();

// Override specific methods
const customService = mockProfileService({
  getComprehensiveProfile: jest.fn().mockResolvedValue({ custom: 'data' }),
});
```

## Testing Error Cases

### Service Errors

```javascript
const { NotFoundError, ValidationError } = require('../../src/services/errors');

it('should handle NotFoundError', async () => {
  profileService.getComprehensiveProfile.mockRejectedValue(
    new NotFoundError('User profile', 1)
  );

  const response = await request(app)
    .get('/api/profile/me')
    .expect(404);

  expect(response.body).toHaveProperty('error');
});
```

### Validation Errors

```javascript
it('should handle ValidationError', async () => {
  profileService.updateComprehensiveProfile.mockRejectedValue(
    new ValidationError('Invalid data', 'field')
  );

  const response = await request(app)
    .put('/api/profile/me')
    .send({ invalid: 'data' })
    .expect(400);

  expect(response.body).toHaveProperty('error');
});
```

## Best Practices

### 1. Reset Mocks Between Tests

```javascript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. Use Descriptive Mock Data

```javascript
const mockProfile = {
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  // ... complete mock data
};
```

### 3. Verify Service Calls

```javascript
expect(profileService.getComprehensiveProfile).toHaveBeenCalledWith(
  expect.any(Number)
);
expect(profileService.getComprehensiveProfile).toHaveBeenCalledTimes(1);
```

### 4. Test Both Success and Error Paths

```javascript
describe('GET /api/profile/me', () => {
  it('should return profile on success', async () => {
    // Test success case
  });

  it('should handle service errors', async () => {
    // Test error case
  });
});
```

### 5. Use Service Mock Utilities

Don't manually create mocks - use the utilities:

```javascript
// ❌ Bad
const profileService = {
  getComprehensiveProfile: jest.fn(),
  // ... manually listing all methods
};

// ✅ Good
const { mockProfileService } = require('../utils/serviceMocks');
const profileService = mockProfileService();
```

## Integration vs Unit Tests

### Unit Tests (Service Layer)

- Test services in isolation
- Mock repositories
- Fast execution
- Test business logic

```javascript
// Unit test: ProfileService
describe('ProfileService.getComprehensiveProfile', () => {
  it('should return profile data', async () => {
    // Mock repository
    // Call service method
    // Verify result
  });
});
```

### Integration Tests (Route Layer)

- Test routes with mocked services
- Verify HTTP request/response
- Test middleware integration
- Test error handling

```javascript
// Integration test: Profile Routes
describe('GET /api/profile/me', () => {
  it('should return 200 with profile data', async () => {
    // Mock service
    // Make HTTP request
    // Verify response
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- profile.routes.test.js

# Run in watch mode
npm run test:watch
```

## Coverage Goals

- **Unit Tests**: ≥80% coverage for services
- **Integration Tests**: Cover all route endpoints
- **Error Cases**: Test all error paths
- **Edge Cases**: Test boundary conditions

## Common Patterns

### Testing Authentication

```javascript
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { userId: 1, username: 'testuser' };
    next();
  },
}));
```

### Testing Error Handling

```javascript
jest.mock('../../middleware/errorHandlers', () => ({
  handleServiceError: (error, res) => {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  },
}));
```

### Testing Service Injection

```javascript
// Load route module
const profileRoutes = require('../../routes/profile');

// Inject service
profileRoutes.setServices({ profileService });

// Verify injection worked
expect(profileRoutes).toBeDefined();
```

## Troubleshooting

### Mocks Not Working

1. Clear module cache: `delete require.cache[require.resolve('./module')]`
2. Ensure mocks are set up before importing routes
3. Reset mocks between tests: `jest.clearAllMocks()`

### Service Not Injected

1. Verify `router.setServices()` is called before mounting routes
2. Check that service is passed correctly: `setServices({ profileService })`
3. Verify route module exports `setServices` function

### Tests Flaking

1. Ensure proper cleanup in `afterEach`
2. Use `jest.clearAllMocks()` instead of `mockReset()` when needed
3. Avoid shared state between tests

