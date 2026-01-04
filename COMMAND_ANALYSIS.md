# Command Analysis: Start/Stop Server Commands

## 🐛 Critical Issues Found

### 1. Port Mismatch Bug

- **`stop-dev.sh`** checks port **3001** (line 15) ❌
- **Server defaults to port 3000** (config.js line 62) ✅
- **`start-dev.sh`** uses `${PORT:-3000}` ✅
- **`restart-servers.sh`** checks port 3000 ✅

**Impact:** `npm stop` won't actually stop the backend server!

### 2. Redundant Commands

- `npm start` → `scripts/start-dev.sh`
- `npm run dev` → `scripts/start-dev.sh` (SAME SCRIPT!)

**Recommendation:** Remove one or keep both as aliases.

### 3. Duplicate Functionality

- `npm run dev` → `start-dev.sh` (bash script)
- `npm run dev:stack` → `dev-stack.js` (Node.js script)

Both do the same thing but use different implementations.

---

## 📊 Current Commands Analysis

| Command                    | Script                               | Port Check     | Status               |
| -------------------------- | ------------------------------------ | -------------- | -------------------- |
| `npm start`                | `start-dev.sh`                       | 3000 ✅        | Redundant            |
| `npm run dev`              | `start-dev.sh`                       | 3000 ✅        | Redundant            |
| `npm run dev:safe`         | `start-dev-safe.sh` → `start-dev.sh` | 3000 ✅        | Good (adds watchdog) |
| `npm run dev:stack`        | `dev-stack.js`                       | From config ✅ | Duplicate            |
| `npm stop`                 | `stop-dev.sh`                        | **3001 ❌**    | **BROKEN**           |
| `npm run restart`          | `restart-servers.sh`                 | 3000 ✅        | Good                 |
| `npm run restart:backend`  | `restart-servers.sh backend`         | 3000 ✅        | Good                 |
| `npm run restart:frontend` | `restart-servers.sh frontend`        | 5173 ✅        | Good                 |

---

## ✅ Recommended Simplification

### Keep These (Essential)

```bash
npm run dev          # Start servers (pick ONE implementation)
npm stop             # Stop servers (needs fix)
npm run restart      # Restart all
npm run restart:backend   # Restart backend only
npm run restart:frontend  # Restart frontend only
```

### Remove/Deprecate

```bash
npm start            # Remove - redundant with `npm run dev`
npm run dev:stack    # Remove - duplicate functionality
npm run dev:safe     # Consider: keep if watchdog is valuable, or merge into dev
```

### Fix Required

```bash
# stop-dev.sh line 15: Change 3001 → 3000
```

---

## 🔧 Immediate Fixes Needed

### 1. Fix stop-dev.sh (CRITICAL)

```bash
# Change line 15 from:
if lsof -ti:3001 > /dev/null 2>&1; then

# To:
if lsof -ti:3000 > /dev/null 2>&1; then
```

### 2. Consolidate Start Commands

**Option A:** Keep `npm run dev`, remove `npm start`

```json
// Remove from package.json:
"start": "./scripts/start-dev.sh",
```

**Option B:** Keep `npm start` as primary, remove `npm run dev` alias

```json
// Remove from package.json:
"dev": "./scripts/start-dev.sh",
```

**Recommendation:** Option A - `npm run dev` is more explicit.

### 3. Choose One Dev Implementation

**Recommendation:** Keep `start-dev.sh` (bash), remove `dev-stack.js`

- Bash script is simpler and already works
- Node.js version doesn't add significant value
- Less maintenance overhead

### 4. Simplify dev:safe

**Option A:** Merge watchdog into main `dev` command
**Option B:** Keep separate but document when to use
**Option C:** Remove if watchdog isn't actively needed

---

## 📝 Proposed Simplified Structure

### Start Commands

```bash
npm run dev          # Start development servers (primary)
npm run dev:safe     # Start with CPU watchdog (optional safety)
```

### Stop Commands

```bash
npm stop             # Stop all servers (FIXED)
```

### Restart Commands

```bash
npm run restart      # Restart all servers
npm run restart:backend   # Restart backend only
npm run restart:frontend  # Restart frontend only
```

---

## 🎯 Action Items

1. **URGENT:** Fix `stop-dev.sh` port from 3001 → 3000
2. **HIGH:** Remove redundant `npm start` or `npm run dev` (keep one)
3. **MEDIUM:** Remove `npm run dev:stack` (duplicate)
4. **LOW:** Consider merging watchdog into main dev command or document usage

---

## Summary

**Current:** 8 start/stop commands with bugs and redundancy  
**Recommended:** 5-6 commands (after fixes and cleanup)

This reduces complexity while maintaining all necessary functionality.
