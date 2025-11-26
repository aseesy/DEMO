# Feature Specification: Improved Co-Parent Invitation Workflow

## Overview

**Feature Name**: Improved Co-Parent Invitation Workflow
**Business Objective**: Enable users to seamlessly invite co-parents AND accept invitations, completing the full invitation lifecycle
**Priority**: Critical - Core functionality is broken
**Estimated Complexity**: Medium-High

## Problem Statement

### Current State Analysis

The invitation system has a **complete backend implementation** but an **incomplete frontend implementation**. Users can neither reliably send invitations nor accept them through the UI.

### Root Cause Analysis

After thorough investigation, here are the **specific issues** preventing the invitation workflow from functioning:

#### Issue 1: No `/accept-invite` Route
**Location**: `chat-client-vite/src/App.jsx:25-43`
**Problem**: When a new user clicks the email link `https://coparentliaizen.com/accept-invite?token=TOKEN`, there is no route handler. The app returns a 404 or falls through to the root route.

**Evidence**: Current routes are:
- `/` - ChatRoom
- `/signin` - LoginSignup
- `/auth/google/callback` - GoogleOAuthCallback
- `/ui-showcase` - UIShowcase
- `/privacy` - PrivacyPage
- `/terms` - TermsPage

**Missing**: `/accept-invite` route

#### Issue 2: Wrong Signup Endpoint Called
**Location**: `chat-client-vite/src/hooks/useAuth.js:195-258`
**Problem**: `handleSignup()` calls `/api/auth/signup` instead of `/api/auth/register` (with co-parent email) or `/api/auth/register-from-invite` (for invited users).

**Evidence**:
```javascript
// Current (wrong for invitation flow):
const response = await apiPost('/api/auth/signup', {
  email: cleanEmail,
  password: cleanPassword,
  context: {},
});
```

**Should use**:
- `/api/auth/register` for inviting user (requires `coParentEmail`)
- `/api/auth/register-from-invite` for invited user (requires `token`)

#### Issue 3: No Token Validation Before Signup
**Location**: `chat-client-vite/src/components/LoginSignup.jsx`
**Problem**: When a user has a pending invite code, the frontend never:
1. Validates the token via `GET /api/invitations/validate/:token`
2. Pre-fills the invitee's email from the invitation
3. Shows who invited them or what room they're joining

**Evidence**: The component only stores the invite code in localStorage but never uses it.

#### Issue 4: Room Join Endpoint Mismatch
**Location**: `chat-client-vite/src/ChatRoom.jsx:604-612`
**Problem**: The frontend calls `/api/room/join` with `{ inviteCode, username }`, but the backend expects the invitation workflow to use `/api/invitations/accept` with a proper invitation token.

**Evidence**:
```javascript
// Frontend calls this (ChatRoom.jsx:604):
fetch(`${API_BASE_URL}/api/room/join`, {
  body: JSON.stringify({ inviteCode: pendingInviteCode, username })
});

// Backend expects this (server.js:3154):
POST /api/invitations/accept
{ token: INVITATION_TOKEN }
```

#### Issue 5: No UI for Inviting a Co-Parent
**Location**: Entire frontend
**Problem**: There is no component or UI for an authenticated user to invite their co-parent. The registration flow requires a `coParentEmail` but there's no form field for it.

**Evidence**: `LoginSignup.jsx` only has email, password, and username fields during signup. No co-parent email field.

#### Issue 6: No In-App Notifications UI
**Location**: Entire frontend
**Problem**: When an existing user receives an invitation, a notification is created in the database, but there's no UI to display it. Users never see "Alice invited you to co-parent."

**Evidence**:
- Backend creates notifications via `notificationManager.createInvitationNotification()`
- No `NotificationsPanel` or notification display component exists
- No bell icon or notification indicator in the UI

#### Issue 7: No Invitation Management UI
**Location**: Entire frontend
**Problem**: Users cannot view, resend, or cancel their sent invitations.

**Evidence**: Backend has these endpoints but no frontend uses them:
- `GET /api/invitations` - List sent/received invitations
- `POST /api/invitations/resend/:id` - Resend expired invitation
- `DELETE /api/invitations/:id` - Cancel pending invitation

---

## User Stories

### US-1: New User Registration with Co-Parent Invitation
**As a** new user
**I want to** create an account and immediately invite my co-parent
**So that** we can start using LiaiZen together

**Acceptance Criteria**:
- [ ] Registration form includes a required "Co-Parent Email" field
- [ ] Upon successful registration, an invitation is sent to the co-parent's email
- [ ] User sees confirmation that invitation was sent
- [ ] If co-parent already has an account, they receive an in-app notification instead of email
- [ ] Error handling for invalid/duplicate emails
- [ ] Clear messaging about the 1 co-parent limit (MVP)

### US-2: Accept Invitation as New User (via Email Link)
**As a** person who received a co-parent invitation email
**I want to** click the link, create an account, and join my co-parent's room
**So that** I can start communicating with my co-parent

**Acceptance Criteria**:
- [ ] `/accept-invite?token=TOKEN` route exists and renders properly
- [ ] Token is validated before showing signup form
- [ ] Inviter's name and email are displayed ("Alice invited you")
- [ ] Email field is pre-filled and read-only (must match invitation)
- [ ] Upon successful signup, user is automatically added to shared room
- [ ] Mutual contacts are created between co-parents
- [ ] Inviter receives notification that invitation was accepted
- [ ] Error states: expired token, already accepted, invalid token, cancelled

### US-3: Accept Invitation as Existing User (via In-App Notification)
**As an** existing LiaiZen user who received a co-parent invitation
**I want to** see the invitation in my notifications and accept or decline it
**So that** I can connect with my co-parent without leaving the app

**Acceptance Criteria**:
- [ ] Notification bell icon shows unread count
- [ ] Notifications panel displays invitation with inviter name
- [ ] Accept button triggers `/api/invitations/accept`
- [ ] Decline button triggers `/api/invitations/decline`
- [ ] Shared room is created upon acceptance
- [ ] Mutual contacts are created
- [ ] Inviter receives notification of accept/decline
- [ ] Notification marked as actioned after response

### US-4: View and Manage Sent Invitations
**As a** user who has invited a co-parent
**I want to** see the status of my invitation and resend if needed
**So that** I know if my co-parent received the invite and can retry if necessary

**Acceptance Criteria**:
- [ ] Invitation status visible in profile or settings
- [ ] Shows: invitee email, status (pending/accepted/declined/expired), sent date
- [ ] Resend button available for pending/expired invitations
- [ ] Cancel button available for pending invitations
- [ ] Success/error feedback for all actions

### US-5: Invite Co-Parent After Initial Registration
**As an** existing user who didn't invite a co-parent during signup
**I want to** invite my co-parent from my dashboard
**So that** I can connect with them later

**Acceptance Criteria**:
- [ ] "Invite Co-Parent" button visible when no co-parent is connected
- [ ] Form to enter co-parent's email
- [ ] Validation and error handling
- [ ] Confirmation upon successful invitation
- [ ] Respects 1 co-parent limit (MVP)

---

## Functional Requirements

### FR-1: Accept Invitation Page (`/accept-invite`)

**Route**: `/accept-invite`
**Query Parameter**: `token` (required)

**Component Flow**:
1. On mount, extract `token` from URL
2. Call `GET /api/invitations/validate/:token`
3. **If valid**: Show invitation details + signup form
4. **If invalid/expired**: Show error with options (request new invite, contact support)

**Validation Response Handling**:
| Code | Message | UI Action |
|------|---------|-----------|
| `VALID` | Token is valid | Show signup form |
| `TOKEN_REQUIRED` | No token provided | Redirect to home |
| `INVALID_TOKEN` | Token not found | Error: "Invalid invitation" |
| `ALREADY_ACCEPTED` | Already accepted | Message: "Already accepted, please log in" |
| `EXPIRED` | Token expired | Error: "Invitation expired" + request new |
| `CANCELLED` | Inviter cancelled | Error: "Invitation cancelled" |

**Signup Form Fields**:
- Email (pre-filled, read-only - from invitation)
- Password (required, min 8 chars)
- Confirm Password (must match)
- Display Name (required)
- Terms checkbox

**Submit Action**:
- Call `POST /api/auth/register-from-invite`
- Body: `{ token, email, password, displayName }`
- On success: Store auth, redirect to dashboard
- On error: Display error message

### FR-2: Enhanced Registration Form

**When**: User is on `/signin` in signup mode without an invite token

**Additional Field**:
- Co-Parent Email (required)
  - Label: "Invite your co-parent"
  - Helper: "They'll receive an email to join your shared room"
  - Validation: Valid email, not same as user email

**Submit Endpoint**: `POST /api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "John Doe",
  "coParentEmail": "coparent@example.com",
  "context": {}
}
```

**Response Handling**:
- Show success message with invitation status
- If co-parent is existing user: "We've notified them in-app"
- If co-parent is new: "We've sent them an email invitation"

### FR-3: Notifications System

**Notification Bell (Header)**:
- Location: Top navigation bar
- Shows unread count badge (red circle with number)
- Click opens NotificationsPanel

**NotificationsPanel Component**:
- Lists all notifications, newest first
- Invitation notifications show:
  - Inviter name and avatar placeholder
  - "wants to connect as your co-parent"
  - Accept / Decline buttons
  - Timestamp
- Read/unread visual distinction
- Mark all as read button

**Notification Actions**:
| Action | API Call | Success | Failure |
|--------|----------|---------|---------|
| Accept | `POST /api/invitations/accept` | Close notification, show success toast | Show error message |
| Decline | `POST /api/invitations/decline` | Close notification, show confirmation | Show error message |
| Dismiss | `PUT /api/notifications/:id/dismiss` | Remove from list | Show error |

### FR-4: Invitation Management (Profile/Settings)

**Location**: Profile Panel or dedicated Invitations tab

**Sent Invitations Section**:
- Title: "Your Invitations"
- List of invitations with:
  - Invitee email
  - Status badge (Pending/Accepted/Declined/Expired)
  - Sent date
  - Actions: Resend (if pending/expired), Cancel (if pending)

**Invite Co-Parent Section** (if no co-parent connected):
- "Invite your co-parent" heading
- Email input field
- Send Invitation button
- Helper text about what happens after sending

### FR-5: Correct API Integration

**Remove/Replace**:
- Remove usage of `/api/room/join` for invitation acceptance
- Remove usage of `/api/auth/signup` for registration (use `/api/auth/register`)

**Use Instead**:
| Action | Endpoint | Body |
|--------|----------|------|
| Register + Invite | `POST /api/auth/register` | `{ email, password, username, coParentEmail }` |
| Register from Invite | `POST /api/auth/register-from-invite` | `{ token, email, password, displayName }` |
| Validate Token | `GET /api/invitations/validate/:token` | - |
| Accept Invitation | `POST /api/invitations/accept` | `{ token }` |
| Decline Invitation | `POST /api/invitations/decline` | `{ token }` |
| Get Invitations | `GET /api/invitations` | Query: `?status=pending` |
| Resend Invitation | `POST /api/invitations/resend/:id` | - |
| Cancel Invitation | `DELETE /api/invitations/:id` | - |
| Get Notifications | `GET /api/notifications` | Query: `?unreadOnly=true` |
| Mark Notification Read | `PUT /api/notifications/:id/read` | - |

---

## Non-Functional Requirements

### NFR-1: Security
- Invitation tokens must never be logged or exposed in client-side errors
- Token validation should be rate-limited to prevent brute force
- Email pre-fill on accept page must match invitation exactly (case-insensitive)
- All invitation actions require authentication except token validation

### NFR-2: Performance
- Token validation should return within 500ms
- Notifications should load within 1 second
- Real-time notification updates via existing Socket.io connection

### NFR-3: Usability
- Clear error messages for all failure states
- Loading states for all async operations
- Success confirmations for all actions
- Mobile-responsive design (44px minimum touch targets)

### NFR-4: Accessibility
- All buttons have accessible labels
- Error messages announced to screen readers
- Focus management on modal open/close
- Keyboard navigable notification panel

---

## Technical Constraints

### Architecture
- React 18 functional components with hooks
- Tailwind CSS for styling (follow existing design system)
- Socket.io for real-time notification updates
- JWT authentication (existing implementation)

### Design System (from existing components)
- Primary color: `teal-medium` (#4DA8B0)
- Success: `emerald-500`
- Error: `red-500`
- Cards: White with `border-2 border-gray-200 rounded-2xl`
- Buttons: Use existing `Button` component from `./ui`
- Inputs: Use existing `Input` component from `./ui`
- Min touch target: 44px

### API Integration
- Base URL: From `config.js` (`API_BASE_URL`)
- Auth header: `Authorization: Bearer {token}` from localStorage
- Credentials: `credentials: 'include'` for cookies

---

## Implementation Components

### New Components to Create

1. **`AcceptInvitationPage.jsx`** - Full page for `/accept-invite` route
2. **`NotificationBell.jsx`** - Bell icon with unread count for header
3. **`NotificationsPanel.jsx`** - Dropdown/slide panel for notifications
4. **`InvitationNotification.jsx`** - Single invitation notification item
5. **`InvitationManager.jsx`** - Sent invitations list + invite form
6. **`InviteCoParentForm.jsx`** - Reusable form for inviting co-parent

### New Hooks to Create

1. **`useInvitations.js`** - Manage invitation state and API calls
2. **`useNotifications.js`** (enhance existing) - Add invitation-specific methods

### Files to Modify

1. **`App.jsx`** - Add `/accept-invite` route
2. **`LoginSignup.jsx`** - Add co-parent email field, use correct endpoint
3. **`useAuth.js`** - Add `handleRegisterFromInvite()`, fix `handleSignup()`
4. **`ChatRoom.jsx`** - Add NotificationBell to header, remove old invite logic
5. **`ProfilePanel.jsx`** - Add InvitationManager section

---

## Test Scenarios

### Happy Path Tests

1. **New user invites new co-parent**
   - Register with co-parent email
   - Verify invitation created
   - Verify email sent (check emailService mock/logs)

2. **New user accepts invitation via email**
   - Navigate to `/accept-invite?token=VALID_TOKEN`
   - Verify inviter info displayed
   - Complete signup
   - Verify added to shared room
   - Verify contacts created

3. **Existing user accepts in-app invitation**
   - Log in as existing user with pending invitation
   - Click notification bell
   - See invitation notification
   - Click Accept
   - Verify added to shared room

4. **Resend expired invitation**
   - Have an expired invitation
   - Click Resend button
   - Verify new token generated
   - Verify email sent

### Error Path Tests

1. **Invalid token** - Show error, no signup form
2. **Expired token** - Show expiry message, offer request new
3. **Already accepted** - Redirect to login
4. **Self-invitation** - Block with error message
5. **Duplicate invitation** - Show existing invitation status
6. **Co-parent limit reached** - Block with message

---

## Success Metrics

- **Invitation Completion Rate**: >80% of sent invitations should be accepted
- **Time to Connection**: <24 hours from invitation sent to accepted
- **Error Rate**: <5% of invitation attempts should result in errors
- **User Feedback**: Positive ratings on invitation flow experience

---

## Out of Scope (Future Enhancements)

- Multiple co-parent support (beyond MVP 1 co-parent limit)
- Invitation scheduling (send later)
- Invitation reminders (auto-resend after X days)
- Social login for invited users
- SMS invitations (email only for now)
- Custom invitation messages

---

## Dependencies

### Backend (Already Implemented)
- `/api/auth/register` - Registration with invitation
- `/api/auth/register-from-invite` - Registration from invitation
- `/api/invitations/*` - All invitation endpoints
- `/api/notifications/*` - All notification endpoints
- `invitation-manager` library
- `notification-manager` library
- `emailService.js` - Email sending

### Frontend (To Be Implemented)
- All components listed in Implementation Components
- All hooks listed in Implementation Components
- Route changes in App.jsx
- Form changes in LoginSignup.jsx

---

## Appendix: API Reference

### POST /api/auth/register
```typescript
Request: {
  email: string;
  password: string;
  username: string;
  coParentEmail: string;
  context?: object;
}

Response: {
  user: { id, username, email, displayName, context, room };
  invitation: { id, inviteeEmail, isExistingUser, expiresAt, token? };
}
```

### POST /api/auth/register-from-invite
```typescript
Request: {
  token: string;
  email: string;
  password: string;
  displayName: string;
  context?: object;
}

Response: {
  user: { id, username, email, displayName };
  coParent: { id, username, email, displayName };
  sharedRoom: { id, name, members };
}
```

### GET /api/invitations/validate/:token
```typescript
Response: {
  valid: boolean;
  code: 'VALID' | 'TOKEN_REQUIRED' | 'INVALID_TOKEN' | 'ALREADY_ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitation?: { id, inviteeEmail, status, expiresAt };
  inviterName?: string;
  inviterEmail?: string;
}
```

### POST /api/invitations/accept
```typescript
Request: { token: string }
Response: {
  success: boolean;
  invitation: { id, status };
  room: { id, name };
  coParent: { id, username, email };
}
```

### GET /api/notifications
```typescript
Query: { unreadOnly?: boolean; type?: string; limit?: number; offset?: number }
Response: {
  notifications: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    data: object;
    read: boolean;
    createdAt: string;
  }>;
  total: number;
  unreadCount: number;
}
```
