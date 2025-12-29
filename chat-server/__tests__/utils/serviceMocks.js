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

/**
 * Create a mock DebugService
 */
function mockDebugService(overrides = {}) {
  const defaultMock = {
    getUsers: jest.fn().mockResolvedValue({ users: [], count: 0 }),
    getRooms: jest.fn().mockResolvedValue({ rooms: [], count: 0 }),
    getUserTasks: jest.fn().mockResolvedValue({ tasks: [] }),
    getRoomMessages: jest.fn().mockResolvedValue({ messages: [] }),
    getPendingConnections: jest.fn().mockResolvedValue({ connections: [], count: 0 }),
    debugPairings: jest.fn().mockResolvedValue({ pairings: [], rooms: [] }),
  };
  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock StatisticsService
 */
function mockStatisticsService(overrides = {}) {
  const defaultMock = {
    getUserCount: jest.fn().mockResolvedValue(0),
    getUserCountByStatus: jest.fn().mockResolvedValue({ verified: 0, unverified: 0, total: 0 }),
    getRoomStats: jest.fn().mockResolvedValue({ total: 0, active: 0 }),
    getMessageStats: jest.fn().mockResolvedValue({ total: 0, today: 0 }),
  };
  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock CleanupService
 */
function mockCleanupService(overrides = {}) {
  const defaultMock = {
    cleanupOrphanedData: jest.fn().mockResolvedValue({ success: true, deleted: {} }),
    deleteUser: jest.fn().mockResolvedValue({ success: true }),
    backfillContacts: jest.fn().mockResolvedValue({ success: true, created: 0 }),
    cleanupTestData: jest.fn().mockResolvedValue({ success: true, results: {} }),
    forceConnect: jest.fn().mockResolvedValue({ success: true, room: {}, pairingId: 1 }),
    repairPairings: jest.fn().mockResolvedValue({ success: true, repaired: 0 }),
  };
  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock InvitationService
 */
function mockInvitationService(overrides = {}) {
  const defaultMock = {
    validateToken: jest.fn().mockResolvedValue({ valid: true }),
    validateCode: jest.fn().mockResolvedValue({ valid: true }),
    getUserInvitations: jest.fn().mockResolvedValue([]),
    getActiveInvitation: jest.fn().mockResolvedValue({ hasInvite: false }),
    createInvitation: jest.fn().mockResolvedValue({ success: true, token: 'test-token' }),
    createInvitationWithEmail: jest.fn().mockResolvedValue({ success: true, token: 'test-token', emailSent: false }),
    resendInvitation: jest.fn().mockResolvedValue({ success: true, token: 'new-token' }),
    resendInvitationWithEmail: jest.fn().mockResolvedValue({ success: true, token: 'new-token' }),
    cancelInvitation: jest.fn().mockResolvedValue({ success: true }),
    acceptByToken: jest.fn().mockResolvedValue({ success: true, invitation: {} }),
    acceptByCode: jest.fn().mockResolvedValue({ success: true, invitation: {} }),
    declineByToken: jest.fn().mockResolvedValue({ success: true }),
  };
  return { ...defaultMock, ...overrides };
}

module.exports = {
  mockProfileService,
  mockRepository,
  mockRequest,
  mockResponse,
  mockNext,
  resetServiceMock,
  mockDebugService,
  mockStatisticsService,
  mockCleanupService,
  mockInvitationService,
};

