# Git Cleanup Strategy

**Date**: 2025-01-28  
**Status**: 558 files changed (mostly deletions)

---

## Current State

**Git Status**: Large cleanup in progress

- **Deleted files**: ~500+ files
- **Modified files**: ~50+ files
- **Untracked files**: Many new files

**Categories of Changes**:

1. **Deleted Framework Code**:
   - `.codebase-context-mcp/` - Old MCP integration
   - `.design-tokens-mcp/` - Old design tokens MCP
   - `.docs/` - Old documentation structure
   - `docs-archive/` - Archived documentation

2. **Deleted Specs/Plans**:
   - `specs/` - Old specification files
   - Various plan documents

3. **Deleted Python Code**:
   - `src/sdd/` - Old Python-based SDD framework
   - `figma-plugin/` - Figma plugin code

4. **Modified Files**:
   - Configuration files (`.gitignore`, `.prettierrc.json`, etc.)
   - Package files (`package.json`, `package-lock.json`)
   - Source code updates

5. **New/Untracked Files**:
   - New scripts and tools
   - Updated documentation
   - New test files

---

## Recommended Strategy

### Option 1: Single Cleanup Commit (Recommended)

**Best for**: Clean, atomic cleanup that's easy to review

```bash
# Stage all deletions and modifications
git add -u

# Stage new files separately (review first)
git add <specific-new-files>

# Create single cleanup commit
git commit -m "chore: Clean up old framework code and documentation

- Remove old MCP integrations (.codebase-context-mcp, .design-tokens-mcp)
- Remove archived documentation (docs-archive/, .docs/)
- Remove old Python SDD framework (src/sdd/)
- Remove old specs and plans
- Update configuration files
- Add new backup and monitoring scripts"
```

**Pros**:

- Single, clear commit message
- Easy to review
- Easy to revert if needed

**Cons**:

- Large commit (may be harder to review in detail)

---

### Option 2: Categorized Commits

**Best for**: Better organization and easier partial reverts

```bash
# 1. Remove old framework code
git add -u .codebase-context-mcp/ .design-tokens-mcp/ src/sdd/ figma-plugin/
git commit -m "chore: Remove old framework code and integrations"

# 2. Remove archived documentation
git add -u docs-archive/ .docs/
git commit -m "chore: Remove archived documentation"

# 3. Remove old specs
git add -u specs/
git commit -m "chore: Remove old specification files"

# 4. Update configuration
git add -u .gitignore .prettierrc.json package.json package-lock.json
git commit -m "chore: Update configuration files"

# 5. Add new scripts
git add chat-server/scripts/backup-database.js chat-server/scripts/monitor-database.js
git commit -m "feat: Add database backup and monitoring scripts"
```

**Pros**:

- Better organization
- Easier to review specific changes
- Can revert specific categories

**Cons**:

- More commits
- More work to create

---

### Option 3: Interactive Staging

**Best for**: Careful review of each change

```bash
# Review changes interactively
git add -p

# Or review by file
git status
git add <specific-files>
git commit -m "chore: Clean up [category]"
```

**Pros**:

- Maximum control
- Can review each change

**Cons**:

- Time-consuming for 558 files
- May miss related changes

---

## Recommended Approach

**Use Option 1 (Single Cleanup Commit)** with the following steps:

### Step 1: Review Changes

```bash
# See summary of changes
git status --short | head -50

# Review specific deletions
git diff --stat

# Review specific file changes
git diff <file>
```

### Step 2: Stage All Deletions and Modifications

```bash
# Stage all tracked file changes (deletions + modifications)
git add -u
```

### Step 3: Review and Stage New Files

```bash
# See untracked files
git status

# Review new files before staging
# Then stage specific new files
git add chat-server/scripts/backup-database.js
git add chat-server/scripts/monitor-database.js
git add chat-server/scripts/verify-backup.js
git add docs/MORNING_REVIEW_2025-01-28.md
# ... etc
```

### Step 4: Create Commit

```bash
git commit -m "chore: Major cleanup - remove old framework code and add monitoring

- Remove old MCP integrations (.codebase-context-mcp, .design-tokens-mcp)
- Remove archived documentation (docs-archive/, .docs/)
- Remove old Python SDD framework (src/sdd/)
- Remove old specs and plans (specs/)
- Remove Figma plugin code
- Update configuration files (.gitignore, .prettierrc.json, package.json)
- Add database backup and monitoring scripts
- Update documentation (PRODUCTION_READINESS.md, TEST_FAILURES_REVIEW.md)
- Add morning review documentation"
```

### Step 5: Verify Before Pushing

```bash
# Review the commit
git show --stat

# If satisfied, push
git push origin main
```

---

## Files to Keep (Do Not Delete)

These files should be reviewed carefully before deletion:

- ✅ `chat-server/scripts/` - All scripts (including new backup scripts)
- ✅ `docs/` - Current documentation
- ✅ `chat-server/docs/` - Server documentation
- ✅ Configuration files (`.gitignore`, `package.json`, etc.)
- ✅ Source code files (unless explicitly old/unused)

---

## Files Safe to Delete

These categories are safe to delete:

- ✅ `.codebase-context-mcp/` - Old MCP integration
- ✅ `.design-tokens-mcp/` - Old design tokens
- ✅ `docs-archive/` - Archived documentation
- ✅ `.docs/` - Old documentation structure (if replaced)
- ✅ `src/sdd/` - Old Python framework
- ✅ `figma-plugin/` - Old Figma plugin
- ✅ `specs/` - Old specification files (if no longer needed)
- ✅ Old test files (if replaced)

---

## Verification Checklist

Before committing:

- [ ] Review `git status` summary
- [ ] Verify no important files are being deleted
- [ ] Check that new files are properly staged
- [ ] Review commit message
- [ ] Test that application still works after cleanup
- [ ] Verify tests still pass

---

## Rollback Plan

If something goes wrong:

```bash
# Undo the commit (keeps changes staged)
git reset --soft HEAD~1

# Or completely undo (unstage changes)
git reset HEAD~1

# Or restore deleted files
git checkout HEAD -- <deleted-file>
```

---

## Next Steps After Cleanup

1. **Update .gitignore** if needed for new structure
2. **Update README.md** if documentation structure changed
3. **Verify CI/CD** still works after cleanup
4. **Update deployment scripts** if paths changed

---

_Last Updated: 2025-01-28_
