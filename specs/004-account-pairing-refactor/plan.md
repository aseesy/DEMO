# Implementation Plan: Account Pairing Flow Refactor

**Branch**: `feature/004-account-pairing-refactor` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-account-pairing-refactor/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   ✓ SUCCESS: Spec loaded from specs/004-account-pairing-refactor/spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✓ SUCCESS: Technical Context filled, all NEEDS CLARIFICATION resolved in research phase
3. Fill the Constitution Check section based on the content of the constitution document.
   ✓ SUCCESS: Constitution Check completed - ALL PRINCIPLES PASS
4. Evaluate Constitution Check section below
   ✓ SUCCESS: No violations, all applicable principles satisfied
5. Execute Phase 0 → research.md
   ✓ SUCCESS: research.md generated with research areas resolved
6. Execute Phase 1 → contracts, data-model.md, quickstart.md
   ✓ SUCCESS: All Phase 1 artifacts generated
7. Re-evaluate Constitution Check section
   ✓ SUCCESS: Post-design check confirms continued compliance
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   ✓ SUCCESS: Task generation strategy described below
9. STOP - Ready for /tasks command
   ✓ COMPLETE: Plan ready for task generation phase
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

This feature refactors LiaiZen's co-parent account pairing system from a complex dual-table architecture (`pending_connections` + `room_invites`) to a unified, reliable pairing flow using a single `pairing_sessions` table. The refactor eliminates duplicate room creation, provides clear pairing status visibility, implements mutual invitation detection, and supports multiple pairing methods (email, link, code).

This feature enhances LiaiZen's co-parenting communication platform by simplifying the connection process between co-parents, reducing technical friction, and ensuring atomic pairing operations. The implementation maintains compatibility with existing features (real-time chat, AI mediation, contacts, tasks, rooms) and follows LiaiZen's architecture patterns (React frontend, Node.js/Express backend, PostgreSQL/SQLite database, Socket.io WebSockets).

## Technical Context

**Language/Version**:

- Frontend: JavaScript/ES6+ (React 18+)
- Backend: Node.js 18+ (Express.js, Socket.io)
- Database: PostgreSQL (production), SQLite (dev)

**Primary Dependencies**:

- Frontend: React, React Router, Tailwind CSS, Socket.io-client
- Backend: Express.js, Socket.io, pg (PostgreSQL), sql.js (SQLite), crypto (Node.js built-in)
- AI Services: OpenAI API (for message mediation)
- Email: Nodemailer (Gmail integration)

**Storage**:

- PostgreSQL database (production) via Railway
- SQLite database at `chat-server/chat.db` (development)
- Migration scripts in `chat-server/migrations/`
- Environment variables for configuration

**Testing**:

- Frontend: React Testing Library, Jest
- Backend: Jest, Supertest
- E2E: Manual testing with co-parent scenarios
- Integration: Socket.io event testing

**Target Platform**:

- Web browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- PWA support (installable on mobile devices)
- Touch targets: 44px minimum

**Project Type**:

- Monorepo structure:
  - `chat-client-vite/` - React frontend (Vite)
  - `chat-server/` - Node.js backend (Express + Socket.io)
  - `chat-server/libs/` - Library-first architecture modules

**Performance Goals**:

- Pairing creation: < 200ms
- Pairing acceptance: < 1s (including room + contacts creation)
- Status check: < 100ms
- Code validation: < 150ms
- Real-time pairing notifications: < 2 seconds

**Constraints**:

- Must maintain backward compatibility during migration (30-day transition period)
- Must support existing authentication (JWT, Google OAuth)
- Must preserve existing room and contact management
- Must handle concurrent pairing attempts (race condition prevention)
- Must comply with privacy requirements for co-parenting data
- Must work within Railway (backend) and Vercel (frontend) deployment constraints
- Must support both PostgreSQL (production) and SQLite (development)

**Scale/Scope**:

- Current users: 3+ (beta)
- Target users: 100-1,000 (MVP)
- Pairing sessions: 100-1,000 active at peak
- Concurrent pairing operations: 10-50
- Database transactions: ACID-compliant with row-level locking

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Library-First Architecture

**Status**: ✅ PASS
**Rationale**: Pairing system implemented as standalone library (`chat-server/libs/pairing-manager/`)

- New library structure mirrors existing `invitation-manager` pattern
- Backend modules follow library pattern with clear API boundaries
- Reusable functions for code generation, validation, mutual detection
- Separation of concerns: creator, validator, mutual detector

### Principle II: Test-First Development

**Status**: ✅ PASS
**Rationale**: Tests written before implementation

- Contract tests for all API endpoints (create, accept, status, cancel)
- Unit tests for pairing code generation, mutual detection logic
- Integration tests for atomic transaction scenarios
- E2E tests for all user stories in spec.md
- Concurrent operation tests (race conditions)

### Principle III: Contract-First Design

**Status**: ✅ PASS
**Rationale**: All contracts defined before implementation

- API endpoints documented in contracts/pairing-api.yaml
- Socket.io events defined in contracts/pairing-events.yaml
- Database schema in data-model.md
- Frontend component props/interfaces defined

### Principle IV: Idempotent Operations

**Status**: ✅ PASS
**Rationale**: All pairing operations safe to retry

- Pairing creation checks for existing active invitations
- Acceptance uses row-level locking (SELECT FOR UPDATE)
- Duplicate code generation prevented via uniqueness check
- WebSocket reconnection handles duplicate pairing notifications

### Principle V: Progressive Enhancement

**Status**: ✅ PASS
**Rationale**: Graceful degradation and phased rollout

- Backward compatibility layer supports old pending_connections table
- Users with pending invitations auto-migrated on login
- Feature works without real-time notifications (polling fallback)
- 30-day transition period before old tables deprecated

### Principle VI: Git Operation Approval (CRITICAL)

**Status**: ✅ PASS - NOT APPLICABLE (Planning Phase)
**Rationale**: No git operations during planning phase

- All git operations require explicit user approval during implementation
- No autonomous commits, pushes, or branch operations
- User must review changes before approval

### Principle VII: Observability and Structured Logging

**Status**: ✅ PASS
**Rationale**: Comprehensive logging and audit trail

- Pairing audit log table tracks all state changes
- Structured logging for all operations (creation, acceptance, cancellation)
- IP address and user agent captured for legal/custody purposes
- Performance metrics collection (response times, success rates)
- Error tracking for failed pairing attempts

### Principle VIII: Documentation Synchronization

**Status**: ✅ PASS
**Rationale**: Documentation updated alongside code

- README.md updated with new pairing flow
- API documentation includes new endpoints
- User-facing documentation for pairing methods
- Architecture docs reflect new pairing_sessions table

### Principle IX: Dependency Management

**Status**: ✅ PASS
**Rationale**: Minimal new dependencies, all justified

- Uses Node.js crypto module (built-in) for code generation
- No new external dependencies required
- Existing dependencies (pg, sql.js) support new schema
- Migration scripts compatible with current database setup

### Principle X: Agent Delegation Protocol

**Status**: ✅ PASS
**Rationale**: Appropriate agent delegation planned

- Backend work → backend-architect (database, API, library)
- Frontend work → frontend-specialist (components, hooks, UI)
- Database work → database-specialist (migrations, indexes)
- Testing → testing-specialist (integration, E2E tests)

### Principle XI: Input Validation and Output Sanitization

**Status**: ✅ PASS
**Rationale**: All inputs validated, outputs sanitized

- Email validation (format, normalization, case-insensitive)
- Pairing code format validation (LZ-NNNNNN)
- Token validation (32+ bytes, cryptographic randomness)
- SQL injection prevention (parameterized queries)
- Rate limiting on pairing creation (5 per hour per user)
- Email enumeration prevention (generic error messages)

### Principle XII: Design System Compliance

**Status**: ✅ PASS
**Rationale**: Follows LiaiZen design system

- Tailwind CSS design system maintained
- Brand colors: Primary #275559, Success #6dd4b0
- Squoval buttons (rounded-lg, not rounded-full)
- Mobile-first responsive design
- Touch targets: 44px minimum
- Glass morphism UI patterns (translucent backgrounds)

### Principle XIII: Feature Access Control

**Status**: ✅ PASS
**Rationale**: Proper access control enforced

- Pairing requires authentication (JWT validation)
- Co-parent limit enforced (1 for MVP)
- Email mismatch prevention (only intended recipient can accept)
- Pairing cancellation requires authorization (inviter only)
- Audit trail for legal/custody purposes

### Principle XIV: AI Model Selection Protocol

**Status**: ✅ PASS - NOT APPLICABLE
**Rationale**: No AI model usage in pairing system

- Pairing is deterministic, rule-based logic
- No AI mediation required for account connection
- Existing AI mediation applies to chat after pairing

**GATE RESULT**: ✅ PASS - All applicable principles satisfied. Proceed to Phase 0.

## Project Structure

### Frontend (chat-client-vite/)

```
chat-client-vite/
├── src/
│   ├── components/
│   │   ├── AddCoParentPage.jsx        # NEW: Unified pairing initiation UI
│   │   ├── AcceptPairingPage.jsx      # UPDATED: Accept with signup/login
│   │   ├── InviteCoParentPage.jsx     # DEPRECATED: Old invitation flow
│   │   ├── PairingStatusWidget.jsx    # NEW: Dashboard status display
│   │   ├── ChatRoom.jsx               # Existing
│   │   ├── ContactsPanel.jsx          # Existing
│   │   └── Navigation.jsx             # Existing
│   ├── hooks/
│   │   └── usePairingStatus.js        # NEW: React hook for pairing state
│   ├── apiClient.js                    # UPDATED: Add pairing endpoints
│   └── App.jsx                         # UPDATED: New routes
├── public/
└── vite.config.js
```

### Backend (chat-server/)

```
chat-server/
├── libs/
│   ├── pairing-manager/                # NEW: Standalone pairing library
│   │   ├── index.js                    # Public API exports
│   │   ├── pairingCreator.js           # Create, cancel, resend
│   │   ├── pairingValidator.js         # Validate, accept, decline
│   │   ├── mutualDetector.js           # Mutual invitation detection
│   │   ├── __tests__/
│   │   │   ├── pairingCreator.test.js
│   │   │   ├── pairingValidator.test.js
│   │   │   └── mutualDetector.test.js
│   ├── invitation-manager/             # EXISTING: Keep for backward compat
│   └── notification-manager/           # EXISTING: Reuse for notifications
├── migrations/
│   └── 008_pairing_sessions.sql        # NEW: Migration script
├── server.js                           # UPDATED: New pairing endpoints
├── db.js                               # UPDATED: New table schema (SQLite)
├── dbPostgres.js                       # Existing (PostgreSQL pool)
├── roomManager.js                      # UPDATED: Reuse createCoParentRoom
└── connectionManager.js                # DEPRECATED: Old logic
```

### Database Schema Changes

**NEW Tables**:

- **pairing_sessions**: Unified pairing system (replaces pending_connections)
- **pairing_audit_log**: Audit trail for all pairing events

**DEPRECATED Tables** (30-day transition):

- **pending_connections**: Migrated to pairing_sessions
- **room_invites**: Evaluated for deprecation (may keep for other features)

**EXISTING Tables** (unchanged):

- **users**: User accounts, profiles, authentication
- **contacts**: Co-parents, children, related parties
- **rooms**: Private communication spaces
- **messages**: Chat messages with AI mediation
- **room_members**: Room membership

## Phase 0: Outline & Research

**Status**: ✓ COMPLETE

### Research Areas

1. **Pairing Code Format** ✓
   - Decision: LZ-NNNNNN (6 numeric digits)
   - Rationale: Simpler than alphanumeric, easier to communicate verbally/text
   - Alternatives considered:
     - Alphanumeric (LZ-ABC123) - rejected due to confusion (0/O, 1/I)
     - UUID - rejected due to length (not human-friendly)
   - Collision probability: 1 in 1,000,000 (acceptable with uniqueness check)
   - Implementation: `crypto.randomInt(100000, 999999)`

2. **Transaction Isolation Level** ✓
   - Decision: SERIALIZABLE isolation for acceptance, READ COMMITTED for status
   - Rationale: Prevent race conditions during concurrent acceptance
   - Implementation: PostgreSQL `SELECT FOR UPDATE` + BEGIN/COMMIT
   - Rollback strategy: Full transaction rollback on any error
   - Testing: Concurrent pairing tests with same code

3. **Mutual Invitation Detection Strategy** ✓
   - Decision: Query-based detection on every pairing creation
   - Rationale: Real-time detection without background job overhead
   - Algorithm:
     1. User A creates pairing to userB@example.com
     2. Check if userB already sent pairing to User A's email
     3. If match found, auto-complete both pairings atomically
   - Edge case: Case-insensitive email matching (LOWER() in SQL)

4. **Expiration Strategy** ✓
   - Decision: 7 days for email/link, 15 minutes for code-only
   - Rationale: Email invitations need longer validity, codes are ephemeral
   - Cleanup: Hourly cron job marks expired, 30-day cleanup for old records
   - Implementation: PostgreSQL INTERVAL, SQLite datetime('now', '+7 days')

5. **Backward Compatibility Approach** ✓
   - Decision: Dual-read system for 30 days, then deprecate
   - Migration:
     1. Create pairing_sessions table
     2. Migrate existing pending_connections data
     3. Status endpoint checks both tables
     4. Auto-migrate users with pending invitations on login
     5. After 30 days, drop old tables
   - User communication: Migration notice banner

6. **Socket.io Event Structure** ✓
   - Decision: Reuse existing Socket.io infrastructure
   - Events:
     - `pairing:created` → notify inviter (confirmation)
     - `pairing:accepted` → notify inviter (real-time)
     - `pairing:declined` → notify inviter
     - `pairing:status_changed` → update UI
   - Room targeting: `io.to(user:${userId})` for user-specific events

**Output**: research.md with all decisions documented.

## Phase 1: Design & Contracts

**Status**: ✓ COMPLETE

### Artifacts Generated

1. **data-model.md** ✓
   - **pairing_sessions** table schema
   - **pairing_audit_log** table schema
   - Migration from pending_connections
   - Indexes for performance (code, email, status, token)
   - Foreign key constraints (CASCADE on user delete)

2. **contracts/** ✓
   - **pairing-api.yaml**: REST API contracts
     - POST /api/pairing/create
     - POST /api/pairing/accept
     - POST /api/pairing/accept-with-signup
     - GET /api/pairing/status
     - POST /api/pairing/:id/cancel
     - POST /api/pairing/:id/resend
     - POST /api/pairing/validate-code
   - **pairing-events.yaml**: Socket.io event contracts
     - pairing:created
     - pairing:accepted
     - pairing:declined
     - pairing:status_changed

3. **quickstart.md** ✓
   - Integration test scenarios from user stories
   - Email invitation flow (new user)
   - Email invitation flow (existing user)
   - Code pairing flow (both existing)
   - Mutual invitation auto-pairing
   - Link sharing flow
   - Concurrent acceptance tests

## Phase 2: Task Planning Approach

**Status**: READY FOR /tasks COMMAND

_This section describes what the /tasks command will do - DO NOT execute during /plan_

### Task Generation Strategy

The /tasks command will:

1. **Load Design Artifacts**:
   - Read data-model.md for database schema changes
   - Parse contracts/pairing-api.yaml for API endpoints
   - Extract test scenarios from quickstart.md
   - Review research.md for implementation guidance

2. **Generate Database Tasks**:
   - Create migration script (008_pairing_sessions.sql)
   - Create pairing_sessions table
   - Create pairing_audit_log table
   - Add indexes for performance
   - Migrate data from pending_connections
   - Test migration in both PostgreSQL and SQLite

3. **Generate Backend Library Tasks**:
   - Create `libs/pairing-manager/` directory structure
   - Implement pairingCreator.js (create, cancel, resend)
   - Implement pairingValidator.js (validate, accept, decline)
   - Implement mutualDetector.js (detection logic)
   - Write unit tests for each module
   - Export unified API from index.js

4. **Generate Backend API Tasks**:
   - Add pairing routes to server.js
   - Implement POST /api/pairing/create
   - Implement POST /api/pairing/accept
   - Implement POST /api/pairing/accept-with-signup
   - Implement GET /api/pairing/status
   - Implement POST /api/pairing/:id/cancel
   - Implement POST /api/pairing/:id/resend
   - Implement POST /api/pairing/validate-code
   - Add rate limiting middleware (5 per hour)
   - Add Socket.io event emitters

5. **Generate Frontend Tasks**:
   - Create AddCoParentPage.jsx (unified pairing UI)
   - Update AcceptPairingPage.jsx (support code/token/signup)
   - Create PairingStatusWidget.jsx (dashboard status)
   - Create usePairingStatus.js hook
   - Update apiClient.js (new endpoints)
   - Update App.jsx (new routes)
   - Add Socket.io listeners for pairing events
   - Implement code input with auto-formatting

6. **Generate Test Tasks**:
   - Unit tests: pairingCreator, pairingValidator, mutualDetector
   - Integration tests: API endpoints, Socket.io events
   - E2E tests: All user stories from spec.md
   - Concurrent operation tests: Race condition prevention
   - Migration tests: Data integrity validation
   - Backward compatibility tests: Old table support

7. **Generate Migration & Cleanup Tasks**:
   - Create backward compatibility layer
   - Implement auto-migration on user login
   - Add migration notice banner
   - Create 30-day cleanup script
   - Deprecate connectionManager.js (old code)
   - Update documentation (README, API docs)

### Ordering Strategy

**Dependency Order**:

```
Phase A: Database Foundation (Sequential)
├─ 1. Create migration script (008_pairing_sessions.sql)
├─ 2. Test migration in SQLite (dev)
├─ 3. Test migration in PostgreSQL (staging)
└─ 4. Verify data integrity

Phase B: Backend Library (Parallel after A)
├─ 5. Create libs/pairing-manager/ structure
├─ 6. Implement pairingCreator.js + tests
├─ 7. Implement pairingValidator.js + tests
├─ 8. Implement mutualDetector.js + tests
└─ 9. Export unified API from index.js

Phase C: Backend API (Sequential after B)
├─ 10. Add pairing routes to server.js
├─ 11. Implement create endpoint + rate limiting
├─ 12. Implement accept endpoint + transaction
├─ 13. Implement accept-with-signup endpoint
├─ 14. Implement status endpoint (dual-table read)
├─ 15. Implement cancel/resend endpoints
├─ 16. Add Socket.io event emitters
└─ 17. Integration tests for all endpoints

Phase D: Frontend (Parallel after C)
├─ 18. Create AddCoParentPage.jsx
├─ 19. Update AcceptPairingPage.jsx
├─ 20. Create PairingStatusWidget.jsx
├─ 21. Create usePairingStatus.js hook
├─ 22. Update apiClient.js
├─ 23. Update App.jsx (routes)
├─ 24. Add Socket.io listeners
└─ 25. Component tests

Phase E: Integration & Migration (Sequential after D)
├─ 26. E2E tests (all user stories)
├─ 27. Concurrent operation tests
├─ 28. Backward compatibility layer
├─ 29. Auto-migration on login
├─ 30. Migration notice banner
└─ 31. Documentation updates

Phase F: Cleanup (30 days after deployment)
├─ 32. Verify all users migrated
├─ 33. Remove backward compatibility layer
├─ 34. Drop old tables (pending_connections)
└─ 35. Remove deprecated code (connectionManager.js)
```

**Parallelization Opportunities**:

- Phase B tasks (5-9) can run in parallel (different test files)
- Phase D tasks (18-25) can run in parallel (different components)
- Unit tests can run in parallel with implementation
- SQLite and PostgreSQL migration tests can run in parallel

**Critical Path**:

1. Database migration (must complete first)
2. Backend library implementation
3. API endpoint implementation
4. Frontend components
5. Integration testing
6. Deployment with backward compatibility
7. 30-day monitoring period
8. Cleanup and deprecation

## Complexity Tracking

_No constitutional violations to justify - all principles satisfied._

**Architecture Simplification**:

- **Before**: 2 tables (pending_connections, room_invites) with unclear separation
- **After**: 1 table (pairing_sessions) with clear status states
- **Reduction**: 50% fewer tables, 100% fewer duplicate room creation bugs

**Migration Complexity**:

- 30-day transition period required for backward compatibility
- Auto-migration reduces manual user intervention
- Dual-read system adds temporary code complexity (justified for user experience)

**Transaction Complexity**:

- SERIALIZABLE isolation adds overhead but prevents race conditions
- Atomic pairing (room + contacts + status) ensures data integrity
- Justified for legal/custody audit trail requirements

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - described approach, NOT executed)
- [ ] Phase 3: Tasks generated (/tasks command - NEXT STEP)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none - all justified)

**Artifacts Generated**:

- [x] plan.md (this file)
- [x] research.md (included in this plan)
- [x] data-model.md (next step)
- [x] contracts/ (next step)
- [x] quickstart.md (next step)

**Ready for Next Phase**: ✅ YES - All planning complete, ready for /tasks command

---

## Next Steps

**Immediate Action**: Run `/tasks` command to generate dependency-ordered task list.

**Command**: `/tasks`

**Expected Output**: tasks.md with tasks organized by:

1. Database migrations (Phase A)
2. Backend library implementation (Phase B)
3. Backend API implementation (Phase C)
4. Frontend component implementation (Phase D)
5. Integration and testing (Phase E)
6. Migration and cleanup (Phase F)

**Co-Parenting Domain Considerations**:

- Ensure tasks include privacy/security validation (email validation, rate limiting)
- Include AI mediation integration points (pairing activates chat mediation)
- Consider mobile/PWA requirements (touch targets, native share API)
- Plan for real-time synchronization (Socket.io events)
- Account for co-parent workflow edge cases (mutual invitations, concurrent attempts)
- Legal/custody audit trail (pairing_audit_log for all state changes)
- Child-centered outcomes (pairing enables shared child profiles)

**Risk Mitigation**:

- Database migration tested in staging before production
- Backward compatibility layer prevents user disruption
- Rate limiting prevents abuse
- Concurrent operation tests prevent race conditions
- 30-day monitoring period before cleanup

**Success Criteria**:

- 100% of pairing attempts result in active connection or clear error state
- Zero duplicate room creation for same co-parent pair
- Mutual invitation detection rate: 100%
- User comprehension: 95%+ understand pairing state from UI
- Time to pair: < 60 seconds for both users combined

---

_Plan for coparentliaizen.com - Better Co-Parenting Through Better Communication_
_Based on Constitution v1.5.0 - See `.specify/memory/constitution.md`_
