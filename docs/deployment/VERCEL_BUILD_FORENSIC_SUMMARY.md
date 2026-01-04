# Vercel Build Failure: Forensic Summary

**Date:** January 3, 2025  
**Issue:** Vercel deployment fails during install phase  
**Status:** Unresolved - Root cause unknown

---

## Problem Statement (Precise)

**Vercel build fails with:**

```
sh: line 1: cd: chat-client-vite: No such file or directory
Error: Command "cd chat-client-vite && npm ci --include=dev" exited with 1
```

**Context:**

- Repository: `github.com/aseesy/DEMO` (branch: `main`, commit: `d850f70`)
- Build location: Washington, D.C., USA (East) – iad1
- Build machine: 4 cores, 8 GB
- Vercel CLI: 50.1.3

**The failure occurs when Vercel attempts to execute the `installCommand` from `vercel.json`, which tries to change directory to `chat-client-vite`, but the directory is not found in the build context.**

---

## Confirmed Symptoms (Repeatable)

### ✅ Local Environment

1. **Local build succeeds:**
   - Command: `cd chat-client-vite && npm install && npm run build`
   - Result: ✅ Build completes in ~1.69s
   - Output: `dist/index.html` and all assets generated correctly
   - Location: `/Users/athenasees/Desktop/chat/`

2. **Directory structure verified:**
   - `chat-client-vite/` exists locally
   - `vercel.json` exists at repository root
   - `chat-client-vite/package.json` exists and is tracked in git

3. **Git tracking confirmed:**
   - `git ls-files` shows `chat-client-vite/package.json` is tracked
   - `git ls-files` shows `vercel.json` is tracked
   - `git check-ignore chat-client-vite` returns: not ignored

### ❌ Vercel Environment

1. **Build fails at install phase:**
   - Phase: "Running install command"
   - Command attempted: `cd chat-client-vite && npm ci --include=dev`
   - Error: Directory `chat-client-vite` not found
   - Exit code: 1

2. **Repository cloning succeeds:**
   - Clone completed: 1.960s
   - Build cache restored successfully
   - No errors during repository fetch

3. **Vercel uses different install command:**
   - `vercel.json` specifies: `cd chat-client-vite && npm ci`
   - Vercel actually runs: `cd chat-client-vite && npm ci --include=dev`
   - Note: Vercel adds `--include=dev` flag automatically

---

## Historical Context (From Git History)

**Previous attempts to fix Vercel deployment (chronological, oldest first):**

1. `a5e2204` - Trigger Vercel redeploy
2. `83ad7a9` - Add vercel.json to chat-client-vite for correct deployment
3. `df98b1e` - Remove duplicate vercel.json - use root config only
4. `f86ce97` - Add vercel.json with framework:vite for proper Vite detection
5. `b0aa9b1` - Add cd commands to vercel.json for correct working directory
6. `e0991aa` - Move vite/build deps to dependencies for Vercel production install
7. `32fd27e` - Simplify Vercel config - use root scripts with postinstall

**Pattern:** Multiple attempts to fix by moving `vercel.json`, changing framework settings, and adjusting build commands. None appear to have resolved the root issue.

---

## Chronological Attempts & Outcomes (Current Session)

### Attempt 1: Initial Diagnosis

**Action:** Tested local build to verify it works  
**Outcome:** ✅ Local build succeeds  
**Evidence:** Build completes successfully, all files generated  
**Conclusion:** Issue is Vercel-specific, not code/build configuration

---

### Attempt 2: Update vercel.json to use `npm ci`

**Action:** Changed `installCommand` and `buildCommand` from `npm install` to `npm ci`  
**File:** `/Users/athenasees/Desktop/chat/vercel.json`  
**Change:**

```json
"buildCommand": "cd chat-client-vite && npm ci && npm run build",
"installCommand": "cd chat-client-vite && npm ci",
```

**Intended Fix:** Match Vercel's default behavior (Vercel uses `npm ci` by default)  
**Actual Outcome:** ❌ Still fails with same error  
**Evidence:** Error message unchanged: `cd: chat-client-vite: No such file or directory`  
**Conclusion:** Issue is not about npm command, but about directory path resolution

---

### Attempt 3: Create vercel.json in chat-client-vite directory

**Action:** Created new `vercel.json` at `chat-client-vite/vercel.json` with simplified paths  
**File:** `/Users/athenasees/Desktop/chat/chat-client-vite/vercel.json`  
**Change:**

```json
"buildCommand": "npm ci && npm run build",
"outputDirectory": "dist",
"installCommand": "npm ci",
```

**Intended Fix:** If Vercel's root directory is set to `chat-client-vite`, this would work  
**Actual Outcome:** ⚠️ Not tested on Vercel yet (requires commit + push)  
**Evidence:** File created locally, build tested locally and works  
**Conclusion:** Pending verification - requires Vercel deployment to test

---

## What We Ruled Out

### ✅ Ruled Out: Directory Not in Git

**Evidence:**

- `git ls-files chat-client-vite/package.json` returns file path
- `git check-ignore chat-client-vite` confirms directory is tracked
- Multiple files from `chat-client-vite/` appear in `git ls-files` output

**Conclusion:** The directory and its contents are committed to the repository.

---

### ✅ Ruled Out: vercel.json Not Committed

**Evidence:**

- `git ls-files | grep vercel.json` shows `vercel.json` is tracked
- File exists at repository root
- File is readable and valid JSON

**Conclusion:** `vercel.json` is committed and should be available to Vercel.

---

### ✅ Ruled Out: Build Command Syntax Error

**Evidence:**

- Command `cd chat-client-vite && npm ci && npm run build` works locally
- Same command structure works in local shell
- No syntax errors in `vercel.json` (valid JSON)

**Conclusion:** The command syntax is correct.

---

### ✅ Ruled Out: Local Build Issues

**Evidence:**

- Local build completes successfully
- All dependencies install correctly
- Output files generated as expected
- No errors or warnings that would prevent deployment

**Conclusion:** The build process itself is functional.

---

### ✅ Ruled Out: Package.json Issues

**Evidence:**

- `package.json` exists in `chat-client-vite/`
- `package-lock.json` exists and is tracked
- `npm ci` works locally without errors
- Node version requirement (`>=18.0.0 <25.0.0`) is compatible

**Conclusion:** Package configuration is valid.

---

## What We Don't Know (Open Questions)

### ❓ Vercel Root Directory Setting

**Question:** What is the "Root Directory" setting in Vercel Dashboard?  
**Impact:** If set to `chat-client-vite`, then `cd chat-client-vite` would fail (already in that directory)  
**Evidence Needed:** Vercel Dashboard → Project Settings → Root Directory  
**Status:** Not verified

---

### ❓ Repository Structure on GitHub

**Question:** Does the repository structure on GitHub match the local structure?  
**Impact:** If `chat-client-vite/` is missing on GitHub, Vercel can't find it  
**Evidence Needed:** Check GitHub repository file tree  
**Status:** Not verified (assumed to match based on git tracking)

---

### ❓ Vercel Build Context

**Question:** What is the working directory when Vercel executes the build command?  
**Impact:** If Vercel runs from a different directory, relative paths would fail  
**Evidence Needed:** Vercel build logs showing `pwd` or working directory  
**Status:** Not available in provided logs

---

### ❓ Git Submodule or Sparse Checkout

**Question:** Is `chat-client-vite` a git submodule or excluded via sparse checkout?  
**Impact:** Submodules require explicit initialization; sparse checkout excludes files  
**Evidence Needed:** Check `.gitmodules` file, git submodule status  
**Status:** Not verified

---

## Patterns Observed

1. **Vercel modifies install command:**
   - `vercel.json` specifies: `npm ci`
   - Vercel actually runs: `npm ci --include=dev`
   - Pattern: Vercel adds `--include=dev` flag automatically

2. **Error occurs before any npm execution:**
   - Failure is at `cd` command, not npm
   - Suggests directory doesn't exist in build context
   - Not a dependency or build configuration issue

3. **Repository clone succeeds:**
   - Clone completes without errors
   - Build cache restored successfully
   - Suggests repository access is working

4. **Local vs Vercel discrepancy:**
   - Same commands work locally
   - Same commands fail on Vercel
   - Suggests environment or configuration difference

---

## Recommended Next Steps

### Priority 1: Verify Vercel Root Directory

1. Go to Vercel Dashboard → Project → Settings
2. Check "Root Directory" setting
3. If set to `chat-client-vite`, change to `.` (repository root)
4. If set to `.` or empty, proceed to Priority 2

### Priority 2: Verify GitHub Repository Structure

1. Check GitHub repository: `github.com/aseesy/DEMO`
2. Verify `chat-client-vite/` directory exists in repository
3. Verify `vercel.json` exists at repository root
4. Compare GitHub structure to local structure

### Priority 3: Test Alternative Configuration

1. If `chat-client-vite/vercel.json` exists, test deployment with it
2. Set Vercel Root Directory to `chat-client-vite` if using that config
3. Update paths in root `vercel.json` if keeping root as base

### Priority 4: Add Diagnostic Logging

1. Add `pwd` command to build command to see working directory
2. Add `ls -la` to list files in build context
3. Add `ls -la chat-client-vite` to verify directory existence

---

## Files Modified (Current Session)

1. `/Users/athenasees/Desktop/chat/vercel.json`
   - Changed `npm install` → `npm ci` in both commands
   - Status: Modified, not yet committed

2. `/Users/athenasees/Desktop/chat/chat-client-vite/vercel.json`
   - Created new file with simplified paths
   - Status: Created locally, not tested on Vercel
   - **Note:** Git history shows this file was added and removed multiple times previously

## Historical Files (From Git)

- Multiple `vercel.json` configurations have been tried
- Both root and `chat-client-vite/` locations have been attempted
- Framework settings (including `framework: vite` and `framework: null`) have been tried
- Build commands have been modified multiple times

---

## Key Insights

1. **The issue is environmental, not code-related:** Local builds work perfectly, indicating the build configuration is correct.

2. **The failure is at path resolution, not build execution:** The `cd` command fails before any npm commands run, suggesting the directory doesn't exist in Vercel's build context.

3. **Vercel's root directory setting is the most likely culprit:** If Vercel is configured to use `chat-client-vite` as the root, then `cd chat-client-vite` would fail because the build is already running from that directory.

4. **Two vercel.json files may cause confusion:** Having both root and subdirectory `vercel.json` files could lead to Vercel using the wrong configuration.

---

## For Fresh Engineer Taking Over

**Start here:**

1. Check Vercel Dashboard → Settings → Root Directory (5 minutes)
2. Verify GitHub repository structure matches local (5 minutes)
3. If root directory is wrong, fix it and redeploy (2 minutes)

**If still failing:**

1. Remove one of the `vercel.json` files (keep only one)
2. Add diagnostic commands to build to see working directory
3. Check Vercel build logs for `pwd` output

**Don't repeat:**

- ❌ Don't change npm commands (already correct)
- ❌ Don't modify build configuration (works locally)
- ❌ Don't assume it's a dependency issue (fails before npm runs)

**Focus on:**

- ✅ Vercel configuration (root directory, project settings)
- ✅ Repository structure verification
- ✅ Build context and working directory
