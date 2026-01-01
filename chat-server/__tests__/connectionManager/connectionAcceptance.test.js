/* eslint-env jest */
/**
 * Connection Acceptance Tests
 */

const {
  acceptPendingConnection,
  createCoParentContacts,
  createContactIfNotExists,
} = require('../../connectionManager/connectionAcceptance');

// Mock dependencies
jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../../dbSafe', () => ({
  safeSelect: jest.fn(),
  safeInsert: jest.fn(),
  safeUpdate: jest.fn(),
  parseResult: jest.fn(result => result),
}));

jest.mock('../../roomManager', () => ({
  getUserRoom: jest.fn(),
}));

jest.mock('../../connectionManager/tokenService', () => ({
  validateConnectionToken: jest.fn(),
}));

const dbPostgres = require('../../dbPostgres');
const dbSafe = require('../../dbSafe');
const roomManager = require('../../roomManager');
const { validateConnectionToken } = require('../../connectionManager/tokenService');

describe('Connection Acceptance Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('acceptPendingConnection', () => {
    const mockConnection = {
      id: 1,
      token: 'validtoken',
      inviterId: 10,
      inviteeEmail: 'invitee@test.com',
      status: 'pending',
    };

    beforeEach(() => {
      validateConnectionToken.mockResolvedValue(mockConnection);
      roomManager.getUserRoom.mockImplementation(userId => {
        if (userId === 10) return { roomId: 'room-inviter' };
        if (userId === 20) return { roomId: 'room-invitee' };
        return null;
      });
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);
      dbSafe.safeInsert.mockResolvedValue(1);
      dbSafe.safeUpdate.mockResolvedValue({ rowCount: 1 });
      dbPostgres.query.mockResolvedValue({ rows: [] });
    });

    it('should accept a valid pending connection', async () => {
      const result = await acceptPendingConnection('validtoken', 20);

      expect(result).toEqual({
        success: true,
        inviterRoom: 'room-inviter',
        inviteeRoom: 'room-invitee',
      });
    });

    it('should throw error for invalid token', async () => {
      validateConnectionToken.mockResolvedValue(null);

      await expect(acceptPendingConnection('invalidtoken', 20)).rejects.toThrow(
        'Invalid or expired invitation token'
      );
    });

    it('should throw error if inviter has no room', async () => {
      roomManager.getUserRoom.mockResolvedValue(null);

      await expect(acceptPendingConnection('validtoken', 20)).rejects.toThrow(
        'Inviter does not have a room'
      );
    });

    it('should add invitee to inviter room', async () => {
      await acceptPendingConnection('validtoken', 20);

      expect(dbSafe.safeInsert).toHaveBeenCalledWith(
        'room_members',
        expect.objectContaining({
          room_id: 'room-inviter',
          user_id: 20,
          role: 'member',
        })
      );
    });

    it('should not add invitee if already a member', async () => {
      dbSafe.safeSelect.mockImplementation((table, conditions) => {
        if (table === 'room_members' && conditions.user_id === 20) {
          return [{ room_id: 'room-inviter', user_id: 20 }];
        }
        return [];
      });
      dbSafe.parseResult.mockImplementation(result => result);

      await acceptPendingConnection('validtoken', 20);

      // Should not insert room_members for invitee
      const roomMemberInserts = dbSafe.safeInsert.mock.calls.filter(
        call => call[0] === 'room_members' && call[1].user_id === 20
      );
      expect(roomMemberInserts).toHaveLength(0);
    });

    it('should mark connection as accepted', async () => {
      await acceptPendingConnection('validtoken', 20);

      expect(dbSafe.safeUpdate).toHaveBeenCalledWith(
        'pending_connections',
        expect.objectContaining({ status: 'accepted' }),
        { token: 'validtoken' }
      );
    });

    it('should handle invitee without existing room', async () => {
      roomManager.getUserRoom.mockImplementation(userId => {
        if (userId === 10) return { roomId: 'room-inviter' };
        return null; // Invitee has no room
      });

      const result = await acceptPendingConnection('validtoken', 20);

      expect(result.inviteeRoom).toBeNull();
    });
  });

  describe('createContactIfNotExists', () => {
    beforeEach(() => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);
      dbSafe.safeInsert.mockResolvedValue(1);
    });

    it('should create a contact if one does not exist', async () => {
      await createContactIfNotExists(1, 2, 'Test User', 'test@example.com', new Date().toISOString());

      expect(dbSafe.safeInsert).toHaveBeenCalledWith(
        'contacts',
        expect.objectContaining({
          user_id: 1,
          contact_name: 'Test User',
          contact_email: 'test@example.com',
          relationship: 'co-parent',
          linked_user_id: 2,
        })
      );
    });

    it('should not create contact if co-parent contact already exists', async () => {
      dbSafe.safeSelect.mockResolvedValue([
        { user_id: 1, contact_name: 'Test User', relationship: 'co-parent' },
      ]);
      dbSafe.parseResult.mockReturnValue([
        { user_id: 1, contact_name: 'Test User', relationship: 'co-parent' },
      ]);

      await createContactIfNotExists(1, 2, 'Test User', 'test@example.com', new Date().toISOString());

      expect(dbSafe.safeInsert).not.toHaveBeenCalled();
    });

    it('should create contact if existing contact has different relationship', async () => {
      dbSafe.safeSelect.mockResolvedValue([
        { user_id: 1, contact_name: 'Test User', relationship: 'friend' },
      ]);
      dbSafe.parseResult.mockReturnValue([
        { user_id: 1, contact_name: 'Test User', relationship: 'friend' },
      ]);

      await createContactIfNotExists(1, 2, 'Test User', 'test@example.com', new Date().toISOString());

      expect(dbSafe.safeInsert).toHaveBeenCalled();
    });

    it('should handle null email', async () => {
      await createContactIfNotExists(1, 2, 'Test User', null, new Date().toISOString());

      expect(dbSafe.safeInsert).toHaveBeenCalledWith(
        'contacts',
        expect.objectContaining({
          contact_email: null,
        })
      );
    });
  });

  describe('createCoParentContacts', () => {
    const mockConnection = {
      inviterId: 10,
      inviteeEmail: 'invitee@test.com',
    };

    beforeEach(() => {
      dbPostgres.query.mockImplementation(query => {
        if (query.includes('WHERE id = $1') && query.includes('id')) {
          return { rows: [{ id: 10, email: 'inviter@test.com', first_name: 'Inviter' }] };
        }
        return { rows: [] };
      });
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);
      dbSafe.safeInsert.mockResolvedValue(1);
    });

    it('should create contacts for both users', async () => {
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 10, email: 'inviter@test.com', first_name: 'Inviter', display_name: null }],
      });
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 20, email: 'invitee@test.com', first_name: 'Invitee', display_name: null }],
      });

      await createCoParentContacts(mockConnection, 20, new Date().toISOString());

      // Should create 2 contacts - one for each user
      expect(dbSafe.safeInsert).toHaveBeenCalledTimes(2);
    });

    it('should use first_name for display name', async () => {
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 10, email: 'inviter@test.com', first_name: 'InviterFirst', display_name: 'InviterDisplay' }],
      });
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 20, email: 'invitee@test.com', first_name: 'InviteeFirst', display_name: 'InviteeDisplay' }],
      });

      await createCoParentContacts(mockConnection, 20, new Date().toISOString());

      expect(dbSafe.safeInsert).toHaveBeenCalledWith(
        'contacts',
        expect.objectContaining({
          contact_name: 'InviteeFirst', // Should use first_name, not display_name
        })
      );
    });

    it('should fallback to display_name if no first_name', async () => {
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 10, email: 'inviter@test.com', first_name: null, display_name: 'InviterDisplay' }],
      });
      dbPostgres.query.mockResolvedValueOnce({
        rows: [{ id: 20, email: 'invitee@test.com', first_name: null, display_name: 'InviteeDisplay' }],
      });

      await createCoParentContacts(mockConnection, 20, new Date().toISOString());

      expect(dbSafe.safeInsert).toHaveBeenCalledWith(
        'contacts',
        expect.objectContaining({
          contact_name: 'InviteeDisplay',
        })
      );
    });

    it('should not throw if users not found', async () => {
      dbPostgres.query.mockResolvedValue({ rows: [] });

      // Should not throw
      await expect(
        createCoParentContacts(mockConnection, 20, new Date().toISOString())
      ).resolves.toBeUndefined();
    });
  });
});
