# Feature Specification: Tasks Feature Improvement

**Feature ID**: 005-tasks-feature-improvement
**Created**: 2025-11-27
**Status**: Draft

## Overview

**Feature Name**: Tasks Feature Improvement
**Business Objective**: Consolidate invite functionality into the tasks system and fix task visibility issues so all users see their tasks reliably.

**Problem Statement**:

1. "Send Invite" and "Have a Code" functionality exists directly on the dashboard, cluttering the main view
2. Tasks are not showing up for all users - some users have no tasks at all
3. The invite flow should be part of the task-based onboarding system, not a standalone dashboard element

**Success Metrics**:

- All users see relevant tasks (100% visibility)
- Invite functionality is accessible through tasks panel
- Dashboard is cleaner without standalone invite UI
- Task completion rate improves by consolidating actions

## Current State Analysis

### Current Architecture

**Invite Location** (ChatRoom.jsx lines 1147-1206):

- Standalone card on dashboard with "Send Invite" heading
- "Generate Invite Link" button
- "Have a Code?" manual entry section
- Only shows when `!hasCoParentConnected`

**Tasks Panel** (ChatRoom.jsx lines 1250+):

- Displays tasks in right column
- Limited to 5 tasks on dashboard
- Has Open/Completed/All filters
- Has priority filter

**Task Loading Issues Identified**:

| Issue                   | Root Cause                            | Impact                                           |
| ----------------------- | ------------------------------------- | ------------------------------------------------ |
| No tasks for some users | Tasks only created during signup flow | Users from migrations/old accounts have no tasks |
| Tasks limited to 5      | `useTasks.js:65` slices array         | Users can't see all tasks                        |
| Username lookup risk    | API uses username fallback            | Tasks may fail to load                           |

### Database Schema

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',      -- 'open' | 'completed'
  priority TEXT DEFAULT 'medium',  -- 'low' | 'medium' | 'high'
  type TEXT DEFAULT 'general',     -- 'onboarding' | 'general' | 'action'
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_to TEXT,
  related_people TEXT              -- JSON array as text
);
```

## User Stories

### US-001: Invite Co-Parent via Task

**As a** new user without a connected co-parent
**I want to** see an "Invite Your Co-Parent" task in my tasks panel
**So that** I can invite my co-parent as part of my onboarding journey

**Acceptance Criteria**:

- [ ] Task appears for all users without a connected co-parent
- [ ] Task has clear title: "Invite Your Co-Parent"
- [ ] Task description explains the three invite methods
- [ ] Clicking the task opens a modal with invite options
- [ ] Task shows as "high" priority
- [ ] Task auto-completes when co-parent connects

### US-002: Enter Invite Code via Task

**As a** user who received an invite code
**I want to** enter the code through a task action
**So that** I can connect with my co-parent through the task system

**Acceptance Criteria**:

- [ ] Task appears for users who aren't paired: "Connect with Co-Parent"
- [ ] Task includes "Have a code?" action
- [ ] Clicking opens modal with code entry field
- [ ] Validates code format (LZ-XXXXXX)
- [ ] Shows success/error feedback
- [ ] Task auto-completes on successful connection

### US-003: Tasks Visible for All Users

**As a** user (new or existing)
**I want to** always see my tasks
**So that** I know what actions I need to take

**Acceptance Criteria**:

- [ ] All users have at least welcome/onboarding tasks
- [ ] Users missing tasks get them backfilled on login
- [ ] Task loading uses userId from JWT (not username)
- [ ] Clear error handling if tasks fail to load

### US-004: Clean Dashboard Layout

**As a** user
**I want to** see a cleaner dashboard without standalone invite UI
**So that** the interface is less cluttered

**Acceptance Criteria**:

- [ ] "Send Invite" card removed from dashboard
- [ ] "Have a Code?" section removed from dashboard
- [ ] Invite functionality lives entirely in task modal
- [ ] Dashboard focuses on messages and activity

## Functional Requirements

### FR-001: Invite Task Modal

**Description**: Create a modal that opens when clicking the "Invite Your Co-Parent" task

**Modal Contents**:

1. **Tab 1: Send Invite** (default)
   - Method selector: Email | Link | Code
   - Email input (for email method)
   - Generate button
   - Display generated code/link
   - Copy buttons
   - Share button (mobile)

2. **Tab 2: Have a Code**
   - Code input field
   - Validate format hint: "Enter code like LZ-123456"
   - Submit button
   - Error/success feedback

**Business Rules**:

- Uses new `/api/pairing/*` endpoints (Feature 004)
- Email method: 7-day expiration
- Link method: 7-day expiration
- Code method: 15-minute expiration
- Mutual detection: auto-pairs if both users invited each other

### FR-002: Task Backfill for Existing Users

**Description**: Ensure all users have onboarding tasks

**Logic**:

```javascript
// On user login or GET /api/tasks
1. Check if user has any tasks
2. If no tasks exist, create onboarding tasks:
   - "Welcome to LiaiZen" (informational)
   - "Complete Your Profile" (actionable)
   - "Invite Your Co-Parent" OR "Connect with Co-Parent"
   - "Add Your Children"
3. Mark tasks as completed if conditions already met
```

**Onboarding Task Definitions**:

| Task Title             | Priority | Type       | Auto-Complete Condition                 |
| ---------------------- | -------- | ---------- | --------------------------------------- |
| Welcome to LiaiZen     | medium   | onboarding | Manual completion only                  |
| Complete Your Profile  | high     | onboarding | Profile has name, email verified        |
| Invite Your Co-Parent  | high     | onboarding | Co-parent connected                     |
| Connect with Co-Parent | high     | onboarding | Co-parent connected (for invited users) |
| Add Your Children      | medium   | onboarding | At least 1 child contact exists         |

### FR-003: Task Loading Fix

**Description**: Fix task loading to be reliable for all users

**Changes**:

1. Use `userId` from JWT token (not username lookup)
2. Handle missing tasks gracefully (trigger backfill)
3. Remove 5-task limit on dashboard (show all open tasks)
4. Add pagination for users with many tasks

### FR-004: Dashboard Cleanup

**Description**: Remove standalone invite UI from dashboard

**Elements to Remove**:

- ChatRoom.jsx lines 1147-1206: "Send Invite" card
- ChatRoom.jsx lines ~1174-1195: "Have a Code?" section

**Preserve**:

- Settings view invite section (as backup)
- All existing task functionality

## Non-Functional Requirements

### NFR-001: Performance

- Task loading: < 500ms
- Modal open: < 200ms
- Code generation: < 1s

### NFR-002: Usability

- Clear task titles (max 40 chars)
- Actionable descriptions
- Visual priority indicators
- Mobile-responsive modal

### NFR-003: Accessibility

- Modal has proper focus management
- Tab navigation works correctly
- Screen reader labels on all inputs
- Color contrast meets WCAG AA

## Technical Constraints

### Architecture

- Frontend: React 18 + Vite
- Backend: Node.js + Express
- Database: PostgreSQL (Railway)
- Real-time: Socket.io

### API Integration

Uses new pairing API from Feature 004:

- `POST /api/pairing/create` - Create invite
- `GET /api/pairing/status` - Check pairing status
- `POST /api/pairing/accept` - Accept invite code
- `GET /api/pairing/validate/:code` - Validate code

### Design System

- Primary: #275559
- Success: #6dd4b0
- Buttons: rounded-lg, min-h-[44px]
- Modal: max-w-md, rounded-2xl

## UI/UX Design

### Task Card (Enhanced)

```
┌─────────────────────────────────────────┐
│ ⚡ Invite Your Co-Parent          [HIGH] │
│                                         │
│ Connect with your co-parent to start    │
│ communicating on LiaiZen.               │
│                                         │
│ [Open Invite Options →]                 │
└─────────────────────────────────────────┘
```

### Invite Task Modal

```
┌─────────────────────────────────────────┐
│         Invite Your Co-Parent        ✕  │
├─────────────────────────────────────────┤
│  [Send Invite]  │  [Have a Code?]       │
├─────────────────────────────────────────┤
│                                         │
│  How would you like to invite them?     │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐             │
│  │Email│  │Link │  │Code │             │
│  └─────┘  └─────┘  └─────┘             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ coparent@email.com              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Generate Invite]                      │
│                                         │
└─────────────────────────────────────────┘
```

### Have a Code Tab

```
┌─────────────────────────────────────────┐
│         Invite Your Co-Parent        ✕  │
├─────────────────────────────────────────┤
│  [Send Invite]  │  [Have a Code?]       │
├─────────────────────────────────────────┤
│                                         │
│  Enter the code from your co-parent     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ LZ-                             │   │
│  └─────────────────────────────────┘   │
│  Format: LZ-XXXXXX (6 characters)       │
│                                         │
│  [Connect]                              │
│                                         │
└─────────────────────────────────────────┘
```

## Implementation Notes

### Files to Modify

**Frontend**:

- `ChatRoom.jsx` - Remove standalone invite UI, enhance task click handler
- `useTasks.js` - Remove 5-task limit, improve loading logic
- NEW: `InviteTaskModal.jsx` - Combined invite/accept modal

**Backend**:

- `server.js` - Add task backfill logic to GET /api/tasks
- `auth.js` - Ensure onboarding tasks use correct `type` field

### Migration Strategy

1. Deploy task backfill logic first
2. Add InviteTaskModal component
3. Connect task click to modal
4. Remove standalone invite UI
5. Test thoroughly

## Dependencies

- Feature 004: Account Pairing Refactor (provides `/api/pairing/*` endpoints)

## Out of Scope

- Task assignment to co-parent
- Task sharing between users
- Task templates/recurring tasks
- Task notifications/reminders

## Risks & Mitigations

| Risk                            | Impact | Mitigation                        |
| ------------------------------- | ------ | --------------------------------- |
| Users confused by UI change     | Medium | Add tooltip/onboarding hint       |
| Task backfill causes duplicates | High   | Check for existing tasks by title |
| Modal doesn't work on mobile    | Medium | Mobile-first responsive design    |
| API failures block invite flow  | High   | Fallback to direct Settings page  |

## Acceptance Criteria Summary

- [ ] All users see onboarding tasks (new and existing)
- [ ] "Invite Your Co-Parent" task opens modal with all invite options
- [ ] "Have a Code?" functionality accessible via task modal
- [ ] Dashboard no longer has standalone invite UI
- [ ] Tasks load reliably for all users
- [ ] Task auto-completes when co-parent connects
- [ ] Mobile-responsive modal design
- [ ] Uses new pairing API from Feature 004
