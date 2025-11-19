# MCP Server Keys & Credentials Setup

## Overview

Your MCP servers are already configured in the repository, but need API keys to function. This guide will help you set up all required credentials.

## Current Status ✅

- ✅ MCP configuration files exist
- ✅ Setup scripts ready
- ✅ Documentation complete
- ⚠️ **Missing**: API keys and environment variables

## Required Keys & Credentials

### 1. GitHub Personal Access Token (for GitHub MCP)

**What it does**: Allows MCP to access GitHub repositories, issues, commits, and PRs

**How to get it**:
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Token name: `LiaiZen MCP Access`
4. Required scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org membership - if using org repos)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

**Where to set it**:
```bash
# Option A: Add to shell profile (recommended)
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc

# Option B: Test temporarily
export GITHUB_TOKEN=ghp_your_token_here

# Verify it's set
echo $GITHUB_TOKEN
```

### 2. OpenAI API Key (for AI Moderation)

**What it does**: Powers the AI message mediation feature in chat

**How to get it**:
1. Go to: https://platform.openai.com/api-keys
2. Create account if needed
3. Click **"Create new secret key"**
4. Name it: `LiaiZen Chat Moderation`
5. **Copy the key** (starts with `sk-`)

**Where to set it**:
```bash
# Edit the server .env file
nano /Users/athenasees/Desktop/chat/chat-server/.env

# Update this line:
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Gmail App Password (for Email Notifications)

**What it does**: Sends email notifications (room invitations, etc.)

**How to get it**:
1. Enable 2FA on your Gmail account first
2. Go to: https://myaccount.google.com/apppasswords
3. App name: `LiaiZen Server`
4. Click **"Create"**
5. **Copy the 16-character password**

**Where to set it**:
```bash
# Edit the server .env file
nano /Users/athenasees/Desktop/chat/chat-server/.env

# Update these lines:
GMAIL_USER=info@liaizen.com  # Or your actual Gmail
GMAIL_APP_PASSWORD=your-16-character-password-here
EMAIL_FROM=info@liaizen.com
```

### 4. JWT Secret (for Authentication)

**What it does**: Secures user authentication tokens

**How to generate**:
```bash
# Generate a secure random string
openssl rand -base64 48
```

**Where to set it**:
```bash
# Edit the server .env file
nano /Users/athenasees/Desktop/chat/chat-server/.env

# Update this line:
JWT_SECRET=your-generated-secret-here-minimum-32-chars
```

## Quick Setup Steps

### Step 1: Set GitHub Token
```bash
# Generate token at: https://github.com/settings/tokens
# Then add to your shell:
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Copy and Configure Server Environment
```bash
# Copy the example file
cp /Users/athenasees/Desktop/chat/chat-server/.env.example /Users/athenasees/Desktop/chat/chat-server/.env

# Edit with your keys
nano /Users/athenasees/Desktop/chat/chat-server/.env
```

### Step 3: Add Required Keys to .env
Update the following in `/Users/athenasees/Desktop/chat/chat-server/.env`:

```bash
# AI Moderation
OPENAI_API_KEY=sk-your-openai-key-here

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-password
EMAIL_FROM=your-email@gmail.com

# Security
JWT_SECRET=your-secure-random-string-here
```

### Step 4: Configure MCP in Claude Code
```bash
# Run the setup script
./scripts/setup-mcp.sh

# Or manually update:
# ~/.config/Claude/claude_desktop_config.json
```

### Step 5: Restart Everything
```bash
# Restart Claude Code completely
# Then test MCP servers with:
# "Query the database for all users"
# "Show me recent GitHub commits"
```

## Verification Checklist

### Environment Variables
```bash
# Check GitHub token
echo $GITHUB_TOKEN  # Should show: ghp_...

# Check server .env exists
ls -la /Users/athenasees/Desktop/chat/chat-server/.env

# Verify server .env has all keys
cat /Users/athenasees/Desktop/chat/chat-server/.env | grep -v '^#' | grep '='
```

### MCP Configuration
```bash
# Check MCP config exists
ls -la ~/.config/Claude/claude_desktop_config.json

# Or for this project
ls -la /Users/athenasees/Desktop/chat/.mcp-config.json
```

### Test MCP Servers
After setting everything up, test in Claude Code:

**SQLite MCP:**
```
Show me all users in the chat database
```

**GitHub MCP:**
```
Show me the last 5 commits in this repo
```

**Filesystem MCP:**
```
Find all files containing "socket.io"
```

## Current Server .env Status

Your server already has a `.env` file at:
```
/Users/athenasees/Desktop/chat/chat-server/.env
```

You need to update it with the actual API keys listed above.

## Security Best Practices

### DO ✅
- Store tokens in environment variables
- Add `.env` to `.gitignore` (already done)
- Use different tokens for development vs production
- Rotate tokens every 90 days
- Use minimal required permissions

### DON'T ❌
- Commit tokens to git
- Share tokens in screenshots or logs
- Use production tokens in development
- Store tokens in code files
- Use overly permissive token scopes

## Troubleshooting

### GitHub MCP Not Working
```bash
# 1. Check token is set
echo $GITHUB_TOKEN

# 2. Test token works
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 3. Verify in MCP config
cat ~/.config/Claude/claude_desktop_config.json | grep -A5 github
```

### Server Not Starting
```bash
# 1. Check .env file exists
ls -la chat-server/.env

# 2. Verify all required keys are set
cat chat-server/.env | grep -E 'OPENAI|GMAIL|JWT'

# 3. Check for syntax errors
node -e "require('dotenv').config({path:'./chat-server/.env'}); console.log(process.env.OPENAI_API_KEY ? 'OpenAI key loaded' : 'OpenAI key missing')"
```

### Email Not Sending
```bash
# 1. Verify Gmail app password is correct (16 chars, no spaces)
# 2. Ensure 2FA is enabled on Gmail
# 3. Check Gmail user matches EMAIL_FROM
# 4. Test SMTP connection manually
```

## Quick Commands Reference

```bash
# Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# Edit server environment
nano chat-server/.env

# Generate JWT secret
openssl rand -base64 48

# Test server with environment
cd chat-server && node server.js

# Check what environment variables are loaded
cd chat-server && node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.includes('GITHUB') || k.includes('OPENAI') || k.includes('GMAIL')))"
```

## Summary: What You Need

| Service | Key/Token | Where to Get | Where to Set |
|---------|-----------|--------------|--------------|
| GitHub MCP | Personal Access Token | https://github.com/settings/tokens | `~/.zshrc` as `GITHUB_TOKEN` |
| AI Moderation | OpenAI API Key | https://platform.openai.com/api-keys | `chat-server/.env` as `OPENAI_API_KEY` |
| Email | Gmail App Password | https://myaccount.google.com/apppasswords | `chat-server/.env` as `GMAIL_APP_PASSWORD` |
| Auth | JWT Secret | Generate with `openssl rand -base64 48` | `chat-server/.env` as `JWT_SECRET` |

## Next Steps

1. ✅ Get GitHub token → Add to `~/.zshrc`
2. ✅ Get OpenAI API key → Add to `chat-server/.env`
3. ✅ Get Gmail app password → Add to `chat-server/.env`
4. ✅ Generate JWT secret → Add to `chat-server/.env`
5. ✅ Run setup script: `./scripts/setup-mcp.sh`
6. ✅ Restart Claude Code
7. ✅ Test MCP servers

---

*Need help? See the detailed guides:*
- **GitHub Token**: `docs/GITHUB_TOKEN_SETUP.md`
- **MCP Setup**: `docs/MCP_SETUP.md`
- **Usage Examples**: `docs/MCP_USAGE_EXAMPLES.md`
