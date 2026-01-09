# AI Mediation Engine Refactoring Plan

**Status**: Planning  
**Priority**: High  
**Estimated Impact**: 40-60% cost reduction, 30-50% latency improvement

## Executive Summary

This plan addresses critical over-engineering in the AI mediation system identified through code review. The refactoring focuses on:

1. Feature flags for experimental features
2. Early exit optimizations
3. Prompt simplification
4. Logging standardization
5. Cost reduction through deterministic alternatives

---

## Phase 1: Feature Flags System (Week 1)

### 1.1 Create Feature Flags Configuration

**File**: `chat-server/src/infrastructure/config/featureFlags.js` (NEW)

```javascript
/**
 * Feature Flags for AI Mediation
 *
 * Controls which experimental/optional features are enabled.
 * All experimental features default to DISABLED.
 */

const FEATURE_FLAGS = {
  // Core features (always enabled)
  CORE_MEDIATION: true,
  PRE_FILTERS: true,
  CODE_LAYER: true,
  MESSAGE_CACHE: true,

  // Experimental features (default: disabled)
  DUAL_BRAIN_CONTEXT: process.env.ENABLE_DUAL_BRAIN === 'true',
  VOICE_SIGNATURE: process.env.ENABLE_VOICE_SIGNATURE === 'true',
  VALUES_CONTEXT: process.env.ENABLE_VALUES_CONTEXT === 'true',
  CONVERSATION_PATTERNS: process.env.ENABLE_CONVERSATION_PATTERNS === 'true',
  INTERVENTION_LEARNING: process.env.ENABLE_INTERVENTION_LEARNING === 'true',
  GRAPH_CONTEXT: process.env.ENABLE_GRAPH_CONTEXT === 'true',
  USER_INTELLIGENCE: process.env.ENABLE_USER_INTELLIGENCE === 'true',

  // AI-powered features (can be disabled)
  AI_NAME_DETECTION: process.env.ENABLE_AI_NAME_DETECTION !== 'false', // Default: enabled (will replace with regex)
  AI_CONTACT_SUGGESTIONS: process.env.ENABLE_AI_CONTACT_SUGGESTIONS === 'true',
  AI_INSIGHTS_EXTRACTION: process.env.ENABLE_AI_INSIGHTS === 'true',

  // Performance features
  EARLY_EXIT_OPTIMIZATION: true, // Always enabled after refactor
};

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name
 * @returns {boolean}
 */
function isEnabled(feature) {
  return FEATURE_FLAGS[feature] === true;
}

/**
 * Get all enabled features (for logging/debugging)
 * @returns {Object}
 */
function getEnabledFeatures() {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, enabled]) => enabled)
    .reduce((acc, [name]) => {
      acc[name] = true;
      return acc;
    }, {});
}

module.exports = {
  FEATURE_FLAGS,
  isEnabled,
  getEnabledFeatures,
};
```

### 1.2 Update Context Builder to Use Feature Flags

**File**: `chat-server/src/core/engine/contextBuilders/index.js`

**Changes**:

- Import feature flags
- Conditionally build experimental contexts only if enabled
- Add logging for which contexts are built

**Key Changes**:

```javascript
const { isEnabled } = require('../../../infrastructure/config/featureFlags');

async function buildAllContexts({...}) {
  // ... existing code ...

  // Build experimental contexts conditionally
  const [
    roleAwareContext,
    graphContextString,
    valuesContextString,
    userIntelligence,
    voiceSignatureSection,
    interventionLearningSection,
    dualBrainContext,
  ] = await Promise.all([
    buildRoleAwareContext(roleContext, recentMessages, message.text),
    isEnabled('GRAPH_CONTEXT')
      ? buildGraphContext(roleContext, participantProfiles, roomId)
      : null,
    isEnabled('VALUES_CONTEXT')
      ? buildValuesContext(roleContext, participantProfiles, message.text)
      : null,
    isEnabled('USER_INTELLIGENCE')
      ? buildUserIntelligenceContext(roleContext, participantProfiles, message.text, roomId)
      : null,
    isEnabled('VOICE_SIGNATURE')
      ? buildVoiceSignatureSection(roleContext, recentMessages)
      : null,
    isEnabled('INTERVENTION_LEARNING')
      ? buildInterventionLearningSection(roleContext)
      : null,
    isEnabled('DUAL_BRAIN_CONTEXT') && senderUserId
      ? buildDualBrainContext(message.text, senderUserId, receiverUserId, roomId)
      : null,
  ]);

  // ... rest of function ...
}
```

**Expected Impact**:

- 30-40% reduction in context building time
- 20-30% reduction in token usage per prompt

---

## Phase 2: Early Exit Optimization (Week 1)

### 2.1 Move Pre-Filter Check Before Context Building

**File**: `chat-server/src/core/engine/mediator.js`

**Current Flow** (lines 127-230):

1. Cache check
2. Pre-filter check (returns early if safe)
3. Code layer analysis
4. **Context building** ← Expensive!
5. AI call

**Optimized Flow**:

1. Cache check
2. Pre-filter check (returns early if safe)
3. Code layer analysis (returns early if quick-pass)
4. **Context building** ← Only if needed
5. AI call

**Key Changes**:

```javascript
async analyzeMessage(...) {
  // ... cache check ...

  // === PRE-FILTERS (Early Exit #1) ===
  const preFilterResult = preFilters.runPreFilters(message.text);
  if (preFilterResult.shouldSkipAI) {
    logger.debug('Pre-approved message, skipping AI', {
      reason: preFilterResult.reason,
      messageId: message?.id,
    });
    return null; // Early exit - no context building needed
  }

  // === CODE LAYER ANALYSIS (Early Exit #2) ===
  let codeLayerResult = null;
  // ... code layer logic ...

  if (codeLayerResult?.quickPass?.canPass) {
    logger.debug('Code layer quick-pass, skipping AI', {
      messageId: message?.id,
    });
    return null; // Early exit - no context building needed
  }

  // === BUILD CONTEXTS (Only if we reach here) ===
  const contexts = await contextBuilder.buildAllContexts({...});

  // ... rest of function ...
}
```

**Expected Impact**:

- 40-50% of messages exit before context building
- 20-30% latency reduction for safe messages

---

## Phase 3: Logging Standardization (Week 1-2)

### 3.1 Replace All console.\* Calls

**Files to Update** (28 files with 126 console calls):

- `chat-server/src/core/engine/mediator.js` (13 calls)
- `chat-server/src/core/engine/messageCache.js` (3 calls)
- `chat-server/src/core/engine/libraryLoader.js` (9 calls)
- `chat-server/src/core/engine/client.js` (5 calls)
- `chat-server/src/core/engine/ai/nameDetector.js` (6 calls)
- ... (23 more files)

**Pattern to Follow**:

```javascript
// BEFORE
console.log('✅ AI Mediator: Using cached analysis');
console.warn('⚠️ Rate limit reached');
console.error('Error:', error);

// AFTER
const logger = defaultLogger.child({ module: 'mediator' });
logger.debug('Using cached analysis', { cacheHit: true });
logger.warn('Rate limit reached', { requestCount });
logger.error('Analysis failed', { error: error.message, stack: error.stack });
```

**Script**: Create `scripts/refactor/replace-console-logs.js` to automate bulk replacements.

**Expected Impact**:

- Unified logging format
- Better log aggregation
- Easier debugging

---

## Phase 4: Name Detection Simplification (Week 2)

### 4.1 Replace LLM with Regex/NER

**File**: `chat-server/src/core/engine/ai/nameDetector.js`

**Current Implementation**: Uses GPT-4o-mini to extract names, then filters with regex.

**New Implementation**:

```javascript
const { isEnabled } = require('../../../infrastructure/config/featureFlags');

/**
 * Simple regex-based name detection
 * Matches capitalized words that look like names
 */
function detectNamesWithRegex(text, existingContacts = [], participantUsernames = []) {
  const existingNames = new Set([
    ...existingContacts.map(c => c.name.toLowerCase()),
    ...participantUsernames.map(u => u.toLowerCase()),
  ]);

  // Pattern: Capitalized word(s) that aren't at start of sentence
  // Excludes common words, dates, times
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  const commonWords = new Set([
    'the',
    'and',
    'for',
    'are',
    'but',
    'not',
    'you',
    'all',
    'can',
    'her',
    'was',
    'one',
    'our',
    'out',
    'day',
    'get',
    'has',
    'him',
    'his',
    'how',
    'its',
    'may',
    'new',
    'now',
    'old',
    'see',
    'two',
    'way',
    'who',
    'boy',
    'did',
    'has',
    'let',
    'put',
    'say',
    'she',
    'too',
    'use',
    'mom',
    'dad',
  ]);

  const matches = text.match(namePattern) || [];
  const detectedNames = matches
    .filter(name => {
      const lower = name.toLowerCase();
      // Exclude common words
      if (commonWords.has(lower)) return false;
      // Exclude existing contacts/participants
      if (existingNames.has(lower)) return false;
      // Must be 2+ characters
      if (name.length < 2) return false;
      // Exclude if it's a date/time pattern
      if (/^\d/.test(name)) return false;
      return true;
    })
    .filter((name, index, arr) => arr.indexOf(name) === index); // Unique

  return detectedNames;
}

async function detectNamesInMessage(text, existingContacts = [], participantUsernames = []) {
  // Use regex by default, fallback to AI if flag enabled
  if (isEnabled('AI_NAME_DETECTION')) {
    // Keep existing LLM implementation as fallback
    return await detectNamesWithLLM(text, existingContacts, participantUsernames);
  }

  return detectNamesWithRegex(text, existingContacts, participantUsernames);
}
```

**Expected Impact**:

- 100% cost reduction for name detection
- 90% latency reduction (regex vs LLM call)

---

## Phase 5: Prompt Simplification (Week 2-3)

### 5.1 Extract Constitution to Few-Shot Examples

**File**: `chat-server/src/core/engine/promptBuilder.js`

**Current Issue**: Full constitution embedded in every prompt (~2000+ tokens).

**Strategy**:

1. Extract core rules (3-5 immutable principles)
2. Move detailed examples to few-shot examples
3. Keep only essential instructions in system prompt

**New System Prompt** (reduced from ~2000 to ~300 tokens):

```javascript
const SYSTEM_PROMPT = `You analyze co-parenting messages and decide: STAY_SILENT, INTERVENE, or COMMENT.

CORE RULES:
1. Language, not emotions - describe phrasing mechanics, never diagnose feelings
2. No diagnostics - never use psychological labels (narcissist, manipulative, etc.)
3. Sender-first - help sender communicate better, not punish them

STAY_SILENT for: polite requests, scheduling, logistics, questions about children, acknowledgments.
INTERVENE only for: clear attacks, blame, contempt, guilt-tripping, weaponizing children.

When INTERVENING, provide:
1. validation - normalize their reaction (1-2 sentences, specific to their situation)
2. refocusQuestions - 3 brief questions to shift from reactivity to responsiveness
3. rewrite1 & rewrite2 - TWO rewritten versions of their original message (same person, same intent, better words)

JSON only.`;
```

**Few-Shot Examples File**: `chat-server/src/core/engine/prompts/fewShotExamples.js` (NEW)

```javascript
module.exports = {
  interventionExamples: [
    {
      input: 'You never let me see the kids on time!',
      output: {
        action: 'INTERVENE',
        validation: "It's frustrating when schedules don't align with your expectations...",
        refocusQuestions: [
          'What do you really need from them right now?',
          'Could the delay be about their situation, not about you?',
          'Will this matter in a week?',
        ],
        rewrite1:
          "I'd really appreciate sticking to the schedule so I can make the most of my time with them.",
        rewrite2:
          'Could we work together to make sure pickups happen on time? It helps me plan better.',
      },
    },
    // ... more examples
  ],
  staySilentExamples: [
    {
      input: 'Could we swap weekends? I have a work trip.',
      output: {
        action: 'STAY_SILENT',
      },
    },
    // ... more examples
  ],
};
```

**Expected Impact**:

- 60-70% reduction in prompt tokens
- 40-50% cost reduction per AI call
- Faster AI responses

---

## Phase 6: Rate Limiting Fix (Week 2)

### 6.1 Replace Manual Rate Limiting with Redis

**File**: `chat-server/src/core/engine/client.js`

**Current Issue**: In-memory rate limiting doesn't work across multiple server instances.

**New Implementation**:

```javascript
const {
  isRedisAvailable,
  cacheIncrement,
  cacheGet,
} = require('../../infrastructure/database/redisClient');
const { RATE_LIMIT } = require('../../infrastructure/config/constants');

async function checkRateLimit() {
  if (!isRedisAvailable()) {
    // Fallback to in-memory (single instance only)
    return checkRateLimitInMemory();
  }

  const windowKey = `rate_limit:${Math.floor(Date.now() / RATE_LIMIT.WINDOW_MS)}`;
  const current = await cacheIncrement(windowKey, 1);

  // Set TTL if this is first request in window
  if (current === 1) {
    await cacheSet(windowKey, '1', Math.ceil(RATE_LIMIT.WINDOW_MS / 1000));
  }

  return current <= RATE_LIMIT.MAX_REQUESTS_PER_WINDOW;
}
```

**Expected Impact**:

- Works correctly in multi-instance deployments
- More reliable rate limiting

---

## Phase 7: State Manager Simplification (Week 3)

### 7.1 Remove Unproven Tracking

**File**: `chat-server/src/core/engine/stateManager.js`

**Current Issue**: Tracks escalation scores, emotional states, stress trajectories, adaptive thresholds - no evidence these improve outcomes.

**Simplified Implementation**:

```javascript
// Keep only essential state
function initializeEscalationState(conversationContext, roomId) {
  if (!conversationContext.escalationState) {
    conversationContext.escalationState = new Map();
  }

  if (!conversationContext.escalationState.has(roomId)) {
    conversationContext.escalationState.set(roomId, {
      lastInterventionTime: null,
      recentInterventionCount: 0, // Last 24 hours
      patternCounts: {
        accusatory: 0,
        triangulation: 0,
      },
    });
  }
  return conversationContext.escalationState.get(roomId);
}

// Remove: emotionalState, policyState, stress trajectories, adaptive thresholds
// Add back only if A/B testing proves they improve outcomes
```

**Expected Impact**:

- 50% reduction in state complexity
- Easier debugging
- Faster state updates

---

## Phase 8: Make Contact Suggestions User-Triggered (Week 3)

### 8.1 Remove Automatic Contact Suggestions

**File**: `chat-server/src/core/engine/ai/contactSuggester.js`

**Current**: Automatically suggests contacts when names detected.

**New**: Only suggest when user explicitly requests.

**Changes**:

- Remove automatic calls from `mediator.js`
- Add API endpoint: `POST /api/contacts/suggest`
- Frontend: Show "Add Contact?" button when name detected

**Expected Impact**:

- 100% cost reduction for contact suggestions
- Better UX (user controls when to add contacts)

---

## Implementation Timeline

| Phase                          | Duration | Priority | Dependencies |
| ------------------------------ | -------- | -------- | ------------ |
| Phase 1: Feature Flags         | 2 days   | Critical | None         |
| Phase 2: Early Exit            | 1 day    | Critical | Phase 1      |
| Phase 3: Logging               | 3 days   | High     | None         |
| Phase 4: Name Detection        | 1 day    | High     | None         |
| Phase 5: Prompt Simplification | 3 days   | Critical | None         |
| Phase 6: Rate Limiting         | 1 day    | Medium   | None         |
| Phase 7: State Manager         | 2 days   | Medium   | None         |
| Phase 8: Contact Suggestions   | 1 day    | Low      | None         |

**Total**: ~2 weeks for critical items, ~3 weeks for all items

---

## Success Metrics

### Cost Reduction

- **Target**: 40-60% reduction in AI API costs
- **Measurement**: Compare monthly OpenAI costs before/after
- **Baseline**: Current cost per 1000 messages

### Latency Improvement

- **Target**: 30-50% reduction in median response time
- **Measurement**: P95 latency for `analyzeMessage()` calls
- **Baseline**: Current P95 latency

### Code Quality

- **Target**: Zero `console.*` calls in engine modules
- **Measurement**: Grep for console.\* in `src/core/engine/`
- **Baseline**: 126 console calls

### Maintainability

- **Target**: All experimental features behind feature flags
- **Measurement**: Count of hardcoded experimental feature calls
- **Baseline**: 7+ experimental contexts always enabled

---

## Risk Mitigation

### Risk 1: Breaking Changes

- **Mitigation**: Feature flags allow gradual rollout
- **Rollback**: Disable feature flags to revert

### Risk 2: Reduced Intervention Quality

- **Mitigation**: A/B test simplified prompts vs current
- **Monitoring**: Track intervention acceptance rates

### Risk 3: Name Detection Accuracy

- **Mitigation**: Keep LLM as fallback (feature flag)
- **Testing**: Compare regex vs LLM accuracy on test set

---

## Testing Strategy

### Unit Tests

- Feature flag system
- Regex name detection
- Simplified prompt builder
- Early exit logic

### Integration Tests

- End-to-end mediation flow with flags disabled
- End-to-end mediation flow with flags enabled
- Rate limiting across instances

### A/B Testing

- Simplified prompt vs current prompt (intervention quality)
- Regex name detection vs LLM (accuracy)
- Feature flags on/off (performance)

---

## Rollout Plan

1. **Week 1**: Deploy feature flags (all experimental features disabled)
2. **Week 2**: Deploy early exit + logging fixes
3. **Week 3**: Deploy name detection + prompt simplification
4. **Week 4**: Monitor metrics, enable features one by one if needed
5. **Week 5**: Full rollout if metrics look good

---

## Post-Refactoring Tasks

1. **Measure Impact**: Compare costs, latency, intervention quality
2. **A/B Test Features**: Enable experimental features one by one, measure impact
3. **Documentation**: Update architecture docs with new structure
4. **Cleanup**: Remove unused code paths after feature flags stabilize

---

## Files to Create

1. `chat-server/src/infrastructure/config/featureFlags.js` - Feature flag system
2. `chat-server/src/core/engine/prompts/fewShotExamples.js` - Few-shot examples
3. `scripts/refactor/replace-console-logs.js` - Logging migration script

## Files to Modify

1. `chat-server/src/core/engine/mediator.js` - Early exit, feature flags
2. `chat-server/src/core/engine/contextBuilders/index.js` - Conditional context building
3. `chat-server/src/core/engine/promptBuilder.js` - Simplified prompt
4. `chat-server/src/core/engine/client.js` - Redis rate limiting
5. `chat-server/src/core/engine/stateManager.js` - Simplified state
6. `chat-server/src/core/engine/ai/nameDetector.js` - Regex-based detection
7. `chat-server/src/core/engine/ai/contactSuggester.js` - User-triggered only
8. All 28 files with console.\* calls - Replace with structured logging

---

## Questions for Review

1. Should we keep any experimental features enabled by default?
2. What's the acceptable accuracy threshold for regex name detection?
3. Should we A/B test prompt simplification before full rollout?
4. Are there any experimental features that have proven value and should stay?
