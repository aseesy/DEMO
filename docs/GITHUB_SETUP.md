# 🔗 GitHub Setup Guide

Your project is now initialized with Git! Follow these steps to connect it to GitHub.

## ✅ What's Already Done

- ✅ Git repository initialized
- ✅ `.gitignore` created (excludes sensitive files like `.env`, `chat.db`, `node_modules`)
- ✅ Initial commit created with all your code

## 📋 Step-by-Step: Connect to GitHub

### Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: Choose a name (e.g., `coparentliaizen`, `liaizen-chat`, or `chat-app`)
3. **Description**: "Multi-user chat application with co-parent features"
4. **Visibility**:
   - Choose **Private** (recommended for production apps)
   - Or **Public** (if you want it open source)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Step 2: Connect Your Local Repository

After creating the GitHub repo, GitHub will show you commands. Use these:

**If your GitHub username is different, replace `YOUR_USERNAME` and `YOUR_REPO_NAME` below:**

```bash
# Add GitHub as remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Or if you prefer SSH (if you have SSH keys set up):
# git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

### Step 3: Verify Connection

1. Go to your GitHub repository page
2. You should see all your files there
3. Check that sensitive files are NOT visible:
   - ✅ No `chat.db` file
   - ✅ No `.env` files
   - ✅ No `node_modules/` folders

## 🔐 Security Checklist

Before pushing, verify these files are **NOT** in your repository:

- ❌ `chat-server/.env` (should be ignored)
- ❌ `chat-server/chat.db` (should be ignored)
- ❌ `chat-server/server.log` (should be ignored)
- ❌ `node_modules/` (should be ignored)

**To check what will be pushed:**

```bash
git ls-files | grep -E "(\.env|chat\.db|node_modules)"
```

If this command returns nothing, you're good! ✅

## 🚀 Quick Commands Reference

```bash
# Check status
git status

# See what files are tracked
git ls-files

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

## 📝 Future Workflow

After initial setup, your workflow will be:

1. **Make changes** to your code
2. **Stage changes**: `git add .`
3. **Commit**: `git commit -m "Description of changes"`
4. **Push**: `git push`
5. **Railway auto-deploys** (if connected)

## 🆘 Troubleshooting

### "Repository not found" error

**Problem:** Can't push to GitHub

**Solutions:**

- Verify the repository URL is correct
- Check you have access to the repository
- Try using HTTPS instead of SSH (or vice versa)

### "Permission denied" error

**Problem:** Authentication failed

**Solutions:**

- Use GitHub Personal Access Token instead of password
- Or set up SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### Files that should be ignored are showing

**Problem:** Sensitive files in repository

**Solution:**

```bash
# Remove from git (but keep local file)
git rm --cached chat-server/.env
git rm --cached chat-server/chat.db

# Commit the removal
git commit -m "Remove sensitive files from git"

# Push
git push
```

## ✅ Next Steps After GitHub Setup

Once your code is on GitHub:

1. **Connect to Railway** (see `RAILWAY_DEPLOYMENT.md`)
2. **Set up environment variables** in Railway dashboard
3. **Deploy!** 🚀

---

**Need help?** Check GitHub's documentation: https://docs.github.com/en/get-started
