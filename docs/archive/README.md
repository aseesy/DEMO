# Archived Documentation

This directory contains archived documentation files that have been superseded or are no longer actively maintained.

## Structure

```
docs/archive/
├── README.md (this file)
├── CLEANUP_PLAN.md (cleanup rationale)
├── old-root-docs/ (duplicate/consolidated docs)
├── completed-reviews/ (completed audit/review docs)
└── implementation-history/ (phase/fix/implementation docs)
```

## Contents

### old-root-docs/

Root-level markdown files that were consolidated into authoritative docs:

- `SIGNUP_FLOW_SUMMARY.md` - **Superseded by**: `docs/auth-flow.md`
- `SIGNUP_FLOW_DOCUMENTATION.md` - **Superseded by**: `docs/auth-flow.md`

### completed-reviews/

Completed review and audit documentation:

- `DOCUMENTATION_AUDIT.md` - Documentation structure audit (completed 2025-01-07)
- `DOCUMENTATION_REVIEW.md` - Documentation review report (completed 2025-01-07)

### implementation-history/

Historical implementation documentation including:
- Phase completion reports (`PHASE_*.md`)
- Fix documentation (`*_FIX.md`)
- Analysis reports (`*_ANALYSIS.md`)
- Test results (`*_TEST_RESULTS*.md`)
- Implementation summaries (`*_SUMMARY.md`, `*_COMPLETE.md`)
- Status reports (`*_STATUS.md`)
- Migration documentation (`*_MIGRATION*.md`)

These files document the development process but are not active reference documentation.

## Why Archived?

These files are kept for historical reference but are no longer authoritative:

1. **Duplicates**: Information consolidated into single source of truth docs
2. **Completed Reviews**: Audit and review processes are complete
3. **Historical Reference**: Document completed work, not active guidance
4. **Implementation History**: Record of past phases/fixes/implementations

## Current Authoritative Docs

**Root Level:**
- `README.md` - Main project entry point
- `CLAUDE.md` - AI assistant instructions

**Global Truth (`docs/`):**
- `docs/architecture.md` - System architecture
- `docs/auth-flow.md` - Authentication lifecycle
- `docs/deployment.md` - Deployment guides
- `docs/security.md` - Security measures
- `docs/sdd-framework.md` - SDD framework

**Sub-Project:**
- `chat-client-vite/README.md` - Frontend setup
- `chat-server/README.md` - Backend setup & API
- `chat-server/docs/room-membership.md` - Membership rules
- `chat-server/docs/db-constraints.md` - Database constraints
- `marketing-site/README.md` - Marketing site setup

## Notes

- These files are archived, not deleted, to preserve historical context
- May contain useful information for understanding development decisions
- Not actively maintained but available for reference
- Search codebase for specific information rather than relying on archived docs

---

**Archive Date**: 2025-01-07
**Archive Reason**: Documentation cleanup and organization
