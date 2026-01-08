# Signup Flow Quick Reference

**For:** Developers implementing or debugging signup functionality

## Key Files

### Frontend
- **Form Component:** `chat-client-vite/src/features/auth/components/LoginSignup.jsx`
- **Auth Hook:** `chat-client-vite/src/features/auth/model/useAuth.js`
- **Auth Context:** `chat-client-vite/src/context/AuthContext.jsx`
- **Validators:** `chat-client-vite/src/utils/validators.js`
- **API Queries:** `chat-client-vite/src/utils/authQueries.js`
- **Redirect Logic:** `chat-client-vite/src/features/auth/model/useAuthRedirect.js`

### Backend
- **Signup Route:** `chat-server/routes/auth/signup.js`
- **Validation:** `chat-server/routes/auth/signupValidation.js`
- **User Creation:** `chat-server/auth/registration.js` → `chat-server/auth/user.js`
- **Password Validator:** `chat-server/libs/password-validator.js`

## Validation Rules

### Email
- Required
- Format: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Normalized: lowercase, trimmed

### Password
- Required
- Minimum: 10 characters
- Maximum: 128 characters
- Blocked: Common passwords (see `BLOCKED_PASSWORDS`)
- No complexity requirements

### Names
- First Name: Required, trimmed
- Last Name: Required, trimmed

## API Endpoint

```
POST /api/auth/signup
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "context": {},
  "website": ""  // Honeypot
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": { "id": 123, "email": "...", ... },
  "token": "jwt-token..."
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Email already exists (code: `REG_001`)
- `429` - Rate limit exceeded
- `500` - Server error

## Post-Signup Flow

1. User submits form
2. Frontend validates
3. API call to `/api/auth/signup`
4. Backend validates & creates user
5. Token generated & cookie set
6. Frontend updates auth state
7. **Redirect to:** `/invite-coparent`

## Common Issues

### "Email already exists"
- Check if user exists in database
- Error code: `REG_001`
- Status: `409`

### "Password too weak"
- Must be 10+ characters
- Check blocked passwords list
- Status: `400`

### Cookie not set
- Verify `setAuthCookie` is called in signup route
- Check cookie security flags (HttpOnly, Secure, SameSite)

### Redirect not working
- Check `isNewSignup` flag is set
- Verify `useAuthRedirect` hook is called
- Check `NavigationPaths.INVITE_COPARENT` constant

## Testing

### Manual Test
1. Go to `/signup`
2. Fill form with valid data
3. Submit
4. Should redirect to `/invite-coparent`
5. Should be authenticated

### Test Invalid Cases
- Empty fields → Validation errors
- Invalid email → "Invalid email address"
- Weak password → "Password must be at least 10 characters"
- Existing email → "Email already exists"

## Constants

- **Password Min Length:** 10 characters
- **Redirect After Signup:** `/invite-coparent`
- **Redirect After Login:** `/`
- **Redirect Delay:** 100ms (signup), 0ms (login)

---

See `SIGNUP_FLOW_SPECIFICATION.md` for complete details.

