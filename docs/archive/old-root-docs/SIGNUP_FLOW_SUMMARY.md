# Signup Flow - Quick Summary

## What Happens When User Clicks "Create Account"

### Frontend (User's Browser)
1. **Form Submission**
   - User fills: Email, Password, First Name, Last Name
   - Clicks "Create Account" button
   - Form validates input

2. **API Request**
   - POST to `/api/auth/signup`
   - Includes honeypot field (spam protection)
   - Shows loading state

3. **Response Handling**
   - If success: Sets authenticated state
   - Stores user info in localStorage
   - Cookie already set by backend
   - Redirects to `/invite-coparent` page

### Backend (Server)

1. **Security Checks**
   - ✅ Rate limiting (prevents abuse)
   - ✅ Honeypot check (blocks bots)
   - ✅ Disposable email check (blocks spam)

2. **Validation**
   - ✅ Email format valid
   - ✅ Password meets requirements (min 10 chars)
   - ✅ First/Last name provided

3. **User Creation**
   - ✅ Check email doesn't exist
   - ✅ Hash password (bcrypt)
   - ✅ Insert into `users` table
   - ✅ Create `user_context` record
   - ✅ Create welcome & onboarding tasks
   - ✅ Assign default 'user' role
   - ✅ Create Neo4j user node

4. **Authentication**
   - ✅ Generate JWT token
   - ✅ Set `auth_token` cookie
   - ✅ Return user object

### Database Operations

**Tables Modified**:
- `users` - New user record
- `user_context` - Default context
- `tasks` - Welcome + onboarding tasks
- `user_roles` - Default role assignment
- `Neo4j` - User node created

**NOT Created**:
- ❌ Private room (removed - only shared rooms now)
- ❌ Email verification (exists but not enforced)

### What User Sees

**Success Flow**:
1. Click "Create Account"
2. Loading spinner appears
3. Form submits (~1-2 seconds)
4. Redirects to `/invite-coparent` page
5. User is logged in

**Error Flow**:
1. Click "Create Account"
2. Error message appears
3. Form stays on page
4. User can fix and retry

### Redirect Logic

**After Signup**:
- Default: `/invite-coparent` (invite your co-parent)
- If `returnUrl` stored: Goes to that URL instead

**After Login**:
- Default: `/` (home/dashboard)
- If `returnUrl` stored: Goes to that URL instead

## Key Points

✅ **Secure**: Rate limiting, honeypot, password hashing
✅ **Fast**: ~1-2 seconds total
✅ **Complete**: User, context, tasks, permissions all created
✅ **Logged In**: User immediately authenticated
✅ **Redirected**: Goes to invite coparent page

⚠️ **Missing**: Email verification enforcement
⚠️ **Missing**: Welcome email
⚠️ **Missing**: Private room (intentionally removed)

## Total Time

- **Frontend validation**: < 100ms
- **API request**: 500ms - 2s (depends on DB)
- **Redirect**: 100ms delay
- **Total**: ~1-3 seconds

## Files Involved

**Frontend**:
- `LoginSignup.jsx` - Form component
- `useEmailAuth.js` - Signup hook
- `authQueries.js` - API call
- `useAuthRedirect.js` - Redirect logic

**Backend**:
- `routes/auth/signup.js` - Route handler
- `auth/registration.js` - User creation
- `auth/user.js` - Database operations
- `auth/context.js` - Context setup
- `auth/tasks.js` - Task creation

