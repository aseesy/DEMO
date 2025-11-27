# Task List: Account Pairing Flow Refactor

**Feature ID**: 004-account-pairing-refactor
**Date**: 2025-11-27
**Status**: Ready for Implementation

## Task Overview

This document provides a dependency-ordered, atomic task breakdown for implementing the Account Pairing Flow refactor. Tasks are organized by phase, with clear acceptance criteria, dependencies, and file paths.

**Total Tasks**: 42
**Estimated Total Time**: 80-100 hours (2 engineers, 2-3 weeks)

---

## Phase A: Database Foundation

### T001: Create Pairing Sessions Migration Script
**Type**: infrastructure
**Priority**: critical
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: None

**Description**: Create SQL migration script for the new pairing_sessions and pairing_audit_log tables, supporting both PostgreSQL (production) and SQLite (development).

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/migrations/008_pairing_sessions.sql` (CREATE)

**Deliverables**:
- Migration script with CREATE TABLE statements
- Indexes for performance optimization
- Constraints and foreign keys
- Rollback instructions

**Acceptance Criteria**:
- [ ] `pairing_sessions` table created with all fields from data-model.md
- [ ] `pairing_audit_log` table created with all fields
- [ ] All 7 indexes created (code, email, token, status, expires, parent_a, parent_b)
- [ ] CHECK constraints enforce valid status and invite_type values
- [ ] Foreign key constraints with CASCADE/SET NULL as specified
- [ ] Script works in both PostgreSQL and SQLite syntax
- [ ] Migration is idempotent (safe to run multiple times)

**Technical Notes**:
```sql
-- PostgreSQL: TIMESTAMP WITH TIME ZONE, SERIAL, INET
-- SQLite: TEXT for timestamps, INTEGER AUTOINCREMENT, TEXT for IP
```

---

### T002: Test Migration in SQLite (Development)
**Type**: test
**Priority**: critical
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T001]

**Description**: Execute migration script in SQLite development database and verify schema integrity.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/db.js` (MODIFY - add migration execution)
- `/Users/athenasees/Desktop/chat/chat-server/chat.db` (database file)

**Deliverables**:
- Migration executed successfully in SQLite
- Verification script for schema validation

**Acceptance Criteria**:
- [ ] Migration script runs without errors in SQLite
- [ ] All tables created with correct columns
- [ ] All indexes created successfully
- [ ] Can insert test pairing record
- [ ] Can query pairing record by code, email, token
- [ ] Foreign key constraints enforced (test with invalid user_id)
- [ ] CHECK constraints enforced (test with invalid status)

**Technical Notes**:
```javascript
// In db.js, run migration if tables don't exist
const fs = require('fs');
const migration = fs.readFileSync('./migrations/008_pairing_sessions.sql', 'utf8');
db.exec(migration);
```

---

### T003: Test Migration in PostgreSQL (Staging)
**Type**: test
**Priority**: critical
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T001]

**Description**: Execute migration script in PostgreSQL staging environment and verify production readiness.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/dbPostgres.js` (MODIFY - add migration execution)

**Deliverables**:
- Migration executed in staging PostgreSQL
- Performance test results

**Acceptance Criteria**:
- [ ] Migration script runs without errors in PostgreSQL
- [ ] All tables created with correct columns and types
- [ ] TIMESTAMP WITH TIME ZONE fields work correctly
- [ ] SERIAL auto-increment works
- [ ] INET type stores IP addresses correctly
- [ ] JSONB metadata field works in audit log
- [ ] Indexes created and query planner uses them
- [ ] Can insert 100 test records and query performance < 10ms

**Technical Notes**:
```javascript
// Test query performance
EXPLAIN ANALYZE SELECT * FROM pairing_sessions WHERE pairing_code = 'LZ-842396';
```

---

### T004: Create Data Migration Script (Old to New)
**Type**: infrastructure
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T002, T003]

**Description**: Create script to migrate existing pending_connections data to new pairing_sessions table.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/migrations/migrate_pending_connections.js` (CREATE)

**Deliverables**:
- Migration script for data transfer
- Validation report of migrated data

**Acceptance Criteria**:
- [ ] Script reads all pending_connections with status='pending' and expires_at > NOW()
- [ ] Converts each to pairing_sessions format
- [ ] Generates pairing_code from existing token (LZ-NNNNNN format)
- [ ] Links accepted connections to parent_b_id via email match
- [ ] Preserves timestamps (created_at, expires_at, accepted_at)
- [ ] Sets invite_type='email' for all migrated records
- [ ] Creates audit log entries for migrated pairings
- [ ] Handles edge cases (missing data, invalid emails)
- [ ] Provides migration report (total migrated, skipped, errors)

**Technical Notes**:
```javascript
// Generate code from token
const code = `LZ-${(oldRecord.id % 1000000).toString().padStart(6, '0')}`;
```

---

## Phase B: Backend Library (chat-server/libs/pairing-manager/)

### T005: Create Pairing Manager Directory Structure
**Type**: infrastructure
**Priority**: high
**Complexity**: S (small)
**Estimated Hours**: 1
**Dependencies**: [T002]

**Description**: Set up library-first directory structure for pairing-manager module.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/` (CREATE directory)
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/index.js` (CREATE)
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/__tests__/` (CREATE directory)
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/package.json` (CREATE - optional)

**Deliverables**:
- Directory structure matching invitation-manager pattern
- Stub index.js with module exports

**Acceptance Criteria**:
- [ ] Directory created at correct path
- [ ] index.js exports empty object (placeholder)
- [ ] __tests__ directory created for unit tests
- [ ] Structure matches existing libs (invitation-manager, notification-manager)
- [ ] README.md created with library purpose

**Technical Notes**:
```javascript
// index.js stub
module.exports = {
  createPairing: require('./pairingCreator').createPairing,
  acceptPairing: require('./pairingValidator').acceptPairing,
  detectMutualInvitation: require('./mutualDetector').detectMutualInvitation,
};
```

---

### T006: Implement pairingCreator.js
**Type**: feature
**Priority**: critical
**Complexity**: L (large)
**Estimated Hours**: 6
**Dependencies**: [T005]

**Description**: Implement pairing creation logic including code generation, invitation creation, and email/link/code flows.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/pairingCreator.js` (CREATE)

**Deliverables**:
- createPairing(userId, inviteType, inviteeEmail) function
- generatePairingCode() function
- createUniquePairingCode(db) function
- cancelPairing(pairingId, userId) function
- resendInvitation(pairingId, userId) function

**Acceptance Criteria**:
- [ ] generatePairingCode() produces LZ-NNNNNN format (6 digits)
- [ ] Uses crypto.randomInt(100000, 999999) for security
- [ ] createUniquePairingCode() retries up to 10 times on collision
- [ ] createPairing() validates co-parent limit (1 for MVP)
- [ ] Checks for existing active invitation to same email
- [ ] Calls detectMutualInvitation() on email invitations
- [ ] Auto-completes mutual pairings atomically
- [ ] Generates secure 32-byte token for link invitations
- [ ] Sets correct expiration (7 days email/link, 15 min code)
- [ ] Creates audit log entry for creation
- [ ] cancelPairing() validates ownership (inviter only)
- [ ] resendInvitation() regenerates token and resets expiration

**Technical Notes**:
```javascript
const crypto = require('crypto');

function generatePairingCode() {
  const numbers = crypto.randomInt(100000, 999999).toString();
  return `LZ-${numbers}`;
}
```

**Risk Factors**:
- Code collision (mitigated by retry logic)
- Race condition on mutual detection (mitigated by transaction)

---

### T007: Write Unit Tests for pairingCreator.js
**Type**: test
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T006]

**Description**: Comprehensive unit tests for pairing creation logic.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/__tests__/pairingCreator.test.js` (CREATE)

**Deliverables**:
- Jest test suite with 15+ test cases

**Acceptance Criteria**:
- [ ] Test generatePairingCode() format validation
- [ ] Test createUniquePairingCode() collision handling
- [ ] Test createPairing() with email type
- [ ] Test createPairing() with link type
- [ ] Test createPairing() with code type
- [ ] Test co-parent limit enforcement
- [ ] Test existing invitation detection
- [ ] Test mutual invitation auto-pairing
- [ ] Test cancelPairing() authorization
- [ ] Test resendInvitation() token regeneration
- [ ] Mock database calls with jest.fn()
- [ ] All tests pass with 100% code coverage
- [ ] Tests run in < 2 seconds

**Technical Notes**:
```javascript
describe('pairingCreator', () => {
  test('generatePairingCode returns LZ-NNNNNN format', () => {
    const code = generatePairingCode();
    expect(code).toMatch(/^LZ-\d{6}$/);
  });
});
```

---

### T008: Implement pairingValidator.js
**Type**: feature
**Priority**: critical
**Complexity**: L (large)
**Estimated Hours**: 6
**Dependencies**: [T005]

**Description**: Implement pairing validation and acceptance logic with atomic transaction handling.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/pairingValidator.js` (CREATE)

**Deliverables**:
- validatePairingCode(code) function
- acceptPairing(pairingCode, acceptingUserId) function
- acceptWithSignup(pairingCode, email, password, username) function

**Acceptance Criteria**:
- [ ] validatePairingCode() checks format (LZ-NNNNNN)
- [ ] Queries pairing_sessions for valid, non-expired code
- [ ] Returns inviter info without sensitive data
- [ ] acceptPairing() uses SELECT FOR UPDATE (row lock)
- [ ] Validates email match for email-type invitations
- [ ] Checks accepting user's co-parent limit
- [ ] Atomic transaction: update pairing, create room, create contacts
- [ ] Creates shared room with both users as admin
- [ ] Creates mutual contacts with relationship='co-parent'
- [ ] Creates audit log entry for acceptance
- [ ] Emits Socket.io event to inviter
- [ ] acceptWithSignup() creates user account first
- [ ] Validates password strength (8+ chars)
- [ ] Full transaction rollback on any error

**Technical Notes**:
```javascript
async function acceptPairing(pairingCode, acceptingUserId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    // Lock row
    const pairing = await client.query(
      'SELECT * FROM pairing_sessions WHERE pairing_code = $1 FOR UPDATE',
      [pairingCode]
    );
    // ... rest of logic
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Risk Factors**:
- Transaction deadlock (mitigated by short lock duration)
- Race condition on concurrent acceptance (prevented by FOR UPDATE)

---

### T009: Write Unit Tests for pairingValidator.js
**Type**: test
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T008]

**Description**: Comprehensive unit tests for validation and acceptance logic.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/__tests__/pairingValidator.test.js` (CREATE)

**Deliverables**:
- Jest test suite with 12+ test cases

**Acceptance Criteria**:
- [ ] Test validatePairingCode() with valid code
- [ ] Test validatePairingCode() with expired code
- [ ] Test validatePairingCode() with invalid format
- [ ] Test acceptPairing() happy path
- [ ] Test acceptPairing() with email mismatch
- [ ] Test acceptPairing() with already paired user
- [ ] Test acceptPairing() transaction rollback on error
- [ ] Test acceptWithSignup() account creation
- [ ] Test acceptWithSignup() with existing email
- [ ] Mock database client with transaction methods
- [ ] All tests pass with 100% code coverage
- [ ] Tests verify room and contacts created

**Technical Notes**:
```javascript
test('acceptPairing rolls back on error', async () => {
  const mockClient = {
    query: jest.fn()
      .mockResolvedValueOnce({ rows: [mockPairing] }) // SELECT FOR UPDATE
      .mockRejectedValueOnce(new Error('Room creation failed')), // CREATE room
    release: jest.fn()
  };

  await expect(acceptPairing('LZ-123456', 789)).rejects.toThrow();
  expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
});
```

---

### T010: Implement mutualDetector.js
**Type**: feature
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T005]

**Description**: Implement mutual invitation detection and auto-pairing logic.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/mutualDetector.js` (CREATE)

**Deliverables**:
- detectMutualInvitation(userAId, userBEmail) function
- autoCompleteMutualPairing(inviteA, inviteB, userAId, userBId) function

**Acceptance Criteria**:
- [ ] detectMutualInvitation() queries for reverse invitation
- [ ] Uses case-insensitive email comparison (LOWER())
- [ ] Checks both parent_b_email and user email match
- [ ] Returns null if no mutual invitation found
- [ ] Returns matching pairing session if found
- [ ] autoCompleteMutualPairing() updates both invitations to 'active'
- [ ] Creates single shared room (not two)
- [ ] Creates mutual contacts (2 records total)
- [ ] Sets shared_room_id on both pairing sessions
- [ ] Creates audit log entries for both pairings
- [ ] Uses transaction for atomicity
- [ ] Emits Socket.io events to both users

**Technical Notes**:
```javascript
async function detectMutualInvitation(userAId, userBEmail) {
  const userA = await db.query('SELECT email FROM users WHERE id = $1', [userAId]);

  const mutualInvite = await db.query(`
    SELECT ps.*, u.email as parent_a_email
    FROM pairing_sessions ps
    INNER JOIN users u ON ps.parent_a_id = u.id
    WHERE LOWER(ps.parent_b_email) = LOWER($1)
      AND ps.status = 'pending'
      AND ps.expires_at > NOW()
      AND LOWER(u.email) = LOWER($2)
  `, [userA.rows[0].email, userBEmail]);

  return mutualInvite.rows.length > 0 ? mutualInvite.rows[0] : null;
}
```

**Risk Factors**:
- Edge case: Both users create invitation simultaneously (handled by transaction)

---

### T011: Write Unit Tests for mutualDetector.js
**Type**: test
**Priority**: high
**Complexity**: S (small)
**Estimated Hours**: 3
**Dependencies**: [T010]

**Description**: Unit tests for mutual invitation detection logic.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/__tests__/mutualDetector.test.js` (CREATE)

**Deliverables**:
- Jest test suite with 8+ test cases

**Acceptance Criteria**:
- [ ] Test detectMutualInvitation() with mutual invite
- [ ] Test detectMutualInvitation() with no mutual invite
- [ ] Test case-insensitive email matching
- [ ] Test expired mutual invitations ignored
- [ ] Test autoCompleteMutualPairing() updates both records
- [ ] Test single room created (not duplicate)
- [ ] Test transaction rollback on failure
- [ ] All tests pass with 100% code coverage

**Technical Notes**:
```javascript
test('detectMutualInvitation finds matching invite', async () => {
  const result = await detectMutualInvitation(1, 'userB@example.com');
  expect(result).not.toBeNull();
  expect(result.parent_b_email).toBe('userA@example.com');
});
```

---

### T012: Export Unified API from index.js
**Type**: feature
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 1
**Dependencies**: [T006, T008, T010]

**Description**: Create clean public API for pairing-manager library.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/index.js` (MODIFY)

**Deliverables**:
- Exports for all public functions
- JSDoc documentation

**Acceptance Criteria**:
- [ ] Exports createPairing, cancelPairing, resendInvitation
- [ ] Exports validatePairingCode, acceptPairing, acceptWithSignup
- [ ] Exports detectMutualInvitation
- [ ] JSDoc comments for all exported functions
- [ ] Usage examples in comments
- [ ] No internal implementation details leaked

**Technical Notes**:
```javascript
/**
 * Pairing Manager Library
 * Handles co-parent account pairing operations
 */

const pairingCreator = require('./pairingCreator');
const pairingValidator = require('./pairingValidator');
const mutualDetector = require('./mutualDetector');

module.exports = {
  // Creation
  createPairing: pairingCreator.createPairing,
  cancelPairing: pairingCreator.cancelPairing,
  resendInvitation: pairingCreator.resendInvitation,

  // Validation
  validatePairingCode: pairingValidator.validatePairingCode,
  acceptPairing: pairingValidator.acceptPairing,
  acceptWithSignup: pairingValidator.acceptWithSignup,

  // Mutual detection
  detectMutualInvitation: mutualDetector.detectMutualInvitation,
};
```

---

## Phase C: Backend API Endpoints

### T013: Add Pairing Routes to server.js
**Type**: infrastructure
**Priority**: high
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T012]

**Description**: Add pairing API route definitions to Express server.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Route handlers for 7 pairing endpoints
- Rate limiting middleware configuration

**Acceptance Criteria**:
- [ ] Import pairing-manager library
- [ ] Add POST /api/pairing/create route
- [ ] Add POST /api/pairing/accept route
- [ ] Add POST /api/pairing/accept-with-signup route
- [ ] Add GET /api/pairing/status route
- [ ] Add POST /api/pairing/:id/cancel route
- [ ] Add POST /api/pairing/:id/resend route
- [ ] Add POST /api/pairing/validate-code route
- [ ] Apply requireAuth middleware to authenticated routes
- [ ] Apply rate limiting (5 per hour) to create endpoint
- [ ] Routes respond with 501 (stub) until implemented

**Technical Notes**:
```javascript
const pairingManager = require('./libs/pairing-manager');
const rateLimit = require('express-rate-limit');

const pairingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many pairing attempts' },
  keyGenerator: (req) => req.user.id
});

app.post('/api/pairing/create', requireAuth, pairingRateLimiter, async (req, res) => {
  // Stub
  res.status(501).json({ error: 'Not implemented yet' });
});
```

---

### T014: Implement POST /api/pairing/create
**Type**: feature
**Priority**: critical
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T013]

**Description**: Implement pairing creation endpoint with email/link/code support.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Full endpoint implementation
- Request validation
- Response formatting per contract

**Acceptance Criteria**:
- [ ] Validates inviteType (email|link|code)
- [ ] Validates inviteeEmail required for email type
- [ ] Validates email format (regex)
- [ ] Calls pairingManager.createPairing()
- [ ] Handles mutual invitation detection
- [ ] Sends email for email type (via existing email service)
- [ ] Returns 201 with pairing details on success
- [ ] Returns 400 for validation errors
- [ ] Returns 409 for already paired or existing invitation
- [ ] Returns 429 for rate limit exceeded
- [ ] Creates audit log entry
- [ ] Emits Socket.io event 'pairing:created' to inviter

**Technical Notes**:
```javascript
app.post('/api/pairing/create', requireAuth, pairingRateLimiter, async (req, res) => {
  try {
    const { inviteType, inviteeEmail } = req.body;
    const userId = req.user.id;

    // Validation
    if (!['email', 'link', 'code'].includes(inviteType)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid invite type' });
    }

    // Create pairing
    const pairing = await pairingManager.createPairing(userId, inviteType, inviteeEmail);

    // Send email if needed
    if (inviteType === 'email') {
      await sendPairingInvitationEmail(inviteeEmail, pairing);
    }

    res.status(201).json({ success: true, pairing });
  } catch (error) {
    handlePairingError(error, res);
  }
});
```

---

### T015: Implement POST /api/pairing/accept
**Type**: feature
**Priority**: critical
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T013]

**Description**: Implement authenticated pairing acceptance endpoint.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Full endpoint implementation
- Transaction handling
- Socket.io notification

**Acceptance Criteria**:
- [ ] Validates pairingCode or token provided
- [ ] Validates pairingCode format (LZ-NNNNNN)
- [ ] Calls pairingManager.acceptPairing()
- [ ] Returns 200 with pairing details on success
- [ ] Returns 400 for invalid code/token
- [ ] Returns 403 for email mismatch
- [ ] Returns 404 for not found or expired
- [ ] Returns 409 for already paired
- [ ] Creates audit log entry
- [ ] Emits 'pairing:accepted' to inviter via Socket.io
- [ ] Emits 'pairing:status_changed' to both users

**Technical Notes**:
```javascript
app.post('/api/pairing/accept', requireAuth, async (req, res) => {
  try {
    const { pairingCode, token } = req.body;
    const userId = req.user.id;

    const result = await pairingManager.acceptPairing(pairingCode || token, userId);

    // Notify inviter
    io.to(`user:${result.parentAId}`).emit('pairing:accepted', {
      partnerId: userId,
      partnerName: req.user.username,
      roomId: result.roomId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ success: true, pairing: result });
  } catch (error) {
    handlePairingError(error, res);
  }
});
```

---

### T016: Implement POST /api/pairing/accept-with-signup
**Type**: feature
**Priority**: high
**Complexity**: L (large)
**Estimated Hours**: 5
**Dependencies**: [T013]

**Description**: Implement combined signup + pairing acceptance for new users.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Account creation + pairing in single transaction
- JWT token generation

**Acceptance Criteria**:
- [ ] Validates email, password (8+ chars), username (3+ chars)
- [ ] Validates pairingCode or token
- [ ] Checks email doesn't already exist
- [ ] Calls pairingManager.acceptWithSignup()
- [ ] Hashes password with bcrypt
- [ ] Creates user account
- [ ] Accepts pairing atomically
- [ ] Generates JWT token
- [ ] Returns 201 with user, pairing, and authToken
- [ ] Returns 400 for validation errors
- [ ] Returns 403 for email mismatch
- [ ] Returns 404 for pairing not found
- [ ] Returns 409 for email exists
- [ ] Full transaction rollback on error

**Technical Notes**:
```javascript
app.post('/api/pairing/accept-with-signup', async (req, res) => {
  try {
    const { pairingCode, token, email, password, username } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }

    // Accept with signup
    const result = await pairingManager.acceptWithSignup(
      pairingCode || token,
      email,
      password,
      username
    );

    // Generate JWT
    const authToken = jwt.sign({ id: result.user.id }, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      user: result.user,
      pairing: result.pairing,
      authToken
    });
  } catch (error) {
    handlePairingError(error, res);
  }
});
```

---

### T017: Implement GET /api/pairing/status
**Type**: feature
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T013]

**Description**: Implement pairing status retrieval with backward compatibility.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Status endpoint with 4 possible states
- Backward compatibility for old pending_connections

**Acceptance Criteria**:
- [ ] Returns 'paired' state with partner info if active pairing exists
- [ ] Returns 'pending_sent' state with invitation list if user sent invites
- [ ] Returns 'pending_received' state if user received invites
- [ ] Returns 'unpaired' state if no pairing or invitations
- [ ] Checks both pairing_sessions and pending_connections (transition period)
- [ ] Auto-migrates old invitations if found
- [ ] Returns 200 with status object
- [ ] Returns 401 for unauthenticated
- [ ] Response matches contract schema

**Technical Notes**:
```javascript
app.get('/api/pairing/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check active pairing
    const activePairing = await db.query(`
      SELECT ps.*,
             CASE WHEN ps.parent_a_id = $1 THEN u2.username ELSE u1.username END as partner_name
      FROM pairing_sessions ps
      LEFT JOIN users u1 ON ps.parent_a_id = u1.id
      LEFT JOIN users u2 ON ps.parent_b_id = u2.id
      WHERE (ps.parent_a_id = $1 OR ps.parent_b_id = $1) AND ps.status = 'active'
      LIMIT 1
    `, [userId]);

    if (activePairing.rows.length > 0) {
      return res.json({
        state: 'paired',
        partner: {
          name: activePairing.rows[0].partner_name,
          roomId: activePairing.rows[0].shared_room_id
        },
        pairedAt: activePairing.rows[0].accepted_at
      });
    }

    // Check pending sent/received...
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
  }
});
```

---

### T018: Implement POST /api/pairing/:id/cancel
**Type**: feature
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T013]

**Description**: Implement pairing cancellation endpoint.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Cancellation endpoint with authorization

**Acceptance Criteria**:
- [ ] Validates pairing ID from URL params
- [ ] Validates user is the inviter (parent_a_id)
- [ ] Calls pairingManager.cancelPairing()
- [ ] Updates status to 'canceled'
- [ ] Creates audit log entry
- [ ] Returns 200 with success message
- [ ] Returns 401 for unauthorized
- [ ] Returns 404 for not found

**Technical Notes**:
```javascript
app.post('/api/pairing/:id/cancel', requireAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const userId = req.user.id;

    await pairingManager.cancelPairing(pairingId, userId);

    res.status(200).json({ success: true, message: 'Pairing invitation canceled' });
  } catch (error) {
    handlePairingError(error, res);
  }
});
```

---

### T019: Implement POST /api/pairing/:id/resend
**Type**: feature
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T013]

**Description**: Implement invitation resend endpoint.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Resend endpoint with email notification

**Acceptance Criteria**:
- [ ] Validates pairing ID
- [ ] Validates user is the inviter
- [ ] Calls pairingManager.resendInvitation()
- [ ] Sends new email with updated token
- [ ] Resets expiration to 7 days from now
- [ ] Creates audit log entry
- [ ] Returns 200 with success message
- [ ] Returns 404 for not found
- [ ] Only works for email-type invitations

**Technical Notes**:
```javascript
app.post('/api/pairing/:id/resend', requireAuth, async (req, res) => {
  try {
    const pairingId = parseInt(req.params.id);
    const userId = req.user.id;

    const pairing = await pairingManager.resendInvitation(pairingId, userId);

    // Send email
    await sendPairingInvitationEmail(pairing.parent_b_email, pairing);

    res.status(200).json({ success: true, message: 'Invitation email resent', pairing });
  } catch (error) {
    handlePairingError(error, res);
  }
});
```

---

### T020: Implement POST /api/pairing/validate-code
**Type**: feature
**Priority**: low
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T013]

**Description**: Implement code validation preview endpoint (no authentication required).

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY)

**Deliverables**:
- Validation endpoint for UI preview

**Acceptance Criteria**:
- [ ] Validates code format
- [ ] Calls pairingManager.validatePairingCode()
- [ ] Returns inviter name (not full details)
- [ ] Returns email domain only (privacy)
- [ ] Returns expiration timestamp
- [ ] Returns 200 with valid:true if found
- [ ] Returns 404 with valid:false if not found/expired
- [ ] Does NOT require authentication

**Technical Notes**:
```javascript
app.post('/api/pairing/validate-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!/^LZ-\d{6}$/.test(code)) {
      return res.status(404).json({ valid: false, message: 'Invalid code format' });
    }

    const result = await pairingManager.validatePairingCode(code);

    if (result) {
      res.status(200).json({
        valid: true,
        inviter: {
          name: result.invited_by_username,
          emailDomain: result.parent_b_email?.split('@')[1] || null
        },
        expiresAt: result.expires_at,
        inviteType: result.invite_type
      });
    } else {
      res.status(404).json({ valid: false, message: 'Code not found or expired' });
    }
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Validation error' });
  }
});
```

---

### T021: Add Socket.io Pairing Events
**Type**: feature
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T014, T015, T016]

**Description**: Add real-time Socket.io events for pairing notifications.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/server.js` (MODIFY - Socket.io section)

**Deliverables**:
- Socket.io event emitters for pairing lifecycle
- User-specific room targeting

**Acceptance Criteria**:
- [ ] 'pairing:created' event emitted on pairing creation
- [ ] 'pairing:accepted' event emitted to inviter on acceptance
- [ ] 'pairing:declined' event emitted on decline (future)
- [ ] 'pairing:status_changed' event emitted to both users
- [ ] Events use user-specific rooms: io.to(`user:${userId}`)
- [ ] Events include relevant data (partnerId, roomId, timestamp)
- [ ] Events match contract schema in pairing-events.yaml
- [ ] Frontend listeners can handle events

**Technical Notes**:
```javascript
// In pairing creation
io.to(`user:${userId}`).emit('pairing:created', {
  pairingId: pairing.id,
  code: pairing.pairing_code,
  timestamp: new Date().toISOString()
});

// In pairing acceptance
io.to(`user:${parentAId}`).emit('pairing:accepted', {
  partnerId: parentBId,
  partnerName: acceptingUser.username,
  roomId: sharedRoomId,
  timestamp: new Date().toISOString()
});
```

---

### T022: Write Integration Tests for Pairing API
**Type**: test
**Priority**: high
**Complexity**: L (large)
**Estimated Hours**: 6
**Dependencies**: [T014, T015, T016, T017, T018, T019, T020]

**Description**: Comprehensive integration tests for all pairing endpoints.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/__tests__/pairing-api.test.js` (CREATE)

**Deliverables**:
- Supertest integration test suite
- 25+ test cases covering all endpoints

**Acceptance Criteria**:
- [ ] Test POST /api/pairing/create (email, link, code types)
- [ ] Test POST /api/pairing/accept (happy path, errors)
- [ ] Test POST /api/pairing/accept-with-signup (account creation)
- [ ] Test GET /api/pairing/status (all 4 states)
- [ ] Test POST /api/pairing/:id/cancel
- [ ] Test POST /api/pairing/:id/resend
- [ ] Test POST /api/pairing/validate-code
- [ ] Test rate limiting on create endpoint
- [ ] Test mutual invitation detection
- [ ] Test concurrent acceptance (race condition)
- [ ] Test transaction rollback scenarios
- [ ] Test authentication required for protected routes
- [ ] All tests pass
- [ ] Tests use test database (not production)

**Technical Notes**:
```javascript
const request = require('supertest');
const app = require('../server');

describe('Pairing API', () => {
  test('POST /api/pairing/create - email invitation', async () => {
    const res = await request(app)
      .post('/api/pairing/create')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ inviteType: 'email', inviteeEmail: 'coparent@test.com' })
      .expect(201);

    expect(res.body.pairing.code).toMatch(/^LZ-\d{6}$/);
  });
});
```

---

## Phase D: Frontend Components

### T023: Create AddCoParentPage.jsx Component
**Type**: feature
**Priority**: critical
**Complexity**: L (large)
**Estimated Hours**: 8
**Dependencies**: [T017]

**Description**: Create unified pairing initiation UI with email/link/code options.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/AddCoParentPage.jsx` (CREATE)

**Deliverables**:
- React component with 5 UI states
- Integration with pairing API

**Acceptance Criteria**:
- [ ] State 1: Choose method (email/link/code buttons)
- [ ] State 2: Email invitation form (input + send button)
- [ ] State 3: Pending display (code, copy link, resend, cancel)
- [ ] State 4: Generate/Enter code toggle
- [ ] State 5: Code generated (large display, auto-refresh)
- [ ] Calls POST /api/pairing/create on form submit
- [ ] Displays pairing code prominently (LZ-NNNNNN)
- [ ] Copy to clipboard functionality
- [ ] Shareable message generation
- [ ] Native share API integration (mobile)
- [ ] Countdown timer for expiration
- [ ] Resend button calls POST /api/pairing/:id/resend
- [ ] Cancel button calls POST /api/pairing/:id/cancel
- [ ] Error handling and display
- [ ] Mobile responsive (Tailwind CSS)
- [ ] Follows LiaiZen design system (squoval buttons, glass morphism)

**Technical Notes**:
```jsx
import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

function AddCoParentPage() {
  const [step, setStep] = useState('choose'); // choose | email | pending | code | generated
  const [pairing, setPairing] = useState(null);

  const handleCreatePairing = async (inviteType, inviteeEmail) => {
    try {
      const res = await apiClient.post('/api/pairing/create', {
        inviteType,
        inviteeEmail
      });
      setPairing(res.data.pairing);
      setStep('pending');
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      {step === 'choose' && <ChooseMethodView onSelect={handleCreatePairing} />}
      {step === 'pending' && <PendingView pairing={pairing} />}
      {/* ... other states */}
    </div>
  );
}
```

**Risk Factors**:
- UI complexity (5 states) - mitigated by component separation

---

### T024: Update AcceptPairingPage.jsx Component
**Type**: feature
**Priority**: critical
**Complexity**: L (large)
**Estimated Hours**: 6
**Dependencies**: [T015, T016]

**Description**: Update invitation acceptance page to support new pairing flow with signup.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/AcceptPairingPage.jsx` (MODIFY)

**Deliverables**:
- Updated component supporting code/token
- Combined signup + acceptance flow

**Acceptance Criteria**:
- [ ] Reads pairingCode or token from URL query params
- [ ] Calls POST /api/pairing/validate-code to preview invitation
- [ ] Shows inviter name and email domain
- [ ] If authenticated: Shows "Accept" button (calls POST /api/pairing/accept)
- [ ] If unauthenticated: Shows signup form (email, password, username)
- [ ] Signup form calls POST /api/pairing/accept-with-signup
- [ ] On success, stores JWT token in localStorage
- [ ] Redirects to chat room on success
- [ ] Shows error messages for expired/invalid codes
- [ ] Shows email mismatch error if applicable
- [ ] Mobile responsive
- [ ] Follows design system

**Technical Notes**:
```jsx
function AcceptPairingPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const [invitation, setInvitation] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Validate code on mount
    if (code) {
      apiClient.post('/api/pairing/validate-code', { code })
        .then(res => setInvitation(res.data))
        .catch(err => setError('Invalid or expired code'));
    }
  }, [code]);

  const handleAccept = async () => {
    if (isAuthenticated) {
      await apiClient.post('/api/pairing/accept', { pairingCode: code, token });
    } else {
      const res = await apiClient.post('/api/pairing/accept-with-signup', {
        pairingCode: code,
        email, password, username
      });
      localStorage.setItem('token', res.data.authToken);
    }
    navigate('/chat');
  };

  // ...
}
```

---

### T025: Create PairingStatusWidget.jsx Component
**Type**: feature
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T017]

**Description**: Create dashboard widget showing pairing status.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/PairingStatusWidget.jsx` (CREATE)

**Deliverables**:
- Widget component for dashboard/settings
- Real-time status updates

**Acceptance Criteria**:
- [ ] Calls GET /api/pairing/status on mount
- [ ] Shows 'unpaired' state with "Add Co-Parent" CTA
- [ ] Shows 'pending_sent' state with invitation details
- [ ] Shows 'pending_received' state with accept/decline buttons
- [ ] Shows 'paired' state with partner name and "Open Chat" button
- [ ] Listens to Socket.io 'pairing:status_changed' event
- [ ] Updates UI in real-time when status changes
- [ ] Displays pairing code if pending
- [ ] Shows expiration countdown
- [ ] Click "Add Co-Parent" navigates to AddCoParentPage
- [ ] Click "Open Chat" navigates to shared room
- [ ] Mobile responsive

**Technical Notes**:
```jsx
function PairingStatusWidget() {
  const [status, setStatus] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    // Fetch status
    apiClient.get('/api/pairing/status')
      .then(res => setStatus(res.data));

    // Listen for updates
    socket.on('pairing:status_changed', (data) => {
      setStatus(prevStatus => ({ ...prevStatus, ...data }));
    });

    return () => socket.off('pairing:status_changed');
  }, []);

  if (status?.state === 'unpaired') {
    return (
      <div className="bg-white/80 rounded-lg p-4">
        <h3>Co-Parent Connection</h3>
        <p className="text-sm">⚠ Not paired</p>
        <button onClick={() => navigate('/add-coparent')}>Add Co-Parent</button>
      </div>
    );
  }

  // ... other states
}
```

---

### T026: Create usePairingStatus.js Hook
**Type**: feature
**Priority**: medium
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T017, T021]

**Description**: Create React hook for pairing status management.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/hooks/usePairingStatus.js` (CREATE)

**Deliverables**:
- Custom React hook for pairing state

**Acceptance Criteria**:
- [ ] Fetches pairing status on mount
- [ ] Returns { status, loading, error, refetch } object
- [ ] Automatically refetches on Socket.io events
- [ ] Provides helper functions (isPaired, isPending, etc.)
- [ ] Caches status to avoid redundant API calls
- [ ] Handles authentication errors

**Technical Notes**:
```javascript
import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { useSocket } from './useSocket';

export function usePairingStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/pairing/status');
      setStatus(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Listen for real-time updates
    socket.on('pairing:accepted', fetchStatus);
    socket.on('pairing:status_changed', fetchStatus);

    return () => {
      socket.off('pairing:accepted');
      socket.off('pairing:status_changed');
    };
  }, []);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    isPaired: status?.state === 'paired',
    isPending: status?.state?.startsWith('pending'),
  };
}
```

---

### T027: Update apiClient.js with Pairing Endpoints
**Type**: infrastructure
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 1
**Dependencies**: [T014, T015, T016, T017]

**Description**: Add pairing endpoint wrappers to API client.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/apiClient.js` (MODIFY)

**Deliverables**:
- Typed API client methods

**Acceptance Criteria**:
- [ ] Add createPairing(inviteType, inviteeEmail) method
- [ ] Add acceptPairing(pairingCode) method
- [ ] Add acceptPairingWithSignup(data) method
- [ ] Add getPairingStatus() method
- [ ] Add cancelPairing(pairingId) method
- [ ] Add resendInvitation(pairingId) method
- [ ] Add validatePairingCode(code) method
- [ ] All methods return Promises
- [ ] Include authentication headers

**Technical Notes**:
```javascript
const apiClient = {
  // ... existing methods

  // Pairing methods
  createPairing: (inviteType, inviteeEmail) =>
    axios.post('/api/pairing/create', { inviteType, inviteeEmail }, authHeaders()),

  acceptPairing: (pairingCode) =>
    axios.post('/api/pairing/accept', { pairingCode }, authHeaders()),

  acceptPairingWithSignup: (data) =>
    axios.post('/api/pairing/accept-with-signup', data),

  getPairingStatus: () =>
    axios.get('/api/pairing/status', authHeaders()),

  // ...
};
```

---

### T028: Update App.jsx with New Routes
**Type**: infrastructure
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 1
**Dependencies**: [T023, T024]

**Description**: Add routes for new pairing pages.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/App.jsx` (MODIFY)

**Deliverables**:
- React Router routes for pairing pages

**Acceptance Criteria**:
- [ ] Add route for /add-coparent → AddCoParentPage
- [ ] Update route for /accept-pairing → AcceptPairingPage
- [ ] Routes accessible from navigation
- [ ] Protected routes require authentication (add-coparent)
- [ ] Public routes work without auth (accept-pairing)

**Technical Notes**:
```jsx
import AddCoParentPage from './components/AddCoParentPage';
import AcceptPairingPage from './components/AcceptPairingPage';

function App() {
  return (
    <Routes>
      {/* ... existing routes */}
      <Route path="/add-coparent" element={<ProtectedRoute><AddCoParentPage /></ProtectedRoute>} />
      <Route path="/accept-pairing" element={<AcceptPairingPage />} />
    </Routes>
  );
}
```

---

### T029: Add Socket.io Pairing Event Listeners
**Type**: feature
**Priority**: medium
**Complexity**: M (medium)
**Estimated Hours**: 2
**Dependencies**: [T021, T023, T025]

**Description**: Add frontend Socket.io listeners for pairing events.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/hooks/useSocket.js` (MODIFY or CREATE)
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/AddCoParentPage.jsx` (MODIFY)

**Deliverables**:
- Socket.io event listeners in components

**Acceptance Criteria**:
- [ ] Listen to 'pairing:accepted' event
- [ ] Listen to 'pairing:status_changed' event
- [ ] Show toast notification on pairing accepted
- [ ] Auto-navigate to chat room on acceptance
- [ ] Update AddCoParentPage UI when partner accepts
- [ ] Clean up listeners on component unmount

**Technical Notes**:
```javascript
// In AddCoParentPage
useEffect(() => {
  socket.on('pairing:accepted', (data) => {
    toast.success(`${data.partnerName} accepted your invitation!`);
    setTimeout(() => navigate(`/chat/${data.roomId}`), 2000);
  });

  return () => socket.off('pairing:accepted');
}, []);
```

---

### T030: Write Component Tests for Pairing UI
**Type**: test
**Priority**: medium
**Complexity**: M (medium)
**Estimated Hours**: 5
**Dependencies**: [T023, T024, T025]

**Description**: Unit tests for pairing React components.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/__tests__/AddCoParentPage.test.jsx` (CREATE)
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/__tests__/AcceptPairingPage.test.jsx` (CREATE)
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/__tests__/PairingStatusWidget.test.jsx` (CREATE)

**Deliverables**:
- React Testing Library test suites

**Acceptance Criteria**:
- [ ] Test AddCoParentPage method selection
- [ ] Test email invitation submission
- [ ] Test code generation and display
- [ ] Test AcceptPairingPage code validation
- [ ] Test AcceptPairingPage signup form
- [ ] Test PairingStatusWidget state rendering
- [ ] Mock API calls with jest.fn()
- [ ] Test error handling
- [ ] All tests pass
- [ ] Coverage > 80%

**Technical Notes**:
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import AddCoParentPage from '../AddCoParentPage';

test('renders method selection buttons', () => {
  render(<AddCoParentPage />);
  expect(screen.getByText(/Invite via Email/i)).toBeInTheDocument();
  expect(screen.getByText(/Share Link/i)).toBeInTheDocument();
  expect(screen.getByText(/Use Pairing Code/i)).toBeInTheDocument();
});

test('submits email invitation', async () => {
  const mockCreate = jest.fn();
  apiClient.createPairing = mockCreate;

  render(<AddCoParentPage />);
  fireEvent.click(screen.getByText(/Invite via Email/i));
  // ... fill form and submit
  expect(mockCreate).toHaveBeenCalledWith('email', 'test@example.com');
});
```

---

## Phase E: Integration & Testing

### T031: End-to-End Test: Email Invitation (New User)
**Type**: test
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T023, T024, T030]

**Description**: Complete E2E test scenario for email invitation flow with new user signup.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/__tests__/e2e/pairing-email-new-user.test.js` (CREATE)

**Deliverables**:
- Full E2E test covering spec user story US-001

**Acceptance Criteria**:
- [ ] User A signs up, sees "Add Co-Parent" screen
- [ ] User A enters User B's email, clicks "Send Invitation"
- [ ] Verify pairing_sessions record created with status='pending'
- [ ] Verify email sent to User B (mock email service)
- [ ] User B clicks link, sees signup form with inviter name
- [ ] User B fills signup form, clicks "Accept & Join"
- [ ] Verify User B account created
- [ ] Verify pairing status changed to 'active'
- [ ] Verify shared room created with both users as members
- [ ] Verify mutual contacts created
- [ ] Verify User A receives Socket.io notification
- [ ] Both users can message in shared room
- [ ] Test completes in < 10 seconds

**Technical Notes**:
```javascript
describe('E2E: Email Invitation - New User', () => {
  test('complete flow from invitation to chat', async () => {
    // 1. User A signs up
    const userA = await createTestUser('userA@test.com', 'password123', 'User A');

    // 2. User A sends invitation
    const pairingRes = await apiClient.createPairing('email', 'userB@test.com');
    expect(pairingRes.data.pairing.code).toMatch(/^LZ-\d{6}$/);

    // 3. Verify email sent
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'userB@test.com',
      expect.stringContaining(pairingRes.data.pairing.code)
    );

    // 4. User B accepts with signup
    const acceptRes = await apiClient.acceptPairingWithSignup({
      pairingCode: pairingRes.data.pairing.code,
      email: 'userB@test.com',
      password: 'password456',
      username: 'User B'
    });

    expect(acceptRes.data.user.email).toBe('userB@test.com');
    expect(acceptRes.data.pairing.roomId).toBeTruthy();

    // 5. Verify room and contacts
    const room = await db.query('SELECT * FROM rooms WHERE id = $1', [acceptRes.data.pairing.roomId]);
    expect(room.rows[0].name).toBe('Co-Parent Chat');

    // ... continue verification
  });
});
```

---

### T032: End-to-End Test: Code Pairing (Both Existing)
**Type**: test
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T023, T024]

**Description**: E2E test for code-based pairing between existing users.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/__tests__/e2e/pairing-code-existing.test.js` (CREATE)

**Deliverables**:
- Full E2E test covering spec user story US-005

**Acceptance Criteria**:
- [ ] User A and User B both have accounts
- [ ] User A generates pairing code
- [ ] Code displayed prominently (LZ-NNNNNN)
- [ ] Code expires in 15 minutes
- [ ] User B enters code on their device
- [ ] On match, both accounts paired instantly
- [ ] Both see success message
- [ ] System creates shared room and mutual contacts
- [ ] No duplicate rooms created
- [ ] Test completes in < 5 seconds

**Technical Notes**:
```javascript
test('code pairing between existing users', async () => {
  const userA = await createTestUser('userA@test.com', 'password', 'User A');
  const userB = await createTestUser('userB@test.com', 'password', 'User B');

  // User A generates code
  const codeRes = await apiClient.createPairing('code', null);
  const code = codeRes.data.pairing.code;

  // User B accepts code
  const acceptRes = await apiClient.acceptPairing(code);
  expect(acceptRes.data.pairing.partnerId).toBe(userA.id);

  // Verify only one room created
  const rooms = await db.query(
    'SELECT * FROM rooms WHERE created_by IN ($1, $2)',
    [userA.id, userB.id]
  );
  expect(rooms.rows.length).toBe(1);
});
```

---

### T033: End-to-End Test: Mutual Invitation Auto-Pairing
**Type**: test
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T010, T014]

**Description**: E2E test for mutual invitation detection and auto-pairing.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/__tests__/e2e/pairing-mutual.test.js` (CREATE)

**Deliverables**:
- Full E2E test covering spec user story US-006

**Acceptance Criteria**:
- [ ] User A sends invitation to userB@example.com
- [ ] User B sends invitation to userA@example.com (before accepting A's)
- [ ] System detects mutual invitations
- [ ] Both invitations marked 'active' atomically
- [ ] Only ONE shared room created
- [ ] Both users notified of auto-pairing
- [ ] No user action required (automatic)
- [ ] Test handles case-insensitive email matching

**Technical Notes**:
```javascript
test('mutual invitation auto-pairs users', async () => {
  const userA = await createTestUser('UserA@test.com', 'pass', 'User A');
  const userB = await createTestUser('userb@test.com', 'pass', 'User B');

  // User A invites User B
  const inviteA = await apiClient.createPairing('email', 'userb@test.com');

  // User B invites User A (triggers mutual detection)
  const inviteB = await apiClient.createPairing('email', 'UserA@test.com');

  // Verify both invitations now active
  expect(inviteB.data.mutualPairing).toBe(true);
  expect(inviteB.data.pairing.roomId).toBeTruthy();

  // Verify only one room
  const pairings = await db.query(
    'SELECT * FROM pairing_sessions WHERE parent_a_id IN ($1, $2) AND status = $3',
    [userA.id, userB.id, 'active']
  );
  expect(pairings.rows.length).toBe(2);
  expect(pairings.rows[0].shared_room_id).toBe(pairings.rows[1].shared_room_id);
});
```

---

### T034: Concurrent Acceptance Test (Race Condition Prevention)
**Type**: test
**Priority**: critical
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T008, T015]

**Description**: Test that concurrent acceptance attempts are handled correctly with row-level locking.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/__tests__/concurrency/pairing-race-condition.test.js` (CREATE)

**Deliverables**:
- Concurrency test for race condition prevention

**Acceptance Criteria**:
- [ ] Create single pairing invitation
- [ ] Attempt concurrent acceptance from 2 different users
- [ ] Verify only one acceptance succeeds
- [ ] Verify other attempt returns 409 (already accepted)
- [ ] Verify no partial pairing created
- [ ] Verify database consistency maintained
- [ ] Test uses Promise.all for concurrent requests

**Technical Notes**:
```javascript
test('prevents concurrent acceptance of same code', async () => {
  const userA = await createTestUser('userA@test.com', 'pass', 'User A');
  const userB = await createTestUser('userB@test.com', 'pass', 'User B');
  const userC = await createTestUser('userC@test.com', 'pass', 'User C');

  // User A creates code
  const codeRes = await apiClient.createPairing('code', null);
  const code = codeRes.data.pairing.code;

  // Users B and C try to accept simultaneously
  const results = await Promise.allSettled([
    apiClient.acceptPairing(code, userB.id),
    apiClient.acceptPairing(code, userC.id)
  ]);

  // One succeeds, one fails
  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');

  expect(successes.length).toBe(1);
  expect(failures.length).toBe(1);
  expect(failures[0].reason.response.status).toBe(409);
});
```

---

### T035: Create Backward Compatibility Layer
**Type**: infrastructure
**Priority**: high
**Complexity**: M (medium)
**Estimated Hours**: 4
**Dependencies**: [T004, T017]

**Description**: Implement dual-read system supporting both old and new pairing tables during transition.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/libs/pairing-manager/backwardCompatibility.js` (CREATE)

**Deliverables**:
- Compatibility layer for 30-day transition period

**Acceptance Criteria**:
- [ ] getPairingStatus() checks both pairing_sessions and pending_connections
- [ ] Auto-migrates old invitations on user login
- [ ] Prioritizes new table over old table
- [ ] Logs migration attempts for monitoring
- [ ] Handles edge cases (missing data, invalid references)
- [ ] Provides migration report endpoint
- [ ] Can be disabled via feature flag after 30 days

**Technical Notes**:
```javascript
async function getPairingStatusWithBackwardCompat(userId) {
  // Check new table first
  let status = await getStatusFromPairingSessions(userId);
  if (status) return status;

  // Fallback to old table
  const oldInvitation = await db.query(
    'SELECT * FROM pending_connections WHERE inviter_id = $1 AND status = $2',
    [userId, 'pending']
  );

  if (oldInvitation.rows.length > 0) {
    // Auto-migrate
    await migrateOldInvitation(oldInvitation.rows[0]);
    console.log(`Auto-migrated invitation for user ${userId}`);

    // Fetch from new table
    return await getStatusFromPairingSessions(userId);
  }

  return { state: 'unpaired' };
}
```

---

### T036: Implement Auto-Migration on User Login
**Type**: feature
**Priority**: medium
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T035]

**Description**: Automatically migrate user's pending invitations when they log in.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/auth.js` (MODIFY - add migration hook)

**Deliverables**:
- Login middleware that triggers migration

**Acceptance Criteria**:
- [ ] On successful login, check for old pending_connections
- [ ] Migrate any pending invitations to pairing_sessions
- [ ] Update user's session with migration status
- [ ] Log migration success/failure
- [ ] Don't block login on migration failure
- [ ] Migration happens async (non-blocking)

**Technical Notes**:
```javascript
// In auth.js login handler
app.post('/api/auth/login', async (req, res) => {
  // ... existing login logic

  // After successful authentication
  const userId = user.id;

  // Auto-migrate old invitations (non-blocking)
  migrateUserInvitations(userId).catch(err => {
    console.error('Migration error:', err);
    // Don't fail login
  });

  res.json({ token, user });
});
```

---

### T037: Create Migration Notice Banner Component
**Type**: feature
**Priority**: low
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T035]

**Description**: Display banner to users with migrated invitations.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/MigrationNoticeBanner.jsx` (CREATE)

**Deliverables**:
- Banner component for migration notification

**Acceptance Criteria**:
- [ ] Shows banner if user has migrated invitations
- [ ] Message: "We've upgraded our pairing system. Your pending invitations are still active."
- [ ] Dismissible (stores in localStorage)
- [ ] Only shows once per user
- [ ] Links to pairing status page

**Technical Notes**:
```jsx
function MigrationNoticeBanner() {
  const [dismissed, setDismissed] = useState(
    localStorage.getItem('migration_notice_dismissed') === 'true'
  );

  if (dismissed) return null;

  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
      <p className="text-blue-700">
        We've upgraded our pairing system. Your pending invitations are still active.
      </p>
      <button onClick={() => {
        localStorage.setItem('migration_notice_dismissed', 'true');
        setDismissed(true);
      }}>
        Dismiss
      </button>
    </div>
  );
}
```

---

## Phase F: Cleanup & Documentation

### T038: Deprecate Old InviteCoParentPage Component
**Type**: cleanup
**Priority**: low
**Complexity**: S (small)
**Estimated Hours**: 1
**Dependencies**: [T023, T036]

**Description**: Mark old invitation component as deprecated, redirect to new flow.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/InviteCoParentPage.jsx` (MODIFY)

**Deliverables**:
- Deprecation notice and redirect

**Acceptance Criteria**:
- [ ] Add deprecation comment at top of file
- [ ] Component redirects to /add-coparent
- [ ] Shows notice: "This page has moved"
- [ ] Can be removed after 30 days

**Technical Notes**:
```jsx
/**
 * @deprecated Use AddCoParentPage instead
 * This component will be removed in v2.0
 */
function InviteCoParentPage() {
  useEffect(() => {
    navigate('/add-coparent', { replace: true });
  }, []);

  return <div>Redirecting to new pairing flow...</div>;
}
```

---

### T039: Update API Documentation
**Type**: docs
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T014-T020]

**Description**: Update API documentation with new pairing endpoints.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/README.md` (MODIFY)
- `/Users/athenasees/Desktop/chat/docs/api/pairing.md` (CREATE)

**Deliverables**:
- Complete API documentation for pairing endpoints

**Acceptance Criteria**:
- [ ] Document all 7 pairing endpoints
- [ ] Include request/response examples
- [ ] Document error codes
- [ ] Add authentication requirements
- [ ] Include rate limiting info
- [ ] Add Socket.io event documentation

**Technical Notes**:
```markdown
## Pairing API

### POST /api/pairing/create
Creates a new pairing invitation.

**Authentication**: Required
**Rate Limit**: 5 per hour

**Request**:
\`\`\`json
{
  "inviteType": "email",
  "inviteeEmail": "coparent@example.com"
}
\`\`\`

**Response** (201):
\`\`\`json
{
  "success": true,
  "pairing": {
    "id": 123,
    "code": "LZ-842396",
    ...
  }
}
\`\`\`
```

---

### T040: Update User-Facing Documentation
**Type**: docs
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T023, T024]

**Description**: Create user guide for new pairing flow.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/docs/user-guide/pairing.md` (CREATE)

**Deliverables**:
- User-friendly pairing guide

**Acceptance Criteria**:
- [ ] Explain 3 pairing methods (email, link, code)
- [ ] Include screenshots of UI
- [ ] Troubleshooting section (expired codes, email mismatch)
- [ ] FAQ section
- [ ] Step-by-step instructions for each method

**Technical Notes**:
- Use simple language (no technical jargon)
- Include visual aids
- Focus on co-parent use cases

---

### T041: Verify All Users Migrated (30 Days After Deploy)
**Type**: validation
**Priority**: medium
**Complexity**: S (small)
**Estimated Hours**: 2
**Dependencies**: [T036]

**Description**: Verify 100% migration completion before removing old tables.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/scripts/verify-migration.js` (CREATE)

**Deliverables**:
- Migration verification script and report

**Acceptance Criteria**:
- [ ] Query old pending_connections table for remaining records
- [ ] Generate report of unmigrated invitations
- [ ] Attempt manual migration for stragglers
- [ ] Verify no data loss
- [ ] Document any edge cases
- [ ] Approval from product team before cleanup

**Technical Notes**:
```javascript
async function verifyMigration() {
  const unmigrated = await db.query(`
    SELECT pc.*, u.email
    FROM pending_connections pc
    LEFT JOIN users u ON pc.inviter_id = u.id
    WHERE pc.status = 'pending'
      AND pc.expires_at > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM pairing_sessions ps
        WHERE ps.invite_token = pc.token
      )
  `);

  console.log(`Unmigrated invitations: ${unmigrated.rows.length}`);

  // Generate report...
}
```

---

### T042: Remove Old Tables and Deprecated Code
**Type**: cleanup
**Priority**: low
**Complexity**: M (medium)
**Estimated Hours**: 3
**Dependencies**: [T041]

**Description**: Final cleanup - remove old tables and deprecated code.

**Files to Create/Modify**:
- `/Users/athenasees/Desktop/chat/chat-server/migrations/cleanup_old_pairing.sql` (CREATE)
- `/Users/athenasees/Desktop/chat/chat-server/connectionManager.js` (DELETE or archive)
- `/Users/athenasees/Desktop/chat/chat-client-vite/src/components/InviteCoParentPage.jsx` (DELETE)

**Deliverables**:
- Cleanup migration script
- Removal of deprecated files

**Acceptance Criteria**:
- [ ] DROP TABLE pending_connections (with backup)
- [ ] Remove backward compatibility layer code
- [ ] Remove old connectionManager.js
- [ ] Remove deprecated InviteCoParentPage.jsx
- [ ] Remove migration notice banner code
- [ ] Update imports and references
- [ ] Run full test suite to verify no breakage
- [ ] Deploy cleanup to production

**Technical Notes**:
```sql
-- Backup old table before dropping
CREATE TABLE pending_connections_archive AS SELECT * FROM pending_connections;

-- Drop old table
DROP TABLE pending_connections;

-- Remove old indexes
DROP INDEX IF EXISTS idx_pending_token;
DROP INDEX IF EXISTS idx_pending_inviter;
```

**Risk Factors**:
- Ensure 100% migration before running
- Keep backups for 90 days
- Monitor error logs after cleanup

---

## Task Summary by Phase

### Phase A: Database Foundation (4 tasks, 11 hours)
- T001: Create migration script (3h)
- T002: Test SQLite (2h)
- T003: Test PostgreSQL (2h)
- T004: Data migration script (4h)

### Phase B: Backend Library (8 tasks, 32 hours)
- T005: Directory structure (1h)
- T006: pairingCreator.js (6h)
- T007: Tests for pairingCreator (4h)
- T008: pairingValidator.js (6h)
- T009: Tests for pairingValidator (4h)
- T010: mutualDetector.js (4h)
- T011: Tests for mutualDetector (3h)
- T012: Export unified API (1h)

### Phase C: Backend API (10 tasks, 32 hours)
- T013: Add routes (2h)
- T014: POST /create (4h)
- T015: POST /accept (4h)
- T016: POST /accept-with-signup (5h)
- T017: GET /status (4h)
- T018: POST /cancel (2h)
- T019: POST /resend (2h)
- T020: POST /validate-code (2h)
- T021: Socket.io events (3h)
- T022: Integration tests (6h)

### Phase D: Frontend (8 tasks, 31 hours)
- T023: AddCoParentPage (8h)
- T024: AcceptPairingPage (6h)
- T025: PairingStatusWidget (4h)
- T026: usePairingStatus hook (3h)
- T027: Update apiClient (1h)
- T028: Update routes (1h)
- T029: Socket.io listeners (2h)
- T030: Component tests (5h)

### Phase E: Integration & Testing (7 tasks, 22 hours)
- T031: E2E email invitation (4h)
- T032: E2E code pairing (3h)
- T033: E2E mutual pairing (3h)
- T034: Concurrency test (3h)
- T035: Backward compatibility (4h)
- T036: Auto-migration (3h)
- T037: Migration banner (2h)

### Phase F: Cleanup (5 tasks, 10 hours)
- T038: Deprecate old component (1h)
- T039: API docs (2h)
- T040: User docs (2h)
- T041: Verify migration (2h)
- T042: Remove old code (3h)

**Total**: 42 tasks, 138 hours estimated

---

## Dependency Graph (Critical Path)

```
T001 → T002 → T005 → T006 → T007 → T013 → T014 → T023 → T031
       ↓            ↓
       T003         T008 → T009 → T015 → T024 → T032
                    ↓
                    T010 → T011 → T016 → T033
```

**Critical Path Tasks**: T001, T002, T005, T006, T013, T014, T023, T031 (24 hours minimum)

**Parallelization Opportunities**:
- T002 and T003 can run in parallel (database testing)
- T006, T008, T010 can be developed in parallel (different modules)
- T007, T009, T011 can run in parallel (unit tests)
- T023, T024, T025 can be developed in parallel (different components)

**Estimated Timeline**:
- With 1 full-time engineer: 3.5 weeks
- With 2 engineers (backend + frontend): 2 weeks
- With aggressive parallelization: 10 business days

---

## Risk Mitigation

**High-Risk Tasks**:
1. **T008** (pairingValidator): Transaction complexity, race conditions
   - Mitigation: Thorough testing with T034, use SELECT FOR UPDATE
2. **T033** (Mutual pairing test): Edge case handling
   - Mitigation: Multiple test scenarios, case-insensitive email matching
3. **T041** (Migration verification): Data loss risk
   - Mitigation: Backups, manual verification, 30-day buffer

**Blockers**:
- Database migration approval (T001-T004) required before backend work
- Backend API completion (T014-T020) required before frontend integration
- Migration verification (T041) required before cleanup (T042)

---

*Task list for coparentliaizen.com - Better Co-Parenting Through Better Communication*
*Based on Constitution v1.5.0 - Library-First, Test-First, Contract-First*
