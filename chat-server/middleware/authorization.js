/**
 * Authorization Middleware
 *
 * Provides RBAC-based authorization middleware for Express routes.
 * Supports permission-based and role-based authorization checks.
 */

const { AuthorizationError } = require('../src/services/errors');

const { defaultLogger: defaultLogger } = require('../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'authorization',
});

/**
 * Middleware to require a specific permission
 * @param {string} permission - Permission name (e.g., 'message:create')
 * @returns {Express middleware}
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { permissionService } = require('../src/services/permissions/PermissionService');
      const hasPermission = await permissionService.hasPermission(req.user.id, permission);

      if (!hasPermission) {
        logger.warn('Log message', {
          value: `[Authorization] Permission denied: User ${req.user.id} lacks permission ${permission}`,
        });
        return res.status(403).json({
          error: 'Access denied',
          message: `You do not have permission to perform this action`,
          code: 'PERMISSION_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking permission', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking permissions',
      });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 * @param {Array<string>} permissions - Array of permission names
 * @returns {Express middleware}
 */
function requireAnyPermission(permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { permissionService } = require('../src/services/permissions/PermissionService');
      const hasPermission = await permissionService.hasAnyPermission(req.user.id, permissions);

      if (!hasPermission) {
        logger.warn('Log message', {
          value: `[Authorization] Permission denied: User ${req.user.id} lacks any of permissions: ${permissions.join(', ')}`,
        });
        return res.status(403).json({
          error: 'Access denied',
          message: `You do not have permission to perform this action`,
          code: 'PERMISSION_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking permissions', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking permissions',
      });
    }
  };
}

/**
 * Middleware to require all of the specified permissions
 * @param {Array<string>} permissions - Array of permission names
 * @returns {Express middleware}
 */
function requireAllPermissions(permissions) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { permissionService } = require('../src/services/permissions/PermissionService');
      const hasPermission = await permissionService.hasAllPermissions(req.user.id, permissions);

      if (!hasPermission) {
        logger.warn('Log message', {
          value: `[Authorization] Permission denied: User ${req.user.id} lacks all of permissions: ${permissions.join(', ')}`,
        });
        return res.status(403).json({
          error: 'Access denied',
          message: `You do not have permission to perform this action`,
          code: 'PERMISSION_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking permissions', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking permissions',
      });
    }
  };
}

/**
 * Middleware to require a specific role
 * @param {string} role - Role name (e.g., 'admin', 'user')
 * @returns {Express middleware}
 */
function requireRole(role) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { permissionService } = require('../src/services/permissions/PermissionService');
      const hasRole = await permissionService.hasRole(req.user.id, role);

      if (!hasRole) {
        logger.warn('Log message', {
          value: `[Authorization] Role denied: User ${req.user.id} lacks role ${role}`,
        });
        return res.status(403).json({
          error: 'Access denied',
          message: `This action requires the ${role} role`,
          code: 'ROLE_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking role', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking roles',
      });
    }
  };
}

/**
 * Middleware to require any of the specified roles
 * @param {Array<string>} roles - Array of role names
 * @returns {Express middleware}
 */
function requireAnyRole(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { permissionService } = require('../src/services/permissions/PermissionService');
      const hasRole = await permissionService.hasAnyRole(req.user.id, roles);

      if (!hasRole) {
        logger.warn('Log message', {
          value: `[Authorization] Role denied: User ${req.user.id} lacks any of roles: ${roles.join(', ')}`,
        });
        return res.status(403).json({
          error: 'Access denied',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
          code: 'ROLE_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking roles', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking roles',
      });
    }
  };
}

/**
 * Middleware factory for resource ownership checks
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 * @returns {Express middleware}
 */
function requireOwnership(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const ownerId = await getResourceOwnerId(req);

      // Admins can access any resource
      const { permissionService } = require('../src/services/permissions/PermissionService');
      const isAdmin = await permissionService.hasRole(req.user.id, 'admin');

      if (isAdmin) {
        return next();
      }

      // Check ownership
      if (!ownerId || ownerId !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources',
          code: 'OWNERSHIP_DENIED',
        });
      }

      next();
    } catch (error) {
      logger.error('[Authorization] Error checking ownership', {
        error: error,
      });
      return res.status(500).json({
        error: 'Authorization error',
        message: 'An error occurred while checking resource ownership',
      });
    }
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  requireOwnership,
};
