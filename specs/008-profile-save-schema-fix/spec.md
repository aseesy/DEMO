# Feature Specification: Profile Save Schema Fix

## Overview

**Feature Name**: Profile Save Schema Fix  
**Feature ID**: 008-profile-save-schema-fix  
**Business Objective**: Ensure users can successfully save their profile information without database schema errors  
**Priority**: Critical (blocking user functionality)  
**Status**: Specification

**Problem Statement**:  
Users are unable to save their profile information. The error "column 'first_name' of relation 'users' does not exist" indicates that the database schema is missing required profile columns, even though migration 007_add_profile_columns.sql exists.

**Success Metrics**:

- ✅ 100% of profile save attempts succeed (no schema errors)
- ✅ Migration runs automatically on server startup
- ✅ Runtime safety net ensures columns exist even if migration fails
- ✅ Clear error messages if schema issues persist

---

## User Stories

### Story 1: Reliable Profile Saving

**As a** user  
**I want to** save my profile information (first name, last name, address, etc.)  
**So that** my profile is complete and LiaiZen can provide better mediation

**Acceptance Criteria**:

- ✅ Profile save succeeds without "column does not exist" errors
- ✅ All profile fields (first_name, last_name, display_name, address, additional_context, profile_picture) can be saved
- ✅ Error messages are clear and actionable if save fails for other reasons

### Story 2: Automatic Schema Migration

**As a** system administrator  
**I want** database migrations to run automatically on server startup  
**So that** schema is always up-to-date without manual intervention

**Acceptance Criteria**:

- ✅ Migration 007 runs automatically when server starts
- ✅ Migration is idempotent (safe to run multiple times)
- ✅ Migration failures are logged but don't crash the server
- ✅ Migration status is visible in server logs

### Story 3: Runtime Schema Safety Net

**As a** developer  
**I want** the profile save endpoint to verify columns exist before updating  
**So that** users don't see schema errors even if migration hasn't run

**Acceptance Criteria**:

- ✅ Profile save endpoint checks for required columns before updating
- ✅ Missing columns are created automatically if not present
- ✅ Column creation is logged for monitoring
- ✅ No performance degradation (checks are fast)

---

## Functional Requirements

### FR1: Migration Execution

- **Requirement**: Migration 007_add_profile_columns.sql must run on every server startup
- **Current State**: Migration exists but may not be running in production
- **Solution**: Ensure `run-migration.js` is called during server startup
- **Validation**: Check server logs for "Migration query executed successfully"

### FR2: Runtime Column Validation

- **Requirement**: Profile save endpoint must verify required columns exist before attempting UPDATE
- **Required Columns**:
  - `first_name`, `last_name`, `display_name`
  - `address`, `additional_context`, `profile_picture`
  - `household_members`, `occupation`
  - `communication_style`, `communication_triggers`, `communication_goals`
- **Solution**: Add column existence check in `/api/user/profile` endpoint before `safeUpdate`
- **Fallback**: If column missing, create it automatically, then retry update

### FR3: Error Handling

- **Requirement**: Clear, actionable error messages for users
- **Current Error**: "column 'first_name' of relation 'users' does not exist"
- **Improved Error**: "Profile save failed. Please refresh the page and try again. If the problem persists, contact support."
- **Logging**: Full error details logged server-side for debugging

### FR4: Migration Verification

- **Requirement**: Ability to verify migration status
- **Solution**: Add health check endpoint that verifies required columns exist
- **Usage**: `GET /api/health/schema` returns column status

---

## Non-Functional Requirements

### NFR1: Performance

- **Requirement**: Column existence checks must not add >50ms latency
- **Solution**: Cache column existence in memory (check once per server restart)
- **Measurement**: Profile save endpoint response time <500ms (p95)

### NFR2: Reliability

- **Requirement**: Profile saves must succeed 99.9% of the time
- **Solution**: Multiple layers of protection (migration + runtime check)
- **Monitoring**: Track profile save success rate

### NFR3: Zero Downtime

- **Requirement**: Schema changes must not require downtime
- **Solution**: Use `ALTER TABLE ADD COLUMN` (PostgreSQL supports this online)
- **Validation**: Test migration on production-like database

### NFR4: Backward Compatibility

- **Requirement**: Existing code must continue to work
- **Solution**: Runtime column creation is transparent to existing code
- **Validation**: All existing profile save tests pass

---

## Technical Constraints

### Architecture

- **Backend**: Node.js + Express.js (chat-server/)
- **Database**: PostgreSQL (production), SQLite (legacy, deprecated)
- **Migration System**: `run-migration.js` executes SQL files from `migrations/` directory
- **Database Client**: `dbPostgres` (PostgreSQL pool), `dbSafe` (query builder)

### Existing Code

- **Profile Endpoint**: `PUT /api/user/profile` in `chat-server/server.js` (line 5242)
- **Migration File**: `chat-server/migrations/007_add_profile_columns.sql` (exists)
- **Migration Runner**: `chat-server/run-migration.js` (executes on startup)
- **Query Builder**: `chat-server/dbSafe.js` (safeUpdate function)

### Design System

- **Error Messages**: Follow LiaiZen tone (calm, helpful, non-technical)
- **Logging**: Structured logging with context (userId, operation, error details)

---

## Technical Implementation

### Phase 1: Ensure Migration Runs

1. **Verify** `run-migration.js` is called in `server.js` on startup
2. **Add** explicit migration call if missing
3. **Add** migration status logging

### Phase 2: Runtime Column Safety Net

1. **Create** utility function `ensureProfileColumnsExist(db)` in `chat-server/src/utils/schema.js`
2. **Function** checks for required columns, creates missing ones
3. **Call** function in `/api/user/profile` endpoint before `safeUpdate`
4. **Cache** column existence in memory to avoid repeated checks

### Phase 3: Error Handling Improvements

1. **Update** error messages in profile save endpoint
2. **Add** structured error logging
3. **Return** user-friendly error messages

### Phase 4: Health Check Endpoint

1. **Create** `GET /api/health/schema` endpoint
2. **Verify** all required columns exist
3. **Return** status and missing columns (if any)

---

## Acceptance Criteria

### AC1: Migration Execution

- [ ] Migration 007 runs automatically on server startup
- [ ] Migration logs show "Added first_name column" (or "already exists")
- [ ] Server starts successfully even if migration partially fails

### AC2: Profile Save Success

- [ ] User can save profile with first_name without errors
- [ ] User can save profile with all fields without errors
- [ ] Profile save completes in <500ms

### AC3: Runtime Safety Net

- [ ] If column missing, it's created automatically
- [ ] Profile save succeeds after automatic column creation
- [ ] Column creation is logged for monitoring

### AC4: Error Messages

- [ ] Schema errors show user-friendly message
- [ ] Technical details logged server-side only
- [ ] Error messages guide user to refresh or contact support

### AC5: Health Check

- [ ] `GET /api/health/schema` returns column status
- [ ] Missing columns are listed in response
- [ ] Health check completes in <100ms

---

## Responsible Agent

**Primary Agent**: `database-specialist` (Data Department)

**Reasoning**:

- This is a database schema/migration issue
- Requires PostgreSQL expertise
- Involves migration strategy and zero-downtime deployment
- Column existence checks and ALTER TABLE operations

**Supporting Agents**:

- `backend-architect`: API endpoint modifications
- `testing-specialist`: Test migration and profile save flows

---

## Risks & Mitigation

### Risk 1: Migration Fails Silently

- **Mitigation**: Add explicit logging and health check endpoint
- **Detection**: Monitor health check endpoint

### Risk 2: Performance Impact

- **Mitigation**: Cache column existence checks
- **Measurement**: Profile save response time monitoring

### Risk 3: Multiple Database Instances

- **Mitigation**: Runtime safety net ensures columns exist regardless
- **Validation**: Test on all database instances

---

## Dependencies

- **Migration 007**: Must exist and be correct (✅ already created)
- **PostgreSQL**: Required (✅ already in use)
- **dbSafe**: Query builder must support column existence checks (may need enhancement)

---

## Related Features

- **Feature 001**: User Profile Management (original profile feature)
- **Feature 006**: Profile UI Redesign (recent UI changes)
- **Migration 007**: Add Profile Columns (schema migration)

---

## Success Definition

**Feature is complete when**:

1. ✅ Users can save profiles without "column does not exist" errors
2. ✅ Migration runs automatically on server startup
3. ✅ Runtime safety net creates missing columns automatically
4. ✅ Health check endpoint verifies schema status
5. ✅ Error messages are user-friendly and actionable

---

**Specification Version**: 1.0  
**Created**: 2025-11-26  
**Status**: Ready for Planning
