# Railway PostgreSQL Setup Guide

## Setting DATABASE_URL in Railway

### Method 1: Automatic Connection (Recommended)

When you connect a PostgreSQL service to your chat-server service in Railway, Railway automatically injects the `DATABASE_URL` environment variable.

**Steps:**
1. In Railway dashboard, find your **PostgreSQL** service
2. Click the service → Go to **Variables** tab
3. You should see `DATABASE_URL` listed
4. Railway automatically shares this with connected services

**OR:**

1. Click your **chat-server** service
2. Go to **Variables** tab
3. Scroll to **"Connected Variables"** section
4. `DATABASE_URL` should appear here if PostgreSQL is connected

### Method 2: Manual Setup

If automatic connection doesn't work:

1. **Get Connection String:**
   - Click your PostgreSQL service
   - Go to **Connect** tab
   - Click **"Connect to Postgres"**
   - Copy the **Connection URL** (it looks like: `postgresql://postgres:PASSWORD@HOST:PORT/railway`)

2. **Add to chat-server:**
   - Click your **chat-server** service
   - Go to **Variables** tab
   - Click **"+ New Variable"**
   - Name: `DATABASE_URL`
   - Value: Paste the connection string
   - Click **Add**

3. **Redeploy:**
   - Railway will automatically redeploy, or manually trigger a redeploy

## Verify It's Working

After setting `DATABASE_URL`, check your Railway logs. You should see:

```
✅ PostgreSQL pool connected
🔄 Running PostgreSQL migration...
✅ PostgreSQL migration completed successfully
```

Instead of:
```
❌ DATABASE_URL is not set. PostgreSQL client cannot be initialized.
```

## Troubleshooting

**If DATABASE_URL doesn't appear automatically:**
- Make sure both services (PostgreSQL and chat-server) are in the same Railway project
- Try disconnecting and reconnecting the PostgreSQL service
- Check that PostgreSQL service is not in "stopped" state

**If connection fails:**
- Verify the connection string format is correct
- Check that PostgreSQL service is running (not stopped)
- Make sure the password in the connection string is correct

## Connection String Format

Railway PostgreSQL connection strings look like:
```
postgresql://postgres:PASSWORD@maglev.proxy.rlwy.net:57813/railway
```

Where:
- `postgres` = username
- `PASSWORD` = database password
- `maglev.proxy.rlwy.net` = hostname
- `57813` = port
- `railway` = database name

