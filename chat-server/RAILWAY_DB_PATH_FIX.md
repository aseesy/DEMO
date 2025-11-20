# Railway DB_PATH Configuration Fix

## Problem
Your logs show:
```
✅ Database saved to: /app/chat.db
✅ Loaded 0 messages from database
```

This means the database is being saved to `/app/chat.db`, which is **ephemeral** (gets wiped on restart).

## Solution

### Step 1: Check Your Railway Volume Mount Path

1. Go to Railway Dashboard
2. Click on your service
3. Go to "Volumes" tab
4. Note the **Mount Path** (e.g., `/data`, `/persistent`, `/mnt/data`)

### Step 2: Set DB_PATH Environment Variable

1. In Railway Dashboard → Your Service → Variables
2. Add a new variable:
   - **Name:** `DB_PATH`
   - **Value:** `/app/data/chat.db` (replace `/app/data` with your actual volume mount path)
3. Save

**For your setup:** Since your volume is mounted at `/app/data`, set:
- **DB_PATH** = `/app/data/chat.db`

### Step 3: Redeploy

Railway will automatically redeploy. After deployment, check logs for:

✅ **Correct:**
```
📁 Database path: /app/data/chat.db
📁 DB_PATH env var: /app/data/chat.db
✅ Database directory exists: /app/data
✅ Database directory is writable: /app/data
```

❌ **Wrong (current state):**
```
📁 Database path: /app/chat.db
📁 DB_PATH env var: NOT SET (using default)
⚠️  DB_PATH not set - using default path (ephemeral on Railway/Vercel)
```

## Common Volume Mount Paths

- `/data` → Set `DB_PATH=/data/chat.db`
- `/persistent` → Set `DB_PATH=/persistent/chat.db`
- `/mnt/data` → Set `DB_PATH=/mnt/data/chat.db`

**Important:** The path MUST match your Railway volume mount path exactly!

## Verify It's Working

After setting `DB_PATH` and redeploying:

1. Send a few messages
2. Check logs: `💾 Saved new message X to database (room: Y)`
3. Check logs: `✅ Database saved to: /app/data/chat.db` (should show your volume path, not `/app/chat.db`)
4. Restart/redeploy
5. Check startup logs: `📊 Database contains X messages` (should be > 0)

If message count is still 0 after restart, double-check:
- Volume is actually mounted in Railway
- `DB_PATH` matches volume mount path exactly
- No typos in the path

