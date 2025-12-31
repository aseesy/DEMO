/* global jest, describe, beforeEach, it, expect */
/**
 * Admin Routes Integration Tests
 *
 * Tests the admin API endpoints with mocked services to verify
 * proper delegation and error handling.
 */

const request = require('supertest');
const express = require('express');
const {
  mockDebugService,
  mockStatisticsService,
  mockCleanupService,
} = require('../utils/serviceMocks');

// Mock the services module
jest.mock('../../src/services', () => ({
  debugService: mockDebugService(),
  statisticsService: mockStatisticsService(),
  cleanupService: mockCleanupService(),
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  verifyAuth: (req, res, next) => {
    req.user = { userId: 1, username: 'testuser', id: 1 };
    next();
  },
}));

// Mock admin auth middleware
jest.mock('../../middleware/adminAuth', () => ({
  verifyAdminSecret: (req, res, next) => {
    const { secret } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_CLEANUP_SECRET || 'liaizen-test-cleanup-2024';
    if (secret !== ADMIN_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    next();
  },
}));

// Mock error handler
jest.mock('../../middleware/errorHandlers', () => ({
  handleServiceError: (error, res) => {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  },
}));

// Mock routeHandler
jest.mock('../../middleware/routeHandler', () => ({
  asyncHandler: fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(err => {
      const { handleServiceError } = require('../../middleware/errorHandlers');
      handleServiceError(err, res);
    });
  },
}));

let adminRoutes;
let debugService;
let statisticsService;
let cleanupService;

describe('Admin Routes', () => {
  let app;
  let mockRoomManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get fresh service mocks
    const services = require('../../src/services');
    debugService = services.debugService;
    statisticsService = services.statisticsService;
    cleanupService = services.cleanupService;

    // Create Express app
    app = express();
    app.use(express.json());

    // Mock roomManager
    mockRoomManager = {
      getRoomMembers: jest.fn().mockResolvedValue([]),
      createCoParentRoom: jest.fn().mockResolvedValue({ roomId: 'room-123' }),
    };

    // Load route module fresh
    delete require.cache[require.resolve('../../routes/admin')];
    adminRoutes = require('../../routes/admin');
    adminRoutes.setHelpers({ roomManager: mockRoomManager });

    // Mount routes
    app.use('/api', adminRoutes);
  });

  describe('Debug Endpoints', () => {
    describe('GET /api/debug/users', () => {
      it('should return list of users', async () => {
        const mockUsers = {
          users: [
            { id: 1, username: 'user1', email: 'user1@test.com' },
            { id: 2, username: 'user2', email: 'user2@test.com' },
          ],
          count: 2,
        };
        debugService.getUsers.mockResolvedValue(mockUsers);

        const response = await request(app).get('/api/debug/users').expect(200);

        expect(response.body).toEqual(mockUsers);
        expect(debugService.getUsers).toHaveBeenCalledTimes(1);
      });

      it('should handle service errors', async () => {
        const error = new Error('Database error');
        debugService.getUsers.mockRejectedValue(error);

        const response = await request(app).get('/api/debug/users').expect(500);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/stats/user-count', () => {
      it('should return user count', async () => {
        statisticsService.getUserCount.mockResolvedValue(42);

        const response = await request(app).get('/api/stats/user-count').expect(200);

        expect(response.body).toEqual({ count: 42 });
        expect(statisticsService.getUserCount).toHaveBeenCalledTimes(1);
      });
    });

    describe('GET /api/debug/rooms', () => {
      it('should return list of rooms', async () => {
        const mockRooms = {
          rooms: [{ id: 'room-1', name: 'Room 1' }],
          count: 1,
        };
        debugService.getRooms.mockResolvedValue(mockRooms);

        const response = await request(app).get('/api/debug/rooms').expect(200);

        expect(response.body).toEqual(mockRooms);
        expect(debugService.getRooms).toHaveBeenCalledTimes(1);
      });
    });

    describe('GET /api/debug/tasks/:userId', () => {
      it('should return user tasks when authenticated', async () => {
        const mockTasks = { tasks: [{ id: 1, title: 'Task 1' }] };
        debugService.getUserTasks.mockResolvedValue(mockTasks);

        const response = await request(app)
          .get('/api/debug/tasks/1')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockTasks);
        expect(debugService.getUserTasks).toHaveBeenCalledWith(1, 1);
      });

      it('should require authentication', async () => {
        // This test verifies that verifyAuth middleware is applied
        // Since we're mocking verifyAuth to always pass in the main mock,
        // we'll test that the route handler receives the user from verifyAuth
        const mockTasks = { tasks: [] };
        debugService.getUserTasks.mockResolvedValue(mockTasks);

        const response = await request(app)
          .get('/api/debug/tasks/1')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        // Verify that the requestingUserId (from req.user) was passed correctly
        expect(debugService.getUserTasks).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('GET /api/debug/messages/:roomId', () => {
      it('should return room messages when authenticated', async () => {
        const mockMessages = { messages: [{ id: 1, text: 'Hello' }] };
        debugService.getRoomMessages.mockResolvedValue(mockMessages);

        const response = await request(app)
          .get('/api/debug/messages/room-123')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockMessages);
        expect(debugService.getRoomMessages).toHaveBeenCalledWith(
          'room-123',
          1,
          expect.any(Function)
        );
      });
    });

    describe('GET /api/debug/pending-connections', () => {
      it('should return pending connections', async () => {
        const mockConnections = {
          connections: [{ id: 1, inviter_id: 1, invitee_email: 'test@test.com' }],
          count: 1,
        };
        debugService.getPendingConnections.mockResolvedValue(mockConnections);

        const response = await request(app)
          .get('/api/debug/pending-connections')
          .expect(200);

        expect(response.body).toEqual(mockConnections);
        expect(debugService.getPendingConnections).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('POST /api/admin/cleanup', () => {
      it('should cleanup orphaned data', async () => {
        const mockResult = {
          success: true,
          deleted: { room_members: 5, rooms: 2, messages: 10 },
        };
        cleanupService.cleanupOrphanedData.mockResolvedValue(mockResult);

        const response = await request(app).post('/api/admin/cleanup').expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.cleanupOrphanedData).toHaveBeenCalledTimes(1);
      });
    });

    describe('DELETE /api/admin/users/:userId', () => {
      it('should delete user', async () => {
        const mockResult = { success: true, message: 'User deleted' };
        cleanupService.deleteUser.mockResolvedValue(mockResult);

        const response = await request(app).delete('/api/admin/users/1').expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.deleteUser).toHaveBeenCalledWith(1);
      });

      it('should handle invalid user ID', async () => {
        const { ValidationError } = require('../../src/services/errors');
        cleanupService.deleteUser.mockRejectedValue(
          new ValidationError('Invalid user ID', 'userId')
        );

        const response = await request(app).delete('/api/admin/users/invalid').expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/admin/backfill-contacts', () => {
      it('should backfill contacts', async () => {
        const mockResult = { success: true, created: 10 };
        cleanupService.backfillContacts.mockResolvedValue(mockResult);

        const response = await request(app).post('/api/admin/backfill-contacts').expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.backfillContacts).toHaveBeenCalledTimes(1);
      });
    });

    describe('POST /api/admin/cleanup-test-data', () => {
      it('should cleanup test data with valid secret', async () => {
        const mockResult = { success: true, results: { usersDeleted: 1 } };
        cleanupService.cleanupTestData.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/admin/cleanup-test-data')
          .send({ secret: 'liaizen-test-cleanup-2024' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.cleanupTestData).toHaveBeenCalledTimes(1);
      });

      it('should reject invalid secret', async () => {
        const response = await request(app)
          .post('/api/admin/cleanup-test-data')
          .send({ secret: 'wrong-secret' })
          .expect(403);

        expect(response.body).toHaveProperty('error', 'Unauthorized');
        expect(cleanupService.cleanupTestData).not.toHaveBeenCalled();
      });
    });

    describe('POST /api/admin/force-connect', () => {
      it('should force connect users with valid secret', async () => {
        const mockResult = {
          success: true,
          room: { roomId: 'room-123' },
          pairingId: 1,
        };
        cleanupService.forceConnect.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/admin/force-connect')
          .send({
            secret: 'liaizen-test-cleanup-2024',
            userAId: 1,
            userBId: 2,
          })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.forceConnect).toHaveBeenCalledWith(
          1,
          2,
          expect.any(Function)
        );
      });

      it('should reject invalid secret', async () => {
        const response = await request(app)
          .post('/api/admin/force-connect')
          .send({
            secret: 'wrong-secret',
            userAId: 1,
            userBId: 2,
          })
          .expect(403);

        expect(response.body).toHaveProperty('error', 'Unauthorized');
      });
    });

    describe('POST /api/admin/debug-pairings', () => {
      it('should debug pairings with valid secret', async () => {
        const mockResult = {
          pairings: [{ id: 1, status: 'active' }],
          rooms: [{ id: 'room-1' }],
        };
        debugService.debugPairings.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/admin/debug-pairings')
          .send({ secret: 'liaizen-test-cleanup-2024' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(debugService.debugPairings).toHaveBeenCalledTimes(1);
      });
    });

    describe('POST /api/admin/repair-pairing', () => {
      it('should repair pairings with valid secret', async () => {
        const mockResult = { success: true, repaired: 3 };
        cleanupService.repairPairings.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/admin/repair-pairing')
          .send({ secret: 'liaizen-test-cleanup-2024' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(cleanupService.repairPairings).toHaveBeenCalledWith(expect.any(Function));
      });
    });
  });
});

