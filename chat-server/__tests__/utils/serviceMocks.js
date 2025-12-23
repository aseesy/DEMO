/**
 * Service Mocking Utilities
 *
 * Provides reusable mocks for services to enable unit testing
 * of routes and other components that depend on services.
 *
 * Usage:
 *   const { mockProfileService } = require('./utils/serviceMocks');
 *   const profileService = mockProfileService();
 */

/**
 * Create a mock ProfileService
 * @param {Object} overrides - Override default mock implementations
 * @returns {Object} Mocked ProfileService instance
 */
function mockProfileService(overrides = {}) {
  const defaultMock = {
    getProfileColumns: jest.fn().mockResolvedValue([
      'username',
      'email',
      'first_name',
      'last_name',
      'display_name',
      'phone',
      'address',
      'timezone',
      'profile_picture_url',
      'profile_completion_percentage',
      'profile_last_updated',
    ]),
    getComprehensiveProfile: jest.fn().mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      display_name: 'Test User',
      phone: '123-456-7890',
      address: '123 Test St',
      timezone: 'America/New_York',
      profile_picture_url: null,
      profile_completion_percentage: 50,
      profile_last_updated: new Date(),
    }),
    getPrivacySettings: jest.fn().mockResolvedValue({
      user_id: 1,
      personal_visibility: 'shared',
      work_visibility: 'private',
      health_visibility: 'private',
      financial_visibility: 'private',
      background_visibility: 'shared',
      field_overrides: '{}',
    }),
    updateComprehensiveProfile: jest.fn().mockResolvedValue({
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Updated',
      last_name: 'User',
      profile_completion_percentage: 60,
    }),
    updatePrivacySettings: jest.fn().mockResolvedValue({
      success: true,
      message: 'Privacy settings updated successfully.',
    }),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
    getOnboardingStatus: jest.fn(),
  };

  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock repository
 * @param {Object} overrides - Override default mock implementations
 * @returns {Object} Mocked repository instance
 */
function mockRepository(overrides = {}) {
  const defaultMock = {
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findByIds: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateById: jest.fn(),
    delete: jest.fn(),
    deleteById: jest.fn(),
    query: jest.fn(),
    queryOne: jest.fn(),
    exists: jest.fn(),
    count: jest.fn(),
  };

  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock request object for Express routes
 * @param {Object} overrides - Override default mock values
 * @returns {Object} Mock Express request object
 */
function mockRequest(overrides = {}) {
  const defaultMock = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: {
      userId: 1,
      username: 'testuser',
      id: 1,
    },
    ...overrides,
  };

  return defaultMock;
}

/**
 * Create a mock response object for Express routes
 * @returns {Object} Mock Express response object
 */
function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    locals: {},
  };

  return res;
}

/**
 * Create a mock next function for Express middleware
 * @returns {Function} Mock next function
 */
function mockNext() {
  return jest.fn();
}

/**
 * Reset all mocks in a service mock
 * @param {Object} serviceMock - The mocked service
 */
function resetServiceMock(serviceMock) {
  Object.values(serviceMock).forEach(mockFn => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });
}

module.exports = {
  mockProfileService,
  mockRepository,
  mockRequest,
  mockResponse,
  mockNext,
  resetServiceMock,
};

