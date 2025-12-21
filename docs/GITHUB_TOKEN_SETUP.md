# GitHub Token Setup for MCP

The GitHub MCP server requires a GitHub Personal Access Token to be set as an environment variable.

## Step 1: Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name: `LiaiZen MCP Access`
4. Select these scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:org` (Read org membership - if using org repos)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)

## Step 2: Add Token to Environment Variables

### Option A: Shell Profile (Recommended - Persistent)

**For zsh (macOS default):**

```bash
# Add to ~/.zshrc
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.zshrc
source ~/.zshrc
```

**For bash:**

```bash
# Add to ~/.bashrc or ~/.bash_profile
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc
source ~/.bashrc
```

**To verify:**

```bash
echo $GITHUB_TOKEN
```

### Option B: Cursor-Specific Environment (Alternative)

If Cursor doesn't pick up your shell environment variables, you can set it directly in Cursor:

1. Open Cursor Settings
2. Search for "Environment Variables" or "MCP Environment"
3. Add: `GITHUB_TOKEN` = `your_token_here`

### Option C: Project-Specific .env File (For Development)

Create a `.env` file in the project root:

```bash
# .env (add to .gitignore if not already there)
GITHUB_TOKEN=your_token_here
```

Then load it before starting Cursor:

```bash
export $(cat .env | xargs)
cursor .
```

## Step 3: Verify Token Works

After setting the token, restart Cursor and test:

**Test in Cursor:**

```
Show me the last 5 commits in this repository
```

Or test in terminal:

```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

## Security Best Practices

1. **Never commit tokens to git**
   - `.env` files should be in `.gitignore`
   - Check `.gitignore` includes `.env`

2. **Use minimal scopes**
   - Only grant necessary permissions
   - For read-only access, use `public_repo` instead of `repo`

3. **Rotate tokens regularly**
   - Set expiration dates
   - Regenerate if compromised

4. **Use different tokens for different purposes**
   - Development vs Production
   - Different projects

## Troubleshooting

**Token not working?**

1. Verify token is set: `echo $GITHUB_TOKEN`
2. Check token hasn't expired
3. Verify token has correct scopes
4. Restart Cursor completely
5. Check Cursor's MCP logs for errors

**Cursor can't find environment variable?**

- Try Option B (Cursor-specific environment)
- Or set it directly in the MCP config (less secure):
  ```json
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_actual_token_here"
  }
  ```
  ⚠️ **Warning**: This exposes the token in the config file!

## Quick Setup Script

Run this to add the token to your shell profile:

```bash
# Prompt for token (won't echo to screen)
read -s -p "Enter your GitHub token: " GITHUB_TOKEN
echo ""

# Add to .zshrc
echo "export GITHUB_TOKEN=$GITHUB_TOKEN" >> ~/.zshrc

# Reload shell
source ~/.zshrc

echo "✅ GitHub token added to ~/.zshrc"
echo "Restart Cursor for changes to take effect"
```
