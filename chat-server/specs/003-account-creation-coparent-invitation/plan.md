# Implementation Plan: Account Creation with Co-Parent Invitation

**Branch**: `003-account-creation-coparent-invitation` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/athenasees/Desktop/chat/chat-server/specs/003-account-creation-coparent-invitation/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → Spec found and analyzed
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: web (frontend + backend)
   → Structure Decision: Option 2 (backend/ + frontend/)
3. Fill Constitution Check section
   → Evaluated against 17 constitutional principles
4. Evaluate Constitution Check section
   → No violations - design is constitutional
   → Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   → All unknowns resolved (see research.md)
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → Contracts generated, data model defined, test scenarios documented
7. Re-evaluate Constitution Check section
   → No new violations - design remains constitutional
   → Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary

This feature extends the existing authentication system to **require** new users to invite their co-parent immediately after account creation. The invitation flow supports both new users (via email) and existing users (via in-app notification). Upon acceptance, both co-parents are automatically connected in a shared private room with equal permissions. MVP is limited to one co-parent per user, with rooms supporting exactly 2 members.

**Key Technical Approach**:

- Extend existing `auth.js` registration flow with mandatory invitation step
- Create new `invitationManager.js` library to handle secure token generation, validation, and lifecycle management
- Use existing `emailService.js` for new user email delivery
- Create new in-app notification system for existing users
- Extend `roomManager.js` to support automatic co-parent room sharing on invitation acceptance
- PostgreSQL schema extensions for `invitations` and `notifications` tables

## Technical Context

**Language/Version**: Node.js 18+ (JavaScript ES6+)
**Primary Dependencies**: Express.js 4.18.2, PostgreSQL 8.16.3, bcrypt 6.0.0, nodemailer 6.9.7, Socket.io 4.6.1
**Storage**: PostgreSQL (all environments - development and production)
**Testing**: Jest 30.2.0 (existing test framework)
**Target Platform**: Linux server (Railway production), macOS (local development)
**Project Type**: web (backend at `/Users/athenasees/Desktop/chat/chat-server/`, frontend at `/Users/athenasees/Desktop/chat/chat-client-vite/`)
**Performance Goals**:

- Invitation email delivery within 5 minutes (NFR-005)
- Account creation completes within 3 seconds under normal load (NFR-004)
- Invitation token validation within 200ms

**Constraints**:

- Must maintain backward compatibility with existing auth flow
- One co-parent only for MVP (rooms limited to 2 members)
- Invitation links expire after 7 days
- Must work across all major email clients (NFR-006)
- Accessible via screen readers (WCAG 2.1 AA compliance - NFR-008)

**Scale/Scope**:

- Estimated 100-1000 users in first 3 months
- ~50% invitation acceptance rate expected within 7 days
- Database will store invitation history for audit trail compliance

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Part I: Core Immutable Principles

#### Principle I: Library-First Architecture ✅ PASS

- **Requirement**: Every feature must begin as standalone library
- **Implementation**:
  - `invitationManager.js` created as standalone library with clear API
  - All invitation logic (token generation, validation, expiration) encapsulated
  - Library is reusable beyond immediate use case (can support future features like group invitations)
- **Compliance**: ✅ Feature implemented as library-first

#### Principle II: Test-First Development ✅ PASS (PLANNED)

- **Requirement**: TDD mandatory - write tests before implementation
- **Implementation**:
  - Contract tests for all API endpoints will be generated in Phase 1
  - Integration tests from acceptance scenarios (6 scenarios identified in spec)
  - Tests will initially fail (no implementation exists yet)
  - Target coverage: >80% (>95% for security-critical invitation token generation)
- **Compliance**: ✅ Tests planned before implementation (will be executed in /tasks phase)

#### Principle III: Contract-First Design ✅ PASS (PLANNED)

- **Requirement**: All integration points defined by contracts before implementation
- **Implementation**:
  - OpenAPI 3.1 contracts for all endpoints (see contracts/ directory)
  - Database contracts via migration files
  - Event contracts for WebSocket in-app notifications
- **Compliance**: ✅ Contracts will be defined in Phase 1 before implementation

### Part II: Quality and Safety Principles

#### Principle IV: Idempotent Operations ✅ PASS

- **Requirement**: Operations safely repeatable without side effects
- **Implementation**:
  - Re-sending invitation to same email: updates existing invitation token
  - Accepting invitation multiple times: returns "already accepted" status
  - Creating account with existing email: returns clear error (no duplicate creation)
- **Compliance**: ✅ All operations designed for idempotency

#### Principle V: Progressive Enhancement ✅ PASS

- **Requirement**: Simplest solution first, add complexity only when proven necessary
- **Implementation**:
  - MVP: One co-parent only (multiple co-parents deferred to future release)
  - Invitation tokens: Simple crypto.randomBytes() (no complex JWT initially)
  - Email delivery: Using existing nodemailer setup (no new service)
  - In-app notifications: Simple database table + Socket.io events (no separate notification service)
- **Compliance**: ✅ YAGNI applied, complexity justified

#### Principle VI: Git Operation Approval ✅ PASS

- **Requirement**: NO automatic git operations without explicit user approval
- **Implementation**: This is a planning document only - no git operations performed
- **Compliance**: ✅ N/A (planning phase - no git operations)

#### Principle VII: Observability and Structured Logging ✅ PASS

- **Requirement**: Structured logs and metrics for debugging/audit trails
- **Implementation**:
  - All invitation operations logged: creation, validation, acceptance, expiration
  - JSON format: `{timestamp, event: "invitation_created", inviter_id, invitee_email, token_hash, expires_at}`
  - PII redaction: Never log full email addresses or tokens (only hashes)
  - Audit trail: invitation_status column tracks lifecycle (pending → accepted/expired)
- **Compliance**: ✅ Observability built into design

#### Principle VIII: Documentation Synchronization ✅ PASS

- **Requirement**: Documentation stays synchronized with code changes
- **Implementation**:
  - API endpoints documented in OpenAPI spec (auto-generated docs)
  - README.md updated with invitation flow instructions
  - CLAUDE.md updated with invitation-specific commands and patterns
  - Migration files include comments explaining schema changes
- **Compliance**: ✅ Documentation plan included

#### Principle IX: Dependency Management ✅ PASS

- **Requirement**: Dependencies explicitly declared, version-pinned, regularly audited
- **Implementation**:
  - No new dependencies required (uses existing bcrypt, nodemailer, pg, crypto)
  - All dependencies already pinned in package.json
  - Security: bcrypt for password hashing, crypto.randomBytes for token generation
- **Compliance**: ✅ No new dependencies, existing ones already compliant

### Part III: Workflow and Delegation Principles

#### Principle X: Agent Delegation Protocol ✅ PASS

- **Requirement**: Specialized work delegated to specialized agents
- **Implementation**:
  - This is planning-agent work (Phase 2 of SDD workflow pipeline)
  - Domain: Backend architecture, database schema, API design
  - No delegation needed (planning-agent is the specialist for this phase)
- **Compliance**: ✅ Appropriate agent for planning work

#### Principle XI: Input Validation and Output Sanitization ✅ PASS

- **Requirement**: All inputs validated, outputs sanitized, secrets never logged
- **Implementation**:
  - Email validation: RFC 5322 format check (FR-002)
  - Token validation: check expiration, single-use enforcement (FR-018, FR-019)
  - Password validation: security requirements enforced (FR-004)
  - Output: Invitation tokens are URL-safe base64 (no special character issues)
  - Secrets: Tokens never logged, stored as hashed values in database
  - SQL injection prevention: Parameterized queries via dbSafe.safeInsert/safeUpdate
- **Compliance**: ✅ Security validation at every boundary

#### Principle XII: Design System Compliance ✅ PASS

- **Requirement**: UI components comply with design system (WCAG 2.1 AA)
- **Implementation**:
  - Signup form: Accessible labels, error messages, keyboard navigation
  - Invitation UI: Clear instructions, neutral tone, trauma-informed language
  - Email templates: Responsive design, works on mobile devices (NFR-009)
  - Colors: Calming blues/greens (existing LiaiZen palette)
  - Touch targets: 44px minimum for mobile (existing standard)
- **Compliance**: ✅ Follows existing design system

#### Principle XIII: Feature Access Control ✅ PASS

- **Requirement**: Access restrictions enforced at backend and frontend
- **Implementation**:
  - Backend: JWT token validation before all authenticated endpoints
  - Frontend: Login check before showing invitation UI
  - Invitation links: Secure tokens required, cannot be guessed
  - Room access: Only room members can view messages
- **Compliance**: ✅ Dual-layer enforcement planned

#### Principle XIV: AI Model Selection Protocol ✅ PASS

- **Requirement**: Use appropriate AI models for tasks
- **Implementation**: No AI model usage in this feature (pure business logic)
- **Compliance**: ✅ N/A (no AI integration)

### Part III-B: Co-Parenting Domain Principles

#### Principle XV: Conflict Reduction First ✅ PASS

- **Requirement**: Prioritize conflict reduction over documentation
- **Implementation**:
  - Equal permissions: Both co-parents have identical room access (no power imbalance)
  - Neutral language: Invitation emails use professional, non-judgmental tone
  - Immediate connection: Fast onboarding reduces frustration and friction
  - Child-focused: Onboarding emphasizes children's wellbeing in messaging
- **Compliance**: ✅ Conflict reduction prioritized in design

#### Principle XVI: Privacy by Default ✅ PASS

- **Requirement**: Family data protection, COPPA/GDPR compliance
- **Implementation**:
  - Email addresses: Only shared with explicit consent (invitation sent)
  - Audit trail: Invitation events logged for legal compliance (GDPR Article 30)
  - Token security: Cryptographically secure tokens prevent unauthorized access
  - Data minimization: Only collect email, no unnecessary personal data
  - No child data: Invitation flow does NOT collect children's information (COPPA)
- **Compliance**: ✅ Privacy requirements met

#### Principle XVII: Neutral Platform Stance ✅ PASS

- **Requirement**: Platform never picks sides between co-parents
- **Implementation**:
  - Room ownership: No "owner" vs "guest" - both are equal "members"
  - Invitation language: "You've been invited" (not "X wants to control/monitor you")
  - Notifications: Both parents receive identical UI/email treatment
  - Error messages: Neutral tone, no blame language
- **Compliance**: ✅ Neutrality maintained throughout

**Constitution Check Summary**: ✅ ALL 17 PRINCIPLES PASS - No violations, no complexity justifications needed

## Project Structure

### Documentation (this feature)

```
specs/003-account-creation-coparent-invitation/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── auth.yaml        # POST /api/auth/register (extended)
│   ├── invitations.yaml # POST /send, GET /:token, POST /:token/accept
│   └── notifications.yaml # GET /api/notifications
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

#### Option 2: Web application (backend + frontend detected)

```
chat-server/ (backend)
├── invitationManager.js      # NEW: Invitation logic library
├── notificationManager.js    # NEW: In-app notification library
├── auth.js                   # MODIFIED: Add mandatory invitation step
├── roomManager.js            # MODIFIED: Support co-parent room sharing
├── emailService.js           # MODIFIED: Add new invitation templates
├── server.js                 # MODIFIED: Add invitation API endpoints
├── migrations/
│   └── 003_invitations.sql   # NEW: Database schema for invitations + notifications
└── tests/
    ├── contract/
    │   ├── auth.test.js      # NEW: Registration + invitation contract tests
    │   ├── invitations.test.js # NEW: Invitation API contract tests
    │   └── notifications.test.js # NEW: Notification API contract tests
    ├── integration/
    │   ├── signup-invite-accept.test.js # NEW: Full user journey test
    │   ├── existing-user-invite.test.js # NEW: Existing user notification test
    │   └── invite-expiration.test.js    # NEW: Expiration handling test
    └── unit/
        ├── invitationManager.test.js    # NEW: Unit tests for invitation logic
        └── notificationManager.test.js  # NEW: Unit tests for notifications

chat-client-vite/ (frontend)
├── src/
│   ├── components/
│   │   ├── SignupForm.jsx        # MODIFIED: Add invitation step after signup
│   │   ├── InvitationForm.jsx    # NEW: Co-parent invitation UI
│   │   ├── NotificationBell.jsx  # NEW: In-app notification indicator
│   │   └── NotificationPanel.jsx # NEW: Accept/decline invitation UI
│   ├── pages/
│   │   ├── Signup.jsx            # MODIFIED: Multi-step signup (account + invite)
│   │   ├── AcceptInvite.jsx      # NEW: Landing page for /join?token=XXX
│   │   └── Notifications.jsx     # NEW: /notifications page
│   └── services/
│       ├── authService.js        # MODIFIED: Add invitation endpoints
│       └── notificationService.js # NEW: Notification API client
```

**Structure Decision**: Option 2 (Web application) - separate backend/frontend directories

## Phase 0: Outline & Research

### Research Completed

See [research.md](./research.md) for detailed findings.

**Key Decisions**:

1. **Invitation Token Generation**: crypto.randomBytes(32) → base64url (secure, simple)
2. **Token Storage**: Store hashed token in database (SHA-256) for security
3. **Email Delivery**: Use existing nodemailer with Gmail/SMTP configuration
4. **In-App Notifications**: PostgreSQL table + Socket.io events (no separate service)
5. **Expiration Handling**: PostgreSQL TIMESTAMP comparison + cron cleanup job
6. **Room Architecture**: Extend existing room_members table (no schema changes needed)

**All NEEDS CLARIFICATION from spec resolved**:

- ✅ Password requirements: Min 8 chars, 1 uppercase, 1 number (existing standard)
- ✅ Invitation timing: Required step immediately after account creation
- ✅ Multiple co-parents: Not supported in MVP (one co-parent only, rooms limited to 2)
- ✅ Existing user handling: In-app notification only (no email to existing users)
- ✅ Invitation link sharing: Email validation on signup prevents wrong recipient

**Output**: research.md with all unknowns resolved ✅

## Phase 1: Design & Contracts

### 1. Data Model

See [data-model.md](./data-model.md) for complete entity definitions.

**Key Entities**:

- **User** (extended): Added invitation relationship
- **Invitation** (new): Token, inviter, invitee email, status, expiration
- **InAppNotification** (new): User, type, message, read status, invitation reference
- **Room** (existing): No changes needed
- **RoomMember** (existing): No changes needed

### 2. API Contracts

See [contracts/](./contracts/) directory for OpenAPI specifications.

**Endpoints**:

- `POST /api/auth/register` - Extended with invitation step
- `POST /api/invitations/send` - Send invitation to co-parent
- `GET /api/invitations/:token` - Validate invitation token
- `POST /api/invitations/:token/accept` - Accept invitation and create room
- `GET /api/notifications` - Get user's in-app notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read

### 3. Contract Tests

See [contracts/](./contracts/) for test scenario mappings.

**Test Coverage**:

- ✅ One test file per endpoint
- ✅ Request/response schema validation
- ✅ Error case coverage (expired token, invalid email, etc.)
- ✅ All tests will initially fail (no implementation yet)

### 4. Test Scenarios

See [quickstart.md](./quickstart.md) for detailed test execution steps.

**Integration Scenarios** (from spec.md acceptance criteria):

1. New User Account Creation
2. Co-Parent Invitation (New User)
3. Co-Parent Accepts Invitation (Creates Account)
4. Shared Room Access
5. Invitation to Existing User
6. Expired Invitation

### 5. Update CLAUDE.md

The CLAUDE.md file at `/Users/athenasees/Desktop/chat/CLAUDE.md` will be updated incrementally with:

- New API endpoints and their purposes
- Invitation flow architecture decisions
- Common troubleshooting patterns (token expiration, email delivery failures)
- Testing guidance for invitation features
- Recent changes summary (keep last 3 updates)

**Output**: data-model.md, contracts/, failing tests, quickstart.md, CLAUDE.md updated ✅

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Dependency ordering: Database migrations → Libraries → API routes → Frontend components
- TDD order: Tests before implementation

**Task Categories**:

**1. Database Tasks**:

- Create migration file: `003_invitations.sql`
- Add `invitations` table with indexes
- Add `in_app_notifications` table with indexes
- Test migration up/down (rollback capability)

**2. Library Tasks** (parallel after migration):

- [P] Create `invitationManager.js` with token generation, validation, expiration
- [P] Create `notificationManager.js` with CRUD operations
- [P] Write unit tests for `invitationManager.js`
- [P] Write unit tests for `notificationManager.js`

**3. Backend API Tasks** (after library tests pass):

- Extend `auth.js` with invitation step in registration flow
- Extend `emailService.js` with invitation email templates
- Modify `roomManager.js` to support co-parent room sharing
- Add invitation routes to `server.js` (POST /send, GET /:token, POST /accept)
- Add notification routes to `server.js` (GET /notifications, PATCH /:id/read)
- Write contract tests for all endpoints

**4. Frontend Tasks** (parallel with backend):

- [P] Create `InvitationForm.jsx` component
- [P] Create `NotificationBell.jsx` component
- [P] Create `NotificationPanel.jsx` component
- [P] Create `AcceptInvite.jsx` page (for /join?token=XXX)
- [P] Modify `SignupForm.jsx` to include invitation step
- [P] Create `authService.js` invitation methods
- [P] Create `notificationService.js` API client
- [P] Add real-time notification listener (Socket.io)

**5. Integration Test Tasks** (after backend + frontend complete):

- Scenario 1: Full signup → invite → accept flow
- Scenario 2: Existing user invitation → in-app notification
- Scenario 3: Invitation expiration handling
- Scenario 4: Email delivery failure handling
- Scenario 5: Shared room access validation

**6. Documentation Tasks**:

- Update README.md with invitation flow instructions
- Update CLAUDE.md with new endpoints and patterns
- Add API documentation screenshots/examples
- Create user-facing help article (optional)

**Ordering Strategy**:

```
Migration [1] → Libraries [2-5 parallel] → Backend API [6-11] → Frontend [12-19 parallel] → Integration Tests [20-24] → Docs [25-28]
```

**Estimated Output**: ~28-32 numbered, dependency-ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following TDD workflow)
**Phase 5**: Validation

- Run all tests (contract, unit, integration)
- Execute quickstart.md test scenarios manually
- Performance validation (email delivery within 5 min, account creation within 3 sec)
- Accessibility validation (WCAG 2.1 AA compliance)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

**No violations detected** - This section is intentionally left empty.

All complexity decisions align with Progressive Enhancement (Principle V):

- One co-parent only (MVP simplification)
- Simple token generation (crypto.randomBytes vs JWT)
- Database-backed notifications (vs separate service)

All decisions have clear justification documented in research.md.

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - approach described) ✅
- [ ] Phase 3: Tasks generated (/tasks command - NEXT STEP)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented: N/A (no deviations) ✅

**Readiness Assessment**: ✅ READY FOR /tasks COMMAND

This plan has been validated against all 17 constitutional principles, all technical unknowns have been resolved, and complete design artifacts (research, data model, contracts, test scenarios) are ready for task generation.

---

_Based on Constitution v2.0.0 - See `.specify/memory/constitution.md`_
_Planning executed by planning-agent per Principle X (Agent Delegation Protocol)_
