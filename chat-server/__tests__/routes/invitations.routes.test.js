/* global jest, describe, beforeEach, it, expect */
/**
 * Invitations Routes Integration Tests
 *
 * Tests the invitations API endpoints with mocked services to verify
 * proper delegation, validation, and error handling.
 */

const request = require('supertest');
const express = require('express');
const { mockInvitationService } = require('../utils/serviceMocks');

// Mock the services module
jest.mock('../../src/services', () => ({
  invitationService: mockInvitationService(),
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  verifyAuth: (req, res, next) => {
    req.user = { userId: 1, username: 'testuser', id: 1 };
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

let invitationRoutes;
let invitationService;

describe('Invitations Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get fresh service mock
    invitationService = require('../../src/services').invitationService;

    // Create Express app
    app = express();
    app.use(express.json());

    // Load route module fresh
    delete require.cache[require.resolve('../../routes/invitations')];
    invitationRoutes = require('../../routes/invitations');

    // Mount routes
    app.use('/api/invitations', invitationRoutes);
  });

  describe('Validation Endpoints', () => {
    describe('GET /api/invitations/validate/:token', () => {
      it('should validate token successfully', async () => {
        const mockValidation = {
          valid: true,
          inviterName: 'Test User',
          inviterEmail: 'test@example.com',
        };
        invitationService.validateToken.mockResolvedValue(mockValidation);

        const response = await request(app)
          .get('/api/invitations/validate/test-token-123')
          .expect(200);

        expect(response.body).toEqual(mockValidation);
        expect(invitationService.validateToken).toHaveBeenCalledWith('test-token-123');
      });

      it('should handle invalid token', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.validateToken.mockRejectedValue(
          new ValidationError('Invalid token', 'token')
        );

        const response = await request(app)
          .get('/api/invitations/validate/invalid-token')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle expired token', async () => {
        const { ExpiredError } = require('../../src/services/errors');
        const expiredError = new ExpiredError('Token expired');
        // ExpiredError typically uses 410 status code
        if (!expiredError.statusCode) {
          expiredError.statusCode = 410;
        }
        invitationService.validateToken.mockRejectedValue(expiredError);

        const response = await request(app)
          .get('/api/invitations/validate/expired-token')
          .expect(410);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/invitations/validate-code/:code', () => {
      it('should validate code successfully', async () => {
        const mockValidation = {
          valid: true,
          inviterName: 'Test User',
          code: 'LZ-ABC123',
        };
        invitationService.validateCode.mockResolvedValue(mockValidation);

        const response = await request(app)
          .get('/api/invitations/validate-code/LZ-ABC123')
          .expect(200);

        expect(response.body).toEqual(mockValidation);
        expect(invitationService.validateCode).toHaveBeenCalledWith('LZ-ABC123');
      });

      it('should handle invalid code', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.validateCode.mockRejectedValue(
          new ValidationError('Invalid code', 'code')
        );

        const response = await request(app)
          .get('/api/invitations/validate-code/INVALID')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Invitation Management Endpoints', () => {
    describe('GET /api/invitations', () => {
      it('should return user invitations when authenticated', async () => {
        const mockInvitations = [
          { id: 1, status: 'pending', invitee_email: 'test@example.com' },
          { id: 2, status: 'accepted', invitee_email: 'test2@example.com' },
        ];
        invitationService.getUserInvitations.mockResolvedValue(mockInvitations);

        const response = await request(app)
          .get('/api/invitations')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockInvitations);
        expect(invitationService.getUserInvitations).toHaveBeenCalledWith(1, {
          status: null,
        });
      });

      it('should filter by status when provided', async () => {
        const mockInvitations = [{ id: 1, status: 'pending' }];
        invitationService.getUserInvitations.mockResolvedValue(mockInvitations);

        const response = await request(app)
          .get('/api/invitations?status=pending')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockInvitations);
        expect(invitationService.getUserInvitations).toHaveBeenCalledWith(1, {
          status: 'pending',
        });
      });
    });

    describe('GET /api/invitations/my-invite', () => {
      it('should return active invitation', async () => {
        const mockInvitation = {
          hasInvite: true,
          invitation: {
            id: 1,
            shortCode: 'LZ-ABC123',
            status: 'pending',
          },
          inviteUrl: 'https://coparentliaizen.com/accept-invite?token=test',
        };
        invitationService.getActiveInvitation.mockResolvedValue(mockInvitation);

        const response = await request(app)
          .get('/api/invitations/my-invite')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockInvitation);
        expect(invitationService.getActiveInvitation).toHaveBeenCalledWith(1);
      });

      it('should return no invite when none exists', async () => {
        invitationService.getActiveInvitation.mockResolvedValue({ hasInvite: false });

        const response = await request(app)
          .get('/api/invitations/my-invite')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual({ hasInvite: false });
      });
    });

    describe('POST /api/invitations/create', () => {
      it('should create invitation successfully', async () => {
        const mockResult = {
          success: true,
          token: 'new-token-123',
          shortCode: 'LZ-XYZ789',
          inviteUrl: 'https://coparentliaizen.com/accept-invite?token=new-token-123',
          emailSent: true,
        };
        invitationService.createInvitationWithEmail.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/create')
          .set('Authorization', 'Bearer test-token')
          .send({ inviteeEmail: 'newuser@example.com' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.createInvitationWithEmail).toHaveBeenCalledWith(
          1,
          'newuser@example.com'
        );
      });

      it('should create invitation without email', async () => {
        const mockResult = {
          success: true,
          token: 'new-token-123',
          shortCode: 'LZ-XYZ789',
          emailSent: false,
        };
        invitationService.createInvitationWithEmail.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/create')
          .set('Authorization', 'Bearer test-token')
          .send({})
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.createInvitationWithEmail).toHaveBeenCalledWith(1, undefined);
      });

      it('should handle co-parent limit error', async () => {
        const { ConflictError } = require('../../src/services/errors');
        invitationService.createInvitationWithEmail.mockRejectedValue(
          new ConflictError('Co-parent limit reached')
        );

        const response = await request(app)
          .post('/api/invitations/create')
          .set('Authorization', 'Bearer test-token')
          .send({ inviteeEmail: 'test@example.com' })
          .expect(409);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/invitations/resend/:id', () => {
      it('should resend invitation successfully', async () => {
        const mockResult = {
          success: true,
          token: 'new-token-456',
          invitation: { id: 1, status: 'pending' },
        };
        invitationService.resendInvitationWithEmail.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/resend/1')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.resendInvitationWithEmail).toHaveBeenCalledWith(1, 1);
      });

      it('should handle invalid invitation ID', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.resendInvitationWithEmail.mockRejectedValue(
          new ValidationError('Invitation ID is required', 'invitationId')
        );

        const response = await request(app)
          .post('/api/invitations/resend/invalid')
          .set('Authorization', 'Bearer test-token')
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/invitations/:id', () => {
      it('should cancel invitation successfully', async () => {
        const mockResult = { success: true, message: 'Invitation cancelled' };
        invitationService.cancelInvitation.mockResolvedValue(mockResult);

        const response = await request(app)
          .delete('/api/invitations/1')
          .set('Authorization', 'Bearer test-token')
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.cancelInvitation).toHaveBeenCalledWith(1, 1);
      });

      it('should handle not found invitation', async () => {
        const { NotFoundError } = require('../../src/services/errors');
        invitationService.cancelInvitation.mockRejectedValue(
          new NotFoundError('Invitation', 999)
        );

        const response = await request(app)
          .delete('/api/invitations/999')
          .set('Authorization', 'Bearer test-token')
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Acceptance/Decline Endpoints', () => {
    describe('POST /api/invitations/accept', () => {
      it('should accept invitation by token successfully', async () => {
        const mockResult = {
          success: true,
          invitation: { id: 1, status: 'accepted' },
          sharedRoom: { id: 'room-123' },
        };
        invitationService.acceptByToken.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/accept')
          .set('Authorization', 'Bearer test-token')
          .send({ token: 'valid-token-123' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.acceptByToken).toHaveBeenCalledWith('valid-token-123', 1);
      });

      it('should handle missing token', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.acceptByToken.mockRejectedValue(
          new ValidationError('Invitation token is required', 'token')
        );

        const response = await request(app)
          .post('/api/invitations/accept')
          .set('Authorization', 'Bearer test-token')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should handle co-parent limit error', async () => {
        const { ConflictError } = require('../../src/services/errors');
        invitationService.acceptByToken.mockRejectedValue(
          new ConflictError('Co-parent limit reached')
        );

        const response = await request(app)
          .post('/api/invitations/accept')
          .set('Authorization', 'Bearer test-token')
          .send({ token: 'test-token' })
          .expect(409);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/invitations/accept-code', () => {
      it('should accept invitation by code successfully', async () => {
        const mockResult = {
          success: true,
          invitation: { id: 1, status: 'accepted' },
          sharedRoom: { id: 'room-123' },
        };
        invitationService.acceptByCode.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/accept-code')
          .set('Authorization', 'Bearer test-token')
          .send({ code: 'LZ-ABC123' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.acceptByCode).toHaveBeenCalledWith('LZ-ABC123', 1);
      });

      it('should handle invalid code', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.acceptByCode.mockRejectedValue(
          new ValidationError('Invite code is required', 'code')
        );

        const response = await request(app)
          .post('/api/invitations/accept-code')
          .set('Authorization', 'Bearer test-token')
          .send({ code: '' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/invitations/decline', () => {
      it('should decline invitation successfully', async () => {
        const mockResult = {
          success: true,
          invitation: { id: 1, status: 'declined' },
        };
        invitationService.declineByToken.mockResolvedValue(mockResult);

        const response = await request(app)
          .post('/api/invitations/decline')
          .set('Authorization', 'Bearer test-token')
          .send({ token: 'valid-token-123' })
          .expect(200);

        expect(response.body).toEqual(mockResult);
        expect(invitationService.declineByToken).toHaveBeenCalledWith('valid-token-123', 1);
      });

      it('should handle missing token', async () => {
        const { ValidationError } = require('../../src/services/errors');
        invitationService.declineByToken.mockRejectedValue(
          new ValidationError('Invitation token is required', 'token')
        );

        const response = await request(app)
          .post('/api/invitations/decline')
          .set('Authorization', 'Bearer test-token')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      invitationService.getUserInvitations.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/invitations')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle validation errors with proper status codes', async () => {
      const { ValidationError } = require('../../src/services/errors');
      invitationService.createInvitationWithEmail.mockRejectedValue(
        new ValidationError('Invalid email', 'inviteeEmail')
      );

      const response = await request(app)
        .post('/api/invitations/create')
        .set('Authorization', 'Bearer test-token')
        .send({ inviteeEmail: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

