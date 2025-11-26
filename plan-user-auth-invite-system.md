# Comprehensive Plan: User Account Creation, Login, and Invite System

## Executive Summary

This plan addresses all possible failure scenarios in the LiaiZen user authentication and invitation system. Based on codebase analysis and chat history, we've identified critical gaps in error handling, state management, and user experience flows that need comprehensive fixes.

**Scope**: Email/password registration, Google OAuth, login flows, invitation acceptance, and account connection.

**Priority**: Critical - Core functionality affecting user onboarding and retention.

---

## Architecture Context

### Current System Architecture

**Frontend** (`chat-client-vite/`):
- React 18+ with Vite
- Tailwind CSS (mobile-first)
- Socket.io-client for real-time
- React hooks for state management
- Deployment: Vercel

**Backend** (`chat-server/`):
- Node.js 18+ with Express.js
- Socket.io for WebSocket server
- PostgreSQL (production)
- JWT authentication
- Deployment: Railway

### Key Components

**Authentication Endpoints**:
- `POST /api/auth/register` - Registration with co-parent invitation
- `POST /api/auth/register-with-invite` - Registration from invitation token/code
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth initiation
- `POST /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/verify` - Session verification
- `POST /api/auth/logout` - Logout

**Invitation Endpoints**:
- `GET /api/invitations/validate/:token` - Validate invitation token
- `GET /api/invitations/validate-code/:code` - Validate short code
- `POST /api/invitations/accept` - Accept invitation (token)
- `POST /api/invitations/accept-code` - Accept invitation (code)
- `POST /api/invitations/create` - Create new invitation
- `GET /api/invitations` - Get user's invitations

**Database Schema**:
- `users` table: id, username, email, password_hash, google_id, oauth_provider, display_name, created_at, last_login
- `invitations` table: id, token_hash, short_code, inviter_id, invitee_email, invitee_id, status, room_id, expires_at, created_at, accepted_at
- `in_app_notifications` table: id, user_id, type, message, data, is_read, created_at

---

## Identified Issues from Chat History

### Issue 1: 401 Unauthorized Errors During Signup
**Problem**: API calls made before authentication is confirmed
- `useInAppNotifications` fetching before auth
- `useTasks` and `useContacts` making calls without auth checks
- **Status**: Partially fixed (hooks now check auth, but need comprehensive review)

### Issue 2: Missing State Variables
**Problem**: `copiedCode` state missing in InviteCoParentPage
- **Status**: Fixed

### Issue 3: Logo/Wordmark Not Displaying
**Problem**: InviteCoParentPage using wrong logo path
- **Status**: Fixed

### Issue 4: Authentication State Race Conditions
**Problem**: Components making API calls before auth state propagates
- Redirects happening before localStorage is set
- Auth verification happening after component mounts
- **Status**: Needs comprehensive fix

### Issue 5: Google OAuth Flow Gaps
**Problem**: OAuth callback handling incomplete
- Token storage timing issues
- Redirect logic after OAuth
- **Status**: Needs review and fixes

---

## Comprehensive Failure Scenarios

### Category 1: User Registration Failures

#### 1.1 Email/Password Registration

**Scenario 1.1.1: Email Already Exists**
- **Error Code**: `REG_001`
- **Current Handling**: ✅ Backend throws error
- **Frontend Handling**: ⚠️ Generic error message
- **Required Fix**: 
  - Show specific "Email already registered" message
  - Offer "Sign in instead" link
  - Pre-fill email in login form

**Scenario 1.1.2: Invalid Email Format**
- **Error Code**: Client-side validation
- **Current Handling**: ✅ Basic regex check
- **Frontend Handling**: ✅ Shows error
- **Required Fix**: 
  - Improve email validation (RFC 5322)
  - Show helpful examples
  - Real-time validation feedback

**Scenario 1.1.3: Weak Password**
- **Error Code**: Client-side validation
- **Current Handling**: ⚠️ Only checks length (4 chars)
- **Frontend Handling**: ✅ Shows error
- **Required Fix**: 
  - Add password strength indicator
  - Show requirements (min 8 chars, 1 uppercase, 1 number)
  - Real-time validation

**Scenario 1.1.4: Username Generation Failure**
- **Error Code**: `REG_009`
- **Current Handling**: ⚠️ Backend retries, but frontend doesn't handle
- **Frontend Handling**: ❌ No specific handling
- **Required Fix**: 
  - Show "Generating username..." state
  - Handle retry logic
  - Show generated username to user

**Scenario 1.1.5: Database Connection Failure**
- **Error Code**: `REG_007`
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ❌ No retry mechanism
- **Required Fix**: 
  - Show "Service temporarily unavailable" message
  - Implement exponential backoff retry
  - Log error for monitoring

**Scenario 1.1.6: Network Timeout**
- **Error Code**: Network error
- **Current Handling**: ⚠️ Generic "Unable to connect"
- **Frontend Handling**: ❌ No timeout handling
- **Required Fix**: 
  - Set request timeout (30s)
  - Show "Request taking longer than expected"
  - Offer retry button
  - Check connection status

**Scenario 1.1.7: Room Creation Failure**
- **Error Code**: `REG_005`
- **Current Handling**: ⚠️ Registration fails
- **Frontend Handling**: ❌ User sees generic error
- **Required Fix**: 
  - Create user first, then retry room creation
  - Show "Setting up your account..." state
  - Allow user to continue if room creation fails (can retry later)

**Scenario 1.1.8: Contact Creation Failure**
- **Error Code**: `REG_006`
- **Current Handling**: ⚠️ Registration fails
- **Frontend Handling**: ❌ User sees generic error
- **Required Fix**: 
  - Create user and room first
  - Contact creation is non-critical
  - Log error but allow registration to complete

#### 1.2 Google OAuth Registration

**Scenario 1.2.1: Google OAuth Popup Blocked**
- **Error Code**: Popup blocked
- **Current Handling**: ❌ No detection
- **Frontend Handling**: ❌ User doesn't know what happened
- **Required Fix**: 
  - Detect popup blocker
  - Show instructions to allow popups
  - Offer alternative (email/password signup)

**Scenario 1.2.2: Google OAuth Cancelled**
- **Error Code**: User cancelled
- **Current Handling**: ⚠️ May show error
- **Frontend Handling**: ⚠️ Inconsistent
- **Required Fix**: 
  - Silently handle cancellation
  - Return to signup form
  - No error message needed

**Scenario 1.2.3: Google Account Already Linked**
- **Error Code**: Google account exists
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ❌ No specific message
- **Required Fix**: 
  - Show "This Google account is already registered"
  - Offer "Sign in instead" link
  - Pre-fill email in login

**Scenario 1.2.4: Google OAuth Token Expired**
- **Error Code**: Token expired
- **Current Handling**: ⚠️ May fail silently
- **Frontend Handling**: ❌ No retry
- **Required Fix**: 
  - Detect expired token
  - Automatically retry OAuth flow
  - Show "Re-authenticating..." state

**Scenario 1.2.5: Google API Rate Limit**
- **Error Code**: Rate limit exceeded
- **Current Handling**: ❌ No handling
- **Frontend Handling**: ❌ Generic error
- **Required Fix**: 
  - Show "Google service temporarily unavailable"
  - Offer email/password alternative
  - Retry after delay

**Scenario 1.2.6: OAuth Callback Missing Code**
- **Error Code**: No code in callback
- **Current Handling**: ⚠️ May fail
- **Frontend Handling**: ❌ No clear error
- **Required Fix**: 
  - Validate callback parameters
  - Show "Invalid authentication response"
  - Offer retry

**Scenario 1.2.7: OAuth State Mismatch**
- **Error Code**: State mismatch
- **Current Handling**: ❌ Security risk
- **Frontend Handling**: ❌ No validation
- **Required Fix**: 
  - Implement state parameter validation
  - Reject mismatched states
  - Log security event

### Category 2: Login Failures

#### 2.1 Email/Password Login

**Scenario 2.1.1: Invalid Credentials**
- **Error Code**: 401 Unauthorized
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ "Login failed" message
- **Required Fix**: 
  - Show "Incorrect email or password"
  - Offer "Forgot password?" link (future)
  - Clear password field
  - Track failed attempts (security)

**Scenario 2.1.2: Account Not Found**
- **Error Code**: 404 or 401
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ⚠️ Same as invalid credentials
- **Required Fix**: 
  - Distinguish between "not found" and "wrong password"
  - Show "No account found with this email"
  - Offer "Create account" link

**Scenario 2.1.3: Account Locked (Future)**
- **Error Code**: Account locked
- **Current Handling**: ❌ Not implemented
- **Frontend Handling**: ❌ No handling
- **Required Fix**: 
  - Implement account lockout after N failed attempts
  - Show "Account temporarily locked"
  - Show unlock time
  - Offer "Reset password" option

**Scenario 2.1.4: Session Expired**
- **Error Code**: Token expired
- **Current Handling**: ⚠️ May redirect to login
- **Frontend Handling**: ⚠️ Inconsistent
- **Required Fix**: 
  - Detect expired token on API calls
  - Show "Your session has expired"
  - Auto-redirect to login
  - Preserve intended destination

**Scenario 2.1.5: Network Failure During Login**
- **Error Code**: Network error
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ❌ No retry
- **Required Fix**: 
  - Detect network errors
  - Show "Connection problem"
  - Offer retry button
  - Check connection status

**Scenario 2.1.6: Server Error (500)**
- **Error Code**: 500 Internal Server Error
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ❌ No specific handling
- **Required Fix**: 
  - Show "Service temporarily unavailable"
  - Log error ID for support
  - Offer retry after delay
  - Don't clear form data

#### 2.2 Google OAuth Login

**Scenario 2.2.1: Google Account Not Registered**
- **Error Code**: User not found
- **Current Handling**: ⚠️ May show error
- **Frontend Handling**: ❌ No clear message
- **Required Fix**: 
  - Show "This Google account is not registered"
  - Offer "Create account with Google" option
  - Pre-fill email in signup

**Scenario 2.2.2: OAuth Callback Error**
- **Error Code**: OAuth error parameter
- **Current Handling**: ⚠️ May not handle all errors
- **Frontend Handling**: ❌ Generic error
- **Required Fix**: 
  - Parse OAuth error codes
  - Show user-friendly messages
  - Handle access_denied, server_error, etc.

**Scenario 2.2.3: Token Exchange Failure**
- **Error Code**: Token exchange failed
- **Current Handling**: ⚠️ May fail silently
- **Frontend Handling**: ❌ No clear error
- **Required Fix**: 
  - Detect token exchange errors
  - Show "Authentication failed"
  - Offer retry
  - Log for debugging

### Category 3: Invitation Acceptance Failures

#### 3.1 Token/Code Validation

**Scenario 3.1.1: Invalid Token**
- **Error Code**: `INVALID_TOKEN` or `INVALID_CODE`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ Shows "Invalid invitation"
- **Required Fix**: 
  - Show helpful message
  - Offer "Request new invitation" option
  - Contact support link

**Scenario 3.1.2: Expired Invitation**
- **Error Code**: `EXPIRED`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ Shows "Invitation expired"
- **Required Fix**: 
  - Show expiration date
  - Offer "Request new invitation" button
  - Auto-update status in database

**Scenario 3.1.3: Already Accepted**
- **Error Code**: `ALREADY_ACCEPTED`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ Shows message
- **Required Fix**: 
  - Check if user is already connected
  - If yes, redirect to dashboard
  - If no, show "Already used" message
  - Offer "Sign in" link

**Scenario 3.1.4: Cancelled Invitation**
- **Error Code**: `CANCELLED`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ Shows message
- **Required Fix**: 
  - Show "Invitation was cancelled"
  - Offer "Request new invitation"
  - Contact support option

**Scenario 3.1.5: Declined Invitation**
- **Error Code**: `DECLINED`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ✅ Shows message
- **Required Fix**: 
  - Show "You previously declined this invitation"
  - Offer "Accept now" option (if still valid)
  - Or "Request new invitation"

**Scenario 3.1.6: Inviter Account Deleted**
- **Error Code**: `REG_008` or `INVITER_GONE`
- **Current Handling**: ⚠️ May show generic error
- **Frontend Handling**: ❌ No specific handling
- **Required Fix**: 
  - Show "The person who sent this invitation no longer has an account"
  - Offer "Create account" option
  - Contact support link

**Scenario 3.1.7: Email Mismatch (Token)**
- **Error Code**: Email validation failed
- **Current Handling**: ⚠️ Registration may fail
- **Frontend Handling**: ❌ No clear message
- **Required Fix**: 
  - Show "This invitation was sent to a different email"
  - Show expected email (masked)
  - Offer "Use different email" option
  - Or "Request new invitation to this email"

**Scenario 3.1.8: Network Error During Validation**
- **Error Code**: Network error
- **Current Handling**: ⚠️ Generic error
- **Frontend Handling**: ❌ No retry
- **Required Fix**: 
  - Show "Unable to validate invitation"
  - Offer retry button
  - Check connection status
  - Preserve token in URL

#### 3.2 Registration from Invitation

**Scenario 3.2.1: Email Already Registered**
- **Error Code**: `REG_001`
- **Current Handling**: ✅ Shows error
- **Frontend Handling**: ⚠️ Generic message
- **Required Fix**: 
  - Show "This email is already registered"
  - Offer "Sign in to accept invitation" link
  - Pre-fill email in login
  - Pass invitation token to login flow

**Scenario 3.2.2: Registration After Token Expires**
- **Error Code**: `EXPIRED`
- **Current Handling**: ⚠️ May allow registration then fail
- **Frontend Handling**: ❌ User completes form then sees error
- **Required Fix**: 
  - Validate token before showing form
  - Re-validate on form submit
  - Show "Invitation expired" before form
  - Don't allow form submission if expired

**Scenario 3.2.3: Room Creation Failure**
- **Error Code**: `REG_005`
- **Current Handling**: ⚠️ Registration fails
- **Frontend Handling**: ❌ User sees error
- **Required Fix**: 
  - Create user first
  - Retry room creation
  - Allow user to continue if room fails
  - Show "Connection in progress" state

**Scenario 3.2.4: Contact Creation Failure**
- **Error Code**: `REG_006`
- **Current Handling**: ⚠️ Registration fails
- **Frontend Handling**: ❌ User sees error
- **Required Fix**: 
  - Non-critical operation
  - Create user and room first
  - Retry contact creation in background
  - Log error but allow completion

**Scenario 3.2.5: Co-Parent Limit Reached**
- **Error Code**: Co-parent limit
- **Current Handling**: ⚠️ May not check
- **Frontend Handling**: ❌ No handling
- **Required Fix**: 
  - Check limit before registration
  - Show "You already have a co-parent connection"
  - Offer "Manage connections" link
  - Or "Remove existing connection" option

#### 3.3 Accepting Invitation (Existing User)

**Scenario 3.3.1: User Already Connected**
- **Error Code**: `ALREADY_CONNECTED`
- **Current Handling**: ✅ Shows message
- **Frontend Handling**: ✅ Redirects to dashboard
- **Required Fix**: 
  - Verify connection status
  - Show "Already connected" message
  - Redirect to chat/dashboard

**Scenario 3.3.2: Accepting Own Invitation**
- **Error Code**: Self-invitation
- **Current Handling**: ❌ May allow
- **Frontend Handling**: ❌ No prevention
- **Required Fix**: 
  - Check if inviter === invitee
  - Show "You cannot accept your own invitation"
  - Prevent acceptance

**Scenario 3.3.3: Accepting When Already Has Co-Parent**
- **Error Code**: Co-parent limit
- **Current Handling**: ⚠️ May not check
- **Frontend Handling**: ❌ No handling
- **Required Fix**: 
  - Check limit before acceptance
  - Show "You already have a co-parent"
  - Offer "Remove existing connection" option
  - Or "Decline this invitation"

**Scenario 3.3.4: Token Validation Fails After Login**
- **Error Code**: Token invalid/expired
- **Current Handling**: ⚠️ May fail silently
- **Frontend Handling**: ❌ No clear error
- **Required Fix**: 
  - Re-validate token after login
  - Show "Invitation no longer valid"
  - Offer "Request new invitation"

### Category 4: State Management Failures

#### 4.1 Authentication State

**Scenario 4.1.1: localStorage Corruption**
- **Problem**: Corrupted auth data
- **Current Handling**: ⚠️ May cause errors
- **Frontend Handling**: ❌ App may crash
- **Required Fix**: 
  - Validate localStorage data on load
  - Clear corrupted data
  - Re-authenticate if needed
  - Graceful degradation

**Scenario 4.1.2: Token Expired in localStorage**
- **Problem**: Stale token
- **Current Handling**: ⚠️ May make failed API calls
- **Frontend Handling**: ❌ 401 errors
- **Required Fix**: 
  - Check token expiration
  - Refresh token if possible
  - Redirect to login if expired
  - Preserve intended destination

**Scenario 4.1.3: Race Condition: Auth State Not Propagated**
- **Problem**: Components load before auth state
- **Current Handling**: ⚠️ Causes 401 errors
- **Frontend Handling**: ❌ Multiple failed requests
- **Required Fix**: 
  - Wait for auth verification before API calls
  - Use loading states
  - Implement auth state provider
  - Guard hooks with auth checks

**Scenario 4.1.4: Multiple Tabs/Windows**
- **Problem**: Auth state out of sync
- **Current Handling**: ❌ No sync
- **Frontend Handling**: ❌ Inconsistent state
- **Required Fix**: 
  - Use storage events to sync
  - Broadcast auth changes
  - Handle logout in other tabs
  - Sync token updates

#### 4.2 Invitation State

**Scenario 4.2.1: Token Lost in Navigation**
- **Problem**: Token in URL lost on refresh
- **Current Handling**: ⚠️ May lose token
- **Frontend Handling**: ❌ User must re-enter
- **Required Fix**: 
  - Store token in sessionStorage
  - Preserve in URL params
  - Restore on page load
  - Clear after use

**Scenario 4.2.2: Multiple Invitations**
- **Problem**: User has multiple pending invitations
- **Current Handling**: ⚠️ May not handle
- **Frontend Handling**: ❌ Confusing UX
- **Required Fix**: 
  - Show all pending invitations
  - Allow selection
  - Show inviter names
  - Allow declining others

### Category 5: UI/UX Failures

#### 5.1 Form Validation

**Scenario 5.1.1: Real-time Validation Not Working**
- **Problem**: Errors shown after submit
- **Current Handling**: ⚠️ Some validation on submit
- **Frontend Handling**: ⚠️ Inconsistent
- **Required Fix**: 
  - Real-time validation for all fields
  - Show errors as user types
  - Clear errors on correction
  - Visual indicators (red borders, icons)

**Scenario 5.1.2: Password Visibility Toggle Missing**
- **Problem**: Can't see password while typing
- **Current Handling**: ❌ No toggle
- **Frontend Handling**: ❌ Poor UX
- **Required Fix**: 
  - Add show/hide password toggle
  - Use eye icon
  - Accessible (aria-label)

**Scenario 5.1.3: Loading States Not Clear**
- **Problem**: User doesn't know if action is processing
- **Current Handling**: ⚠️ Some loading states
- **Frontend Handling**: ⚠️ Inconsistent
- **Required Fix**: 
  - Show loading spinner on all async actions
  - Disable buttons during processing
  - Show progress for long operations
  - Clear loading messages

**Scenario 5.1.4: Error Messages Not Dismissible**
- **Problem**: Errors stay on screen
- **Current Handling**: ⚠️ Some auto-dismiss
- **Frontend Handling**: ⚠️ Inconsistent
- **Required Fix**: 
  - Add dismiss button to errors
  - Auto-dismiss after 5 seconds
  - Clear on form interaction
  - Persistent errors for critical issues

#### 5.2 Navigation

**Scenario 5.2.1: Redirect Loops**
- **Problem**: Infinite redirects
- **Current Handling**: ❌ May occur
- **Frontend Handling**: ❌ Browser may block
- **Required Fix**: 
  - Track redirect attempts
  - Max 3 redirects
  - Fallback to error page
  - Log for debugging

**Scenario 5.2.2: Lost Navigation State**
- **Problem**: User intended destination lost
- **Current Handling**: ⚠️ May lose
- **Frontend Handling**: ❌ User must navigate again
- **Required Fix**: 
  - Store intended destination
  - Redirect after login
  - Preserve in URL params
  - Handle deep links

**Scenario 5.2.3: Back Button Issues**
- **Problem**: Back button breaks flow
- **Current Handling**: ⚠️ May allow back to invalid states
- **Frontend Handling**: ❌ Confusing
- **Required Fix**: 
  - Use replace instead of push for critical steps
  - Prevent back on success pages
  - Clear form on back
  - Show confirmation if needed

### Category 6: Integration Failures

#### 6.1 Email Service

**Scenario 6.1.1: Email Not Sent**
- **Problem**: Invitation email not delivered
- **Current Handling**: ⚠️ May not detect
- **Frontend Handling**: ❌ User doesn't know
- **Required Fix**: 
  - Track email send status
  - Show "Email sent" confirmation
  - Offer "Resend email" option
  - Log delivery failures

**Scenario 6.1.2: Email Service Down**
- **Problem**: Email service unavailable
- **Current Handling**: ⚠️ Registration may fail
- **Frontend Handling**: ❌ User sees error
- **Required Fix**: 
  - Queue emails for retry
  - Allow registration to complete
  - Show "Email will be sent when service is available"
  - Retry in background

**Scenario 6.1.3: Invalid Email Address**
- **Problem**: Email bounces
- **Current Handling**: ⚠️ May not detect
- **Frontend Handling**: ❌ User doesn't know
- **Required Fix**: 
  - Validate email format strictly
  - Check for common typos
  - Offer email verification (future)
  - Handle bounce notifications

#### 6.2 Database

**Scenario 6.2.1: Connection Pool Exhausted**
- **Problem**: Too many connections
- **Current Handling**: ❌ May crash
- **Frontend Handling**: ❌ Generic error
- **Required Fix**: 
  - Implement connection pooling
  - Queue requests
  - Show "Service busy, please retry"
  - Exponential backoff

**Scenario 6.2.2: Transaction Deadlock**
- **Problem**: Concurrent operations conflict
- **Current Handling**: ❌ May fail
- **Frontend Handling**: ❌ Generic error
- **Required Fix**: 
  - Retry with backoff
  - Use proper transaction isolation
  - Show "Please try again"
  - Log for monitoring

**Scenario 6.2.3: Database Migration In Progress**
- **Problem**: Schema changes block operations
- **Current Handling**: ❌ May fail
- **Frontend Handling**: ❌ Generic error
- **Required Fix**: 
  - Check migration status
  - Show "System maintenance" message
  - Queue operations
  - Retry after migration

---

## Implementation Plan

### Phase 1: Error Handling Infrastructure (Week 1)

#### 1.1 Create Error Handler Utility
**File**: `chat-client-vite/src/utils/errorHandler.js`
- Centralized error handling
- Error code mapping
- User-friendly messages
- Error logging
- Retry logic

#### 1.2 Create Auth State Manager
**File**: `chat-client-vite/src/context/AuthContext.jsx`
- Centralized auth state
- Token management
- Session verification
- State synchronization across tabs
- Loading states

#### 1.3 Create Invitation State Manager
**File**: `chat-client-vite/src/context/InvitationContext.jsx`
- Invitation token management
- Validation state
- Multiple invitation handling
- State persistence

### Phase 2: Registration Flow Fixes (Week 1-2)

#### 2.1 Email/Password Registration
**Files to Modify**:
- `chat-client-vite/src/hooks/useAuth.js`
- `chat-client-vite/src/components/LoginSignup.jsx`

**Changes**:
- Add comprehensive validation
- Improve error messages
- Add password strength indicator
- Handle all error codes
- Add retry logic
- Show loading states

#### 2.2 Google OAuth Registration
**Files to Modify**:
- `chat-client-vite/src/components/GoogleOAuthCallback.jsx`
- `chat-client-vite/src/hooks/useAuth.js`

**Changes**:
- Detect popup blocker
- Handle all OAuth errors
- Implement state parameter
- Add retry logic
- Improve error messages
- Handle token expiration

### Phase 3: Login Flow Fixes (Week 2)

#### 3.1 Email/Password Login
**Files to Modify**:
- `chat-client-vite/src/hooks/useAuth.js`
- `chat-client-vite/src/components/LoginSignup.jsx`

**Changes**:
- Distinguish error types
- Add "Forgot password" placeholder
- Handle session expiration
- Add retry logic
- Improve error messages

#### 3.2 Google OAuth Login
**Files to Modify**:
- `chat-client-vite/src/components/GoogleOAuthCallback.jsx`
- `chat-client-vite/src/hooks/useAuth.js`

**Changes**:
- Handle all OAuth errors
- Detect account not registered
- Add retry logic
- Improve error messages

### Phase 4: Invitation Flow Fixes (Week 2-3)

#### 4.1 Invitation Validation
**Files to Modify**:
- `chat-client-vite/src/components/AcceptInvitationPage.jsx`
- `chat-client-vite/src/hooks/useInvitations.js`

**Changes**:
- Handle all validation errors
- Show helpful messages
- Add retry logic
- Preserve token in state
- Handle network errors

#### 4.2 Registration from Invitation
**Files to Modify**:
- `chat-client-vite/src/components/AcceptInvitationPage.jsx`
- `chat-server/auth.js`

**Changes**:
- Validate token before form
- Re-validate on submit
- Handle all error codes
- Create user first, then room
- Non-critical operations don't block
- Show progress states

#### 4.3 Accepting Invitation (Existing User)
**Files to Modify**:
- `chat-client-vite/src/components/AcceptInvitationPage.jsx`
- `chat-server/server.js` (accept endpoints)

**Changes**:
- Check co-parent limit
- Handle already connected
- Prevent self-invitation
- Handle all error codes
- Show helpful messages

### Phase 5: State Management Fixes (Week 3)

#### 5.1 Authentication State
**Files to Modify**:
- `chat-client-vite/src/hooks/useAuth.js`
- `chat-client-vite/src/context/AuthContext.jsx` (new)
- All hooks making API calls

**Changes**:
- Centralize auth state
- Wait for verification before API calls
- Handle token expiration
- Sync across tabs
- Validate localStorage

#### 5.2 Invitation State
**Files to Modify**:
- `chat-client-vite/src/components/AcceptInvitationPage.jsx`
- `chat-client-vite/src/context/InvitationContext.jsx` (new)

**Changes**:
- Persist token in sessionStorage
- Restore on page load
- Handle multiple invitations
- Clear after use

### Phase 6: UI/UX Improvements (Week 3-4)

#### 6.1 Form Validation
**Files to Modify**:
- `chat-client-vite/src/components/LoginSignup.jsx`
- `chat-client-vite/src/components/AcceptInvitationPage.jsx`
- `chat-client-vite/src/components/InviteCoParentPage.jsx`

**Changes**:
- Real-time validation
- Password visibility toggle
- Better error display
- Loading states
- Dismissible errors

#### 6.2 Navigation
**Files to Modify**:
- `chat-client-vite/src/App.jsx`
- All page components

**Changes**:
- Prevent redirect loops
- Preserve intended destination
- Handle back button
- Deep link support

### Phase 7: Integration Fixes (Week 4)

#### 7.1 Email Service
**Files to Modify**:
- `chat-server/emailService.js`
- `chat-server/server.js` (invitation endpoints)

**Changes**:
- Track email send status
- Queue for retry
- Handle service down
- Don't block registration

#### 7.2 Database
**Files to Modify**:
- `chat-server/dbPostgres.js`
- All database operations

**Changes**:
- Connection pooling
- Retry logic
- Transaction handling
- Migration status checks

---

## Error Code Reference

### Registration Errors (REG_*)
- `REG_001`: Email already exists
- `REG_002`: Invalid invitation token
- `REG_003`: Invitation expired
- `REG_004`: Already accepted
- `REG_005`: Room creation failed
- `REG_006`: Contact creation failed
- `REG_007`: Database error
- `REG_008`: Inviter account deleted
- `REG_009`: Username generation failed

### Invitation Errors
- `TOKEN_REQUIRED`: Token missing
- `INVALID_TOKEN`: Token invalid
- `INVALID_CODE`: Short code invalid
- `EXPIRED`: Invitation expired
- `ALREADY_ACCEPTED`: Already accepted
- `CANCELLED`: Invitation cancelled
- `DECLINED`: Invitation declined
- `ALREADY_CONNECTED`: Users already connected
- `COPARENT_LIMIT`: Co-parent limit reached

### OAuth Errors
- `popup_blocked`: Popup blocked by browser
- `access_denied`: User denied access
- `server_error`: OAuth server error
- `invalid_request`: Invalid OAuth request
- `invalid_client`: Invalid OAuth client
- `invalid_grant`: Invalid OAuth grant
- `unauthorized_client`: Unauthorized client
- `unsupported_response_type`: Unsupported response type
- `invalid_scope`: Invalid OAuth scope

---

## Testing Checklist

### Registration Tests
- [ ] Email already exists
- [ ] Invalid email format
- [ ] Weak password
- [ ] Network timeout
- [ ] Server error (500)
- [ ] Database error
- [ ] Room creation failure
- [ ] Contact creation failure
- [ ] Username generation failure

### Google OAuth Tests
- [ ] Popup blocked
- [ ] User cancels
- [ ] Account already linked
- [ ] Token expired
- [ ] Rate limit
- [ ] Callback missing code
- [ ] State mismatch
- [ ] Account not registered

### Login Tests
- [ ] Invalid credentials
- [ ] Account not found
- [ ] Session expired
- [ ] Network failure
- [ ] Server error
- [ ] Token expired

### Invitation Tests
- [ ] Invalid token
- [ ] Expired invitation
- [ ] Already accepted
- [ ] Cancelled invitation
- [ ] Declined invitation
- [ ] Inviter deleted
- [ ] Email mismatch
- [ ] Network error
- [ ] Co-parent limit
- [ ] Already connected
- [ ] Self-invitation

### State Management Tests
- [ ] localStorage corruption
- [ ] Token expired
- [ ] Race conditions
- [ ] Multiple tabs
- [ ] Token lost in navigation
- [ ] Multiple invitations

### UI/UX Tests
- [ ] Real-time validation
- [ ] Password visibility
- [ ] Loading states
- [ ] Error dismissal
- [ ] Redirect loops
- [ ] Navigation state
- [ ] Back button

---

## Success Metrics

### Error Reduction
- **Target**: < 1% of registration attempts result in unhandled errors
- **Target**: < 0.5% of login attempts result in unhandled errors
- **Target**: < 2% of invitation acceptances result in unhandled errors

### User Experience
- **Target**: All errors show user-friendly messages
- **Target**: All async operations show loading states
- **Target**: All forms have real-time validation

### Recovery
- **Target**: 90% of recoverable errors have retry options
- **Target**: All network errors offer retry
- **Target**: All expired tokens trigger re-authentication

---

## Risk Assessment

### High Risk
- State management race conditions
- Token expiration handling
- Database transaction failures
- Email service failures blocking registration

### Medium Risk
- OAuth flow errors
- Invitation validation edge cases
- Multiple invitation handling
- Navigation state preservation

### Low Risk
- UI/UX improvements
- Form validation enhancements
- Error message improvements

---

## Dependencies

### Backend
- All endpoints must return consistent error codes
- Error codes must be documented
- Database operations must be transactional
- Email service must be resilient

### Frontend
- Error handler utility
- Auth context provider
- Invitation context provider
- All hooks must check auth state

---

## Timeline

**Week 1**: Error handling infrastructure + Registration fixes
**Week 2**: Login fixes + Invitation validation fixes
**Week 3**: State management + Registration from invitation
**Week 4**: UI/UX improvements + Integration fixes + Testing

**Total**: 4 weeks for comprehensive fix

---

## Next Steps

1. Review and approve this plan
2. Create detailed task breakdown
3. Set up error tracking/monitoring
4. Begin Phase 1 implementation
5. Test each phase before moving to next

---

*Plan created: 2025-01-27*
*Based on codebase analysis and chat history review*

