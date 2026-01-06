-- PostgreSQL Migration: RBAC (Role-Based Access Control) System
-- Creates roles, permissions, and user role assignments
-- Feature: RBAC implementation for authorization
-- Constitutional Compliance: Security Policy - RBAC enforcement

-- ============================================================================
-- PART 1: ROLES TABLE
-- System-wide user roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('user', 'Standard user with basic access', TRUE),
  ('coparent', 'Co-parent user with room access', TRUE),
  ('attorney', 'Attorney observer role (read-only)', TRUE),
  ('admin', 'System administrator with full access', TRUE)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE roles IS 'System-wide user roles for RBAC';
COMMENT ON COLUMN roles.is_system_role IS 'System roles cannot be deleted or renamed';

-- ============================================================================
-- PART 2: PERMISSIONS TABLE
-- Fine-grained permissions for resource access
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(100) NOT NULL, -- e.g., 'message', 'room', 'task', 'admin'
  action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Message permissions
  ('message:create', 'message', 'create', 'Create new messages'),
  ('message:read', 'message', 'read', 'Read messages'),
  ('message:update', 'message', 'update', 'Edit own messages'),
  ('message:delete', 'message', 'delete', 'Delete own messages'),
  
  -- Room permissions
  ('room:create', 'room', 'create', 'Create new rooms'),
  ('room:read', 'room', 'read', 'View room details'),
  ('room:update', 'room', 'update', 'Update room settings'),
  ('room:delete', 'room', 'delete', 'Delete rooms'),
  ('room:invite', 'room', 'invite', 'Invite users to rooms'),
  
  -- Task permissions
  ('task:create', 'task', 'create', 'Create tasks'),
  ('task:read', 'task', 'read', 'View tasks'),
  ('task:update', 'task', 'update', 'Update tasks'),
  ('task:delete', 'task', 'delete', 'Delete tasks'),
  
  -- Contact permissions
  ('contact:create', 'contact', 'create', 'Create contacts'),
  ('contact:read', 'contact', 'read', 'View contacts'),
  ('contact:update', 'contact', 'update', 'Update contacts'),
  ('contact:delete', 'contact', 'delete', 'Delete contacts'),
  
  -- Admin permissions
  ('admin:access', 'admin', 'access', 'Access admin panel'),
  ('admin:users', 'admin', 'manage', 'Manage users'),
  ('admin:system', 'admin', 'manage', 'System administration'),
  
  -- Profile permissions
  ('profile:read', 'profile', 'read', 'View own profile'),
  ('profile:update', 'profile', 'update', 'Update own profile'),
  ('profile:read:coparent', 'profile', 'read', 'View co-parent profile')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE permissions IS 'Fine-grained permissions for resource access';
COMMENT ON COLUMN permissions.resource IS 'Resource type (message, room, task, etc.)';
COMMENT ON COLUMN permissions.action IS 'Action allowed (create, read, update, delete)';

-- ============================================================================
-- PART 3: ROLE_PERMISSIONS TABLE
-- Maps roles to permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- Grant permissions to roles
-- User role: Basic permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.name IN (
    'message:create', 'message:read', 'message:update', 'message:delete',
    'room:read', 'room:invite',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'contact:create', 'contact:read', 'contact:update', 'contact:delete',
    'profile:read', 'profile:update'
  )
ON CONFLICT DO NOTHING;

-- Co-parent role: Same as user (inherits user permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'coparent'
  AND p.name IN (
    'message:create', 'message:read', 'message:update', 'message:delete',
    'room:create', 'room:read', 'room:update', 'room:invite',
    'task:create', 'task:read', 'task:update', 'task:delete',
    'contact:create', 'contact:read', 'contact:update', 'contact:delete',
    'profile:read', 'profile:update', 'profile:read:coparent'
  )
ON CONFLICT DO NOTHING;

-- Attorney role: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'attorney'
  AND p.name IN (
    'message:read',
    'room:read',
    'task:read',
    'profile:read:coparent'
  )
ON CONFLICT DO NOTHING;

-- Admin role: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE role_permissions IS 'Maps roles to permissions';

-- ============================================================================
-- PART 4: USER_ROLES TABLE
-- Assigns roles to users
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id)
);

-- Create index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

COMMENT ON TABLE user_roles IS 'Assigns roles to users';
COMMENT ON COLUMN user_roles.assigned_by IS 'User who assigned this role (null for auto-assignment)';

-- Assign default 'user' role to all existing users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE r.name = 'user'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );

-- ============================================================================
-- PART 5: HELPER VIEW: USER_PERMISSIONS
-- Denormalized view of all permissions for a user (role permissions + direct permissions)
-- ============================================================================

CREATE OR REPLACE VIEW user_permissions_view AS
SELECT DISTINCT
  ur.user_id,
  p.name AS permission_name,
  p.resource,
  p.action,
  r.name AS role_name
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
JOIN roles r ON ur.role_id = r.id;

COMMENT ON VIEW user_permissions_view IS 'View of all permissions granted to users via their roles';

-- ============================================================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- ============================================================================
-- PART 7: FUNCTION: Get user permissions
-- Helper function to get all permissions for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(permission_name VARCHAR(100), resource VARCHAR(100), action VARCHAR(50), role_name VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.name::VARCHAR(100),
    p.resource::VARCHAR(100),
    p.action::VARCHAR(50),
    r.name::VARCHAR(50)
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Returns all permissions for a given user';

