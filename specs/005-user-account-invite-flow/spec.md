# Feature Specification: User Account Creation & Invitation Flow

## Overview

**Feature ID**: 005-user-account-invite-flow
**Feature Name**: User Account Creation & Co-Parent Invitation Flow
**Business Objective**: Ensure reliable user registration, invitation acceptance, and co-parent syncing with proper identity management to prevent user confusion and data integrity issues.

**Problem Statement**:
The current invitation and user creation flow has several bugs that prevent co-parents from properly syncing, cause confusion with user identity (display names vs usernames), and fail silently when creating contact relationships. Multiple users with the same display name can cause confusion since the system doesn't enforce unique display names.

**Success Metrics**:

- 100% of invitation acceptances result in properly synced co-parents
- 0 silent failures in contact/room creation
- Clear user identification even when display names are duplicated
- No orphaned users or rooms after invitation flow

---

## Technical Context

**Architecture** (from codebase analysis):

- **Frontend**: React 18 + Vite, Tailwind CSS
- **Backend**: Node.js + Express.js, Socket.io
- **Database**: PostgreSQL (via Railway)
- **Deployment**: Vercel (frontend), Railway (backend)

**Existing Tables Involved**:

- `users` - User accounts (id, username, email, display_name)
- `invitations` - Co-parent invitations (token_hash, inviter_id, invitee_email, status)
- `contacts` - Contact relationships (user_id, contact_name, relationship)
- `rooms` / `room_members` - Chat rooms and membership
- `in_app_notifications` - Notification system

**Key Files**:

- `chat-server/auth.js` - Authentication and registration logic
- `chat-server/roomManager.js` - Room creation and membership
- `chat-client-vite/src/components/AcceptInvitationPage.jsx` - Invitation acceptance UI
- `chat-client-vite/src/components/LoginSignup.jsx` - Registration UI
- `chat-client-vite/src/hooks/useInvitations.js` - Invitation management hooks

---

## Current Flow Analysis

### Flow 1: New User Signup (No Invitation)

```
1. User visits /signin → LoginSignup.jsx
2. Fills: Name, Email, Password
3. POST /api/auth/signup
4. Backend generates username from email (e.g., "john" from "john@example.com")
5. Creates user with display_name = provided name, username = generated
6. Creates private room for user
7. Redirects to /invite-coparent
```

**Issues Identified**:

- Username generation has race condition (two simultaneous signups with same email prefix)
- No guarantee of unique usernames under high concurrency

### Flow 2: Invitation Creation

```
1. Logged-in user visits /invite-coparent
2. Clicks "Generate Invite"
3. POST /api/invitations/create
4. Backend creates invitation with:
   - token (random, hashed for storage)
   - short_code (e.g., LZ-ABC123)
   - expires_at (7 days)
5. Returns shareable link and code
```

**Issues Identified**:

- No pre-validation of invitee email (open invitations)
- Anyone with short code can accept

### Flow 3: Invitation Acceptance (New User)

```
1. User clicks invite link → /accept-invite?token=X or ?code=LZ-XXX
2. GET /api/invitations/validate/:token
3. If valid, shows signup form
4. User fills: Email, Name, Password
5. POST /api/auth/register-with-invite
6. Backend:
   a. Validates token/code
   b. Creates user account
   c. Marks invitation "accepted"
   d. Creates shared room
   e. Adds both users to room
   f. Attempts to create contacts (FAILS - schema mismatch)
   g. Sends notification to inviter
7. Returns user data + room info
```

**Critical Bugs Found**:

1. **Schema Mismatch**: Code inserts `owner_id` but table only has `user_id`
2. **Silent Failure**: Contact creation fails but registration continues
3. **No Email Validation**: Short codes accept any email, not just intended recipient

### Flow 4: Invitation Acceptance (Existing User)

```
1. Existing user receives notification
2. Clicks accept in NotificationsPanel
3. POST /api/invitations/accept (authenticated)
4. Backend updates invitation, creates room
5. Same contact creation bug applies
```

---

## User Stories

### US-001: New User Registration via Invitation

**As a** new user who received an invitation
**I want to** create my account and automatically connect with my co-parent
**So that** I can immediately start communicating with them

**Acceptance Criteria**:

- [ ] Can register with email, password, and display name
- [ ] Display name can be any text (not required to be unique)
- [ ] System generates unique internal identifier automatically
- [ ] Upon registration, I am immediately added to shared room with co-parent
- [ ] Both users appear as contacts to each other
- [ ] Inviter receives notification of my registration
- [ ] I can see inviter's display name during registration (for confirmation)

### US-002: Unique User Identification

**As a** co-parent
**I want to** see clear identification of who I'm communicating with
**So that** I don't confuse different people with the same name

**Acceptance Criteria**:

- [ ] System shows display name prominently in UI
- [ ] Users with duplicate display names are distinguished by email domain or initials
- [ ] User profile shows unique identifier for disambiguation
- [ ] In contact lists, email is visible as secondary identifier
- [ ] System never relies solely on display name for matching

### US-003: Invitation Email Matching (Token-Based)

**As a** user sending a specific invitation
**I want to** ensure only the intended recipient can accept
**So that** I don't accidentally connect with the wrong person

**Acceptance Criteria**:

- [ ] Token-based invitations validate email matches
- [ ] Clear error message if email doesn't match invitation
- [ ] Inviter can see which email was used to accept

### US-004: Open Invitation Flow (Short Code)

**As a** user sharing an invite code verbally
**I want to** allow my co-parent to use any email
**So that** they can sign up even if I don't know their preferred email

**Acceptance Criteria**:

- [ ] Short codes do not require email matching (by design)
- [ ] UI clearly indicates this is an "open" invitation
- [ ] Inviter can see confirmation of who accepted
- [ ] Accept notification shows the email that was used

### US-005: Error Recovery

**As a** user
**I want to** understand and recover from registration errors
**So that** I can successfully complete signup

**Acceptance Criteria**:

- [ ] Clear error messages for all failure scenarios
- [ ] Ability to retry if room creation fails
- [ ] Manual support option if automatic sync fails
- [ ] Invitation remains valid if registration fails before acceptance

---

## Functional Requirements

### FR-001: Fix Contact Creation Schema

**Priority**: CRITICAL
**Current State**: Code attempts to insert `owner_id` but column doesn't exist
**Required Changes**:

Option A (Recommended): Modify contacts table schema

```sql
ALTER TABLE contacts ADD COLUMN owner_id INTEGER REFERENCES users(id);
-- Make owner_id the FK for "who owns this contact"
-- Make user_id the FK for "who is the contact" (rename to contact_user_id)
```

Option B: Use existing schema correctly

```javascript
// Change from:
await dbSafe.safeInsert('contacts', {
  owner_id: user.id,  // WRONG
  user_id: acceptResult.inviterId,
  ...
});

// To:
await dbSafe.safeInsert('contacts', {
  user_id: user.id,  // Owner of contact list
  contact_name: inviterUser.displayName,
  contact_email: inviterUser.email,
  relationship: 'co-parent',
  ...
});
```

**Business Rules**:

- Contact creation must succeed or registration must fail/rollback
- Both co-parents must be added as contacts to each other
- Contact records must include email for disambiguation

### FR-002: Atomic Registration Transaction

**Priority**: HIGH
**Required Changes**:

- Wrap registration + invitation acceptance + room creation + contacts in transaction
- Rollback all on any failure
- Return specific error codes for each failure type

**Error Codes**:
| Code | Meaning |
|------|---------|
| `REG_001` | Email already exists |
| `REG_002` | Invalid invitation token |
| `REG_003` | Invitation expired |
| `REG_004` | Invitation already accepted |
| `REG_005` | Room creation failed |
| `REG_006` | Contact creation failed |
| `REG_007` | Database error |

### FR-003: Username Generation Safety

**Priority**: MEDIUM
**Required Changes**:

```javascript
// Use atomic check-and-insert with retry
async function generateUniqueUsername(baseEmail, db, maxRetries = 5) {
  const base = baseEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const suffix = attempt === 0 ? '' : `_${crypto.randomBytes(4).toString('hex')}`;
    const username = `${base}${suffix}`.substring(0, 20);

    try {
      // Attempt insert with unique constraint
      await db.query(
        'INSERT INTO users (username, ...) VALUES ($1, ...) RETURNING id',
        [username, ...]
      );
      return username;
    } catch (e) {
      if (e.code !== '23505') throw e; // Not a unique violation
    }
  }
  throw new Error('Could not generate unique username');
}
```

### FR-004: Display Name Disambiguation

**Priority**: MEDIUM
**Required Changes**:

- Add helper function to generate disambiguated display

```javascript
function getDisambiguatedDisplay(user, allUsers) {
  const sameName = allUsers.filter(u => u.display_name === user.display_name && u.id !== user.id);

  if (sameName.length === 0) {
    return user.display_name;
  }

  // Add email domain for disambiguation
  const domain = user.email.split('@')[1].split('.')[0];
  return `${user.display_name} (${domain})`;
}
```

**UI Display Rules**:

- Primary: Display name only (if unique in context)
- Duplicate detected: `{display_name} ({email_domain})`
- Hover/click: Full email visible
- Profile: Always show email alongside display name

### FR-005: Invitation Validation Enhancement

**Priority**: MEDIUM
**Required Changes**:

For short codes, add confirmation step:

```
1. User enters short code
2. System shows: "You are accepting an invitation from {inviter_name}"
3. User confirms: "Yes, this is my co-parent"
4. Proceed with registration
```

Add inviter visibility during signup:

- Show inviter's display name and email domain
- "Invited by: John D. (gmail)"
- Allow user to cancel if wrong person

---

## Non-Functional Requirements

### NFR-001: Transaction Integrity

- All database operations in invitation acceptance must be atomic
- Use PostgreSQL transactions with proper isolation level
- Implement retry logic for transient failures

### NFR-002: Error Handling

- No silent failures - all errors must be logged and surfaced
- User-facing errors must be clear and actionable
- Technical errors logged with full stack trace for debugging

### NFR-003: Performance

- Invitation validation: < 200ms
- Registration with invitation: < 2s (including all DB operations)
- Room syncing: Real-time via Socket.io

### NFR-004: Security

- Invitation tokens must be cryptographically secure (32+ bytes)
- Token storage must be hashed (SHA-256 or bcrypt)
- Rate limiting on invitation creation (5 per hour per user)
- Rate limiting on acceptance attempts (10 per hour per IP)

### NFR-005: Audit Trail

- Log all invitation state changes
- Track: created, viewed, accepted, declined, expired
- Include timestamps and IP addresses for legal/custody purposes

---

## Edge Cases & Business Rules

### EC-001: Duplicate Email During Registration

**Scenario**: User tries to register with email that already exists
**Current Behavior**: Returns "Email already exists" error
**Required Behavior**:

- Check if existing user is the intended invitee
- If yes, prompt to login instead
- If no, suggest different email

### EC-002: Same Display Name as Inviter

**Scenario**: New user registers with same name as their co-parent
**Current Behavior**: Allowed without warning
**Required Behavior**:

- Warn user: "Your co-parent also uses this name"
- Allow proceed but ensure email disambiguation in UI

### EC-003: Invitation Accepted But Room Missing

**Scenario**: Room creation failed during registration
**Current Behavior**: Registration succeeds, no room exists
**Required Behavior**:

- Registration should fail if room creation fails
- OR implement recovery: auto-create room on next login

### EC-004: User Declines Then Wants to Accept

**Scenario**: User declined invitation, now wants to accept
**Current Behavior**: Cannot accept declined invitation
**Required Behavior**:

- Inviter must send new invitation
- Clear message: "This invitation was declined. Ask {inviter} for a new invite."

### EC-005: Simultaneous Acceptance Attempts

**Scenario**: Two people try to accept same short code simultaneously
**Current Behavior**: Race condition - both might succeed partially
**Required Behavior**:

- Use database transaction with FOR UPDATE lock
- First to complete wins, second gets "already accepted" error

### EC-006: Inviter Deleted Their Account

**Scenario**: User tries to accept invitation but inviter account is gone
**Current Behavior**: May crash or create orphaned records
**Required Behavior**:

- Check inviter exists before accepting
- Clear error: "This invitation is no longer valid"
- Clean up orphaned invitation

---

## Database Changes Required

### Migration: 005_fix_contacts_and_relationships.sql

```sql
-- Option A: Add owner_id to contacts (preferred)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- Migrate existing data: assume user_id is the owner, null for contact person
UPDATE contacts SET owner_id = user_id WHERE owner_id IS NULL;

-- Add new column for the contact's user ID (if they have an account)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_user_id INTEGER REFERENCES users(id);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);

-- Add co_parent_relationships table for bidirectional relationships
CREATE TABLE IF NOT EXISTS co_parent_relationships (
  id SERIAL PRIMARY KEY,
  user_a_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  invitation_id INTEGER REFERENCES invitations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id) -- Enforce ordering to prevent duplicates
);

CREATE INDEX IF NOT EXISTS idx_coparent_rel_user_a ON co_parent_relationships(user_a_id);
CREATE INDEX IF NOT EXISTS idx_coparent_rel_user_b ON co_parent_relationships(user_b_id);
```

---

## API Changes

### Modified Endpoints

#### POST /api/auth/register-with-invite

**Current Issues**: Silent contact creation failure
**Changes**:

- Wrap in transaction
- Return structured response with success indicators

**New Response**:

```json
{
  "success": true,
  "user": {
    "id": 123,
    "username": "john_abc123",
    "email": "john@example.com",
    "displayName": "John Doe"
  },
  "coParent": {
    "id": 456,
    "displayName": "Jane Doe",
    "emailDomain": "gmail"
  },
  "room": {
    "id": "room_abc123",
    "name": "John & Jane"
  },
  "sync": {
    "contactsCreated": true,
    "roomJoined": true,
    "notificationSent": true
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "REG_006",
    "message": "Could not complete co-parent connection",
    "details": "Contact creation failed. Your account was created but you'll need to manually connect.",
    "recoveryUrl": "/support/connection-help"
  },
  "user": {
    /* partial user data if account was created */
  }
}
```

#### GET /api/invitations/validate/:token

**Changes**: Add inviter visibility info

**New Response**:

```json
{
  "valid": true,
  "inviter": {
    "displayName": "Jane Doe",
    "emailDomain": "gmail",
    "joinedDate": "2024-01-15"
  },
  "invitation": {
    "type": "coparent",
    "expiresAt": "2025-12-01T00:00:00Z",
    "isOpenInvite": false
  }
}
```

---

## UI/UX Changes

### AcceptInvitationPage.jsx Modifications

1. **Show Inviter Info During Registration**
   - Display: "You've been invited by {displayName} ({emailDomain})"
   - Add: "Not your co-parent? Don't proceed."

2. **Add Confirmation Step for Short Codes**
   - Before showing form: "Confirm you know this person"
   - Show inviter details for verification

3. **Better Error States**
   - Specific messages for each error code
   - Recovery actions (retry, contact support, etc.)

4. **Success State Improvements**
   - Animate transition to chat
   - Show both users' names: "Connected! You and Jane can now message"

### ProfilePanel.jsx Modifications

1. **Always Show Email**
   - Display email below display name
   - Format: "Display Name\nyou@email.com"

2. **Unique Identifier Visibility**
   - Show internal ID: "User ID: 12345"
   - Useful for support tickets

### ContactsPanel.jsx Modifications

1. **Disambiguation in Contact List**
   - If two contacts have same name, show email domain
   - Format: "John Doe (gmail)" vs "John Doe (yahoo)"

---

## Testing Requirements

### Unit Tests

- [ ] Username generation with concurrent requests
- [ ] Contact creation with correct schema
- [ ] Transaction rollback on partial failure
- [ ] Display name disambiguation logic

### Integration Tests

- [ ] Full registration flow with invitation
- [ ] Existing user accepting invitation
- [ ] Short code vs token validation differences
- [ ] Room creation and membership verification
- [ ] Contact relationship creation (both directions)

### Edge Case Tests

- [ ] Same display name as co-parent
- [ ] Expired invitation handling
- [ ] Already-accepted invitation
- [ ] Missing inviter account
- [ ] Network failure during registration

### Manual Test Scenarios

1. **Happy Path - New User with Token**
   - Inviter creates invitation
   - Invitee clicks link, registers
   - Both see each other in contacts
   - Both can chat in shared room

2. **Happy Path - New User with Short Code**
   - Inviter shares code verbally
   - Invitee goes to /accept-invite, enters code
   - Confirms inviter identity
   - Completes registration
   - Same outcomes as token path

3. **Edge - Duplicate Display Names**
   - Two users named "John Smith"
   - Both should be distinguishable in all UIs
   - No confusion in contact selection

---

## Implementation Priority

### Phase 1: Critical Bug Fixes (Immediate)

1. Fix contacts table schema mismatch
2. Add transaction wrapper to registration
3. Remove silent failure patterns

### Phase 2: Identity Clarity (1-2 days)

1. Add email visibility in all user displays
2. Implement disambiguation for duplicate names
3. Update profile panel

### Phase 3: Flow Improvements (2-3 days)

1. Add confirmation step for short codes
2. Improve error messages and recovery
3. Add sync status to registration response

### Phase 4: Robustness (1 week)

1. Add co_parent_relationships table
2. Implement proper audit trail
3. Add recovery mechanisms for failed syncs

---

## Domain Validation Checklist

| Requirement                | Status     | Notes                                        |
| -------------------------- | ---------- | -------------------------------------------- |
| Child-centered outcomes    | N/A        | This is infrastructure, not child-facing     |
| Conflict reduction         | PASS       | Clear identification prevents user confusion |
| Privacy and security       | PASS       | Tokens hashed, email validation where needed |
| Accessibility              | PASS       | Clear error messages, recovery paths         |
| Asynchronous communication | PASS       | Works across time zones                      |
| Audit trail                | NEEDS WORK | Invitation tracking exists, add more logging |
| Legal compliance           | PASS       | User ID disambiguation for records           |
| Information sharing        | PASS       | Controlled via invitation flow               |

---

## Appendix: Identified Bugs Summary

| Bug #   | Severity | Location                 | Issue                                  | Fix                    |
| ------- | -------- | ------------------------ | -------------------------------------- | ---------------------- |
| BUG-001 | CRITICAL | auth.js:884-895          | `owner_id` column doesn't exist        | Update schema or code  |
| BUG-002 | HIGH     | auth.js:876-879          | Room failure doesn't stop registration | Add transaction        |
| BUG-003 | MEDIUM   | auth.js:946-969          | Short codes accept any email           | Add confirmation step  |
| BUG-004 | MEDIUM   | Multiple                 | display_name vs username confusion     | Standardize usage      |
| BUG-005 | LOW      | auth.js:47-68            | Race condition in username generation  | Use atomic insert      |
| BUG-006 | LOW      | AcceptInvitationPage:129 | `ALREADY_CONNECTED` code not returned  | Align frontend/backend |

---

_Specification created: 2025-11-25_
_Author: Specification Agent_
_Version: 1.0_
