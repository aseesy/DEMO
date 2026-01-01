# Architecture Review: useSendMessage Consolidation Plan

## Executive Summary

**Current State:** 4 implementations exist, but only 1 is actually used in production.

**Key Insight:** Context capture is **separate** from analysis location. Context is needed regardless of where analysis happens.

**Critical Questions:**
1. **Why keep services for frontend validation if backend-only?** → We shouldn't. If backend-only, remove `MessageValidationService`.
2. **Why commit to backend-only?** → Good question. Frontend validation has benefits (instant feedback, better UX). Need team decision.
3. **What about context?** → Context capture is separate. Backend builds from DB (more complete), frontend builds from user data (simpler but incomplete).

**Recommendation:** Consolidate to a single, well-architected implementation, but **first decide** on analysis location (backend-only vs frontend validation vs hybrid).

---

## Current State Analysis

### 1. `useMessageSending.js` ✅ **ACTUALLY USED**
- **Location:** `hooks/useMessageSending.js`
- **Used by:** `ChatContext.jsx` (production)
- **Architecture:** Monolithic hook
- **Responsibilities:**
  - Optimistic UI updates
  - Socket emission/queueing
  - Backend handles AI analysis (no frontend validation)
- **Status:** ✅ **KEEP** - This is production code

### 2. `useSendMessage.js` ❌ **UNUSED**
- **Location:** `model/useSendMessage.js`
- **Used by:** Exported from `index.js` but **NOT USED ANYWHERE**
- **Architecture:** Monolithic hook (similar to useMessageSending)
- **Status:** ❌ **DEPRECATE** - Dead code, can be removed

### 3. `useSendMessage.refactored.js` ❌ **UNUSED**
- **Location:** `model/useSendMessage.refactored.js`
- **Used by:** **NOT USED ANYWHERE**
- **Architecture:** Uses services pattern (MessageTransportService, MessageValidationService, MessageQueueService)
- **Features:** Frontend validation, error handling
- **Status:** ❌ **DEPRECATE** - Experimental, never integrated

### 4. `useSendMessageComposed.js` ❌ **UNUSED**
- **Location:** `hooks/useSendMessageComposed.js`
- **Used by:** **NOT USED ANYWHERE**
- **Architecture:** Composes 3 hooks (useMessageUI, useMessageTransport, useMessageMediation)
- **Features:** Frontend validation, separation of concerns
- **Status:** ❌ **DEPRECATE** - Experimental, never integrated

---

## Key Architectural Decisions Needed

### Decision 1: Backend vs Frontend Analysis

**Current Production:** Backend handles all AI analysis
- Message sent via socket → Backend analyzes → Backend emits `draft_coaching` or `new_message`
- Backend builds context from database (profiles, contacts, recent messages)
- Simple, reliable, single source of truth

**Experimental Versions:** Frontend validation before sending
- Frontend calls `/api/mediate/analyze` → Blocks if needed → Sends if safe
- Frontend builds context from user/contacts data (`buildMediationContext`)
- More complex, requires maintaining two analysis paths

**Trade-offs:**

**Backend-only (current):**
- ✅ Single source of truth
- ✅ Consistent analysis logic
- ✅ Backend has full database context (more complete)
- ✅ Can't be bypassed
- ❌ Network round-trip before blocking
- ❌ Optimistic updates get removed if blocked

**Frontend validation:**
- ✅ Instant feedback (no network delay)
- ✅ Better UX (block before sending)
- ✅ Can work offline (with cached context)
- ❌ Two analysis paths to maintain
- ❌ Frontend context may be incomplete
- ❌ Can be bypassed (user could modify code)

**Hybrid approach:**
- Frontend quick check (pattern matching) → Backend full analysis
- Best of both worlds but most complex

**Recommendation:** ⚠️ **Need team decision** - Both approaches have merit

### Decision 2: Services vs Hooks Pattern

**Services Pattern** (`useSendMessage.refactored.js`):
- Uses `MessageTransportService`, `MessageValidationService`, `MessageQueueService`
- More testable, but requires service instantiation
- Better for complex business logic

**Hooks Pattern** (`useSendMessageComposed.js`):
- Uses `useMessageUI`, `useMessageTransport`, `useMessageMediation`
- More React-idiomatic
- Better for UI state management

**Recommendation:** ✅ **Hooks pattern** (for React components)
- More idiomatic React
- Better integration with React lifecycle
- Services can still exist for non-React code

### Decision 2: Context Capture Architecture

**Context is needed regardless of analysis location:**
- Sender profile (role, position, resources, conflict level, etc.)
- Receiver profile (has_new_partner, income_disparity, triggers, etc.)
- Relationship context (custody arrangement, legal matters, etc.)
- Conversation context (recent messages, patterns, etc.)

**Current approaches:**

**Backend context building:**
- Builds from database (profiles, contacts, messages)
- More complete and accurate
- Includes temporal decay patterns
- Includes intervention history

**Frontend context building:**
- Builds from user/contacts data (`buildMediationContext`)
- Simpler, but may be incomplete
- No access to historical patterns
- No temporal decay

**Recommendation:** ✅ **Context capture is separate from analysis**
- If backend analysis: Context built server-side (current)
- If frontend validation: Context built client-side (needs enhancement)
- Context building utilities (`profileBuilder.js`) are useful regardless

### Decision 3: Separation of Concerns

**Current:** `useMessageSending` does everything (monolithic)
- UI state, network, optimistic updates all in one hook

**Target:** Separate concerns into focused hooks
- `useMessageUI` - UI state only
- `useMessageTransport` - Network only  
- `useMessageSending` - Orchestration only

**Recommendation:** ✅ **Refactor useMessageSending** to use composed hooks
- Better maintainability
- Easier testing
- Clearer responsibilities

---

## Consolidation Plan

### Phase 1: Refactor Production Code (useMessageSending)

**Goal:** Improve `useMessageSending` without changing behavior

**Steps:**
1. Extract UI state management → `useMessageUI` hook
2. Extract network logic → `useMessageTransport` hook  
3. Refactor `useMessageSending` to compose these hooks
4. Keep backend analysis (no frontend validation)

**Benefits:**
- Better separation of concerns
- Easier to test
- No behavior changes
- Production code improves incrementally

### Phase 2: Remove Unused Code

**Steps:**
1. Remove `useSendMessage.js` (unused, exported but never imported)
2. Remove `useSendMessage.refactored.js` (experimental, never integrated)
3. Remove `useSendMessageComposed.js` (experimental, never integrated)
4. Update `index.js` exports to remove `useSendMessage`
5. Archive refactoring docs (keep for reference but mark as historical)

**Benefits:**
- Cleaner codebase
- Less confusion
- Easier onboarding

### Phase 3: Decision on Services

**Decision:** Keep services or remove?

**Services exist but unused:**
- `MessageTransportService.js` - Transport abstraction
- `MessageValidationService.js` - Frontend validation logic
- `MessageQueueService.js` - Queue management

**If we commit to backend-only analysis:**
- ❌ `MessageValidationService` not needed (no frontend validation)
- ✅ `MessageTransportService` still useful (transport abstraction)
- ✅ `MessageQueueService` still useful (offline queue management)

**If we want frontend validation:**
- ✅ All services useful
- ✅ `MessageValidationService` provides validation logic
- ✅ Can be used by hooks or components

**Recommendation:** ⚠️ **Depends on analysis decision**
- **Backend-only:** Remove `MessageValidationService`, keep transport/queue services
- **Frontend validation:** Keep all services, integrate `MessageValidationService`
- **Hybrid:** Keep all services, use validation service for quick checks

---

## ✅ Approved Target Architecture: Hybrid Approach

### Final Architecture (Hybrid)

```
┌─────────────────────────────────────┐
│   useMessageSending (orchestration)│  ← Thin orchestrator
│   - Composes UI + Transport +       │
│     Mediation                       │
│   - Handles pending state          │
│   - Coordinates flow                │
└──────────────┬──────────────────────┘
               │ composes
               ↓
┌─────────────────────────────────────┐
│   useMessageUI                      │
│   - Pending messages state          │
│   - Message statuses                │
│   - UI feedback (animations, etc.)  │
│   - Error states                    │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   useMessageMediation                │
│   - Frontend pre-check               │
│     (MediationService.analyze)       │
│   - Handles backend results         │
│   - Manages draft coaching state     │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────┴──────────────────────┐
│   MediationService                  │
│   - Pure functions                  │
│   - Unit testable                   │
│   - Frontend context building       │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   useMessageTransport               │
│   - Socket emission                 │
│   - HTTP fallback                   │
│   - Offline queue management        │
│   - Connection state                │
└─────────────────────────────────────┘
               │
               ↓ (sends via socket)
┌─────────────────────────────────────┐
│   Backend Analysis                   │
│   - Builds historical context        │
│   - Full analysis with patterns      │
│   - Emits draft_coaching or         │
│     new_message                      │
└─────────────────────────────────────┘
```

**Key Points:**
- ✅ Hybrid: Frontend pre-check + Backend full analysis
- ✅ Hooks pattern (React-idiomatic) + Services (testable)
- ✅ Clear separation: UI / Transport / Mediation
- ✅ Pending state (no emotional whiplash)
- ✅ Context separation: Frontend = current, Backend = historical

---

## Implementation Steps

### Step 1: Extract useMessageUI from useMessageSending
- Move UI state management to separate hook
- Test that behavior doesn't change

### Step 2: Extract useMessageTransport from useMessageSending
- Move network logic to separate hook
- Test that behavior doesn't change

### Step 3: Refactor useMessageSending to compose hooks
- Use `useMessageUI` and `useMessageTransport`
- Keep same API surface
- Test that behavior doesn't change

### Step 4: Remove unused implementations
- Delete `useSendMessage.js`
- Delete `useSendMessage.refactored.js`
- Delete `useSendMessageComposed.js`
- Update `index.js` exports

### Step 5: Update documentation
- Document the architecture decision
- Update README with current architecture
- Archive old refactoring docs

---

## Migration Checklist

- [ ] Extract `useMessageUI` hook from `useMessageSending`
- [ ] Extract `useMessageTransport` hook from `useMessageSending`
- [ ] Refactor `useMessageSending` to use composed hooks
- [ ] Test that production behavior is unchanged
- [ ] Remove `useSendMessage.js`
- [ ] Remove `useSendMessage.refactored.js`
- [ ] Remove `useSendMessageComposed.js`
- [ ] Update `index.js` exports
- [ ] Update documentation
- [ ] Archive old refactoring docs

---

## Risk Assessment

**Low Risk:**
- Extracting hooks from existing code (refactoring, not changing behavior)
- Removing unused code (no impact on production)

**Medium Risk:**
- Refactoring `useMessageSending` (needs thorough testing)
- Need to ensure API compatibility

**Mitigation:**
- Keep old code until new code is tested
- Use feature flags if needed
- Comprehensive testing before removing old code

---

## Timeline Estimate

- **Phase 1 (Refactor):** 2-3 days
- **Phase 2 (Cleanup):** 1 day
- **Phase 3 (Documentation):** 1 day
- **Total:** ~1 week

---

## Success Criteria

✅ Single implementation of message sending logic
✅ Clear separation of concerns (UI vs Transport)
✅ Production behavior unchanged
✅ No unused code
✅ Clear documentation
✅ Easier for new developers to understand

---

## ✅ Architectural Decisions Made

### Decision 1: Hybrid Analysis Approach ✅

**Approach:** Frontend pre-check + Backend full analysis
- Frontend: Quick validation via `MediationService.analyze()` (client pre-check)
- Backend: Full analysis with historical context (final authority)
- **Benefits:** Instant feedback + comprehensive analysis

### Decision 2: Hooks + Services Pattern ✅

**Architecture:**
- **Hooks** for React composition (UI state, orchestration)
- **Services** for pure business logic (testable, reusable)
- Clean separation: React-idiomatic hooks backed by testable services

**Structure:**
```
useMessageUI() → state + animations + pending/error
useMessageTransport() → sockets/http send/receive  
useMessageMediation() → calls MediationService.analyze() (pre-check) + handles backend results
MediationService / MessageValidationService → pure functions + unit tests
```

### Decision 3: Context Separation ✅

**Frontend context** = "what's happening right now"
- Current user state, current message, immediate context
- Built from user/contacts data (`buildMediationContext`)

**Backend context** = "what this relationship has been doing over time"
- Historical patterns, intervention history, temporal decay
- Built from database (profiles, messages, patterns)

### Decision 4: Incremental Refactoring ✅

**Phased approach:**
1. First: Extract `useMessageUI` (state + animations)
2. Second: Extract `useMessageTransport` (sockets/http)
3. Third: Refactor `useMessageSending` as thin orchestrator
4. Fourth: Integrate `useMessageMediation` with `MediationService`

### Decision 5: UX Improvement - Pending State ✅

**Current Problem:** Optimistic "sent" → then "blocked" = emotional whiplash

**New Flow:**
- User taps send → Message appears as "Sending..." (pending, not delivered)
- Backend responds:
  - **Allowed** → Message becomes normal (confirmed sent)
  - **Blocked** → Message collapses into coaching UI with draft (never appears as "sent")

**Benefits:** No emotional whiplash, clearer state transitions

---

## Next Steps

1. Review this plan with team
2. Get approval for architecture decisions
3. Start Phase 1 (refactor production code)
4. Test thoroughly
5. Complete Phase 2 (remove unused code)
6. Update documentation

