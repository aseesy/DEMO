# Railway Database Persistence Fix

## 🚨 Problem
Railway uses an **ephemeral filesystem** - any files saved to disk are lost when the service restarts or redeploys. Your `chat.db` file is being lost, causing all users and data to disappear.

## ✅ Solution: Add Railway Volume

### Step 1: Create a Volume in Railway

1. Go to your Railway project: https://railway.app/dashboard
2. Click on your **DEMO** (chat-server) service
3. Go to the **Settings** tab
4. Scroll to **Volumes** section
5. Click **+ New Volume**
6. Configure:
   - **Mount Path**: `/data`
   - **Name**: `chat-database` (or any name you prefer)
7. Click **Add**

### Step 2: Set Environment Variable

In your Railway service:

1. Go to **Variables** tab
2. Add or update this variable:
   ```
   DB_PATH=/data/chat.db
   ```
3. Click **Add** or **Update**

### Step 3: Redeploy

Railway will automatically redeploy with the new volume mounted.

## 🔍 How It Works

- **Volume**: Persistent storage that survives restarts/redeploys
- **Mount Path `/data`**: A permanent directory Railway maintains
- **DB_PATH env var**: Tells the app to save database in the persistent volume
- **Result**: Database persists forever, even through deployments

## ✅ Verification

After deploying, check Railway logs for:
```
✅ Created database directory: /data
✅ Database saved to: /data/chat.db
```

## 📊 Alternative: Use PostgreSQL (Recommended for Production)

For a more robust solution, consider:

1. Add Railway PostgreSQL service to your project
2. Update backend to use PostgreSQL instead of SQLite
3. Benefits:
   - Better performance at scale
   - Concurrent connections
   - ACID compliance
   - Backups built-in

### Quick PostgreSQL Setup

```bash
# In Railway dashboard
1. Click "+ New" → Database → PostgreSQL
2. Connect it to your DEMO service
3. Railway auto-provides DATABASE_URL
```

Then update your Node.js app to use PostgreSQL (requires code changes).

## 🎯 Recommended Immediate Action

**Use Railway Volume** (5 minutes):
- Quick fix
- No code changes
- Works with current sql.js setup
- Good for small-medium scale

**Later: Migrate to PostgreSQL** (1-2 hours):
- Production-grade database
- Better scalability
- Industry standard
- Recommended for serious deployments
