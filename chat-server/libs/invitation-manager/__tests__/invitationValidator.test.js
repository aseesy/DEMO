/**
 * Unit Tests: Invitation Validator
 *
 * Tests for validating and processing co-parent invitations.
 * Uses mock database for isolation.
 *
 * Feature: 003-account-creation-coparent-invitation
 */

const invitationValidator = require('../invitationValidator');
const { INVITATION_STATUS } = require('../invitationCreator');

describe('Invitation Validator', () => {
  // Mock database
  const createMockDb = (returnRows = []) => ({
    query: jest.fn().mockResolvedValue({
      rows: returnRows,
      rowCount: returnRows.length,
    }),
  });

  const validToken = 'a'.repeat(64);
  const tokenHash = invitationValidator.hashToken(validToken);

  describe('validateToken', () => {
    it('should validate a valid pending invitation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: futureDate.toISOString(),
        inviter_id: 'inviter123',
        inviter_name: 'Alex',
        inviter_email: 'alex@test.com',
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.validateToken(validToken, db);

      expect(result.valid).toBe(true);
      expect(result.invitation).toBeDefined();
      expect(result.inviterName).toBe('Alex');
    });

    it('should reject invalid token', async () => {
      const db = createMockDb([]);

      const result = await invitationValidator.validateToken('invalid-token', db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_TOKEN');
    });

    it('should reject missing token', async () => {
      const db = createMockDb([]);

      const result = await invitationValidator.validateToken(null, db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('TOKEN_REQUIRED');
    });

    it('should reject already accepted invitation', async () => {
      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'accepted',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.validateToken(validToken, db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('ALREADY_ACCEPTED');
    });

    it('should reject cancelled invitation', async () => {
      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'cancelled',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.validateToken(validToken, db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('CANCELLED');
    });

    it('should reject declined invitation', async () => {
      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'declined',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.validateToken(validToken, db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('DECLINED');
    });

    it('should reject and update expired invitation', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: pastDate.toISOString(),
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.validateToken(validToken, db);

      expect(result.valid).toBe(false);
      expect(result.code).toBe('EXPIRED');
      // Should have updated status in DB
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept valid invitation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: futureDate.toISOString(),
        inviter_id: 'inviter123',
        room_id: 'room123',
        inviter_name: 'Alex',
        inviter_email: 'alex@test.com',
      };

      const acceptedInvitation = { ...mockInvitation, status: 'accepted', invitee_id: 'accepter123' };

      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [mockInvitation], rowCount: 1 }) // validateToken SELECT
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // co-parent limit check
        .mockResolvedValueOnce({ rows: [acceptedInvitation], rowCount: 1 }); // UPDATE

      const result = await invitationValidator.acceptInvitation(validToken, 'accepter123', db);

      expect(result.invitation.status).toBe('accepted');
      expect(result.inviterId).toBe('inviter123');
      expect(result.inviteeId).toBe('accepter123');
      expect(result.roomId).toBe('room123');
    });

    it('should throw error for invalid token', async () => {
      const db = createMockDb([]);

      await expect(
        invitationValidator.acceptInvitation('invalid', 'user123', db)
      ).rejects.toThrow('Invalid invitation token');
    });

    it('should throw error when accepter has reached co-parent limit', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: futureDate.toISOString(),
        inviter_name: 'Alex',
        inviter_email: 'alex@test.com',
      };

      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [mockInvitation], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 }); // limit reached

      await expect(
        invitationValidator.acceptInvitation(validToken, 'user123', db)
      ).rejects.toThrow('Co-parent limit reached');
    });

    it('should throw error for missing parameters', async () => {
      const db = createMockDb([]);

      await expect(
        invitationValidator.acceptInvitation(null, 'user123', db)
      ).rejects.toThrow('token, acceptingUserId, and db are required');
    });
  });

  describe('declineInvitation', () => {
    it('should decline valid invitation', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockInvitation = {
        id: 1,
        token_hash: tokenHash,
        status: 'pending',
        expires_at: futureDate.toISOString(),
        inviter_id: 'inviter123',
        inviter_name: 'Alex',
        inviter_email: 'alex@test.com',
      };

      const declinedInvitation = { ...mockInvitation, status: 'declined', invitee_id: 'decliner123' };

      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [mockInvitation], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [declinedInvitation], rowCount: 1 });

      const result = await invitationValidator.declineInvitation(validToken, 'decliner123', db);

      expect(result.invitation.status).toBe('declined');
      expect(result.inviterId).toBe('inviter123');
    });

    it('should throw error for invalid token', async () => {
      const db = createMockDb([]);

      await expect(
        invitationValidator.declineInvitation('invalid', 'user123', db)
      ).rejects.toThrow('Invalid invitation token');
    });
  });

  describe('getInvitationById', () => {
    it('should return invitation by ID', async () => {
      const mockInvitation = {
        id: 1,
        inviter_id: 'inviter123',
        inviter_name: 'Alex',
      };

      const db = createMockDb([mockInvitation]);

      const result = await invitationValidator.getInvitationById(1, db);

      expect(result).toEqual(mockInvitation);
    });

    it('should return null for non-existent ID', async () => {
      const db = createMockDb([]);

      const result = await invitationValidator.getInvitationById(999, db);

      expect(result).toBeNull();
    });

    it('should return null for missing parameters', async () => {
      const db = createMockDb([]);

      const result = await invitationValidator.getInvitationById(null, db);

      expect(result).toBeNull();
    });
  });

  describe('getUserInvitations', () => {
    it('should return sent and received invitations', async () => {
      const sentInvitations = [{ id: 1, inviter_id: 'user1' }];
      const receivedInvitations = [{ id: 2, invitee_id: 'user1' }];

      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: sentInvitations, rowCount: 1 })
        .mockResolvedValueOnce({ rows: receivedInvitations, rowCount: 1 });

      const result = await invitationValidator.getUserInvitations('user1', db);

      expect(result.sent).toEqual(sentInvitations);
      expect(result.received).toEqual(receivedInvitations);
    });

    it('should filter by status when provided', async () => {
      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await invitationValidator.getUserInvitations('user1', db, { status: 'pending' });

      expect(db.query.mock.calls[0][0]).toContain('status = $2');
      expect(db.query.mock.calls[0][1]).toContain('pending');
    });

    it('should throw error for missing parameters', async () => {
      const db = createMockDb([]);

      await expect(
        invitationValidator.getUserInvitations(null, db)
      ).rejects.toThrow('userId and db are required');
    });
  });

  describe('expireOldInvitations', () => {
    it('should expire pending invitations past expiration date', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rowCount: 5 });

      const result = await invitationValidator.expireOldInvitations(db);

      expect(result).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE invitations'),
        [INVITATION_STATUS.EXPIRED, INVITATION_STATUS.PENDING]
      );
    });

    it('should return 0 when no invitations to expire', async () => {
      const db = createMockDb([]);
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const result = await invitationValidator.expireOldInvitations(db);

      expect(result).toBe(0);
    });

    it('should throw error for missing db', async () => {
      await expect(
        invitationValidator.expireOldInvitations(null)
      ).rejects.toThrow('db is required');
    });
  });
});
