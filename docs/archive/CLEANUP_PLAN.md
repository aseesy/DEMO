# Markdown Cleanup Plan

**Date**: 2025-01-07
**Purpose**: Clean up root-level markdown files and organize documentation

## Cleanup Categories

### 1. Duplicate/Consolidated Docs → `old-root-docs/`
- `SIGNUP_FLOW_SUMMARY.md` → Superseded by `docs/auth-flow.md`
- `SIGNUP_FLOW_DOCUMENTATION.md` → Superseded by `docs/auth-flow.md`

### 2. Completed Reviews → `completed-reviews/`
- `DOCUMENTATION_AUDIT.md` → Audit complete
- `DOCUMENTATION_REVIEW.md` → Review complete

### 3. Implementation History → `implementation-history/`
- Files documenting completed phases/fixes/implementations
- These are historical records, not active documentation

### 4. Keep at Root
- `README.md` - Main entry point
- `CLAUDE.md` - AI assistant instructions
- `COMMANDS.md` - Useful commands reference
- Resume files (optional - for easy access)

## Rationale

**Archive (don't delete):**
- Historical value for understanding development process
- May contain useful context for future debugging
- Preserves knowledge of completed work

**Keep at Root:**
- Active reference documents
- Entry points for new developers
- Frequently accessed files

