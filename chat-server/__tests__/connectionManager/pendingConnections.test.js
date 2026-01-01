/* eslint-env jest */
/**
 * Pending Connections Tests
 */

const {
  formatConnections,
  createPendingConnection,
  getPendingConnectionsAsInviter,
  getPendingConnectionsAsInvitee,
  getPendingConnections,
} = require('../../connectionManager/pendingConnections');
const { CONNECTION_ROLE } = require('../../connectionManager/constants');

// Mock dependencies
jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
}));

jest.mock('../../dbSafe', () => ({
  safeSelect: jest.fn(),
  safeInsert: jest.fn(),
  parseResult: jest.fn(result => result),
}));

jest.mock('../../connectionManager/emailValidation', () => ({
  validateEmail: jest.fn(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
}));

jest.mock('../../connectionManager/tokenService', () => ({
  generateInviteToken: jest.fn(() => 'mockedtoken123'),
}));

const dbModule = require('../../dbPostgres');
const dbSafe = require('../../dbSafe');

describe('Pending Connections Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatConnections', () => {
    it('should format raw rows into connection objects', () => {
      const rows = [
        {
          id: 1,
          token: 'token1',
          inviter_id: 10,
          invitee_email: 'test@example.com',
          status: 'pending',
          expires_at: '2024-12-31',
          created_at: '2024-01-01',
        },
      ];

      const result = formatConnections(rows);

      expect(result).toEqual([
        {
          id: 1,
          token: 'token1',
          inviterId: 10,
          inviteeEmail: 'test@example.com',
          status: 'pending',
          expiresAt: '2024-12-31',
          createdAt: '2024-01-01',
        },
      ]);
    });

    it('should deduplicate connections by id', () => {
      const rows = [
        { id: 1, token: 'token1', inviter_id: 10, invitee_email: 'a@test.com', status: 'pending', expires_at: '2024-12-31', created_at: '2024-01-01' },
        { id: 1, token: 'token1', inviter_id: 10, invitee_email: 'a@test.com', status: 'pending', expires_at: '2024-12-31', created_at: '2024-01-01' },
        { id: 2, token: 'token2', inviter_id: 20, invitee_email: 'b@test.com', status: 'pending', expires_at: '2024-12-31', created_at: '2024-01-02' },
      ];

      const result = formatConnections(rows);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toEqual([1, 2]);
    });

    it('should handle empty array', () => {
      const result = formatConnections([]);

      expect(result).toEqual([]);
    });
  });

  describe('createPendingConnection', () => {
    it('should create a new pending connection', async () => {
      dbModule.query.mockResolvedValue({ rows: [] });
      dbSafe.safeInsert.mockResolvedValue(123);

      const result = await createPendingConnection(1, 'test@example.com');

      expect(result).toMatchObject({
        id: 123,
        token: 'mockedtoken123',
        inviterId: 1,
        inviteeEmail: 'test@example.com',
        status: 'pending',
        isNew: true,
      });
    });

    it('should return existing connection if one exists', async () => {
      const existingConnection = {
        id: 456,
        token: 'existingtoken',
        inviter_id: 1,
        invitee_email: 'test@example.com',
        status: 'pending',
        expires_at: '2024-12-31',
        created_at: '2024-01-01',
      };
      dbModule.query.mockResolvedValue({ rows: [existingConnection] });

      const result = await createPendingConnection(1, 'test@example.com');

      expect(result).toMatchObject({
        id: 456,
        token: 'existingtoken',
        isNew: false,
      });
      expect(dbSafe.safeInsert).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email', async () => {
      await expect(createPendingConnection(1, 'invalidemail')).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should normalize email to lowercase', async () => {
      dbModule.query.mockResolvedValue({ rows: [] });
      dbSafe.safeInsert.mockResolvedValue(123);

      const result = await createPendingConnection(1, 'TEST@EXAMPLE.COM');

      expect(result.inviteeEmail).toBe('test@example.com');
    });
  });

  describe('getPendingConnectionsAsInviter', () => {
    it('should return connections where user is inviter', async () => {
      const mockRows = [
        {
          id: 1,
          token: 'token1',
          inviter_id: 10,
          invitee_email: 'test@example.com',
          status: 'pending',
          expires_at: '2024-12-31',
          created_at: '2024-01-01',
        },
      ];
      dbModule.query.mockResolvedValue({ rows: mockRows });

      const result = await getPendingConnectionsAsInviter(10);

      expect(result).toHaveLength(1);
      expect(result[0].inviterId).toBe(10);
      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE inviter_id = $1'),
        [10]
      );
    });

    it('should return empty array if no connections', async () => {
      dbModule.query.mockResolvedValue({ rows: [] });

      const result = await getPendingConnectionsAsInviter(999);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingConnectionsAsInvitee', () => {
    it('should return connections where user is invitee', async () => {
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, email: 'user@example.com' }]);
      dbSafe.parseResult.mockReturnValue([{ id: 1, email: 'user@example.com' }]);
      dbModule.query.mockResolvedValue({
        rows: [
          {
            id: 2,
            token: 'token2',
            inviter_id: 20,
            invitee_email: 'user@example.com',
            status: 'pending',
            expires_at: '2024-12-31',
            created_at: '2024-01-01',
          },
        ],
      });

      const result = await getPendingConnectionsAsInvitee(1);

      expect(result).toHaveLength(1);
      expect(result[0].inviteeEmail).toBe('user@example.com');
    });

    it('should return empty array if user not found', async () => {
      dbSafe.safeSelect.mockResolvedValue([]);
      dbSafe.parseResult.mockReturnValue([]);

      const result = await getPendingConnectionsAsInvitee(999);

      expect(result).toEqual([]);
    });

    it('should return empty array if user has no email', async () => {
      dbSafe.safeSelect.mockResolvedValue([{ id: 1, email: null }]);
      dbSafe.parseResult.mockReturnValue([{ id: 1, email: null }]);

      const result = await getPendingConnectionsAsInvitee(1);

      expect(result).toEqual([]);
    });
  });

  describe('getPendingConnections', () => {
    beforeEach(() => {
      // Setup for inviter query
      dbModule.query.mockImplementation(query => {
        if (query.includes('inviter_id')) {
          return { rows: [{ id: 1, token: 't1', inviter_id: 10, invitee_email: 'a@test.com', status: 'pending', expires_at: '2024-12-31', created_at: '2024-01-01' }] };
        }
        if (query.includes('invitee_email')) {
          return { rows: [{ id: 2, token: 't2', inviter_id: 20, invitee_email: 'user@test.com', status: 'pending', expires_at: '2024-12-31', created_at: '2024-01-02' }] };
        }
        return { rows: [] };
      });
      dbSafe.safeSelect.mockResolvedValue([{ id: 10, email: 'user@test.com' }]);
      dbSafe.parseResult.mockReturnValue([{ id: 10, email: 'user@test.com' }]);
    });

    it('should return only inviter connections when role is INVITER', async () => {
      const result = await getPendingConnections(10, { role: CONNECTION_ROLE.INVITER });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should return only invitee connections when role is INVITEE', async () => {
      const result = await getPendingConnections(10, { role: CONNECTION_ROLE.INVITEE });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should return all connections when role is ALL', async () => {
      const result = await getPendingConnections(10, { role: CONNECTION_ROLE.ALL });

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should default to ALL role', async () => {
      const result = await getPendingConnections(10);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
