/* eslint-env jest */
/**
 * Token Service Tests
 */

const { generateInviteToken, validateConnectionToken } = require('../../connectionManager/tokenService');

// Mock dbPostgres
jest.mock('../../dbPostgres', () => ({
  query: jest.fn(),
}));

const dbModule = require('../../dbPostgres');

describe('Token Service Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInviteToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateInviteToken();

      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = generateInviteToken();
      const token2 = generateInviteToken();
      const token3 = generateInviteToken();

      expect(token1).not.toBe(token2);
      expect(token2).not.toBe(token3);
      expect(token1).not.toBe(token3);
    });
  });

  describe('validateConnectionToken', () => {
    it('should return connection object for valid token', async () => {
      const mockConnection = {
        id: 1,
        token: 'validtoken123',
        inviter_id: 10,
        invitee_email: 'test@example.com',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date().toISOString(),
      };
      dbModule.query.mockResolvedValue({ rows: [mockConnection] });

      const result = await validateConnectionToken('validtoken123');

      expect(result).toEqual({
        id: 1,
        token: 'validtoken123',
        inviterId: 10,
        inviteeEmail: 'test@example.com',
        status: 'pending',
        expiresAt: mockConnection.expires_at,
        createdAt: mockConnection.created_at,
      });
    });

    it('should return null for invalid token', async () => {
      dbModule.query.mockResolvedValue({ rows: [] });

      const result = await validateConnectionToken('invalidtoken');

      expect(result).toBeNull();
    });

    it('should return null for null token', async () => {
      const result = await validateConnectionToken(null);

      expect(result).toBeNull();
      expect(dbModule.query).not.toHaveBeenCalled();
    });

    it('should return null for undefined token', async () => {
      const result = await validateConnectionToken(undefined);

      expect(result).toBeNull();
      expect(dbModule.query).not.toHaveBeenCalled();
    });

    it('should return null for non-string token', async () => {
      const result = await validateConnectionToken(12345);

      expect(result).toBeNull();
      expect(dbModule.query).not.toHaveBeenCalled();
    });

    it('should use parameterized query for security', async () => {
      dbModule.query.mockResolvedValue({ rows: [] });

      await validateConnectionToken('mytoken');

      expect(dbModule.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE token = $1'),
        ['mytoken']
      );
    });
  });
});
