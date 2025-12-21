# Implementation Plan: {{FEATURE_NAME}}

**Branch**: `{{BRANCH_NAME}}` | **Date**: {{DATE}} | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `{{SPEC_PATH}}`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   ✓ SUCCESS: Spec loaded from {{SPEC_PATH}}
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

{{FEATURE_SUMMARY}}

This feature enhances LiaiZen's co-parenting communication platform by {{ENHANCEMENT_DESCRIPTION}}. The implementation maintains compatibility with existing features (real-time chat, AI mediation, contacts, tasks, rooms) and follows LiaiZen's architecture patterns (React frontend, Node.js/Express backend, SQLite database, Socket.io WebSockets).

## Technical Context

**Language/Version**:

- Frontend: JavaScript/ES6+ (React 18+)
- Backend: Node.js 18+ (Express.js, Socket.io)
- Database: SQLite (with migration path to PostgreSQL)

**Primary Dependencies**:

- Frontend: React, React Router, Tailwind CSS, Socket.io-client
- Backend: Express.js, Socket.io, sql.js (SQLite), bcrypt, jsonwebtoken
- AI Services: OpenAI API (for message mediation)
- Email: Nodemailer (Gmail integration)

**Storage**:

- SQLite database at `chat-server/chat.db`
- File-based storage for user uploads (if applicable)
- Environment variables for configuration

**Testing**:

- Frontend: React Testing Library, Jest
- Backend: Jest, Supertest
- E2E: Manual testing with co-parent scenarios

**Target Platform**:

- Web browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- PWA support (installable on mobile devices)

**Project Type**:

- Monorepo structure:
  - `chat-client-vite/` - React frontend (Vite)
  - `chat-server/` - Node.js backend (Express + Socket.io)

**Performance Goals**:

- Real-time message delivery: < 100ms latency
- Page load time: < 2 seconds
- WebSocket reconnection: < 3 seconds
- Database queries: < 50ms average
- AI mediation response: < 2 seconds

**Constraints**:

- Must maintain backward compatibility with existing database schema
- Must support existing authentication (JWT, Google OAuth)
- Must integrate with existing AI mediation service
- Must preserve existing room and contact management
- Must comply with privacy requirements for co-parenting data
- Must work within Railway (backend) and Vercel (frontend) deployment constraints

**Scale/Scope**:

- Current users: 3+ (beta)
- Target users: 100-1,000 (MVP)
- Messages per room: 100-10,000
- Contacts per user: 5-50
- Rooms per user: 1-10

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Library-First Architecture

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Frontend components organized as reusable libraries
- Backend modules follow library pattern (auth.js, db.js, roomManager.js, etc.)
- Shared utilities in `libs/` directory

### Principle II: Test-First Development

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Write tests before implementation
- Test user scenarios from spec
- Integration tests for co-parent workflows
- Contract tests for API endpoints

### Principle III: Contract-First Design

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- API endpoints defined before implementation
- WebSocket event contracts documented
- Database schema changes documented
- Frontend component props/interfaces defined

### Principle IV: Idempotent Operations

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- API endpoints safe to retry
- Database operations idempotent
- WebSocket reconnection handles duplicate messages
- State management handles duplicate events

### Principle V: Progressive Enhancement

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Feature flags for gradual rollout
- Graceful degradation when services unavailable
- Works without JavaScript (basic functionality)
- PWA enhancements optional

### Principle VI: Git Operation Approval (CRITICAL)

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- All git operations require explicit user approval
- No autonomous commits, pushes, or branch operations
- User must review changes before approval

### Principle VII: Observability and Structured Logging

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Structured logging for all operations
- Error tracking and monitoring
- User action audit trail (important for co-parenting context)
- Performance metrics collection

### Principle VIII: Documentation Synchronization

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Update README.md with new features
- Update API documentation
- Update user-facing documentation
- Keep architecture docs current

### Principle IX: Dependency Management

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Pin dependency versions in package.json
- Document new dependencies
- Review security advisories
- Minimize external dependencies

### Principle X: Agent Delegation Protocol

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Use appropriate agents for domain-specific work
- Frontend work → frontend-specialist
- Backend work → backend-architect
- Database work → database-specialist
- Testing → testing-specialist

### Principle XI: Input Validation and Output Sanitization

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Validate all user input (frontend and backend)
- Sanitize output to prevent XSS
- SQL injection prevention (parameterized queries)
- Rate limiting on API endpoints

### Principle XII: Design System Compliance

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Use Tailwind CSS design system
- Follow existing component patterns
- Maintain brand colors (#275559, #4DA8B0)
- Use Inter font for body, Lora for headings
- Mobile-first responsive design

### Principle XIII: Feature Access Control

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Respect user subscription tiers (if applicable)
- Room access control (members only)
- Contact visibility controls
- Privacy settings enforcement

### Principle XIV: AI Model Selection Protocol

**Status**: {{STATUS}}
**Rationale**: {{RATIONALE}}

- Use OpenAI GPT-4 for AI mediation (message rewriting)
- Fallback to GPT-3.5-turbo for non-critical operations
- Document model selection reasoning
- Monitor API costs and usage

**GATE RESULT**: {{GATE_RESULT}} - All applicable principles satisfied. Proceed to Phase 0.

## Project Structure

### Frontend (chat-client-vite/)

```
chat-client-vite/
├── src/
│   ├── components/          # React components
│   │   ├── ChatRoom.jsx
│   │   ├── ContactsPanel.jsx
│   │   ├── ProfilePanel.jsx
│   │   ├── UpdatesPanel.jsx
│   │   └── Navigation.jsx
│   ├── hooks/               # Custom React hooks
│   ├── apiClient.js         # API client
│   ├── config.js            # Configuration
│   └── App.jsx              # Main app component
├── public/                  # Static assets
└── vite.config.js          # Vite configuration
```

### Backend (chat-server/)

```
chat-server/
├── server.js               # Express server + Socket.io
├── db.js                   # Database (SQLite)
├── auth.js                 # Authentication
├── roomManager.js          # Room management
├── connectionManager.js    # WebSocket connections
├── messageStore.js         # Message persistence
├── aiMediator.js           # AI message mediation
├── emailService.js         # Email notifications
└── userContext.js          # User context management
```

### Database Schema

- **users**: User accounts, profiles, authentication
- **contacts**: Co-parents, children, related parties
- **rooms**: Private communication spaces
- **messages**: Chat messages with AI mediation
- **tasks**: Shared parenting responsibilities
- **room_members**: Room membership
- **room_invites**: Room invitation codes
- **pending_connections**: Co-parent connection requests

## Phase 0: Outline & Research

**Status**: {{STATUS}}

### Research Areas

1. **{{RESEARCH_AREA_1}}** ✓
   - Decision: {{DECISION}}
   - Rationale: {{RATIONALE}}
   - Alternatives considered: {{ALTERNATIVES}}

2. **{{RESEARCH_AREA_2}}** ✓
   - Decision: {{DECISION}}
   - Rationale: {{RATIONALE}}

**Output**: research.md with all decisions documented.

## Phase 1: Design & Contracts

**Status**: {{STATUS}}

### Artifacts Generated

1. **data-model.md** ✓
   - Database schema changes
   - API data models
   - Frontend state models
   - Entity relationships

2. **contracts/** ✓
   - API endpoint contracts
   - WebSocket event contracts
   - Component interface contracts

3. **quickstart.md** ✓
   - Integration test scenarios
   - User acceptance test scenarios
   - Co-parent workflow examples

## Phase 2: Task Planning Approach

**Status**: READY FOR /tasks COMMAND

_This section describes what the /tasks command will do - DO NOT execute during /plan_

### Task Generation Strategy

The /tasks command will:

1. **Load Design Artifacts**:
   - Read data-model.md for database changes
   - Parse contracts/ for API endpoints
   - Extract test scenarios from quickstart.md
   - Review research.md for implementation guidance

2. **Generate Frontend Tasks**:
   - Component creation/updates
   - Hook creation/updates
   - State management
   - API integration
   - UI/UX improvements

3. **Generate Backend Tasks**:
   - API endpoint implementation
   - Database migrations
   - WebSocket event handlers
   - Business logic
   - Integration with AI mediation

4. **Generate Test Tasks**:
   - Unit tests (frontend components, backend modules)
   - Integration tests (API endpoints, WebSocket events)
   - E2E tests (co-parent workflows)

5. **Generate Documentation Tasks**:
   - Update README.md
   - Update API documentation
   - Update user guides
   - Update architecture docs

### Ordering Strategy

**Dependency Order**:

1. Database schema changes first (if needed)
2. Backend API endpoints
3. Frontend components and hooks
4. Integration and testing
5. Documentation

**Parallelization Opportunities**:

- Frontend and backend tasks can run in parallel (different directories)
- Multiple component tasks can run in parallel (different files)
- Test tasks can run in parallel with implementation

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

{{COMPLEXITY_NOTES}}

## Progress Tracking

**Phase Status**:

- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - described approach, NOT executed)
- [ ] Phase 3: Tasks generated (/tasks command - NEXT STEP)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (if any)

**Artifacts Generated**:

- [ ] plan.md (this file)
- [ ] research.md
- [ ] data-model.md
- [ ] contracts/ (API contracts)
- [ ] quickstart.md (test scenarios)

**Ready for Next Phase**: {{READY_STATUS}}

---

## Next Steps

**Immediate Action**: Run `/tasks` command to generate dependency-ordered task list.

**Command**: `/tasks`

**Expected Output**: tasks.md with tasks organized by:

1. Database migrations (if needed)
2. Backend API implementation
3. Frontend component implementation
4. Integration and testing
5. Documentation updates

**Co-Parenting Domain Considerations**:

- Ensure tasks include privacy/security validation
- Include AI mediation integration points
- Consider mobile/PWA requirements
- Plan for real-time synchronization
- Account for co-parent workflow edge cases

---

_Plan for coparentliaizen.com - Better Co-Parenting Through Better Communication_
_Based on Constitution v1.5.0 - See `.specify/memory/constitution.md`_
