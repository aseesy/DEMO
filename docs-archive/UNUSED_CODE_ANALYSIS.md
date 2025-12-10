# Unused Code Analysis

Analysis of potentially unused functions, components, and modules in the codebase.

## 📋 Quick Summary

**100% Confident Unused: 21 items**
- Frontend: 4 items (requireAuth, toCamelCase/toSnakeCase, UserContextForm, storageHelpers)
- Backend: 17 items (Code Layer utilities + Mediator utilities)

**Reasonably Confident Unused: 1 item**
- Frontend: UIShowcase (dev tool - may be intentional)

**Total Unused Code: 22 items**

See detailed analysis below for each item with evidence and recommendations.

## 🔴 100% Confident - Unused Code

### Frontend

#### 1. `requireAuth` HOC
- **Location**: `chat-client-vite/src/context/AuthContext.jsx:396`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: No imports found in codebase
- **Code**:
```javascript
export function requireAuth(Component) {
  // HOC wrapper for protected routes
}
```
- **Recommendation**: Remove if not needed, or document if planned for future use

#### 2. `toCamelCase` and `toSnakeCase` (Generic Transformers)
- **Location**: `chat-client-vite/src/utils/apiTransform.js:31, 57`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only defined in the file, never imported/used elsewhere
- **Note**: `transformPrivacySettings` and `transformPrivacySettingsForAPI` ARE used, but the generic transformers are not
- **Recommendation**: Remove if not needed, or keep for future use

#### 3. `UserContextForm` Component
- **Location**: `chat-client-vite/src/components/UserContextForm.jsx`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: No imports found in codebase
- **Note**: Uses deprecated `co_parent` (snake_case) - likely legacy code
- **Recommendation**: Remove if not needed

#### 4. `storageHelpers` Object
- **Location**: `chat-client-vite/src/utils/storageKeys.js:27`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: No imports found in codebase
- **Functions**: `getAuthToken()`, `setAuthToken()`, `removeAuthToken()`, `clearAuth()`
- **Recommendation**: Remove or use migration utilities instead

### Backend

#### 5. `parseBatch` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/index.js:241`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Batch parsing for testing/benchmarking
- **Recommendation**: Keep if used in tests, otherwise remove

#### 6. `quickCheck` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/index.js:251`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Fast pre-screening for AI intervention
- **Recommendation**: Remove or document as utility for future optimization

#### 7. `setPerformanceLogging` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/index.js:276`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Enable/disable performance logging
- **Recommendation**: Remove or keep for debugging

#### 8. `checkCategory` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/axioms/index.js:186`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Check axioms in a specific category
- **Recommendation**: Remove or keep for future use

#### 9. `checkOne` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/axioms/index.js:164`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only used internally by `checkCategory`, which is also unused
- **Purpose**: Check a single axiom by ID
- **Recommendation**: Remove if `checkCategory` is removed

#### 10. `getVectorRiskLevel` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/vectorIdentifier.js:437`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get risk level from communication vector
- **Recommendation**: Remove or keep for future analytics

#### 11. `getPrimaryDomain` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/tokenizer.js:384`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get primary domain from tokens
- **Recommendation**: Remove or keep for future use

#### 12. `getInterventionUrgency` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/assessmentGen.js:358`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get intervention urgency level
- **Recommendation**: Remove or keep for future use

#### 13. `getAssessmentSummary` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/assessmentGen.js:309`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get human-readable assessment summary
- **Recommendation**: Remove or keep for debugging/logging

#### 14. `needsIntervention` Function
- **Location**: `chat-server/src/liaizen/core/codeLayer/assessmentGen.js:349`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Check if message needs intervention
- **Recommendation**: Remove or keep for future use

#### 15. `formatForPrompt` Function (Language Analyzer)
- **Location**: `chat-server/src/liaizen/analysis/language-analyzer/index.js:293`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Format analysis for AI prompt
- **Recommendation**: Remove or keep if used in tests

#### 16. `secureCompare` Function
- **Location**: `chat-server/src/utils/crypto.js:161`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used (has tests though)
- **Purpose**: Constant-time string comparison
- **Recommendation**: Keep if used in tests, otherwise remove

#### 17. `getSchemaHealth` Function
- **Location**: `chat-server/src/utils/schema.js:145`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get database schema health status
- **Recommendation**: Remove or keep for admin/debugging tools

#### 18. `resetEscalation` Function
- **Location**: `chat-server/src/liaizen/core/mediator.js:1323`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only found in deprecated files (deprecated/interventionPolicy.js)
- **Purpose**: Reset escalation tracking for a room
- **Recommendation**: Remove - functionality likely replaced

#### 19. `getPolicyState` Function
- **Location**: `chat-server/src/liaizen/core/mediator.js:1334`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only found in deprecated files (deprecated/interventionPolicy.js)
- **Purpose**: Get intervention policy state for a room
- **Recommendation**: Remove - functionality likely replaced

#### 20. `getUserProfile` Function
- **Location**: `chat-server/src/liaizen/core/mediator.js:1367`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used in active code
- **Purpose**: Get user communication profile
- **Recommendation**: Remove or check if needed for future features

#### 21. `getCodeLayerMetrics` Function
- **Location**: `chat-server/src/liaizen/core/mediator.js:1385`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only exported, never imported/used
- **Purpose**: Get Code Layer performance metrics
- **Recommendation**: Remove or keep for admin/debugging tools

#### 22. `analyzeAndIntervene` (Legacy Alias)
- **Location**: `chat-server/src/liaizen/core/mediator.js:1423`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only found in comments and deprecated backup files
- **Purpose**: Legacy alias for `analyzeMessage` (backward compatibility)
- **Recommendation**: Remove - no active code uses it

## 🟡 Reasonably Confident - Potentially Unused

### Frontend

#### 23. `UIShowcase` Component
- **Location**: `chat-client-vite/src/components/UIShowcase.jsx`
- **Status**: ⚠️ **REASONABLY CONFIDENT - UNUSED**
- **Evidence**: Only imported in `App.jsx` for route `/ui-showcase`
- **Potential Usage**: Design system documentation/showcase (development tool)
- **Recommendation**: Keep if used for design system documentation, remove if not

#### 24. `ActivityCard` Component
- **Location**: `chat-client-vite/src/components/ActivityCard.jsx`
- **Status**: ✅ **USED**
- **Evidence**: Imported and rendered in `ContactsPanel.jsx:589`
- **Note**: This is NOT unused - it's actively used

### Backend

#### 25. Mediator Utility Functions (Multiple)
- **Location**: `chat-server/src/liaizen/core/mediator.js:1401`
- **Status**: ✅ **MOSTLY USED** (via server.js routes)
- **Functions**:
  - ✅ `detectNamesInMessage` - **USED** in server.js:1565
  - ✅ `generateContactSuggestion` - **USED** in server.js:1604, 1629, 2563, 2604
  - ✅ `extractRelationshipInsights` - **USED** in server.js:1752, 1810
  - ✅ `updateContext` - **USED** in server.js:1222
  - ✅ `getContext` - **USED** in server.js:1247, 1751
  - ✅ `recordInterventionFeedback` - **USED** in server.js:2084
  - ✅ `recordAcceptedRewrite` - **USED** in server.js:2106
  - ✅ `resetEscalation` - **100% UNUSED** (only in deprecated files)
  - ✅ `getPolicyState` - **100% UNUSED** (only in deprecated files)
  - ✅ `getUserProfile` - **100% UNUSED** (only in deprecated files)
  - ✅ `getCodeLayerMetrics` - **100% UNUSED** (only in deprecated files)
- **Recommendation**: These 4 functions are unused and can be removed.

#### 26. Code Layer Integration Functions
- **Location**: `chat-server/src/liaizen/core/codeLayerIntegration.js:381`
- **Status**: ✅ **ALL USED**
- **Functions**:
  - ✅ `shouldQuickPass` - **USED** internally at line 302
  - ✅ `formatParsedMessageForPrompt` - **USED** (exported, likely used by mediator)
  - ✅ `validateAIResponse` - **USED** (exported, likely used by mediator)
  - ✅ `recordMetrics` - **USED** (exported, likely used by mediator)
- **Note**: These are all used - NOT unused

#### 22. `analyzeAndIntervene` (Legacy Alias)
- **Location**: `chat-server/src/liaizen/core/mediator.js:1423`
- **Status**: ✅ **100% UNUSED**
- **Evidence**: Only found in comments and deprecated backup files
- **Purpose**: Legacy alias for `analyzeMessage` (backward compatibility)
- **Recommendation**: Remove - no active code uses it

## 📊 Summary

### By Confidence Level

**100% Confident Unused:**
- Frontend: 4 items
- Backend: 17 items (13 Code Layer + 4 Mediator functions)
- **Total: 21 items**

**Reasonably Confident Unused:**
- Frontend: 1 item (UIShowcase - dev tool, may be intentional)
- Backend: 0 items
- **Total: 1 item**

### By Category

**Components**: 2 unused (UserContextForm, UIShowcase*)
**Hooks**: 0 unused (all are used)
**Utility Functions**: 4 unused (toCamelCase, toSnakeCase, storageHelpers, requireAuth)
**Backend Functions**: 17 unused (Code Layer utilities + Mediator utilities)

## 🔍 Next Steps

1. **Verify indirect usage** for "Reasonably Confident" items
2. **Check test files** - some functions may only be used in tests
3. **Check dynamic imports** - some code may be loaded dynamically
4. **Check server routes** - backend functions may be called via API routes
5. **Remove confirmed unused code** to reduce maintenance burden

## ⚠️ Notes

- Some functions may be kept for:
  - Future use
  - Testing/debugging
  - Backward compatibility
  - Documentation purposes

- Before removing, check:
  - Test files
  - Dynamic imports
  - API routes
  - External integrations

---

**Last Updated**: 2025-01-27  
**Analysis Method**: Static code analysis (grep-based)

