# VERCEL CONFIGURATION - SEALED FILE

⚠️ **CRITICAL: DO NOT MODIFY `vercel.json` WITHOUT APPROVAL**

## Status: SEALED - Production Configuration

The `vercel.json` file at the repository root is **SEALED** and should not be modified without explicit approval and thorough testing.

## Why This File is Sealed

This configuration has been standardized after extensive troubleshooting:

1. **Monorepo Structure**: Works correctly with npm workspaces
2. **Build Process**: Properly handles `npm ci` at root and build in subdirectory
3. **Root Directory**: Configured for Root Directory = `.` (repository root)
4. **Historical Issues**: Multiple previous attempts caused build failures
5. **Production Stability**: Current configuration is proven to work

## Current Configuration

**Location:** `/vercel.json` (repository root)

**Key Settings:**

- Root Directory: `.` (repository root) - **MUST match Vercel Dashboard setting**
- Build Command: `cd chat-client-vite && npm install && npm run build`
- Output Directory: `chat-client-vite/dist`
- Install Command: `cd chat-client-vite && npm install`

## Rules for AI and Developers

### ❌ DO NOT:

1. Move `vercel.json` to `chat-client-vite/` directory
2. Remove `cd chat-client-vite` from build commands
3. Change output directory path
4. Modify Root Directory approach without updating Vercel Dashboard
5. Add conditional logic that might break in CI
6. Change install/build commands without testing

### ✅ CAN:

1. Update cache headers (if needed for performance)
2. Add new rewrite rules (if needed for routing)
3. Update framework detection (if Vite changes)
4. Modify non-critical settings after approval

## Approval Process

If you MUST modify this file:

1. **Document the reason** - Why is the change needed?
2. **Test locally** - Verify build works with `vercel build`
3. **Test in preview** - Deploy to Vercel preview environment
4. **Update documentation** - Update this file and `VERCEL_FINAL_SOLUTION.md`
5. **Coordinate with team** - Ensure everyone knows about the change

## Vercel Dashboard Settings

**CRITICAL**: The Vercel Dashboard Root Directory setting MUST match this configuration:

- **Root Directory**: `.` (repository root) or empty
- **Project**: `chat-client-vite`
- **Framework**: None (custom)

If Root Directory is changed in Dashboard, `vercel.json` must be updated accordingly.

## Related Documentation

- `docs/deployment/VERCEL_FINAL_SOLUTION.md` - Full solution explanation
- `docs/deployment/VERCEL_GITHUB_INTEGRATION_FIX.md` - GitHub integration guide
- `docs/deployment/VERCEL_BUILD_INDEX_HTML_FIX.md` - Build error troubleshooting

## History

- **2026-01-08**: Sealed after standardizing on root `vercel.json` approach
- **Previous**: Multiple attempts with `chat-client-vite/vercel.json` caused build failures
- **Working Version**: Root `vercel.json` with `cd chat-client-vite` commands

---

**Last Updated**: 2026-01-08  
**Status**: Production - Do Not Modify
