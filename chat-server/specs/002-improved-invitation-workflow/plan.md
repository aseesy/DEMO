# Implementation Plan: Improved Co-Parent Invitation Workflow

**Branch**: `002-improved-invitation-workflow` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/athenasees/Desktop/chat/chat-server/specs/002-improved-invitation-workflow/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → Spec found and analyzed (589 lines, 7 issues identified)
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: web (frontend + backend)
   → Structure Decision: Existing structure (chat-client-vite/ + chat-server/)
3. Fill Constitution Check section
   → Evaluated against LiaiZen AI Mediation Constitution
   → Evaluated against development principles
4. Execute Phase 0 → research.md (if needed)
   → Backend implementation exists - research focuses on frontend patterns
5. Execute Phase 1 → contracts, data-model.md, quickstart.md
   → API contracts documented (backend endpoints exist)
   → Data model leverages existing schema
   → Test scenarios from spec
6. Re-evaluate Constitution Check section
   → No violations - frontend-only feature
7. Plan Phase 2 → Describe task generation approach
8. STOP - Ready for /tasks command
```

## Summary

This feature **fixes critical gaps** in the invitation workflow by implementing the missing frontend components and correctly integrating with the existing backend API. The backend is fully implemented; this plan focuses on frontend implementation to complete the invitation lifecycle.

**Key Technical Approach**:

- Add `/accept-invite` route handler in React Router
- Create `AcceptInvitationPage` component with token validation
- Build notifications system (bell icon + panel) for existing users
- Create invitation management UI in profile/settings
- Fix API integration: replace incorrect endpoints with correct ones
- Extend registration form to include co-parent email field
- Implement real-time notification updates via Socket.io

**Critical Fixes**:

1. Route: Add `/accept-invite?token=TOKEN` route
2. API: Use `/api/auth/register` instead of `/api/auth/signup`
3. API: Use `/api/auth/register-from-invite` for invited users
4. API: Use `/api/invitations/accept` instead of `/api/room/join`
5. UI: Add co-parent email field to registration
6. UI: Build notifications panel for in-app invitations
7. UI: Build invitation management interface

## Technical Context

**Language/Version**:

- Frontend: React 18+ with Vite, JavaScript ES6+
- Backend: Node.js 18+ (already implemented)

**Primary Dependencies**:

- Frontend: React Router, Socket.io-client, Tailwind CSS
- Backend: Express.js, Socket.io, PostgreSQL (already implemented)

**Storage**: PostgreSQL (all invitation data already stored via backend)

**Testing**:

- Frontend: Vitest (existing test framework)
- Integration: Manual testing + E2E scenarios

**Target Platform**:

- Web (responsive, mobile-first)
- All major browsers

**Project Structure**:

- Frontend: `/Users/athenasees/Desktop/chat/chat-client-vite/`
- Backend: `/Users/athenasees/Desktop/chat/chat-server/`

**Performance Goals**:

- Token validation completes within 500ms (NFR-2)
- Notifications load within 1 second (NFR-2)
- Real-time notification updates via existing Socket.io connection
- Mobile-responsive (44px minimum touch targets)

**Constraints**:

- Must use existing backend API endpoints (no backend changes)
- Must follow LiaiZen design system (teal palette, Tailwind CSS)
- Must maintain existing authentication flow
- Must be accessible (WCAG 2.1 AA compliance)
- One co-parent limit (MVP - enforced by backend)

**Scale/Scope**:

- Estimated 100-1000 users in first 3 months
- ~50% invitation acceptance rate expected
- All invitation history stored by backend for audit trail

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### LiaiZen AI Mediation Constitution Compliance ✅ PASS

This feature does **not** involve AI mediation logic. It's a pure frontend feature for invitation workflow. No constitution checks required for AI behavior.

**Relevant Principles** (for UI/UX):

- **Child-Centric**: Invitation UI should not create conflict or pressure
- **Neutrality**: UI should not favor one co-parent over another
- **Respect**: Clear controls, easy opt-outs, transparent states

**Compliance**: ✅ UI follows child-centric, neutral, respectful patterns

### Development Principles ✅ PASS

#### Library-First Architecture ✅ PASS

- **Requirement**: Reusable components and hooks
- **Implementation**:
  - `useInvitations.js` hook - reusable invitation state management
  - `useNotifications.js` hook - enhanced notification management
  - Reusable components: `NotificationBell`, `NotificationsPanel`, `InviteCoParentForm`
- **Compliance**: ✅ Components and hooks designed for reuse

#### Test-First Development ✅ PASS (PLANNED)

- **Requirement**: TDD mandatory - write tests before implementation
- **Implementation**:
  - Component tests for all new React components
  - Integration tests for API calls
  - E2E scenarios from spec (6 scenarios identified)
  - Tests will initially fail (no implementation exists yet)
- **Compliance**: ✅ Tests planned before implementation

#### Contract-First Design ✅ PASS

- **Requirement**: All integration points defined by contracts
- **Implementation**:
  - Backend API contracts already exist and documented
  - Frontend will consume existing API endpoints
  - API contracts documented in spec (Appendix: API Reference)
- **Compliance**: ✅ Using existing API contracts

## Phase 0: Research

**Status**: ✅ COMPLETE - Backend implementation exists, research focuses on frontend patterns

### Technology Decisions

#### 1. React Router for `/accept-invite` Route

**Decision**: Use existing React Router (React Router v6) in `App.jsx`

**Rationale**:

- Already used for other routes (`/signin`, `/auth/google/callback`, etc.)
- Supports query parameters (`?token=TOKEN`)
- No new dependencies required

**Implementation**: Add route in `App.jsx` routing configuration

#### 2. Socket.io for Real-Time Notifications

**Decision**: Use existing Socket.io-client connection

**Rationale**:

- Already connected in `ChatRoom.jsx`
- Backend already emits notification events
- No new setup required

**Implementation**: Listen to `notification` events in `NotificationsPanel`

#### 3. Component Architecture

**Decision**: Create separate components for each responsibility

**Rationale**:

- `AcceptInvitationPage` - Full page component (route-level)
- `NotificationBell` - Small reusable component (header)
- `NotificationsPanel` - Modal/panel component
- `InvitationManager` - Feature section (profile/settings)
- Follows existing component patterns

#### 4. State Management

**Decision**: React hooks + TanStack Query (for API calls)

**Rationale**:

- Profile and Tasks already use TanStack Query
- Consistent with existing patterns
- Automatic caching and refetching

**Implementation**:

- `useInvitations` hook with TanStack Query
- `useNotifications` hook with TanStack Query

### Unknowns Resolved

1. **Q: How to handle token expiration UI?**
   - **A**: Show error message with "Request New Invitation" link/button
   - **Source**: Spec FR-1 validation response handling

2. **Q: Where to place notification bell in header?**
   - **A**: Top navigation bar, right side (standard pattern)
   - **Source**: Spec FR-3

3. **Q: How to pre-fill email on accept page?**
   - **A**: Extract from invitation validation response
   - **Source**: Spec FR-1 - email comes from `/api/invitations/validate/:token` response

4. **Q: What happens after successful invitation acceptance?**
   - **A**: Redirect to dashboard/chat (same as login)
   - **Source**: Spec US-2 - user joins shared room automatically

## Phase 1: Design

### API Contracts

**Note**: All backend endpoints already exist. Frontend will consume these contracts.

#### POST /api/auth/register

**Purpose**: Registration with co-parent invitation (new user inviting co-parent)

**Request**:

```typescript
{
  email: string;
  password: string;
  username: string;
  coParentEmail: string;
  context?: object;
}
```

**Response**:

```typescript
{
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string;
    context: object;
    room: { id: string; name: string };
  };
  invitation: {
    id: number;
    inviteeEmail: string;
    isExistingUser: boolean;
    expiresAt: string;
    token?: string; // Only if debugging
  };
}
```

**Error Cases**:

- `400`: Invalid email, duplicate email, invalid co-parent email
- `409`: Co-parent limit reached
- `500`: Server error

#### POST /api/auth/register-from-invite

**Purpose**: Registration from invitation token (invited user creating account)

**Request**:

```typescript
{
  token: string;
  email: string; // Must match invitation
  password: string;
  displayName: string;
  context?: object;
}
```

**Response**:

```typescript
{
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string;
  }
  coParent: {
    id: number;
    username: string;
    email: string;
    displayName: string;
  }
  sharedRoom: {
    id: string;
    name: string;
    members: Array<{ id: number; username: string }>;
  }
}
```

**Error Cases**:

- `400`: Invalid token, email mismatch, invalid password
- `404`: Token not found
- `409`: Already accepted, expired
- `500`: Server error

#### GET /api/invitations/validate/:token

**Purpose**: Validate invitation token before showing signup form

**Response**:

```typescript
{
  valid: boolean;
  code: 'VALID' | 'TOKEN_REQUIRED' | 'INVALID_TOKEN' | 'ALREADY_ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitation?: {
    id: number;
    inviteeEmail: string;
    status: string;
    expiresAt: string;
  };
  inviterName?: string;
  inviterEmail?: string;
}
```

**Error Cases**:

- `400`: Token required
- `404`: Token not found

#### POST /api/invitations/accept

**Purpose**: Accept invitation (existing user)

**Request**:

```typescript
{
  token: string;
}
```

**Response**:

```typescript
{
  success: boolean;
  invitation: {
    id: number;
    status: 'accepted';
  }
  room: {
    id: string;
    name: string;
  }
  coParent: {
    id: number;
    username: string;
    email: string;
  }
}
```

#### GET /api/invitations

**Purpose**: List sent/received invitations

**Query Parameters**:

- `status`: `'pending' | 'accepted' | 'declined' | 'expired'` (optional filter)

**Response**:

```typescript
{
  invitations: Array<{
    id: number;
    inviteeEmail: string;
    inviterEmail: string;
    status: string;
    createdAt: string;
    expiresAt: string;
  }>;
  count: number;
}
```

#### POST /api/invitations/resend/:id

**Purpose**: Resend expired or pending invitation

**Response**:

```typescript
{
  success: boolean;
  invitation: {
    id: number;
    token: string;
    expiresAt: string;
  }
}
```

#### DELETE /api/invitations/:id

**Purpose**: Cancel pending invitation

**Response**:

```typescript
{
  success: boolean;
}
```

#### GET /api/notifications

**Purpose**: Get user notifications

**Query Parameters**:

- `unreadOnly`: `boolean` (default: false)
- `type`: `string` (optional filter)
- `limit`: `number` (default: 50)
- `offset`: `number` (default: 0)

**Response**:

```typescript
{
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

#### PUT /api/notifications/:id/read

**Purpose**: Mark notification as read

**Response**:

```typescript
{
  success: boolean;
}
```

**Socket.io Events**:

- **Emit**: None (read-only)
- **Listen**: `notification` event with notification data

### Data Model

**Note**: All database tables already exist. Frontend consumes data via API.

#### Existing Tables (Backend)

1. **users** - User accounts
2. **invitations** - Invitation records
3. **rooms** - Shared rooms
4. **room_members** - Room membership
5. **notifications** - In-app notifications
6. **contacts** - Contact relationships

**Frontend State Models**:

```typescript
// Invitation state (from API)
interface Invitation {
  id: number;
  inviteeEmail: string;
  inviterEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  createdAt: string;
  expiresAt: string;
}

// Notification state (from API + Socket.io)
interface Notification {
  id: number;
  type: 'invitation' | 'message' | 'task' | 'system';
  title: string;
  message: string;
  data: {
    invitationId?: number;
    token?: string;
    inviterName?: string;
    // ... other type-specific data
  };
  read: boolean;
  createdAt: string;
}

// Invitation validation response
interface InvitationValidation {
  valid: boolean;
  code: 'VALID' | 'TOKEN_REQUIRED' | 'INVALID_TOKEN' | 'ALREADY_ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  invitation?: Invitation;
  inviterName?: string;
  inviterEmail?: string;
}
```

### Component Architecture

#### Component Hierarchy

```
App.jsx
├── Routes
│   ├── /accept-invite → AcceptInvitationPage
│   ├── /signin → LoginSignup (modified)
│   └── / → ChatRoom (modified)
│       └── Header
│           └── NotificationBell → NotificationsPanel
│               └── InvitationNotification (items)
│       └── ProfilePanel (modified)
│           └── InvitationManager
│               └── InviteCoParentForm
│               └── SentInvitationsList
```

#### Component Specifications

**1. AcceptInvitationPage** (`src/pages/AcceptInvitationPage.jsx`)

- **Purpose**: Full-page component for `/accept-invite` route
- **Props**: None (reads `token` from URL query)
- **State**:
  - `validation`: InvitationValidation | null
  - `isValidating`: boolean
  - `error`: string | null
- **Actions**:
  - Validate token on mount
  - Show signup form if valid
  - Show error if invalid/expired
  - Handle signup submission
- **Design**: Full-page centered card, mobile-responsive

**2. NotificationBell** (`src/components/NotificationBell.jsx`)

- **Purpose**: Bell icon with unread count badge
- **Props**: `unreadCount: number`, `onClick: () => void`
- **State**: None (stateless)
- **Design**: Header icon, red badge with count, 44px touch target

**3. NotificationsPanel** (`src/components/NotificationsPanel.jsx`)

- **Purpose**: Dropdown/slide panel listing notifications
- **Props**: `isOpen: boolean`, `onClose: () => void`, `notifications: Notification[]`
- **State**: None (receives data via props)
- **Actions**:
  - Display notifications list
  - Handle accept/decline actions
  - Listen to Socket.io updates
- **Design**: Slide-down panel (mobile) or dropdown (desktop)

**4. InvitationNotification** (`src/components/InvitationNotification.jsx`)

- **Purpose**: Single invitation notification item
- **Props**: `notification: Notification`, `onAccept: () => void`, `onDecline: () => void`
- **State**: `isProcessing: boolean`
- **Design**: Card with inviter info, buttons, timestamp

**5. InvitationManager** (`src/components/InvitationManager.jsx`)

- **Purpose**: Manage sent invitations + invite new co-parent
- **Props**: None (uses auth context for user)
- **State**:
  - `invitations: Invitation[]`
  - `isLoading: boolean`
- **Actions**:
  - Load sent invitations
  - Resend invitation
  - Cancel invitation
  - Send new invitation
- **Design**: Section in ProfilePanel, two-column layout

**6. InviteCoParentForm** (`src/components/InviteCoParentForm.jsx`)

- **Purpose**: Reusable form for inviting co-parent
- **Props**: `onSubmit: (email: string) => Promise<void>`, `initialEmail?: string`
- **State**: `email: string`, `error: string | null`, `isSubmitting: boolean`
- **Design**: Input + button, validation feedback

**7. SentInvitationsList** (`src/components/SentInvitationsList.jsx`)

- **Purpose**: List of sent invitations with status and actions
- **Props**: `invitations: Invitation[]`, `onResend: (id: number) => void`, `onCancel: (id: number) => void`
- **State**: None
- **Design**: Table/list with status badges, action buttons

### Hooks Architecture

**1. useInvitations** (`src/hooks/useInvitations.js`)

```javascript
export function useInvitations() {
  // TanStack Query hooks
  const {
    data: invitations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: fetchInvitations,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries(['invitations']);
      queryClient.invalidateQueries(['notifications']);
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => refetch(),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: () => refetch(),
  });

  return {
    invitations: invitations || [],
    isLoading,
    error,
    acceptInvitation: acceptMutation.mutate,
    resendInvitation: resendMutation.mutate,
    cancelInvitation: cancelMutation.mutate,
  };
}
```

**2. useNotifications** (`src/hooks/useNotifications.js`)

```javascript
export function useNotifications() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  // Listen to Socket.io updates
  useEffect(() => {
    socket.on('notification', notification => {
      queryClient.setQueryData(['notifications'], old => ({
        ...old,
        notifications: [notification, ...old.notifications],
        unreadCount: old.unreadCount + 1,
      }));
    });

    return () => socket.off('notification');
  }, []);

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => refetch(),
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    markRead: markReadMutation.mutate,
    refetch,
  };
}
```

**3. useInvitationValidation** (`src/hooks/useInvitationValidation.js`)

```javascript
export function useInvitationValidation(token) {
  return useQuery({
    queryKey: ['invitation-validation', token],
    queryFn: () => validateInvitationToken(token),
    enabled: !!token,
    retry: false, // Don't retry invalid tokens
  });
}
```

## Phase 2: Implementation Tasks

**Status**: READY FOR `/tasks` COMMAND

### Task Generation Approach

Tasks will be generated in dependency order:

1. **Foundation Tasks** (no dependencies):
   - Create base hooks (`useInvitations`, `useNotifications`, `useInvitationValidation`)
   - Create API client functions for invitation endpoints
   - Set up TanStack Query queries/mutations

2. **Component Tasks** (depend on hooks):
   - Create `AcceptInvitationPage` component
   - Create `NotificationBell` component
   - Create `NotificationsPanel` component
   - Create `InvitationNotification` component
   - Create `InvitationManager` component
   - Create `InviteCoParentForm` component
   - Create `SentInvitationsList` component

3. **Integration Tasks** (depend on components):
   - Add `/accept-invite` route in `App.jsx`
   - Integrate `NotificationBell` into `ChatRoom` header
   - Integrate `InvitationManager` into `ProfilePanel`
   - Update `LoginSignup` to include co-parent email field
   - Update `useAuth` to use correct API endpoints

4. **Socket.io Integration** (depends on NotificationsPanel):
   - Connect Socket.io listener in `NotificationsPanel`
   - Handle real-time notification updates

5. **Testing Tasks**:
   - Component tests for each new component
   - Integration tests for API calls
   - E2E scenarios from spec

6. **Polish Tasks**:
   - Error handling and loading states
   - Accessibility improvements
   - Mobile responsiveness
   - Success/error feedback

### Estimated Effort

- **Foundation Tasks**: 4-6 hours
- **Component Tasks**: 12-16 hours
- **Integration Tasks**: 6-8 hours
- **Socket.io Integration**: 2-3 hours
- **Testing**: 8-10 hours
- **Polish**: 4-6 hours

**Total**: ~36-49 hours (~1 week for 1 developer)

## Quickstart Guide

### Test Scenarios (from Spec)

#### Scenario 1: New User Invites New Co-Parent

1. Navigate to `/signin`
2. Click "Sign up" or switch to signup mode
3. Fill registration form:
   - Email: `user@example.com`
   - Password: `password123`
   - Display Name: `John Doe`
   - **Co-Parent Email**: `coparent@example.com` ← NEW FIELD
4. Submit form
5. **Expected**:
   - Account created
   - Success message: "We've sent an email invitation to coparent@example.com"
   - Redirect to dashboard

#### Scenario 2: New User Accepts Invitation via Email

1. Receive invitation email
2. Click invitation link: `https://coparentliaizen.com/accept-invite?token=TOKEN`
3. **Expected**:
   - Token validated
   - Page shows: "Alice invited you to connect as co-parent"
   - Email field pre-filled and read-only
   - Signup form displayed
4. Fill password and display name
5. Submit form
6. **Expected**:
   - Account created
   - Automatically added to shared room
   - Redirect to dashboard
   - Can see co-parent in contacts

#### Scenario 3: Existing User Accepts In-App Invitation

1. Log in as existing user
2. **Expected**:
   - Notification bell shows unread count (if invitation exists)
3. Click notification bell
4. **Expected**:
   - Notifications panel opens
   - Invitation notification visible: "Alice wants to connect as your co-parent"
5. Click "Accept" button
6. **Expected**:
   - Invitation accepted
   - Shared room created
   - Notification marked as read
   - Success message displayed

#### Scenario 4: Resend Expired Invitation

1. Navigate to Profile → Invitations
2. See expired invitation in list
3. Click "Resend" button
4. **Expected**:
   - New invitation token generated
   - Email sent to invitee
   - Status updated to "pending"
   - Success message displayed

#### Scenario 5: Cancel Pending Invitation

1. Navigate to Profile → Invitations
2. See pending invitation in list
3. Click "Cancel" button
4. Confirm cancellation
5. **Expected**:
   - Invitation cancelled
   - Status updated to "cancelled"
   - Invitation removed from list
   - Success message displayed

#### Scenario 6: Invalid Token Handling

1. Navigate to `/accept-invite?token=INVALID_TOKEN`
2. **Expected**:
   - Token validation fails
   - Error message displayed: "Invalid invitation link"
   - Option to request new invitation or contact support

### Acceptance Criteria Checklist

**US-1: New User Registration with Co-Parent Invitation**

- [ ] Registration form includes required "Co-Parent Email" field
- [ ] Upon successful registration, invitation is sent
- [ ] User sees confirmation that invitation was sent
- [ ] If co-parent is existing user, they receive in-app notification
- [ ] Error handling for invalid/duplicate emails
- [ ] Clear messaging about 1 co-parent limit

**US-2: Accept Invitation as New User**

- [ ] `/accept-invite?token=TOKEN` route exists and renders
- [ ] Token is validated before showing signup form
- [ ] Inviter's name and email are displayed
- [ ] Email field is pre-filled and read-only
- [ ] Upon successful signup, user is added to shared room
- [ ] Mutual contacts are created
- [ ] Inviter receives notification of acceptance
- [ ] Error states handled (expired, invalid, already accepted)

**US-3: Accept Invitation as Existing User**

- [ ] Notification bell shows unread count
- [ ] Notifications panel displays invitation
- [ ] Accept button triggers API call
- [ ] Decline button triggers API call
- [ ] Shared room created upon acceptance
- [ ] Mutual contacts created
- [ ] Notification marked as actioned

**US-4: View and Manage Sent Invitations**

- [ ] Invitation status visible in profile/settings
- [ ] Shows invitee email, status, sent date
- [ ] Resend button available for pending/expired
- [ ] Cancel button available for pending
- [ ] Success/error feedback for all actions

**US-5: Invite Co-Parent After Initial Registration**

- [ ] "Invite Co-Parent" button visible when no co-parent connected
- [ ] Form to enter co-parent's email
- [ ] Validation and error handling
- [ ] Confirmation upon successful invitation
- [ ] Respects 1 co-parent limit

## Risks and Mitigation

### Risk 1: Token Security Exposure

**Risk**: Invitation tokens exposed in URL or client-side logs

**Mitigation**:

- Never log tokens in console
- Tokens only used for API calls, not stored in state longer than needed
- Use HTTPS only (already enforced)
- Tokens expire after 7 days (backend enforced)

### Risk 2: Race Conditions in Notification Updates

**Risk**: Socket.io notification might arrive before API response

**Mitigation**:

- Use TanStack Query optimistic updates
- Handle duplicate notifications gracefully
- Update UI optimistically, sync with API

### Risk 3: Mobile UX Issues

**Risk**: Notification panel or accept page not mobile-friendly

**Mitigation**:

- Mobile-first design approach
- Test on real devices (iOS Safari, Android Chrome)
- Use Tailwind responsive classes
- 44px minimum touch targets

### Risk 4: Backend API Changes

**Risk**: Backend endpoints might not match spec

**Mitigation**:

- Verify all endpoints exist and match spec before implementation
- Add integration tests that fail if API contract changes
- Document any API discrepancies found

## Success Metrics

- **Invitation Completion Rate**: >80% of sent invitations accepted
- **Time to Connection**: <24 hours from invitation sent to accepted
- **Error Rate**: <5% of invitation attempts result in errors
- **User Feedback**: Positive ratings on invitation flow experience
- **Notification Engagement**: >70% of users interact with notification bell within first week

---

## Next Steps

**Ready for `/tasks` command** to generate dependency-ordered task list.

**Post-Implementation**:

1. User testing with real co-parent pairs
2. Monitor invitation acceptance rates
3. Collect user feedback on invitation flow
4. Iterate on UX based on feedback

---

**Plan Status**: ✅ COMPLETE - Ready for implementation
