# Dev-Only Testing Guide

## Overview

Dev-only testing endpoints allow you to quickly test authentication flows without going through the full signup/login process. This is perfect for testing auth guards, redirects, and session management.

## ⚠️ Security

**These routes are ONLY available in:**
- Development mode (`NODE_ENV !== 'production'`)
- Localhost/internal IPs only
- All usage is logged for audit

**They are DISABLED in production** - attempting to access them returns 403.

---

## Endpoints

### 1. POST /__dev/login

**Impersonate or create a user session**

```bash
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Created and logged in as new user",
  "user": {
    "id": 123,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "displayName": "Test User"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "dev": true
}
```

**Behavior:**
- Finds user by email, or creates if doesn't exist
- Creates a normal JWT session cookie (same as real login)
- Sets `auth_token` cookie (httpOnly, secure in production)
- Returns user object and token

**Use Cases:**
- Test protected routes without signup
- Test auth guards and redirects
- Test session persistence
- Test API authentication

---

### 2. POST /__dev/logout

**Clear dev session**

```bash
curl -X POST http://localhost:3000/__dev/logout \
  -b "auth_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out"
}
```

**Behavior:**
- Clears `auth_token` cookie
- Same as real logout

---

### 3. GET /__dev/me

**Get current user info (requires authentication)**

```bash
curl http://localhost:3000/__dev/me \
  -H "Authorization: Bearer YOUR_TOKEN"
# OR
curl http://localhost:3000/__dev/me \
  -b "auth_token=YOUR_TOKEN"
```

**Response (authenticated):**
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "displayName": "Test User"
  },
  "dev": true
}
```

**Response (not authenticated):**
```json
{
  "error": "Not authenticated",
  "code": "NOT_AUTHENTICATED"
}
```

**Use Cases:**
- Test auth middleware
- Verify session is working
- Test token validation

---

### 4. GET /__dev/status

**Check if dev routes are enabled**

```bash
curl http://localhost:3000/__dev/status
```

**Response:**
```json
{
  "enabled": true,
  "environment": "development",
  "localhost": true,
  "message": "Dev routes are enabled"
}
```

---

## Quick Testing Workflow

### 1. Create a Test User Session

```bash
# Create/login as test user
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "athena@test.com"}' \
  -c cookies.txt
```

The `-c cookies.txt` saves the cookie for subsequent requests.

### 2. Test Protected Routes

```bash
# Test API endpoint (should work now)
curl http://localhost:3000/api/user/me \
  -b cookies.txt

# Test in browser
# Open http://localhost:5173/dashboard
# Should load without redirecting to login
```

### 3. Test Auth Guards

```bash
# Without cookie (should fail)
curl http://localhost:3000/api/user/me

# With cookie (should work)
curl http://localhost:3000/api/user/me -b cookies.txt
```

### 4. Test Logout

```bash
curl -X POST http://localhost:3000/__dev/logout \
  -b cookies.txt \
  -c cookies.txt

# Now protected routes should fail
curl http://localhost:3000/api/user/me -b cookies.txt
```

---

## Browser Testing

### Using Browser DevTools

1. **Create session via curl:**
   ```bash
   curl -X POST http://localhost:3000/__dev/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}' \
     -c cookies.txt
   ```

2. **Copy cookie value:**
   ```bash
   cat cookies.txt | grep auth_token
   ```

3. **Set cookie in browser:**
   - Open Chrome DevTools (F12)
   - Go to Application → Cookies → http://localhost:5173
   - Add cookie:
     - Name: `auth_token`
     - Value: `[token from cookies.txt]`
     - Domain: `localhost`
     - Path: `/`
     - HttpOnly: ✅ (if possible)
     - Secure: ❌ (for localhost)
     - SameSite: `Lax`

4. **Reload page:**
   - Protected routes should now work
   - User should be logged in

### Using Browser Console

```javascript
// Create session
fetch('http://localhost:3000/__dev/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@example.com' })
})
.then(r => r.json())
.then(data => {
  console.log('Logged in:', data);
  // Cookie is automatically set
  // Reload page to see effect
  window.location.reload();
});
```

---

## Auth Smoke Checklist (5 minutes)

### ✅ Test 1: Redirect to Login
```bash
# Logged out, hit protected route
curl -L http://localhost:5173/dashboard
# Should redirect to /login?returnTo=/dashboard
```

### ✅ Test 2: Protected Route After Login
```bash
# Create session
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -c cookies.txt

# Access protected route (should work)
curl http://localhost:3000/api/user/me -b cookies.txt
```

### ✅ Test 3: Session Persistence (Refresh)
```bash
# After creating session, refresh should keep you logged in
# In browser: Create session, then refresh page
# Should still be logged in
```

### ✅ Test 4: Cross-Tab Session
```bash
# After creating session, open new tab
# Should also be logged in (cookie is shared)
```

### ✅ Test 5: API Auth Boundaries
```bash
# Without auth (should fail)
curl http://localhost:3000/api/user/me
# Expected: 401 Unauthorized

# With auth (should work)
curl http://localhost:3000/api/user/me -b cookies.txt
# Expected: 200 OK with user data
```

---

## Testing Invite System

### Test Wrong Account State

1. **Create invitation for specific email:**
   ```bash
   # Create invitation for test@example.com
   # (Use normal invite creation flow)
   ```

2. **Login as different user:**
   ```bash
   curl -X POST http://localhost:3000/__dev/login \
     -H "Content-Type: application/json" \
     -d '{"email": "different@example.com"}' \
     -c cookies.txt
   ```

3. **Try to accept invitation:**
   ```bash
   curl -X POST http://localhost:3000/api/invites/accept \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $(cat cookies.txt | grep auth_token | cut -f7)" \
     -d '{"token": "INVITE_TOKEN"}'
   # Expected: 403 with WRONG_ACCOUNT error
   ```

4. **Login as correct user:**
   ```bash
   curl -X POST http://localhost:3000/__dev/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}' \
     -c cookies.txt
   ```

5. **Accept invitation (should work):**
   ```bash
   curl -X POST http://localhost:3000/api/invites/accept \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $(cat cookies.txt | grep auth_token | cut -f7)" \
     -d '{"token": "INVITE_TOKEN"}'
   # Expected: 200 OK
   ```

---

## Testing ReturnUrl/Redirect Logic

### Test 1: Protected Route Redirect

```bash
# Visit protected route while logged out
curl -L http://localhost:5173/dashboard/settings
# Should redirect to /login?returnTo=/dashboard/settings
```

### Test 2: ReturnUrl Preservation

1. **Create session:**
   ```bash
   curl -X POST http://localhost:3000/__dev/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}' \
     -c cookies.txt
   ```

2. **Visit protected route with returnTo:**
   ```bash
   # In browser: http://localhost:5173/login?returnTo=/dashboard/settings
   # Should preserve returnTo through login flow
   ```

---

## Logging

All dev route usage is logged:

```
[DEV] Dev route used: {
  action: 'impersonate_login',
  timestamp: '2026-01-06T22:00:00.000Z',
  email: 'test@example.com',
  ip: '127.0.0.1',
  userAgent: 'curl/7.68.0'
}
```

Check server logs to see all dev route activity.

---

## Troubleshooting

### Dev Routes Return 403

**Check:**
1. `NODE_ENV` is not `production`
2. Request is from localhost (127.0.0.1 or ::1)
3. Host header includes `localhost`

**Fix:**
```bash
# Ensure NODE_ENV is development
export NODE_ENV=development

# Use localhost in URL
curl http://localhost:3000/__dev/status
# NOT: curl http://127.0.0.1:3000/__dev/status (might not work)
```

### Cookie Not Set

**Check:**
1. Using `-c cookies.txt` in curl
2. Browser allows cookies for localhost
3. Cookie domain matches (localhost)

**Fix:**
```bash
# Use -c to save cookies
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -c cookies.txt

# Use -b to send cookies
curl http://localhost:3000/api/user/me -b cookies.txt
```

### User Not Found After Creation

**Check:**
1. Database connection is working
2. User was actually created (check logs)
3. Email is correct (case-insensitive)

**Fix:**
```bash
# Check if user exists
curl http://localhost:3000/__dev/me -b cookies.txt

# Check server logs for creation message
# Should see: [DEV] Creating new user: test@example.com
```

---

## Best Practices

1. **Use descriptive test emails:**
   - `test@example.com` - General testing
   - `athena@test.com` - Specific user
   - `coparent1@test.com` - Co-parent testing

2. **Clean up after testing:**
   - Logout when done: `POST /__dev/logout`
   - Or just close browser (cookies cleared)

3. **Test both scenarios:**
   - New user creation
   - Existing user login

4. **Verify real behavior:**
   - Dev routes create real sessions
   - Test with real protected routes
   - Verify cookies work in browser

---

## Example Test Script

```bash
#!/bin/bash

# Test dev login
echo "1. Creating test user session..."
curl -X POST http://localhost:3000/__dev/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "Test", "lastName": "User"}' \
  -c cookies.txt \
  -s | jq .

# Test protected API
echo -e "\n2. Testing protected API..."
curl http://localhost:3000/api/user/me \
  -b cookies.txt \
  -s | jq .

# Test logout
echo -e "\n3. Logging out..."
curl -X POST http://localhost:3000/__dev/logout \
  -b cookies.txt \
  -c cookies.txt \
  -s | jq .

# Test API after logout (should fail)
echo -e "\n4. Testing API after logout (should fail)..."
curl http://localhost:3000/api/user/me \
  -b cookies.txt \
  -s | jq .

echo -e "\n✅ Dev testing complete!"
```

Save as `test-dev-auth.sh`, make executable (`chmod +x test-dev-auth.sh`), and run.

