# Task List: User Authentication & Invitation System Fixes

**Feature**: Comprehensive error handling and state management for user account creation, login, and invitation acceptance
**Priority**: Critical
**Estimated Total Time**: 4 weeks
**Plan Reference**: `plan-user-auth-invite-system.md`

---

## Phase 1: Error Handling Infrastructure

### Task 1.1: Enhance Error Handler Utility
**Type**: infrastructure
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: []

**Description**:
Enhance existing `chat-client-vite/src/utils/errorHandler.jsx` with:
- Error code mapping (REG_*, OAuth errors, invitation errors)
- User-friendly error messages
- Retry logic with exponential backoff
- Error categorization (network, validation, server, auth)
- Error logging with context

**Files**:
- Path: `chat-client-vite/src/utils/errorHandler.jsx`
  Action: enhance

**Acceptance Criteria**:
- [ ] Error code mapping covers all REG_* codes
- [ ] OAuth error codes mapped to user messages
- [ ] Invitation error codes mapped
- [ ] Retry logic implemented with max 3 retries
- [ ] Exponential backoff (1s, 2s, 4s)
- [ ] Error logging includes context (user, endpoint, timestamp)
- [ ] Network errors distinguished from server errors

---

### Task 1.2: Create Auth Context Provider
**Type**: infrastructure
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 6
**Dependencies**: [Task 1.1]

**Description**:
Create centralized authentication state management:
- AuthContext provider with React Context API
- Token management (storage, validation, refresh)
- Session verification on mount
- State synchronization across tabs (storage events)
- Loading states for auth operations
- Auth state guards for API calls

**Files**:
- Path: `chat-client-vite/src/context/AuthContext.jsx`
  Action: create

**Acceptance Criteria**:
- [ ] AuthContext provides: isAuthenticated, username, email, token, isCheckingAuth
- [ ] Token stored securely in localStorage
- [ ] Token expiration checked before API calls
- [ ] Session verified on mount
- [ ] State syncs across tabs via storage events
- [ ] Loading states prevent race conditions
- [ ] Auth guards prevent API calls before auth confirmed

---

### Task 1.3: Create Invitation Context Provider
**Type**: infrastructure
**Priority**: high
**Complexity**: small
**Estimated Hours**: 3
**Dependencies**: []

**Description**:
Create invitation state management:
- InvitationContext provider
- Token/code persistence in sessionStorage
- Token restoration on page load
- Multiple invitation handling
- Validation state management

**Files**:
- Path: `chat-client-vite/src/context/InvitationContext.jsx`
  Action: create

**Acceptance Criteria**:
- [ ] InvitationContext provides: token, code, validationResult, is validating
- [ ] Token persisted in sessionStorage
- [ ] Token restored on page load
- [ ] Multiple invitations handled
- [ ] Validation state managed centrally

---

## Phase 2: Registration Flow Fixes

### Task 2.1: Enhance Email/Password Registration Error Handling
**Type**: feature
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 5
**Dependencies**: [Task 1.1, Task 1.2]

**Description**:
Improve registration error handling in `useAuth.js` and `LoginSignup.jsx`:
- Handle all REG_* error codes with specific messages
- Add "Sign in instead" link for REG_001 (email exists)
- Improve password validation (strength indicator)
- Add retry logic for network errors
- Show loading states during registration
- Handle username generation failures gracefully

**Files**:
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] All REG_* codes show specific error messages
- [ ] REG_001 shows "Email already registered" with "Sign in instead" link
- [ ] Password strength indicator added
- [ ] Network errors show retry button
- [ ] Loading spinner during registration
- [ ] Username generation failures handled gracefully
- [ ] Form data preserved on retry

---

### Task 2.2: Add Password Strength Indicator
**Type**: feature
**Priority**: medium
**Complexity**: small
**Estimated Hours**: 3
**Dependencies**: [Task 2.1]

**Description**:
Add password strength indicator component:
- Real-time strength calculation
- Visual indicator (weak/medium/strong)
- Requirements checklist (min 8 chars, 1 uppercase, 1 number)
- Accessible (aria-labels)

**Files**:
- Path: `chat-client-vite/src/components/PasswordStrengthIndicator.jsx`
  Action: create
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify (integrate component)

**Acceptance Criteria**:
- [ ] Strength calculated in real-time
- [ ] Visual indicator (color-coded)
- [ ] Requirements checklist shown
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Mobile-responsive

---

### Task 2.3: Enhance Google OAuth Error Handling
**Type**: feature
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 5
**Dependencies**: [Task 1.1, Task 1.2]

**Description**:
Improve Google OAuth error handling:
- Detect popup blocker
- Handle all OAuth error codes (access_denied, server_error, etc.)
- Implement state parameter for CSRF protection
- Handle token expiration with retry
- Show user-friendly error messages
- Offer email/password alternative

**Files**:
- Path: `chat-client-vite/src/components/GoogleOAuthCallback.jsx`
  Action: modify
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify (handleGoogleLogin)

**Acceptance Criteria**:
- [ ] Popup blocker detected with instructions
- [ ] All OAuth error codes handled
- [ ] State parameter implemented and validated
- [ ] Token expiration detected and retried
- [ ] User-friendly error messages
- [ ] "Try email/password instead" option shown

---

## Phase 3: Login Flow Fixes

### Task 3.1: Enhance Email/Password Login Error Handling
**Type**: feature
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: [Task 1.1, Task 1.2]

**Description**:
Improve login error handling:
- Distinguish "account not found" from "wrong password"
- Add "Forgot password?" placeholder link
- Handle session expiration gracefully
- Add retry logic for network errors
- Preserve form data on retry
- Clear password field on error

**Files**:
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify (handleLogin)
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] "Account not found" vs "Wrong password" distinguished
- [ ] "Forgot password?" link added (placeholder)
- [ ] Session expiration detected and handled
- [ ] Network errors show retry button
- [ ] Form data preserved (except password)
- [ ] Password field cleared on error

---

### Task 3.2: Enhance Google OAuth Login Error Handling
**Type**: feature
**Priority**: high
**Complexity**: small
**Estimated Hours**: 3
**Dependencies**: [Task 2.3]

**Description**:
Improve Google OAuth login errors:
- Handle "account not registered" case
- Show "Create account with Google" option
- Handle OAuth callback errors
- Handle token exchange failures

**Files**:
- Path: `chat-client-vite/src/components/GoogleOAuthCallback.jsx`
  Action: modify
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify

**Acceptance Criteria**:
- [ ] "Account not registered" detected
- [ ] "Create account" option shown
- [ ] OAuth callback errors handled
- [ ] Token exchange failures handled with retry

---

## Phase 4: Invitation Flow Fixes

### Task 4.1: Enhance Invitation Validation Error Handling
**Type**: feature
**Priority**: critical
**Complexity**: medium
**Estimated Hours**: 5
**Dependencies**: [Task 1.1, Task 1.3]

**Description**:
Improve invitation validation error handling:
- Handle all validation error codes with helpful messages
- Add "Request new invitation" option for expired/cancelled
- Handle network errors with retry
- Preserve token in sessionStorage
- Show inviter name/email when available

**Files**:
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-client-vite/src/hooks/useInvitations.js`
  Action: modify

**Acceptance Criteria**:
- [ ] All validation error codes show helpful messages
- [ ] "Request new invitation" button for expired/cancelled
- [ ] Network errors show retry button
- [ ] Token preserved in sessionStorage
- [ ] Inviter name/email displayed
- [ ] Loading states during validation

---

### Task 4.2: Fix Registration from Invitation Flow
**Type**: feature
**Priority**: critical
**Complexity**: high
**Estimated Hours**: 6
**Dependencies**: [Task 1.1, Task 1.2, Task 4.1]

**Description**:
Fix registration from invitation:
- Validate token before showing form
- Re-validate token on form submit
- Handle all error codes (REG_001, REG_002, etc.)
- Create user first, then room (non-blocking)
- Contact creation non-critical
- Show progress states
- Handle co-parent limit check

**Files**:
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-server/auth.js`
  Action: modify (registerFromInvitation, registerFromShortCode)

**Acceptance Criteria**:
- [ ] Token validated before form shown
- [ ] Token re-validated on submit
- [ ] All error codes handled with specific messages
- [ ] User created first, room created after
- [ ] Contact creation doesn't block registration
- [ ] Progress states shown ("Creating account...", "Setting up connection...")
- [ ] Co-parent limit checked before registration

---

### Task 4.3: Fix Accepting Invitation (Existing User)
**Type**: feature
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: [Task 1.1, Task 4.1]

**Description**:
Fix accepting invitation for existing users:
- Check co-parent limit before acceptance
- Handle "already connected" case
- Prevent self-invitation
- Handle all error codes
- Show helpful messages

**Files**:
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-server/server.js` (accept endpoints)
  Action: modify

**Acceptance Criteria**:
- [ ] Co-parent limit checked before acceptance
- [ ] "Already connected" detected and handled
- [ ] Self-invitation prevented
- [ ] All error codes handled
- [ ] Helpful error messages shown

---

## Phase 5: State Management Fixes

### Task 5.1: Fix Authentication State Race Conditions
**Type**: bugfix
**Priority**: critical
**Complexity**: high
**Estimated Hours**: 6
**Dependencies**: [Task 1.2]

**Description**:
Fix race conditions in authentication state:
- Wait for auth verification before API calls
- Update all hooks to check auth state
- Fix localStorage validation
- Handle token expiration
- Sync state across tabs

**Files**:
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify
- Path: `chat-client-vite/src/hooks/useTasks.js`
  Action: modify
- Path: `chat-client-vite/src/hooks/useContacts.js`
  Action: modify
- Path: `chat-client-vite/src/hooks/useInAppNotifications.js`
  Action: modify
- Path: `chat-client-vite/src/ChatRoom.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] All hooks wait for auth verification
- [ ] No API calls before auth confirmed
- [ ] localStorage validated on load
- [ ] Token expiration handled
- [ ] State syncs across tabs
- [ ] No 401 errors during signup/login

---

### Task 5.2: Fix Invitation State Persistence
**Type**: bugfix
**Priority**: high
**Complexity**: small
**Estimated Hours**: 2
**Dependencies**: [Task 1.3]

**Description**:
Fix invitation token persistence:
- Store token in sessionStorage
- Restore on page load
- Clear after successful use
- Handle multiple invitations

**Files**:
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-client-vite/src/context/InvitationContext.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] Token stored in sessionStorage
- [ ] Token restored on page load
- [ ] Token cleared after successful use
- [ ] Multiple invitations handled

---

## Phase 6: UI/UX Improvements

### Task 6.1: Add Real-time Form Validation
**Type**: feature
**Priority**: medium
**Complexity**: medium
**Estimated Hours**: 5
**Dependencies**: []

**Description**:
Add real-time validation to all forms:
- Email validation as user types
- Password validation with strength
- Name validation
- Show errors immediately
- Clear errors on correction
- Visual indicators (red borders, icons)

**Files**:
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/InviteCoParentPage.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] Email validated in real-time
- [ ] Password validated with strength
- [ ] Name validated
- [ ] Errors shown immediately
- [ ] Errors clear on correction
- [ ] Visual indicators (red borders, error icons)
- [ ] Accessible (aria-labels, aria-invalid)

---

### Task 6.2: Add Password Visibility Toggle
**Type**: feature
**Priority**: low
**Complexity**: small
**Estimated Hours**: 2
**Dependencies**: []

**Description**:
Add show/hide password toggle:
- Eye icon button
- Toggle password visibility
- Accessible (aria-label)
- Mobile-friendly

**Files**:
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] Eye icon button added
- [ ] Password visibility toggles
- [ ] Accessible (aria-label="Show password")
- [ ] Mobile-friendly (44px touch target)

---

### Task 6.3: Improve Loading States
**Type**: feature
**Priority**: medium
**Complexity**: small
**Estimated Hours**: 3
**Dependencies**: []

**Description**:
Improve loading states across all forms:
- Loading spinners on all async actions
- Disable buttons during processing
- Show progress for long operations
- Clear loading messages

**Files**:
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/InviteCoParentPage.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] Loading spinners on all async actions
- [ ] Buttons disabled during processing
- [ ] Progress shown for long operations
- [ ] Loading messages clear on completion

---

### Task 6.4: Improve Error Message Display
**Type**: feature
**Priority**: medium
**Complexity**: small
**Estimated Hours**: 2
**Dependencies**: [Task 1.1]

**Description**:
Improve error message display:
- Dismissible errors (X button)
- Auto-dismiss after 5 seconds
- Clear on form interaction
- Persistent errors for critical issues
- Better styling (red background, icon)

**Files**:
- Path: `chat-client-vite/src/components/LoginSignup.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify
- Path: `chat-client-vite/src/components/ui/ErrorMessage.jsx`
  Action: create

**Acceptance Criteria**:
- [ ] Dismissible errors (X button)
- [ ] Auto-dismiss after 5 seconds
- [ ] Clear on form interaction
- [ ] Persistent for critical errors
- [ ] Better styling (red background, error icon)

---

### Task 6.5: Fix Navigation Issues
**Type**: bugfix
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: []

**Description**:
Fix navigation issues:
- Prevent redirect loops (max 3 redirects)
- Preserve intended destination
- Handle back button properly
- Support deep links

**Files**:
- Path: `chat-client-vite/src/App.jsx`
  Action: modify
- Path: `chat-client-vite/src/hooks/useAuth.js`
  Action: modify
- Path: `chat-client-vite/src/components/AcceptInvitationPage.jsx`
  Action: modify

**Acceptance Criteria**:
- [ ] Redirect loops prevented (max 3)
- [ ] Intended destination preserved
- [ ] Back button handled properly
- [ ] Deep links supported
- [ ] Navigation state logged for debugging

---

## Phase 7: Integration Fixes

### Task 7.1: Improve Email Service Error Handling
**Type**: feature
**Priority**: medium
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: []

**Description**:
Improve email service error handling:
- Track email send status
- Queue emails for retry
- Don't block registration on email failure
- Show "Email will be sent when service is available"
- Log delivery failures

**Files**:
- Path: `chat-server/emailService.js`
  Action: modify
- Path: `chat-server/server.js` (invitation endpoints)
  Action: modify

**Acceptance Criteria**:
- [ ] Email send status tracked
- [ ] Emails queued for retry
- [ ] Registration doesn't block on email failure
- [ ] User sees "Email will be sent" message
- [ ] Delivery failures logged

---

### Task 7.2: Improve Database Error Handling
**Type**: feature
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 5
**Dependencies**: []

**Description**:
Improve database error handling:
- Connection pooling
- Retry logic for transient errors
- Transaction handling
- Migration status checks
- User-friendly error messages

**Files**:
- Path: `chat-server/dbPostgres.js`
  Action: modify
- Path: `chat-server/auth.js`
  Action: modify

**Acceptance Criteria**:
- [ ] Connection pooling implemented
- [ ] Retry logic for transient errors
- [ ] Transactions handled properly
- [ ] Migration status checked
- [ ] User-friendly error messages

---

## Testing Tasks

### Task 8.1: Create Test Suite for Registration
**Type**: testing
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 6
**Dependencies**: [Phase 2]

**Description**:
Create comprehensive tests for registration:
- Email already exists
- Invalid email format
- Weak password
- Network timeout
- Server error
- Database error
- Room creation failure

**Files**:
- Path: `chat-client-vite/src/__tests__/registration.test.js`
  Action: create
- Path: `chat-server/__tests__/auth.test.js`
  Action: create

**Acceptance Criteria**:
- [ ] All registration scenarios tested
- [ ] Error codes verified
- [ ] User messages verified
- [ ] Retry logic tested

---

### Task 8.2: Create Test Suite for Login
**Type**: testing
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 4
**Dependencies**: [Phase 3]

**Description**:
Create comprehensive tests for login:
- Invalid credentials
- Account not found
- Session expired
- Network failure
- Server error

**Files**:
- Path: `chat-client-vite/src/__tests__/login.test.js`
  Action: create
- Path: `chat-server/__tests__/auth.test.js`
  Action: modify

**Acceptance Criteria**:
- [ ] All login scenarios tested
- [ ] Error handling verified
- [ ] Retry logic tested

---

### Task 8.3: Create Test Suite for Invitations
**Type**: testing
**Priority**: high
**Complexity**: medium
**Estimated Hours**: 6
**Dependencies**: [Phase 4]

**Description**:
Create comprehensive tests for invitations:
- Invalid token
- Expired invitation
- Already accepted
- Cancelled invitation
- Email mismatch
- Network error
- Co-parent limit

**Files**:
- Path: `chat-client-vite/src/__tests__/invitations.test.js`
  Action: create
- Path: `chat-server/__tests__/invitations.test.js`
  Action: create

**Acceptance Criteria**:
- [ ] All invitation scenarios tested
- [ ] Error codes verified
- [ ] User messages verified

---

## Summary

**Total Tasks**: 23
**Total Estimated Hours**: 96 hours (~2.5 weeks full-time, 4 weeks part-time)

**Critical Path**:
1. Error Handler (Task 1.1)
2. Auth Context (Task 1.2)
3. Registration Fixes (Task 2.1, 2.3)
4. Login Fixes (Task 3.1)
5. Invitation Fixes (Task 4.1, 4.2)
6. State Management (Task 5.1)
7. Testing (Task 8.1, 8.2, 8.3)

**Recommended Agent Assignments**:
- **backend-architect**: Tasks 7.1, 7.2 (database, email service)
- **frontend-specialist**: Tasks 6.1-6.5 (UI/UX improvements)
- **full-stack-developer**: Tasks 2.1-2.3, 3.1-3.2, 4.1-4.3 (end-to-end flows)
- **testing-specialist**: Tasks 8.1-8.3 (test suites)

---

*Tasks created: 2025-01-27*
*Based on: plan-user-auth-invite-system.md*

