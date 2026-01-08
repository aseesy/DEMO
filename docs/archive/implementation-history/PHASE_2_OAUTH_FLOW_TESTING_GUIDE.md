# Phase 2 OAuth Flow Testing Guide

## Overview

This guide provides comprehensive testing procedures for the Google OAuth flow with all Phase 2 security features:
- PKCE (Proof Key for Code Exchange)
- State parameter validation (CSRF protection)
- ID token validation
- Email verification check
- Account linking
- returnTo parameter handling

---

## Prerequisites

1. **Environment Setup**:
   - `GOOGLE_CLIENT_ID` set in environment
   - `GOOGLE_CLIENT_SECRET` set in environment
   - `GOOGLE_REDIRECT_URI` set (or uses default)
   - `DATABASE_URL` set and migrations run

2. **Google OAuth Configuration**:
   - Google OAuth client configured in Google Cloud Console
   - Redirect URI matches `GOOGLE_REDIRECT_URI`
   - Client ID and Secret are valid

3. **Test Accounts**:
   - Google account with verified email
   - Google account with unverified email (for testing)
   - Existing email account in system (for account linking test)

---

## Testing Checklist

### Phase 1: Basic OAuth Flow ✅

- [ ] **1.1**: OAuth initiation endpoint works
- [ ] **1.2**: Authorization URL generated correctly
- [ ] **1.3**: PKCE code challenge included in URL
- [ ] **1.4**: State parameter included in URL
- [ ] **1.5**: User redirected to Google
- [ ] **1.6**: User can grant permissions
- [ ] **1.7**: Callback received with code
- [ ] **1.8**: Successful login and token generation

### Phase 2: PKCE Validation 🔒

- [ ] **2.1**: Code verifier generated on client
- [ ] **2.2**: Code challenge sent to server
- [ ] **2.3**: Code challenge stored with state
- [ ] **2.4**: Code verifier sent on callback
- [ ] **2.5**: PKCE validation succeeds (correct verifier)
- [ ] **2.6**: PKCE validation fails (wrong verifier) - should reject
- [ ] **2.7**: PKCE validation fails (missing verifier) - should reject

### Phase 3: State Parameter Validation 🔒

- [ ] **3.1**: State parameter generated
- [ ] **3.2**: State parameter stored server-side
- [ ] **3.3**: State parameter sent to Google
- [ ] **3.4**: State parameter returned in callback
- [ ] **3.5**: State validation succeeds (correct state)
- [ ] **3.6**: State validation fails (wrong state) - should reject
- [ ] **3.7**: State validation fails (expired state) - should reject
- [ ] **3.8**: State is single-use (cannot reuse)

### Phase 4: ID Token Validation 🔒

- [ ] **4.1**: ID token received from Google
- [ ] **4.2**: ID token validated (issuer, audience, signature)
- [ ] **4.3**: ID token expiry checked
- [ ] **4.4**: User info extracted from ID token
- [ ] **4.5**: Invalid ID token rejected
- [ ] **4.6**: Expired ID token rejected

### Phase 5: Email Verification Check 🔒

- [ ] **5.1**: Verified email accepted
- [ ] **5.2**: Unverified email rejected (should return 403)
- [ ] **5.3**: Error message clear for unverified email

### Phase 6: Account Linking 🔗

- [ ] **6.1**: New user creation (no existing account)
- [ ] **6.2**: Link Google to existing email account
- [ ] **6.3**: Login with Google (existing linked account)
- [ ] **6.4**: auth_identity created correctly
- [ ] **6.5**: Multiple identities per user supported

### Phase 7: returnTo Parameter 🔄

- [ ] **7.1**: returnTo stored before OAuth
- [ ] **7.2**: returnTo passed through OAuth flow
- [ ] **7.3**: Redirect to returnTo after successful login
- [ ] **7.4**: Default redirect if no returnTo
- [ ] **7.5**: returnTo validated (same-origin only)

### Phase 8: Error Handling ⚠️

- [ ] **8.1**: Missing authorization code - error returned
- [ ] **8.2**: Invalid authorization code - error returned
- [ ] **8.3**: Expired authorization code - error returned
- [ ] **8.4**: Network errors handled gracefully
- [ ] **8.5**: User cancels OAuth - error handled
- [ ] **8.6**: Google API errors handled

---

## Step-by-Step Testing Procedures

### Test 1: Basic OAuth Flow with PKCE

**Objective**: Verify complete OAuth flow works end-to-end

**Steps**:
1. Navigate to login page
2. Click "Sign in with Google"
3. Verify browser console shows PKCE generation
4. Verify redirect to Google
5. Grant permissions
6. Verify callback received
7. Verify successful login

**Expected Results**:
- ✅ PKCE code challenge generated
- ✅ State parameter generated
- ✅ Authorization URL includes both
- ✅ Callback succeeds with valid code verifier
- ✅ User logged in
- ✅ Token received

**Console Checks**:
```javascript
// Client-side logs should show:
[useGoogleAuth] handleGoogleLogin called
[useGoogleAuth] PKCE generated
[useGoogleAuth] Making API call to /api/auth/google

// Server-side logs should show:
[OAuth] Authorization URL generated { hasState: true, hasCodeChallenge: true }
[OAuth] Callback received { hasCode: true, hasState: true, hasCodeVerifier: true }
[OAuth] PKCE validation succeeded
[OAuth] ID token validated
[OAuth] Authentication successful
```

---

### Test 2: PKCE Validation

**Objective**: Verify PKCE prevents authorization code interception

**Test 2A: Valid PKCE**
1. Start OAuth flow
2. Verify code verifier stored in sessionStorage
3. Complete OAuth flow
4. Verify PKCE validation succeeds

**Test 2B: Invalid PKCE (Manual Test)**
1. Start OAuth flow
2. Modify code_verifier before sending to callback
3. Attempt callback
4. **Expected**: Should reject with `INVALID_PKCE` error

**Test 2C: Missing PKCE**
1. Manually call callback endpoint without code_verifier
2. **Expected**: Should reject or allow (backwards compatibility)

**Database Check**:
```sql
-- After successful OAuth, verify session created
SELECT * FROM sessions WHERE user_id = <user_id> ORDER BY created_at DESC LIMIT 1;

-- Verify auth_identity created
SELECT * FROM auth_identities WHERE user_id = <user_id> AND provider = 'google';
```

---

### Test 3: State Parameter Validation

**Objective**: Verify CSRF protection works

**Test 3A: Valid State**
1. Start OAuth flow
2. Verify state stored server-side
3. Complete OAuth flow with same state
4. **Expected**: Should succeed

**Test 3B: Invalid State**
1. Start OAuth flow
2. Modify state parameter in callback
3. Attempt callback
4. **Expected**: Should reject with `INVALID_STATE` error

**Test 3C: Expired State**
1. Start OAuth flow
2. Wait > 10 minutes (state TTL)
3. Attempt callback
4. **Expected**: Should reject with `INVALID_STATE` error

**Test 3D: Reused State**
1. Complete successful OAuth flow
2. Attempt to use same state again
3. **Expected**: Should reject (state is single-use)

**Server-side Check**:
```javascript
// Check stateStore (in-memory)
// After callback, state should be removed
// Cannot reuse same state
```

---

### Test 4: ID Token Validation

**Objective**: Verify ID token is validated correctly

**Test 4A: Valid ID Token**
1. Complete OAuth flow
2. Verify server logs show ID token validation
3. **Expected**: Should extract user info from ID token

**Test 4B: Invalid ID Token (Manual Test)**
1. Mock invalid ID token in callback handler
2. **Expected**: Should reject with validation error

**Server-side Logs to Check**:
```javascript
[OAuth] ID token validated { sub: '...', email: '...', emailVerified: true }
```

**Code Location**: `chat-server/routes/auth/oauth.js:258`

---

### Test 5: Email Verification Check

**Objective**: Verify unverified emails are rejected

**Test 5A: Verified Email**
1. Use Google account with verified email
2. Complete OAuth flow
3. **Expected**: Should succeed

**Test 5B: Unverified Email**
1. Use Google account with unverified email
2. Attempt OAuth flow
3. **Expected**: Should reject with `EMAIL_NOT_VERIFIED` error (403)
4. **Expected**: Clear error message shown to user

**Error Check**:
```javascript
// Should return:
{
  error: 'Google email not verified. Please verify your email with Google before signing in.',
  code: 'EMAIL_NOT_VERIFIED'
}
```

**Code Location**: `chat-server/routes/auth/oauth.js:274-279`

---

### Test 6: Account Linking

**Objective**: Verify Google account links to existing email account

**Test 6A: New User**
1. Use Google account with email not in system
2. Complete OAuth flow
3. **Expected**: New user created
4. **Expected**: auth_identity created with provider='google'

**Test 6B: Link to Existing Email**
1. Create account with email: `test@example.com` (email/password)
2. Use Google account with same email: `test@example.com`
3. Complete OAuth flow
4. **Expected**: Google identity linked to existing user
5. **Expected**: No duplicate user created
6. **Expected**: User can login with either method

**Database Verification**:
```sql
-- Check user has multiple identities
SELECT u.id, u.email, ai.provider, ai.provider_subject
FROM users u
JOIN auth_identities ai ON u.id = ai.user_id
WHERE u.email = 'test@example.com';

-- Should show:
-- id | email              | provider      | provider_subject
-- 1  | test@example.com   | email_password| test@example.com
-- 1  | test@example.com   | google        | <google_sub>
```

**Test 6C: Login with Linked Account**
1. User with linked Google identity
2. Login with Google OAuth
3. **Expected**: Should use existing user account
4. **Expected**: No duplicate user created

---

### Test 7: returnTo Parameter

**Objective**: Verify returnTo URL is preserved through OAuth flow

**Test 7A: With returnTo**
1. Navigate to protected route: `/dashboard?tab=settings`
2. Get redirected to login (returnTo should be stored)
3. Click "Sign in with Google"
4. Complete OAuth flow
5. **Expected**: Should redirect to `/dashboard?tab=settings`

**Test 7B: Without returnTo**
1. Navigate directly to login page
2. Click "Sign in with Google"
3. Complete OAuth flow
4. **Expected**: Should redirect to default route (e.g., `/dashboard`)

**Test 7C: Invalid returnTo**
1. Attempt OAuth with returnTo to different origin: `https://evil.com`
2. **Expected**: Should reject or use default (same-origin validation)

**Code Location**: `chat-client-vite/src/features/auth/model/useGoogleAuth.js:50`

---

### Test 8: Error Handling

**Objective**: Verify error scenarios handled gracefully

**Test 8A: Missing Authorization Code**
1. Call callback endpoint without code
2. **Expected**: Should return 400 with `MISSING_CODE` error

**Test 8B: Invalid Authorization Code**
1. Use expired or invalid code
2. **Expected**: Should return error from Google token exchange

**Test 8C: User Cancels OAuth**
1. Start OAuth flow
2. Cancel at Google consent screen
3. **Expected**: Should handle error gracefully
4. **Expected**: User sees appropriate error message

**Test 8D: Network Errors**
1. Simulate network failure during token exchange
2. **Expected**: Should handle gracefully with retry or error message

**Error Response Format**:
```javascript
{
  error: 'Human-readable error message',
  code: 'ERROR_CODE',
  retryable: true/false
}
```

---

## Manual Testing Script

### Quick Test Script

```bash
# 1. Start server
cd chat-server
npm start

# 2. In browser console, check PKCE generation:
# Navigate to login page and open DevTools
# Look for: [useGoogleAuth] PKCE generated

# 3. After OAuth flow, check server logs:
# Look for: [OAuth] Authentication successful

# 4. Check database:
psql $DATABASE_URL
SELECT * FROM auth_identities WHERE provider = 'google' ORDER BY created_at DESC LIMIT 5;
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;
```

---

## Automated Testing (Future)

### Unit Tests to Write

1. **PKCE Tests**:
   - Generate and verify PKCE
   - Invalid code verifier rejection
   - Missing code verifier handling

2. **State Validation Tests**:
   - State generation and storage
   - State validation success
   - Invalid state rejection
   - Expired state rejection

3. **ID Token Validation Tests**:
   - Valid token acceptance
   - Invalid token rejection
   - Expired token rejection

4. **Email Verification Tests**:
   - Verified email acceptance
   - Unverified email rejection

### Integration Tests to Write

1. **Full OAuth Flow**:
   - Complete flow with PKCE
   - Account linking scenario
   - returnTo preservation

2. **Error Scenarios**:
   - Invalid code handling
   - Network error handling
   - User cancellation

---

## Troubleshooting

### Issue: PKCE Validation Fails

**Symptoms**: Callback returns `INVALID_PKCE` error

**Possible Causes**:
1. Code verifier not stored correctly in sessionStorage
2. Code verifier not sent to callback
3. Code challenge mismatch

**Debug Steps**:
```javascript
// Client-side: Check sessionStorage
sessionStorage.getItem('oauth_code_verifier')

// Server-side: Check stateStore
// Verify codeChallenge stored matches code verifier sent
```

### Issue: State Validation Fails

**Symptoms**: Callback returns `INVALID_STATE` error

**Possible Causes**:
1. State expired (>10 minutes)
2. State already used
3. State not stored server-side

**Debug Steps**:
- Check stateStore expiration
- Verify state is single-use
- Check state generation and storage

### Issue: Email Verification Check Fails

**Symptoms**: Verified email rejected

**Possible Causes**:
1. ID token missing `email_verified` claim
2. Validation logic error

**Debug Steps**:
```javascript
// Check ID token payload
const payload = await validateGoogleIdToken(idToken);
console.log('Email verified:', payload.email_verified);
```

### Issue: Account Not Linking

**Symptoms**: Duplicate users created instead of linking

**Possible Causes**:
1. Email mismatch (case sensitivity)
2. auth_identity not created
3. Lookup logic issue

**Debug Steps**:
```sql
-- Check if identity exists
SELECT * FROM auth_identities 
WHERE provider = 'google' 
AND provider_subject = '<google_sub>';

-- Check user lookup
SELECT * FROM users WHERE email = '<email>';
```

---

## Success Criteria

✅ **OAuth flow works end-to-end**
✅ **PKCE validation prevents code interception**
✅ **State validation prevents CSRF attacks**
✅ **ID tokens validated correctly**
✅ **Unverified emails rejected**
✅ **Account linking works correctly**
✅ **returnTo parameter preserved**
✅ **Errors handled gracefully**

---

## Next Steps

After OAuth flow testing:

1. ✅ Test refresh token endpoint
2. ✅ Write unit tests for OAuth security functions
3. ✅ Write integration tests for OAuth flow
4. ✅ Deploy to production (when ready)

---

*Testing Guide Created: 2026-01-06*

