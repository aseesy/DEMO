# Railway Workspace Token Setup

## Problem

Railway CLI shows "Available options can not be empty" when trying to link a project.

## Solution: Use Workspace Token

### Step 1: Create Workspace Token

1. Go to: https://railway.app/account/tokens
2. Click **"New Token"**
3. Name it: `LiaiZen CLI Access`
4. **Copy the token immediately** (you won't see it again!)

### Step 2: Set Token as Environment Variable

**For zsh (macOS default):**

```bash
# Add to ~/.zshrc
echo 'export RAILWAY_TOKEN=your_token_here' >> ~/.zshrc
source ~/.zshrc
```

**Or set it for current session:**

```bash
export RAILWAY_TOKEN=your_token_here
```

### Step 3: Link Project

Once the token is set, try linking again:

```bash
railway link
```

Or link directly to a specific project:

```bash
# List your projects
railway projects

# Link to specific project
railway link -p <project-id>
```

### Step 4: Verify Connection

```bash
railway status
railway service list
```

## Alternative: Use Railway Dashboard

If CLI continues to have issues, you can manage everything through the Railway Dashboard:

1. Go to: https://railway.app/dashboard
2. Select your project
3. Use the web interface to:
   - View logs
   - Set environment variables
   - Deploy services
   - Monitor usage

## Troubleshooting

**If token doesn't work:**

- Make sure token is copied correctly (no extra spaces)
- Check token hasn't expired
- Try creating a new token

**If still can't link:**

- Try logging out and back in: `railway logout` then `railway login`
- Check Railway status: https://status.railway.app
