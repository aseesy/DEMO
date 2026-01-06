-- PostgreSQL Migration: Row-Level Security (RLS) Policies
-- Enables RLS and creates policies for data isolation
-- Feature: Database-level security for multi-tenant data isolation
-- Constitutional Compliance: Security Policy - Defense in Depth

-- ============================================================================
-- PART 1: ENABLE ROW LEVEL SECURITY ON SENSITIVE TABLES
-- ============================================================================

-- Enable RLS on users table (users can only see their own data)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on room_members table
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on threads table
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on in_app_notifications table
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sensitive profile tables
ALTER TABLE user_health_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_privacy ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: CREATE HELPER FUNCTION FOR CURRENT USER CONTEXT
-- ============================================================================

-- Function to get current user ID from session (set by application)
-- This is a placeholder - actual implementation depends on connection pooling
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS INTEGER AS $$
BEGIN
  -- Application should set: SET LOCAL app.current_user_id = user_id;
  -- This reads from session variable
  RETURN current_setting('app.current_user_id', TRUE)::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION current_user_id IS 'Returns current authenticated user ID from session context';

-- ============================================================================
-- PART 3: RLS POLICIES FOR USERS TABLE
-- ============================================================================

-- Policy: Users can read their own user record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_user_id());

-- Policy: Users can update their own user record (limited fields)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- Policy: Admins can read all users (bypass RLS via SECURITY DEFINER function)
-- Note: Admin access should be checked in application layer, but this provides defense in depth
CREATE POLICY users_select_admin ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_user_id()
        AND r.name = 'admin'
    )
  );

-- ============================================================================
-- PART 4: RLS POLICIES FOR MESSAGES TABLE
-- ============================================================================

-- Policy: Users can read messages from rooms they are members of
CREATE POLICY messages_select_room_member ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = messages.room_id
        AND rm.user_id = current_user_id()
    )
  );

-- Policy: Users can create messages in rooms they are members of
CREATE POLICY messages_insert_room_member ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = messages.room_id
        AND rm.user_id = current_user_id()
        AND rm.role IN ('owner', 'member')
    )
  );

-- Policy: Users can update their own messages
CREATE POLICY messages_update_own ON messages
  FOR UPDATE
  USING (
    -- Check that user is the sender
    (messages.username = (SELECT email FROM users WHERE id = current_user_id()))
    OR
    (messages.user_email = (SELECT email FROM users WHERE id = current_user_id()))
  )
  WITH CHECK (
    (messages.username = (SELECT email FROM users WHERE id = current_user_id()))
    OR
    (messages.user_email = (SELECT email FROM users WHERE id = current_user_id()))
  );

-- Policy: Users can delete their own messages (soft delete via application)
CREATE POLICY messages_delete_own ON messages
  FOR DELETE
  USING (
    (messages.username = (SELECT email FROM users WHERE id = current_user_id()))
    OR
    (messages.user_email = (SELECT email FROM users WHERE id = current_user_id()))
  );

-- ============================================================================
-- PART 5: RLS POLICIES FOR ROOMS TABLE
-- ============================================================================

-- Policy: Users can read rooms they are members of
CREATE POLICY rooms_select_member ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
        AND rm.user_id = current_user_id()
    )
  );

-- Policy: Users can create rooms (they become owner)
CREATE POLICY rooms_insert_user ON rooms
  FOR INSERT
  WITH CHECK (created_by = current_user_id());

-- Policy: Users can update rooms they own
CREATE POLICY rooms_update_owner ON rooms
  FOR UPDATE
  USING (
    created_by = current_user_id()
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
        AND rm.user_id = current_user_id()
        AND rm.role = 'owner'
    )
  )
  WITH CHECK (
    created_by = current_user_id()
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = rooms.id
        AND rm.user_id = current_user_id()
        AND rm.role = 'owner'
    )
  );

-- ============================================================================
-- PART 6: RLS POLICIES FOR ROOM_MEMBERS TABLE
-- ============================================================================

-- Policy: Users can read room memberships for rooms they belong to
CREATE POLICY room_members_select_member ON room_members
  FOR SELECT
  USING (
    user_id = current_user_id()
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = room_members.room_id
        AND rm.user_id = current_user_id()
    )
  );

-- Policy: Users can see their own memberships (for joins)
CREATE POLICY room_members_insert_owner ON room_members
  FOR INSERT
  WITH CHECK (
    -- Can only add yourself, or be added by room owner
    user_id = current_user_id()
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = room_members.room_id
        AND rm.user_id = current_user_id()
        AND rm.role = 'owner'
    )
  );

-- ============================================================================
-- PART 7: RLS POLICIES FOR TASKS TABLE
-- ============================================================================

-- Policy: Users can read tasks they created or are assigned to
CREATE POLICY tasks_select_own ON tasks
  FOR SELECT
  USING (
    user_id = current_user_id()
    OR
    assigned_to = (SELECT email FROM users WHERE id = current_user_id())
    OR
    -- Tasks in rooms user has access to
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = current_user_id()
        AND tasks.room_id = r.id
    )
  );

-- Policy: Users can create tasks
CREATE POLICY tasks_insert_user ON tasks
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Policy: Users can update tasks they created or are assigned to
CREATE POLICY tasks_update_own ON tasks
  FOR UPDATE
  USING (
    user_id = current_user_id()
    OR
    assigned_to = (SELECT email FROM users WHERE id = current_user_id())
  )
  WITH CHECK (
    user_id = current_user_id()
    OR
    assigned_to = (SELECT email FROM users WHERE id = current_user_id())
  );

-- ============================================================================
-- PART 8: RLS POLICIES FOR CONTACTS TABLE
-- ============================================================================

-- Policy: Users can only read their own contacts
CREATE POLICY contacts_select_own ON contacts
  FOR SELECT
  USING (user_id = current_user_id());

-- Policy: Users can create their own contacts
CREATE POLICY contacts_insert_own ON contacts
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Policy: Users can update their own contacts
CREATE POLICY contacts_update_own ON contacts
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Policy: Users can delete their own contacts
CREATE POLICY contacts_delete_own ON contacts
  FOR DELETE
  USING (user_id = current_user_id());

-- ============================================================================
-- PART 9: RLS POLICIES FOR THREADS TABLE
-- ============================================================================

-- Policy: Users can read threads in rooms they are members of
CREATE POLICY threads_select_member ON threads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = threads.room_id
        AND rm.user_id = current_user_id()
    )
  );

-- Policy: Users can create threads in rooms they are members of
CREATE POLICY threads_insert_member ON threads
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = threads.room_id
        AND rm.user_id = current_user_id()
        AND rm.role IN ('owner', 'member')
    )
  );

-- ============================================================================
-- PART 10: RLS POLICIES FOR INVITATIONS TABLE
-- ============================================================================

-- Policy: Users can read invitations they sent or received
CREATE POLICY invitations_select_own ON invitations
  FOR SELECT
  USING (
    inviter_id = current_user_id()
    OR
    invitee_id = current_user_id()
    OR
    invitee_email = (SELECT email FROM users WHERE id = current_user_id())
  );

-- Policy: Users can create invitations
CREATE POLICY invitations_insert_user ON invitations
  FOR INSERT
  WITH CHECK (inviter_id = current_user_id());

-- ============================================================================
-- PART 11: RLS POLICIES FOR SENSITIVE PROFILE TABLES
-- ============================================================================

-- Health context: Only own data
CREATE POLICY user_health_context_select_own ON user_health_context
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY user_health_context_update_own ON user_health_context
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Financial data: Only own data
CREATE POLICY user_financials_select_own ON user_financials
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY user_financials_update_own ON user_financials
  FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- ============================================================================
-- PART 12: RLS POLICIES FOR USER_ROLES TABLE
-- ============================================================================

-- Policy: Users can read their own role assignments
CREATE POLICY user_roles_select_own ON user_roles
  FOR SELECT
  USING (user_id = current_user_id());

-- Policy: Admins can read all role assignments
CREATE POLICY user_roles_select_admin ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_user_id()
        AND r.name = 'admin'
    )
  );

-- ============================================================================
-- PART 13: ADMIN BYPASS FUNCTION (for application layer)
-- ============================================================================

-- Function to check if current user is admin (for application use)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = current_user_id()
      AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION is_admin IS 'Returns true if current user has admin role';

