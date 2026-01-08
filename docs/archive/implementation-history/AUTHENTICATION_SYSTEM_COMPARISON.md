# Authentication System Comparison

## Executive Summary

This document compares your current authentication implementation against a production-grade specification. **Overall Assessment: 60% compliant** — core functionality exists but several critical security and reliability gaps need addressing.

---

## 1. Identity & Data Model

### Specification Requirements
- `users` table with: id, primary_email, email_verified, created_at, status
- `auth_identities` table: id, user_id, provider, provider_subject, provider_email, created_at
- `sessions` table: id, user_id, created_at, expires_at, revoked_at, last_seen_at
- `refresh_tokens` table (if using refresh tokens): hashed token, rotation support

### Current Implementation ❌

**Database Schema:**
```sql
-- Current users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  google_id TEXT UNIQUE,  -- ❌ OAuth data mixed into users table
  oauth_provider TEXT,    -- ❌ Not normalized
  ...
)
```

**Issues:**
1. ❌ **No separate `auth_identities` table** — OAuth data stored directly in `users` table
2. ❌ **No `sessions` table** — sessions are stateless JWTs only (no server-side tracking)
3. ❌ **No `email_verified` flag** — cannot distinguish verified vs unverified emails
4. ❌ **No `status` field** — cannot track account status (active, suspended, etc.)
5. ❌ **Identity linking is ad-hoc** — account linking happens in `getOrCreateGoogleUser()` but not standardized
6. ❌ **No refresh tokens table** — using long-lived JWTs (30 days) instead

**Current Account Linking Logic:**
- ✅ Links Google account to existing email-based account (lines 17-34 in `auth/oauth.js`)
- ⚠️ But lacks explicit `auth_identities` normalization
- ❌ No verification that Google email is verified before linking

**Compliance Score: 30%**

---

## 2. Google OAuth Requirements

### Specification Requirements
- ✅ Use Authorization Code Flow with PKCE
- ✅ Validate: state (CSRF), nonce (ID token replay protection)
- ✅ Validate ID token: issuer, audience, expiry, signature, sub
- ✅ Store minimum profile data
- ✅ Treat unverified Google emails as unverified

### Current Implementation ⚠️

**OAuth Flow:**
```javascript
// routes/auth/oauth.js
router.get('/google', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?...&response_type=code...`;
  // ❌ NO PKCE (code_verifier/code_challenge)
  // ❌ NO state parameter validation
  // ❌ NO nonce for ID token
});
```

**Token Exchange:**
```javascript
router.post('/google/callback', async (req, res) => {
  // ❌ Exchanges authorization code for access token
  // ❌ NO ID token validation
  // ❌ Uses userinfo endpoint instead (less secure than ID token)
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
});
```

**Issues:**
1. ❌ **No PKCE implementation** — Required for SPAs, currently missing
2. ❌ **No state parameter validation** — Client generates state but server doesn't verify
3. ❌ **No ID token validation** — Not using ID tokens at all, relying on userinfo endpoint
4. ❌ **No nonce protection** — ID token replay attacks possible
5. ❌ **No email verification check** — Google email verification status not checked
6. ✅ **Idempotency handling** — Handles duplicate code usage gracefully (lines 76-116)

**Routes:**
- ✅ `GET /api/auth/google` — Starts OAuth flow
- ✅ `POST /api/auth/google/callback` — Handles callback
- ❌ Missing `/auth/google/start?returnTo=...` pattern from spec

**Compliance Score: 40%**

---

## 3. Email Login

### Specification Requirements
- **Option A (Magic Link)**: POST /auth/email/start, GET /auth/email/callback?token=...
- **Option B (Email + Password)**: Store with argon2id/bcrypt, password reset, rate limiting

### Current Implementation ✅ (Option B)

**Email + Password:**
```javascript
// auth/authentication.js
async function authenticateUserByEmail(email, password) {
  // ✅ Uses bcrypt for password hashing
  // ✅ Migrates legacy SHA-256 hashes to bcrypt
  // ✅ Handles OAuth-only accounts
}
```

**Issues:**
1. ✅ **Password hashing** — Uses bcrypt (meets spec)
2. ⚠️ **Password reset** — Exists but need to verify token security
3. ✅ **Rate limiting** — `loginRateLimit` middleware applied
4. ❌ **No magic link option** — Only password-based login
5. ⚠️ **Account lockout** — Adaptive auth exists but unclear if lockout implemented

**Compliance Score: 75%** (good for Option B, but Option A not implemented)

---

## 4. Sessions

### Specification Requirements

**Best-practice web app option:**
- httpOnly, Secure cookies
- SameSite=Lax
- Secure=true in production
- Correct domain/path
- Session middleware reads cookie, attaches req.user
- NO redirect for APIs (return 401)

**Token rotation (if refresh tokens):**
- Access token: 5–15 min TTL
- Refresh token: 7–30 days TTL
- Rotate refresh token on use
- Store refresh tokens hashed

### Current Implementation ⚠️

**Cookie Settings:**
```javascript
// middleware/auth.js
function setAuthCookie(res, token, maxAgeDays = 30) {
  res.cookie('auth_token', token, {
    httpOnly: true,              // ✅
    secure: process.env.NODE_ENV === 'production',  // ✅
    sameSite: 'lax',             // ✅
    maxAge: maxAgeDays * 24 * 60 * 60 * 1000,      // ⚠️ 30 days
  });
}
```

**JWT Token:**
```javascript
function generateToken(user, expiresIn = '30d') {  // ❌ 30 days (too long)
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
```

**Session Middleware:**
```javascript
function authenticate(req, res, next) {
  // ✅ Reads from cookie or header
  // ✅ Returns 401 JSON for APIs (no redirect)
  // ❌ NO server-side session tracking
  // ❌ NO refresh token mechanism
}
```

**Issues:**
1. ✅ **Cookie settings correct** — httpOnly, Secure, SameSite=Lax
2. ❌ **No refresh tokens** — Single long-lived JWT (30 days)
3. ❌ **No token rotation** — Tokens are static until expiry
4. ❌ **No server-side session tracking** — Cannot revoke sessions
5. ✅ **API routes return 401** — Correct behavior
6. ⚠️ **Token expiry too long** — 30 days vs recommended 5–15 min (with refresh)

**Compliance Score: 60%**

---

## 5. Redirects and returnTo Rules

### Specification Requirements
- returnTo must be stored before redirecting
- Validated (same-origin only)
- Redirect to returnTo after login, else default
- Protected routes should include returnTo in login redirect

### Current Implementation ✅

**Return URL Handling:**
```javascript
// features/auth/model/useAuthRedirect.js
function isValidReturnUrl(returnUrl) {
  // ✅ Validates same-origin only
  // ✅ Allows relative URLs
}

export function useAuthRedirect({...}) {
  const storedReturnUrl = storage.getString(StorageKeys.RETURN_URL);
  if (storedReturnUrl && isValidReturnUrl(storedReturnUrl)) {
    destination = storedReturnUrl;
    storage.remove(StorageKeys.RETURN_URL);
  }
}
```

**Route Protection:**
```javascript
// features/shell/components/AuthGuard.jsx
// ✅ Stores return URL before redirecting
// ✅ Preserves query parameters
```

**Issues:**
1. ✅ **Return URL storage** — Stored in sessionStorage with TTL
2. ✅ **Return URL validation** — Same-origin check implemented
3. ✅ **Protected route handling** — AuthGuard stores return URL
4. ⚠️ **OAuth flow** — returnTo not explicitly passed through OAuth flow
5. ✅ **Deep linking** — returnTo preserved through login flow

**Compliance Score: 85%**

---

## 6. Route Protection Rules

### Specification Requirements
- API routes: return 401/403 JSON, never redirect
- Page routes: redirect to /login?returnTo=...
- Invite links and onboarding routes: allow while logged out, guide to login

### Current Implementation ✅

**API Middleware:**
```javascript
// middleware/auth.js
function authenticate(req, res, next) {
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });  // ✅
  }
}
```

**Page Protection:**
```javascript
// features/shell/components/AuthGuard.jsx
if (!isAuthenticated) {
  // ✅ Stores return URL
  // ✅ Redirects to signin
  // ✅ Allows public pages (accept-invite, etc.)
}
```

**Issues:**
1. ✅ **API routes return 401** — Correct JSON responses
2. ✅ **Page routes redirect** — AuthGuard handles this
3. ✅ **Public routes allowed** — Invite acceptance works while logged out
4. ⚠️ **Some inconsistency** — Mix of `/signin` and `/sign-in` paths

**Compliance Score: 90%**

---

## 7. Error Handling UX

### Specification Requirements
- Explicit pages/states for: OAuth callback error, token expired, token already used, wrong account, blocked cookies
- Every auth failure should show: human-readable message, "Try again", "Contact support"

### Current Implementation ⚠️

**OAuth Error Handling:**
```javascript
// features/auth/components/GoogleOAuthCallback.jsx
if (errorParam) {
  const oauthError = parseOAuthError(errorParam, errorDescription);
  setState(OAuthState.ERROR);
  setErrorMessage(oauthError.userMessage);
  // ⚠️ Auto-redirects after 3 seconds
  // ❌ No "Contact support" button
  // ✅ Human-readable messages
}
```

**Error Messages:**
```javascript
// utils/errorHandler.jsx
const OAUTH_ERRORS = {
  access_denied: { userMessage: 'You cancelled sign-in...', retryable: true },
  invalid_grant: { userMessage: 'Session expired...', retryable: true },
  // ✅ Good error mapping
}
```

**Issues:**
1. ✅ **OAuth errors handled** — GoogleOAuthCallback shows errors
2. ⚠️ **Auto-redirect** — Redirects after 3s (spec says explicit pages)
3. ❌ **No explicit error pages** — Errors shown inline, not dedicated pages
4. ❌ **No "Contact support" buttons** — Missing from error states
5. ❌ **No blocked cookies detection** — No handling for cookie write failures
6. ✅ **Human-readable messages** — Good error messages exist

**Compliance Score: 50%**

---

## 8. Observability + Tests

### Specification Requirements
- Structured logs: login start, callback success/fail, session created, session read fail, redirect chosen
- Integration tests: Google login, email login, refresh after reload, protected route redirects, API 401, cookie settings

### Current Implementation ❌

**Logging:**
```javascript
// routes/auth/oauth.js
console.log('[OAuth] Google callback received:', {...});  // ⚠️ console.log (not structured)
console.log('[OAuth] Token exchange response:', {...});
// ❌ No structured logging library
// ❌ No log aggregation
// ❌ Limited coverage
```

**Testing:**
- ⚠️ **Some tests exist** — Found auth.test.js, critical-flows.test.js
- ❌ **No comprehensive integration tests** — Missing full flow tests
- ❌ **No cookie settings test** — Not verified in tests
- ❌ **No session persistence test** — Not tested

**Issues:**
1. ❌ **No structured logging** — Using console.log instead of structured logger
2. ❌ **Incomplete test coverage** — Missing key integration tests
3. ❌ **No observability metrics** — No tracking of auth events

**Compliance Score: 25%**

---

## Critical Gaps Summary

### 🔴 Critical (Security)
1. **No PKCE** — Required for SPA security
2. **No ID token validation** — Using userinfo endpoint instead
3. **No state validation** — CSRF vulnerability
4. **No email verification check** — Unverified Google emails treated as verified
5. **Long-lived tokens** — 30-day JWTs instead of short-lived + refresh

### 🟡 High Priority (Reliability)
6. **No server-side sessions** — Cannot revoke sessions
7. **No refresh tokens** — Token rotation not implemented
8. **No auth_identities table** — Identity management not normalized
9. **Missing returnTo in OAuth** — Not passed through OAuth flow
10. **No explicit error pages** — Errors auto-redirect instead of showing pages

### 🟢 Medium Priority (UX/Observability)
11. **No structured logging** — Hard to debug production issues
12. **Incomplete tests** — Missing integration test coverage
13. **No magic link option** — Only password-based email login
14. **No blocked cookies detection** — Silent failures possible

---

## Recommendations

### Phase 1: Security Fixes (Critical)
1. **Implement PKCE** — Add code_verifier/code_challenge to OAuth flow
2. **Validate ID tokens** — Use ID tokens instead of userinfo endpoint
3. **Validate state parameter** — Store and verify state on callback
4. **Check email verification** — Verify `email_verified` from Google
5. **Implement refresh tokens** — Short-lived access tokens (5-15 min) + refresh tokens

### Phase 2: Data Model (High Priority)
6. **Create auth_identities table** — Normalize identity management
7. **Create sessions table** — Server-side session tracking
8. **Add email_verified flag** — Track verification status
9. **Add user status field** — Track account status

### Phase 3: UX & Observability (Medium Priority)
10. **Explicit error pages** — Dedicated pages for each error type
11. **Structured logging** — Use Winston/Pino with structured format
12. **Integration tests** — Full auth flow test suite
13. **Cookie write detection** — Handle blocked cookies gracefully

---

## Compliance Matrix

| Requirement | Status | Score |
|------------|--------|-------|
| Identity & Data Model | ❌ Missing auth_identities, sessions tables | 30% |
| Google OAuth (PKCE, ID token, state) | ❌ No PKCE, no ID token validation | 40% |
| Email Login | ✅ Good (password-based) | 75% |
| Sessions (cookies, refresh tokens) | ⚠️ Cookies OK, no refresh tokens | 60% |
| returnTo handling | ✅ Well implemented | 85% |
| Route Protection | ✅ Correct API/page behavior | 90% |
| Error Handling | ⚠️ Messages good, missing pages | 50% |
| Observability & Tests | ❌ No structured logs, incomplete tests | 25% |
| **Overall** | **⚠️ Functional but gaps** | **60%** |

---

## Next Steps

1. **Review this analysis** — Confirm priority of gaps
2. **Plan Phase 1** — Security fixes should be top priority
3. **Create migration plan** — For auth_identities and sessions tables
4. **Implement incrementally** — Start with PKCE, then ID tokens, then data model
5. **Add tests** — Integration tests for each new feature

---

*Generated: 2026-01-06*

