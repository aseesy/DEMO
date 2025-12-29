# Skipped Tests Analysis

**Date**: 2025-12-29  
**Total Skipped**: 8 tests across 3 test files

## Summary

| Category              | Count | Priority | Status                |
| --------------------- | ----- | -------- | --------------------- |
| PWA Auth Flow         | 4     | **HIGH** | Needs fixing          |
| Circular Dependencies | 2     | Low      | Intentionally skipped |
| Dashboard Abstraction | 2     | Medium   | Needs investigation   |

---

## 1. PWA Authentication Flow Tests (4 tests)

**File**: `chat-client-vite/src/__tests__/pwa-auth-flow.test.jsx`  
**Status**: Entire suite skipped with `describe.skip()`  
**Reason**: "Fix mocking issues with this test suite"

### Tests Skipped:

1. `should automatically log in when PWA launches with stored auth token`
2. `should show landing page when PWA launches without stored auth`
3. `should hide landing page immediately when authenticated state loads`
4. `should redirect to sign-in when not authenticated after verification`

### Why They're Important:

These tests verify critical PWA behavior:

- Auto-login on PWA launch with stored auth
- Proper redirects when not authenticated
- Landing page visibility logic

### Current Issues:

- Complex mocking of `AuthProvider`, `ChatRoom`, navigation, and multiple feature hooks
- Mock setup conflicts with actual component behavior
- Tests may be flaky due to async timing issues

### Recommendations:

#### Option A: Fix the Mocks (Recommended)

1. Review `pwa-auth-integration.test.js` for working patterns
2. Simplify mocks to focus on auth state, not full component rendering
3. Use `waitFor` with proper timeouts for async operations
4. Mock at the storage/adapter level rather than component level

#### Option B: Convert to Integration Tests

1. Use `pwa-layout-integration.test.jsx` as a template
2. Test the actual rendered components with proper providers
3. Use real storage mocks instead of component mocks

#### Option C: Manual Testing (Temporary)

- Use `pwa-auth-manual.test.md` guide for manual verification
- Document test results until automated tests are fixed

### Action Items:

- [ ] Investigate specific mocking failures
- [ ] Simplify test setup using integration test patterns
- [ ] Re-enable one test at a time to isolate issues
- [ ] Add proper async handling and timeouts

---

## 2. Circular Dependencies Tests (2 tests)

**File**: `chat-client-vite/src/architecture/circularDependencies.test.js`  
**Status**: Conditionally skipped with `it.skipIf(!FULL_CHECK)`  
**Reason**: Slow tests that use `madge` tool (60s+ timeout)

### Tests Skipped:

1. `should have no circular dependencies (slow - run with FULL_CIRCULAR_CHECK=1)`
2. `barrel files should not cause circular imports (slow)`

### Why They're Skipped:

- These tests are intentionally skipped in normal test runs
- They're slow (use external `madge` tool)
- Should be run periodically, not on every test run

### Recommendations:

✅ **Keep as-is** - This is the correct approach

### When to Run:

- Before major releases
- When adding new barrel files (`index.js` exports)
- When refactoring import structure
- In CI on a schedule (e.g., nightly)

### How to Run:

```bash
FULL_CIRCULAR_CHECK=1 npm test -- circularDependencies
```

### Action Items:

- [ ] Add to CI schedule (nightly/weekly)
- [ ] Document in README when to run these
- [ ] Consider adding pre-commit hook for barrel file changes

---

## 3. Dashboard Data Abstraction Tests (2 tests)

**File**: `chat-client-vite/src/features/dashboard/useDashboard.dataAbstraction.test.js`  
**Status**: Skipped with `it.skip()`  
**Reason**: TODO comments say "Re-enable after refactoring useDashboard to not expose raw tasks"

### Tests Skipped:

1. `raw tasks array is not directly exposed in grouped props`
2. `only exposes abstracted state, not raw state`

### Why They're Skipped:

- Tests expect `useDashboard` to NOT expose raw `tasks` array
- Tests expect only abstracted `taskState` to be exposed
- Refactoring may not be complete, or tests may be outdated

### Recommendations:

#### Step 1: Investigate Current State

```bash
# Check what useDashboard actually exposes
grep -n "return {" chat-client-vite/src/features/dashboard/useDashboard.js
```

#### Step 2: Determine Action

- **If refactor is complete**: Update tests to match new API and re-enable
- **If refactor is incomplete**: Complete the refactor, then re-enable tests
- **If tests are wrong**: Update tests to match current (correct) behavior

#### Step 3: Re-enable or Remove

- If tests are valid but implementation needs work: Keep skipped with clear TODO
- If tests are outdated: Update or remove them
- If implementation is correct: Re-enable tests

### Action Items:

- [ ] Check current `useDashboard` return value
- [ ] Verify if `tasks` array is still exposed
- [ ] Determine if refactor is needed or tests need updating
- [ ] Re-enable tests once issue is resolved

---

## Priority Action Plan

### Immediate (This Week):

1. **PWA Auth Flow Tests** - Investigate and fix mocking issues
   - Start with one test, get it passing
   - Use integration test patterns as reference
   - Document findings

### Short Term (This Month):

2. **Dashboard Abstraction Tests** - Investigate and resolve
   - Check current implementation
   - Decide: fix implementation or update tests
   - Re-enable or remove

### Ongoing:

3. **Circular Dependencies** - Keep as-is, run periodically
   - Add to CI schedule
   - Document in README

---

## Test Coverage Impact

**Current**: 1003 passing, 8 skipped (99.2% of written tests passing)

**If all tests were enabled**:

- PWA Auth: +4 tests (critical functionality)
- Circular Deps: +2 tests (architectural quality)
- Dashboard: +2 tests (data abstraction)

**Recommendation**: Focus on PWA Auth tests first (highest priority for user experience).

---

## Related Files

- `chat-client-vite/src/__tests__/pwa-auth-flow.test.jsx` - Skipped tests
- `chat-client-vite/src/__tests__/pwa-auth-integration.test.js` - Working integration tests (reference)
- `chat-client-vite/src/__tests__/pwa-auth-manual.test.md` - Manual test guide
- `chat-client-vite/src/architecture/circularDependencies.test.js` - Circular dep tests
- `chat-client-vite/src/features/dashboard/useDashboard.dataAbstraction.test.js` - Abstraction tests
