# Login Error Handling Test Scenarios

## Test Plan: Login Error Handling

This document outlines all test scenarios to verify login error handling is working correctly.

---

## Test Scenarios

### 1. Client-Side Validation

#### 1.1 Empty Email

- **Input**: Email: "", Password: "test123"
- **Expected**: Error: "Email is required" (or "Please enter a valid email address")
- **Status**: ✅ Handled by frontend validation

#### 1.2 Invalid Email Format

- **Input**: Email: "notanemail", Password: "test123"
- **Expected**: Error: "Please enter a valid email address"
- **Status**: ✅ Handled by frontend regex validation

#### 1.3 Empty Password

- **Input**: Email: "test@example.com", Password: ""
- **Expected**: Error: "Password is required" (or "Password must be at least 4 characters")
- **Status**: ✅ Handled by frontend validation

#### 1.4 Password Too Short

- **Input**: Email: "test@example.com", Password: "123"
- **Expected**: Error: "Password must be at least 4 characters"
- **Status**: ✅ Handled by frontend validation

---

### 2. Backend Validation Errors

#### 2.1 Missing Email (Backend Check)

- **Input**: Email: null/undefined, Password: "test123"
- **Expected**: 400 Bad Request - "Email and password are required"
- **Status**: ✅ Handled by backend

#### 2.2 Missing Password (Backend Check)

- **Input**: Email: "test@example.com", Password: null/undefined
- **Expected**: 400 Bad Request - "Email and password are required"
- **Status**: ✅ Handled by backend

#### 2.3 Invalid Email Format (Backend Check)

- **Input**: Email: "invalid", Password: "test123"
- **Expected**: 400 Bad Request - "Please enter a valid email address"
- **Status**: ✅ Handled by backend

---

### 3. Authentication Errors

#### 3.1 Account Not Found

- **Input**: Email: "nonexistent@example.com", Password: "anypassword"
- **Expected**:
  - Backend: 404 Not Found - "No account found with this email", code: "ACCOUNT_NOT_FOUND"
  - Frontend: Shows error with "Create account" button
- **Status**: ✅ Fixed - Backend now returns 404 with code

#### 3.2 Wrong Password

- **Input**: Email: "existing@example.com", Password: "wrongpassword"
- **Expected**:
  - Backend: 401 Unauthorized - "Incorrect password", code: "INVALID_PASSWORD"
  - Frontend: Shows "Incorrect password. Please try again."
- **Status**: ✅ Fixed - Backend now returns 401 with code

#### 3.3 OAuth-Only Account (No Password)

- **Input**: Email: "oauthuser@example.com", Password: "anypassword"
- **Expected**:
  - Backend: 403 Forbidden - "This account uses Google sign-in. Please sign in with Google.", code: "OAUTH_ONLY_ACCOUNT"
  - Frontend: Shows error with "Sign in with Google" button
- **Status**: ✅ Fixed - Backend now returns 403 with code

---

### 4. Network Errors

#### 4.1 Network Timeout

- **Scenario**: Network request times out
- **Expected**:
  - Retry logic attempts 3 times with exponential backoff
  - Shows "Connection problem" error with retry option
- **Status**: ✅ Handled by retry logic

#### 4.2 Network Disconnected

- **Scenario**: User loses internet connection
- **Expected**:
  - Error: "Unable to connect to server. Please try again."
  - Retry button available
- **Status**: ✅ Handled by error handler

#### 4.3 Server Unavailable (503)

- **Scenario**: Server returns 503 Service Unavailable
- **Expected**:
  - Retry logic attempts retry
  - Shows "Service temporarily unavailable"
- **Status**: ✅ Handled by retry logic

---

### 5. Server Errors

#### 5.1 Internal Server Error (500)

- **Scenario**: Backend throws unexpected error
- **Expected**:
  - 500 Internal Server Error
  - Error: "We encountered an unexpected error. Please try again in a moment."
  - Retry option available
- **Status**: ✅ Handled by error handler

#### 5.2 Database Connection Error

- **Scenario**: Database is unavailable
- **Expected**:
  - 500 Internal Server Error
  - Error: "Service temporarily unavailable"
  - Retry option available
- **Status**: ✅ Handled by error handler

---

### 6. Rate Limiting

#### 6.1 Too Many Requests (429)

- **Scenario**: User makes too many login attempts
- **Expected**:
  - 429 Too Many Requests
  - Error: "Too many requests. Please wait a moment and try again."
  - Retry logic will retry after delay
- **Status**: ✅ Handled by retry logic

---

### 7. Success Scenarios

#### 7.1 Valid Credentials

- **Input**: Email: "valid@example.com", Password: "correctpassword"
- **Expected**:
  - 200 OK
  - User authenticated
  - Redirected to dashboard
  - Token stored in localStorage
- **Status**: ✅ Working

#### 7.2 Login with Retry After Network Error

- **Scenario**: First attempt fails due to network, second succeeds
- **Expected**:
  - First attempt: Network error, retry
  - Second attempt: Success, user logged in
- **Status**: ✅ Handled by retry logic

---

## Error Message Verification

### Expected Error Messages by Scenario:

1. **Account Not Found**: "No account found with this email. Would you like to create an account?"
   - Action: "Create account" button

2. **Wrong Password**: "Incorrect password. Please try again."
   - No action button (user should retry)

3. **OAuth-Only Account**: "This account uses Google sign-in. Please sign in with Google."
   - Action: "Sign in with Google" button

4. **Network Error**: "Unable to connect to server. Please try again."
   - Retry logic automatically attempts

5. **Server Error**: "We encountered an unexpected error. Please try again in a moment."
   - Retry option available

6. **Rate Limit**: "Too many requests. Please wait a moment and try again."
   - Retry logic will retry after delay

---

## Implementation Status

### ✅ Completed:

- Client-side validation
- Backend validation
- Account not found (404) vs wrong password (401) distinction
- OAuth-only account detection (403)
- Network error handling with retry
- Server error handling
- Rate limiting handling
- Error messages with actionable buttons

### 🔍 To Test:

- Manual testing of each scenario
- Verify error messages display correctly
- Verify action buttons work
- Verify retry logic works
- Verify redirects work correctly

---

## Testing Checklist

- [ ] Test empty email
- [ ] Test invalid email format
- [ ] Test empty password
- [ ] Test password too short
- [ ] Test account not found (404)
- [ ] Test wrong password (401)
- [ ] Test OAuth-only account (403)
- [ ] Test network timeout
- [ ] Test network disconnected
- [ ] Test server error (500)
- [ ] Test rate limiting (429)
- [ ] Test successful login
- [ ] Test retry after network error
- [ ] Verify error messages are user-friendly
- [ ] Verify action buttons appear correctly
- [ ] Verify redirects work

---

_Test plan created: 2025-01-27_
