# Invite System - Manual Testing Checklist

## Prerequisites

1. Two test accounts (or ability to create accounts)
2. Access to email for invitee account
3. Database access to check pairing_sessions table

## Test Scenarios

### State 1: Not Logged In + No Account

**Steps**:
1. Log out (if logged in)
2. Click invite link: `https://app.coparentliaizen.com/accept-invite?token=TOKEN`
3. Verify signup form is shown
4. Verify invitation context is displayed ("You've been invited to join...")
5. Fill out signup form
6. Submit

**Expected**:
- Account is created
- Invitation is accepted automatically
- Redirected to `/` (dashboard)
- Pairing status is 'active' in database

**Database Check**:
```sql
SELECT status, parent_b_id, accepted_at, use_count
FROM pairing_sessions
WHERE invite_token = SHA256('TOKEN');
```

---

### State 2: Not Logged In + Already Has Account

**Steps**:
1. Log out
2. Click invite link
3. Verify login prompt is shown
4. Click "Log in to accept"
5. Log in with correct account
6. Verify redirect back to `/accept-invite?token=TOKEN`
7. Verify invitation is auto-accepted

**Expected**:
- After login, redirected to `/accept-invite?token=TOKEN`
- Invitation is accepted automatically
- Redirected to `/` (dashboard)

**Database Check**:
```sql
SELECT status, parent_b_id, accepted_at, use_count
FROM pairing_sessions
WHERE invite_token = SHA256('TOKEN');
```

---

### State 3: Logged In + Wrong Account

**Prerequisites**: Create invitation with `parent_b_email` set

**Steps**:
1. Log in as User A (email: usera@test.com)
2. Create invitation for User B (email: userb@test.com)
3. Log out
4. Log in as User C (email: userc@test.com)
5. Click invite link for User B
6. Verify error page is shown

**Expected**:
- Error message: "This invitation was sent to userb@test.com. You're logged in as userc@test.com."
- "Switch Account" button (logs out and redirects to invite link)
- "Cancel" button (redirects to dashboard)

**Database Check**:
```sql
SELECT parent_b_email, status
FROM pairing_sessions
WHERE invite_token = SHA256('TOKEN');
-- Should show parent_b_email = 'userb@test.com'
```

---

### State 4: Logged In + Correct Account

**Steps**:
1. Log in as User B (email: userb@test.com)
2. Click invite link for User B
3. Verify auto-acceptance

**Expected**:
- Invitation is accepted automatically
- Success message is shown
- Redirected to `/` (dashboard)

---

### State 5: Expired/Invalid Token

**Test 5a: Invalid Token**

**Steps**:
1. Click invite link with invalid token: `/accept-invite?token=INVALID`
2. Verify error page

**Expected**:
- Error: "Invalid invitation link"
- "Sign In" button (if not logged in)
- "Go Home" button (if logged in)

**Test 5b: Expired Token**

**Steps**:
1. Create invitation
2. Manually expire it in database:
   ```sql
   UPDATE pairing_sessions
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE invite_token = SHA256('TOKEN');
   ```
3. Click invite link
4. Verify error page

**Expected**:
- Error: "This invitation has expired"
- "Sign In" or "Go Home" button

**Test 5c: Revoked Token**

**Steps**:
1. Create invitation
2. Manually revoke it:
   ```sql
   UPDATE pairing_sessions
   SET revoked_at = NOW()
   WHERE invite_token = SHA256('TOKEN');
   ```
3. Click invite link
4. Verify error page

**Expected**:
- Error: "This invitation has been cancelled"
- "Sign In" or "Go Home" button

---

### State 6: Already Accepted Invite

**Steps**:
1. Accept an invitation (complete State 1 or 2)
2. Click the same invite link again
3. Verify error page

**Expected**:
- Error: "You've already accepted this invitation"
- "Go to Dashboard" button (if logged in)
- "Sign In" button (if not logged in)

**Database Check**:
```sql
SELECT status, use_count, max_uses
FROM pairing_sessions
WHERE invite_token = SHA256('TOKEN');
-- Should show status = 'active', use_count = 1
```

---

## ReturnUrl Testing

### Test ReturnUrl Preservation

**Steps**:
1. Log out
2. Click invite link: `/accept-invite?token=TOKEN`
3. Verify redirect to `/signin?returnUrl=/accept-invite?token=TOKEN`
4. Log in
5. Verify redirect back to `/accept-invite?token=TOKEN`
6. Verify invitation is accepted

**Expected**:
- Full URL (including token) is preserved through auth flow
- After login, user lands on accept-invite page
- Invitation is accepted

**Check sessionStorage**:
```javascript
// In browser console
localStorage.getItem('RETURN_URL')
// Should contain: /accept-invite?token=TOKEN
```

---

## API Testing

### Test POST /api/invites/accept

**Prerequisites**: Valid JWT token

**Test 1: Success**
```bash
curl -X POST "http://localhost:3000/api/invites/accept" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "VALID_TOKEN"}'
```

**Expected**: 200 OK with success response

**Test 2: Missing Token**
```bash
curl -X POST "http://localhost:3000/api/invites/accept" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request

**Test 3: Wrong Account**
```bash
# Log in as User A
# Try to accept invitation for User B
curl -X POST "http://localhost:3000/api/invites/accept" \
  -H "Authorization: Bearer USER_A_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_FOR_USER_B"}'
```

**Expected**: 403 Forbidden with WRONG_ACCOUNT code

**Test 4: Already Accepted**
```bash
# Accept invitation first, then try again
curl -X POST "http://localhost:3000/api/invites/accept" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "ALREADY_ACCEPTED_TOKEN"}'
```

**Expected**: 409 Conflict with ALREADY_ACCEPTED code

---

## Database Verification Queries

### Check Invitation Status
```sql
SELECT 
  id,
  status,
  parent_a_id,
  parent_b_id,
  parent_b_email,
  invite_type,
  created_at,
  expires_at,
  accepted_at,
  revoked_at,
  use_count,
  max_uses
FROM pairing_sessions
WHERE invite_token = SHA256('YOUR_TOKEN');
```

### Check Use Count
```sql
SELECT use_count, max_uses, status
FROM pairing_sessions
WHERE id = PAIRING_ID;
```

### Check Revoked Invitations
```sql
SELECT id, revoked_at, status
FROM pairing_sessions
WHERE revoked_at IS NOT NULL;
```

---

## Edge Cases

1. **Token with no email restriction**: Link invitation (parent_b_email is NULL)
   - Should allow any user to accept

2. **Token with email restriction**: Email invitation (parent_b_email is set)
   - Should only allow matching email

3. **Multiple uses**: Set `max_uses = 5` in database
   - Should allow up to 5 acceptances (if not single-use)

4. **Concurrent acceptance**: Two users try to accept same token simultaneously
   - Should only one succeed (database constraint)

---

## Performance Testing

1. **Validation Speed**: Measure time to validate token
   - Should be < 100ms

2. **Acceptance Speed**: Measure time to accept invitation
   - Should be < 500ms

3. **Database Load**: Check query performance
   - Indexes should be used for token lookups

---

## Security Testing

1. **Token Guessing**: Try random tokens
   - Should all fail with INVALID_TOKEN

2. **SQL Injection**: Try malicious tokens
   - Should be sanitized by parameterized queries

3. **Token Replay**: Try using same token twice
   - Should fail with ALREADY_ACCEPTED or MAX_USES_EXCEEDED

4. **Email Bypass**: Try accepting with wrong email
   - Should fail with WRONG_ACCOUNT

---

## Regression Testing

After implementation, verify:
1. Existing pairing flows still work
2. Code-based pairing still works
3. Email-based pairing still works
4. Link-based pairing still works
5. Mutual detection still works


