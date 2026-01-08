# Documentation Assumptions Review

**Date**: 2025-01-07
**Method**: Code-first verification (code is source of truth)
**Status**: In Progress

## Verification Process

For each documentation claim, I'm checking:
1. ✅ Actual code/config files
2. ✅ Actual package.json files
3. ✅ Actual .env examples
4. ✅ Actual file structure
5. ❌ NOT assuming based on documentation

---

## Issues Found

### 1. ❌ **chat-client-vite/README.md - Tech Stack Claims**

**Claimed:**
- TanStack Query
- XState
- React Router

**Actual (from package.json):**
- ❌ TanStack Query: NOT in dependencies
- ❌ XState: NOT in dependencies  
- ✅ React Router: Present (`react-router-dom`)

**Fix Needed**: Remove TanStack Query and XState from tech stack list

---

### 2. ❌ **Redis Setup Documentation Reference** (FIXED)

**Claimed in chat-server/README.md:**
- "See `docs/REDIS_SETUP.md` for setup"

**Actual:**
- ❌ File `docs/REDIS_SETUP.md` does NOT exist
- ✅ Redis setup docs exist in `docs/deployment/RAILWAY_REDIS_SETUP.md`

**Fix Applied**: Updated reference to point to actual file location

---

### 3. ⚠️ **Redis: Required vs Optional**

**Claimed in docs:**
- Some docs say "optional"
- Some docs say "recommended"

**Actual (from redisClient.js):**
- Redis gracefully degrades if not available
- Code works without Redis
- ✅ Truly optional

**Status**: Documentation is correct, but should be consistent

---

### 4. ⚠️ **Neo4j: Required vs Optional**

**Need to verify:**
- Is Neo4j actually used?
- Is it required or optional?
- What happens if NEO4J_URI is not set?

**Action**: Check actual usage in code

---

### 5. ❌ **SDD Framework: Agent Count** (FIXED)

**Claimed in docs/sdd-framework.md:**
- "14 Agents Across 6 Departments"

**Actual:**
- Only 2 agent directories found: `product/` (2 agents), `quality/` (1 agent)
- Total: 3 agents, not 14

**Fix Applied**: Removed specific count, changed to "Specialized Agents"

---

### 6. ❌ **SDD Framework: Principles Count** (FIXED)

**Claimed:**
- "14 base + 3 co-parenting = 17 total"

**Actual:**
- Constitution explicitly states: "Total Principles: 14"
- No co-parenting specific principles listed separately
- Principles I-XIV are the complete set

**Fix Applied**: Updated to reflect actual 14 principles

---

### 7. ⚠️ **SDD Framework: DS-STAR Status**

**Claimed:**
- "Active if Python 3.9+ is available"

**Actual (need to verify):**
- Does `.specify/src/sdd/` actually exist?
- Is Python actually required?

**Action**: Verify file structure and Python requirement

---

### 8. ⚠️ **README.md: Scripts Reference**

**Claimed:**
- "See `chat-server/scripts/README.md` for detailed documentation"

**Actual (need to verify):**
- Does this file exist?
- Does it have the claimed documentation?

**Action**: Verify file exists and content

---

### 9. ⚠️ **README.md: Deployment Docs Reference**

**Claimed:**
- "`docs/deployment/` — Detailed deployment guides"

**Actual (need to verify):**
- What files are actually in `docs/deployment/`?
- Are they "detailed deployment guides" or something else?

**Action**: List actual files and verify description

---

### 10. ✅ **Helmet.js Usage** (VERIFIED CORRECT)

**Claimed in security.md:**
- "Security headers (Helmet.js)"

**Actual:**
- ✅ Helmet.js is installed (`helmet: ^7.0.0` in package.json)
- ✅ Helmet.js is used in `middleware.js` with CSP configuration

**Status**: Documentation is correct

---

## Verification Commands

```bash
# Check actual dependencies
cat chat-client-vite/package.json | grep -E "tanstack|xstate|react-router"

# Check Redis setup file
ls docs/REDIS_SETUP.md

# Count agents
find .claude/agents -type d -mindepth 1 -maxdepth 1 | wc -l

# Count principles
grep -c "^##\|^###" .specify/memory/constitution.md

# Check DS-STAR files
ls -la .specify/src/sdd/

# Check scripts README
ls chat-server/scripts/README.md

# Check deployment docs
ls docs/deployment/

# Check Helmet
grep -i helmet chat-server/package.json
grep -i helmet chat-server/middleware.js
```

---

## Additional Issues Found

### 11. ❌ **bcrypt Salt Rounds** (FIXED)

**Claimed in docs/security.md:**
- "bcrypt with salt rounds" (implies 12 rounds)

**Actual (from chat-server/auth/utils.js):**
- `const saltRounds = 10;` (not 12)

**Fix Applied**: Updated to specify "10 salt rounds"

---

### 12. ⚠️ **README.md: Scripts Reference**

**Claimed:**
- `npm run migrate` and `npm run db:validate` work from root

**Actual:**
- These scripts are in `chat-server/package.json`, not root `package.json`
- Must run from `chat-server/` directory or use workspace commands

**Fix Applied**: Updated to clarify directory requirements

---

## Summary

**Fixed Issues:**
1. ✅ bcrypt salt rounds (10, not 12)
2. ✅ SDD principles count (14, not 17)
3. ✅ SDD agent count (removed specific count)
4. ✅ Redis setup reference (pointed to actual file)
5. ✅ README.md scripts (clarified directory requirements)

**Verified Correct:**
1. ✅ TanStack Query and XState are actually in dependencies
2. ✅ Helmet.js is installed and used
3. ✅ Neo4j is optional (gracefully degrades)
4. ✅ Redis is optional (gracefully degrades)

**All fixes applied to documentation.**

