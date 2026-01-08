# Authentication Flow

**Global Truth** - This document describes the complete authentication lifecycle that spans frontend and backend.

## Overview

Authentication in LiaiZen follows a standard JWT-based flow with cookie storage and WebSocket token validation. This document describes the complete lifecycle from signup through WebSocket connection.

---

## Authentication Lifecycle

```
Signup/Login → Token Generation → Cookie Storage → API Requests → WebSocket Connection → Session Management
```

### Phase 1: Signup/Login

#### Signup Flow

1. **Frontend**: User submits signup form
   - Email, password, firstName, lastName
   - Honeypot field (spam protection)
   - Client-side validation

2. **API Request**: `POST /api/auth/signup`
   - Rate limiting (prevents abuse)
   - Honeypot check (blocks bots)
   - Disposable email check (blocks spam)
   - Input validation

3. **Backend**: User creation
   - Email uniqueness check
   - Password hashing (bcrypt, 12 rounds)
   - Insert into `users` table
   - Create `user_context` record
   - Create welcome & onboarding tasks
   - Assign default 'user' role (RBAC)
   - Create Neo4j user node

4. **Token Generation**: JWT token created
   - Payload: `{ userId, email, role }`
   - Expiration: 24 hours
   - Secret: `JWT_SECRET` environment variable

5. **Cookie Storage**: `auth_token` cookie set
   - HttpOnly: `true` (prevents XSS)
   - Secure: `true` (HTTPS only in production)
   - SameSite: `Lax` (CSRF protection)
   - Domain: configured in CORS settings

6. **Response**: `{ success: true, user, token }`
   - User object with profile info
   - Token for client storage (if needed)

7. **Frontend**: Authentication state updated
   - `isAuthenticated = true`
   - User stored in localStorage
   - Redirect to `/invite-coparent` (default after signup)

#### Login Flow

1. **Frontend**: User submits login form
   - Email, password
   - Client-side validation

2. **API Request**: `POST /api/auth/login`
   - Rate limiting (5 attempts/15min per IP)
   - Input validation

3. **Backend**: Credential verification
   - Find user by email
   - Verify password (bcrypt compare)
   - Check user status (active, suspended, deleted)

4. **Token Generation**: Same as signup
   - JWT token with user info
   - 24-hour expiration

5. **Cookie Storage**: Same as signup
   - HttpOnly cookie set

6. **Response**: `{ success: true, user, token }`

7. **Frontend**: Authentication state updated
   - `isAuthenticated = true`
   - User stored in localStorage
   - Redirect to `/` (default after login)

#### Google OAuth Flow

1. **Frontend**: User clicks "Sign in with Google"
   - Redirects to `/api/auth/oauth/google`

2. **Backend**: OAuth initiation
   - Generates OAuth state token
   - Redirects to Google OAuth consent screen

3. **Google**: User consents
   - Redirects to `/api/auth/google/callback?code=...`

4. **Backend**: OAuth callback
   - Exchanges code for access token
   - Fetches user profile from Google
   - Finds or creates user account
   - Creates JWT token
   - Sets `auth_token` cookie

5. **Response**: Redirect to frontend
   - Success: Redirects to `/` or `returnUrl`
   - Error: Redirects to `/login?error=...`

---

### Phase 2: Token Verification

#### API Request Authentication

All authenticated API requests require:

1. **Cookie**: `auth_token` cookie (preferred)
   - Automatically sent by browser
   - HttpOnly (secure from JavaScript)

2. **Header**: `Authorization: Bearer <token>` (fallback)
   - For non-browser clients
   - Mobile apps, API clients

#### Middleware Flow

```javascript
// Express middleware chain
verifyAuth(req, res, next) {
  1. Extract token from cookie or Authorization header
  2. Verify JWT signature
  3. Check token expiration
  4. Load user from database
  5. Attach user to request (req.user)
  6. Continue to route handler
}
```

#### Token Validation

- **Signature**: Verified against `JWT_SECRET`
- **Expiration**: Token must not be expired
- **User Status**: User must be `active` (not suspended/deleted)
- **User Exists**: User must exist in database

---

### Phase 3: WebSocket Authentication

#### Connection Flow

1. **Frontend**: Socket.io client connects
   - Passes token via query parameter or cookie
   - Example: `socket.connect({ auth: { token } })`

2. **Backend**: Socket.io middleware
   - `authMiddleware(socket, next)`
   - Extracts token from handshake
   - Verifies JWT token
   - Loads user from database
   - Attaches user to socket (`socket.user`)

3. **Connection Event**: Socket authenticated
   - `socket.user` guaranteed to exist
   - User can now receive/send events
   - Room subscriptions initialized

#### Socket Authentication Middleware

```javascript
// Socket.io middleware
io.use(authMiddleware);

// Connection event - user is authenticated
io.on('connection', socket => {
  // socket.user is guaranteed to exist
  // If not, middleware would have rejected connection
});
```

---

### Phase 4: Session Management

#### Token Refresh

- **Expiration**: 24 hours
- **Refresh Strategy**: Re-login required (no automatic refresh)
- **Expiration Handling**: Frontend redirects to login when token expires

#### Session Termination

- **Logout**: `POST /api/auth/logout`
  - Clears `auth_token` cookie
  - Invalidates session on server (if session store used)

- **Token Revocation**: Not implemented (stateless JWT)
  - Consider Redis blacklist for future implementation

#### Concurrent Sessions

- **Allowed**: Users can have multiple active sessions
- **Devices**: Mobile, desktop, tablet all supported
- **Security**: Each device gets its own token

---

## Invariants

### Authentication Invariants

1. **Token Validity**
   - Token must be signed with `JWT_SECRET`
   - Token must not be expired
   - User must exist in database
   - User status must be `active`

2. **User Creation**
   - Email must be unique
   - Password must be hashed (never plain text)
   - Default role `'user'` must be assigned
   - User context must be created

3. **Cookie Security**
   - HttpOnly: `true` (prevents XSS)
   - Secure: `true` in production (HTTPS only)
   - SameSite: `Lax` (CSRF protection)

4. **WebSocket Connection**
   - Socket must be authenticated before `connection` event
   - `socket.user` must exist on authenticated sockets
   - Invalid tokens cause connection rejection

---

## Failure Modes

### Signup Failures

| Error | Cause | Response | UX Message |
|-------|-------|----------|------------|
| `EMAIL_EXISTS` | Email already registered | 409 Conflict | "Email already registered. Please sign in." |
| `INVALID_EMAIL` | Email format invalid | 400 Bad Request | "Please enter a valid email address." |
| `WEAK_PASSWORD` | Password too weak | 400 Bad Request | "Password must be at least 10 characters." |
| `RATE_LIMIT` | Too many signup attempts | 429 Too Many Requests | "Too many attempts. Please try again later." |
| `HONEYPOT` | Bot detected | 400 Bad Request | Generic error (don't reveal honeypot) |
| `DISPOSABLE_EMAIL` | Disposable email provider | 400 Bad Request | "Please use a permanent email address." |

### Login Failures

| Error | Cause | Response | UX Message |
|-------|-------|----------|------------|
| `INVALID_CREDENTIALS` | Wrong email/password | 401 Unauthorized | "Invalid email or password." |
| `USER_NOT_FOUND` | Email not registered | 401 Unauthorized | "Invalid email or password." (don't reveal existence) |
| `USER_SUSPENDED` | Account suspended | 403 Forbidden | "Account suspended. Contact support." |
| `USER_DELETED` | Account deleted | 401 Unauthorized | "Invalid email or password." |
| `RATE_LIMIT` | Too many login attempts | 429 Too Many Requests | "Too many attempts. Please try again later." |

### Token Failures

| Error | Cause | Response | UX Message |
|-------|-------|----------|------------|
| `TOKEN_MISSING` | No token provided | 401 Unauthorized | "Please sign in." |
| `TOKEN_INVALID` | Invalid signature | 401 Unauthorized | "Invalid session. Please sign in." |
| `TOKEN_EXPIRED` | Token expired | 401 Unauthorized | "Session expired. Please sign in." |
| `USER_NOT_FOUND` | User doesn't exist | 401 Unauthorized | "Invalid session. Please sign in." |

### WebSocket Failures

| Error | Cause | Action | UX Message |
|-------|-------|--------|------------|
| `AUTH_FAILED` | Token invalid/expired | Connection rejected | "Connection failed. Please refresh." |
| `USER_NOT_FOUND` | User doesn't exist | Connection rejected | "Connection failed. Please refresh." |
| `USER_SUSPENDED` | Account suspended | Connection rejected | "Account suspended. Contact support." |

---

## Graceful Handling

### Frontend Error Handling

1. **API Errors**
   - 401 Unauthorized → Redirect to login
   - 403 Forbidden → Show error message
   - 429 Too Many Requests → Show rate limit message
   - 500 Internal Server Error → Show generic error

2. **WebSocket Errors**
   - Connection failure → Show reconnection UI
   - Authentication failure → Redirect to login
   - Rate limit → Show rate limit message

3. **Token Expiration**
   - Detect expired token → Redirect to login
   - Show "Session expired" message
   - Clear local storage

### Backend Error Handling

1. **Database Errors**
   - Connection errors → 503 Service Unavailable
   - Constraint violations → 409 Conflict
   - Query errors → 500 Internal Server Error (log, don't expose)

2. **Validation Errors**
   - Input validation → 400 Bad Request
   - Clear error messages (no sensitive data)

3. **Security Errors**
   - Rate limiting → 429 Too Many Requests
   - Honeypot detection → 400 Bad Request (generic error)

---

## Security Considerations

### Password Security

- **Hashing**: bcrypt with 12 rounds
- **Storage**: Never store plain text passwords
- **Validation**: Minimum 10 characters (NIST guidelines)
- **Common Passwords**: Blocked via blacklist

### Token Security

- **Secret**: Strong `JWT_SECRET` required (min 32 chars)
- **Expiration**: 24 hours (balance security vs UX)
- **Storage**: HttpOnly cookie (prevents XSS)
- **Transmission**: HTTPS only in production

### Rate Limiting

- **Signup**: 10 requests/15min per IP
- **Login**: 5 attempts/15min per IP
- **Password Reset**: 3 requests/hour per email
- **WebSocket**: Per-event rate limits

### Input Validation

- **Email**: Format validation, disposable email check
- **Password**: Length, complexity (if required)
- **Honeypot**: Hidden field for bot detection

---

## Database Operations

### Tables Modified

**Signup/Login**:
- `users` - User record created/updated
- `user_context` - User context created
- `user_roles` - Default role assigned
- `tasks` - Welcome/onboarding tasks created

**Authentication**:
- No separate session table (stateless JWT)
- Token stored in cookie only

---

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/oauth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/password/reset` - Request password reset
- `POST /api/auth/password/verify` - Verify password reset token

---

## WebSocket Events

### Authentication Events

- `connect` - Socket connection (requires authentication)
- `disconnect` - Socket disconnection
- `error` - Connection error (authentication failure)

### Middleware

- `authMiddleware` - Verifies JWT token on connection
- `rateLimitMiddleware` - Rate limits socket events
- `roomMembershipMiddleware` - Verifies room membership

---

## References

### Frontend Implementation

- `chat-client-vite/src/features/auth/` - Authentication components
- `chat-client-vite/src/context/AuthContext.jsx` - Authentication state
- `chat-client-vite/src/utils/authQueries.js` - API calls

### Backend Implementation

- `chat-server/routes/auth/` - Authentication routes
- `chat-server/auth/` - Authentication logic
- `chat-server/middleware/auth.js` - Authentication middleware
- `chat-server/socketHandlers/socketMiddleware/authMiddleware.js` - Socket auth

### Database

- `chat-server/migrations/` - User schema migrations
- `chat-server/docs/db-constraints.md` - Database constraints
- `chat-server/docs/room-membership.md` - Room membership rules

---

**Last Updated**: 2025-01-07

