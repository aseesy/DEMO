# Authentication, WebSocket, and Session Verification Improvements

## Overview

This document identifies improvements needed for:
- Vercel deployment configuration
- WebSocket authentication and reconnection handling
- Backend authentication middleware
- Session verification and token management

---

## 1. Vercel Configuration Issues

### Current State
- `vercel.json` only configures frontend static assets
- No WebSocket proxy configuration
- No backend API proxy (backend runs on Railway, not Vercel)

### Issues Identified

#### 1.1 Missing WebSocket Proxy Configuration
**Problem**: Vercel doesn't natively support WebSocket connections. The current setup assumes WebSockets connect directly to Railway backend, but there's no fallback or proxy configuration.

**Impact**: 
- WebSocket connections may fail in certain network configurations
- No graceful degradation for WebSocket failures

**Recommendation**:
```json
{
  "rewrites": [
    {
      "source": "/socket.io/:path*",
      "destination": "https://demo-production-6dcd.up.railway.app/socket.io/:path*"
    },
    {
      "source": "/api/:path*",
      "destination": "https://demo-production-6dcd.up.railway.app/api/:path*"
    }
  ]
}
```

**Note**: Vercel doesn't support WebSocket proxying in serverless functions. Consider:
- Using Vercel Edge Functions for WebSocket-like behavior (limited)
- Keeping direct WebSocket connections to Railway backend (current approach)
- Documenting that WebSockets bypass Vercel entirely

#### 1.2 Environment Variable Documentation
**Problem**: No clear documentation on which Vercel environment variables are required.

**Recommendation**: Add to `vercel.json`:
```json
{
  "env": {
    "VITE_API_URL": {
      "description": "Backend API URL (Railway)",
      "required": true
    },
    "VITE_WS_URL": {
      "description": "WebSocket URL (Railway)",
      "required": true
    }
  }
}
```

---

## 2. WebSocket Authentication Improvements

### Current State
- JWT authentication middleware exists (`socketMiddleware.js`)
- Token expiry is stored in `socket.user.tokenExp`
- Reconnection logic exists but doesn't validate token expiry

### Issues Identified

#### 2.1 Token Expiry Not Validated on Reconnection
**Problem**: When a socket reconnects, the middleware checks if token is valid but doesn't proactively check expiry before connection.

**Location**: `chat-server/socketHandlers/socketMiddleware.js:112-150`

**Current Code**:
```javascript
function authMiddleware(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return next(new Error('Authentication required'));
  }
  
  const decoded = jwt.verify(token, JWT_SECRET); // This throws if expired
  socket.user = {
    id: decoded.id || decoded.userId,
    email: decoded.email,
    tokenExp: decoded.exp, // Stored but not checked proactively
  };
  next();
}
```

**Issue**: If token is expired, `jwt.verify()` throws, but the error handling doesn't provide clear guidance to the client about refreshing the token.

**Recommendation**:
```javascript
function authMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    if (!token) {
      const err = new Error('Authentication required');
      err.data = { code: SocketErrorCodes.AUTH_REQUIRED, shouldRefresh: false };
      return next(err);
    }
    
    // Decode without verification first to check expiry
    const decoded = jwt.decode(token);
    if (!decoded) {
      const err = new Error('Invalid token format');
      err.data = { code: SocketErrorCodes.AUTH_INVALID, shouldRefresh: true };
      return next(err);
    }
    
    // Check expiry proactively
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      const err = new Error('Token expired');
      err.data = { 
        code: SocketErrorCodes.AUTH_EXPIRED, 
        shouldRefresh: true,
        expiredAt: decoded.exp,
        currentTime: now
      };
      return next(err);
    }
    
    // Now verify signature
    const verified = jwt.verify(token, JWT_SECRET);
    socket.user = {
      id: verified.id || verified.userId,
      email: verified.email,
      tokenExp: verified.exp,
    };
    
    next();
  } catch (err) {
    // Handle signature verification errors
    const error = new Error('Authentication failed');
    if (err.name === 'TokenExpiredError') {
      error.data = { 
        code: SocketErrorCodes.AUTH_EXPIRED, 
        shouldRefresh: true 
      };
    } else {
      error.data = { 
        code: SocketErrorCodes.AUTH_INVALID, 
        shouldRefresh: true 
      };
    }
    next(error);
  }
}
```

#### 2.2 Client-Side Reconnection Doesn't Refresh Token
**Problem**: When WebSocket reconnects after disconnection, client uses the same token. If token expired during disconnection, reconnection will fail.

**Location**: `chat-client-vite/src/features/chat/model/useChatSocket.js:201-223`

**Current Code**:
```javascript
const authToken = authStorage.getToken();
socket = io(socketUrl, {
  auth: {
    token: authToken, // Uses stored token, may be expired
  },
});
```

**Recommendation**: Add token refresh logic before reconnection:
```javascript
// Before creating socket connection
const authToken = authStorage.getToken();
if (!authToken || isTokenExpired(authToken)) {
  // Try to refresh token via API call
  try {
    const response = await apiGet('/api/auth/verify', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!response.ok) {
      // Token invalid, trigger re-login
      onAuthFailure({ endpoint: '/socket.io', status: 401 });
      return;
    }
    // Token refreshed, use new token
    const newToken = authStorage.getToken(); // Updated by verify endpoint
  } catch (err) {
    // Network error - use optimistic approach
    console.warn('[useChatSocket] Token refresh failed, using stored token');
  }
}
```

#### 2.3 No Token Refresh Mechanism for Long-Lived Connections
**Problem**: JWT tokens expire after 30 days (default), but WebSocket connections can last longer. No mechanism to refresh token while connected.

**Recommendation**: Add periodic token refresh:
```javascript
// In socket connection handler
socket.on('connect', () => {
  // Check token expiry every hour
  const tokenCheckInterval = setInterval(() => {
    const token = authStorage.getToken();
    if (token && isTokenExpiringSoon(token, 7 * 24 * 60 * 60 * 1000)) { // 7 days
      // Refresh token proactively
      refreshToken().then(newToken => {
        // Update socket auth
        socket.auth.token = newToken;
        // Optionally reconnect with new token
      });
    }
  }, 60 * 60 * 1000); // Check every hour
  
  socket.on('disconnect', () => {
    clearInterval(tokenCheckInterval);
  });
});
```

---

## 3. Backend Authentication Middleware Improvements

### Current State
- Express middleware exists (`middleware/auth.js`)
- Socket middleware exists (`socketHandlers/socketMiddleware.js`)
- Both use JWT verification

### Issues Identified

#### 3.1 Inconsistent Error Handling
**Problem**: Express middleware and Socket middleware handle errors differently.

**Express** (`middleware/auth.js:54-64`):
```javascript
catch (err) {
  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({ error: 'Token expired' });
  }
  return res.status(401).json({ error: 'Invalid or expired token' });
}
```

**Socket** (`socketHandlers/socketMiddleware.js:139-149`):
```javascript
catch (err) {
  const error = new Error('Authentication failed');
  if (err.name === 'TokenExpiredError') {
    error.data = { code: SocketErrorCodes.AUTH_EXPIRED };
  } else {
    error.data = { code: SocketErrorCodes.AUTH_INVALID };
  }
  next(error);
}
```

**Recommendation**: Standardize error responses:
```javascript
// Create shared error handler
function createAuthError(err) {
  const error = {
    message: 'Authentication failed',
    code: 'AUTH_INVALID',
    shouldRefresh: false,
  };
  
  if (err.name === 'TokenExpiredError' || err instanceof jwt.TokenExpiredError) {
    error.message = 'Token expired';
    error.code = 'AUTH_EXPIRED';
    error.shouldRefresh = true;
  } else if (err.name === 'JsonWebTokenError' || err instanceof jwt.JsonWebTokenError) {
    error.message = 'Invalid token';
    error.code = 'AUTH_INVALID';
    error.shouldRefresh = true;
  }
  
  return error;
}
```

#### 3.2 No Rate Limiting on Authentication Endpoints
**Problem**: `/api/auth/verify` endpoint can be called repeatedly without rate limiting, allowing token enumeration attacks.

**Current**: Only `/api/auth/login` and `/api/auth/signup` have rate limiting.

**Recommendation**: Add rate limiting to verification endpoint:
```javascript
// In middleware.js or route setup
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: 'Too many verification attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/verify', verifyLimiter);
```

#### 3.3 Token Blacklisting Not Implemented
**Problem**: No mechanism to invalidate tokens before expiry (e.g., on logout, password change, security breach).

**Recommendation**: Implement token blacklist:
```sql
-- Migration: Add token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  token_hash VARCHAR(64) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX idx_token_blacklist_user ON token_blacklist(user_id);
```

```javascript
// In middleware/auth.js
const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function isTokenBlacklisted(token, db) {
  const tokenHash = hashToken(token);
  const result = await db.query(
    'SELECT * FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );
  return result.rows.length > 0;
}

// Update authenticate middleware
async function authenticate(req, res, next) {
  try {
    const token = req.cookies.auth_token || 
                  req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check blacklist
    if (await isTokenBlacklisted(token, db)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    // ... rest of authentication
  } catch (err) {
    // ... error handling
  }
}
```

---

## 4. Session Verification Improvements

### Current State
- Session verification endpoint exists (`/api/auth/verify`)
- Client-side verification with timeout handling
- Token expiration checking

### Issues Identified

#### 4.1 No Database Verification of User Status
**Problem**: `/api/auth/verify` only checks if token is valid, not if user account is still active.

**Current Code** (`routes/auth/verification.js:40-63`):
```javascript
router.get('/verify', verifyAuth, async (req, res) => {
  const userResult = await dbSafe.safeSelect('users', { id: req.user.userId || req.user.id }, { limit: 1 });
  const users = dbSafe.parseResult(userResult);
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });
  
  const freshUser = users[0];
  res.json({ authenticated: true, user: freshUser });
});
```

**Issue**: Doesn't check if user account is disabled, deleted, or locked.

**Recommendation**:
```javascript
router.get('/verify', verifyAuth, async (req, res) => {
  try {
    const userResult = await dbSafe.safeSelect(
      'users', 
      { id: req.user.userId || req.user.id }, 
      { limit: 1 }
    );
    const users = dbSafe.parseResult(userResult);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        authenticated: false 
      });
    }
    
    const freshUser = users[0];
    
    // Check if user account is active
    if (freshUser.deleted_at) {
      return res.status(401).json({
        error: 'Account has been deleted',
        authenticated: false,
        code: 'ACCOUNT_DELETED'
      });
    }
    
    if (freshUser.locked_until && new Date(freshUser.locked_until) > new Date()) {
      return res.status(403).json({
        error: 'Account is temporarily locked',
        authenticated: false,
        code: 'ACCOUNT_LOCKED',
        lockedUntil: freshUser.locked_until
      });
    }
    
    // Check if email is verified (if required)
    if (freshUser.email_verified === false && REQUIRE_EMAIL_VERIFICATION) {
      return res.status(403).json({
        error: 'Email not verified',
        authenticated: false,
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    res.json({
      authenticated: true,
      valid: true,
      user: {
        id: freshUser.id,
        email: freshUser.email,
        display_name: freshUser.display_name,
        // ... other fields
      },
    });
  } catch (error) {
    // ... existing error handling
  }
});
```

#### 4.2 No Session Activity Tracking
**Problem**: No way to track when users were last active or detect stale sessions.

**Recommendation**: Add session activity tracking:
```sql
-- Add last_activity column to users table (or create sessions table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update on verification
UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1;
```

```javascript
// In verification endpoint
await db.query(
  'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = $1',
  [req.user.userId || req.user.id]
);
```

#### 4.3 Client-Side Verification Doesn't Handle Network Errors Gracefully
**Problem**: When verification fails due to network error, client falls back to optimistic auth, which may be incorrect.

**Current Code** (`context/AuthContext.jsx:285-298`):
```javascript
if (err.name === 'AbortError') {
  console.warn('[verifySession] ⚠️ Verification timeout - using optimistic auth state');
  const storedState = loadAuthState();
  if (storedState.isAuthenticated && storedState.token) {
    setIsAuthenticated(storedState.isAuthenticated);
    // ... use stored state
    return;
  }
}
```

**Issue**: If token is expired but network fails, user stays authenticated with expired token.

**Recommendation**: Always check token expiry before using optimistic state:
```javascript
if (err.name === 'AbortError') {
  console.warn('[verifySession] ⚠️ Verification timeout');
  const storedState = loadAuthState();
  const storedToken = storedState.token;
  
  // CRITICAL: Don't use optimistic state if token is expired
  if (storedToken && isTokenExpired(storedToken)) {
    console.log('[verifySession] Token expired, cannot use optimistic state');
    clearAuthState();
    setIsCheckingAuth(false);
    return;
  }
  
  // Only use optimistic state if token is not expired
  if (storedState.isAuthenticated && storedToken && !isTokenExpired(storedToken)) {
    setIsAuthenticated(storedState.isAuthenticated);
    // ... use stored state
    return;
  }
  
  // No valid token, clear auth
  clearAuthState();
  setIsCheckingAuth(false);
}
```

---

## 5. Security Improvements

### 5.1 Add CSRF Protection for State-Changing Operations
**Problem**: No CSRF tokens for state-changing operations (logout, password change, etc.).

**Recommendation**: Add CSRF protection:
```javascript
// Generate CSRF token on login
const csrfToken = crypto.randomBytes(32).toString('hex');
req.session.csrfToken = csrfToken;
res.cookie('csrf_token', csrfToken, { httpOnly: false, sameSite: 'strict' });

// Verify CSRF token on state-changing operations
function verifyCSRF(req, res, next) {
  const token = req.headers['x-csrf-token'] || req.body.csrf_token;
  const cookieToken = req.cookies.csrf_token;
  
  if (!token || token !== cookieToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}
```

### 5.2 Add Security Headers
**Problem**: Some security headers may be missing.

**Current**: Helmet is configured but may need updates.

**Recommendation**: Review and enhance:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // ... existing
      connectSrc: [
        "'self'",
        'https://demo-production-6dcd.up.railway.app',
        'wss://demo-production-6dcd.up.railway.app',
        // ... other sources
      ],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

---

## 6. Implementation Priority

### High Priority (Security & Reliability)
1. ✅ Token expiry validation on WebSocket reconnection
2. ✅ Rate limiting on `/api/auth/verify`
3. ✅ User account status checking in verification endpoint
4. ✅ Token expiry check before optimistic auth fallback

### Medium Priority (User Experience)
5. Token refresh mechanism for long-lived connections
6. Session activity tracking
7. CSRF protection for state-changing operations

### Low Priority (Nice to Have)
8. Token blacklisting (if logout/revocation needed)
9. Enhanced security headers
10. WebSocket proxy configuration documentation

---

## 7. Testing Recommendations

1. **Test expired token handling**: Verify WebSocket reconnection fails gracefully with expired token
2. **Test network failure**: Verify optimistic auth doesn't use expired tokens
3. **Test rate limiting**: Verify verification endpoint rate limits correctly
4. **Test account status**: Verify locked/deleted accounts can't authenticate
5. **Test token refresh**: Verify tokens refresh before expiry in long-lived connections

---

## Summary

Key improvements needed:
- **WebSocket**: Add token expiry validation and refresh mechanism
- **Backend Auth**: Standardize error handling, add rate limiting, consider token blacklisting
- **Session Verification**: Check user account status, track activity, improve network error handling
- **Vercel**: Document WebSocket limitations and environment variables

Most critical: Token expiry validation on WebSocket reconnection and improved session verification error handling.

