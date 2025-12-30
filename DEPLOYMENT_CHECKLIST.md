# Deployment Fix Checklist

**CRITICAL**: Complete these steps in order to restore deployments

---

## Pre-Flight Check

- [ ] Verify local build works: `cd chat-server && npm ci --legacy-peer-deps && node server.js`
- [ ] Run verification script: `./scripts/verify-deployments.sh` (expect failures)
- [ ] Confirm Railway CLI installed: `railway --version`
- [ ] Confirm Vercel CLI installed: `vercel --version`
- [ ] Log into Railway: `railway login`
- [ ] Log into Vercel: `vercel login`

---

## Railway Backend Fixes

### Configuration

- [ ] **Option A**: Remove root railway.toml

  ```bash
  git rm railway.toml
  git commit -m "fix: Remove root railway.toml"
  git push
  ```

  Then in Railway dashboard:
  - [ ] Settings → Build → Root Directory: `chat-server`
  - [ ] Save changes

- [ ] **OR Option B**: Update railway.toml to include `cd chat-server` in startCommand

### Environment Variables

**Critical (Must Set)**:

- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `JWT_SECRET` (min 32 chars) - Generate: `openssl rand -base64 32`
- [ ] `FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com`

**Required for Features**:

- [ ] `OPENAI_API_KEY=sk-...` (AI mediation)
- [ ] `GMAIL_USER=info@liaizen.com` (email)
- [ ] `GMAIL_APP_PASSWORD=...` (email)

**Optional**:

- [ ] `ANTHROPIC_API_KEY=...` (alternative AI)
- [ ] `NEO4J_URI=...` (graph database)
- [ ] `NEO4J_USER=...`
- [ ] `NEO4J_PASSWORD=...`

**Quick Setup**:

- [ ] Run: `./scripts/setup-railway-env.sh` (interactive)
- [ ] OR manually: `railway variables set KEY=value`

### Database

- [ ] Verify PostgreSQL plugin active: `railway plugins`
- [ ] If not, add via Railway dashboard → Plugins → PostgreSQL
- [ ] Confirm DATABASE_URL auto-set: `railway variables | grep DATABASE_URL`

### Deploy

- [ ] Trigger deployment: `railway up` or `git push`
- [ ] Monitor logs: `railway logs --tail`
- [ ] Wait for success message: "✅ Server listening on..."
- [ ] Verify health: `curl https://demo-production-6dcd.up.railway.app/health`

---

## Vercel Frontend Fixes

### Environment Variables

- [ ] Set VITE_API_URL:
  ```bash
  vercel env add VITE_API_URL production
  # Enter: https://demo-production-6dcd.up.railway.app
  ```
- [ ] OR create .env.production:
  ```bash
  cd chat-client-vite
  echo "VITE_API_URL=https://demo-production-6dcd.up.railway.app" > .env.production
  git add .env.production
  git commit -m "fix: Add production API URL"
  git push
  ```

### Configuration

- [ ] Verify vercel.json is correct:
  ```bash
  cat vercel.json
  # Should have: buildCommand, outputDirectory, installCommand
  ```

### Deploy

- [ ] Deploy: `vercel --prod`
- [ ] OR push to trigger auto-deploy: `git push`
- [ ] Monitor deployment in Vercel dashboard
- [ ] Verify frontend loads: `curl https://coparentliaizen.com`

---

## Verification

### Automated Tests

- [ ] Run verification script: `./scripts/verify-deployments.sh`
- [ ] Expect: "✓ All checks passed!"

### Manual Tests

**Railway Backend**:

- [ ] Health endpoint: `curl https://demo-production-6dcd.up.railway.app/health`
  - Expect: `{"status":"ok",...}`
- [ ] No errors in logs: `railway logs --tail`
- [ ] Server uptime > 5 minutes

**Vercel Frontend**:

- [ ] Homepage loads in browser: https://coparentliaizen.com
- [ ] No console errors
- [ ] Assets load correctly

**Integration**:

- [ ] CORS test:
  ```bash
  curl -H "Origin: https://coparentliaizen.com" \
       -H "Access-Control-Request-Method: POST" \
       -X OPTIONS \
       https://demo-production-6dcd.up.railway.app/api/auth/login
  ```
- [ ] Login works (test in browser)
- [ ] WebSocket connects (check browser console)
- [ ] Chat messages send successfully

---

## Post-Deployment

### Monitoring (First 24 Hours)

- [ ] Set up health check monitoring
- [ ] Check Railway logs every 2 hours
- [ ] Monitor Vercel analytics
- [ ] Test all critical user flows:
  - [ ] User registration
  - [ ] Login
  - [ ] Send message
  - [ ] AI mediation triggers
  - [ ] Task creation
  - [ ] Contact management

### Documentation

- [ ] Document final configuration in team wiki
- [ ] Save environment variables in secure vault (1Password, etc.)
- [ ] Update deployment runbook if needed
- [ ] Share Railway and Vercel URLs with team

### Security

- [ ] Rotate any exposed secrets
- [ ] Verify no secrets in git history
- [ ] Enable Railway deployment protection
- [ ] Enable Vercel password protection (if needed)

---

## Rollback Plan (If Needed)

If deployment fails completely:

- [ ] Find last working commit: `git log --oneline -10`
- [ ] Revert: `git revert HEAD --no-commit`
- [ ] Commit: `git commit -m "Rollback: revert to stable"`
- [ ] Push: `git push`

OR use Railway/Vercel dashboard to redeploy previous version.

---

## Success Indicators

✅ **Deployment is successful when**:

1. Health endpoint returns 200 OK
2. Frontend loads without errors
3. Login flow works end-to-end
4. No errors in logs for 10 minutes
5. CORS allows frontend-backend communication
6. WebSocket connection establishes
7. All environment variables are set correctly
8. Database queries succeed

---

## Getting Help

If stuck after following all steps:

1. **Capture logs**:

   ```bash
   railway logs -n 200 > railway-logs.txt
   vercel logs https://coparentliaizen.com > vercel-logs.txt
   ```

2. **Check configuration**:

   ```bash
   railway variables > env-check.txt  # Remove secrets before sharing
   cat railway.toml
   cat chat-server/nixpacks.toml
   cat vercel.json
   ```

3. **Review documentation**:
   - `/docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md` - Comprehensive guide
   - `/docs/QUICK_DEPLOYMENT_FIX.md` - Quick fixes
   - `/docs/DEPLOYMENT_STATUS_SUMMARY.md` - Current status

4. **Contact support**:
   - Railway: https://railway.app/help
   - Vercel: https://vercel.com/support

---

**Last Updated**: 2025-12-30
**Estimated Completion Time**: 1 hour
**Difficulty**: Medium
**Status**: Ready to execute
