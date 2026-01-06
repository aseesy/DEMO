# GoogleOAuthCallback Test Failures - Root Cause Analysis

## Summary

Fixed 2 failing tests by identifying and resolving:

1. **Component Bug**: Missing `{ replace: true }` option in navigate calls
2. **Test Expectation Mismatch**: Test expected loading state when component immediately shows error

## Root Cause Analysis

### Issue 1: "should render loading state initially" - Test Expectation Mismatch

**Root Cause:**

- The component processes the OAuth callback **immediately** on mount via `useEffect`
- When no `code` parameter is present, the component **immediately** sets state to `ERROR` (line 123)
- The component never enters `PROCESSING` state when there's no code
- The test expected to see "Completing Google login..." text, which only appears when `isProcessing === true`

**Evidence:**

```javascript
// Component code (lines 111-132)
if (!code) {
  // ... error handling ...
  setState(OAuthState.ERROR); // Immediately sets ERROR, never PROCESSING
  // ...
  return; // Returns before any processing state
}
```

**Fix:**

- Updated test to provide a `code` parameter in the URL, which triggers the actual processing state
- Changed from `<MemoryRouter>` to `<MemoryRouter initialEntries={['/auth/google/callback?code=test_code']}>`

**Before:**

```javascript
render(
  <MemoryRouter>
    <GoogleOAuthCallback />
  </MemoryRouter>
);
```

**After:**

```javascript
render(
  <MemoryRouter initialEntries={['/auth/google/callback?code=test_code']}>
    <GoogleOAuthCallback />
  </MemoryRouter>
);
```

---

### Issue 2: "should handle missing code parameter" - Component Bug

**Root Cause:**

- **Inconsistent `navigate` calls** in the component
- Lines 104 and 129 called `navigate(NavigationPaths.SIGN_IN)` **without** the `{ replace: true }` option
- Other similar calls (lines 94, 162, 178) correctly included `{ replace: true }`
- This inconsistency caused the test to fail because it expected the options object

**Evidence:**

```javascript
// Line 104 - BUG: Missing { replace: true }
setTimeout(() => {
  if (!signal.aborted) {
    navigate(NavigationPaths.SIGN_IN); // ❌ Missing options
  }
}, 3000);

// Line 129 - BUG: Missing { replace: true }
setTimeout(() => {
  if (!signal.aborted) {
    navigate(NavigationPaths.SIGN_IN); // ❌ Missing options
  }
}, 3000);

// Line 94 - CORRECT
navigate(NavigationPaths.SIGN_IN, { replace: true }); // ✅

// Line 162 - CORRECT
navigate(NavigationPaths.SIGN_IN, { replace: true }); // ✅
```

**Why This Matters:**

- `{ replace: true }` prevents adding a new history entry
- Without it, users can use the back button to return to the error state
- Consistency across all error navigation paths improves UX

**Fix:**

- Added `{ replace: true }` to both navigate calls (lines 104 and 129)

**Before:**

```javascript
navigate(NavigationPaths.SIGN_IN);
```

**After:**

```javascript
navigate(NavigationPaths.SIGN_IN, { replace: true });
```

---

## Test Results

### Before Fixes

- ❌ 2 tests failing
- ✅ 5 tests passing

### After Fixes

- ✅ **All 7 tests passing**
- ✅ Component bug fixed (consistent navigation behavior)
- ✅ Test expectations aligned with component behavior

---

## Lessons Learned

1. **Component Consistency**: All similar operations should behave consistently (e.g., all error navigations should use `replace: true`)

2. **Test Accuracy**: Tests should reflect actual component behavior, not ideal behavior. If a component immediately shows an error (not a loading state), the test should expect an error.

3. **Code Review**: This bug could have been caught in code review by checking for:
   - Consistent patterns across similar code paths
   - Missing options in function calls
   - Copy-paste errors where options were omitted

---

## Files Changed

1. `src/features/auth/components/GoogleOAuthCallback.jsx`
   - Fixed lines 104 and 129: Added `{ replace: true }` to navigate calls

2. `src/features/auth/components/__tests__/GoogleOAuthCallback.test.jsx`
   - Fixed "should render loading state initially" test: Added code parameter to trigger processing state

---

## Verification

All tests now pass:

```bash
npm test -- --run src/features/auth/components/__tests__/GoogleOAuthCallback.test.jsx
# ✅ 7 tests passing
```
