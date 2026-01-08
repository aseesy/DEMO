# Deployment Guide

⚠️ **CRITICAL: READ THIS BEFORE DEPLOYING**

## VERCEL DEPLOYMENT - CHAT CLIENT VITE ONLY

**ONLY deploy the main app from `chat-client-vite/` directory to Vercel project: `chat-client-vite`**

### Correct Project
- **Project Name**: `chat-client-vite`
- **Project ID**: `prj_3Iz716ASKvPuwjAcu6oGzs8LUhRr`
- **Vercel URL**: `chat-client-vite-a3vgwwysr-aseesys-projects.vercel.app`
- **Directory**: `chat-client-vite/`

### NEVER Deploy To
❌ **DO NOT deploy the main app to:**
- `marketing-site` project (that's for the marketing site only)
- Root directory deployments
- Any other Vercel project

## Safe Deployment Methods

### Method 1: Using the Safe Deploy Script (RECOMMENDED)
```bash
# From project root
./scripts/deploy-chat-client-vite.sh
```

This script:
1. ✅ Validates the correct project is linked
2. ✅ Ensures we're in the correct directory
3. ✅ Prevents deployment to wrong projects
4. ✅ Requires confirmation before deploying

### Method 2: Using npm script (from chat-client-vite/)
```bash
cd chat-client-vite
npm run deploy
```

This includes automatic project validation.

### Method 3: Manual Vercel CLI (USE WITH CAUTION)
```bash
# ⚠️ VERIFY YOU'RE IN THE CORRECT DIRECTORY FIRST:
cd chat-client-vite

# Verify project:
cat .vercel/project.json
# Must show: "projectName": "chat-client-vite"

# Then deploy:
vercel --prod --yes
```

## Validation Before Deployment

**ALWAYS run this before deploying:**
```bash
./scripts/validate-vercel-project.sh
```

This checks:
- ✅ Correct directory structure
- ✅ Correct project name
- ✅ Correct project ID
- ✅ Correct organization ID

## What Happens If You Deploy Wrong?

If you accidentally deploy from the wrong directory or to the wrong project:

1. **Stop immediately** - Cancel any ongoing deployment
2. **Check Vercel Dashboard** - See which project received the deployment
3. **Redeploy correctly** - Use one of the safe methods above

## Troubleshooting

### "Wrong project ID" error
```bash
cd chat-client-vite
rm -rf .vercel
vercel link
# Select: chat-client-vite
```

### "Project not linked" error
```bash
cd chat-client-vite
vercel link
# Select: chat-client-vite
```

### Accidental deployment to wrong project
1. Go to Vercel Dashboard
2. Find the wrong project
3. Delete the deployment
4. Use safe deployment method to deploy to correct project

## Project Structure

```
chat/
├── chat-client-vite/       ← DEPLOY THIS to Vercel project "chat-client-vite"
│   ├── .vercel/
│   │   └── project.json   ← Must have projectName: "chat-client-vite"
│   └── vercel.json
├── marketing-site/         ← Separate project for marketing site only
│   └── .vercel/
└── scripts/
    ├── deploy-chat-client-vite.sh  ← SAFE deployment script
    └── validate-vercel-project.sh  ← Validation script
```

## Emergency Contacts

If you accidentally deploy to the wrong project:
1. Check Vercel Dashboard immediately
2. Delete the wrong deployment
3. Redeploy using safe method
4. Document what happened for future prevention

