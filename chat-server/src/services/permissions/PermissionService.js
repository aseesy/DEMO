/**
 * Permission Service
 *
 * Actor: Authorization
 * Responsibility: Manage RBAC (Role-Based Access Control) and permission checks
 *
 * Handles:
 * - User role management
 * - Permission checking
 * - Role assignment
 */

const { BaseService } = require('../BaseService');
const { AuthorizationError } = require('../errors');
const dbPostgres = require('../../../dbPostgres');

class PermissionService extends BaseService {
  constructor() {
    super(); // No default table - manages permissions across multiple tables
  }

  /**
   * Get all permissions for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of permission names
   */
  async getUserPermissions(userId) {
    try {
      const result = await dbPostgres.query(
        `SELECT permission_name, resource, action, role_name
         FROM user_permissions_view
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows.map(row => row.permission_name);
    } catch (error) {
      console.error('[PermissionService] Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Get all roles for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Array of role names
   */
  async getUserRoles(userId) {
    try {
      const result = await dbPostgres.query(
        `SELECT r.name, r.description
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [userId]
      );

      return result.rows.map(row => row.name);
    } catch (error) {
      console.error('[PermissionService] Error getting user roles:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific permission
   * @param {number} userId - User ID
   * @param {string} permissionName - Permission name (e.g., 'message:create')
   * @returns {Promise<boolean>} True if user has permission
   */
  async hasPermission(userId, permissionName) {
    try {
      const result = await dbPostgres.query(
        `SELECT 1
         FROM user_permissions_view
         WHERE user_id = $1 AND permission_name = $2
         LIMIT 1`,
        [userId, permissionName]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('[PermissionService] Error checking permission:', error);
      return false; // Fail closed - deny access on error
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param {number} userId - User ID
   * @param {Array<string>} permissionNames - Array of permission names
   * @returns {Promise<boolean>} True if user has at least one permission
   */
  async hasAnyPermission(userId, permissionNames) {
    if (!permissionNames || permissionNames.length === 0) {
      return false;
    }

    try {
      const placeholders = permissionNames.map((_, i) => `$${i + 2}`).join(', ');
      const result = await dbPostgres.query(
        `SELECT 1
         FROM user_permissions_view
         WHERE user_id = $1 AND permission_name IN (${placeholders})
         LIMIT 1`,
        [userId, ...permissionNames]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('[PermissionService] Error checking permissions:', error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param {number} userId - User ID
   * @param {Array<string>} permissionNames - Array of permission names
   * @returns {Promise<boolean>} True if user has all permissions
   */
  async hasAllPermissions(userId, permissionNames) {
    if (!permissionNames || permissionNames.length === 0) {
      return true; // Empty list means no requirement
    }

    try {
      const placeholders = permissionNames.map((_, i) => `$${i + 2}`).join(', ');
      const result = await dbPostgres.query(
        `SELECT COUNT(DISTINCT permission_name) as count
         FROM user_permissions_view
         WHERE user_id = $1 AND permission_name IN (${placeholders})`,
        [userId, ...permissionNames]
      );

      const count = parseInt(result.rows[0].count, 10);
      return count === permissionNames.length;
    } catch (error) {
      console.error('[PermissionService] Error checking permissions:', error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user has a specific role
   * @param {number} userId - User ID
   * @param {string} roleName - Role name (e.g., 'admin', 'user')
   * @returns {Promise<boolean>} True if user has role
   */
  async hasRole(userId, roleName) {
    try {
      const result = await dbPostgres.query(
        `SELECT 1
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1 AND r.name = $2
         LIMIT 1`,
        [userId, roleName]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('[PermissionService] Error checking role:', error);
      return false; // Fail closed
    }
  }

  /**
   * Check if user has any of the specified roles
   * @param {number} userId - User ID
   * @param {Array<string>} roleNames - Array of role names
   * @returns {Promise<boolean>} True if user has at least one role
   */
  async hasAnyRole(userId, roleNames) {
    if (!roleNames || roleNames.length === 0) {
      return false;
    }

    try {
      const placeholders = roleNames.map((_, i) => `$${i + 2}`).join(', ');
      const result = await dbPostgres.query(
        `SELECT 1
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1 AND r.name IN (${placeholders})
         LIMIT 1`,
        [userId, ...roleNames]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('[PermissionService] Error checking roles:', error);
      return false; // Fail closed
    }
  }

  /**
   * Assign a role to a user
   * @param {number} userId - User ID
   * @param {string} roleName - Role name
   * @param {number} assignedBy - User ID who assigned the role (optional)
   * @returns {Promise<boolean>} True if role was assigned
   */
  async assignRole(userId, roleName, assignedBy = null) {
    try {
      // Get role ID
      const roleResult = await dbPostgres.query('SELECT id FROM roles WHERE name = $1', [roleName]);

      if (roleResult.rows.length === 0) {
        throw new Error(`Role not found: ${roleName}`);
      }

      const roleId = roleResult.rows[0].id;

      // Assign role (ON CONFLICT DO NOTHING to prevent duplicates)
      await dbPostgres.query(
        `INSERT INTO user_roles (user_id, role_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [userId, roleId, assignedBy]
      );

      return true;
    } catch (error) {
      console.error('[PermissionService] Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove a role from a user
   * @param {number} userId - User ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} True if role was removed
   */
  async removeRole(userId, roleName) {
    try {
      // Get role ID
      const roleResult = await dbPostgres.query('SELECT id FROM roles WHERE name = $1', [roleName]);

      if (roleResult.rows.length === 0) {
        return false;
      }

      const roleId = roleResult.rows[0].id;

      // Check if it's a system role (prevent removal of user role)
      if (roleName === 'user') {
        throw new Error('Cannot remove default "user" role');
      }

      // Remove role
      const result = await dbPostgres.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
        [userId, roleId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('[PermissionService] Error removing role:', error);
      throw error;
    }
  }

  /**
   * Ensure user has default 'user' role
   * Called during user registration
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async ensureDefaultRole(userId) {
    try {
      await this.assignRole(userId, 'user');
    } catch (error) {
      console.error('[PermissionService] Error ensuring default role:', error);
      // Don't throw - default role assignment failure shouldn't block registration
    }
  }

  /**
   * Get all available roles
   * @returns {Promise<Array>} Array of role objects
   */
  async getAllRoles() {
    try {
      const result = await dbPostgres.query(
        'SELECT id, name, description, is_system_role FROM roles ORDER BY name'
      );

      return result.rows;
    } catch (error) {
      console.error('[PermissionService] Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Get all available permissions
   * @returns {Promise<Array>} Array of permission objects
   */
  async getAllPermissions() {
    try {
      const result = await dbPostgres.query(
        'SELECT id, name, resource, action, description FROM permissions ORDER BY resource, action'
      );

      return result.rows;
    } catch (error) {
      console.error('[PermissionService] Error getting permissions:', error);
      throw error;
    }
  }
}

// Export singleton instance
const permissionService = new PermissionService();

module.exports = { permissionService, PermissionService };
