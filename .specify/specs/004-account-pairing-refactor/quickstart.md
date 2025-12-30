# Quickstart Testing Guide: Account Pairing Flow

**Feature**: 004-account-pairing-refactor
**Date**: 2025-11-27
**Purpose**: Step-by-step test scenarios for validating the pairing system

## Prerequisites

### Development Environment Setup

```bash
# 1. Start backend server (SQLite dev mode)
cd chat-server
npm run dev
# Server running at http://localhost:3001

# 2. Start frontend (separate terminal)
cd chat-client-vite
npm run dev
# Frontend running at http://localhost:5173

# 3. Verify database is initialized
ls -la chat-server/chat.db
# Should see chat.db file

# 4. Check pairing_sessions table exists
sqlite3 chat-server/chat.db "SELECT name FROM sqlite_master WHERE type='table' AND name='pairing_sessions';"
# Should return: pairing_sessions
```

### Test User Accounts

Create these test accounts for testing:

```javascript
// User A (Inviter)
{
  username: "testuser_a",
  email: "usera@test.com",
  password: "password123"
}

// User B (Acceptor)
{
  username: "testuser_b",
  email: "userb@test.com",
  password: "password123"
}

// User C (New User - no account)
{
  email: "userc@test.com" // Will create account during acceptance
}
```

---

## Test Scenario 1: Email Invitation (New User)

**User Story**: US-003 - Co-Parent Accepts Invitation (New User)

**Steps**:

### 1.1 User A Creates Account and Sends Invitation

```bash
# 1. Open browser to http://localhost:5173
# 2. Click "Sign Up"
# 3. Fill form:
#    - Username: testuser_a
#    - Email: usera@test.com
#    - Password: password123
# 4. Click "Create Account"
# 5. Should redirect to /add-coparent
# 6. Select "Invite via Email"
# 7. Enter email: userc@test.com
# 8. Click "Send Invitation"
```

**Expected Results**:

- [x] User redirected to /add-coparent after signup
- [x] Email input field visible
- [x] After sending, UI shows:
  - "Invitation Sent!" success message
  - Pairing code (e.g., LZ-842396)
  - Shareable link
  - "Copy Link" and "Resend Email" buttons
- [x] Database check:

```sql
SELECT * FROM pairing_sessions WHERE parent_b_email = 'userc@test.com';
-- Should return 1 row with status = 'pending'
```

### 1.2 User C Receives Email and Accepts

```bash
# 1. Check server logs for invitation email content
# 2. Copy invitation link from logs (e.g., /accept-pairing?token=abc123...)
# 3. Open link in incognito window (or different browser)
# 4. Should see "Join [testuser_a] on LiaiZen" page
# 5. Fill signup form:
#    - Email: userc@test.com
#    - Username: testuser_c
#    - Password: password123
# 6. Click "Accept & Join"
```

**Expected Results**:

- [x] Invitation page shows inviter name (testuser_a)
- [x] Email field pre-filled with userc@test.com
- [x] After accepting:
  - User C account created
  - Pairing status updated to 'active'
  - Shared room created
  - Both users added as contacts to each other
- [x] User A receives real-time notification (Socket.io)
- [x] User C redirected to /rooms/{roomId}
- [x] Database check:

```sql
-- Check pairing is active
SELECT * FROM pairing_sessions WHERE id = 1;
-- status = 'active', parent_b_id = [User C's ID]

-- Check shared room exists
SELECT * FROM rooms WHERE id = (SELECT shared_room_id FROM pairing_sessions WHERE id = 1);
-- Should return 1 row, name = 'Co-Parent Chat'

-- Check room members
SELECT * FROM room_members WHERE room_id = (SELECT shared_room_id FROM pairing_sessions WHERE id = 1);
-- Should return 2 rows (User A and User C)

-- Check contacts created
SELECT * FROM contacts WHERE (user_id = [User A ID] AND relationship = 'co-parent')
   OR (user_id = [User C ID] AND relationship = 'co-parent');
-- Should return 2 rows (mutual contacts)
```

---

## Test Scenario 2: Code Pairing (Both Existing Users)

**User Story**: US-005 - Both Users Already Signed Up (Pairing Code Method)

**Steps**:

### 2.1 User A Generates Pairing Code

```bash
# 1. Log in as testuser_a (if not already)
# 2. Navigate to /add-coparent
# 3. Click "Use Pairing Code" tab
# 4. Click "Generate Code"
```

**Expected Results**:

- [x] Large pairing code displayed (e.g., LZ-842396)
- [x] Code is 6 numeric digits (LZ-NNNNNN format)
- [x] Expiration timer shows "Expires in 15 minutes"
- [x] "Copy Code" and "Share" buttons visible
- [x] Auto-refresh every 5 seconds shows "Waiting for connection..."

### 2.2 User B Enters Code and Accepts

```bash
# 1. Log in as testuser_b (different browser/incognito)
# 2. Navigate to /add-coparent
# 3. Click "Use Pairing Code" tab
# 4. Click "Enter Code"
# 5. Type pairing code from User A (e.g., LZ-842396)
# 6. Click "Connect"
```

**Expected Results**:

- [x] Code input field auto-formats (adds LZ- prefix)
- [x] After entering valid code, "Connect" button enabled
- [x] After clicking "Connect":
  - Instant pairing (< 1 second)
  - Success message: "Paired with [testuser_a]"
  - User B redirected to /rooms/{roomId}
- [x] User A sees real-time update:
  - Success notification: "[testuser_b] accepted your pairing!"
  - Auto-redirect to /rooms/{roomId}
- [x] Both users can now see each other in shared room

**Database Validation**:

```sql
-- Check pairing is active
SELECT * FROM pairing_sessions WHERE pairing_code LIKE 'LZ-%' AND status = 'active';
-- Should return 1 row

-- Check expires_at is within 15 minutes of created_at
SELECT created_at, expires_at,
       JULIANDAY(expires_at) - JULIANDAY(created_at) AS hours_diff
FROM pairing_sessions WHERE invite_type = 'code';
-- hours_diff should be ~0.0104 (15 minutes / 1440 minutes per day)
```

---

## Test Scenario 3: Mutual Invitation Detection

**User Story**: US-006 - Mutual Invitation Detection

**Steps**:

### 3.1 User A Invites User D

```bash
# 1. Log in as testuser_a
# 2. Navigate to /add-coparent
# 3. Enter email: userd@test.com
# 4. Click "Send Invitation"
# 5. Note the pairing code (e.g., LZ-123456)
```

### 3.2 User D Invites User A (Before Accepting)

```bash
# 1. Create account as testuser_d (email: userd@test.com)
# 2. Navigate to /add-coparent
# 3. Enter email: usera@test.com
# 4. Click "Send Invitation"
```

**Expected Results**:

- [x] System detects mutual invitation immediately
- [x] Both users see success message: "You and [username] are now paired!"
- [x] Both users receive real-time notification
- [x] Only ONE shared room created (not two)
- [x] Both pairing records updated to 'active'
- [x] Database check:

```sql
-- Check both invitations are active
SELECT * FROM pairing_sessions
WHERE (parent_a_id = [User A ID] AND parent_b_id = [User D ID])
   OR (parent_a_id = [User D ID] AND parent_b_id = [User A ID]);
-- Should return 2 rows, both status = 'active', same shared_room_id

-- Verify only one room created
SELECT COUNT(*) FROM rooms WHERE id = (
  SELECT shared_room_id FROM pairing_sessions WHERE parent_a_id = [User A ID]
);
-- Should return 1

-- Verify no duplicate contacts
SELECT COUNT(*) FROM contacts
WHERE (user_id = [User A ID] AND relationship = 'co-parent')
   OR (user_id = [User D ID] AND relationship = 'co-parent');
-- Should return 2 (not 4)
```

---

## Test Scenario 4: Link Sharing Flow

**User Story**: US-002 - New User Invites Co-Parent via Link

**Steps**:

### 4.1 User A Generates Shareable Link

```bash
# 1. Log in as testuser_a
# 2. Navigate to /add-coparent
# 3. Click "Share Link" option
# 4. Click "Generate Link"
```

**Expected Results**:

- [x] Shareable link displayed (e.g., https://coparentliaizen.com/accept-pairing?token=...)
- [x] "Copy Link" button visible
- [x] Native share button visible (on mobile)
- [x] Link includes secure token (32+ characters)
- [x] Pairing code also displayed (for fallback)

### 4.2 User E Clicks Link and Accepts

```bash
# 1. Copy shareable link
# 2. Open in incognito window
# 3. Should see invitation page
# 4. Create account or log in
# 5. Click "Accept"
```

**Expected Results**:

- [x] Link validates successfully
- [x] User can create account or log in
- [x] After accepting, pairing completes
- [x] User E redirected to shared room

---

## Test Scenario 5: Pairing Status Visibility

**User Story**: US-007 - View and Manage Pairing Status

**Steps**:

### 5.1 Unpaired State

```bash
# 1. Create new user (testuser_f)
# 2. Navigate to dashboard
# 3. Check pairing status widget
```

**Expected Results**:

- [x] Status badge shows: "Unpaired"
- [x] Message: "Add your co-parent to unlock full features"
- [x] "Add Co-Parent" CTA button visible
- [x] API check:

```bash
curl -H "Authorization: Bearer [jwt_token]" \
  http://localhost:3001/api/pairing/status
# Response: {"state": "unpaired"}
```

### 5.2 Pending (Sent) State

```bash
# 1. User F sends invitation to userg@test.com
# 2. Check pairing status widget
```

**Expected Results**:

- [x] Status badge shows: "Pending"
- [x] Message: "Waiting for userg@test.com to accept"
- [x] Pairing code displayed
- [x] "Resend Invite" and "Cancel Pairing" buttons visible
- [x] API check:

```bash
curl -H "Authorization: Bearer [jwt_token]" \
  http://localhost:3001/api/pairing/status
# Response: {"state": "pending_sent", "invitations": [...]}
```

### 5.3 Paired State

```bash
# 1. User G accepts invitation
# 2. Check pairing status widget (User F's dashboard)
```

**Expected Results**:

- [x] Status badge shows: "Paired"
- [x] Message: "Paired with [testuser_g]"
- [x] "Open Chat" button visible (links to shared room)
- [x] Paired date displayed: "Connected: [X] days ago"
- [x] API check:

```bash
curl -H "Authorization: Bearer [jwt_token]" \
  http://localhost:3001/api/pairing/status
# Response: {"state": "paired", "partner": {...}, "pairedAt": "..."}
```

---

## Test Scenario 6: Cancel and Resend Pairing

**User Story**: US-008 - Cancel or Resend Pairing Request

**Steps**:

### 6.1 Resend Invitation

```bash
# 1. Log in as user with pending invitation
# 2. Navigate to pairing status widget
# 3. Click "Resend Invite"
```

**Expected Results**:

- [x] Success message: "Invitation email resent"
- [x] New token generated (old token invalidated)
- [x] Expiration date reset to 7 days from now
- [x] Database check:

```sql
SELECT token_hash, expires_at FROM pairing_sessions WHERE id = [pairing_id];
-- token_hash should be different from before
-- expires_at should be ~7 days from NOW()
```

### 6.2 Cancel Pairing

```bash
# 1. User with pending invitation clicks "Cancel Pairing"
# 2. Confirm cancellation in modal
```

**Expected Results**:

- [x] Confirmation modal appears: "Are you sure?"
- [x] After confirming:
  - Success message: "Pairing invitation canceled"
  - Status updates to "Unpaired"
  - "Add Co-Parent" button appears
- [x] Database check:

```sql
SELECT status FROM pairing_sessions WHERE id = [pairing_id];
-- status = 'canceled'
```

### 6.3 Attempt to Accept Canceled Invitation

```bash
# 1. Invitee tries to use canceled invitation link/code
```

**Expected Results**:

- [x] Error message: "This invitation has been canceled"
- [x] Suggestion: "Please ask your co-parent to send a new invitation"
- [x] API returns 404:

```bash
curl -X POST http://localhost:3001/api/pairing/accept \
  -H "Content-Type: application/json" \
  -d '{"pairingCode": "LZ-123456"}'
# Response: {"error": "PAIRING_NOT_FOUND_OR_EXPIRED", ...}
```

---

## Test Scenario 7: Concurrent Acceptance (Race Condition)

**Purpose**: Verify that only one user can accept a pairing code

**Steps**:

### 7.1 Setup

```bash
# 1. User A generates pairing code (e.g., LZ-999999)
# 2. Share code with User B and User C
```

### 7.2 Simultaneous Acceptance

```bash
# 1. User B and User C both navigate to /add-coparent
# 2. Both enter code LZ-999999 simultaneously
# 3. Both click "Connect" at the same time
```

**Expected Results**:

- [x] Only ONE user successfully pairs (first to acquire database lock)
- [x] Other user receives error: "Pairing code already used"
- [x] Database check:

```sql
-- Only one pairing should be active
SELECT COUNT(*) FROM pairing_sessions
WHERE pairing_code = 'LZ-999999' AND status = 'active';
-- Should return 1

-- Audit log shows attempted duplicate acceptance
SELECT * FROM pairing_audit_log WHERE pairing_session_id = [pairing_id];
-- Should show 'accepted' action once, 'failed_acceptance' once
```

---

## Test Scenario 8: Expiration and Cleanup

**User Story**: FR-006 - Pairing Expiration and Cleanup

**Steps**:

### 8.1 Test Code Expiration (15 minutes)

```bash
# 1. User A generates code-type pairing
# 2. Wait 16 minutes (or manually update expires_at in database)
# 3. User B tries to accept expired code
```

**Expected Results**:

- [x] Error message: "This pairing code has expired"
- [x] Suggestion: "Please ask your co-parent to generate a new code"
- [x] Database check:

```sql
-- Manual expiration test
UPDATE pairing_sessions
SET expires_at = datetime('now', '-1 minute')
WHERE pairing_code = 'LZ-123456';

-- Try to accept
-- Should fail with PAIRING_NOT_FOUND_OR_EXPIRED
```

### 8.2 Test Email/Link Expiration (7 days)

```bash
# 1. Create email-type pairing
# 2. Manually set expires_at to past date
# 3. Try to accept via link
```

**Expected Results**:

- [x] Error message: "This invitation has expired"
- [x] API returns 404

### 8.3 Test Cleanup Job

```bash
# 1. Create several expired pairings (status = 'expired')
# 2. Set created_at to 31 days ago
# 3. Run cleanup script
```

**Expected Results**:

```sql
-- Create old expired pairings
INSERT INTO pairing_sessions (pairing_code, parent_a_id, status, created_at, expires_at)
VALUES ('LZ-999998', 1, 'expired', datetime('now', '-31 days'), datetime('now', '-24 days'));

-- Run cleanup (should be automated, but test manually)
DELETE FROM pairing_sessions
WHERE status IN ('expired', 'canceled')
  AND created_at < datetime('now', '-30 days');

-- Verify deletion
SELECT COUNT(*) FROM pairing_sessions WHERE pairing_code = 'LZ-999998';
-- Should return 0
```

---

## Test Scenario 9: Backward Compatibility

**Purpose**: Verify old pending_connections table support during transition

**Steps**:

### 9.1 Check Old Table Read Support

```bash
# 1. Insert old-style pending connection (simulate legacy data)
```

```sql
INSERT INTO pending_connections (inviter_id, invitee_email, token, status, expires_at)
VALUES (1, 'olduser@test.com', 'old_token_12345', 'pending', datetime('now', '+7 days'));
```

**Expected Results**:

```bash
# 2. Call GET /api/pairing/status for inviter
curl -H "Authorization: Bearer [jwt_token]" \
  http://localhost:3001/api/pairing/status

# Should return:
# {"state": "pending_sent", "invitations": [{...}]} (from old table)
```

### 9.2 Auto-Migration on Login

```bash
# 1. User with pending_connections entry logs in
# 2. Check that entry was migrated to pairing_sessions
```

**Expected Results**:

```sql
-- After user login, check migration occurred
SELECT * FROM pairing_sessions WHERE parent_b_email = 'olduser@test.com';
-- Should return 1 row (migrated from old table)

SELECT * FROM pending_connections WHERE invitee_email = 'olduser@test.com';
-- Should still exist (not deleted yet - 30 day transition)
```

---

## API Testing (cURL Commands)

### Create Pairing

```bash
curl -X POST http://localhost:3001/api/pairing/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [jwt_token]" \
  -d '{
    "inviteType": "email",
    "inviteeEmail": "coparent@example.com"
  }'
```

### Accept Pairing

```bash
curl -X POST http://localhost:3001/api/pairing/accept \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [jwt_token]" \
  -d '{
    "pairingCode": "LZ-842396"
  }'
```

### Get Pairing Status

```bash
curl http://localhost:3001/api/pairing/status \
  -H "Authorization: Bearer [jwt_token]"
```

### Cancel Pairing

```bash
curl -X POST http://localhost:3001/api/pairing/123/cancel \
  -H "Authorization: Bearer [jwt_token]"
```

### Validate Code (Preview)

```bash
curl -X POST http://localhost:3001/api/pairing/validate-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "LZ-842396"
  }'
```

---

## Performance Testing

### Load Test: Concurrent Pairing Creations

```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -H "Authorization: Bearer [token]" \
  -p pairing_create.json \
  http://localhost:3001/api/pairing/create

# Expected: All 100 requests complete in < 20 seconds
# Average response time: < 200ms
```

### Stress Test: Code Collisions

```bash
# Generate 10,000 pairing codes
# Verify no duplicates (all codes are unique)

for i in {1..10000}; do
  curl -X POST http://localhost:3001/api/pairing/create \
    -H "Authorization: Bearer [token]" \
    -H "Content-Type: application/json" \
    -d '{"inviteType": "code"}' >> codes.txt
done

# Check for duplicates
grep -oP 'LZ-\d{6}' codes.txt | sort | uniq -d
# Should return nothing (no duplicates)
```

---

## Checklist: Pre-Deployment Validation

### Functional Tests

- [ ] Email invitation flow (new user) works end-to-end
- [ ] Email invitation flow (existing user) works end-to-end
- [ ] Code pairing flow works end-to-end
- [ ] Link sharing flow works end-to-end
- [ ] Mutual invitation detection works correctly
- [ ] Pairing status visibility accurate for all states
- [ ] Cancel pairing works correctly
- [ ] Resend pairing works correctly
- [ ] Expired pairing codes rejected
- [ ] Concurrent acceptance prevented (race condition)

### Database Tests

- [ ] pairing_sessions table created successfully
- [ ] pairing_audit_log table created successfully
- [ ] Indexes exist and improve query performance
- [ ] Foreign key constraints enforced (CASCADE on user delete)
- [ ] Migration from pending_connections works
- [ ] Backward compatibility layer reads old table

### API Tests

- [ ] All endpoints return correct status codes
- [ ] Rate limiting enforced (5 per hour)
- [ ] Authentication required for protected endpoints
- [ ] Email validation prevents invalid emails
- [ ] Error messages are user-friendly

### Real-Time Tests

- [ ] Socket.io events delivered within 2 seconds
- [ ] Events delivered to correct users only (not broadcast)
- [ ] pairing:accepted event includes all required data
- [ ] pairing:created event confirms invitation
- [ ] Reconnection handles missed events

### Security Tests

- [ ] Pairing codes are cryptographically random
- [ ] Tokens are 32+ bytes and hashed in database
- [ ] Email enumeration prevention (generic error messages)
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting prevents abuse

### UI/UX Tests

- [ ] Mobile-responsive (touch targets 44px minimum)
- [ ] Code input auto-formats (LZ- prefix)
- [ ] Native share API works on mobile
- [ ] Loading states shown during API calls
- [ ] Error messages are clear and actionable
- [ ] Success notifications appear immediately

---

_Quickstart Testing Guide for coparentliaizen.com - Better Co-Parenting Through Better Communication_
