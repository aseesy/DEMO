# Feature Specification: Account Pairing Flow Refactor

## Overview

**Feature ID**: 004-account-pairing-refactor
**Feature Name**: Simplified Co-Parent Account Pairing System
**Business Objective**: Replace the complex dual-invitation system (pending_connections + room_invites) with a unified, reliable pairing flow that makes it easy for co-parents to connect accounts.

**Problem Statement**:
The current invitation system has two separate mechanisms (`pending_connections` and `room_invites`) that create confusion and reliability issues. Users struggle to understand their connection status, invitations get lost, and the system doesn't handle edge cases like mutual invitations or duplicate pairing attempts. The flow needs to be simplified into a single, clear pairing system.

**Success Metrics**:
- 100% of pairing attempts result in active connection or clear error state
- Zero duplicate room creation for same co-parent pair
- Mutual invitation detection rate: 100% when both parties use same child identifiers
- User comprehension: 95%+ understand current pairing state from UI
- Time to pair: < 60 seconds for both users combined

---

## Technical Context

### Current Architecture Analysis

**Tech Stack**:
- **Frontend**: React 18 + Vite, Tailwind CSS
- **Backend**: Node.js + Express.js, Socket.io for real-time
- **Database**: PostgreSQL (production), SQLite (dev)
- **Deployment**: Vercel (frontend), Railway (backend)

**Current Tables**:
```sql
-- OLD SYSTEM (to be refactored):
pending_connections (
  id, inviter_id, invitee_email, token, status, expires_at, created_at, accepted_at
)

room_invites (
  id, room_id, invited_by, invite_code, expires_at, used_by, used_at, created_at
)

-- EXISTING (to be reused):
users (id, username, email, password_hash, google_id, created_at)
rooms (id, name, created_by, is_private, created_at)
room_members (id, room_id, user_id, role, joined_at)
contacts (id, user_id, contact_name, contact_email, relationship, ...)
```

**Current Issues Identified**:
1. **Dual Systems**: Two separate invitation mechanisms cause confusion
2. **No Mutual Detection**: If both users send invites, creates duplicate rooms
3. **Status Visibility**: Users can't see pending state clearly
4. **No Child Context**: Pairing doesn't capture shared children information
5. **Room Proliferation**: Multiple rooms created for same co-parent relationship
6. **Complex State**: pending → accepted → room creation → contact creation (too many steps)

**Key Files to Refactor**:
- `/chat-server/connectionManager.js` - Invitation logic
- `/chat-server/roomManager.js` - Room and contact creation
- `/chat-server/db.js` - Database schema (lines 318-342 for pending_connections)
- `/chat-client-vite/src/components/InviteCoParentPage.jsx` - Invite UI
- `/chat-client-vite/src/components/AcceptInvitationPage.jsx` - Acceptance UI (create if missing)

---

## User Stories

### US-001: New User Invites Co-Parent via Email
**As a** new user who just signed up
**I want to** invite my co-parent by entering their email address
**So that** we can connect our accounts and start using LiaiZen together

**Acceptance Criteria**:
- [ ] After signup, I see "Add Your Co-Parent" screen with email input option
- [ ] System generates pairing record with status = "pending"
- [ ] System sends email to co-parent with invitation link and 6-digit pairing code
- [ ] I can see pairing status: "Waiting for [email] to join"
- [ ] I can resend invite, copy link, or cancel pairing request
- [ ] Co-parent receives email with clear call-to-action button

### US-002: New User Invites Co-Parent via Link
**As a** new user who doesn't know my co-parent's email
**I want to** generate a shareable link
**So that** I can send it via text message or any other channel

**Acceptance Criteria**:
- [ ] I can click "Share Link" to generate unique pairing link
- [ ] Link contains secure pairing token (not email-specific)
- [ ] I can copy link to clipboard with one click
- [ ] I can share via native mobile share API if available
- [ ] Link remains valid for 7 days
- [ ] I see message: "Send this link to your co-parent via text, email, or any messaging app"

### US-003: Co-Parent Accepts Invitation (New User)
**As a** person who received an invitation
**I want to** click the link and sign up
**So that** I'm automatically connected to my co-parent

**Acceptance Criteria**:
- [ ] Clicking link takes me to signup page with invitation context visible
- [ ] I see: "Join [Inviter Name] on LiaiZen"
- [ ] After signup, system automatically pairs our accounts
- [ ] I'm immediately added to shared chat room
- [ ] Both of us appear as contacts to each other (relationship: "co-parent")
- [ ] Inviter receives notification: "[My Name] accepted your invitation"
- [ ] I skip the "invite co-parent" step since I'm already paired

### US-004: Co-Parent Accepts Invitation (Existing User)
**As an** existing LiaiZen user who received an invitation
**I want to** accept the pairing request
**So that** I connect with my co-parent without creating a new account

**Acceptance Criteria**:
- [ ] I receive in-app notification: "[Name] wants to pair accounts"
- [ ] Notification shows pairing code for verification
- [ ] I can accept or decline the pairing request
- [ ] On accept, we're added to shared room immediately
- [ ] On decline, inviter sees: "Pairing request declined"
- [ ] Declined pairings don't prevent new pairing requests

### US-005: Both Users Already Signed Up (Pairing Code Method)
**As a** user who already has an account
**I want to** pair with my co-parent using a simple code
**So that** we can connect quickly without email back-and-forth

**Acceptance Criteria**:
- [ ] I can go to "Pair with Co-Parent" from settings or onboarding
- [ ] I see two options: "Generate Code" or "Enter Code"
- [ ] If I generate code: 6-digit code (e.g., "LZ-842396") displayed prominently
- [ ] Code expires in 15 minutes
- [ ] Co-parent can enter code on their device
- [ ] On match, both accounts paired instantly
- [ ] Both see success message: "Paired with [Name]"
- [ ] System creates shared room and mutual contacts

### US-006: Mutual Invitation Detection
**As a** user who sent an invite
**I want to** be automatically connected if my co-parent also sent me an invite
**So that** we don't have duplicate pairing requests or rooms

**Acceptance Criteria**:
- [ ] If both users invite each other (by email), system detects match
- [ ] System auto-completes pairing without requiring acceptance
- [ ] Both users notified: "You and [Name] are now paired!"
- [ ] Only one shared room is created
- [ ] No duplicate contact records
- [ ] Detection works even if emails differ slightly (case insensitive)

### US-007: View and Manage Pairing Status
**As a** user
**I want to** see my current pairing status clearly
**So that** I understand whether I'm connected, pending, or unpaired

**Acceptance Criteria**:
- [ ] Status badge visible in dashboard/settings
- [ ] **Unpaired**: "Add your co-parent to unlock full features" with CTA button
- [ ] **Pending (Sent)**: "Waiting for [email/name] to accept" with resend/cancel options
- [ ] **Pending (Received)**: "Pairing request from [Name]" with accept/decline buttons
- [ ] **Paired**: "Paired with [Name]" with option to view shared room
- [ ] Clear visual distinction between states (color coding, icons)

### US-008: Cancel or Resend Pairing Request
**As a** user who sent a pairing request
**I want to** resend or cancel the invitation
**So that** I can correct mistakes or follow up if needed

**Acceptance Criteria**:
- [ ] I can click "Resend Invite" to trigger new email
- [ ] I can click "Copy Link" to share via different channel
- [ ] I can click "Cancel Pairing" to void the request
- [ ] Cancelled pairings marked as "canceled" in database
- [ ] Canceled invitations cannot be accepted
- [ ] I can create new pairing request after canceling

---

## Functional Requirements

### FR-001: Unified Pairing Table Schema
**Priority**: CRITICAL
**Description**: Replace dual-system with single `pairing_sessions` table

**New Database Schema**:
```sql
CREATE TABLE pairing_sessions (
  id SERIAL PRIMARY KEY,
  pairing_code VARCHAR(10) UNIQUE NOT NULL,        -- e.g., "LZ-842396"

  -- Participants
  parent_a_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_b_id INTEGER,                              -- NULL until paired
  parent_b_email TEXT,                              -- For email invitations

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending | active | canceled | expired

  -- Invitation metadata
  invite_type VARCHAR(20) NOT NULL,                -- email | link | code
  invite_token TEXT UNIQUE,                        -- Secure token for link-based invites
  invited_by_username TEXT,                        -- For display purposes

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,    -- 7 days for email/link, 15 min for code
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Associated data
  shared_room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,

  -- Constraints
  CHECK (status IN ('pending', 'active', 'canceled', 'expired')),
  CHECK (invite_type IN ('email', 'link', 'code')),
  CHECK (parent_a_id != parent_b_id OR parent_b_id IS NULL)
);

CREATE INDEX idx_pairing_parent_a ON pairing_sessions(parent_a_id);
CREATE INDEX idx_pairing_parent_b ON pairing_sessions(parent_b_id);
CREATE INDEX idx_pairing_email ON pairing_sessions(parent_b_email);
CREATE INDEX idx_pairing_code ON pairing_sessions(pairing_code);
CREATE INDEX idx_pairing_token ON pairing_sessions(invite_token);
CREATE INDEX idx_pairing_status ON pairing_sessions(status);
```

**Migration Strategy**:
```sql
-- Step 1: Create new table
-- (schema above)

-- Step 2: Migrate existing pending_connections
INSERT INTO pairing_sessions (
  pairing_code, parent_a_id, parent_b_email, status, invite_type,
  invite_token, created_at, expires_at, accepted_at
)
SELECT
  CONCAT('LZ-', SUBSTRING(token FROM 1 FOR 6)),  -- Generate code from token
  inviter_id,
  invitee_email,
  status,
  'email',
  token,
  created_at,
  expires_at,
  accepted_at
FROM pending_connections
WHERE status = 'pending' AND expires_at > NOW();

-- Step 3: Link accepted connections to parent_b_id
UPDATE pairing_sessions ps
SET parent_b_id = u.id, status = 'active'
FROM pending_connections pc
INNER JOIN users u ON LOWER(u.email) = LOWER(pc.invitee_email)
WHERE ps.invite_token = pc.token
  AND pc.status = 'accepted';

-- Step 4: Drop old tables (after testing)
-- DROP TABLE pending_connections;
-- DROP TABLE room_invites; (evaluate if still needed for other features)
```

### FR-002: Pairing Code Generation
**Priority**: HIGH
**Description**: Generate secure, human-readable 6-digit pairing codes

**Implementation**:
```javascript
function generatePairingCode() {
  // Format: LZ-NNNNNN (6 random digits)
  // Using crypto for security
  const crypto = require('crypto');
  const numbers = crypto.randomInt(100000, 999999).toString();
  return `LZ-${numbers}`;
}

// Ensure uniqueness by checking database
async function createUniquePairingCode(db) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generatePairingCode();

    // Check if code already exists
    const existing = await db.query(
      'SELECT id FROM pairing_sessions WHERE pairing_code = $1',
      [code]
    );

    if (existing.rows.length === 0) {
      return code;
    }

    attempts++;
  }

  throw new Error('Unable to generate unique pairing code');
}
```

### FR-003: Mutual Invitation Detection
**Priority**: HIGH
**Description**: Automatically pair accounts when both users invite each other

**Detection Logic**:
```javascript
async function detectMutualInvitation(userAId, userBEmail) {
  // Check if userB already sent invite to userA
  const mutualInvite = await db.query(`
    SELECT ps.*, u.email as parent_a_email
    FROM pairing_sessions ps
    INNER JOIN users u ON ps.parent_a_id = u.id
    WHERE ps.parent_b_email = (SELECT email FROM users WHERE id = $1)
      AND ps.status = 'pending'
      AND ps.expires_at > NOW()
      AND (
        u.email = $2 OR
        ps.parent_a_id IN (
          SELECT id FROM users WHERE LOWER(email) = LOWER($2)
        )
      )
  `, [userAId, userBEmail]);

  if (mutualInvite.rows.length > 0) {
    // Mutual invitation detected!
    return mutualInvite.rows[0];
  }

  return null;
}

async function autoCompleteMutualPairing(inviteA, inviteB, userAId, userBId) {
  // Begin transaction
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Update both invitations to 'active'
    await client.query(
      `UPDATE pairing_sessions
       SET status = 'active', parent_b_id = $1, accepted_at = NOW()
       WHERE id = $2`,
      [userBId, inviteA.id]
    );

    await client.query(
      `UPDATE pairing_sessions
       SET status = 'active', parent_b_id = $1, accepted_at = NOW()
       WHERE id = $2`,
      [userAId, inviteB.id]
    );

    // Create shared room (only one)
    const roomId = await createCoParentRoom(userAId, userBId);

    // Update both invitations with room ID
    await client.query(
      `UPDATE pairing_sessions SET shared_room_id = $1 WHERE id = ANY($2)`,
      [roomId, [inviteA.id, inviteB.id]]
    );

    // Create mutual contacts
    await createMutualContacts(client, userAId, userBId);

    await client.query('COMMIT');

    return { success: true, roomId, method: 'mutual_detection' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### FR-004: Atomic Pairing Transaction
**Priority**: CRITICAL
**Description**: All pairing operations must complete atomically or rollback

**Transaction Wrapper**:
```javascript
async function completePairing(pairingSessionId, acceptingUserId) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Lock pairing session to prevent race conditions
    const pairingResult = await client.query(
      `SELECT * FROM pairing_sessions
       WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
       FOR UPDATE`,
      [pairingSessionId]
    );

    if (pairingResult.rows.length === 0) {
      throw new Error('PAIRING_INVALID_OR_EXPIRED');
    }

    const pairing = pairingResult.rows[0];

    // Validate accepting user
    if (pairing.parent_b_email) {
      const acceptingUser = await client.query(
        'SELECT email FROM users WHERE id = $1',
        [acceptingUserId]
      );

      if (acceptingUser.rows[0].email.toLowerCase() !== pairing.parent_b_email.toLowerCase()) {
        throw new Error('PAIRING_EMAIL_MISMATCH');
      }
    }

    // Update pairing session
    await client.query(
      `UPDATE pairing_sessions
       SET status = 'active', parent_b_id = $1, accepted_at = NOW()
       WHERE id = $2`,
      [acceptingUserId, pairingSessionId]
    );

    // Create shared room
    const roomId = await createCoParentRoom(
      client,
      pairing.parent_a_id,
      acceptingUserId
    );

    // Update pairing with room ID
    await client.query(
      'UPDATE pairing_sessions SET shared_room_id = $1 WHERE id = $2',
      [roomId, pairingSessionId]
    );

    // Create mutual contacts
    await createMutualContacts(client, pairing.parent_a_id, acceptingUserId);

    // Send notification to inviter
    await sendPairingAcceptedNotification(
      client,
      pairing.parent_a_id,
      acceptingUserId
    );

    await client.query('COMMIT');

    return {
      success: true,
      roomId,
      parentAId: pairing.parent_a_id,
      parentBId: acceptingUserId
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Pairing transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
```

### FR-005: Pairing Status API
**Priority**: HIGH
**Description**: Provide real-time pairing status for UI display

**API Endpoint**:
```javascript
// GET /api/pairing/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check for active pairing
    const activePairing = await db.query(`
      SELECT ps.*,
             CASE
               WHEN ps.parent_a_id = $1 THEN u2.username
               ELSE u1.username
             END as partner_name
      FROM pairing_sessions ps
      LEFT JOIN users u1 ON ps.parent_a_id = u1.id
      LEFT JOIN users u2 ON ps.parent_b_id = u2.id
      WHERE (ps.parent_a_id = $1 OR ps.parent_b_id = $1)
        AND ps.status = 'active'
      LIMIT 1
    `, [userId]);

    if (activePairing.rows.length > 0) {
      return res.json({
        state: 'paired',
        partner: {
          name: activePairing.rows[0].partner_name,
          roomId: activePairing.rows[0].shared_room_id
        },
        pairedAt: activePairing.rows[0].accepted_at
      });
    }

    // Check for pending sent invitations
    const sentInvites = await db.query(`
      SELECT ps.*, u.email as user_email
      FROM pairing_sessions ps
      LEFT JOIN users u ON ps.parent_b_id = u.id
      WHERE ps.parent_a_id = $1
        AND ps.status = 'pending'
        AND ps.expires_at > NOW()
      ORDER BY ps.created_at DESC
    `, [userId]);

    if (sentInvites.rows.length > 0) {
      return res.json({
        state: 'pending_sent',
        invitations: sentInvites.rows.map(inv => ({
          id: inv.id,
          code: inv.pairing_code,
          inviteeEmail: inv.parent_b_email,
          inviteType: inv.invite_type,
          createdAt: inv.created_at,
          expiresAt: inv.expires_at
        }))
      });
    }

    // Check for pending received invitations
    const userEmail = await db.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    const receivedInvites = await db.query(`
      SELECT ps.*, u.username as inviter_name
      FROM pairing_sessions ps
      INNER JOIN users u ON ps.parent_a_id = u.id
      WHERE LOWER(ps.parent_b_email) = LOWER($1)
        AND ps.status = 'pending'
        AND ps.expires_at > NOW()
      ORDER BY ps.created_at DESC
    `, [userEmail.rows[0].email]);

    if (receivedInvites.rows.length > 0) {
      return res.json({
        state: 'pending_received',
        invitations: receivedInvites.rows.map(inv => ({
          id: inv.id,
          code: inv.pairing_code,
          inviterName: inv.inviter_name,
          createdAt: inv.created_at,
          expiresAt: inv.expires_at
        }))
      });
    }

    // No pairing
    return res.json({
      state: 'unpaired'
    });

  } catch (error) {
    console.error('Error fetching pairing status:', error);
    res.status(500).json({ error: 'Failed to fetch pairing status' });
  }
});
```

### FR-006: Pairing Expiration and Cleanup
**Priority**: MEDIUM
**Description**: Automatically expire old pairing sessions

**Cron Job** (or scheduled task):
```javascript
// Run every hour
async function expirePairingSessions() {
  try {
    const result = await db.query(`
      UPDATE pairing_sessions
      SET status = 'expired'
      WHERE status = 'pending'
        AND expires_at < NOW()
      RETURNING id, pairing_code
    `);

    console.log(`Expired ${result.rowCount} pairing sessions`);

    // Optionally notify users
    for (const session of result.rows) {
      await sendPairingExpiredNotification(session.parent_a_id, session.pairing_code);
    }

  } catch (error) {
    console.error('Error expiring pairing sessions:', error);
  }
}

// Cleanup old expired/canceled sessions (after 30 days)
async function cleanupOldPairingSessions() {
  await db.query(`
    DELETE FROM pairing_sessions
    WHERE status IN ('expired', 'canceled')
      AND created_at < NOW() - INTERVAL '30 days'
  `);
}
```

---

## Non-Functional Requirements

### NFR-001: Transaction Integrity
**Requirement**: All pairing operations must be ACID-compliant
- Use PostgreSQL transactions with `SERIALIZABLE` isolation level for pairing acceptance
- Implement optimistic locking with `FOR UPDATE` to prevent race conditions
- All database operations in pairing flow must complete or rollback entirely

**Validation**:
- Run concurrent pairing tests with same code
- Verify only one pairing completes successfully
- Verify database consistency after rollback

### NFR-002: Security
**Requirements**:
- Pairing codes must be cryptographically random (6 digits = 1M combinations)
- Invite tokens must be 32+ bytes for link-based invitations
- Rate limiting: 5 pairing attempts per user per hour
- Email validation: Prevent email enumeration attacks

**Implementation**:
```javascript
// Rate limiting middleware
const pairingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many pairing attempts, please try again later',
  keyGenerator: (req) => req.user.id
});

// Email enumeration prevention
// Don't reveal whether email exists in database
async function validatePairingEmail(email) {
  // Always return success, send email if exists
  // Return generic message either way
}
```

### NFR-003: Performance
**Target Metrics**:
- Pairing creation: < 200ms
- Pairing acceptance: < 1s (including room + contacts creation)
- Status check: < 100ms
- Code validation: < 150ms

**Optimization Strategies**:
- Database indexes on frequently queried fields
- Cache active pairing status in Redis (5min TTL)
- Use database connection pooling
- Batch contact creation operations

### NFR-004: Real-Time Notifications
**Requirements**:
- Inviter notified within 2 seconds of pairing acceptance
- Socket.io event: `pairing:accepted` sent to inviter
- Push notification sent to mobile devices (if app installed)
- In-app notification badge updated immediately

**Implementation**:
```javascript
// After successful pairing
io.to(`user:${parentAId}`).emit('pairing:accepted', {
  partnerId: parentBId,
  partnerName: acceptingUser.username,
  roomId: sharedRoomId,
  timestamp: new Date().toISOString()
});
```

### NFR-005: Audit Trail
**Requirements**: Log all pairing state changes for legal/custody purposes

**Audit Log Table**:
```sql
CREATE TABLE pairing_audit_log (
  id SERIAL PRIMARY KEY,
  pairing_session_id INTEGER REFERENCES pairing_sessions(id),
  action VARCHAR(50) NOT NULL,  -- created, accepted, declined, canceled, expired
  actor_user_id INTEGER REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_audit_pairing ON pairing_audit_log(pairing_session_id);
CREATE INDEX idx_audit_timestamp ON pairing_audit_log(timestamp DESC);
```

### NFR-006: Backwards Compatibility
**Requirements**: Support users mid-flow in old invitation system

**Migration Strategy**:
1. Keep `pending_connections` table for 30 days after launch
2. Check both old and new tables during status checks
3. Automatically migrate pending invitations on user login
4. Show migration notice: "We've upgraded our pairing system. Your pending invitations are still active."

---

## API Contract

### POST /api/pairing/create
**Description**: Create new pairing invitation

**Request**:
```json
{
  "inviteType": "email",  // email | link | code
  "inviteeEmail": "coparent@example.com"  // Required for email, optional for link
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "pairing": {
    "id": 123,
    "code": "LZ-842396",
    "inviteType": "email",
    "inviteeEmail": "coparent@example.com",
    "inviteUrl": "https://coparentliaizen.com/accept-pairing?token=abc123...",
    "shareableMessage": "Join me on LiaiZen! Use code LZ-842396 or click: https://...",
    "expiresAt": "2025-12-04T10:00:00Z"
  }
}
```

**Error Responses**:
- `400` - Invalid invite type or missing required fields
- `409` - User already paired
- `429` - Rate limit exceeded
- `500` - Server error

### POST /api/pairing/accept
**Description**: Accept pairing invitation (authenticated user)

**Request**:
```json
{
  "pairingCode": "LZ-842396"  // OR
  // "token": "abc123..."
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "pairing": {
    "partnerId": 456,
    "partnerName": "Jane Doe",
    "roomId": "room_xyz789",
    "pairedAt": "2025-11-27T12:00:00Z"
  }
}
```

**Error Responses**:
- `400` - Invalid or missing code/token
- `404` - Pairing not found or expired
- `409` - Already paired or pairing already accepted
- `403` - Email mismatch (for email invitations)
- `500` - Transaction failed

### POST /api/pairing/accept-with-signup
**Description**: Accept pairing and create account in one step (unauthenticated)

**Request**:
```json
{
  "pairingCode": "LZ-842396",  // OR "token": "..."
  "email": "newuser@example.com",
  "password": "securepassword",
  "username": "Jane Doe"
}
```

**Response** (Success - 201):
```json
{
  "success": true,
  "user": {
    "id": 789,
    "username": "jane_doe",
    "email": "newuser@example.com"
  },
  "pairing": {
    "partnerId": 123,
    "partnerName": "John Doe",
    "roomId": "room_xyz789"
  },
  "authToken": "jwt_token_here"
}
```

### GET /api/pairing/status
**Description**: Get current user's pairing status (see FR-005 above)

### POST /api/pairing/:id/cancel
**Description**: Cancel pending pairing invitation

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Pairing invitation canceled"
}
```

### POST /api/pairing/:id/resend
**Description**: Resend pairing invitation email

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "Invitation email resent"
}
```

### POST /api/pairing/validate-code
**Description**: Validate pairing code without accepting (for preview)

**Request**:
```json
{
  "code": "LZ-842396"
}
```

**Response** (Success - 200):
```json
{
  "valid": true,
  "inviter": {
    "name": "John Doe",
    "emailDomain": "gmail"
  },
  "expiresAt": "2025-12-04T10:00:00Z",
  "inviteType": "code"
}
```

---

## UI/UX Changes

### NEW: AddCoParentPage.jsx
**Route**: `/add-coparent` (shown after signup or from settings)

**UI States**:

**State 1: Unpaired - Choose Method**
```
┌─────────────────────────────────────────┐
│  Add Your Co-Parent                     │
│                                         │
│  Choose how to connect:                 │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📧 Invite via Email             │  │
│  │  Send an invitation link         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  🔗 Share Link                   │  │
│  │  Copy link to send anywhere      │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  🔢 Use Pairing Code             │  │
│  │  Quick code-based pairing        │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ⏭ Skip for now                        │
└─────────────────────────────────────────┘
```

**State 2: Email Invitation**
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│  Invite Your Co-Parent                  │
│                                         │
│  Enter their email address:             │
│  ┌──────────────────────────────────┐  │
│  │ coparent@example.com            │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Send Invitation]                      │
│                                         │
│  They'll receive an email with a link   │
│  to join LiaiZen and connect with you.  │
└─────────────────────────────────────────┘
```

**State 3: Pending (After Sending)**
```
┌─────────────────────────────────────────┐
│  Invitation Sent! ✓                     │
│                                         │
│  Waiting for coparent@example.com       │
│  to accept...                           │
│                                         │
│  Pairing Code: LZ-842396                │
│  (They can also use this code)          │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  📋 Copy Link                    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  ↻ Resend Email                  │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  ✕ Cancel Pairing                │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Expires in 6 days, 23 hours            │
└─────────────────────────────────────────┘
```

**State 4: Generate/Enter Code**
```
┌─────────────────────────────────────────┐
│  ← Back                                 │
│                                         │
│  Pairing Code                           │
│                                         │
│  [Generate Code]  [Enter Code]          │
│                                         │
│  ─── OR ───                             │
│                                         │
│  If your co-parent generated a code:    │
│  ┌──────────────────────────────────┐  │
│  │ LZ-______                        │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Connect]                              │
└─────────────────────────────────────────┘
```

**State 5: Code Generated**
```
┌─────────────────────────────────────────┐
│  Your Pairing Code                      │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │         LZ-842396                │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Share this code with your co-parent.   │
│  It expires in 15 minutes.              │
│                                         │
│  [Copy Code]  [Share]                   │
│                                         │
│  ⟲ Auto-refresh every 5 seconds         │
│  Waiting for connection...              │
└─────────────────────────────────────────┘
```

### UPDATED: AcceptPairingPage.jsx
**Route**: `/accept-pairing?token=...` or `/accept-pairing?code=...`

**Flow**:
1. Load invitation details (validate token/code)
2. Show inviter information for confirmation
3. If unauthenticated: Show signup form
4. If authenticated: Show "Accept" button
5. On accept: Complete pairing and redirect to chat

**UI**:
```
┌─────────────────────────────────────────┐
│  Join Your Co-Parent on LiaiZen         │
│                                         │
│  Invitation from:                       │
│  👤 John Doe (gmail)                    │
│                                         │
│  ─────────────────────────────          │
│                                         │
│  Create your account:                   │
│  ┌──────────────────────────────────┐  │
│  │ Your Email                       │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Your Name                        │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Password                         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Accept & Join]                        │
│                                         │
│  Already have an account? [Log in]      │
└─────────────────────────────────────────┘
```

### UPDATED: Dashboard/Settings - Pairing Status Widget

**Unpaired State**:
```
┌─────────────────────────────────────────┐
│  Co-Parent Connection                   │
│                                         │
│  ⚠ Not paired                           │
│                                         │
│  Add your co-parent to unlock:          │
│  • Shared chat                          │
│  • Shared calendar                      │
│  • Shared child profiles                │
│                                         │
│  [Add Co-Parent]                        │
└─────────────────────────────────────────┘
```

**Pending State**:
```
┌─────────────────────────────────────────┐
│  Co-Parent Connection                   │
│                                         │
│  ⏳ Waiting for connection...           │
│                                         │
│  Invitation sent to:                    │
│  coparent@example.com                   │
│                                         │
│  Code: LZ-842396                        │
│                                         │
│  [Manage Invitation]                    │
└─────────────────────────────────────────┘
```

**Paired State**:
```
┌─────────────────────────────────────────┐
│  Co-Parent Connection                   │
│                                         │
│  ✓ Paired with Jane Doe                │
│                                         │
│  Connected: 3 days ago                  │
│                                         │
│  [Open Chat]                            │
└─────────────────────────────────────────┘
```

---

## Migration Plan from Current System

### Phase 1: Database Migration (Week 1)
**Tasks**:
- [ ] Create `pairing_sessions` table in production
- [ ] Run migration script to copy `pending_connections` data
- [ ] Verify data integrity (all pending invitations transferred)
- [ ] Create audit log table
- [ ] Add database indexes

**Rollback Plan**: Keep both tables active for 1 week

### Phase 2: Backend API Development (Week 1-2)
**Tasks**:
- [ ] Implement new pairing endpoints (create, accept, status, cancel)
- [ ] Update `connectionManager.js` to use `pairing_sessions`
- [ ] Implement mutual invitation detection logic
- [ ] Add atomic transaction wrappers
- [ ] Implement pairing expiration cron job
- [ ] Add rate limiting middleware
- [ ] Update Socket.io events for real-time pairing notifications

**Testing**:
- [ ] Unit tests for all new functions
- [ ] Integration tests for pairing flows
- [ ] Load testing for concurrent pairing attempts

### Phase 3: Frontend Refactor (Week 2)
**Tasks**:
- [ ] Create `AddCoParentPage.jsx` component
- [ ] Update `AcceptPairingPage.jsx` for new flow
- [ ] Create pairing status widget component
- [ ] Update `InviteCoParentPage.jsx` to use new API
- [ ] Add real-time pairing status updates via Socket.io
- [ ] Implement code entry UI with auto-formatting (LZ-NNNNNN)

**Testing**:
- [ ] User acceptance testing for all flows
- [ ] Mobile responsive testing
- [ ] Cross-browser testing

### Phase 4: Backwards Compatibility Layer (Week 2-3)
**Tasks**:
- [ ] Add fallback checks for old `pending_connections` table
- [ ] Auto-migrate users with pending invitations on login
- [ ] Show migration notice banner for affected users
- [ ] Monitor error logs for migration issues

### Phase 5: Cleanup (Week 4)
**Tasks**:
- [ ] Verify all users migrated successfully
- [ ] Archive `pending_connections` and `room_invites` tables
- [ ] Remove old invitation code from codebase
- [ ] Update documentation
- [ ] Remove migration compatibility layer

---

## Edge Cases & Business Rules

### EC-001: User Already Paired
**Scenario**: User tries to create pairing when already paired
**Behavior**:
- API returns `409 Conflict`
- Error message: "You are already paired with [Partner Name]"
- Show option to unpair first (requires confirmation)

### EC-002: Duplicate Pairing Code
**Scenario**: Generated code already exists (collision)
**Behavior**:
- Retry generation up to 10 times
- If all fail, throw error and alert engineering team
- Likelihood: 1 in 1,000,000 per attempt

### EC-003: Expired Pairing Code Used
**Scenario**: User tries to use expired code
**Behavior**:
- API returns `404 Not Found`
- Error message: "This pairing code has expired. Please ask your co-parent to send a new invitation."
- Offer "Request New Code" button

### EC-004: Wrong User Accepts Email Invitation
**Scenario**: Email invitation sent to user A, but user B tries to accept
**Behavior**:
- Validate email matches during acceptance
- API returns `403 Forbidden`
- Error message: "This invitation was sent to [email]. Please use the correct account."

### EC-005: Both Users Create Accounts Simultaneously
**Scenario**: Both users sign up without invitation at same time
**Behavior**:
- Both see "Add Co-Parent" screen
- First to send invitation creates pending pairing
- Second user's invitation triggers mutual detection
- System auto-completes pairing

### EC-006: User Cancels Then Tries to Accept
**Scenario**: User A cancels pairing, User B tries to accept canceled invitation
**Behavior**:
- API returns `404 Not Found`
- Error message: "This invitation has been canceled. Please ask your co-parent to send a new invitation."

### EC-007: Network Failure During Pairing
**Scenario**: Transaction fails mid-pairing due to network issue
**Behavior**:
- Transaction automatically rolls back
- No partial pairing created
- User sees error: "Connection failed. Please try again."
- Invitation remains valid for retry

### EC-008: User Deletes Account While Pairing Pending
**Scenario**: User A deletes account before User B accepts
**Behavior**:
- `ON DELETE CASCADE` removes pairing session
- User B's acceptance attempt returns `404`
- Error message: "This invitation is no longer valid."

### EC-009: Email Typo in Invitation
**Scenario**: User enters wrong email address
**Behavior**:
- Allow user to cancel and create new invitation
- Original invitation remains valid until canceled/expired
- No way to "edit" email - must cancel and recreate

### EC-010: Same Device Login (Different Account)
**Scenario**: User A logs out, User B logs in on same device and tries to accept
**Behavior**:
- Email validation prevents wrong user from accepting
- Clear error message guides User B to use correct email
- Suggest creating new account if needed

---

## Testing Requirements

### Unit Tests

**Database Layer**:
- [ ] `generatePairingCode()` produces valid format
- [ ] `createUniquePairingCode()` handles collisions
- [ ] `detectMutualInvitation()` finds matching invites
- [ ] Transaction rollback on pairing failure

**Business Logic**:
- [ ] Email validation (case insensitive)
- [ ] Pairing expiration calculation
- [ ] Status determination logic
- [ ] Rate limiting enforcement

### Integration Tests

**Happy Paths**:
- [ ] Email invitation flow (new user accepts)
- [ ] Email invitation flow (existing user accepts)
- [ ] Link sharing flow
- [ ] Code pairing flow (both users generate/enter)
- [ ] Mutual invitation auto-pairing

**Error Paths**:
- [ ] Expired code rejection
- [ ] Already paired rejection
- [ ] Email mismatch rejection
- [ ] Transaction rollback verification

**Concurrent Operations**:
- [ ] Two users try same code simultaneously (only one succeeds)
- [ ] User creates multiple invitations rapidly (rate limit)
- [ ] Mutual invitations created simultaneously (both complete)

### End-to-End Tests

**Scenario 1: Email Invitation (New User)**
```
1. User A signs up, sees "Add Co-Parent" screen
2. User A enters User B's email, clicks "Send Invitation"
3. Verify email sent to User B with link and code
4. User B clicks link, fills signup form
5. Verify User B account created
6. Verify pairing status = 'active'
7. Verify shared room created
8. Verify mutual contacts created
9. Verify User A receives notification
10. Both users can see each other in contacts
11. Both users can message in shared room
```

**Scenario 2: Code Pairing (Both Existing)**
```
1. User A logs in, goes to "Add Co-Parent"
2. User A clicks "Generate Code", sees LZ-842396
3. User B logs in, goes to "Add Co-Parent"
4. User B clicks "Enter Code", types LZ-842396
5. User B clicks "Connect"
6. Verify pairing completes instantly
7. Both users see success message
8. Verify shared room and contacts created
```

**Scenario 3: Mutual Invitation Auto-Pairing**
```
1. User A sends invitation to userB@example.com
2. User B sends invitation to userA@example.com (before accepting A's)
3. System detects mutual invitations
4. Verify both invitations marked 'active'
5. Verify only ONE shared room created
6. Both users notified of auto-pairing
```

### Performance Tests

**Load Testing**:
- [ ] 100 concurrent pairing creations
- [ ] 50 concurrent code acceptance attempts
- [ ] 1000 pairing status checks per second

**Stress Testing**:
- [ ] Code generation under high load (10k codes/min)
- [ ] Database transaction throughput
- [ ] Socket.io notification delivery latency

---

## Co-Parenting Domain Validation

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Child-Centered Outcomes** | ✅ PASS | Pairing enables shared child profiles and coordinated parenting |
| **Conflict Reduction** | ✅ PASS | Simple, clear pairing process reduces technical frustration |
| **Privacy & Security** | ✅ PASS | Secure codes, email validation, rate limiting, audit trail |
| **Accessibility** | ✅ PASS | Multiple pairing methods (email, link, code) for different tech skills |
| **Asynchronous Communication** | ✅ PASS | Invitations work across time zones, 7-day validity |
| **Audit Trail** | ✅ PASS | All pairing events logged with timestamps and IP addresses |
| **Legal Compliance** | ✅ PASS | GDPR-compliant data handling, user consent required |
| **Crisis Response** | N/A | Not applicable to pairing flow |
| **Selective Sharing** | ✅ PASS | Users control when to pair, can cancel invitations |
| **Invitation State Handling** | ✅ PASS | Clear pending/accepted/expired states with user visibility |
| **AI Mediation Integration** | ✅ PASS | Pairing activates AI mediation in shared room |
| **Real-Time Support** | ✅ PASS | Socket.io notifications for instant pairing feedback |
| **Mobile/PWA Compatibility** | ✅ PASS | Code entry works on all devices, native share API support |
| **Backward Compatibility** | ✅ PASS | Migration plan for existing pending invitations |

---

## Appendix: Comparison to Current System

### What's Being Replaced

**Current System (Complex)**:
```
pending_connections table (email-based)
  ↓
room_invites table (code-based)
  ↓
Multiple invitation paths
  ↓
Unclear status for users
  ↓
Duplicate room creation possible
```

**New System (Simplified)**:
```
pairing_sessions table (unified)
  ↓
Multiple invite types (email/link/code)
  ↓
Single atomic transaction
  ↓
Clear status visibility
  ↓
Mutual detection prevents duplicates
```

### Key Improvements

| Feature | Old System | New System |
|---------|-----------|------------|
| **Tables** | 2 separate (pending_connections, room_invites) | 1 unified (pairing_sessions) |
| **Invite Types** | Email only for pending_connections | Email, Link, Code in one table |
| **Status Visibility** | Unclear, scattered across tables | Single source of truth with clear states |
| **Mutual Detection** | None - duplicates created | Automatic detection and auto-pairing |
| **Transactions** | Partial - room creation separate | Fully atomic - all or nothing |
| **Code Format** | 9-char alphanumeric (LZ-ABC123XY) | 6-digit numeric (LZ-842396) - easier to communicate |
| **Expiration** | 7 days (all types) | 7 days (email/link), 15 min (code) |
| **Real-Time Updates** | None | Socket.io notifications |
| **Audit Trail** | Basic | Comprehensive with all state changes |

### Migration Impact

**Users with pending invitations**:
- Invitations migrated automatically
- No action required
- Codes remain valid

**New users**:
- Clearer onboarding flow
- Multiple pairing options
- Better status visibility

**Database**:
- Schema simplification
- Better query performance (fewer joins)
- Easier maintenance

---

## Implementation Checklist

### Backend
- [ ] Create `pairing_sessions` table schema
- [ ] Create `pairing_audit_log` table
- [ ] Implement pairing code generation
- [ ] Implement mutual invitation detection
- [ ] Create pairing API endpoints (create, accept, status, cancel, resend)
- [ ] Add atomic transaction wrapper
- [ ] Implement Socket.io pairing events
- [ ] Add rate limiting middleware
- [ ] Create pairing expiration cron job
- [ ] Write unit tests
- [ ] Write integration tests

### Frontend
- [ ] Create `AddCoParentPage.jsx`
- [ ] Update `AcceptPairingPage.jsx`
- [ ] Create pairing status widget
- [ ] Add Socket.io listener for pairing events
- [ ] Implement code input with auto-formatting
- [ ] Add native share API integration
- [ ] Update routing for new pages
- [ ] Write component tests
- [ ] Mobile responsive testing

### Database
- [ ] Run migration script (create tables)
- [ ] Migrate existing pending_connections
- [ ] Verify data integrity
- [ ] Create indexes
- [ ] Set up backup before migration

### Deployment
- [ ] Deploy database changes (stage)
- [ ] Deploy backend (stage)
- [ ] Deploy frontend (stage)
- [ ] Run end-to-end tests (stage)
- [ ] Deploy to production (gradual rollout)
- [ ] Monitor error logs
- [ ] Verify migration success

### Documentation
- [ ] Update API documentation
- [ ] Create user help guides
- [ ] Update developer README
- [ ] Document troubleshooting steps

---

**Specification Version**: 1.0
**Created**: 2025-11-27
**Author**: Specification Agent
**Status**: Ready for Review
**Estimated Effort**: 2-3 weeks (1 backend engineer, 1 frontend engineer)

---

*This specification replaces the complex dual-invitation system with a unified, user-friendly pairing flow that better serves co-parents using LiaiZen.*
