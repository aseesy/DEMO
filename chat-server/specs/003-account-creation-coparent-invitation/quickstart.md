# Quickstart Testing Guide: Co-Parent Invitation

**Feature**: 003-account-creation-coparent-invitation
**Purpose**: Step-by-step manual testing scenarios for invitation feature
**Audience**: QA testers, developers validating implementation

## Prerequisites

### Local Development Setup
```bash
# 1. Start PostgreSQL database
# (Ensure DATABASE_URL environment variable is set)

# 2. Run database migrations
cd /Users/athenasees/Desktop/chat/chat-server
npm run migrate

# 3. Start backend server
npm run dev
# Server should start on http://localhost:8080

# 4. Start frontend (in separate terminal)
cd /Users/athenasees/Desktop/chat/chat-client-vite
npm run dev
# Frontend should start on http://localhost:3000

# 5. Verify email service configured (for invitation emails)
# Check .env file has:
# EMAIL_SERVICE=gmail (or smtp)
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-app-password
```

### Test Data
- **Parent 1 Email**: `test.parent1@example.com`
- **Parent 1 Password**: `TestPassword123`
- **Parent 2 Email**: `test.parent2@example.com`
- **Parent 2 Password**: `TestPassword456`

---

## Test Scenarios (from spec.md Acceptance Criteria)

### Scenario 1: New User Account Creation

**Given**: A person visiting the platform for the first time
**When**: They complete the signup form with valid credentials
**Then**: Account is created, they are logged in, and dashboard is shown

**Steps**:
1. Open browser to `http://localhost:3000/signup`
2. Fill in signup form:
   - Email: `test.parent1@example.com`
   - Password: `TestPassword123`
   - First Name: `Test`
   - Last Name: `Parent One`
   - Co-Parent Email: `test.parent2@example.com` (REQUIRED field)
3. Click "Create Account" button
4. **Expected Result**:
   - Success message shown: "Account created. Invitation sent to co-parent."
   - User automatically logged in
   - Dashboard page displayed
   - Invitation confirmation badge/notification shown

**Verification**:
```sql
-- Check user was created
SELECT id, username, email, created_at FROM users
WHERE email = 'test.parent1@example.com';

-- Check private room was created for user
SELECT r.id, r.name, r.created_by FROM rooms r
INNER JOIN room_members rm ON r.id = rm.room_id
WHERE rm.user_id = (SELECT id FROM users WHERE email = 'test.parent1@example.com');

-- Check invitation was created
SELECT id, inviter_id, invitee_email, status, expires_at FROM invitations
WHERE invitee_email = 'test.parent2@example.com';
```

**Pass Criteria**:
- ✅ User record exists in database
- ✅ User's private room exists
- ✅ Invitation record exists with status='pending'
- ✅ Invitation expires_at is 7 days in future
- ✅ User can access dashboard

---

### Scenario 2: Co-Parent Invitation (New User - Email Delivery)

**Given**: A newly registered user on their dashboard
**When**: They enter co-parent's email and send invitation
**Then**: Co-parent receives email with secure invitation link

**Steps**:
1. Login as Parent 1: `test.parent1@example.com` / `TestPassword123`
2. (Invitation should have been sent during signup in Scenario 1)
3. Check email inbox (or console logs in development mode)
4. **Expected Email Content**:
   - Subject: "You're invited to co-parent on LiaiZen"
   - From: "LiaiZen <info@liaizen.com>"
   - Message: "Test Parent One has invited you to join LiaiZen..."
   - Button: "Accept Invitation"
   - Link: `http://localhost:3000/join?token=<43-char-token>`
   - Expiration notice: "This invitation will expire in 7 days"

**Development Mode**:
```bash
# Email will be logged to console, not sent
# Look for output like:
📧 EMAIL (Development Mode)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: test.parent2@example.com
Subject: You're invited to co-parent on LiaiZen

Hi there,

Test Parent One has invited you to join LiaiZen...

Accept your invitation by visiting:
http://localhost:3000/join?token=abc123def456...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Verification**:
```bash
# Test API endpoint directly
curl -X POST http://localhost:8080/api/invitations/send \
  -H "Authorization: Bearer <parent1-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test.parent2@example.com"}'

# Expected response:
# {"success": true, "message": "If this email is valid, an invitation has been sent"}
```

**Pass Criteria**:
- ✅ Email received (or logged in dev mode)
- ✅ Email contains invitation link with token
- ✅ Email layout is responsive (test on mobile)
- ✅ Plain text fallback included
- ✅ Expiration notice clearly visible

---

### Scenario 3: Co-Parent Accepts Invitation (Creates Account)

**Given**: Co-parent receives invitation email
**When**: They click invitation link and complete signup
**Then**: Account created AND automatically connected to inviter's room

**Steps**:
1. Copy invitation link from Scenario 2 email
   - Format: `http://localhost:3000/join?token=<token>`
2. Open link in browser (can use incognito mode to simulate new user)
3. **Expected**: Signup form pre-filled with context:
   - Message: "You've been invited by Test Parent One"
   - Email field pre-filled (if token includes email - optional)
4. Complete signup form:
   - Email: `test.parent2@example.com` (must match invitation)
   - Password: `TestPassword456`
   - First Name: `Test`
   - Last Name: `Parent Two`
5. Click "Accept Invitation & Create Account"
6. **Expected Result**:
   - Account created
   - User logged in automatically
   - Redirected to shared room with Parent 1
   - Welcome message: "You're now connected with Test Parent One"

**Verification**:
```sql
-- Check Parent 2 account created
SELECT id, username, email FROM users
WHERE email = 'test.parent2@example.com';

-- Check invitation was accepted
SELECT id, status, accepted_at, accepted_by FROM invitations
WHERE invitee_email = 'test.parent2@example.com';
-- Expected: status='accepted', accepted_at=NOW(), accepted_by=<parent2_id>

-- Check both parents in same room
SELECT rm.room_id, u.email, rm.role
FROM room_members rm
INNER JOIN users u ON rm.user_id = u.id
WHERE rm.room_id = (
  SELECT room_id FROM invitations
  WHERE invitee_email = 'test.parent2@example.com'
)
ORDER BY rm.joined_at;
-- Expected: 2 rows (parent1 and parent2 in same room)
```

**Pass Criteria**:
- ✅ Parent 2 account created
- ✅ Invitation status changed to 'accepted'
- ✅ Both parents are members of same room
- ✅ Both parents have role='member' (equal permissions)
- ✅ Parent 2 can see chat history (if any) in room

---

### Scenario 4: Shared Room Access

**Given**: Both co-parents have accepted connection
**When**: Either parent logs in and navigates to messages
**Then**: They see shared private chat room with both members

**Steps**:
1. **Test as Parent 1**:
   - Login: `test.parent1@example.com` / `TestPassword123`
   - Navigate to Messages/Chat page
   - **Expected**: Room shows "Test Parent One & Test Parent Two's Room"
   - Send test message: "Hello from Parent 1"

2. **Test as Parent 2** (separate browser/incognito):
   - Login: `test.parent2@example.com` / `TestPassword456`
   - Navigate to Messages/Chat page
   - **Expected**: Same room shown with Parent 1's message visible
   - Send test message: "Hello from Parent 2"

3. **Verify Real-Time Updates**:
   - Messages should appear instantly via Socket.io (no page refresh needed)

**Verification**:
```sql
-- Get room members
SELECT u.username, u.email, rm.role, rm.joined_at
FROM room_members rm
INNER JOIN users u ON rm.user_id = u.id
WHERE rm.room_id = (
  SELECT room_id FROM invitations
  WHERE invitee_email = 'test.parent2@example.com'
);

-- Get room messages
SELECT m.id, m.username, m.text, m.timestamp
FROM messages m
WHERE m.room_id = (
  SELECT room_id FROM invitations
  WHERE invitee_email = 'test.parent2@example.com'
)
ORDER BY m.timestamp DESC;
```

**Pass Criteria**:
- ✅ Both parents see same room
- ✅ Both parents can send messages
- ✅ Messages appear in real-time for both users
- ✅ Room name reflects both co-parents
- ✅ No "owner" vs "member" distinction (equal permissions)

---

### Scenario 5: Invitation to Existing User (In-App Notification)

**Given**: A user invites a co-parent who already has an account
**When**: Invitee logs into their existing account
**Then**: They see in-app notification with option to accept/decline

**Setup**:
```sql
-- Create Parent 3 account manually (existing user)
INSERT INTO users (username, email, password_hash, created_at)
VALUES ('testparent3', 'test.parent3@example.com',
  '<bcrypt-hash-of-TestPassword789>', NOW());
```

**Steps**:
1. Login as Parent 1: `test.parent1@example.com` / `TestPassword123`
2. Send invitation to existing user: `test.parent3@example.com`
   - (Use invitation form or API call)
3. **Expected**: Success message shown (same as new user invitation)
4. Logout Parent 1
5. Login as Parent 3: `test.parent3@example.com` / `TestPassword789`
6. **Expected**: Notification bell shows unread notification (red badge)
7. Click notification bell
8. **Expected Notification**:
   - Type: "Invitation Received"
   - Message: "Test Parent One wants to connect with you"
   - Buttons: [Accept] [Decline]
9. Click [Accept] button
10. **Expected Result**:
    - Notification marked as read
    - Redirected to shared room with Parent 1
    - Success message: "You're now connected with Test Parent One"

**Verification**:
```sql
-- Check in-app notification was created (NOT email)
SELECT id, user_id, type, message, is_read, data
FROM in_app_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test.parent3@example.com')
ORDER BY created_at DESC
LIMIT 1;
-- Expected: type='invitation_received', is_read=FALSE

-- After acceptance, check notification marked as read
SELECT id, is_read, read_at FROM in_app_notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'test.parent3@example.com');
-- Expected: is_read=TRUE, read_at=NOW()

-- Check no email was sent (only in-app notification)
-- Verify logs show "Existing user - in-app notification sent" NOT "Email sent"
```

**Pass Criteria**:
- ✅ In-app notification created (NOT email)
- ✅ Notification badge shows unread count
- ✅ Notification panel displays invitation
- ✅ Accept button works correctly
- ✅ Room connection established
- ✅ Notification marked as read after acceptance

---

### Scenario 6: Expired Invitation

**Given**: An invitation was sent 8 days ago (past 7-day expiration)
**When**: Co-parent tries to use the link
**Then**: Error message shown: "Invitation expired, request new one"

**Setup**:
```sql
-- Manually create expired invitation (backdated expires_at)
INSERT INTO invitations (inviter_id, invitee_email, token_hash, room_id, status, expires_at, created_at)
VALUES (
  (SELECT id FROM users WHERE email = 'test.parent1@example.com'),
  'test.expired@example.com',
  '<some-token-hash>',
  (SELECT id FROM rooms WHERE created_by = (SELECT id FROM users WHERE email = 'test.parent1@example.com')),
  'pending',
  NOW() - INTERVAL '1 day',  -- Expired yesterday
  NOW() - INTERVAL '8 days'  -- Created 8 days ago
);
```

**Steps**:
1. Construct invitation URL with expired token:
   - `http://localhost:3000/join?token=<expired-token>`
2. Open URL in browser
3. **Expected Result**:
   - Error page shown
   - Message: "This invitation has expired"
   - Sub-message: "Invitations are valid for 7 days. Please ask your co-parent to send a new invitation."
   - Button: "Request New Invitation" (optional)
4. Try to create account with expired token
   - Click "Accept Invitation & Create Account"
   - **Expected**: Error message: "Invalid or expired invitation code"

**Verification**:
```bash
# Test API endpoint with expired token
curl -X GET http://localhost:8080/api/invitations/<expired-token>

# Expected response (400 Bad Request):
# {"error": "Invalid or expired invitation code", "code": "INVALID_TOKEN"}

# Test POST with expired token
curl -X POST http://localhost:8080/api/invitations/<expired-token>/accept \
  -H "Content-Type: application/json" \
  -d '{"email": "test.expired@example.com", "password": "Password123"}'

# Expected response (400 Bad Request):
# {"error": "Invalid or expired invitation code", "code": "INVALID_TOKEN"}
```

**Cron Job Test** (daily cleanup):
```sql
-- Run manual cleanup (simulate cron job)
UPDATE invitations
SET status = 'expired'
WHERE status = 'pending'
AND expires_at < NOW();

-- Verify expired invitation status updated
SELECT id, status, expires_at FROM invitations
WHERE invitee_email = 'test.expired@example.com';
-- Expected: status='expired'
```

**Pass Criteria**:
- ✅ Expired token validation fails
- ✅ Clear error message displayed
- ✅ User cannot create account with expired token
- ✅ Cron job updates status to 'expired'
- ✅ Audit trail preserved (invitation not deleted)

---

## Edge Case Testing

### Edge Case 1: Self-Invitation Prevention

**Test**: User tries to invite themselves

**Steps**:
1. Login as Parent 1
2. Try to send invitation to own email: `test.parent1@example.com`
3. **Expected**: Error message: "You cannot invite yourself"

**API Test**:
```bash
curl -X POST http://localhost:8080/api/invitations/send \
  -H "Authorization: Bearer <parent1-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "test.parent1@example.com"}'

# Expected: 400 Bad Request
# {"error": "You cannot invite yourself", "code": "SELF_INVITE"}
```

---

### Edge Case 2: Duplicate Invitation Handling

**Test**: User sends multiple invitations to same email

**Steps**:
1. Login as Parent 1
2. Send invitation to `test.duplicate@example.com`
3. Immediately send another invitation to same email
4. **Expected**:
   - Success message both times (security - don't reveal if user exists)
   - Only one invitation created in database (or second one updates first)

**Verification**:
```sql
-- Check only one pending invitation exists
SELECT COUNT(*) FROM invitations
WHERE invitee_email = 'test.duplicate@example.com'
AND status = 'pending';
-- Expected: 1 (not 2)
```

---

### Edge Case 3: Invalid Email Format

**Test**: User enters invalid email format

**Steps**:
1. Try to register with invalid email: `not-an-email`
2. **Expected**: Frontend validation error: "Invalid email format"
3. Try to send invitation to invalid email: `also-not-an-email`
4. **Expected**: Error message before API call

**API Test** (if frontend validation bypassed):
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "password": "Password123", "firstName": "Test", "coParentEmail": "test@example.com"}'

# Expected: 400 Bad Request
# {"error": "Invalid email format", "code": "INVALID_EMAIL"}
```

---

### Edge Case 4: Weak Password Rejection

**Test**: User tries to create account with weak password

**Steps**:
1. Try passwords that don't meet requirements:
   - `short` (too short)
   - `alllowercase123` (no uppercase)
   - `ALLUPPERCASE` (no number)
2. **Expected**: Error for each:
   - "Password must be at least 8 characters"
   - "Password must contain at least 1 uppercase letter"
   - "Password must contain at least 1 number"

---

### Edge Case 5: Rate Limiting

**Test**: User sends too many invitations

**Steps**:
1. Login as Parent 1
2. Send 6 invitations rapidly (one per second)
3. **Expected**: First 5 succeed, 6th fails
4. Error message: "Too many invitations sent. Please try again later."

**API Test**:
```bash
# Send 6 invitations in a loop
for i in {1..6}; do
  curl -X POST http://localhost:8080/api/invitations/send \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\"}"
  echo ""
  sleep 0.5
done

# Expected: First 5 return 200, 6th returns 429 (Too Many Requests)
```

---

## Performance Testing

### Test 1: Account Creation Speed (NFR-004)

**Requirement**: Account creation must complete within 3 seconds

**Test**:
```bash
# Measure API response time
time curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "perf.test@example.com", "password": "Password123", "firstName": "Perf", "coParentEmail": "other@example.com"}'

# Expected: Total time < 3 seconds
```

---

### Test 2: Email Delivery Time (NFR-005)

**Requirement**: Invitation email delivered within 5 minutes

**Test**:
1. Send invitation at T0
2. Check email inbox (or email service logs)
3. Record delivery time
4. **Expected**: Email delivered within 5 minutes (typically <30 seconds)

---

### Test 3: Token Validation Performance

**Requirement**: <200ms p95 latency

**Test**:
```bash
# Test token validation speed (100 requests)
for i in {1..100}; do
  time curl -s -X GET http://localhost:8080/api/invitations/<valid-token> > /dev/null
done | grep real | sort -n

# Check p95 (95th percentile) is < 200ms
```

---

## Accessibility Testing (NFR-008)

### Screen Reader Test

**Steps**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate signup form using keyboard only (Tab key)
3. **Expected**:
   - All form fields have proper labels
   - Error messages are announced
   - Success messages are announced
   - Submit button is reachable via keyboard

**WCAG 2.1 AA Requirements**:
- ✅ Color contrast ≥ 4.5:1 for text
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicators visible
- ✅ Form labels associated with inputs
- ✅ Error messages descriptive

---

## Browser Compatibility

Test in all major browsers:
- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

Test on mobile devices:
- ✅ iOS Safari (iPhone)
- ✅ Chrome Mobile (Android)

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test users and related data (CASCADE will handle related records)
DELETE FROM users WHERE email LIKE 'test.%@example.com';
DELETE FROM users WHERE email LIKE 'perf.%@example.com';

-- Verify cleanup
SELECT COUNT(*) FROM users WHERE email LIKE 'test%';
-- Expected: 0
```

---

## Test Summary Checklist

### Acceptance Scenarios
- [ ] Scenario 1: New User Account Creation
- [ ] Scenario 2: Co-Parent Invitation (Email)
- [ ] Scenario 3: Co-Parent Accepts Invitation
- [ ] Scenario 4: Shared Room Access
- [ ] Scenario 5: Invitation to Existing User (In-App)
- [ ] Scenario 6: Expired Invitation

### Edge Cases
- [ ] Self-invitation prevention
- [ ] Duplicate invitation handling
- [ ] Invalid email format rejection
- [ ] Weak password rejection
- [ ] Rate limiting enforcement

### Performance
- [ ] Account creation < 3 seconds
- [ ] Email delivery < 5 minutes
- [ ] Token validation < 200ms p95

### Accessibility
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] WCAG 2.1 AA compliance

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] iOS Safari
- [ ] Chrome Mobile

---

**Test Status**: Ready for execution (after implementation complete)
**Last Updated**: 2025-11-25
**Author**: planning-agent
