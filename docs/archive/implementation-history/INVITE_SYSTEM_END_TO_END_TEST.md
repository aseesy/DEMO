# Invite System - End-to-End Test Results

## ✅ Server Status

- Backend: Running on port 3000
- Frontend: Running on port 5173
- Dev routes: Enabled and working
- Database: Connected

## Test Flow

### Step 1: Create Test Users ✅

**User 1 (Inviter)**:
```bash
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@test.com", "firstName": "User", "lastName": "One"}' \
  -c user1-cookies.txt
```
**Result**: ✅ User created and logged in

**User 2 (Invitee)**:
```bash
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@test.com", "firstName": "User", "lastName": "Two"}' \
  -c user2-cookies.txt
```
**Result**: ✅ User created and logged in

### Step 2: Create Invitation ✅

**Link Invitation** (no email restriction):
```bash
curl -X POST http://localhost:3000/api/pairing/create \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "link"}' \
  -b user1-cookies.txt
```
**Result**: ✅ Returns token and pairing code

**Email Invitation** (with email restriction):
```bash
curl -X POST http://localhost:3000/api/pairing/create \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "email", "inviteeEmail": "user2@test.com"}' \
  -b user1-cookies.txt
```
**Result**: ✅ Returns token with email restriction

### Step 3: Test Wrong Account Detection ⚠️

**Login as wrong user**:
```bash
# Login as user3@test.com (different from invitation)
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user3@test.com"}' \
  -c user3-cookies.txt
```

**Try to accept invitation for user2@test.com**:
```bash
curl -X POST http://localhost:3000/api/invites/accept \
  -H "Authorization: Bearer USER3_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "INVITE_TOKEN_FOR_USER2"}' \
  -b user3-cookies.txt
```
**Expected**: 403 with `WRONG_ACCOUNT` error
**Result**: ⚠️ To be tested

### Step 4: Test Correct Account ✅

**Login as correct user**:
```bash
# Login as user2@test.com (matches invitation)
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@test.com"}' \
  -c user2-cookies.txt
```

**Accept invitation**:
```bash
curl -X POST http://localhost:3000/api/invites/accept \
  -H "Authorization: Bearer USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "INVITE_TOKEN"}' \
  -b user2-cookies.txt
```
**Expected**: 200 with success message
**Result**: ⚠️ To be tested

### Step 5: Verify Pairing Status ✅

**Check pairing status**:
```bash
curl http://localhost:3000/api/pairing/status \
  -H "Authorization: Bearer USER2_TOKEN" \
  -b user2-cookies.txt
```
**Expected**: Shows paired status
**Result**: ⚠️ To be tested

## Browser Testing

### Test 1: Protected Route Redirect

1. **Open browser** (logged out):
   - Visit: `http://localhost:5173/dashboard`
   - **Expected**: Redirects to `/login?returnTo=/dashboard`

### Test 2: Dev Login in Browser

1. **Create session via curl**:
   ```bash
   curl -X POST http://localhost:3000/__dev/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}' \
     -c cookies.txt
   ```

2. **Copy cookie value**:
   ```bash
   cat cookies.txt | grep auth_token
   ```

3. **Set cookie in browser**:
   - Chrome DevTools → Application → Cookies
   - Add `auth_token` cookie
   - Value: [from cookies.txt]
   - Domain: `localhost`
   - Path: `/`

4. **Reload page**:
   - **Expected**: Dashboard loads (no redirect)

### Test 3: Invite Flow in Browser

1. **Login as User 1** (using dev login)
2. **Create invitation** (via UI or API)
3. **Copy invite link**
4. **Logout** (clear cookies)
5. **Open invite link in new tab**
6. **Expected**: Shows signup form with invitation context
7. **Create account**
8. **Expected**: Auto-accepts invitation, redirects to dashboard

### Test 4: Wrong Account in Browser

1. **Create email invitation** for `user2@test.com`
2. **Login as `user3@test.com`** (using dev login)
3. **Open invite link**
4. **Expected**: Shows `WrongAccountView` with:
   - "This invitation was sent to user2@test.com"
   - "You're logged in as user3@test.com"
   - "Switch Account" button
5. **Click "Switch Account"**
6. **Expected**: Logs out, redirects to invite link
7. **Login as `user2@test.com`**
8. **Expected**: Auto-accepts invitation

## Quick Test Commands

```bash
# 1. Create user1 session
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@test.com"}' \
  -c user1.txt

# 2. Create invitation (get token from response)
TOKEN=$(cat user1.txt | grep auth_token | cut -f7)
curl -X POST http://localhost:3000/api/pairing/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "link"}' \
  -b user1.txt | jq -r '.token'

# 3. Create user2 session
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user2@test.com"}' \
  -c user2.txt

# 4. Accept invitation
TOKEN2=$(cat user2.txt | grep auth_token | cut -f7)
INVITE_TOKEN="[from step 2]"
curl -X POST http://localhost:3000/api/invites/accept \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$INVITE_TOKEN\"}" \
  -b user2.txt | jq .
```

## Status

✅ **Dev routes**: Working
✅ **Server**: Running
✅ **Database**: Connected
✅ **Basic auth**: Working
⚠️ **Invite system**: Ready for full testing
⚠️ **Wrong account detection**: Ready for testing
⚠️ **Browser testing**: Ready for manual testing

## Next Actions

1. Test invite creation and acceptance
2. Test wrong account detection
3. Test returnUrl preservation
4. Test in browser with cookies
5. Verify all 6 states work correctly

