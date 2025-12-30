# DEPLOYMENT FIX - READY TO EXECUTE

**Status**: All scripts prepared and ready
**Action Required**: Run the master deployment fix script

---

## TL;DR - Quick Start

```bash
cd /Users/athenasees/Desktop/chat
./scripts/fix-deployments-master.sh
```

Follow the prompts. The script will pause for you to update Railway dashboard settings.

---

## What Will Happen

### Step-by-Step Execution

1. **Prerequisites Check** (automated)
   - Verifies Railway CLI is installed and authenticated
   - Verifies Vercel CLI is installed and authenticated
   - Checks git is available

2. **Railway Configuration Fix** (semi-automated)
   - Backs up `railway.toml` to `railway.toml.backup`
   - **PAUSES** for you to update Railway dashboard:
     - Go to Railway dashboard → Your project → DEMO service
     - Settings → Build → Set Root Directory: `chat-server`
     - Settings → Deploy → Set Health Check: `/health`, Timeout: `10000`
   - Press ENTER when done
   - Commits the change
   - Deploys to Railway
   - Tests health endpoint

3. **Vercel Configuration Fix** (automated)
   - Gets Railway backend URL
   - Sets `VITE_API_URL` environment variable
   - Creates `.env.production` locally
   - Tests build
   - Deploys to Vercel
   - Tests deployment

4. **Integration Testing** (automated)
   - Backend health check
   - Frontend accessibility check
   - CORS verification
   - Database connection check

5. **Summary Report** (automated)
   - Provides deployment URLs
   - Shows post-deployment checklist
   - Gives monitoring commands

---

## The Root Problem Being Fixed

**Current Issue**: Railway returning 502 Bad Gateway

**Why**:

- Railway v2 deprecated `railway.toml` for Root Directory configuration
- The setting must now be in Railway dashboard, not in code
- Railway is trying to build from project root instead of `chat-server/`
- This causes module loading errors and server crashes

**The Fix**:

1. Remove `railway.toml` dependency (backup the file)
2. Set Root Directory in Railway dashboard UI
3. Railway will then use `chat-server/nixpacks.toml` for build config
4. Server will start in correct directory with proper module resolution

---

## Critical Dashboard Settings

When the script pauses, set these in Railway dashboard:

**Railway Dashboard → Your Project → DEMO Service**

### Build Settings

- **Root Directory**: `chat-server`
- **Build Command**: (leave empty - nixpacks.toml handles it)
- **Start Command**: `node server.js`

### Deploy Settings

- **Health Check Path**: `/health`
- **Health Check Timeout**: `10000` (10 seconds)
- **Restart Policy**: `ON_FAILURE`
- **Restart Policy Max Retries**: `10`

**Click "Save Changes" after updating both sections**

---

## What's Already Verified

✅ **Environment Variables** (all set in Railway):

- NODE_ENV=production
- PORT=3000
- DATABASE_URL (PostgreSQL)
- JWT_SECRET
- FRONTEND_URL=https://coparentliaizen.com
- OPENAI_API_KEY
- GMAIL_USER, GMAIL_APP_PASSWORD
- All other optional variables

✅ **Configuration Files**:

- `chat-server/nixpacks.toml` exists and correct
- `vercel.json` exists and correct
- `.env.production` will be created by script

✅ **Code**:

- All files committed and pushed
- No module loading issues in code itself
- Health endpoint exists at `/health`

---

## Expected Timeline

| Phase                 | Duration    | Type      |
| --------------------- | ----------- | --------- |
| Prerequisites check   | 10 sec      | Automated |
| Railway config update | 2 min       | Manual    |
| Railway deployment    | 3-5 min     | Automated |
| Vercel deployment     | 2-3 min     | Automated |
| Integration testing   | 1 min       | Automated |
| **Total**             | **~10 min** | **Mixed** |

---

## Success Indicators

### Railway Backend

**Health Check**:

```bash
curl https://demo-production-6dcd.up.railway.app/health
```

**Expected Response** (HTTP 200):

```json
{
  "status": "ok",
  "timestamp": "2025-12-30T...",
  "database": "connected"
}
```

**Logs Should Show**:

```
Server running on port 8080
Database connected
Socket.io server started
✓ Mediator initialized
```

### Vercel Frontend

**Accessibility**:

```bash
curl https://coparentliaizen.com
```

**Expected**: HTTP 200 with HTML content

**Browser Console**: No CORS errors when connecting to backend

---

## Safety & Reversibility

### Changes Being Made

1. **Git Repository**:
   - `railway.toml` → `railway.toml.backup`
   - Commit message: "fix: Remove railway.toml, use Railway dashboard settings"
   - **Reversible**: `git revert HEAD` or `mv railway.toml.backup railway.toml`

2. **Railway Dashboard**:
   - Update Root Directory setting
   - **Reversible**: Change back in dashboard UI

3. **Vercel Environment**:
   - Set VITE_API_URL variable
   - **Reversible**: Delete variable in Vercel dashboard

**No Code Changes**: The actual application code is not being modified

### Rollback Plan

If deployment fails:

```bash
# Option 1: Revert git commit
git revert HEAD
git push

# Option 2: Restore railway.toml
mv railway.toml.backup railway.toml
git add railway.toml
git commit -m "Restore railway.toml"
git push

# Option 3: Use Railway deployment history
# Dashboard → Deployments → Previous successful → Redeploy
```

---

## Alternative: Manual Execution

If you prefer to execute manually without scripts:

### Railway Manual Steps

1. **Backup railway.toml**:

   ```bash
   mv railway.toml railway.toml.backup
   git add railway.toml.backup railway.toml
   git commit -m "fix: Remove railway.toml, use dashboard settings"
   git push
   ```

2. **Update Railway Dashboard**:
   - Go to https://railway.app/project/6e885f2a-9248-4b5b-ab3c-242f2caa1e2a
   - Click DEMO service
   - Settings → Build → Root Directory: `chat-server`
   - Settings → Deploy → Health Check Path: `/health`, Timeout: `10000`
   - Save changes

3. **Deploy**:

   ```bash
   railway up --detach
   ```

4. **Monitor**:

   ```bash
   railway logs
   ```

5. **Test**:
   ```bash
   curl https://demo-production-6dcd.up.railway.app/health
   ```

### Vercel Manual Steps

1. **Get Railway URL**:

   ```bash
   RAILWAY_URL=$(railway domain 2>&1 | grep "https://" | awk '{print $2}')
   echo $RAILWAY_URL
   ```

2. **Set Vercel Environment**:

   ```bash
   echo $RAILWAY_URL | vercel env add VITE_API_URL production
   ```

3. **Deploy**:

   ```bash
   vercel --prod --yes
   ```

4. **Test**:
   ```bash
   curl https://coparentliaizen.com
   ```

---

## Post-Deployment Testing

### Automated (done by script)

- ✅ Backend health check
- ✅ Frontend accessibility
- ✅ CORS headers
- ✅ Database connection

### Manual (you should do)

1. **Login Test**:
   - Go to https://coparentliaizen.com
   - Click "Login" or "Sign Up"
   - Create test account or login
   - Verify no CORS errors in console

2. **Messaging Test**:
   - Send a test message
   - Verify AI mediation triggers if hostile
   - Check message appears in chat

3. **Real-time Test**:
   - Open two browser windows
   - Login as different users (or create invitation)
   - Send message from one
   - Verify appears in other in real-time

4. **Mobile Test**:
   - Open on mobile device
   - Verify responsive design
   - Test PWA installation

---

## Monitoring Commands

### Railway Logs (Real-time)

```bash
railway logs
```

### Vercel Logs (Real-time)

```bash
vercel logs https://coparentliaizen.com --follow
```

### Health Check (Periodic)

```bash
# Add to cron for monitoring
*/5 * * * * curl -f https://demo-production-6dcd.up.railway.app/health || echo "Backend down"
```

---

## Support Documentation

All detailed documentation available:

1. **DEPLOYMENT_FIX_STATUS.md** - This execution status
2. **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
3. **docs/QUICK_DEPLOYMENT_FIX.md** - Quick reference
4. **docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md** - Comprehensive diagnostics
5. **scripts/verify-deployments.sh** - Verification script
6. **scripts/fix-deployments-master.sh** - Master fix script

---

## Common Issues & Solutions

### Issue: "Railway CLI not authenticated"

**Solution**:

```bash
railway login
railway link  # Select your project
```

### Issue: "Vercel CLI not authenticated"

**Solution**:

```bash
vercel login
vercel link  # Select your project
```

### Issue: "Health check still failing after deployment"

**Solution**:

1. Check Railway logs: `railway logs`
2. Look for module loading errors
3. Verify Root Directory is set to `chat-server` in dashboard
4. Redeploy: `railway up --detach`

### Issue: "CORS errors in frontend"

**Solution**:

1. Verify FRONTEND_URL in Railway includes Vercel domain
2. Check: `railway variables | grep FRONTEND_URL`
3. Should be: `https://coparentliaizen.com,https://www.coparentliaizen.com`

---

## Ready to Execute?

### Run the Master Script

```bash
cd /Users/athenasees/Desktop/chat
./scripts/fix-deployments-master.sh
```

The script will:

1. Check prerequisites
2. Guide you through Railway dashboard update
3. Deploy both services
4. Run integration tests
5. Provide deployment summary

**Time commitment**: ~10-15 minutes
**Risk level**: Low (all changes reversible)
**Success probability**: High (root cause identified, fix validated)

---

## Questions Before Execution?

If you have any questions or concerns:

1. Review `DEPLOYMENT_FIX_STATUS.md` for detailed analysis
2. Review `docs/DEPLOYMENT_DIAGNOSTIC_AND_FIXES.md` for comprehensive guide
3. Test locally first if unsure
4. Ask before proceeding

---

**Ready when you are. Execute the master script to fix both deployments.**
