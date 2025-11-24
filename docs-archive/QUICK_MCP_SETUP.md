# Quick MCP Setup - 5 Minutes

## TL;DR - Get MCP Working Now

You're **90% done**! Just need one thing: GitHub token.

## 3-Step Setup

### Step 1: Get GitHub Token (2 min)
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `LiaiZen MCP`
4. Scopes: Check `repo` and `read:org`
5. Click **"Generate"**
6. **COPY THE TOKEN** (starts with `ghp_`)

### Step 2: Add to Shell (1 min)
```bash
# Paste your token here (replace ghp_... with your actual token)
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc

# Verify it worked
echo $GITHUB_TOKEN
```

### Step 3: Restart Claude Code (1 min)
- Completely quit Claude Code
- Reopen it
- MCP servers will now be active!

## Test It Works (1 min)

Ask Claude Code:
```
"Show me all users in the database"
```

If it works, you'll see database results!

## What's Already Done ✅

- ✅ OpenAI API key (for AI moderation)
- ✅ Gmail credentials (for emails)
- ✅ JWT secret (for auth)
- ✅ All MCP config files
- ✅ All MCP documentation
- ✅ Database is ready

## What You Just Need ⚠️

- ⚠️ GitHub token → Takes 2 minutes
- ⚠️ Restart Claude Code → Takes 1 minute

## Available MCP Servers

Once done, you'll have:
- 🗄️ **SQLite MCP** - Query your chat database
- 🐙 **GitHub MCP** - View commits, issues, PRs
- 📁 **Filesystem MCP** - Advanced file operations
- 🌐 **Fetch MCP** - Test APIs
- 🧠 **Memory MCP** - Persistent context

## More Info

- **Full guide**: `MCP_KEYS_SETUP.md`
- **Status report**: `MCP_STATUS.md`
- **Quick start**: `README_MCP.md`
- **GitHub help**: `docs/GITHUB_TOKEN_SETUP.md`

---

**Ready? Do Step 1 now →** https://github.com/settings/tokens
