# Backend Code Review: APIs + Business Logic

**Date**: 2026-01-06  
**Reviewer**: Code Review Analysis  
**Scope**: Backend (APIs + Business Logic)

---

## Executive Summary

The codebase demonstrates a well-structured Express.js backend with REST APIs, real-time WebSocket communication via Socket.io, and a service-oriented architecture. The codebase shows good separation of concerns with clear service layers, proper authentication/authorization, and comprehensive validation. However, there are areas for improvement in API versioning, RBAC implementation, and async job processing.

---

## 1. API Layer

### ✅ Strengths

**REST API Architecture**

- **Framework**: Express.js 4 with modular route handlers
- **Structure**: Clear route organization in `/routes` directory
- **Endpoints**: Comprehensive REST endpoints for:
  - Messages (`/api/messages`)
  - Authentication (`/api/auth`)
  - Rooms (`/api/room`)
  - Tasks (`/api/tasks`)
  - Contacts (`/api/contacts`)
  - Admin operations (`/api/admin`)
  - Push notifications (`/api/push`)

**Message API Implementation**

- Full CRUD operations with proper HTTP methods
- Pagination support (limit, offset, cursor-based)
- Room membership verification before data access
- Consistent response format: `{ success, data, error }`

**Real-Time Communication**

- Socket.io 4 integration alongside REST APIs
- Per-event rate limiting for Socket.io events
- Authentication middleware for socket connections
- Event-driven architecture with domain events

### ⚠️ Issues & Recommendations

**1. API Versioning - NOT IMPLEMENTED**

**Current State**:

- No API versioning strategy in place
- All endpoints use unversioned paths (`/api/messages`, `/api/auth`)
- No version headers or URL versioning (`/api/v1/messages`)

**Recommendation**:

```javascript
// Implement URL-based versioning
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v2/messages', messagesRoutesV2);

// Or header-based versioning
const apiVersion = req.headers['api-version'] || 'v1';
```

**Impact**: Breaking changes will affect all clients. No deprecation path for old APIs.

**Priority**: Medium (becomes critical as API matures)

---

**2. Rate Limiting - PARTIALLY IMPLEMENTED**

**Current Implementation**:

- ✅ Express middleware using `express-rate-limit`
- ✅ Socket.io per-event rate limiting
- ✅ Redis-based rate limiting utility (optional, graceful degradation)
- ✅ Different limits for auth endpoints vs general API

**Configuration** (from `config.js`):

```javascript
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: IS_PRODUCTION ? 500 : 1000,
  authMaxRequests: 50,
};
```

**Gaps**:

- Rate limits are global per IP, not per user
- No per-endpoint rate limiting configuration
- No rate limit headers in all responses (partially implemented)

**Recommendation**:

```javascript
// Per-user rate limiting
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: req => req.user?.id || req.ip,
  standardHeaders: true,
});

// Per-endpoint limits
router.post('/api/messages', userLimiter, verifyAuth, ...);
router.post('/api/invitations', rateLimit({ max: 5, windowMs: 3600000 }), ...);
```

**Priority**: Medium (currently protects against basic abuse, but not sophisticated attacks)

---

## 2. Business Logic

### ✅ Strengths

**Service Layer Architecture**

- Clear separation: Routes → Services → Repositories
- Service classes with single responsibility
- Examples:
  - `MessageService` - Message business logic
  - `RoomService` - Room operations
  - `ThreadService` - Threading logic
  - `AuthService` - Authentication logic
  - `TaskService` - Task management

**Validation Layer**

- Input validation at route level
- Business rule validation in services
- Examples:
  - `routes/auth/signupValidation.js` - Signup validation
  - `socketHandlers/socketMiddleware/inputValidation.js` - Socket input validation
  - `src/infrastructure/validation/validators.js` - Shared validators

**Domain Rules Implementation**

- Message validation (length, content sanitization)
- Room membership verification
- Thread validation (archived threads can't receive messages)
- Password requirements enforcement

### ⚠️ Issues & Recommendations

**1. Validation Consistency**

**Current State**:

- Validation exists but scattered across multiple files
- Some routes validate, others don't
- Mix of validation approaches (manual checks vs validation libraries)

**Recommendation**:

- Adopt a validation library (Zod, Yup, or Joi)
- Create shared validation schemas
- Enforce validation middleware on all routes

**Example**:

```javascript
// schemas/messageSchema.js
const messageSchema = z.object({
  text: z.string().min(1).max(5000),
  roomId: z.string().uuid(),
  threadId: z.string().uuid().optional(),
});

// routes/messages.js
router.post('/', verifyAuth, validate(messageSchema), ...);
```

**Priority**: Medium

---

**2. Error Handling**

**Current State**:

- Uses `asyncHandler` wrapper for async routes
- Error responses are inconsistent
- Some errors return detailed info, others generic messages

**Recommendation**:

- Standardize error response format
- Create error classes for different error types
- Implement error logging/monitoring

**Priority**: Low (functionally works, but not ideal)

---

## 3. Auth & Authorization

### ✅ Strengths

**Authentication Implementation**

- **JWT-based authentication** with secure token handling
- **Google OAuth** integration
- **Password hashing** with bcrypt
- **Middleware**: `middleware/auth.js` - Clean JWT verification
- **Socket.io auth**: Separate auth middleware for WebSocket connections

**JWT Configuration**:

```javascript
// Secure JWT secret validation (min 32 chars)
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}
```

**Token Handling**:

- Supports both cookie and Authorization header
- Token expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Proper error handling for expired/invalid tokens

### ⚠️ Issues & Recommendations

**1. RBAC Implementation - PARTIAL**

**Current State**:

- **Documented** in PRD: Roles (User, Co-Parent, Attorney observer, Admin)
- **Implemented**: Basic role checks in room memberships (`role: 'owner' | 'member'`)
- **Missing**: Comprehensive RBAC system
- **Gaps**:
  - No role-based permissions framework
  - No permission checks for resource access
  - Admin routes use simple auth check, not role-based

**Current Role Usage**:

```javascript
// Room membership roles (owner/member)
INSERT INTO "room_members" ("room_id", "user_id", "role", "joined_at")
VALUES ($1, $2, 'owner', $3)

// Admin auth (basic check)
function verifyAdminAuth(req) {
  // Simple check, not role-based
}
```

**Recommendation**:

```javascript
// Implement permission-based authorization
const PERMISSIONS = {
  MESSAGE_CREATE: 'message:create',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  ROOM_VIEW: 'room:view',
  ADMIN_ACCESS: 'admin:access',
};

// Permission middleware
function requirePermission(permission) {
  return async (req, res, next) => {
    const userPermissions = await getUserPermissions(req.user.id);
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
router.delete('/messages/:id',
  verifyAuth,
  requirePermission(PERMISSIONS.MESSAGE_DELETE),
  ...
);
```

**Priority**: High (security and scalability concern)

---

**2. Row-Level Security (RLS)**

**Current State**:

- **Documented** in PRD: PostgreSQL RLS for data isolation
- **Unknown** if RLS policies are implemented in database
- Authorization checks done at application level

**Recommendation**:

- Verify RLS policies are enabled and configured
- Document RLS policy implementation
- Test that RLS works even if application checks are bypassed

**Priority**: High (security-critical for data isolation)

---

**3. Authorization Checks**

**Current Implementation**:

- ✅ Room membership verification before message access
- ✅ User ownership checks for message edit/delete
- ⚠️ Some routes may lack proper authorization checks

**Example (Good)**:

```javascript
// routes/messages.js
const isMember = await verifyRoomMembership(userId, roomId, dbSafe);
if (!isMember) {
  return res.status(403).json({ error: 'You are not a member of this room' });
}
```

**Example (Service Layer)**:

```javascript
// messageService.js
if (message.user_email !== userEmail) {
  throw new Error("Unauthorized: cannot edit another user's message");
}
```

**Recommendation**:

- Audit all routes for missing authorization checks
- Create authorization middleware library
- Document authorization requirements per endpoint

**Priority**: Medium

---

## 4. Async Jobs

### ✅ Strengths

**Background Task Infrastructure**

- **Task Manager**: `src/infrastructure/tasks/TaskManager.js`
- **Background Tasks**: `src/infrastructure/initialization/backgroundTasks.js`
- **Scheduled Tasks**:
  - Database migrations
  - Neo4j index initialization
  - Database sync validation
  - Relationship metadata sync

**Async Processing Examples**:

- Message persistence (non-blocking)
- Auto-threading (background processing)
- Topic detection (background)
- Push notifications (async sends)

### ⚠️ Issues & Recommendations

**1. Email Jobs - BASIC IMPLEMENTATION**

**Current State**:

- **Email Service**: `emailService.js` - Basic email sending
- **Templates**: `emailService/templates.js` - Email templates
- **Provider**: Gmail SMTP (Nodemailer)
- **Usage**: Synchronous email sending (no queue)

**Issues**:

- No email queue/job processing
- Synchronous email sends can block request processing
- No retry logic for failed emails
- No email delivery tracking

**Recommendation**:

```javascript
// Implement email queue
const emailQueue = new Bull('email-queue', {
  redis: { host: REDIS_HOST, port: REDIS_PORT }
});

// Add email job
emailQueue.add('send-invitation', {
  email,
  template: 'invitation',
  data: { inviterName, inviteUrl }
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
});

// Process jobs
emailQueue.process('send-invitation', async (job) => {
  await sendNewUserInvite(job.data.email, ...);
});
```

**Priority**: Medium (will become critical at scale)

---

**2. Push Notification Jobs**

**Current State**:

- **Service**: `services/pushNotificationService.js`
- **Implementation**: Direct sends, no queue
- **Retry**: Basic retry on failure (automatic via web-push library)
- **Dead Letter Queue**: Invalid subscriptions are deactivated

**Good Practices**:

- ✅ Subscription validation
- ✅ Error handling for invalid subscriptions (410/404)
- ✅ Logging of send statistics

**Recommendation**:

- Consider queue for high-volume scenarios
- Implement delivery tracking
- Add metrics/monitoring

**Priority**: Low (works well currently)

---

**3. Long-Running Tasks**

**Current State**:

- Auto-threading uses `setImmediate()` for background processing
- Topic detection runs in background
- AI analysis may be long-running (no timeout/queue)

**Issues**:

- Long-running AI operations may block or timeout
- No proper job queue for AI processing
- No retry logic for failed AI operations

**Recommendation**:

- Use job queue (Bull/BullMQ) for AI operations
- Implement timeout handling
- Add progress tracking for long operations

**Priority**: Medium

---

**4. Missing Job Infrastructure**

**Current State**:

- Basic task manager exists
- No job queue library (Bull, BullMQ, Agenda)
- No job monitoring/UI
- No job retry/backoff strategies

**Recommendation**:

- Implement Bull/BullMQ for job processing
- Add job monitoring dashboard
- Configure job retry policies
- Set up dead letter queues

**Priority**: Medium (needed for production scale)

---

## 5. Integrations

### ✅ Implemented Integrations

**1. OpenAI API**

- **Service**: `openaiClient.js`, `src/repositories/OpenAIClient.js`
- **Usage**: AI mediation, message analysis, thread analysis
- **Rate Limiting**: Basic rate limit checks implemented
- **Features**:
  - GPT-3.5 Turbo (tone analysis)
  - GPT-4 Turbo (message rewriting)
  - Thread analysis and topic detection

**2. Google OAuth**

- **Integration**: `routes/auth/oauth.js`
- **Purpose**: User authentication
- **Flow**: OAuth 2.0 with callback handling

**3. Gmail SMTP**

- **Service**: `emailService/send.js`
- **Provider**: Nodemailer with Gmail
- **Usage**: Invitations, password resets, verification codes

**4. Web Push API**

- **Service**: `services/pushNotificationService.js`
- **Library**: `web-push`
- **Features**: VAPID keys, subscription management, notification sending

### ⚠️ Missing/Planned Integrations

**1. Stripe - NOT IMPLEMENTED**

**Current State**:

- **Planned** in PRD (Phase 2)
- **Pricing** documented: $15-25/month tiers
- **No code** found for Stripe integration

**Recommendation**:

```javascript
// Implement Stripe integration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create subscription
router.post('/api/subscriptions', verifyAuth, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: req.user.email,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${APP_URL}/subscription-success`,
    cancel_url: `${APP_URL}/subscription-cancel`,
  });
  res.json({ sessionId: session.id });
});

// Webhook handler
router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

  if (event.type === 'customer.subscription.created') {
    await activateSubscription(event.data.object);
  }
  res.json({ received: true });
});
```

**Priority**: Medium (Phase 2 feature)

---

**2. SMS - NOT IMPLEMENTED**

**Current State**:

- **Not mentioned** in codebase
- **PRD**: No SMS (COPPA compliance - no SMS for children)
- May be needed for 2FA (but PRD mentions TOTP apps instead)

**Recommendation**:

- Not needed for MVP
- If implemented later, use Twilio or similar
- Ensure COPPA compliance (no SMS to users under 13)

**Priority**: Low (not required)

---

**3. Calendar Integrations - NOT IMPLEMENTED**

**Current State**:

- **Planned** in PRD (Phase 2)
- **Integrations**: Google Calendar API, Apple Calendar API
- **No code** found

**Recommendation**:

```javascript
// Google Calendar integration
const { google } = require('googleapis');

router.get('/api/calendar/google/connect', verifyAuth, async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${APP_URL}/api/calendar/google/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });

  res.json({ authUrl: url });
});

// Sync calendar events
async function syncCalendarEvents(userId, calendarId) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const events = await calendar.events.list({ calendarId });
  // Sync to database
}
```

**Priority**: Low (Phase 2 feature)

---

**4. Webhooks - BASIC IMPLEMENTATION**

**Current State**:

- **Socket.io Events**: Real-time events for client communication
- **No Webhook API**: No REST webhook endpoints for third-party integrations
- **Documented** in PRD: "Future: Webhook API for therapist portal integrations (Phase 3)"

**Current WebSocket Events**:

- `message_sent`, `message_received`
- `task_created`, `task_completed`
- `user_joined`, `user_typing`
- `draft_coaching` (AI intervention)

**Recommendation**:

```javascript
// Webhook subscription model
const webhookSchema = {
  id: 'uuid',
  userId: 'number',
  url: 'string',
  events: ['message.created', 'task.completed'],
  secret: 'string',
  isActive: 'boolean',
};

// Webhook delivery
async function deliverWebhook(webhook, event, payload) {
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event,
    },
    body: JSON.stringify(payload),
  });
}
```

**Priority**: Low (Phase 3 feature)

---

## 6. Code Quality & Architecture

### ✅ Strengths

**1. Service Layer Pattern**

- Clear separation: Routes → Services → Repositories
- Services handle business logic
- Repositories handle data access

**2. Modular Structure**

- Well-organized directory structure
- Clear file naming conventions
- Separation of concerns

**3. Error Handling**

- `asyncHandler` wrapper for async routes
- Try-catch blocks in critical paths
- Error logging

**4. Configuration Management**

- Centralized config (`config.js`)
- Environment variable validation
- Type-safe configuration

### ⚠️ Recommendations

**1. Type Safety**

- Consider TypeScript migration
- Or use JSDoc types more extensively
- Add runtime type checking

**2. Testing**

- Good test coverage exists
- Add integration tests for critical flows
- Add API contract testing

**3. Documentation**

- API documentation exists (OpenAPI spec for threading)
- Consider auto-generating API docs (Swagger/OpenAPI)
- Document all endpoints

---

## 7. Security Review

### ✅ Strengths

**1. Authentication**

- Secure JWT implementation
- Strong password requirements
- OAuth integration

**2. Input Validation**

- Input sanitization in place
- SQL injection prevention (parameterized queries)
- XSS prevention (DOMPurify mentioned in frontend)

**3. Rate Limiting**

- Basic rate limiting implemented
- Per-IP and per-event limits

**4. Security Headers**

- Helmet.js configured
- CORS properly configured
- CSP policies in place

### ⚠️ Recommendations

**1. RBAC Implementation** (High Priority)

- Implement comprehensive role-based access control
- See section 3.1 above

**2. Rate Limiting Enhancement** (Medium Priority)

- Implement per-user rate limiting
- Add per-endpoint rate limits
- Use Redis for distributed rate limiting

**3. API Versioning** (Medium Priority)

- Implement API versioning strategy
- See section 1.1 above

**4. Audit Logging**

- **Documented** in PRD: All access logged
- **Verify** implementation exists
- Ensure compliance logging (GDPR, COPPA)

---

## Summary of Priority Actions

### High Priority

1. **Implement RBAC System** - Security and scalability
2. **Verify RLS Policies** - Data isolation security

### Medium Priority

1. **API Versioning Strategy** - Breaking change management
2. **Email Queue System** - Scalability
3. **Job Queue Infrastructure** - Long-running tasks
4. **Enhanced Rate Limiting** - Per-user limits
5. **Validation Consistency** - Standardize validation approach

### Low Priority

1. **Stripe Integration** - Phase 2 feature
2. **Calendar Integrations** - Phase 2 feature
3. **Webhook API** - Phase 3 feature
4. **Error Handling Standardization** - Code quality

---

## Conclusion

The backend demonstrates solid architecture and implementation practices with good separation of concerns, comprehensive authentication, and proper validation. The main areas for improvement are:

1. **Authorization**: Implement full RBAC system and verify RLS policies
2. **API Versioning**: Add versioning strategy before API matures
3. **Async Jobs**: Implement proper job queue for email and long-running tasks
4. **Rate Limiting**: Enhance with per-user limits and per-endpoint configuration

The codebase is production-ready with the current MVP scope but will need enhancements for Phase 2 features and larger scale.
