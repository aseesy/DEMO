# Mediator.js Refactoring Plan

## 📊 Current State

- **File**: `chat-server/src/liaizen/core/mediator.js`
- **Size**: 1,402 lines
- **Functions**: 16 functions
- **Main Function**: `analyzeMessage` (~800 lines)

## 🎯 Goals

1. **Reduce file size** from 1,402 lines to <500 lines per file
2. **Improve maintainability** by separating concerns
3. **Enable better testing** with isolated modules
4. **Preserve functionality** - no breaking changes

## 📋 Proposed Module Structure

### 1. **`mediator.js`** (Main Orchestrator) - ~200 lines

**Purpose**: Main entry point, coordinates all modules

**Responsibilities**:

- Export main `analyzeMessage` function (thin wrapper)
- Initialize and coordinate sub-modules
- Handle top-level error handling
- Maintain backward compatibility

**Exports**:

```javascript
module.exports = {
  analyzeMessage, // Main entry point
  detectNamesInMessage, // Re-exported
  generateContactSuggestion, // Re-exported
  extractRelationshipInsights, // Re-exported
  updateContext,
  getContext,
  recordInterventionFeedback,
  recordAcceptedRewrite,
};
```

---

### 2. **`messageAnalyzer.js`** - ~300 lines

**Purpose**: Core message analysis logic

**Responsibilities**:

- Pre-filtering (greetings, polite messages, third-party statements, positive sentiment)
- Code Layer integration
- Language analysis integration
- Pattern detection
- Main AI API call orchestration
- Response parsing

**Functions**:

```javascript
async function analyzeMessage(message, context) {
  // Pre-filtering
  // Code Layer analysis
  // Language analysis
  // AI API call
  // Response parsing
  return result;
}

function preFilterMessage(message) {
  // Check greetings, polite messages, third-party, positive sentiment
  return { shouldSkip: boolean, reason: string };
}

function detectConflictPatterns(messageText) {
  // Local pattern detection
  return patterns;
}
```

**Dependencies**:

- `contextBuilder.js` - For building AI prompts
- `stateManager.js` - For state updates
- `cacheManager.js` - For caching

---

### 3. **`contextBuilder.js`** - ~250 lines

**Purpose**: Build all context strings for AI prompts

**Responsibilities**:

- Build user context strings
- Build profile context (comprehensive and role-aware)
- Build relationship context
- Build co-parenting situation context
- Build message history
- Build Code Layer prompt sections
- Build language analysis context

**Functions**:

```javascript
async function buildAnalysisContext(message, options) {
  return {
    userContextString,
    profileContextString,
    relationshipContextString,
    coparentingContextString,
    messageHistory,
    codeLayerPromptSection,
    languageAnalysisContext,
    roleAwarePromptSection,
  };
}

async function buildUserContexts(participants) {
  // Fetch and format user contexts
}

async function buildProfileContext(senderId, receiverId) {
  // Build comprehensive profile context
}

function buildRelationshipContext(roomId, contactContext, taskContext) {
  // Build relationship insights context
}
```

**Dependencies**:

- `userContext` module
- `profileHelpers` module
- `communicationProfile` module
- `coparentContext` module

---

### 4. **`interventionHandler.js`** - ~200 lines

**Purpose**: Process and validate interventions

**Responsibilities**:

- Validate intervention responses
- Apply rewrite perspective validation
- Apply Code Layer response validation
- Build intervention result objects
- Handle COMMENT actions
- Record interventions to profiles

**Functions**:

```javascript
function processIntervention(result, message, parsedMessage, languageAnalysis) {
  // Validate required fields
  // Apply rewrite validation
  // Apply Code Layer validation
  // Build intervention result
  return interventionResult;
}

function validateInterventionResponse(result) {
  // Check required fields
  return { valid: boolean, errors: [] };
}

function buildInterventionResult(intervention, message, escalation, emotion, codeLayerAnalysis) {
  // Build final intervention object
  return interventionResult;
}
```

**Dependencies**:

- `rewriteValidator` module
- `codeLayerIntegration` module
- `communicationProfile` module

---

### 5. **`stateManager.js`** - ~150 lines

**Purpose**: Manage conversation state (escalation, emotional, policy)

**Responsibilities**:

- Initialize states
- Update escalation scores
- Update emotional states
- Update policy states
- Track intervention history
- Manage state decay

**Functions**:

```javascript
function initializeEscalationState(roomId) {
  // Initialize escalation state
}

function initializeEmotionalState(roomId) {
  // Initialize emotional state
}

function initializePolicyState(roomId) {
  // Initialize policy state
}

function updateEscalationScore(roomId, patterns) {
  // Update escalation tracking
}

function updateEmotionalState(roomId, emotionData) {
  // Update emotional tracking
}

function updatePolicyState(roomId, intervention) {
  // Update policy tracking
}
```

**Dependencies**:

- Constants for thresholds

---

### 6. **`cacheManager.js`** - ~100 lines

**Purpose**: Message analysis caching

**Responsibilities**:

- Generate message hashes
- Check cache
- Store cache entries
- Manage cache size and TTL

**Functions**:

```javascript
function generateMessageHash(messageText, senderId, receiverId) {
  // Generate hash for caching
}

function getCachedAnalysis(messageHash) {
  // Check cache
}

function cacheAnalysis(messageHash, result) {
  // Store in cache
}

function cleanupCache() {
  // Remove expired entries
}
```

**Dependencies**:

- Constants for cache TTL and size

---

## 🔄 Refactoring Steps

### Phase 1: Extract State Management (Low Risk)

1. Create `stateManager.js`
2. Move state initialization functions
3. Move state update functions
4. Update `mediator.js` to use new module
5. Test state management

### Phase 2: Extract Cache Management (Low Risk)

1. Create `cacheManager.js`
2. Move cache functions
3. Update `mediator.js` to use new module
4. Test caching

### Phase 3: Extract Context Building (Medium Risk)

1. Create `contextBuilder.js`
2. Move context building logic from `analyzeMessage`
3. Refactor `analyzeMessage` to use context builder
4. Test context building

### Phase 4: Extract Intervention Handling (Medium Risk)

1. Create `interventionHandler.js`
2. Move intervention processing logic
3. Refactor `analyzeMessage` to use handler
4. Test intervention handling

### Phase 5: Extract Message Analysis (High Risk)

1. Create `messageAnalyzer.js`
2. Move core analysis logic
3. Refactor `mediator.js` to orchestrate modules
4. Test full flow

### Phase 6: Cleanup (Low Risk)

1. Remove unused code
2. Update documentation
3. Add JSDoc comments
4. Run full test suite

---

## 📁 Final File Structure

```
chat-server/src/liaizen/core/
├── mediator.js              (~200 lines) - Main orchestrator
├── messageAnalyzer.js      (~300 lines) - Core analysis
├── contextBuilder.js       (~250 lines) - Context building
├── interventionHandler.js  (~200 lines) - Intervention processing
├── stateManager.js         (~150 lines) - State management
├── cacheManager.js         (~100 lines) - Caching
├── client.js               (existing)
└── codeLayerIntegration.js (existing)
```

**Total**: ~1,200 lines (vs 1,402 current) - but better organized

---

## ⚠️ Risk Mitigation

### Risks

1. **Breaking changes** - Maintain exact same exports
2. **State management** - Ensure state is shared correctly
3. **Error handling** - Preserve all error handling
4. **Performance** - No performance degradation

### Mitigation

1. **Incremental refactoring** - One module at a time
2. **Comprehensive testing** - Test after each phase
3. **Backward compatibility** - Keep same public API
4. **Code review** - Review each phase before proceeding

---

## ✅ Success Criteria

- [ ] All files < 500 lines
- [ ] All tests pass
- [ ] No breaking changes to public API
- [ ] Performance maintained or improved
- [ ] Code coverage maintained
- [ ] Documentation updated

---

## 🚀 Next Steps

1. **Review this plan** with team
2. **Start with Phase 1** (State Management - lowest risk)
3. **Test incrementally** after each phase
4. **Document as we go** - Update JSDoc comments

---

**Created**: 2025-01-27  
**Status**: Proposed  
**Priority**: High (file is 1,402 lines)
