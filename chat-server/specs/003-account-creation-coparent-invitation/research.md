# Technical Research: Account Creation with Co-Parent Invitation

**Feature**: 003-account-creation-coparent-invitation
**Date**: 2025-11-25
**Researcher**: planning-agent

## Executive Summary

This document consolidates technical research findings for implementing a secure co-parent invitation system. All design decisions prioritize security, simplicity, and backward compatibility with the existing LiaiZen authentication infrastructure.

**Key Findings**:

- ✅ Existing codebase has solid foundation for extension (auth.js, emailService.js, roomManager.js)
- ✅ No new dependencies required - crypto, bcrypt, nodemailer already available
- ✅ Simple token-based approach preferred over complex JWT for MVP
- ✅ Database schema minimal changes needed (2 new tables only)

---

## Technology Stack Decisions

### 1. Backend Framework: Node.js + Express.js ✅ (EXISTING)

**Decision**: Use existing Node.js 18+ and Express.js 4.18.2 setup

**Rationale**:

- Already deployed and tested in production
- Team familiar with Express.js patterns
- Existing auth middleware can be reused
- No learning curve for new framework

**Alternatives Considered**:

- **NestJS**: Rejected - would require full backend rewrite
- **Fastify**: Rejected - migration effort not justified for this feature

**Dependencies**: Already in package.json (express@4.18.2)

---

### 2. Invitation Token Generation: crypto.randomBytes()

**Decision**: Use Node.js built-in `crypto.randomBytes(32)` with base64url encoding

**Rationale**:

- Cryptographically secure (uses OS entropy source)
- No external dependencies required
- Standard Node.js module (built-in)
- Simple to implement and test
- Generates URL-safe tokens (base64url encoding)

**Alternatives Considered**:

- **JWT (jsonwebtoken)**: Rejected - Overkill for single-use invitation tokens. JWT is better for session tokens that need to be stateless. Our tokens are single-use and validated against database anyway.
- **UUID v4**: Rejected - Less secure than crypto.randomBytes (only 122 bits of randomness vs 256 bits)
- **Short codes (6-digit)**: Rejected - Not secure enough (only 1M combinations, brute-forceable)

**Implementation Pattern**:

```javascript
const crypto = require('crypto');

function generateInvitationToken() {
  // 32 bytes = 256 bits of entropy (very secure)
  return crypto.randomBytes(32).toString('base64url');
  // base64url = URL-safe (no +, /, = characters that break URLs)
}
```

**Security Analysis**:

- 32 bytes = 256 bits of entropy
- 2^256 = 1.16 x 10^77 possible values (impossible to brute force)
- base64url encoding = 43 characters (URL-safe, no escaping needed)

**Best Practices Reference**:

- OWASP: "Use cryptographically secure random number generators for security tokens"
- NIST SP 800-90A: crypto.randomBytes meets NIST standards for random number generation

---

### 3. Token Storage: Hashed Tokens in PostgreSQL

**Decision**: Store SHA-256 hash of token in database, send plain token via email only

**Rationale**:

- Defense in depth: Even if database is compromised, tokens cannot be reverse-engineered
- Follows password hashing best practices
- Minimal performance impact (SHA-256 is fast)
- Industry standard for token storage

**Alternatives Considered**:

- **Plain text tokens**: Rejected - Security risk if database compromised
- **Bcrypt hashing**: Rejected - Bcrypt is slow (designed for passwords), SHA-256 sufficient for tokens
- **Encrypted tokens**: Rejected - Adds complexity, hashing is simpler and equally secure

**Implementation Pattern**:

```javascript
const crypto = require('crypto');

// When creating invitation
const token = generateInvitationToken(); // 43-char random string
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
// Store tokenHash in database, send token via email

// When validating invitation
const receivedToken = req.params.token;
const receivedHash = crypto.createHash('sha256').update(receivedToken).digest('hex');
// Query database WHERE token_hash = receivedHash
```

**Security Benefits**:

- Database leak does NOT leak valid tokens
- Rainbow table attacks ineffective (each token is unique, not reused)
- Complies with GDPR "data protection by design" principle

**Best Practices Reference**:

- GitHub, GitLab, Auth0 all use token hashing for invitation/reset tokens
- OWASP: "Never store authentication tokens in plain text"

---

### 4. Email Delivery: nodemailer (EXISTING)

**Decision**: Use existing nodemailer setup with Gmail OAuth2 / SMTP

**Rationale**:

- Already configured in emailService.js
- No new setup required (EMAIL_SERVICE env var already exists)
- Supports both development (console logging) and production (Gmail/SMTP)
- sendNewUserInvite() function already exists - just needs to be used

**Alternatives Considered**:

- **SendGrid**: Rejected - New dependency, new API key management, $15/month cost
- **AWS SES**: Rejected - Requires AWS account, additional complexity
- **Mailgun**: Rejected - New dependency, paid service

**Existing Implementation**:
File: `/Users/athenasees/Desktop/chat/chat-server/emailService.js`

- Function: `sendNewUserInvite(email, inviterName, token, appName)`
- Already handles HTML + plain text templates
- Already has retry logic and error handling
- Development mode logs to console (no email sent)

**Email Template Requirements**:

- Subject: "You're invited to co-parent on LiaiZen"
- Invitation link: `${FRONTEND_URL}/join?token=${token}`
- Expiration notice: "This invitation will expire in 7 days"
- Neutral tone: "X has invited you" (not "X wants to connect with you")

**Best Practices**:

- Responsive HTML email (works on mobile)
- Plain text fallback for email clients that don't support HTML
- Clear call-to-action button
- Link also shown as plain text (for clients that strip buttons)

---

### 5. In-App Notification System: PostgreSQL + Socket.io

**Decision**: Store notifications in PostgreSQL `in_app_notifications` table, push real-time updates via Socket.io

**Rationale**:

- Simple database-backed approach (no new services required)
- Socket.io already in use for chat messages (reuse existing connection)
- PostgreSQL provides persistence and audit trail
- No need for separate notification service (Pusher, Firebase Cloud Messaging, etc.)

**Alternatives Considered**:

- **Pusher**: Rejected - $49/month for hosted push notifications, overkill for MVP
- **Firebase Cloud Messaging**: Rejected - New dependency, requires Google setup
- **Redis Pub/Sub**: Rejected - Adds Redis dependency, no persistence (notifications need to survive server restart)
- **In-memory notifications**: Rejected - Lost on server restart, no audit trail

**Schema Design**:

```sql
CREATE TABLE in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'invitation_received', 'invitation_accepted', etc.
  message TEXT NOT NULL,
  data JSONB,  -- {invitation_id, inviter_name, etc.}
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Real-Time Delivery**:

- When invitation sent to existing user → create notification row
- Emit Socket.io event: `socket.to(userSocketId).emit('notification', notificationData)`
- Frontend listens for 'notification' event, updates UI (notification bell badge)

**Fallback Behavior**:

- User offline when notification sent → notification persists in database
- User logs in later → GET /api/notifications returns unread notifications
- No messages lost (persistent storage)

**Best Practices**:

- Mark as read when user views notification (PATCH /api/notifications/:id/read)
- Cleanup old read notifications after 30 days (cron job)
- Index on user_id + is_read for fast queries

---

### 6. Room Sharing Architecture: Extend room_members Table

**Decision**: Use existing `room_members` table to add co-parent to inviter's private room

**Rationale**:

- Minimal schema changes (no new tables needed)
- Existing getUserRoom() already handles multi-member rooms
- Room already has is_private flag (no public room concerns)
- Simple JOIN query to get room members

**Existing Schema** (from migrations/001_initial_schema.sql):

```sql
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  is_private INTEGER DEFAULT 1,
  created_at TIMESTAMP
);

CREATE TABLE room_members (
  room_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE(room_id, user_id)
);
```

**Flow**:

1. Parent 1 signs up → `createPrivateRoom(userId, username)` creates room
2. Parent 1 invites Parent 2 → invitation created with room_id
3. Parent 2 accepts → INSERT INTO room_members (room_id, user_id, role='member')
4. Both parents now in same room → getUserRoom() returns shared room for both

**Alternatives Considered**:

- **Create new room on acceptance**: Rejected - Wastes inviter's original room
- **Link rooms together**: Rejected - Overly complex for MVP
- **Shared rooms table**: Rejected - Existing room_members table is sufficient

**Room Member Equality**:

- Both co-parents have role='member' (no owner/admin distinction)
- Ensures neutral platform stance (Principle XVII)
- Both have equal read/write permissions

**Best Practices**:

- UNIQUE(room_id, user_id) prevents duplicate memberships
- CASCADE DELETE ensures cleanup when room deleted
- Indexed on room_id for fast member lookups

---

### 7. Invitation Expiration: PostgreSQL TIMESTAMP + Cron Cleanup

**Decision**: Store expiration as TIMESTAMP WITH TIME ZONE, validate on access, cleanup via cron job

**Rationale**:

- PostgreSQL natively handles timezone-aware timestamps
- Validation query: `WHERE expires_at > NOW()` (simple and efficient)
- Cron job cleans up expired invitations (keeps database lean)
- No need for external scheduler service

**Implementation**:

```javascript
// When creating invitation
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
await dbSafe.safeInsert('invitations', {
  token_hash: tokenHash,
  invitee_email: email,
  expires_at: expiresAt.toISOString(),
  status: 'pending',
});

// When validating invitation
const query = `
  SELECT * FROM invitations
  WHERE token_hash = $1
  AND status = 'pending'
  AND expires_at > NOW()
`;
```

**Cron Job** (optional - for cleanup):

```javascript
// Run daily at 2am
cron.schedule('0 2 * * *', async () => {
  await db.query(`
    UPDATE invitations
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < NOW()
  `);
});
```

**Alternatives Considered**:

- **TTL in Redis**: Rejected - Requires Redis, no audit trail of expired invitations
- **Application-level expiration**: Rejected - Must check expiration on every request (slower)
- **No expiration**: Rejected - Security risk (invitation links valid forever)

**Best Practices**:

- 7-day expiration balances security and usability
- Keep expired invitations for audit trail (status='expired', not DELETE)
- Index on expires_at for fast cleanup queries

---

### 8. Backward Compatibility: Extend Existing Functions

**Decision**: Modify existing auth.js functions to add invitation step, maintain backward compatibility

**Rationale**:

- Existing createUserWithEmail() already handles user creation
- Add optional invitation parameter: `createUserWithEmail(email, password, context, googleId, oauthProvider, invitationToken)`
- Non-breaking change: invitationToken defaults to null (existing flows unaffected)

**Existing Code** (auth.js line 36):

```javascript
async function createUserWithEmail(
  email,
  password,
  context = {},
  googleId = null,
  oauthProvider = null
) {
  // ... existing logic
}
```

**Modified Signature**:

```javascript
async function createUserWithEmail(
  email,
  password,
  context = {},
  googleId = null,
  oauthProvider = null,
  invitationToken = null
) {
  // ... existing logic

  // NEW: If invitation token provided, validate and process it
  if (invitationToken) {
    const invitation = await invitationManager.validateToken(invitationToken);
    if (invitation) {
      await invitationManager.acceptInvitation(invitation.id, userId);
      await roomManager.addMemberToRoom(invitation.room_id, userId);
    }
  }

  return { id: userId, username, email, context, room };
}
```

**Backward Compatibility Tests**:

- ✅ Existing signup flow (no invitation) continues to work
- ✅ Google OAuth signup (no invitation) continues to work
- ✅ New signup flow (with invitation) works as expected

**Alternatives Considered**:

- **Create new createUserWithInvitation() function**: Rejected - Code duplication
- **Break existing API**: Rejected - Would break frontend

---

## Database Schema Decisions

### 9. Invitations Table Design

**Schema**:

```sql
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  inviter_id INTEGER NOT NULL,
  invitee_email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,  -- SHA-256 hash of token
  room_id TEXT NOT NULL,  -- Room to add invitee to
  status TEXT DEFAULT 'pending',  -- pending, accepted, expired, cancelled
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by INTEGER,  -- user_id who accepted (for verification)
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status_expires ON invitations(status, expires_at);
```

**Design Rationale**:

- `token_hash` UNIQUE prevents duplicate tokens
- `invitee_email` NOT `invitee_id` because user may not exist yet
- `status` enum tracks lifecycle (pending → accepted/expired)
- `room_id` links invitation to specific room (for acceptance flow)
- `accepted_by` verifies correct user accepted (security check)

**Index Strategy**:

- `idx_invitations_token_hash`: Fast token validation lookup
- `idx_invitations_invitee_email`: Check if user already has pending invitation
- `idx_invitations_status_expires`: Fast cleanup of expired invitations

**Audit Trail**:

- Keep expired/cancelled invitations (don't DELETE)
- created_at, accepted_at, expires_at provide complete timeline
- Supports legal compliance (GDPR Article 30 - audit logs)

---

### 10. In-App Notifications Table Design

**Schema**:

```sql
CREATE TABLE in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'invitation_received', 'invitation_accepted', 'room_joined', etc.
  message TEXT NOT NULL,  -- Human-readable message for UI
  data JSONB,  -- Structured data (invitation_id, inviter_name, room_id, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON in_app_notifications(created_at DESC);
```

**Design Rationale**:

- `type` allows frontend to render different notification styles
- `message` is pre-formatted for display (reduces frontend logic)
- `data` JSONB stores structured info (for actions like "Accept" button)
- `is_read` + `read_at` track notification lifecycle

**Index Strategy**:

- `idx_notifications_user_unread`: Fast query for unread notifications (most common query)
- `idx_notifications_created`: Chronological ordering for notification feed

**JSONB Data Example**:

```json
{
  "invitation_id": 123,
  "inviter_id": 456,
  "inviter_name": "John Smith",
  "room_id": "room_1234567890_abc123",
  "action_url": "/invitations/abc123def456/accept"
}
```

**Cleanup Strategy**:

- Cron job deletes read notifications older than 30 days
- Unread notifications never auto-deleted (user's responsibility to read/dismiss)

---

## Password Requirements (Resolved Clarification)

**Decision**: Minimum 8 characters, at least 1 uppercase, 1 number

**Rationale**:

- Existing auth.js uses bcrypt with saltRounds=10 (secure hashing)
- Frontend already has password validation (in SignupForm)
- NIST SP 800-63B recommends minimum 8 characters
- Uppercase + number requirement balances security and usability

**Implementation** (frontend validation):

```javascript
function validatePassword(password) {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least 1 number';
  return null; // Valid
}
```

**Backend Enforcement** (defense in depth):

```javascript
// In auth.js createUserWithEmail()
if (password) {
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('Password does not meet security requirements');
  }
  const passwordHash = await hashPassword(password);
  userData.password_hash = passwordHash;
}
```

**Best Practices Reference**:

- NIST SP 800-63B: "Verifiers SHALL require subscriber-chosen memorized secrets to be at least 8 characters"
- OWASP: "Enforce password complexity at both client and server"

---

## Email Security Best Practices

### 11. Prevent Email Enumeration Attacks

**Decision**: Return generic error for invalid/duplicate emails

**Rationale**:

- Prevents attackers from discovering registered email addresses
- Generic error: "If this email is valid, an invitation has been sent"
- User receives email if account exists (secure behavior)

**Implementation**:

```javascript
// POST /api/invitations/send
async function sendInvitation(req, res) {
  const { email } = req.body;

  // Always return success (even if email invalid/duplicate)
  res.status(200).json({
    success: true,
    message: 'If this email is valid, an invitation has been sent',
  });

  // Async: Send email only if valid
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    // Existing user → in-app notification only
    await notificationManager.create({
      user_id: existingUser.id,
      type: 'invitation_received',
      message: `${req.user.username} wants to connect with you`,
    });
  } else {
    // New user → send email
    await emailService.sendNewUserInvite(email, req.user.username, token);
  }
}
```

**Best Practices**:

- Never reveal "Email already exists" vs "Email not found"
- Log suspicious activity (multiple failed attempts from same IP)
- Rate limit invitation sending (max 5 per hour per user)

---

## Testing Strategy

### 12. Test Framework: Jest (EXISTING)

**Decision**: Use existing Jest setup (package.json already has jest@30.2.0)

**Rationale**:

- No new test framework setup required
- Team already familiar with Jest syntax
- Supports async/await testing (essential for database operations)

**Test Structure**:

```
tests/
├── unit/
│   ├── invitationManager.test.js  # Token generation, validation, expiration
│   └── notificationManager.test.js  # CRUD operations
├── contract/
│   ├── auth.test.js  # POST /api/auth/register with invitation
│   ├── invitations.test.js  # POST /send, GET /:token, POST /:token/accept
│   └── notifications.test.js  # GET /api/notifications
└── integration/
    ├── signup-invite-accept.test.js  # Full user journey
    ├── existing-user-invite.test.js  # Existing user notification
    └── invite-expiration.test.js  # Expiration handling
```

**Coverage Targets**:

- Unit tests: 95% (security-critical token generation)
- Contract tests: 100% (all endpoints)
- Integration tests: 80% (major user journeys)

---

### 13. Testing Patterns for Invitation Flow

**Pattern 1: Unit Test - Token Generation**

```javascript
// tests/unit/invitationManager.test.js
describe('generateToken', () => {
  it('should generate unique tokens', () => {
    const token1 = invitationManager.generateToken();
    const token2 = invitationManager.generateToken();
    expect(token1).not.toEqual(token2);
    expect(token1).toHaveLength(43); // base64url of 32 bytes
  });

  it('should generate URL-safe tokens', () => {
    const token = invitationManager.generateToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/); // No +, /, = characters
  });
});
```

**Pattern 2: Contract Test - API Endpoint**

```javascript
// tests/contract/invitations.test.js
describe('POST /api/invitations/send', () => {
  it('should return 200 with valid email', async () => {
    const res = await request(app)
      .post('/api/invitations/send')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 400 with invalid email format', async () => {
    const res = await request(app)
      .post('/api/invitations/send')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ email: 'invalid-email' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
```

**Pattern 3: Integration Test - Full Flow**

```javascript
// tests/integration/signup-invite-accept.test.js
describe('Signup → Invite → Accept Flow', () => {
  it('should complete full co-parent connection', async () => {
    // Step 1: Parent 1 signs up
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'parent1@example.com', password: 'Password123' });
    expect(res1.status).toBe(201);
    const parent1Token = res1.body.token;

    // Step 2: Parent 1 sends invitation
    const res2 = await request(app)
      .post('/api/invitations/send')
      .set('Authorization', `Bearer ${parent1Token}`)
      .send({ email: 'parent2@example.com' });
    expect(res2.status).toBe(200);

    // Step 3: Get invitation token from database
    const invitation = await db.query('SELECT token FROM invitations WHERE invitee_email = $1', [
      'parent2@example.com',
    ]);
    const inviteToken = invitation.rows[0].token;

    // Step 4: Parent 2 accepts invitation
    const res3 = await request(app)
      .post(`/api/invitations/${inviteToken}/accept`)
      .send({ email: 'parent2@example.com', password: 'Password123' });
    expect(res3.status).toBe(201);

    // Step 5: Verify both parents in same room
    const parent1Room = await roomManager.getUserRoom(res1.body.user.id);
    const parent2Room = await roomManager.getUserRoom(res3.body.user.id);
    expect(parent1Room.roomId).toEqual(parent2Room.roomId);
  });
});
```

---

## Performance Considerations

### 14. Database Query Optimization

**Decision**: Strategic indexes on high-traffic columns

**Indexes Created**:

```sql
-- Fast token lookup (every invitation validation)
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);

-- Fast pending invitation check (when sending invitation)
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);

-- Fast unread notification query (every page load)
CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, is_read);

-- Fast expired invitation cleanup (daily cron job)
CREATE INDEX idx_invitations_status_expires ON invitations(status, expires_at);
```

**Query Performance Targets**:

- Token validation: <50ms (indexed lookup on token_hash)
- Unread notifications: <100ms (indexed on user_id + is_read)
- Room member query: <100ms (existing index on room_id)

**Load Testing**:

- Simulate 100 concurrent signups → measure DB connection pool usage
- Simulate 1000 invitation validations → measure query latency
- Target: <200ms p95 for all invitation operations (NFR constraint)

---

### 15. Email Delivery Reliability

**Decision**: Async email sending with retry logic

**Rationale**:

- Email sending should not block HTTP response (user sees immediate feedback)
- Retry failed emails up to 3 times with exponential backoff
- Log all email failures for monitoring

**Implementation** (existing in emailService.js):

```javascript
async function sendEmail(to, subject, htmlBody, textBody) {
  // Async send - don't await in HTTP handler
  try {
    const info = await transporter.sendMail({ to, subject, html: htmlBody, text: textBody });
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Retry logic handled by nodemailer internally (3 retries with exponential backoff)
    throw error;
  }
}
```

**Monitoring**:

- Track email delivery success rate (target: >95%)
- Alert if delivery failure rate >5% over 1 hour
- Daily report of failed email deliveries

**Best Practices**:

- Never block HTTP response on email sending
- Return success to user immediately (queued for sending)
- Retry transient failures (network errors), don't retry permanent failures (invalid email)

---

## Security Hardening

### 16. Rate Limiting

**Decision**: Limit invitation sending to 5 per hour per user

**Rationale**:

- Prevents spam/abuse of invitation system
- Legitimate users rarely need to send >5 invitations per hour
- Protects email reputation (prevents being flagged as spam)

**Implementation** (using existing express-rate-limit):

```javascript
const rateLimit = require('express-rate-limit');

const invitationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many invitations sent. Please try again later.',
  keyGenerator: req => req.user.id, // Rate limit per user, not IP
});

app.post('/api/invitations/send', authenticate, invitationLimiter, sendInvitation);
```

**Alternatives Considered**:

- **10 per hour**: Rejected - Too generous, enables spam
- **1 per hour**: Rejected - Too restrictive for legitimate use (typo in email address)

**Best Practices**:

- Rate limit per user (not IP) to prevent shared IP restrictions
- Return clear error message when rate limit exceeded
- Log rate limit violations for security monitoring

---

### 17. Input Sanitization

**Decision**: Validate and sanitize all user inputs at API boundary

**Validation Rules**:

- Email: RFC 5322 format check using validator library
- Token: Must be 43-character base64url string (no SQL injection risk)
- Room ID: Must match existing room_id format (alphanumeric + underscore)

**Implementation**:

```javascript
const validator = require('validator');

function validateInvitationRequest(req, res, next) {
  const { email } = req.body;

  // Email validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Sanitize email (trim whitespace, lowercase)
  req.body.email = email.trim().toLowerCase();

  next();
}

app.post('/api/invitations/send', authenticate, validateInvitationRequest, sendInvitation);
```

**SQL Injection Prevention**:

- All queries use parameterized statements ($1, $2, etc.)
- dbSafe.safeInsert/safeUpdate already handle escaping
- Never concatenate user input into SQL strings

**XSS Prevention**:

- Email body rendered as plain text (not HTML in database)
- Frontend sanitizes user input before rendering (React escapes by default)

---

## Deployment Considerations

### 18. Environment Variables

**Required Variables** (already exist):

- `DATABASE_URL`: PostgreSQL connection string
- `EMAIL_SERVICE`: gmail / gmail-oauth2 / smtp
- `GMAIL_USER`: Sender email address
- `GMAIL_APP_PASSWORD`: Gmail app-specific password
- `FRONTEND_URL`: Frontend base URL for invitation links

**New Variables** (none required):

- All functionality uses existing environment variables

**Configuration Validation**:

```javascript
// In server.js startup
function validateConfig() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required in production');
    if (!process.env.EMAIL_SERVICE) throw new Error('EMAIL_SERVICE required in production');
    if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL required in production');
  }
}
validateConfig();
```

**Best Practices**:

- Fail fast on startup if required config missing
- Log configuration status (without leaking secrets)
- Provide helpful error messages for missing config

---

## Migration Strategy

### 19. Database Migration Plan

**Migration File**: `003_invitations.sql`

**Up Migration**:

```sql
-- Create invitations table
CREATE TABLE invitations (
  id SERIAL PRIMARY KEY,
  inviter_id INTEGER NOT NULL,
  invitee_email TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  room_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by INTEGER,
  FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_invitee_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status_expires ON invitations(status, expires_at);

-- Create in-app notifications table
CREATE TABLE in_app_notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_unread ON in_app_notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON in_app_notifications(created_at DESC);
```

**Down Migration** (rollback):

```sql
DROP TABLE IF EXISTS in_app_notifications CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
```

**Testing**:

- Run up migration on test database
- Verify tables and indexes created
- Run down migration (rollback)
- Verify clean rollback (no orphaned data)
- Re-run up migration (ensure idempotency)

**Best Practices**:

- Always provide rollback path (down migration)
- Test migrations on staging environment first
- Backup production database before running migration
- Run migrations during low-traffic periods

---

## Conclusion

All technical unknowns have been resolved. The design leverages existing infrastructure (Node.js, Express, PostgreSQL, nodemailer, Socket.io) with minimal new dependencies. Security is prioritized through token hashing, rate limiting, and input validation. The implementation follows constitutional principles (Library-First, Test-First, Contract-First) and maintains backward compatibility.

**Next Steps**: Proceed to Phase 1 (Design & Contracts) to generate API contracts, data models, and test scenarios.

---

**Research Status**: ✅ COMPLETE
**Unknowns Remaining**: 0
**Constitution Violations**: 0
**New Dependencies Required**: 0
**Readiness for Implementation**: ✅ READY
