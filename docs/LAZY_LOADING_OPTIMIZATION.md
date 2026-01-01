# Lazy Loading Optimization for Cold Start Performance

## Problem

The `libraryLoader.js` and `codeLayerIntegration.js` were loading heavy AI and language analysis modules synchronously during server startup. This increased cold start time and could lead to deployment timeouts on platforms like Railway or Vercel.

## Solution

Implemented lazy loading for heavy modules that are only needed when processing messages:

### 1. `libraryLoader.js` - Lazy Load Heavy Modules

**Lazy-loaded modules:**
- `languageAnalyzer` - Only loads when analyzing messages
- `communicationProfile` - Only loads when recording accepted rewrites

**Implementation:**
- Created `createLazyLoader()` function that returns a getter function
- Modules are loaded on first access, then cached for subsequent calls
- Supports test mocking via setters

**Before:**
```javascript
const libraries = {
  languageAnalyzer: safeLoad('../analysis/languageAnalyzer', 'Language analyzer'),
  communicationProfile: safeLoad('../profiles/communicationProfile', 'Communication profile'),
  // ... other modules
};
```

**After:**
```javascript
const lazyLoaders = {
  languageAnalyzer: createLazyLoader('../analysis/languageAnalyzer', 'Language analyzer'),
  communicationProfile: createLazyLoader('../profiles/communicationProfile', 'Communication profile'),
};

// Access via getters (loads on first access)
get languageAnalyzer() {
  return lazyLoaders.languageAnalyzer();
}
```

### 2. `codeLayerIntegration.js` - Lazy Load Code Layer

**Implementation:**
- Code Layer module is loaded only when `analyzeWithCodeLayer()` is called
- Uses `getCodeLayer()` function that caches the module after first load
- Prevents loading during server startup

**Before:**
```javascript
let codeLayer;
try {
  codeLayer = require('./codeLayer');
  console.log('✅ Code Layer Integration: Code Layer v' + codeLayer.VERSION + ' loaded');
} catch (err) {
  codeLayer = null;
}
```

**After:**
```javascript
let codeLayer = null;
let codeLayerLoadAttempted = false;

function getCodeLayer() {
  if (codeLayer !== null) return codeLayer;
  if (codeLayerLoadAttempted) return null;
  
  codeLayerLoadAttempted = true;
  try {
    codeLayer = require('./codeLayer');
    console.log('✅ Code Layer Integration: Code Layer v' + codeLayer.VERSION + ' loaded (lazy)');
    return codeLayer;
  } catch (err) {
    codeLayer = null;
    return null;
  }
}
```

## Benefits

1. **Reduced Cold Start Time**: Heavy modules are not loaded until needed
2. **Faster Server Startup**: Server can start responding to health checks immediately
3. **Better Deployment Reliability**: Reduces risk of timeout during deployment
4. **Backward Compatible**: Existing code continues to work without changes
5. **Test Friendly**: Supports test mocking via setters

## Usage

No changes required in existing code. The lazy loading is transparent:

```javascript
// This still works - loads on first access
if (libs.languageAnalyzer) {
  const analysis = libs.languageAnalyzer.analyze(message.text, { childNames });
}

// Tests can still mock
libs.languageAnalyzer = { analyze: jest.fn() };
```

## Performance Impact

- **Startup Time**: Reduced by deferring heavy module loading
- **First Message**: Slight delay on first message (one-time cost)
- **Subsequent Messages**: No performance impact (modules cached)

## Files Modified

- `chat-server/src/core/engine/libraryLoader.js` - Added lazy loading for heavy modules
- `chat-server/src/core/engine/codeLayerIntegration.js` - Added lazy loading for Code Layer

