/**
 * Unit Tests: Invitation Creator
 *
 * Tests for creating and managing co-parent invitations.
 * Uses mock database for isolation.
 *
 * Feature: 003-account-creation-coparent-invitation
 */

const invitationCreator = require('../invitationCreator');

describe('Invitation Creator', () => {
  // Mock database
  const createMockDb = (returnRows = []) => ({
    query: jest.fn().mockResolvedValue({
      rows: returnRows,
      rowCount: returnRows.length,
    }),
  });

  describe('generateToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = invitationCreator.generateToken();
      expect(token).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = invitationCreator.generateToken();
      const token2 = invitationCreator.generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token-12345';
      const hash1 = invitationCreator.hashToken(token);
      const hash2 = invitationCreator.hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const hash1 = invitationCreator.hashToken('token1');
      const hash2 = invitationCreator.hashToken('token2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('calculateExpiration', () => {
    it('should return date 7 days in future by default', () => {
      const expiration = invitationCreator.calculateExpiration();
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);

      const expirationDate = new Date(expiration);
      // Allow 1 minute tolerance for test execution
      expect(Math.abs(expirationDate - expectedDate)).toBeLessThan(60000);
    });

    it('should allow custom expiration days', () => {
      const expiration = invitationCreator.calculateExpiration(30);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      const expirationDate = new Date(expiration);
      expect(Math.abs(expirationDate - expectedDate)).toBeLessThan(60000);
    });
  });

  describe('findExistingUser', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 'user123', display_name: 'Alex', email: 'alex@test.com' };
      const db = createMockDb([mockUser]);

      const result = await invitationCreator.findExistingUser('alex@test.com', db);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('LOWER(email)'), [
        'alex@test.com',
      ]);
    });

    it('should normalize email to lowercase', async () => {
      const db = createMockDb([]);

      await invitationCreator.findExistingUser('ALEX@TEST.COM', db);

      expect(db.query.mock.calls[0][1][0]).toBe('alex@test.com');
    });

    it('should return null for non-existent user', async () => {
      const db = createMockDb([]);

      const result = await invitationCreator.findExistingUser('unknown@test.com', db);

      expect(result).toBeNull();
    });

    it('should return null for missing email', async () => {
      const db = createMockDb([]);

      const result = await invitationCreator.findExistingUser(null, db);

      expect(result).toBeNull();
    });
  });

  describe('findExistingInvitation', () => {
    it('should find active invitation', async () => {
      const mockInvitation = { id: 1, inviter_id: 'user1', invitee_email: 'test@test.com' };
      const db = createMockDb([mockInvitation]);

      const result = await invitationCreator.findExistingInvitation('user1', 'test@test.com', db);

      expect(result).toEqual(mockInvitation);
    });

    it('should return null for no active invitation', async () => {
      const db = createMockDb([]);

      const result = await invitationCreator.findExistingInvitation('user1', 'test@test.com', db);

      expect(result).toBeNull();
    });
  });

  describe('hasReachedCoparentLimit', () => {
    it('should return true when user has 1 accepted invitation', async () => {
      const db = createMockDb([{ count: '1' }]);

      const result = await invitationCreator.hasReachedCoparentLimit('user1', db);

      expect(result).toBe(true);
    });

    it('should return false when user has no accepted invitations', async () => {
      const db = createMockDb([{ count: '0' }]);

      const result = await invitationCreator.hasReachedCoparentLimit('user1', db);

      expect(result).toBe(false);
    });
  });

  describe('createInvitation', () => {
    it('should create invitation for new user', async () => {
      const db = createMockDb([]);
      // Mock: no limit reached, no existing invitation, no existing user
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // hasReachedCoparentLimit
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // getActiveInvitationByEmail
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // getUserByEmail
        .mockResolvedValueOnce({ rows: [{ id: 1, invitee_email: 'new@test.com' }], rowCount: 1 }); // INSERT

      const result = await invitationCreator.createInvitation(
        {
          inviterId: 'user1',
          inviteeEmail: 'new@test.com',
        },
        db
      );

      expect(result.invitation).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.isExistingUser).toBe(false);
    });

    it('should detect existing user and set isExistingUser flag', async () => {
      const existingUser = { id: 'existing123', display_name: 'Jordan', email: 'jordan@test.com' };
      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [existingUser], rowCount: 1 }) // getUserByEmail
        .mockResolvedValueOnce({ rows: [{ id: 1, invitee_id: 'existing123' }], rowCount: 1 });

      const result = await invitationCreator.createInvitation(
        {
          inviterId: 'user1',
          inviteeEmail: 'jordan@test.com',
        },
        db
      );

      expect(result.isExistingUser).toBe(true);
      expect(result.existingUser).toEqual(existingUser);
    });

    it('should throw error when co-parent limit reached', async () => {
      const db = createMockDb([{ count: '1' }]);

      await expect(
        invitationCreator.createInvitation(
          {
            inviterId: 'user1',
            inviteeEmail: 'test@test.com',
          },
          db
        )
      ).rejects.toThrow('Co-parent limit reached');
    });

    it('should throw error when active invitation exists', async () => {
      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // getActiveInvitationByEmail

      await expect(
        invitationCreator.createInvitation(
          {
            inviterId: 'user1',
            inviteeEmail: 'test@test.com',
          },
          db
        )
      ).rejects.toThrow('active invitation already exists');
    });

    it('should throw error for missing inviterId', async () => {
      const db = createMockDb([]);

      await expect(
        invitationCreator.createInvitation(
          {
            inviteeEmail: 'test@test.com',
          },
          db
        )
      ).rejects.toThrow('inviterId is required');
    });

    it('should throw error for missing inviteeEmail', async () => {
      const db = createMockDb([]);

      await expect(
        invitationCreator.createInvitation(
          {
            inviterId: 'user1',
          },
          db
        )
      ).rejects.toThrow('inviteeEmail is required');
    });

    it('should normalize email to lowercase', async () => {
      const db = createMockDb([]);
      db.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ id: 1, invitee_email: 'test@test.com' }], rowCount: 1 });

      await invitationCreator.createInvitation(
        {
          inviterId: 'user1',
          inviteeEmail: '  TEST@TEST.COM  ',
        },
        db
      );

      // Check that INSERT was called with lowercase email
      const insertCall = db.query.mock.calls[3];
      expect(insertCall[1][2]).toBe('test@test.com');
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel pending invitation', async () => {
      const db = createMockDb([{ id: 1, status: 'cancelled' }]);

      const result = await invitationCreator.cancelInvitation(1, 'user1', db);

      expect(result.status).toBe('cancelled');
    });

    it('should throw error for non-existent invitation', async () => {
      const db = createMockDb([]);

      await expect(invitationCreator.cancelInvitation(999, 'user1', db)).rejects.toThrow(
        'Invitation not found or cannot be cancelled'
      );
    });
  });

  describe('resendInvitation', () => {
    it('should generate new token and update expiration', async () => {
      const db = createMockDb([{ id: 1, status: 'pending' }]);

      const result = await invitationCreator.resendInvitation(1, 'user1', db);

      expect(result.invitation).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
    });

    it('should throw error for non-existent invitation', async () => {
      const db = createMockDb([]);

      await expect(invitationCreator.resendInvitation(999, 'user1', db)).rejects.toThrow(
        'Invitation not found or cannot be resent'
      );
    });
  });

  describe('INVITATION_STATUS', () => {
    it('should have all expected status values', () => {
      expect(invitationCreator.INVITATION_STATUS.PENDING).toBe('pending');
      expect(invitationCreator.INVITATION_STATUS.ACCEPTED).toBe('accepted');
      expect(invitationCreator.INVITATION_STATUS.DECLINED).toBe('declined');
      expect(invitationCreator.INVITATION_STATUS.EXPIRED).toBe('expired');
      expect(invitationCreator.INVITATION_STATUS.CANCELLED).toBe('cancelled');
    });
  });

  describe('INVITATION_TYPE', () => {
    it('should have coparent type', () => {
      expect(invitationCreator.INVITATION_TYPE.COPARENT).toBe('coparent');
    });
  });
});
