/**
 * Permission Service Tests
 *
 * Tests for RBAC permission system
 */

// Mock dbPostgres BEFORE importing the service
const mockDbPostgres = {
  query: jest.fn(),
};

jest.mock('../../dbPostgres', () => mockDbPostgres);

describe('PermissionService', () => {
  let PermissionService;
  let permissionService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Import service after mocking (jest.mock hoists, but we need fresh instance)
    PermissionService =
      require('../../src/services/permissions/PermissionService').PermissionService;
    permissionService = new PermissionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return array of permission names for user', async () => {
      const userId = 1;
      const mockResult = {
        rows: [
          {
            permission_name: 'message:create',
            resource: 'message',
            action: 'create',
            role_name: 'user',
          },
          {
            permission_name: 'message:read',
            resource: 'message',
            action: 'read',
            role_name: 'user',
          },
        ],
      };

      mockDbPostgres.query.mockResolvedValue(mockResult);

      const permissions = await permissionService.getUserPermissions(userId);

      expect(permissions).toEqual(['message:create', 'message:read']);
      expect(mockDbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('user_permissions_view'),
        [userId]
      );
    });

    it('should return empty array if user has no permissions', async () => {
      const userId = 999;
      mockDbPostgres.query.mockResolvedValue({ rows: [] });

      const permissions = await permissionService.getUserPermissions(userId);

      expect(permissions).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const userId = 1;
      mockDbPostgres.query.mockRejectedValue(new Error('Database error'));

      await expect(permissionService.getUserPermissions(userId)).rejects.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      const userId = 1;
      const permission = 'message:create';
      mockDbPostgres.query.mockResolvedValue({ rows: [{ permission_name: permission }] });

      const hasPermission = await permissionService.hasPermission(userId, permission);

      expect(hasPermission).toBe(true);
      expect(mockDbPostgres.query).toHaveBeenCalledWith(
        expect.stringContaining('user_permissions_view'),
        [userId, permission]
      );
    });

    it('should return false if user lacks permission', async () => {
      const userId = 1;
      const permission = 'admin:access';
      mockDbPostgres.query.mockResolvedValue({ rows: [] });

      const hasPermission = await permissionService.hasPermission(userId, permission);

      expect(hasPermission).toBe(false);
    });

    it('should return false on database error (fail closed)', async () => {
      const userId = 1;
      const permission = 'message:create';
      mockDbPostgres.query.mockRejectedValue(new Error('Database error'));

      const hasPermission = await permissionService.hasPermission(userId, permission);

      expect(hasPermission).toBe(false); // Fail closed
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      const userId = 1;
      const roleName = 'admin';
      mockDbPostgres.query.mockResolvedValue({ rows: [{ role: roleName }] });

      const hasRole = await permissionService.hasRole(userId, roleName);

      expect(hasRole).toBe(true);
    });

    it('should return false if user lacks role', async () => {
      const userId = 1;
      const roleName = 'admin';
      mockDbPostgres.query.mockResolvedValue({ rows: [] });

      const hasRole = await permissionService.hasRole(userId, roleName);

      expect(hasRole).toBe(false);
    });

    it('should return false on database error (fail closed)', async () => {
      const userId = 1;
      const roleName = 'admin';
      mockDbPostgres.query.mockRejectedValue(new Error('Database error'));

      const hasRole = await permissionService.hasRole(userId, roleName);

      expect(hasRole).toBe(false); // Fail closed
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const userId = 1;
      const roleName = 'admin';

      mockDbPostgres.query
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Get role ID
        .mockResolvedValueOnce({ rowCount: 1 }); // Insert user_roles

      const result = await permissionService.assignRole(userId, roleName);

      expect(result).toBe(true);
      expect(mockDbPostgres.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if role does not exist', async () => {
      const userId = 1;
      const roleName = 'nonexistent';

      mockDbPostgres.query.mockResolvedValueOnce({ rows: [] }); // Role not found

      await expect(permissionService.assignRole(userId, roleName)).rejects.toThrow(
        'Role not found'
      );
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', async () => {
      const userId = 1;
      const permissions = ['message:create', 'admin:access'];
      mockDbPostgres.query.mockResolvedValue({ rows: [{ permission_name: 'message:create' }] });

      const hasAny = await permissionService.hasAnyPermission(userId, permissions);

      expect(hasAny).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      const userId = 1;
      const permissions = ['admin:access', 'admin:users'];
      mockDbPostgres.query.mockResolvedValue({ rows: [] });

      const hasAny = await permissionService.hasAnyPermission(userId, permissions);

      expect(hasAny).toBe(false);
    });

    it('should return false for empty permission array', async () => {
      const userId = 1;
      const hasAny = await permissionService.hasAnyPermission(userId, []);

      expect(hasAny).toBe(false);
      expect(mockDbPostgres.query).not.toHaveBeenCalled();
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      const userId = 1;
      const permissions = ['message:create', 'message:read'];
      mockDbPostgres.query.mockResolvedValue({
        rows: [{ count: '2' }], // User has 2 out of 2 permissions
      });

      const hasAll = await permissionService.hasAllPermissions(userId, permissions);

      expect(hasAll).toBe(true);
    });

    it('should return false if user lacks any permission', async () => {
      const userId = 1;
      const permissions = ['message:create', 'admin:access'];
      mockDbPostgres.query.mockResolvedValue({
        rows: [{ count: '1' }], // User has 1 out of 2 permissions
      });

      const hasAll = await permissionService.hasAllPermissions(userId, permissions);

      expect(hasAll).toBe(false);
    });

    it('should return true for empty permission array', async () => {
      const userId = 1;
      const hasAll = await permissionService.hasAllPermissions(userId, []);

      expect(hasAll).toBe(true);
      expect(mockDbPostgres.query).not.toHaveBeenCalled();
    });
  });
});
