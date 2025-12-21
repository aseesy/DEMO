# Feature Specification: Fix Invitation Acceptance Flow

**Feature ID**: 009-fix-invitation-flow
**Status**: Draft
**Created**: 2025-11-28
**Priority**: High
**Constitutional Compliance**: Principles I, III, V, XV

---

## Executive Summary

Users are unable to accept co-parent invitations by pasting invitation links into their browser. The `/api/auth/register-with-invite` endpoint returns a 400 error despite successful token validation. This specification identifies the root cause and defines requirements to fix the invitation flow.

---

## Problem Analysis

### Current System State

LiaiZen has **two parallel invitation systems**:

1. **Old System** (`invitations` table)
   - Uses `invitationManager` library
   - Stores invitations with `token_hash`, `short_code`, `status`, etc.
   - Accessed by `validateToken()`, `acceptByShortCode()`, etc.

2. **New System** (`pairing_sessions` table)
   - Uses `pairingManager` library
   - Different schema: `parent_a_id`, `parent_b_email`, `pairing_code`, etc.
   - Accessed by `validateToken()`, `validateCode()`, etc.

### Validation Endpoint Works Correctly

The `/api/invitations/validate/:token` endpoint (lines 3616-3684 in `server.js`) implements **dual-system fallback**:

```javascript
// Try invitations table first (old system)
let validation = await invitationManager.validateToken(token, db);

// If not found in invitations, try pairing_sessions table (new system)
if (!validation.valid && validation.code === 'INVALID_TOKEN') {
  const pairingValidation = await pairingManager.validateToken(token, db);
  // Convert pairing response to invitation format
  if (pairingValidation.valid) {
    return res.json({
      valid: true,
      inviterName: pairingValidation.initiatorName,
      // ... converted fields
      isPairing: true, // Flag indicating source
    });
  }
}
```

**Result**: Token `f6506367d6d27f6b0efb90e7df1cf22764bb062cbc7d902672998d176b056167` successfully validates, returning `valid: true`.

### Registration Endpoint Fails

The `/api/auth/register-with-invite` endpoint (lines 3518-3609 in `server.js`) does **NOT** implement dual-system fallback:

```javascript
if (inviteCode) {
  // Uses invitationManager.validateByShortCode
  result = await auth.registerFromShortCode(
    {
      shortCode: inviteCode,
      email: cleanEmail,
      password,
      displayName: username,
      context: {},
    },
    db
  );
} else {
  // Uses invitationManager.validateToken (ONLY old system)
  result = await auth.registerFromInvitation(
    {
      token: inviteToken,
      email: cleanEmail,
      password,
      displayName: username,
      context: {},
    },
    db
  );
}
```

**Result**: If token exists in `pairing_sessions` but not `invitations`, registration fails with 400 error.

### Root Cause

**`auth.registerFromInvitation()` only queries the `invitations` table**, not `pairing_sessions`.

From `/Users/athenasees/Desktop/chat/chat-server/auth.js` lines 1063-1281:

```javascript
async function registerFromInvitation(params, db) {
  // Line 1094: Only uses invitationManager (OLD system)
  const validation = await invitationManager.validateToken(token, db);

  if (!validation.valid) {
    // Line 1098-1103: Returns error if not found
    throw createRegistrationError(RegistrationError.INVALID_TOKEN, validation.error);
  }

  // Line 1105: Uses invitation from OLD system
  const invitation = validation.invitation;

  // Line 1108: Email matching only works for OLD system
  if (invitation.invitee_email.toLowerCase() !== emailLower) {
    throw createRegistrationError(
      RegistrationError.INVALID_TOKEN,
      'Email does not match invitation'
    );
  }

  // ... rest of registration logic ...
}
```

**The function never checks `pairing_sessions`, so NEW system invitations fail silently.**

---

## User Impact

### Affected User Journeys

1. **New User with Pairing Link**
   - User receives invitation link: `https://coparentliaizen.com/accept-invite?token=f650...`
   - User pastes link in browser
   - Frontend validates token → ✅ Success (validates against `pairing_sessions`)
   - User fills out registration form
   - User submits form
   - Backend calls `registerFromInvitation()` → ❌ **400 Error** (only checks `invitations`)
   - **Result**: User cannot create account

2. **New User with Short Code**
   - User receives short code: `LZ-ABCDEF`
   - User visits `/accept-invite?code=LZ-ABCDEF`
   - Frontend validates code → ✅ Success
   - User submits registration form
   - Backend calls `registerFromShortCode()` → ✅ **Success** (validates against `invitations`)
   - **Result**: User successfully creates account

### Current Workaround

Users must receive **short codes** instead of token links to successfully register. This is not communicated to users and creates confusion.

---

## User Stories

### US-1: New User Accepts Token-Based Invitation

**As a** new user who received an invitation link via email
**I want to** paste the link in my browser and create an account
**So that** I can connect with my co-parent

**Acceptance Criteria**:

- ✅ Link validates successfully (shows inviter's name)
- ✅ User can fill out registration form
- ✅ Form submission creates account and connects co-parents
- ✅ User redirected to dashboard with active connection
- ✅ Both users appear in each other's contacts
- ✅ Shared room is created for co-parent communication

**Current Status**: ❌ Fails at form submission with 400 error

---

### US-2: New User Accepts Short Code Invitation

**As a** new user who received a short code via SMS
**I want to** enter the code on the invitation page
**So that** I can create my account and connect

**Acceptance Criteria**:

- ✅ Code validates successfully
- ✅ User confirms inviter identity before proceeding
- ✅ Registration form creates account
- ✅ Co-parent connection established
- ✅ Both users added to shared room

**Current Status**: ✅ **Working** (uses `registerFromShortCode`)

---

### US-3: Existing User Accepts Token Invitation

**As an** existing user who received an invitation link
**I want to** sign in and auto-accept the invitation
**So that** I can connect with my co-parent without re-registering

**Acceptance Criteria**:

- ✅ Link validates successfully
- ✅ User is redirected to sign-in if not authenticated
- ✅ After sign-in, invitation is auto-accepted
- ✅ User redirected to dashboard
- ✅ Connection appears in contacts

**Current Status**: ⚠️ **Partially Working** (depends on which table holds invitation)

---

## Functional Requirements

### FR-1: Dual-System Token Validation in Registration

**Requirement**: The `/api/auth/register-with-invite` endpoint MUST check both `invitations` and `pairing_sessions` tables when validating invitation tokens.

**Rationale**: Ensures backward compatibility with old invitations while supporting new pairing system.

**Implementation**:

1. Try `invitationManager.validateToken(token, db)` first
2. If not found (`code: 'INVALID_TOKEN'`), try `pairingManager.validateToken(token, db)`
3. If pairing found, call new function `registerFromPairing()` instead of `registerFromInvitation()`
4. If neither found, return 400 with `INVALID_TOKEN` error

---

### FR-2: New Registration Function for Pairing System

**Requirement**: Create new `auth.registerFromPairing()` function that handles `pairing_sessions` invitations.

**Rationale**: Separation of concerns - different tables have different schemas and logic.

**Signature**:

```javascript
/**
 * Register a new user from a pairing session invitation
 * @param {object} params - { token, email, password, displayName, context }
 * @param {object} db - Database connection
 * @returns {Promise<object>} { success, user, coParent, sharedRoom }
 */
async function registerFromPairing(params, db)
```

**Behavior**:

1. Validate token using `pairingManager.validateToken(token, db)`
2. Check email doesn't already exist
3. Create user account with `createUserWithEmail()`
4. Accept pairing using `pairingManager.acceptByToken(token, userId, db, roomManager)`
5. Return user, co-parent, and room details
6. Create welcome/onboarding tasks
7. Send notification to inviter

**Error Handling**:

- Email exists → 409 with `REG_001: Email already exists`
- Invalid token → 400 with `REG_002: Invalid invitation token`
- Expired token → 400 with `REG_003: Invitation has expired`
- Already accepted → 400 with `REG_004: Invitation already accepted`

---

### FR-3: Unified Error Responses

**Requirement**: Both `invitations` and `pairing_sessions` systems MUST return consistent error codes and messages.

**Error Codes**:

- `REG_001` - Email already exists
- `REG_002` - Invalid invitation token
- `REG_003` - Invitation has expired
- `REG_004` - Invitation already accepted
- `REG_005` - Could not create chat room
- `REG_006` - Could not create contacts
- `REG_007` - Database error occurred
- `REG_008` - Inviter account no longer exists
- `REG_009` - Could not generate unique username

**Format**:

```json
{
  "error": "Human-readable error message",
  "code": "REG_XXX"
}
```

---

### FR-4: Frontend Error Display Improvement

**Requirement**: Frontend MUST display clear, actionable error messages for all registration failures.

**Current Gaps**:

- Generic "Something went wrong" message for 400 errors
- No distinction between token vs. code validation failures
- No suggestion to contact co-parent for new invitation

**Required Messages**:
| Error Code | Title | Message | Action |
|------------|-------|---------|--------|
| `REG_001` | Email Already Registered | This email is already associated with an account. | Try signing in instead, or use a different email. |
| `REG_002` | Invalid Invitation | This invitation link is not valid or has been deleted. | Ask your co-parent to send a new invitation. |
| `REG_003` | Invitation Expired | This invitation expired after 7 days. | Ask your co-parent to send a new invitation. |
| `REG_004` | Already Connected | This invitation has already been used. | If you have an account, please sign in. |
| `REG_008` | Inviter Not Found | The account that sent this invitation no longer exists. | Contact support if you need assistance. |

---

## Technical Requirements

### TR-1: Database Schema Consistency

**Requirement**: Document schema differences between `invitations` and `pairing_sessions` tables.

**Invitations Table**:

```sql
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  inviter_id TEXT NOT NULL,
  invitee_id TEXT,
  invitee_email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  short_code TEXT UNIQUE,
  status TEXT NOT NULL,  -- pending, accepted, expired, cancelled, declined
  invitation_type TEXT,  -- coparent
  room_id TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP
);
```

**Pairing Sessions Table**:

```sql
CREATE TABLE pairing_sessions (
  id SERIAL PRIMARY KEY,
  parent_a_id TEXT NOT NULL,
  parent_b_id TEXT,
  parent_b_email TEXT,
  pairing_code TEXT UNIQUE NOT NULL,  -- e.g., LZ-842396
  token_hash TEXT UNIQUE,
  invite_type TEXT NOT NULL,  -- email, link, code
  status TEXT NOT NULL,  -- pending, active, cancelled, expired
  invited_by_username TEXT,
  initiator_email TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP
);
```

**Key Differences**:

1. Inviter field: `inviter_id` vs. `parent_a_id`
2. Invitee field: `invitee_id` vs. `parent_b_id`
3. Code field: `short_code` vs. `pairing_code`
4. Status values: Different enums
5. Type field: `invitation_type` vs. `invite_type`

---

### TR-2: Transaction Safety

**Requirement**: All registration operations MUST be wrapped in database transactions with proper rollback.

**Current Implementation**: ✅ `auth.registerFromInvitation()` uses `dbSafe.withTransaction()`

**New Requirement**: `auth.registerFromPairing()` MUST also use transaction wrapper.

**Transaction Steps**:

1. Create user account
2. Accept pairing/invitation
3. Create shared room
4. Add both users to room
5. Create bidirectional contacts
6. (Optional) Create notification

**Rollback Conditions**:

- User creation fails
- Pairing acceptance fails
- Room creation fails
- Contact creation fails

**Non-Transactional Steps** (after commit):

- Create welcome tasks
- Send email notification

---

### TR-3: Backward Compatibility

**Requirement**: Existing `invitations` table data MUST continue to work without modification.

**Constraints**:

- Do NOT migrate data from `invitations` to `pairing_sessions`
- Do NOT deprecate `invitations` table endpoints
- Both systems must coexist indefinitely
- Old invitation links must still work

---

### TR-4: Audit Trail

**Requirement**: All invitation acceptances MUST be logged for legal/custody audit purposes.

**Current Logging**:

```javascript
console.log(`✅ Accepted invitation ${invitation.id}`);
console.log(`✅ Created shared room ${roomId}`);
```

**Required Logging**:

- Timestamp of acceptance
- User ID and email
- Invitation/pairing ID
- Source system (invitations vs. pairing_sessions)
- Room ID created
- Contacts created
- IP address (for security)

**Log Format**:

```javascript
{
  event: 'invitation_accepted',
  timestamp: '2025-11-28T10:30:00Z',
  system: 'pairing_sessions',  // or 'invitations'
  invitation_id: 123,
  inviter_id: 'user_abc',
  invitee_id: 'user_xyz',
  invitee_email: 'user@example.com',
  room_id: 'room_12345',
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...'
}
```

---

## Non-Functional Requirements

### NFR-1: Performance

**Requirement**: Invitation acceptance MUST complete within 3 seconds under normal conditions.

**Targets**:

- Token validation: < 100ms
- User creation: < 500ms
- Room creation: < 300ms
- Total registration: < 2000ms

**Measurement**: Add performance logging to registration functions.

---

### NFR-2: Error Recovery

**Requirement**: Partial failures MUST NOT leave database in inconsistent state.

**Scenarios**:

1. User created but room creation fails → Rollback user
2. Room created but contact creation fails → Rollback room and user
3. Transaction commits but task creation fails → Log warning, don't fail registration
4. Notification creation fails → Log warning, don't fail registration

**Current Status**: ✅ Transaction wrapper handles rollback correctly

---

### NFR-3: Conflict Reduction (Constitutional Principle XV)

**Requirement**: Invitation flow MUST reduce friction and conflict between co-parents.

**Principles**:

- Clear error messages prevent blame ("Your co-parent sent a wrong link")
- Automatic room creation ensures immediate communication
- Bidirectional contacts prevent asymmetric relationships
- Welcome tasks guide new users to set up profile

**Metrics**:

- Invitation acceptance rate > 80%
- Time from invitation sent to first message < 24 hours
- Support tickets related to invitations < 5% of signups

---

## Acceptance Criteria

### AC-1: Token-Based Registration Works

**Given** a new user receives an invitation link with a token from the `pairing_sessions` table
**When** the user pastes the link in their browser and fills out the registration form
**Then** the account is created successfully
**And** the user is connected with the inviter
**And** both users appear in each other's contacts
**And** a shared room is created with both users as members

**Validation**:

```bash
# 1. Create pairing invitation
curl -X POST https://coparentliaizen.com/api/pairings/create \
  -H "Authorization: Bearer ${INVITER_TOKEN}" \
  -d '{"inviteeEmail": "newuser@example.com"}'

# Response: { "token": "abc123...", "pairingCode": "LZ-842396" }

# 2. Validate token (should succeed)
curl https://coparentliaizen.com/api/invitations/validate/abc123

# Response: { "valid": true, "inviterName": "John Doe", ... }

# 3. Register with token (should succeed)
curl -X POST https://coparentliaizen.com/api/auth/register-with-invite \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "username": "Jane Doe",
    "inviteToken": "abc123..."
  }'

# Response: { "success": true, "user": {...}, "coParent": {...}, "sharedRoom": {...} }

# 4. Verify connection
curl https://coparentliaizen.com/api/contacts \
  -H "Authorization: Bearer ${NEW_USER_TOKEN}"

# Response: [{ "relationship": "co-parent", "contact_name": "John Doe", ... }]
```

---

### AC-2: Old Invitations Still Work

**Given** an invitation exists in the `invitations` table
**When** a new user registers with that invitation token
**Then** registration succeeds using the old flow
**And** no pairing-related errors occur

**Validation**:

```bash
# 1. Create old-style invitation
INSERT INTO invitations (inviter_id, invitee_email, token_hash, status, ...)
VALUES ('user_123', 'olduser@example.com', 'hash...', 'pending', ...);

# 2. Register with old token
curl -X POST https://coparentliaizen.com/api/auth/register-with-invite \
  -d '{
    "email": "olduser@example.com",
    "password": "password123",
    "username": "Old User",
    "inviteToken": "old_token_abc"
  }'

# Response: { "success": true, ... }
```

---

### AC-3: Error Messages Are Clear

**Given** a user attempts to register with an expired invitation
**When** the registration fails
**Then** the error message clearly states the invitation has expired
**And** instructs the user to request a new invitation
**And** the error code is `REG_003`

**Validation**:

```bash
# 1. Create expired pairing
UPDATE pairing_sessions SET expires_at = '2025-01-01' WHERE id = 123;

# 2. Try to register
curl -X POST https://coparentliaizen.com/api/auth/register-with-invite \
  -d '{ "inviteToken": "expired_token", ... }'

# Expected Response (400):
{
  "error": "This invitation has expired. Invitations are valid for 7 days.",
  "code": "REG_003"
}
```

---

### AC-4: Audit Trail is Complete

**Given** a user successfully accepts an invitation
**When** the registration completes
**Then** an audit log entry is created with all required fields
**And** the log can be queried for legal/custody purposes

**Validation**:

```sql
SELECT * FROM audit_logs
WHERE event = 'invitation_accepted'
  AND invitee_email = 'newuser@example.com'
  AND timestamp > NOW() - INTERVAL '1 hour';

-- Expected: 1 row with complete data
```

---

## Implementation Plan

### Phase 1: Backend Dual-System Support

**Tasks**:

1. Create `auth.registerFromPairing()` function
2. Update `/api/auth/register-with-invite` to check both systems
3. Add transaction safety to new function
4. Add audit logging for pairing acceptances
5. Write unit tests for both paths

**Estimated Effort**: 6 hours

**Deliverable**: Backend supports both `invitations` and `pairing_sessions`

---

### Phase 2: Frontend Error Handling

**Tasks**:

1. Update `AcceptInvitationPage.jsx` error messages
2. Add error code mapping to user-friendly messages
3. Add "Request New Invitation" CTA for expired/invalid invitations
4. Test all error scenarios

**Estimated Effort**: 3 hours

**Deliverable**: Clear error messages for all failure modes

---

### Phase 3: Testing & Validation

**Tasks**:

1. Create integration tests for both systems
2. Test backward compatibility with old invitations
3. Test new pairing system invitations
4. Performance testing for registration flow
5. Security audit (SQL injection, XSS, CSRF)

**Estimated Effort**: 4 hours

**Deliverable**: Full test coverage and security validation

---

### Phase 4: Documentation & Deployment

**Tasks**:

1. Update API documentation
2. Create troubleshooting guide for support team
3. Deploy to staging environment
4. QA testing with real invitation flows
5. Deploy to production
6. Monitor error rates and performance

**Estimated Effort**: 3 hours

**Deliverable**: Production-ready feature with monitoring

---

## Testing Strategy

### Unit Tests

**Test Suite 1: `auth.registerFromPairing()`**

- ✅ Valid pairing token creates account
- ✅ Email already exists returns REG_001
- ✅ Invalid token returns REG_002
- ✅ Expired token returns REG_003
- ✅ Already accepted returns REG_004
- ✅ Transaction rolls back on room creation failure
- ✅ Welcome tasks created after transaction
- ✅ Notification sent to inviter

**Test Suite 2: `/api/auth/register-with-invite` Endpoint**

- ✅ Token from `invitations` table succeeds
- ✅ Token from `pairing_sessions` table succeeds
- ✅ Invalid token in both tables returns 400
- ✅ Short code path still works
- ✅ Error responses include correct error codes

---

### Integration Tests

**Test Scenario 1: Complete Invitation Flow (Pairing)**

1. User A creates pairing invitation for User B
2. User B receives link with token
3. User B validates token (GET `/api/invitations/validate/:token`)
4. User B registers (POST `/api/auth/register-with-invite`)
5. Verify User B account created
6. Verify room created with both users
7. Verify contacts created bidirectionally
8. Verify User A receives notification

**Test Scenario 2: Complete Invitation Flow (Old System)**

1. User A creates old-style invitation
2. User B receives link with token
3. User B registers
4. Verify all steps complete successfully

**Test Scenario 3: Error Scenarios**

1. Expired invitation → REG_003 error
2. Already accepted → REG_004 error
3. Email already exists → REG_001 error
4. Invalid token → REG_002 error

---

### Manual QA Checklist

- [ ] New user can accept pairing link invitation
- [ ] New user can accept short code invitation
- [ ] Existing user can accept pairing link invitation
- [ ] Old invitation links still work
- [ ] Error messages are clear and actionable
- [ ] Contacts appear in both users' contact lists
- [ ] Shared room is created and accessible
- [ ] Welcome tasks are created
- [ ] Inviter receives notification
- [ ] Audit logs are created
- [ ] Performance is under 3 seconds
- [ ] No console errors in frontend
- [ ] Mobile/tablet views work correctly

---

## Risks & Mitigations

### Risk 1: Data Inconsistency Between Systems

**Probability**: Medium
**Impact**: High
**Description**: User has invitation in both `invitations` and `pairing_sessions` with different status values.

**Mitigation**:

- Prioritize `invitations` table (old system) in dual-lookup
- Add uniqueness constraint on `invitee_email` across both tables
- Create database migration to identify and resolve duplicates
- Add warning log when invitation found in both systems

---

### Risk 2: Transaction Rollback Leaves Partial State

**Probability**: Low
**Impact**: High
**Description**: Transaction rollback fails, leaving user created but invitation not accepted.

**Mitigation**:

- Use PostgreSQL's native transaction support (ACID guarantees)
- Add retry logic for transient failures
- Implement cleanup job to detect orphaned users (no contacts, no rooms)
- Monitor transaction failure rates

---

### Risk 3: Email Mismatch in Pairing System

**Probability**: Medium
**Impact**: Medium
**Description**: Pairing system doesn't require email matching, allowing wrong user to accept.

**Current Design**: Short codes intentionally allow any user to accept (for flexibility).

**Mitigation**:

- Show inviter confirmation step before registration (already implemented)
- Log IP address and user agent for audit trail
- Add "Report Abuse" button if user receives unexpected invitation
- Consider adding optional email verification for token-based invitations

---

### Risk 4: Breaking Existing Invitation Links

**Probability**: Low
**Impact**: High
**Description**: Code changes break existing invitation links in user emails/SMS.

**Mitigation**:

- Comprehensive backward compatibility testing
- Gradual rollout with feature flag
- Keep old endpoints functional
- Monitor invitation acceptance success rate
- Rollback plan if success rate drops > 10%

---

## Success Metrics

### Primary KPIs

1. **Invitation Acceptance Rate**
   - **Baseline**: Unknown (currently failing)
   - **Target**: > 80% of invitations accepted within 7 days
   - **Measurement**: `(accepted_invitations / sent_invitations) * 100`

2. **Registration Success Rate**
   - **Baseline**: 0% for pairing tokens
   - **Target**: > 95% of valid invitations complete registration
   - **Measurement**: `(successful_registrations / registration_attempts) * 100`

3. **Error Rate**
   - **Baseline**: 100% for pairing tokens
   - **Target**: < 5% of registration attempts result in 400/500 errors
   - **Measurement**: Monitor HTTP error codes in logs

4. **Time to First Message**
   - **Baseline**: Unknown
   - **Target**: < 24 hours from invitation sent to first message
   - **Measurement**: Timestamp difference between invitation creation and first message in shared room

---

### Secondary KPIs

5. **Support Ticket Reduction**
   - **Target**: < 5% of new signups require support help with invitations
   - **Measurement**: Support ticket tags related to "invitation", "can't register", "link broken"

6. **User Satisfaction**
   - **Target**: > 4.0/5.0 rating for invitation experience
   - **Measurement**: Post-registration survey

7. **Performance**
   - **Target**: 95th percentile registration time < 3 seconds
   - **Measurement**: Server-side timing logs

---

## Appendices

### Appendix A: Database Migration Script

```sql
-- Migration: Add indexes for faster dual-system lookup
-- Date: 2025-11-28

-- Index on invitations.token_hash
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash
ON invitations(token_hash)
WHERE status = 'pending';

-- Index on pairing_sessions.token_hash
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_token_hash
ON pairing_sessions(token_hash)
WHERE status = 'pending';

-- Index on invitations.invitee_email
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email
ON invitations(invitee_email)
WHERE status = 'pending';

-- Index on pairing_sessions.parent_b_email
CREATE INDEX IF NOT EXISTS idx_pairing_sessions_parent_b_email
ON pairing_sessions(parent_b_email)
WHERE status = 'pending';

-- Cleanup expired invitations (maintenance)
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < NOW();

UPDATE pairing_sessions
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < NOW();
```

---

### Appendix B: Monitoring Queries

```sql
-- Check dual-system overlap
SELECT
  i.invitee_email,
  COUNT(*) as invitation_count,
  STRING_AGG(DISTINCT i.status, ', ') as invitation_statuses,
  STRING_AGG(DISTINCT ps.status, ', ') as pairing_statuses
FROM invitations i
FULL OUTER JOIN pairing_sessions ps
  ON i.invitee_email = ps.parent_b_email
WHERE i.status != 'expired' OR ps.status != 'expired'
GROUP BY i.invitee_email
HAVING COUNT(*) > 1;

-- Track registration success rate
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE accepted_at IS NOT NULL) as accepted,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE accepted_at IS NOT NULL) / COUNT(*), 2) as success_rate
FROM (
  SELECT created_at, accepted_at FROM invitations WHERE created_at > NOW() - INTERVAL '30 days'
  UNION ALL
  SELECT created_at, accepted_at FROM pairing_sessions WHERE created_at > NOW() - INTERVAL '30 days'
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Audit log query
SELECT
  timestamp,
  system,
  inviter_id,
  invitee_email,
  room_id,
  ip_address
FROM audit_logs
WHERE event = 'invitation_accepted'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;
```

---

### Appendix C: API Documentation Updates

#### POST `/api/auth/register-with-invite`

**Description**: Register a new user with an invitation token or short code. Supports both legacy `invitations` system and new `pairing_sessions` system.

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "Display Name",
  "inviteToken": "abc123...", // Optional: token from invitation link
  "inviteCode": "LZ-ABCDEF" // Optional: short code
}
```

**Response (200 Success)**:

```json
{
  "success": true,
  "user": {
    "id": "user_xyz",
    "username": "username123",
    "email": "user@example.com",
    "displayName": "Display Name"
  },
  "coParent": {
    "id": "user_abc",
    "name": "Co-Parent Name",
    "emailDomain": "example"
  },
  "sharedRoom": {
    "id": "room_12345",
    "name": "Co-Parent Name & Display Name"
  },
  "token": "jwt_token_here"
}
```

**Error Responses**:

| Code | Status       | Error Code | Message                                      |
| ---- | ------------ | ---------- | -------------------------------------------- |
| 400  | Bad Request  | -          | Email and password are required              |
| 400  | Bad Request  | -          | Username is required                         |
| 400  | Bad Request  | -          | Either inviteToken or inviteCode is required |
| 400  | Bad Request  | -          | Please enter a valid email address           |
| 400  | Bad Request  | -          | Password must be at least 4 characters       |
| 400  | Bad Request  | REG_002    | Invalid invitation token                     |
| 400  | Bad Request  | REG_003    | Invitation has expired                       |
| 400  | Bad Request  | REG_004    | Invitation already accepted                  |
| 409  | Conflict     | REG_001    | An account with this email already exists    |
| 500  | Server Error | REG_007    | Database error occurred                      |

---

## Constitutional Compliance Review

### Principle I: Library-First Architecture ✅

- `invitationManager` is a standalone library
- `pairingManager` is a standalone library
- `auth` module uses these libraries without tight coupling
- New `registerFromPairing()` follows same pattern

### Principle III: Contract-First Design ✅

- Invitation validation contract defined in `invitationValidator.js`
- Pairing validation contract defined in `pairingValidator.js`
- Error codes standardized across both systems
- API responses follow consistent schema

### Principle V: Idempotent Operations ✅

- Accepting same invitation twice returns `ALREADY_ACCEPTED` error
- Database transactions ensure atomic operations
- No partial state on failure

### Principle XV: Conflict Reduction ✅

- Clear error messages prevent blame/confusion
- Automatic room creation enables immediate communication
- Bidirectional contacts prevent asymmetric relationships
- Invitation confirmation step prevents accidental connections

---

## Conclusion

This specification identifies the root cause of invitation acceptance failures and provides a complete solution. The fix requires:

1. **Dual-system support** in `/api/auth/register-with-invite` endpoint
2. **New `registerFromPairing()` function** to handle pairing system invitations
3. **Improved error messages** for better user experience
4. **Comprehensive testing** to ensure backward compatibility

Implementing this specification will restore invitation functionality while maintaining support for both old and new invitation systems.

---

**Next Steps**:

1. Review and approve specification
2. Create implementation tasks from Phase 1-4
3. Assign to engineering team
4. Set target delivery date
5. Begin implementation following Test-First Development (Principle II)
