# Signup Flow Specification

**Status:** FINAL - This document defines the complete, tested signup flow. All implementations must conform to this specification.

**Last Updated:** 2026-01-07

## Overview

This document defines the complete user signup flow from initial form submission through account creation and post-signup navigation. This is the **single source of truth** for signup behavior.

## Flow Diagram

```
User fills signup form
    ↓
Frontend validation (validators.js)
    ↓
API call to /api/auth/signup
    ↓
Backend validation (signupValidation.js)
    ↓
Rate limiting & spam protection
    ↓
User creation (auth/registration.js → auth/user.js)
    ↓
Token generation & cookie setting
    ↓
Response with user + token
    ↓
Frontend auth state update (AuthContext)
    ↓
Redirect to /invite-coparent
```

## 1. Frontend: Signup Form

**Location:** `chat-client-vite/src/features/auth/components/LoginSignup.jsx`

### Form Fields

1. **First Name** (required)
   - Type: text
   - Auto-complete: `given-name`
   - Validation: Must not be empty after trim

2. **Last Name** (required)
   - Type: text
   - Auto-complete: `family-name`
   - Validation: Must not be empty after trim

3. **Email** (required)
   - Type: email
   - Auto-complete: `off` (security)
   - Validation: Must be valid email format

4. **Password** (required)
   - Type: password
   - Auto-complete: `off` (security)
   - Helper text: "At least 10 characters"
   - Validation: See password requirements below

5. **Honeypot Field** (hidden)
   - Name: `website`
   - Position: Off-screen (spam protection)

### Client-Side Validation

**Location:** `chat-client-vite/src/utils/validators.js`

**Function:** `validateSignupCredentials(email, password, firstName, lastName)`

**Rules:**
- Email: Required, must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password: Required, minimum 10 characters
- First Name: Required, must not be empty after trim
- Last Name: Required, must not be empty after trim

**Returns:**
```javascript
{
  valid: boolean,
  errors: { email?: string, password?: string, firstName?: string, lastName?: string },
  cleanData: { email: string, password: string, firstName: string, lastName: string }
}
```

### Form Submission

**Handler:** `handleSignup` from `useAuth` hook

**Process:**
1. Extract honeypot value from form
2. Call `authContext.signup(email, password, firstName, lastName)`
3. Set `isNewSignup` flag to `true` for redirect logic
4. Handle success/error responses

## 2. API Request

**Endpoint:** `POST /api/auth/signup`

**Location:** `chat-server/routes/auth/signup.js`

### Request Body

```json
{
  "email": "user@example.com",
  "password": "userpassword123",
  "firstName": "John",
  "lastName": "Doe",
  "context": {},
  "website": ""  // Honeypot field
}
```

### Middleware Chain

1. **Rate Limiting** (`signupRateLimit`)
   - Prevents brute force attacks
   - Location: `chat-server/routes/auth/utils.js`

2. **Honeypot Check** (`honeypotCheck('website')`)
   - Rejects requests with filled honeypot field
   - Location: `chat-server/middleware/spamProtection.js`

3. **Disposable Email Rejection** (`rejectDisposableEmail`)
   - Blocks known disposable email providers
   - Location: `chat-server/middleware/spamProtection.js`

## 3. Backend Validation

**Location:** `chat-server/routes/auth/signupValidation.js`

**Function:** `validateSignupInput(body)`

### Validation Rules

1. **Email**
   - Required
   - Must be valid format (uses `isValidEmail` from utils)
   - Normalized to lowercase and trimmed

2. **Password**
   - Required
   - Validated using `getPasswordError` from `libs/password-validator.js`
   - Minimum 10 characters
   - Maximum 128 characters
   - Must not be in blocked passwords list
   - No complexity requirements (NIST SP 800-63B compliant)

3. **First Name**
   - Required
   - Trimmed (empty string if missing)

4. **Last Name**
   - Required
   - Trimmed (empty string if missing)

### Password Requirements

**Location:** `chat-server/libs/password-validator.js`

- **Minimum Length:** 10 characters
- **Maximum Length:** 128 characters
- **Blocked Passwords:** Common passwords from breach databases (see `BLOCKED_PASSWORDS` set)
- **No Complexity Requirements:** No forced uppercase, numbers, or special characters

### Validation Response

**On Failure:**
```json
{
  "error": "Error message",
  "requirements": "At least 10 characters"  // For password errors
}
```

**Status Codes:**
- `400` - Validation errors (missing fields, invalid format, weak password)

## 4. User Creation

**Location:** `chat-server/auth/registration.js` → `chat-server/auth/user.js`

### Process

1. **Check Email Exists**
   - Query `users` table for existing email (case-insensitive)
   - If exists, throw `EMAIL_EXISTS` error

2. **Hash Password**
   - Use `hashPassword` from `auth/utils.js`
   - Returns bcrypt hash

3. **Create User Record**
   - Insert into `users` table:
     - `email` (lowercase, trimmed)
     - `password_hash` (bcrypt hash)
     - `first_name`
     - `last_name`
     - `display_name` (derived from firstName/lastName or email)
     - `created_at` (ISO timestamp)
   - Returns `userId`

4. **Setup User Context & Room**
   - Create `user_context` record
   - Create private room for user
   - Location: `auth/user.js` → `setupUserContextAndRoom`

5. **Create Welcome Tasks**
   - Generate onboarding tasks
   - Location: `auth/tasks.js` → `createWelcomeAndOnboardingTasks`

6. **Assign Default Role**
   - Assign 'user' role via RBAC system
   - Non-fatal if fails (logged as warning)

7. **Create Neo4j Node**
   - Create user node in Neo4j graph
   - Non-blocking (fire-and-forget)

### Error Handling

**Email Already Exists:**
- Error Code: `REG_001`
- Message: "Email already exists"
- Status: `409 Conflict`

**Database Connection Errors:**
- Uses centralized error classifier
- Returns appropriate status code and message

## 5. Token Generation & Response

**Location:** `chat-server/routes/auth/signup.js` (lines 67-72)

### Token Generation

1. Generate JWT token using `generateToken(user)`
   - Location: `chat-server/middleware/auth.js`
   - Payload includes: `userId`, `email`, `iat`, `exp`

2. Set HTTP-only cookie using `setAuthCookie(res, token)`
   - Cookie name: `auth_token`
   - HttpOnly: true
   - Secure: true (production)
   - SameSite: 'strict'

### Response

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "room": {
      "roomId": 456,
      "name": "John Doe's Room"
    },
    "context": { ... }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 6. Frontend: Auth State Update

**Location:** `chat-client-vite/src/context/AuthContext.jsx`

**Function:** `signup(email, password, firstName, lastName)`

### Process

1. **Set Loading State**
   - `setIsSigningUp(true)`
   - `setError(null)`

2. **Clean Input**
   - Email: trim and lowercase
   - Password: trim
   - Names: trim

3. **API Call**
   - POST to `/api/auth/signup`
   - Include honeypot field

4. **On Success:**
   - Extract `user` and `token` from response
   - Update auth state:
     - `setUsername(user.email)` (email is identifier, not username)
     - `setUserID(user.email)`
     - `setUserProperties(calculateUserProperties(user, true))`
     - `setEmail(cleanEmail)`
     - `setToken(token)`
     - Store in localStorage:
       - `CHAT_USER` → user object
       - `USER_EMAIL` → email
     - Update TokenManager (synchronously)
     - Set auth cookie via `authStorage.setToken(token)`
   - **FSM Transition:** `AUTHENTICATED`
   - `authStorage.setAuthenticated(true)`
   - `setAuthStatus(AuthStatus.AUTHENTICATED)`

5. **On Error:**
   - Extract error message using `getErrorMessage`
   - `setError(errorInfo.userMessage)`
   - Log error
   - Return `{ success: false, error: errorInfo }`

6. **Finally:**
   - `setIsSigningUp(false)`

## 7. Post-Signup Navigation

**Location:** `chat-client-vite/src/features/auth/model/useAuthRedirect.js`

### Redirect Logic

**Trigger:** User becomes authenticated AND `isNewSignup === true`

**Destination:** `/invite-coparent` (default for new signups)

**Process:**
1. Wait for `delay` (100ms for signup, 0ms for login)
2. Check for stored return URL (for deep linking)
   - If valid same-origin URL, use it
   - Otherwise use default path
3. Clear pending invite code (if `clearInviteCode === true`)
4. Navigate to destination (replace current history entry)

**Configuration:**
- `afterSignupPath`: `/invite-coparent`
- `afterLoginPath`: `/` (home)
- `delay`: 100ms (allows UI to update before redirect)
- `clearInviteCode`: `false` for new signups (they need it on invite page)

### Special Cases

**Invite Code Present:**
- If user has pending invite code during signup, redirect to `/accept-invite` instead
- Handled by `useInviteDetection` hook

**Already Authenticated:**
- If user is already authenticated when visiting signup page, redirect immediately
- No delay, no form submission

## 8. Error Handling

### Client-Side Errors

**Validation Errors:**
- Displayed inline on form fields
- Prevent form submission

**API Errors:**
- Displayed in `ErrorAlertBox` component
- User-friendly messages:
  - "Email already exists" → "This email is already registered. Would you like to sign in?"
  - "Invalid password" → Shows password requirements
  - "Network error" → "Connection failed. Please try again."

### Server-Side Errors

**400 Bad Request:**
- Validation failures
- Missing required fields
- Invalid email format
- Weak password

**409 Conflict:**
- Email already exists
- Error code: `REG_001`

**429 Too Many Requests:**
- Rate limit exceeded
- User should wait before retrying

**500 Internal Server Error:**
- Database errors
- Unexpected server errors
- User sees generic error message

## 9. Data Flow Summary

### User Object Structure

```typescript
interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  room: {
    roomId: number;
    name: string;
  } | null;
  context: {
    // User context data
  };
}
```

### Storage Keys

- `CHAT_USER`: Complete user object
- `USER_EMAIL`: User's email address
- `auth_token`: JWT token (in cookie, not localStorage)
- `AUTHENTICATED`: Boolean flag (in authStorage)

## 10. Testing Checklist

### Unit Tests

- [ ] Frontend validation (`validators.js`)
- [ ] Backend validation (`signupValidation.js`)
- [ ] Password validation (`password-validator.js`)
- [ ] User creation (`auth/user.js`)

### Integration Tests

- [ ] Complete signup flow (form → API → database → response)
- [ ] Error handling (duplicate email, weak password, etc.)
- [ ] Token generation and cookie setting
- [ ] Auth state update in frontend
- [ ] Redirect after signup

### E2E Tests

- [ ] User can sign up with valid credentials
- [ ] User cannot sign up with existing email
- [ ] User cannot sign up with weak password
- [ ] User is redirected to `/invite-coparent` after signup
- [ ] User is authenticated after signup
- [ ] User can immediately use the app after signup

## 11. Known Issues & Fixes

### Issue: Cookie Not Set in Some Cases

**Status:** FIXED
- `setAuthCookie` is called in signup route (line 69)
- Cookie is set with proper security flags

### Issue: Inconsistent Validation

**Status:** FIXED
- Frontend and backend validation rules are now aligned
- Both require 10+ character passwords
- Both validate email format consistently

### Issue: Redirect Timing

**Status:** FIXED
- 100ms delay added for signup redirects
- Allows UI state to update before navigation

## 12. Future Enhancements

These are NOT part of the current specification but may be added later:

- Email verification before account activation
- Password strength meter in UI
- Social signup (Google OAuth) - partially implemented
- Two-factor authentication
- Account recovery flow

## 13. Related Documentation

- `docs/auth-flow.md` - General authentication flow
- `chat-server/routes/auth/README.md` - Auth routes documentation
- `chat-client-vite/src/features/auth/README.md` - Frontend auth documentation

---

**This specification is the single source of truth for signup behavior. All code must conform to this specification.**

