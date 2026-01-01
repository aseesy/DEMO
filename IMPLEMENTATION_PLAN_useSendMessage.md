# Implementation Plan: useSendMessage Refactoring

## Overview

Refactor `useMessageSending` to use hybrid analysis approach with clean separation of concerns.

**Goal:** Incremental refactoring that improves UX (pending state) and maintainability (hooks + services).

---

## Phase 1: Extract useMessageUI (Day 1)

### Goal
Extract UI state management into `useMessageUI` hook.

### Steps

1. **Create `useMessageUI` hook**
   - Move pending messages state
   - Move message statuses state
   - Add animation helpers
   - Add error state management
   - Keep same API surface

2. **Update `useMessageSending`**
   - Use `useMessageUI` instead of local state
   - Test that behavior is unchanged

3. **Test**
   - Verify pending messages work
   - Verify status updates work
   - Verify animations work

### Files to Create/Modify
- ✅ Create: `hooks/useMessageUI.js` (already exists, enhance it)
- Modify: `hooks/useMessageSending.js`

### Success Criteria
- ✅ UI state extracted
- ✅ No behavior changes
- ✅ Tests pass

---

## Phase 2: Extract useMessageTransport (Day 2)

### Goal
Extract network logic into `useMessageTransport` hook.

### Steps

1. **Enhance `useMessageTransport` hook**
   - Socket emission logic
   - HTTP fallback support
   - Offline queue management
   - Connection state tracking
   - Return pending state (not optimistic sent)

2. **Update `useMessageSending`**
   - Use `useMessageTransport` instead of direct socket calls
   - Test that behavior is unchanged

3. **Test**
   - Verify socket emission works
   - Verify offline queue works
   - Verify connection state tracking

### Files to Create/Modify
- ✅ Create: `hooks/useMessageTransport.js` (already exists, enhance it)
- Modify: `hooks/useMessageSending.js`

### Success Criteria
- ✅ Transport logic extracted
- ✅ No behavior changes
- ✅ Tests pass

---

## Phase 3: Create MediationService (Day 3)

### Goal
Create pure service for frontend validation logic.

### Steps

1. **Create `MediationService`**
   - Pure functions (no React dependencies)
   - `analyze(messageText, senderProfile, receiverProfile)` method
   - Calls `/api/mediate/analyze` endpoint
   - Returns analysis result
   - Unit testable

2. **Enhance `useMessageMediation`**
   - Use `MediationService.analyze()` for pre-check
   - Handle backend results (socket events)
   - Manage draft coaching state
   - Build frontend context (`buildMediationContext`)

3. **Test**
   - Unit tests for `MediationService`
   - Integration tests for `useMessageMediation`

### Files to Create/Modify
- Create: `services/mediation/MediationService.js`
- ✅ Enhance: `hooks/useMessageMediation.js` (already exists)
- Modify: `utils/profileBuilder.js` (ensure context building is complete)

### Success Criteria
- ✅ Pure service created
- ✅ Unit tests pass
- ✅ Frontend pre-check works

---

## Phase 4: Integrate useMessageMediation (Day 4)

### Goal
Integrate mediation hook into `useMessageSending` with pending state.

### Steps

1. **Update `useMessageSending`**
   - Use `useMessageMediation` for pre-check
   - Handle pending state (not optimistic sent)
   - Coordinate frontend + backend analysis
   - Handle backend results (draft_coaching or new_message)

2. **Implement Pending State UX**
   - Message starts as "Sending..." (pending)
   - Backend allowed → becomes "Sent" (confirmed)
   - Backend blocked → collapses into coaching UI (never "sent")

3. **Test**
   - Verify pending state works
   - Verify frontend pre-check works
   - Verify backend analysis still works
   - Verify blocked messages don't show as "sent"

### Files to Modify
- Modify: `hooks/useMessageSending.js`
- Modify: `components/MessagesContainer.jsx` (pending state display)

### Success Criteria
- ✅ Hybrid analysis works
- ✅ Pending state implemented
- ✅ No emotional whiplash
- ✅ Tests pass

---

## Phase 5: Clean Up Unused Code (Day 5)

### Goal
Remove unused implementations and update exports.

### Steps

1. **Remove unused files**
   - Delete `model/useSendMessage.js` (unused)
   - Delete `model/useSendMessage.refactored.js` (experimental)
   - Delete `hooks/useSendMessageComposed.js` (experimental)

2. **Update exports**
   - Remove `useSendMessage` from `index.js`
   - Keep `useMessageSending` (production)
   - Export new hooks if needed

3. **Update documentation**
   - Update architecture docs
   - Archive old refactoring docs
   - Document new architecture

### Files to Delete
- `model/useSendMessage.js`
- `model/useSendMessage.refactored.js`
- `hooks/useSendMessageComposed.js`

### Files to Modify
- `features/chat/index.js`
- `ARCHITECTURE_REVIEW_useSendMessage.md`

### Success Criteria
- ✅ Unused code removed
- ✅ Exports updated
- ✅ Documentation updated

---

## Implementation Details

### Pending State Implementation

**Current Flow:**
```
User sends → Optimistic "sent" → Backend blocks → Remove message → Show coaching
(Emotional whiplash: "it sent... jk it didn't")
```

**New Flow:**
```
User sends → "Sending..." (pending) → Backend responds:
  - Allowed → "Sent" (confirmed)
  - Blocked → Collapse into coaching UI (never "sent")
(No emotional whiplash)
```

**Implementation:**
```javascript
// In useMessageSending
const sendMessage = async (e) => {
  // 1. Frontend pre-check (optional, for instant feedback)
  const preCheck = await mediation.validateMessage(clean);
  if (!preCheck.shouldSend) {
    // Show coaching immediately
    return;
  }

  // 2. Create pending message (not optimistic sent)
  const pendingMessage = {
    id: `pending_${Date.now()}`,
    text: clean,
    status: 'pending', // Not 'sent'!
    isPending: true,
  };
  
  ui.setPendingMessages(prev => new Map(prev).set(pendingMessage.id, pendingMessage));
  ui.markMessagePending(pendingMessage.id);

  // 3. Send via transport
  await transport.sendMessage({ text: clean });
  
  // 4. Backend will respond with:
  // - 'new_message' → mark as sent
  // - 'draft_coaching' → collapse into coaching UI
};
```

### Context Building

**Frontend Context** (current state):
```javascript
// In useMessageMediation
const frontendContext = buildMediationContext({
  user: currentUser,
  contacts: userContacts,
  room: currentRoom,
});

// Used for pre-check
const preCheck = await MediationService.analyze(
  messageText,
  frontendContext.sender,
  frontendContext.receiver
);
```

**Backend Context** (historical patterns):
- Built server-side from database
- Includes intervention history, patterns, temporal decay
- More complete but slower

### Service Structure

**MediationService.js:**
```javascript
export class MediationService {
  /**
   * Analyze message with frontend context
   * Pure function - no React dependencies
   */
  static async analyze(messageText, senderProfile, receiverProfile) {
    const response = await apiPost('/api/mediate/analyze', {
      text: messageText,
      senderProfile,
      receiverProfile,
    });
    return response.json();
  }
}
```

---

## Testing Strategy

### Unit Tests
- `MediationService.analyze()` - Pure function tests
- `useMessageUI` - State management tests
- `useMessageTransport` - Network logic tests

### Integration Tests
- `useMessageSending` - Full flow tests
- Pending state transitions
- Frontend pre-check + backend analysis

### E2E Tests
- User sends message → sees pending → backend responds
- User sends blocked message → sees coaching immediately
- Offline queue → messages queue → send when online

---

## Rollback Plan

If issues arise:
1. Keep old `useMessageSending` as backup
2. Feature flag to switch between old/new
3. Gradual rollout (test with subset of users)

---

## Success Metrics

- ✅ No emotional whiplash (pending state works)
- ✅ Instant feedback (frontend pre-check)
- ✅ Comprehensive analysis (backend full check)
- ✅ Clean architecture (hooks + services)
- ✅ Testable code (services have unit tests)
- ✅ No unused code

---

## Timeline

- **Day 1:** Extract `useMessageUI`
- **Day 2:** Extract `useMessageTransport`
- **Day 3:** Create `MediationService`
- **Day 4:** Integrate `useMessageMediation` + pending state
- **Day 5:** Clean up unused code

**Total:** ~1 week

---

## Next Steps

1. ✅ Review and approve plan
2. Start Phase 1 (extract `useMessageUI`)
3. Test incrementally
4. Proceed to next phase

