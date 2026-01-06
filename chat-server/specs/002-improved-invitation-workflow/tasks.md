# Task List: Improved Co-Parent Invitation Workflow

**Feature**: 002-improved-invitation-workflow
**Plan Version**: 1.0.0
**Created**: 2026-01-06
**Based on**: [plan.md](./plan.md)

---

## Task Summary

- **Total Tasks**: 28
- **Sequential Tasks**: 12
- **Parallel Tasks**: 16 (marked with [P])
- **Estimated Total Effort**: 36-49 hours
- **Estimated Parallel Effort**: ~25-32 hours (with parallelization)

---

## Phase 1: Foundation [Sequential]

### 1. Create API client functions for invitation endpoints

**Agent**: frontend-specialist  
**Depends on**: None  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/api/invitations.js` with functions:
  - `validateInvitationToken(token)`
  - `acceptInvitation(token)`
  - `declineInvitation(token)`
  - `getInvitations(status)`
  - `resendInvitation(id)`
  - `cancelInvitation(id)`
- [ ] All functions use `apiGet`, `apiPost`, `apiDelete` from `apiClient.js`
- [ ] Error handling with proper error messages
- [ ] TypeScript JSDoc comments for all functions

**Files to Create**:

- `chat-client-vite/src/api/invitations.js`

**References**: Plan Phase 1 - API Contracts, `chat-client-vite/src/apiClient.js`

---

### 2. Create API client functions for notification endpoints

**Agent**: frontend-specialist  
**Depends on**: None  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Create `src/api/notifications.js` with functions:
  - `getNotifications(params)`
  - `markNotificationRead(id)`
- [ ] Functions use `apiGet`, `apiPut` from `apiClient.js`
- [ ] Error handling with proper error messages
- [ ] TypeScript JSDoc comments

**Files to Create**:

- `chat-client-vite/src/api/notifications.js`

**References**: Plan Phase 1 - API Contracts

---

### 3. Create useInvitationValidation hook

**Agent**: frontend-specialist  
**Depends on**: Task 1  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Create `src/hooks/useInvitationValidation.js`
- [ ] Uses TanStack Query with `useQuery`
- [ ] Query key: `['invitation-validation', token]`
- [ ] Calls `validateInvitationToken(token)` from API client
- [ ] `enabled: !!token` (only runs when token exists)
- [ ] `retry: false` (don't retry invalid tokens)
- [ ] Returns `{ data, isLoading, error, refetch }`

**Files to Create**:

- `chat-client-vite/src/hooks/useInvitationValidation.js`

**References**: Plan Phase 1 - Hooks Architecture, `chat-client-vite/src/features/profile/model/useProfileQueries.js`

---

### 4. Create useInvitations hook with TanStack Query

**Agent**: frontend-specialist  
**Depends on**: Task 1  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/hooks/useInvitations.js`
- [ ] Uses TanStack Query for queries and mutations
- [ ] Query key: `['invitations']` (follows existing pattern)
- [ ] Query function calls `getInvitations()` from API client
- [ ] Mutations:
  - `acceptInvitation` - invalidates invitations and notifications queries on success
  - `resendInvitation` - refetches invitations on success
  - `cancelInvitation` - refetches invitations on success
- [ ] Returns:
  ```javascript
  {
    invitations: Invitation[],
    isLoading: boolean,
    error: Error | null,
    acceptInvitation: (token: string) => void,
    resendInvitation: (id: number) => void,
    cancelInvitation: (id: number) => void,
  }
  ```
- [ ] Follows pattern from `useTaskQueries.js`

**Files to Create**:

- `chat-client-vite/src/hooks/useInvitations.js`

**References**: Plan Phase 1 - Hooks Architecture, `chat-client-vite/src/features/tasks/model/useTaskQueries.js`

---

### 5. Create useNotifications hook with TanStack Query and Socket.io

**Agent**: frontend-specialist  
**Depends on**: Task 2  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Create `src/hooks/useNotifications.js`
- [ ] Uses TanStack Query for fetching notifications
- [ ] Query key: `['notifications']`
- [ ] Listens to Socket.io `notification` event
- [ ] Updates query cache optimistically when notification received
- [ ] Mutation for `markNotificationRead`
- [ ] Returns:
  ```javascript
  {
    notifications: Notification[],
    unreadCount: number,
    isLoading: boolean,
    error: Error | null,
    markRead: (id: number) => void,
    refetch: () => void,
  }
  ```
- [ ] Socket.io listener cleanup on unmount
- [ ] Follows existing Socket.io patterns from `ChatRoom.jsx`

**Files to Create**:

- `chat-client-vite/src/hooks/useNotifications.js`

**References**: Plan Phase 1 - Hooks Architecture, `chat-client-vite/src/ChatRoom.jsx`

---

## Phase 2: Core Components [Parallel]

### 6. [P] Create AcceptInvitationPage component

**Agent**: frontend-specialist  
**Depends on**: Task 3  
**Estimated Time**: 4-5 hours

**Acceptance Criteria**:

- [ ] Create `src/pages/AcceptInvitationPage.jsx`
- [ ] Reads `token` from URL query parameter (`useSearchParams`)
- [ ] Uses `useInvitationValidation` hook to validate token on mount
- [ ] Shows loading state while validating
- [ ] Shows signup form if token is valid:
  - Email field (pre-filled, read-only from invitation)
  - Password field (required, min 8 chars)
  - Confirm Password field (must match)
  - Display Name field (required)
  - Terms checkbox
  - Submit button
- [ ] Shows error states for:
  - Invalid token → "Invalid invitation link"
  - Expired token → "Invitation expired" + "Request New Invitation" button
  - Already accepted → "Already accepted, please log in" + link to signin
  - Cancelled → "Invitation cancelled"
- [ ] Handles signup submission:
  - Calls `POST /api/auth/register-from-invite`
  - Shows loading state
  - Redirects to dashboard on success
  - Shows error message on failure
- [ ] Mobile-responsive design
- [ ] Follows LiaiZen design system (teal palette, Tailwind CSS)
- [ ] 44px minimum touch targets
- [ ] Accessible (ARIA labels, keyboard navigation)

**Files to Create**:

- `chat-client-vite/src/pages/AcceptInvitationPage.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-1, Spec US-2

---

### 7. [P] Create NotificationBell component

**Agent**: ui-designer, frontend-specialist  
**Depends on**: Task 5  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/components/NotificationBell.jsx`
- [ ] Props: `unreadCount: number`, `onClick: () => void`
- [ ] Stateless component (receives props)
- [ ] Bell icon (SVG, outline style)
- [ ] Red badge with unread count (hidden when count is 0)
- [ ] Badge shows "9+" when count > 9
- [ ] 44px minimum touch target
- [ ] Hover state
- [ ] Accessible: `aria-label`, `aria-live` for count
- [ ] Follows LiaiZen design system

**Files to Create**:

- `chat-client-vite/src/components/NotificationBell.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-3

---

### 8. [P] Create InvitationNotification component

**Agent**: ui-designer, frontend-specialist  
**Depends on**: Task 5  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/components/InvitationNotification.jsx`
- [ ] Props: `notification: Notification`, `onAccept: () => void`, `onDecline: () => void`
- [ ] State: `isProcessing: boolean`
- [ ] Displays:
  - Inviter name and avatar placeholder
  - Message: "wants to connect as your co-parent"
  - Accept button (primary, teal)
  - Decline button (secondary)
  - Timestamp (formatted: "2 hours ago")
- [ ] Buttons disabled when `isProcessing` is true
- [ ] Loading spinner on buttons when processing
- [ ] Error handling (show error message if action fails)
- [ ] Mobile-responsive
- [ ] Follows LiaiZen design system
- [ ] Accessible (keyboard navigation, ARIA)

**Files to Create**:

- `chat-client-vite/src/components/InvitationNotification.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-3

---

### 9. [P] Create NotificationsPanel component

**Agent**: ui-designer, frontend-specialist  
**Depends on**: Tasks 5, 8  
**Estimated Time**: 4-5 hours

**Acceptance Criteria**:

- [ ] Create `src/components/NotificationsPanel.jsx`
- [ ] Props: `isOpen: boolean`, `onClose: () => void`, `notifications: Notification[]`
- [ ] Receives notifications via props (from `useNotifications` hook)
- [ ] Renders list of notifications (newest first)
- [ ] Filters to invitation notifications only
- [ ] Uses `InvitationNotification` component for each item
- [ ] Handles accept/decline actions (calls callbacks passed from parent)
- [ ] Listens to Socket.io `notification` event (or receives updates via props)
- [ ] "Mark all as read" button (if unread notifications exist)
- [ ] Empty state: "No notifications"
- [ ] Slide-down panel on mobile, dropdown on desktop
- [ ] Click outside to close
- [ ] Escape key to close
- [ ] Focus management (focus trap when open)
- [ ] Mobile-responsive
- [ ] Follows LiaiZen design system
- [ ] Accessible (keyboard navigation, ARIA modal)

**Files to Create**:

- `chat-client-vite/src/components/NotificationsPanel.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-3, Spec US-3

---

### 10. [P] Create InviteCoParentForm component

**Agent**: ui-designer, frontend-specialist  
**Depends on**: None  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/components/InviteCoParentForm.jsx`
- [ ] Props: `onSubmit: (email: string) => Promise<void>`, `initialEmail?: string`
- [ ] State: `email: string`, `error: string | null`, `isSubmitting: boolean`
- [ ] Email input field
- [ ] Validation:
  - Valid email format
  - Not empty
  - Error message displayed below input
- [ ] Submit button (disabled when submitting or invalid)
- [ ] Loading state on submit button
- [ ] Success feedback (via callback or toast)
- [ ] Error handling (display error from `onSubmit`)
- [ ] Mobile-responsive
- [ ] Follows LiaiZen design system
- [ ] Accessible (labels, error announcements)

**Files to Create**:

- `chat-client-vite/src/components/InviteCoParentForm.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-4

---

### 11. [P] Create SentInvitationsList component

**Agent**: ui-designer, frontend-specialist  
**Depends on**: Task 4  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Create `src/components/SentInvitationsList.jsx`
- [ ] Props: `invitations: Invitation[]`, `onResend: (id: number) => void`, `onCancel: (id: number) => void`
- [ ] Stateless component (receives data via props)
- [ ] Renders list/table of invitations with:
  - Invitee email
  - Status badge (Pending/Accepted/Declined/Expired with colors)
  - Sent date (formatted: "Jan 6, 2026")
  - Actions column:
    - Resend button (if pending or expired)
    - Cancel button (if pending)
- [ ] Empty state: "No invitations sent"
- [ ] Loading skeleton (when loading)
- [ ] Error state (if error loading)
- [ ] Confirmation dialog before cancel
- [ ] Success/error feedback (toast notifications)
- [ ] Mobile-responsive (stacked layout on mobile)
- [ ] Follows LiaiZen design system
- [ ] Accessible (keyboard navigation, ARIA)

**Files to Create**:

- `chat-client-vite/src/components/SentInvitationsList.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-4, Spec US-4

---

### 12. [P] Create InvitationManager component

**Agent**: frontend-specialist  
**Depends on**: Tasks 4, 10, 11  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Create `src/components/InvitationManager.jsx`
- [ ] Uses `useInvitations` hook
- [ ] Uses `useAuth` context to get current user
- [ ] Two sections:
  1. "Invite Your Co-Parent" (if no co-parent connected)
     - Uses `InviteCoParentForm` component
     - Calls invitation API on submit
  2. "Your Invitations" (always visible)
     - Uses `SentInvitationsList` component
     - Passes `onResend` and `onCancel` handlers
- [ ] Handles invitation actions:
  - Send new invitation → calls API, refreshes list, shows success
  - Resend invitation → calls API, refreshes list, shows success
  - Cancel invitation → calls API, refreshes list, shows success
- [ ] Error handling for all actions
- [ ] Loading states
- [ ] Success/error toast notifications
- [ ] Mobile-responsive
- [ ] Follows LiaiZen design system

**Files to Create**:

- `chat-client-vite/src/components/InvitationManager.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-4, Spec US-4, Spec US-5

---

## Phase 3: Integration [Sequential]

### 13. Add /accept-invite route to App.jsx

**Agent**: frontend-specialist  
**Depends on**: Task 6  
**Estimated Time**: 1 hour

**Acceptance Criteria**:

- [ ] Add route in `src/App.jsx`:
  ```jsx
  <Route path="/accept-invite" element={<AcceptInvitationPage />} />
  ```
- [ ] Route positioned before catch-all route
- [ ] Test: Navigate to `/accept-invite?token=TEST` renders component
- [ ] Test: Missing token handled gracefully

**Files to Modify**:

- `chat-client-vite/src/App.jsx`

**References**: Spec FR-1, Spec US-2

---

### 14. Integrate NotificationBell and NotificationsPanel into ChatRoom header

**Agent**: frontend-specialist  
**Depends on**: Tasks 5, 7, 9  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Import `NotificationBell` and `NotificationsPanel` in `ChatRoom.jsx`
- [ ] Use `useNotifications` hook to get notifications and unread count
- [ ] Add `NotificationBell` to header (right side, next to profile)
- [ ] Add state for panel open/close
- [ ] Wire up `NotificationBell` onClick to open panel
- [ ] Render `NotificationsPanel` (conditionally based on state)
- [ ] Pass notifications and handlers to panel
- [ ] Handle accept/decline actions:
  - Accept → calls `acceptInvitation` from `useInvitations`
  - Decline → calls decline API (new function in API client)
- [ ] Close panel after action
- [ ] Show success/error feedback
- [ ] Test: Bell shows correct unread count
- [ ] Test: Clicking bell opens/closes panel
- [ ] Test: Accept/decline actions work
- [ ] Test: Real-time updates via Socket.io

**Files to Modify**:

- `chat-client-vite/src/ChatRoom.jsx`
- `chat-client-vite/src/api/invitations.js` (add declineInvitation function)

**References**: Spec FR-3, Spec US-3

---

### 15. Integrate InvitationManager into ProfilePanel

**Agent**: frontend-specialist  
**Depends on**: Task 12  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Import `InvitationManager` in `ProfilePanel.jsx`
- [ ] Add new tab or section in ProfilePanel: "Invitations"
- [ ] Render `InvitationManager` component
- [ ] Test: Component renders correctly
- [ ] Test: All actions work (send, resend, cancel)

**Files to Modify**:

- `chat-client-vite/src/features/profile/components/ProfilePanel.jsx`

**References**: Spec FR-4, Spec US-4, Spec US-5

---

### 16. Update LoginSignup to include co-parent email field

**Agent**: frontend-specialist  
**Depends on**: None  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Add "Co-Parent Email" field to signup form in `LoginSignup.jsx`
- [ ] Field required (validation)
- [ ] Label: "Invite your co-parent"
- [ ] Helper text: "They'll receive an email to join your shared room"
- [ ] Validation:
  - Valid email format
  - Not same as user email
  - Error message displayed
- [ ] Field only shown in signup mode (not login mode)
- [ ] Field hidden if user has `pendingInviteCode` in localStorage (use existing invitation flow)
- [ ] Update form submission to include `coParentEmail` in request body
- [ ] Update `handleSignup` in `useAuth.js`:
  - Change endpoint from `/api/auth/signup` to `/api/auth/register`
  - Include `coParentEmail` in request body
- [ ] Show success message:
  - "We've sent an email invitation to [email]" (new user)
  - "We've notified them in-app" (existing user)
- [ ] Error handling for:
  - Invalid co-parent email
  - Duplicate invitation
  - Co-parent limit reached
- [ ] Mobile-responsive
- [ ] Follows LiaiZen design system
- [ ] Accessible

**Files to Modify**:

- `chat-client-vite/src/components/LoginSignup.jsx`
- `chat-client-vite/src/hooks/useAuth.js`

**References**: Spec FR-2, Spec US-1

---

### 17. Update useAuth to use correct API endpoints

**Agent**: frontend-specialist  
**Depends on**: Task 16  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Update `handleSignup` in `useAuth.js`:
  - Use `/api/auth/register` instead of `/api/auth/signup`
  - Include `coParentEmail` in request body
- [ ] Create `handleRegisterFromInvite` function:
  - Endpoint: `/api/auth/register-from-invite`
  - Body: `{ token, email, password, displayName }`
  - Handle response (user, coParent, sharedRoom)
  - Store auth token
  - Redirect to dashboard
- [ ] Export `handleRegisterFromInvite` for use in `AcceptInvitationPage`
- [ ] Test: Registration with co-parent email works
- [ ] Test: Registration from invitation works

**Files to Modify**:

- `chat-client-vite/src/hooks/useAuth.js`

**References**: Spec FR-1, Spec FR-2

---

### 18. Remove old invitation acceptance logic from ChatRoom

**Agent**: frontend-specialist  
**Depends on**: Tasks 13, 17  
**Estimated Time**: 1 hour

**Acceptance Criteria**:

- [ ] Remove old `/api/room/join` call in `ChatRoom.jsx` (around line 604-612)
- [ ] Remove `pendingInviteCode` handling logic (if no longer needed)
- [ ] Verify invitation acceptance now happens via `/accept-invite` route
- [ ] Test: Old invitation links still work (via new route)
- [ ] Clean up unused code

**Files to Modify**:

- `chat-client-vite/src/ChatRoom.jsx`

**References**: Plan Phase 2 - Integration Tasks

---

## Phase 4: Socket.io Integration [Sequential]

### 19. Connect Socket.io listener in NotificationsPanel

**Agent**: frontend-specialist  
**Depends on**: Task 9  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Import Socket.io client in `NotificationsPanel.jsx`
- [ ] Listen to `notification` event when component mounts
- [ ] Update local state when notification received (or trigger refetch)
- [ ] Cleanup listener on unmount
- [ ] Test: Real-time notification appears in panel
- [ ] Test: Unread count updates automatically
- [ ] Test: No memory leaks (listener cleanup)

**Files to Modify**:

- `chat-client-vite/src/components/NotificationsPanel.jsx`

**References**: Plan Phase 1 - Component Specifications, Spec FR-3

---

## Phase 5: Testing [Parallel]

### 20. [P] Write component tests for AcceptInvitationPage

**Agent**: testing-specialist  
**Depends on**: Task 6  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Create `src/pages/__tests__/AcceptInvitationPage.test.jsx`
- [ ] Test: Renders loading state while validating
- [ ] Test: Shows signup form when token is valid
- [ ] Test: Shows error message for invalid token
- [ ] Test: Shows error message for expired token
- [ ] Test: Shows error message for already accepted
- [ ] Test: Handles signup submission success
- [ ] Test: Handles signup submission error
- [ ] Test: Form validation (password match, required fields)
- [ ] Mock API calls (use MSW or vi.mock)
- [ ] Test coverage: >80%

**Files to Create**:

- `chat-client-vite/src/pages/__tests__/AcceptInvitationPage.test.jsx`

**References**: Spec US-2, Spec FR-1

---

### 21. [P] Write component tests for NotificationBell

**Agent**: testing-specialist  
**Depends on**: Task 7  
**Estimated Time**: 1-2 hours

**Acceptance Criteria**:

- [ ] Create `src/components/__tests__/NotificationBell.test.jsx`
- [ ] Test: Renders bell icon
- [ ] Test: Shows badge when unreadCount > 0
- [ ] Test: Hides badge when unreadCount === 0
- [ ] Test: Shows "9+" when unreadCount > 9
- [ ] Test: Calls onClick when clicked
- [ ] Test: Accessible (ARIA labels)

**Files to Create**:

- `chat-client-vite/src/components/__tests__/NotificationBell.test.jsx`

**References**: Spec FR-3

---

### 22. [P] Write component tests for NotificationsPanel

**Agent**: testing-specialist  
**Depends on**: Task 9  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] Create `src/components/__tests__/NotificationsPanel.test.jsx`
- [ ] Test: Renders when isOpen is true
- [ ] Test: Does not render when isOpen is false
- [ ] Test: Renders list of notifications
- [ ] Test: Calls onClose when clicking outside
- [ ] Test: Calls onClose when pressing Escape
- [ ] Test: Handles accept action
- [ ] Test: Handles decline action
- [ ] Test: Shows empty state when no notifications
- [ ] Test: Focus management (focus trap)
- [ ] Mock notifications data

**Files to Create**:

- `chat-client-vite/src/components/__tests__/NotificationsPanel.test.jsx`

**References**: Spec FR-3, Spec US-3

---

### 23. [P] Write integration tests for invitation API calls

**Agent**: testing-specialist  
**Depends on**: Tasks 1, 2, 3, 4, 5  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Create `src/hooks/__tests__/useInvitations.test.js`
- [ ] Create `src/hooks/__tests__/useNotifications.test.js`
- [ ] Create `src/hooks/__tests__/useInvitationValidation.test.js`
- [ ] Test: useInvitations hook fetches invitations
- [ ] Test: useInvitations hook handles mutations (accept, resend, cancel)
- [ ] Test: useNotifications hook fetches notifications
- [ ] Test: useNotifications hook updates on Socket.io event
- [ ] Test: useInvitationValidation hook validates token
- [ ] Mock API calls (MSW or vi.mock)
- [ ] Mock Socket.io client
- [ ] Test error handling
- [ ] Test loading states
- [ ] Test coverage: >80%

**Files to Create**:

- `chat-client-vite/src/hooks/__tests__/useInvitations.test.js`
- `chat-client-vite/src/hooks/__tests__/useNotifications.test.js`
- `chat-client-vite/src/hooks/__tests__/useInvitationValidation.test.js`

**References**: Plan Phase 1 - Hooks Architecture

---

### 24. [P] Write E2E test scenarios from spec

**Agent**: testing-specialist  
**Depends on**: All integration tasks complete  
**Estimated Time**: 4-6 hours

**Acceptance Criteria**:

- [ ] Create E2E test file (Playwright or Cypress)
- [ ] Scenario 1: New user invites new co-parent
  - Navigate to signup
  - Fill form with co-parent email
  - Submit
  - Verify invitation sent
- [ ] Scenario 2: New user accepts invitation via email
  - Navigate to `/accept-invite?token=TOKEN`
  - Verify validation
  - Fill signup form
  - Submit
  - Verify account created and room joined
- [ ] Scenario 3: Existing user accepts in-app invitation
  - Log in
  - Check notification bell
  - Open panel
  - Click accept
  - Verify room created
- [ ] Scenario 4: Resend expired invitation
- [ ] Scenario 5: Cancel pending invitation
- [ ] Scenario 6: Invalid token handling
- [ ] All scenarios pass

**Files to Create**:

- `chat-client-vite/tests/e2e/invitation-workflow.spec.js` (or equivalent)

**References**: Plan Phase 1 - Quickstart Guide, Spec Test Scenarios

---

## Phase 6: Polish & Error Handling [Sequential]

### 25. Add comprehensive error handling and loading states

**Agent**: frontend-specialist  
**Depends on**: All integration tasks complete  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] All API calls have error handling
- [ ] Loading states for all async operations
- [ ] Error messages are user-friendly (not technical)
- [ ] Error boundaries catch component errors
- [ ] Network error handling (retry logic where appropriate)
- [ ] Token expiration handling
- [ ] 401/403 error handling (redirect to login)
- [ ] Toast notifications for success/error feedback
- [ ] Test: All error scenarios handled gracefully

**Files to Modify**:

- All component files created in this feature

**References**: Spec NFR-1, Spec NFR-3

---

### 26. Add accessibility improvements

**Agent**: ui-designer, frontend-specialist  
**Depends on**: All components complete  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] All buttons have accessible labels (`aria-label`)
- [ ] Error messages announced to screen readers (`aria-live`)
- [ ] Focus management on modals/panels (focus trap)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader testing with NVDA/JAWS
- [ ] Keyboard-only navigation test
- [ ] Test: All accessibility requirements met

**Files to Modify**:

- All component files created in this feature

**References**: Spec NFR-4

---

### 27. Mobile responsiveness improvements

**Agent**: ui-designer, frontend-specialist  
**Depends on**: All components complete  
**Estimated Time**: 2-3 hours

**Acceptance Criteria**:

- [ ] All components responsive on mobile (320px width)
- [ ] Touch targets minimum 44px
- [ ] Notifications panel slides down on mobile
- [ ] AcceptInvitationPage centered card on mobile
- [ ] InvitationManager stacked layout on mobile
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] Test: All components work on mobile

**Files to Modify**:

- All component files created in this feature

**References**: Spec NFR-3, Plan Technical Context

---

### 28. Final testing and bug fixes

**Agent**: frontend-specialist, testing-specialist  
**Depends on**: All tasks complete  
**Estimated Time**: 3-4 hours

**Acceptance Criteria**:

- [ ] Run full test suite (all tests pass)
- [ ] Manual testing of all user stories (US-1 through US-5)
- [ ] Verify all acceptance criteria met
- [ ] Fix any bugs found
- [ ] Performance check (token validation <500ms, notifications <1s)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Test: All acceptance criteria met, no critical bugs

**Files to Modify**:

- All files as needed

**References**: Plan Phase 1 - Quickstart Guide, All Acceptance Criteria

---

## Task Dependencies Graph

```
1 (API invitations) → 3 (useInvitationValidation)
1 (API invitations) → 4 (useInvitations)
2 (API notifications) → 5 (useNotifications)

3 → 6 (AcceptInvitationPage)
4 → 11 (SentInvitationsList)
4 → 12 (InvitationManager)
5 → 7 (NotificationBell)
5 → 8 (InvitationNotification)
5 → 9 (NotificationsPanel)

6 → 13 (Add route)
7, 9 → 14 (Integrate bell/panel)
12 → 15 (Integrate manager)
16 → 17 (Update useAuth)
6, 17 → 18 (Remove old logic)
9 → 19 (Socket.io)

All components → 25-28 (Polish)
```

## Parallelization Opportunities

**Can run in parallel** (marked with [P]):

- Tasks 6-12 (all component creation)
- Tasks 20-23 (all testing tasks)

**Must run sequentially**:

- Phase 1: Tasks 1-5 (foundation)
- Phase 3: Tasks 13-18 (integration)
- Phase 4: Task 19 (Socket.io)
- Phase 6: Tasks 25-28 (polish)

**Estimated parallel effort**: ~25-32 hours (with 2-3 developers working in parallel)

---

## Success Criteria

✅ All 28 tasks completed  
✅ All acceptance criteria met  
✅ All tests passing  
✅ All user stories (US-1 through US-5) working  
✅ Performance goals met (<500ms validation, <1s notifications)  
✅ Accessibility standards met (WCAG 2.1 AA)  
✅ Mobile-responsive  
✅ No critical bugs

---

## Next Steps After Completion

1. Code review
2. User acceptance testing with real co-parent pairs
3. Monitor invitation acceptance rates in production
4. Collect user feedback
5. Iterate based on feedback

---

**Task List Status**: ✅ READY FOR EXECUTION
