# Signup Flow - Complete Documentation

## Overview

When a user clicks "Create Account", here's the complete flow from frontend to backend and back.

## Frontend Flow

### 1. User Clicks "Create Account" Button

**Location**: `chat-client-vite/src/features/auth/components/LoginSignup.jsx`

**What Happens**:
- Form submission triggers `handleSubmit` (line 107)
- `isLoginMode` is `false` (signup mode)
- Sets `isNewSignup = true` (line 139)
- Calls `handleSignup(e, { website: honeypotValue })` (line 141)

### 2. handleSignup Hook

**Location**: `chat-client-vite/src/features/auth/model/useEmailAuth.js`

**What Happens**:
- Calls `commandSignup()` with form data (line 108)
- Sets `isSigningUp = true`
- Clears any previous errors

### 3. commandSignup API Call

**Location**: `chat-client-vite/src/utils/authQueries.js`

**What Happens**:
- Validates input (email, password, firstName, lastName)
- Makes POST request to `/api/auth/signup` (line 149)
- Includes honeypot field for spam protection
- Handles response and errors

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword123",
  "firstName": "John",
  "lastName": "Doe",
  "website": "" // Honeypot field
}
```

## Backend Flow

### 4. Signup Route Handler

**Location**: `chat-server/routes/auth/signup.js`

**Middleware Applied** (in order):
1. `signupRateLimit` - Rate limiting (prevents abuse)
2. `honeypotCheck('website')` - Spam protection
3. `rejectDisposableEmail` - Blocks disposable email addresses

**What Happens**:

#### Step 1: Input Validation
- Validates email format
- Validates password (min 10 characters, not in blocklist)
- Validates firstName and lastName are provided
- Returns 400 if validation fails

#### Step 2: Create User
- Calls `auth.createUserWithEmail()` (line 43)
- Passes: email, password, context, nameData

#### Step 3: Generate Token
- Creates JWT token with user info (line 68)
- Sets `auth_token` cookie (line 69)

#### Step 4: Return Success
- Returns `{ success: true, user, token }` (line 72)

### 5. createUserWithEmail Function

**Location**: `chat-server/auth/registration.js`

**What Happens**:

#### Step 1: Check Email Exists
- Queries database for existing email (line 32)
- Throws `EMAIL_EXISTS` error if found

#### Step 2: Hash Password
- Hashes password using bcrypt (line 37)

#### Step 3: Create User Record
- Calls `createUser()` function (line 41)

### 6. createUser Function

**Location**: `chat-server/auth/user.js`

**What Happens**:

#### Step 1: Prepare User Data
```javascript
{
  password_hash: hashedPassword,
  email: emailLower,
  created_at: now,
  first_name: firstName,
  last_name: lastName,
  display_name: firstName || emailLower,
  status: 'active' (default)
}
```

#### Step 2: Insert into Database
- Inserts into `users` table (line 131)
- Returns `userId`

#### Step 3: Setup User Context
- Calls `setupUserContextAndRoom()` (line 141)
  - Creates `user_context` record
  - **Note**: Private rooms are NO LONGER created during signup
  - Only shared rooms with co-parents are created (when accepting invitations)
  - Returns context data (room is null)

#### Step 4: Create Welcome Tasks
- Calls `createWelcomeAndOnboardingTasks()` (line 142)
  - Creates welcome task
  - Creates onboarding tasks
  - Sets up initial task list

#### Step 5: Assign Default Role
- Calls `permissionService.ensureDefaultRole()` (line 147)
  - Assigns 'user' role for RBAC
  - Non-fatal if fails (logs warning)

#### Step 6: Create Neo4j Node
- Calls `neo4jClient.createUserNode()` (line 159)
  - Creates user node in graph database
  - Non-fatal if fails (catches error)

#### Step 7: Return User Object
```javascript
{
  id: userId,
  email: emailLower,
  context: contextData,
  room: roomObject,
  firstName: firstName,
  lastName: lastName,
  displayName: displayName
}
```

## Post-Signup Flow

### 7. Frontend Receives Response

**Location**: `chat-client-vite/src/features/auth/model/useEmailAuth.js`

**What Happens**:
- If success: Calls `applyAuthSuccess()` (line 129)
  - Sets `isAuthenticated = true`
  - Stores user email in localStorage
  - Stores token in cookie (already set by backend)
- Sets `isSigningUp = false`
- Returns `{ success: true, user }`

### 8. Redirect After Signup

**Location**: `chat-client-vite/src/features/auth/model/useAuthRedirect.js`

**What Happens**:
- `useAuthRedirect` hook detects `isAuthenticated = true` and `isNewSignup = true`
- Waits 100ms delay (line 78)
- Checks for stored `returnUrl` (for deep linking)
- If no returnUrl: Redirects to `/invite-coparent` (default after signup)
- If returnUrl exists: Redirects to that URL

**Default Redirect Paths**:
- After signup: `/invite-coparent`
- After login: `/` (home)

## Database Operations

### Tables Modified

1. **users** table:
   - New row inserted with user data
   - Fields: id, email, password_hash, first_name, last_name, display_name, created_at, status

2. **user_context** table:
   - New row inserted with default context
   - Fields: user_email, co_parent, children, contacts, triggers

3. **rooms** table:
   - New private room created
   - Room name: User's display name
   - Room type: 'private'

4. **room_members** table:
   - New row linking user to their private room

5. **tasks** table:
   - Welcome task created
   - Onboarding tasks created

6. **user_roles** table (if RBAC enabled):
   - Default 'user' role assigned

7. **Neo4j**:
   - User node created in graph database

## Security Features

### 1. Rate Limiting
- Prevents brute force signup attempts
- Limits requests per IP/time window

### 2. Honeypot Protection
- Hidden "website" field in form
- Bots that fill it are rejected
- Real users never see it

### 3. Disposable Email Blocking
- Blocks known disposable email providers
- Prevents spam accounts

### 4. Password Validation
- Minimum 10 characters
- Blocks common passwords
- No complexity requirements (NIST guidelines)

### 5. Email Uniqueness
- Database constraint ensures unique emails
- Race condition handling for concurrent signups

### 6. Password Hashing
- Bcrypt with 12 rounds
- Never stored in plain text

## Error Handling

### Frontend Errors

**Validation Errors**:
- Email format invalid → Shows error message
- Password too weak → Shows requirements
- Missing fields → Shows field-specific errors

**API Errors**:
- Email already exists → Shows "Email already registered" with sign-in link
- Network error → Shows connection error message
- Server error → Shows generic error message

### Backend Errors

**400 Bad Request**:
- Invalid input validation
- Missing required fields
- Invalid email format

**409 Conflict**:
- Email already exists
- Returns `{ error: 'Email already exists', code: 'REG_001' }`

**429 Too Many Requests**:
- Rate limit exceeded
- Returns rate limit error

**500 Internal Server Error**:
- Database connection issues
- Unexpected errors
- Returns generic error (doesn't expose details)

## Success Response

### Backend Response
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "context": { ... },
    "room": { ... }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Frontend State After Success
- `isAuthenticated = true`
- `user` object stored
- `auth_token` cookie set
- Redirects to `/invite-coparent` (or returnUrl)

## What Gets Created

### 1. User Account
- ✅ User record in `users` table
- ✅ Email stored (lowercase, normalized)
- ✅ Password hashed and stored
- ✅ Name fields stored
- ✅ Status set to 'active'
- ✅ Created timestamp set

### 2. User Context
- ✅ Default context record created
- ✅ Empty co-parent info
- ✅ Empty children array
- ✅ Empty contacts array

### 3. Private Room
- ❌ **NOT created during signup** (removed in recent update)
- ✅ Only shared rooms created when accepting invitations
- ✅ Users communicate through shared co-parent rooms

### 4. Welcome Tasks
- ✅ Welcome task created
- ✅ Onboarding tasks created
- ✅ Tasks assigned to user

### 5. Permissions
- ✅ Default 'user' role assigned
- ✅ RBAC permissions set

### 6. Graph Database
- ✅ User node created in Neo4j
- ✅ Ready for relationship tracking

## Missing Features (From Reliability Review)

### ⚠️ Email Verification
**Current**: Email verification exists but not enforced
**Impact**: Unverified accounts can access full features
**Fix Needed**: Require verification before full access

### ⚠️ Welcome Email
**Current**: No welcome email sent
**Impact**: Users may not know account was created
**Fix Needed**: Send welcome email after signup

### ⚠️ Account Status
**Current**: Status defaults to 'active'
**Impact**: No way to require verification before activation
**Fix Needed**: Set status to 'pending_verification' initially

## Flow Diagram

```
User clicks "Create Account"
    ↓
Frontend: handleSubmit()
    ↓
Frontend: handleSignup()
    ↓
Frontend: commandSignup()
    ↓
API: POST /api/auth/signup
    ↓
Backend: Rate limit check
    ↓
Backend: Honeypot check
    ↓
Backend: Disposable email check
    ↓
Backend: Input validation
    ↓
Backend: createUserWithEmail()
    ↓
Backend: Check email exists
    ↓
Backend: Hash password
    ↓
Backend: createUser()
    ↓
Database: Insert into users
    ↓
Database: setupUserContextAndRoom()
    ↓
Database: Create user_context
    ↓
Database: createWelcomeAndOnboardingTasks()
    ↓
Database: Assign default role
    ↓
Neo4j: Create user node
    ↓
Backend: Generate JWT token
    ↓
Backend: Set auth_token cookie
    ↓
Backend: Return { success: true, user, token }
    ↓
Frontend: applyAuthSuccess()
    ↓
Frontend: Set isAuthenticated = true
    ↓
Frontend: useAuthRedirect()
    ↓
Frontend: Redirect to /invite-coparent
    ↓
User sees invite coparent page
```

## Summary

**When a user clicks "Create Account"**:

1. ✅ Form validates input
2. ✅ API request sent to `/api/auth/signup`
3. ✅ Backend validates and creates user
4. ✅ Database records created (user, context, room, tasks)
5. ✅ JWT token generated and cookie set
6. ✅ User authenticated in frontend
7. ✅ Redirects to `/invite-coparent` page

**Total Time**: ~500ms - 2 seconds (depending on database speed)

**What User Sees**:
- Loading state while processing
- Success → Redirect to invite coparent page
- Error → Error message displayed on form

