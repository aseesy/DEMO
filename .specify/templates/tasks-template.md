# Tasks: {{FEATURE_NAME}}

**Input**: Design documents from `{{FEATURE_DIRECTORY}}`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory
   ✓ SUCCESS: Tech stack: {{TECH_STACK}}
2. Load optional design documents:
   ✓ data-model.md: {{ENTITY_COUNT}} entities extracted → {{MODEL_TASK_COUNT}} model tasks
   ✓ contracts/: {{CONTRACT_COUNT}} files → {{CONTRACT_TEST_COUNT}} contract test tasks
   ✓ quickstart.md: {{SCENARIO_COUNT}} scenarios → {{INTEGRATION_TEST_COUNT}} integration test tasks
   ✓ research.md: Dependencies and decisions extracted
3. Generate tasks by category:
   ✓ Setup: {{SETUP_TASK_COUNT}} tasks
   ✓ Database: {{DB_TASK_COUNT}} tasks
   ✓ Backend: {{BACKEND_TASK_COUNT}} tasks
   ✓ Frontend: {{FRONTEND_TASK_COUNT}} tasks
   ✓ Tests: {{TEST_TASK_COUNT}} tasks
   ✓ Integration: {{INTEGRATION_TASK_COUNT}} tasks
   ✓ Documentation: {{DOC_TASK_COUNT}} tasks
4. Apply task rules:
   ✓ Different files = marked [P] for parallel ({{PARALLEL_COUNT}} tasks)
   ✓ Same file = sequential ({{SEQUENTIAL_COUNT}} tasks)
   ✓ Tests before implementation (TDD enforced)
5. Number tasks sequentially (T001-T{{TOTAL_TASKS}})
6. Generate dependency graph (below)
7. Create parallel execution examples (below)
8. Validate task completeness:
   ✓ All contracts have tests
   ✓ All entities have models
   ✓ All scenarios covered
9. Return: SUCCESS ({{TOTAL_TASKS}} tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Specify frontend vs backend clearly

## Path Conventions

- **Frontend**: `chat-client-vite/src/` for React components
- **Backend**: `chat-server/` for Node.js modules
- **Database**: `chat-server/` for migrations and schema
- **Tests**: `chat-client-vite/src/__tests__/` (frontend), `chat-server/__tests__/` (backend)
- **Shared**: `libs/` for shared utilities

---

## Phase 1: Setup & Database

### Database Migrations

- [ ] **T001** [P] Create database migration script in `chat-server/migrations/{{MIGRATION_NAME}}.js`
  - Add/Modify tables: {{TABLE_CHANGES}}
  - Update indexes: {{INDEX_CHANGES}}
  - Add foreign keys: {{FK_CHANGES}}
  - Test migration rollback
  - Document schema changes

- [ ] **T002** [P] Update database schema documentation in `docs/DATABASE_SCHEMA.md`
  - Document new tables/columns
  - Update entity relationship diagrams
  - Document migration path

### Database Models & Helpers

- [ ] **T003** Update `chat-server/db.js` with new database operations
  - Add functions: {{DB_FUNCTIONS}}
  - Update existing functions: {{UPDATED_FUNCTIONS}}
  - Add validation: {{VALIDATION}}
  - Test database operations

---

## Phase 2: Backend Implementation

### API Endpoints

- [ ] **T004** [P] Create API endpoint `{{METHOD}} /api/{{ENDPOINT_PATH}}` in `chat-server/server.js`
  - Request validation: {{VALIDATION}}
  - Business logic: {{LOGIC}}
  - Response format: {{RESPONSE_FORMAT}}
  - Error handling: {{ERROR_HANDLING}}
  - Rate limiting: {{RATE_LIMIT}}
  - Authentication: {{AUTH_REQUIREMENT}}

- [ ] **T005** [P] Create API endpoint `{{METHOD}} /api/{{ENDPOINT_PATH}}` in `chat-server/server.js`
  - {{ENDPOINT_DETAILS}}

### WebSocket Events

- [ ] **T006** [P] Add WebSocket event handler `{{EVENT_NAME}}` in `chat-server/server.js`
  - Event payload: {{PAYLOAD}}
  - Validation: {{VALIDATION}}
  - Broadcast logic: {{BROADCAST}}
  - Error handling: {{ERROR_HANDLING}}
  - Integration with roomManager.js

### Business Logic

- [ ] **T007** [P] Update `chat-server/{{MODULE}}.js` with {{FUNCTIONALITY}}
  - Functions: {{FUNCTIONS}}
  - Integration: {{INTEGRATIONS}}
  - Error handling: {{ERROR_HANDLING}}

### AI Mediation Integration

- [ ] **T008** [P] Update `chat-server/aiMediator.js` for {{AI_FEATURE}}
  - AI prompt updates: {{PROMPT_CHANGES}}
  - Response handling: {{RESPONSE_HANDLING}}
  - Error fallback: {{FALLBACK}}

### Email Notifications

- [ ] **T009** [P] Update `chat-server/emailService.js` for {{EMAIL_FEATURE}}
  - Email templates: {{TEMPLATES}}
  - Recipient logic: {{RECIPIENT_LOGIC}}
  - Error handling: {{ERROR_HANDLING}}

---

## Phase 3: Frontend Implementation

### Components

- [ ] **T010** [P] Create component `{{COMPONENT_NAME}}` in `chat-client-vite/src/components/{{COMPONENT_FILE}}.jsx`
  - Props: {{PROPS}}
  - State: {{STATE}}
  - UI: {{UI_DESCRIPTION}}
  - Styling: Tailwind CSS, mobile-responsive
  - Accessibility: {{A11Y_REQUIREMENTS}}

- [ ] **T011** [P] Update component `{{COMPONENT_NAME}}` in `chat-client-vite/src/components/{{COMPONENT_FILE}}.jsx`
  - Changes: {{CHANGES}}
  - New features: {{NEW_FEATURES}}
  - Backward compatibility: {{COMPATIBILITY}}

### Hooks

- [ ] **T012** [P] Create hook `use{{HOOK_NAME}}` in `chat-client-vite/src/hooks/use{{HOOK_NAME}}.js`
  - Purpose: {{PURPOSE}}
  - Returns: {{RETURNS}}
  - Side effects: {{SIDE_EFFECTS}}
  - Error handling: {{ERROR_HANDLING}}

- [ ] **T013** [P] Update hook `use{{HOOK_NAME}}` in `chat-client-vite/src/hooks/use{{HOOK_NAME}}.js`
  - Changes: {{CHANGES}}
  - New functionality: {{NEW_FUNCTIONALITY}}

### API Client

- [ ] **T014** [P] Update `chat-client-vite/src/apiClient.js` with new API methods
  - Methods: {{METHODS}}
  - Error handling: {{ERROR_HANDLING}}
  - Request/response types: {{TYPES}}

### State Management

- [ ] **T015** [P] Update state management in `chat-client-vite/src/{{FILE}}.jsx`
  - State updates: {{STATE_UPDATES}}
  - Context providers: {{PROVIDERS}}
  - State synchronization: {{SYNC}}

### WebSocket Integration

- [ ] **T016** [P] Update WebSocket event handlers in `chat-client-vite/src/{{FILE}}.jsx`
  - Events: {{EVENTS}}
  - Event handlers: {{HANDLERS}}
  - Reconnection logic: {{RECONNECTION}}
  - Error handling: {{ERROR_HANDLING}}

---

## Phase 4: Testing (TDD)

### Backend Tests

- [ ] **T017** [P] Unit test `chat-server/{{MODULE}}.js` in `chat-server/__tests__/{{MODULE}}.test.js`
  - Test functions: {{FUNCTIONS}}
  - Mock dependencies: {{MOCKS}}
  - Edge cases: {{EDGE_CASES}}
  - Error scenarios: {{ERROR_SCENARIOS}}

- [ ] **T018** [P] Integration test API endpoint `{{METHOD}} /api/{{ENDPOINT_PATH}}` in `chat-server/__tests__/api/{{ENDPOINT_NAME}}.test.js`
  - Request/response validation
  - Authentication tests
  - Error handling tests
  - Rate limiting tests

- [ ] **T019** [P] Integration test WebSocket event `{{EVENT_NAME}}` in `chat-server/__tests__/websocket/{{EVENT_NAME}}.test.js`
  - Event emission
  - Event handling
  - Broadcast validation
  - Error handling

### Frontend Tests

- [ ] **T020** [P] Unit test component `{{COMPONENT_NAME}}` in `chat-client-vite/src/components/__tests__/{{COMPONENT_NAME}}.test.jsx`
  - Render tests
  - User interaction tests
  - Props validation
  - State management tests
  - Accessibility tests

- [ ] **T021** [P] Unit test hook `use{{HOOK_NAME}}` in `chat-client-vite/src/hooks/__tests__/use{{HOOK_NAME}}.test.js`
  - Hook return values
  - Side effects
  - Error handling
  - Edge cases

### E2E Tests

- [ ] **T022** [P] E2E test co-parent workflow: {{WORKFLOW_NAME}} in `tests/e2e/{{WORKFLOW_NAME}}.test.js`
  - User journey: {{USER_JOURNEY}}
  - Test steps: {{STEPS}}
  - Expected outcomes: {{OUTCOMES}}
  - Edge cases: {{EDGE_CASES}}

---

## Phase 5: Integration & Polish

### Integration Tasks

- [ ] **T023** Integrate {{FEATURE}} with existing {{EXISTING_FEATURE}}
  - Integration points: {{INTEGRATION_POINTS}}
  - Compatibility: {{COMPATIBILITY}}
  - Migration: {{MIGRATION}}

- [ ] **T024** Update AI mediation prompts for {{FEATURE}}
  - Prompt updates: {{PROMPT_UPDATES}}
  - Context: {{CONTEXT}}
  - Testing: {{TESTING}}

### Performance Optimization

- [ ] **T025** [P] Optimize {{PERFORMANCE_AREA}}
  - Optimization: {{OPTIMIZATION}}
  - Metrics: {{METRICS}}
  - Testing: {{TESTING}}

### Accessibility

- [ ] **T026** [P] Ensure accessibility compliance for {{FEATURE}}
  - ARIA labels: {{ARIA_LABELS}}
  - Keyboard navigation: {{KEYBOARD_NAV}}
  - Screen reader: {{SCREEN_READER}}
  - Color contrast: {{CONTRAST}}

### Mobile/PWA

- [ ] **T027** [P] Ensure mobile/PWA compatibility for {{FEATURE}}
  - Responsive design: {{RESPONSIVE}}
  - Touch targets: {{TOUCH_TARGETS}}
  - Offline support: {{OFFLINE}}
  - PWA manifest: {{MANIFEST}}

---

## Phase 6: Documentation

- [ ] **T028** [P] Update `README.md` with {{FEATURE}} documentation
  - Feature description
  - Usage instructions
  - API documentation (if applicable)

- [ ] **T029** [P] Update `docs/ARCHITECTURE.md` with {{FEATURE}} architecture
  - Component architecture
  - Data flow
  - Integration points

- [ ] **T030** [P] Update API documentation in `docs/API.md`
  - New endpoints
  - WebSocket events
  - Request/response formats

- [ ] **T031** [P] Create user guide for {{FEATURE}} in `docs/USER_GUIDE.md`
  - Step-by-step instructions
  - Screenshots (if applicable)
  - Common issues and solutions

---

## Dependencies

### Critical Path

1. **Database** (T001-T003) must complete before backend implementation
2. **Backend API** (T004-T009) must complete before frontend integration
3. **Frontend Components** (T010-T016) can run in parallel with backend (different directories)
4. **Tests** (T017-T022) should run after implementation but can be written in parallel
5. **Integration** (T023-T027) requires all implementation complete
6. **Documentation** (T028-T031) can run in parallel

### Detailed Dependencies

- T001 (database migration) blocks → T003 (database operations)
- T003 (database operations) blocks → T004-T009 (backend endpoints)
- T004-T009 (backend endpoints) blocks → T014 (API client), T016 (WebSocket)
- T010-T016 (frontend) can run in parallel with backend (different directories)
- T017-T022 (tests) can run in parallel with implementation (different files)
- T023-T027 (integration) require → T004-T016 (all implementation)
- T028-T031 (documentation) can run in parallel

---

## Parallel Execution Examples

### Backend + Frontend Parallel Execution

```bash
# Backend and frontend can run simultaneously (different directories)
# Launch T004-T009 (backend) and T010-T016 (frontend) together:
```

```javascript
// Backend task
Task(
  (agent = 'backend-architect'),
  (description = 'Create API endpoint'),
  (prompt = 'T004: Create API endpoint POST /api/...')
);

// Frontend task (parallel)
Task(
  (agent = 'frontend-specialist'),
  (description = 'Create component'),
  (prompt = 'T010: Create component ChatRoom in chat-client-vite/src/components/...')
);
```

### Multiple Component Tasks (Parallel)

```bash
# Multiple components can be created/updated simultaneously
# Launch T010, T011, T012 together:
```

```javascript
Task(
  (agent = 'frontend-specialist'),
  (description = 'Component A'),
  (prompt = 'T010: Create component A...')
);
Task(
  (agent = 'frontend-specialist'),
  (description = 'Component B'),
  (prompt = 'T011: Create component B...')
);
Task(
  (agent = 'frontend-specialist'),
  (description = 'Component C'),
  (prompt = 'T012: Create component C...')
);
```

---

## Task Statistics

- **Total Tasks**: {{TOTAL_TASKS}}
- **Parallel Tasks**: {{PARALLEL_COUNT}} (marked with [P], ~{{PARALLEL_PERCENT}}% parallelizable)
- **Sequential Tasks**: {{SEQUENTIAL_COUNT}} (dependencies or same-file modifications)
- **Database Tasks**: {{DB_TASK_COUNT}}
- **Backend Tasks**: {{BACKEND_TASK_COUNT}}
- **Frontend Tasks**: {{FRONTEND_TASK_COUNT}}
- **Test Tasks**: {{TEST_TASK_COUNT}}
- **Integration Tasks**: {{INTEGRATION_TASK_COUNT}}
- **Documentation Tasks**: {{DOC_TASK_COUNT}}

**Estimated Parallel Execution Time Savings**: ~{{TIME_SAVINGS}}% reduction vs sequential execution

---

## Co-Parenting Domain Considerations

### Privacy & Security

- [ ] All tasks include privacy validation
- [ ] Sensitive data handling reviewed
- [ ] Authentication/authorization verified
- [ ] Data encryption validated

### AI Mediation Integration

- [ ] AI mediation prompts updated
- [ ] Message rewriting tested
- [ ] Conflict detection validated
- [ ] User feedback loop implemented

### Real-Time Communication

- [ ] WebSocket events tested
- [ ] Reconnection logic validated
- [ ] Message delivery verified
- [ ] State synchronization tested

### Mobile/PWA

- [ ] Responsive design verified
- [ ] Touch interactions tested
- [ ] Offline functionality validated
- [ ] PWA manifest updated

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Verify all tests pass** before marking tasks complete
- **Commit after each major task** for atomic progress tracking
- **Avoid**: vague tasks, same-file conflicts in parallel execution
- **Co-Parenting Context**: Always consider impact on separated parents and children
- **Privacy First**: Ensure all features respect user privacy and data security
- **Mobile First**: Test on mobile devices, not just desktop

---

## Validation Checklist

_GATE: Checked during task generation_

- [ ] All API endpoints have corresponding tests
- [ ] All components have unit tests
- [ ] All database changes have migration scripts
- [ ] All WebSocket events have integration tests
- [ ] Privacy/security considerations addressed
- [ ] Mobile/PWA compatibility verified
- [ ] AI mediation integration included
- [ ] Documentation tasks included
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Dependencies properly ordered

---

## Execution Status

- [x] Plan.md loaded and analyzed
- [x] Design documents processed (research.md, data-model.md, contracts/, quickstart.md)
- [x] Tasks generated by category (database, backend, frontend, tests, integration, docs)
- [x] Task rules applied (parallel marking, TDD ordering, dependencies)
- [x] Tasks numbered sequentially (T001-T{{TOTAL_TASKS}})
- [x] Dependency graph created
- [x] Parallel execution examples generated
- [x] Task completeness validated

**Status**: READY FOR EXECUTION
**Next Step**: Begin with T001 (Database) or launch parallel execution groups

---

_Tasks for coparentliaizen.com - Better Co-Parenting Through Better Communication_
