# AI Deployment Rules - READ THIS BEFORE DEPLOYING

⚠️ **This file is for AI assistants. Read this before ANY Vercel deployment.**

## Quick Reference

If user asks to deploy to Vercel:

1. **Check**: Are we deploying `chat-client-vite`?
2. **Validate**: Run `./scripts/validate-vercel-project.sh`
3. **Verify**: Must show `Project Name: chat-client-vite`
4. **Deploy**: Use `./scripts/deploy-chat-client-vite.sh`

If validation fails → **STOP** and report error.

## Full Rules

### When to Deploy

**ONLY deploy when:**
- User explicitly asks to deploy to Vercel
- Deployment is for `chat-client-vite` project
- All validation checks pass

**NEVER deploy:**
- Without user request
- To wrong project
- Without validation

### Required Validation

**BEFORE any Vercel deployment, AI MUST:**

```bash
# Step 1: Validate project
./scripts/validate-vercel-project.sh

# Expected output:
#   Project Name: chat-client-vite
#   Project ID: prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr
#   ✅ Project configuration is correct!
```

If validation fails → **ABORT deployment**

### Deployment Methods

**Method 1: Safe Script (RECOMMENDED)**
```bash
./scripts/deploy-chat-client-vite.sh
```
This includes:
- Automatic validation
- Directory checks
- Project verification
- Confirmation prompt

**Method 2: npm Script (with validation)**
```bash
cd chat-client-vite
npm run deploy
```
This runs validation automatically.

**Method 3: Manual (requires validation first)**
```bash
cd chat-client-vite
../scripts/validate-vercel-project.sh  # REQUIRED
vercel --prod --yes
```

### Error Handling

If validation shows wrong project:
1. **STOP** deployment
2. **Report** to user: "Wrong Vercel project linked"
3. **Fix** by running: `cd chat-client-vite && vercel link`
4. **Select**: `chat-client-vite` project
5. **Retry** validation
6. **Then** deploy

### Project Configuration

**Correct configuration:**
- Project Name: `chat-client-vite`
- Project ID: `prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
- Org ID: `team_HQ1x0PlLlVkC2xk3bQ8RXAcH`
- Directory: `chat-client-vite/`
- Config: `chat-client-vite/vercel.json`

**Check configuration:**
```bash
cat chat-client-vite/.vercel/project.json
```

### Common Mistakes to Avoid

❌ **DON'T:**
- Deploy from project root
- Deploy to `marketing-site` project
- Skip validation
- Deploy without checking project name
- Use `vercel` command from wrong directory

✅ **DO:**
- Always run validation first
- Deploy from `chat-client-vite/` directory
- Use safe deployment scripts
- Verify project name before deploying
- Report errors to user

## Quick Commands

```bash
# Validate project (REQUIRED before deployment)
./scripts/validate-vercel-project.sh

# Safe deployment (RECOMMENDED)
./scripts/deploy-chat-client-vite.sh

# Check current project
cat chat-client-vite/.vercel/project.json
```

## Reference Files

- `.cursorrules` - Cursor AI rules (includes deployment section)
- `CLAUDE.md` - Claude AI instructions (includes deployment section)
- `DEPLOYMENT.md` - Complete deployment guide for humans
- `chat-client-vite/VERCEL_PROJECT_LOCK.md` - Project lock reference
- `scripts/validate-vercel-project.sh` - Validation script
- `scripts/deploy-chat-client-vite.sh` - Safe deployment script

