# Railway Environment Variables Guide

## Overview

Railway automatically provides some environment variables (like `DATABASE_URL` when PostgreSQL is connected), but you need to manually set others for production deployment.

## Required Variables

### Critical (Must Have)

These are required for the server to start:

1. **`DATABASE_URL`** ✅ Auto-provided
   - Automatically injected by Railway when PostgreSQL addon is connected
   - Format: `postgresql://user:password@host:port/database`
   - **Action**: None needed - Railway handles this

2. **`JWT_SECRET`** ❌ Must set manually
   - Secret key for JWT token signing
   - Must be at least 32 characters
   - **Example**: `your-super-secret-jwt-key-min-32-chars`
   - **Set with**: `railway variables set JWT_SECRET='your-secret-key'`

3. **`NODE_ENV`** ❌ Must set manually
   - Should be `production` for Railway
   - **Set with**: `railway variables set NODE_ENV=production`

4. **`PORT`** ✅ Auto-provided
   - Railway automatically assigns a port
   - Can override if needed: `railway variables set PORT=3000`
   - **Action**: Usually not needed

5. **`FRONTEND_URL`** ❌ Must set manually
   - Comma-separated list of allowed frontend URLs for CORS
   - **Example**: `https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app`
   - **Set with**: `railway variables set FRONTEND_URL='https://coparentliaizen.com,https://www.coparentliaizen.com'`

## Optional Variables

### Application Configuration

- `APP_NAME` - Application name (default: LiaiZen)
- `APP_URL` - Application URL (e.g., https://coparentliaizen.com)

### Email Configuration

- `EMAIL_SERVICE` - Email service provider (default: gmail)
- `GMAIL_USER` - Gmail address for sending emails
- `GMAIL_APP_PASSWORD` - Gmail app password (not regular password)
- `EMAIL_FROM` - Email sender address

### AI/ML Services

- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI features)
- `ANTHROPIC_API_KEY` - Anthropic API key (if using Anthropic features)

### Neo4j Database

- `NEO4J_URI` - Neo4j database URI
- `NEO4J_USER` - Neo4j username (usually `neo4j`)
- `NEO4J_PASSWORD` - Neo4j password
- `NEO4J_DATABASE` - Neo4j database name (default: `neo4j`)

### OAuth

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OAUTH_CLIENT_ID` - OAuth client ID (may be same as GOOGLE_CLIENT_ID)
- `OAUTH_CLIENT_SECRET` - OAuth client secret (may be same as GOOGLE_CLIENT_SECRET)

### Other

- `GITHUB_TOKEN` - GitHub token for API access
- `MCP_SERVICE_TOKEN` - MCP service token

## Validation

### Quick Check

```bash
npm run validate:railway
```

### Manual Check

```bash
# List all variables
railway variables

# Check specific variable
railway variables | grep JWT_SECRET
```

## Setting Variables

### Using Railway CLI

```bash
# Single variable
railway variables set JWT_SECRET='your-secret-key'

# Multiple variables
railway variables \
  --set "NODE_ENV=production" \
  --set "JWT_SECRET=your-secret" \
  --set "FRONTEND_URL=https://coparentliaizen.com"
```

### Using Setup Script

```bash
# Edit scripts/set-railway-vars.sh with your values
./scripts/set-railway-vars.sh
```

### Using Railway Dashboard

1. Go to your Railway project
2. Select your service
3. Go to **Variables** tab
4. Click **"New Variable"**
5. Enter key and value
6. Click **"Add"**

## Current Status

To check what's currently set in Railway:

```bash
npm run validate:railway
```

This will show:

- ✅ Required variables that are set
- ❌ Required variables that are missing
- ✓ Optional variables that are set
- ○ Optional variables that are not set

## Troubleshooting

### Variable Not Found

If a variable is missing:

1. Check Railway dashboard → Variables tab
2. Verify variable name (case-sensitive)
3. Check if it's in the correct service/environment
4. Railway has separate variables for different environments (production, preview, etc.)

### DATABASE_URL Missing

If `DATABASE_URL` is missing:

1. Check if PostgreSQL addon is connected
2. Go to Railway dashboard → Your service → **Variables** → **Connected Variables**
3. Should see `DATABASE_URL` automatically listed
4. If not, reconnect PostgreSQL addon

### Variables Not Taking Effect

After setting variables:

1. Railway automatically redeploys
2. Check deployment logs: `railway logs`
3. Verify variables are loaded: `railway variables`
4. Restart service if needed: Railway dashboard → Service → **Restart**

## Best Practices

1. **Use Secrets for Sensitive Data**
   - Railway automatically treats certain variables as secrets
   - They won't appear in logs or be exposed

2. **Separate Environments**
   - Use different Railway projects for staging/production
   - Or use Railway's environment feature

3. **Document Variables**
   - Keep a list of required variables in `docs/RAILWAY_ENVIRONMENT_VARIABLES.md`
   - Update `scripts/set-railway-vars.sh` when adding new variables

4. **Validate Before Deploying**
   - Always run `npm run validate:railway` before deploying
   - Fix missing required variables first

## Related Scripts

- `scripts/validate-railway-env.js` - Validate Railway variables
- `scripts/set-railway-vars.sh` - Set all Railway variables
- `scripts/setup-neo4j-railway.sh` - Set Neo4j variables
- `scripts/fix-railway-deployment.sh` - Fix deployment issues
