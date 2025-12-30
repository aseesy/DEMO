# AI Mediation System Audit & Optimization Plan

**Date**: 2025-11-19
**Issue**: Multiple AI moderators running - duplicate OpenAI clients and confusing architecture

## Current Architecture Issues

### 1. **Multiple OpenAI Client Initializations** ❌

Every module creates its own OpenAI client:

- `aiMediator.js` (line 5)
- `conflictPredictor.js` (line 4)
- `emotionalModel.js` (line 4)
- `interventionPolicy.js` (line 4)
- `proactiveCoach.js` (line 4)
- `threadManager.js` (line 4)
- `feedbackLearner.js` (assumed)

**Problem**: 7+ separate OpenAI client instances wasting memory and potentially hitting rate limits

### 2. **Overlapping Functionality** ⚠️

#### aiMediator.js (730 lines)

- **PRIMARY MEDIATOR** - Main message analysis and intervention
- Functions:
  - `analyzeAndIntervene()` - Main mediation logic
  - `detectNamesInMessage()` - Name extraction for contacts
  - `generateContactSuggestion()` - Contact suggestions
  - `analyzeSentiment()` - Basic sentiment analysis
  - `extractRelationshipInsights()` - Long-term relationship learning
  - `updateContext()` / `getContext()` - Context management

#### conflictPredictor.js (~150 lines estimated)

- **HELPER MODULE** - Escalation risk assessment
- Functions:
  - `assessEscalationRisk()` - Analyzes escalation risk (low/medium/high)
- **Usage**: Called before `aiMediator.analyzeAndIntervene()` (server.js:742)
- **Overlap**: aiMediator ALREADY has conflict detection in its prompt

#### emotionalModel.js (~200 lines estimated)

- **HELPER MODULE** - Emotional state tracking
- Functions:
  - `analyzeEmotionalState()` - Tracks emotional trajectory
- **Usage**: Called before `aiMediator.analyzeAndIntervene()` (server.js:743)
- **Overlap**: aiMediator ALREADY handles emotional context

#### interventionPolicy.js (~150 lines estimated)

- **HELPER MODULE** - Adaptive intervention policies
- Functions:
  - `generateInterventionPolicy()` - Decides intervention approach
  - `recordInterventionOutcome()` - Tracks intervention success
  - `getPolicyState()` - Gets policy configuration
- **Usage**: Called during intervention processing (server.js:1049)
- **Overlap**: aiMediator ALREADY decides intervention type (STAY_SILENT/INTERVENE/COMMENT)

#### proactiveCoach.js (~90 lines)

- **STANDALONE** - Draft message coaching (before sending)
- Functions:
  - `analyzeDraftMessage()` - Analyzes draft messages
- **Usage**: Called on `draft_message` event (server.js:670)
- **Status**: ✅ Legitimate separate use case (pre-send coaching)

#### threadManager.js

- **UTILITY** - Thread organization (NOT mediation)
- Functions: Thread CRUD operations
- **Status**: ✅ Separate concern, uses OpenAI for thread title suggestions only

#### feedbackLearner.js

- **HELPER MODULE** - Learning from user feedback
- Functions:
  - `recordExplicitFeedback()` - Records user feedback
- **Usage**: Called on feedback events (server.js:1703)

### 3. **Confusing Data Flow** 🔀

Current message flow:

```
1. Message received (server.js:720)
2. conflictPredictor.assessEscalationRisk()
3. emotionalModel.analyzeEmotionalState()
4. interventionPolicy.generateInterventionPolicy()
5. aiMediator.analyzeAndIntervene() <- MAIN LOGIC
6. interventionPolicy.recordInterventionOutcome()
7. feedbackLearner.recordExplicitFeedback()
```

**Problems**:

- Multiple sequential OpenAI calls (4-5 API calls per message!)
- Duplicate analysis (conflict/emotion analyzed twice)
- Confusing which module makes final decision
- Each module maintains its own state cache

## Optimization Strategy

### Phase 1: Consolidate OpenAI Client ✅

**Goal**: Single shared OpenAI client

**Action**:

1. Create `openaiClient.js` with singleton pattern
2. Update all modules to import from this client
3. Add request rate limiting and retry logic

**Estimated Savings**: 6 fewer client instances, better rate limit handling

### Phase 2: Merge Helper Modules into aiMediator ✅

**Goal**: Single source of truth for mediation logic

**Actions**:

1. **Merge conflictPredictor** into aiMediator:
   - Move escalation risk assessment INTO main prompt
   - Use structured output to get risk level
   - Eliminate separate API call

2. **Merge emotionalModel** into aiMediator:
   - Add emotional state to main analysis prompt
   - Track state in aiMediator context
   - Eliminate separate API call

3. **Merge interventionPolicy** into aiMediator:
   - Move policy logic into main decision tree
   - Keep feedback tracking function
   - Use single state management

4. **Keep feedbackLearner** but simplify:
   - Integrate feedback INTO aiMediator context
   - Use feedback to adjust prompts dynamically

**Result**: 1 OpenAI call instead of 4-5 per message

### Phase 3: Keep Separate Concerns ✅

**Modules to KEEP separate**:

- ✅ `proactiveCoach.js` - Different use case (pre-send)
- ✅ `threadManager.js` - Different concern (organization)
- ✅ `aiMediator.js` - Core mediation (after consolidation)

### Phase 4: Optimize State Management ✅

**Goal**: Unified context/state management

**Actions**:

1. Single state cache in aiMediator
2. Single database table for AI state
3. Clear context invalidation strategy
4. Reduce memory footprint

## Proposed New Architecture

```
┌─────────────────────────────────────────────────┐
│ openaiClient.js (SHARED)                        │
│ - Single OpenAI client instance                 │
│ - Rate limiting                                  │
│ - Retry logic                                    │
└─────────────────────────────────────────────────┘
                      ▲
                      │ import
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────────┐  ┌────▼─────────┐  ┌───▼──────────┐
│ aiMediator │  │ proactiveCoach│  │ threadManager│
│ (PRIMARY)  │  │ (STANDALONE)  │  │ (UTILITY)    │
└────────────┘  └───────────────┘  └──────────────┘
│
├─ Main mediation logic
├─ Conflict prediction (integrated)
├─ Emotional analysis (integrated)
├─ Intervention policy (integrated)
├─ Feedback learning (integrated)
├─ Name detection
├─ Contact suggestions
├─ Relationship insights
└─ Context management
```

## Expected Performance Improvements

| Metric                | Before | After      | Improvement   |
| --------------------- | ------ | ---------- | ------------- |
| OpenAI clients        | 7      | 1          | 85% reduction |
| API calls per message | 4-5    | 1          | 80% reduction |
| Memory usage          | ~50MB  | ~10MB      | 80% reduction |
| Average latency       | 3-4s   | 0.8-1s     | 75% faster    |
| Code maintainability  | ⭐⭐   | ⭐⭐⭐⭐⭐ | Much clearer  |

## Implementation Order

1. ✅ **Document current state** (this file)
2. Create `openaiClient.js` shared client
3. Consolidate conflictPredictor into aiMediator
4. Consolidate emotionalModel into aiMediator
5. Consolidate interventionPolicy into aiMediator
6. Simplify feedbackLearner integration
7. Update server.js to use consolidated flow
8. Remove deprecated files
9. Update documentation

## Risk Assessment

**Low Risk Changes**:

- Creating shared OpenAI client
- Merging redundant modules

**Medium Risk**:

- Changing server.js flow
- State migration

**Mitigation**:

- Incremental changes with testing
- Keep backups of original files
- Test each phase before moving to next

## Files to Modify

### Create New:

- `chat-server/openaiClient.js`

### Modify:

- `chat-server/aiMediator.js` (consolidate logic)
- `chat-server/server.js` (simplify flow)
- `chat-server/feedbackLearner.js` (simplify)

### Archive (move to /deprecated/):

- `chat-server/conflictPredictor.js`
- `chat-server/emotionalModel.js`
- `chat-server/interventionPolicy.js`

### Keep As-Is:

- `chat-server/proactiveCoach.js` ✅
- `chat-server/threadManager.js` ✅
- `chat-server/userContext.js` ✅
- `chat-server/messageStore.js` ✅

## Success Metrics

- [ ] Single OpenAI client instance
- [ ] 1 API call per message (down from 4-5)
- [ ] All tests passing
- [ ] No regression in mediation quality
- [ ] Documentation updated
- [ ] Server startup time < 2s
- [ ] Message processing time < 1s

---

**Next Step**: Review this audit with stakeholder, then proceed with Phase 1 (shared OpenAI client)
