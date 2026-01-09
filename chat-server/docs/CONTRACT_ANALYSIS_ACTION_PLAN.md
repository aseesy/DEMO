# Contract Analysis - Action Plan

**Date**: 2025-01-08  
**Status**: ⚠️ Issues Found - Action Required

## 📊 Summary

- **10 Violations** (Missing API Schema Validation)
- **25 Issues** (24 hardcoded URLs, 1 `any` type)
- **115 Routes** without schema validation total

---

## 🔴 Priority 1: Missing API Schema Validation (CRITICAL)

### Violations Found: 10 routes

These routes are missing Zod schema validation, which is a **security and data integrity risk**.

#### `chat-server/routes/connections.js` (5 routes)

1. ❌ `POST /contact` - Missing schema validation
2. ❌ `POST /invite` - Missing schema validation
3. ❌ `GET /join` - Missing schema validation
4. ❌ `POST /join/accept` - Missing schema validation
5. ❌ `POST /auth/signup-with-token` - Missing schema validation

#### `chat-server/routes/ai.js` (2 routes)

6. ❌ `POST /tasks/generate` - Missing schema validation
7. ❌ `POST /mediate/analyze` - Missing schema validation

#### `chat-server/routes/profile.js` (3 routes)

8. ❌ `GET /me` - Missing schema validation (query params)
9. ❌ `PUT /me` - Missing schema validation (body)
10. ❌ `GET /privacy/me` - Missing schema validation (query params)

### Action Required

Add Zod schema validation to all routes. Example:

```javascript
// routes/profile.js
const { z } = require('zod');
const validateSchema = require('./auth/validateSchema');

// For PUT /me
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  // ... other fields
});

router.put('/me', authMiddleware, validateSchema(updateProfileSchema), async (req, res) => {
  // handler
});
```

### Impact

- **Security**: Prevents invalid/malicious input
- **Data Integrity**: Ensures data matches expected format
- **Developer Experience**: Clear error messages for invalid requests
- **Type Safety**: Validated data is predictable

---

## 🟡 Priority 2: Type Safety Issue (WARNING)

### Issue Found: 1 `any` type usage

**File**: `chat-server/src/core/engine/mediatorErrors.js:110`

**Action Required**: Replace `any` with proper type annotation.

```javascript
// Before
function someFunction(param: any) { ... }

// After
function someFunction(param: string | number) { ... }
// or
interface ParamType { ... }
function someFunction(param: ParamType) { ... }
```

### Impact

- **Type Safety**: Prevents runtime errors
- **Code Quality**: Better IDE support and autocomplete
- **Maintainability**: Clearer code contracts

---

## 🟢 Priority 3: Hardcoded URLs (INFO - Low Priority)

### Issues Found: 24 hardcoded localhost URLs

These are mostly in:

- Test files (acceptable for tests)
- Scripts (acceptable for one-off scripts)
- Some production code (should use config)

### Files to Review

**Production Code** (should fix):

- `chat-server/config.js:79`
- `chat-server/src/services/room/roomService.js:166, 200`
- `chat-server/src/infrastructure/validation/validators.js:88`

**Test Files** (acceptable, but could improve):

- `chat-server/__tests__/socket.integration.test.js` (8 instances)
- `chat-server/__tests__/user-acceptance/*.js` (4 instances)
- Other test files

**Scripts** (acceptable):

- `chat-server/scripts/*.js` (various)

### Action Required

For production code, replace with config:

```javascript
// Before
const url = 'http://localhost:3000/api/user';

// After
import { API_BASE_URL } from '../config.js';
const url = `${API_BASE_URL}/api/user`;
```

### Impact

- **Flexibility**: Easy to change URLs for different environments
- **Maintainability**: Single source of truth for URLs
- **Deployment**: Works across dev/staging/prod

---

## 📋 Complete Action Checklist

### Immediate (Before Next Push)

- [ ] Add schema validation to `POST /contact` (connections.js)
- [ ] Add schema validation to `POST /invite` (connections.js)
- [ ] Add schema validation to `GET /join` (connections.js)
- [ ] Add schema validation to `POST /join/accept` (connections.js)
- [ ] Add schema validation to `POST /auth/signup-with-token` (connections.js)
- [ ] Add schema validation to `POST /tasks/generate` (ai.js)
- [ ] Add schema validation to `POST /mediate/analyze` (ai.js)
- [ ] Add schema validation to `GET /me` (profile.js)
- [ ] Add schema validation to `PUT /me` (profile.js)
- [ ] Add schema validation to `GET /privacy/me` (profile.js)

### Short Term (This Sprint)

- [ ] Fix `any` type in `mediatorErrors.js:110`
- [ ] Replace hardcoded URLs in production code (config.js, roomService.js, validators.js)

### Long Term (Technical Debt)

- [ ] Add schema validation to remaining 105 routes
- [ ] Replace hardcoded URLs in test files (optional, low priority)
- [ ] Create shared URL config for tests

---

## 🎯 Quick Wins

### 1. Start with Profile Routes (Easiest)

Profile routes are likely the simplest to add schemas to:

```javascript
// routes/profile.js
const { z } = require('zod');
const validateSchema = require('./auth/validateSchema');

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

router.put('/me', authMiddleware, validateSchema(updateProfileSchema), handler);
```

### 2. Use Existing Patterns

Check `routes/auth/` for examples of schema validation already in use.

### 3. Batch Similar Routes

Group similar routes together and create shared schemas.

---

## 📈 Progress Tracking

**Current State**:

- Routes with schemas: 0
- Routes without schemas: 115
- Violations: 10 (critical routes)
- Issues: 25 (mostly low priority)

**Target State**:

- All routes have schema validation
- No `any` types in production code
- All production URLs use config

---

## 🔗 Related Documentation

- Schema Validation: `chat-server/routes/auth/validateSchema.js`
- Zod Documentation: https://zod.dev
- Contract Analysis Setup: `chat-server/docs/CONTRACT_ANALYSIS_SETUP.md`

---

**Next Steps**: Start with Priority 1 (missing schemas) - these are blocking issues that should be fixed before shipping.
