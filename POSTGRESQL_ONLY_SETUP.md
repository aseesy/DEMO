# 🐘 PostgreSQL-Only Setup Guide

## Overview

This application now uses **PostgreSQL-only** in production. SQLite is only available for local development when `DATABASE_URL` is not set.

## ✅ What Changed

1. **Removed conflicting configs:**
   - Deleted `railway.json` (kept `railway.toml`)
   - Verified `vercel.json` is in correct location

2. **Database initialization:**
   - PostgreSQL is **required** in production
   - SQLite is **dev-only** fallback
   - Server will exit if `DATABASE_URL` not set in production

3. **Simplified code:**
   - Removed dual-database complexity
   - Clear logging about which database is used
   - PostgreSQL-first approach throughout

## 🚀 Railway Setup (Production)

### Step 1: Add PostgreSQL Service

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Open your project
3. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway will automatically:
   - Create a PostgreSQL database
   - Inject `DATABASE_URL` environment variable
   - Connect it to your service

### Step 2: Verify Environment Variables

Go to your **chat-server** service → **Variables** tab and ensure these are set:

#### Required Variables:
```
NODE_ENV=production
FRONTEND_URL=https://www.coparentliaizen.com,https://coparentliaizen.com,https://*.vercel.app
JWT_SECRET=<32+ character secret>
```

#### Auto-Provided by Railway:
```
DATABASE_URL=<automatically set when PostgreSQL is connected>
PORT=3001 (auto-set by Railway)
```

#### Optional Variables (if using features):
```
OPENAI_API_KEY=<your-openai-key>
GMAIL_USER=<your-email>
GMAIL_APP_PASSWORD=<app-password>
EMAIL_FROM=<from-email>
FIGMA_ACCESS_TOKEN=<figma-token>
```

### Step 3: Remove Old Variables (if any)

**DO NOT SET THESE** (not needed with PostgreSQL):
- ❌ `DB_PATH` - Not needed (PostgreSQL doesn't use file paths)
- ❌ Remove any Railway volumes - Not needed (PostgreSQL is managed)

### Step 4: Deploy

Railway will automatically:
1. Build your application
2. Run migrations (non-blocking, in background)
3. Start the server

## ✅ Verification

After deployment, check Railway logs for:

**Good signs:**
```
🐘 PostgreSQL mode: DATABASE_URL detected
📊 Using PostgreSQL database (production)
🔄 Initializing PostgreSQL connection pool...
✅ PostgreSQL pool connected
✅ PostgreSQL connection test passed
🔄 Running PostgreSQL migration (attempt 1/3)...
✅ PostgreSQL migration completed successfully
✅ Server listening on 0.0.0.0:3001
```

**Errors (needs attention):**
```
❌ ERROR: DATABASE_URL not set in production!
❌ PostgreSQL is required in production.
❌ Migration failed after all retries
```

## 🔧 Troubleshooting

### Issue: "DATABASE_URL not set in production"

**Solution:**
1. Go to Railway Dashboard
2. Check if PostgreSQL service exists
3. If not, add it: "+ New" → "Database" → "PostgreSQL"
4. Ensure PostgreSQL service is **connected** to your chat-server service
5. Check Variables tab - `DATABASE_URL` should appear automatically

### Issue: Migration fails

**Solution:**
1. Check Railway logs for specific error
2. Verify PostgreSQL service is running (not stopped)
3. Migration retries automatically on next deployment
4. You can also run migration manually:
   ```bash
   railway run cd chat-server && node run-migration.js
   ```

### Issue: Connection timeout

**Solution:**
1. Check PostgreSQL service status in Railway
2. Verify `DATABASE_URL` is correct format
3. Check Railway logs for connection errors
4. Server will retry connections automatically

## 💻 Local Development

For local development, you have two options:

### Option A: Use PostgreSQL Locally

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name postgres-dev -e POSTGRES_PASSWORD=devpass -p 5432:5432 -d postgres
   ```

2. Set environment variable:
   ```bash
   export DATABASE_URL=postgresql://postgres:devpass@localhost:5432/postgres
   ```

3. Run server:
   ```bash
   cd chat-server && npm start
   ```

### Option B: Use SQLite (Dev Only)

1. **Do NOT set** `DATABASE_URL`
2. **Do NOT set** `NODE_ENV=production`
3. Run server:
   ```bash
   cd chat-server && npm start
   ```

You'll see:
```
💾 SQLite mode: DATABASE_URL not set (development only)
📊 Using SQLite database (local development)
```

## 📊 Database Schema

The PostgreSQL schema is defined in:
- `chat-server/migrations/001_initial_schema.sql`

Tables created:
- `users` - User accounts
- `user_context` - User profile/context data
- `rooms` - Chat rooms
- `room_members` - Room membership
- `messages` - Chat messages
- `threads` - Message threads
- `contacts` - User contacts
- `tasks` - User tasks
- `communication_stats` - Communication analytics
- And more...

## 🔄 Migration Process

Migrations run automatically on server startup:
1. Server starts immediately (non-blocking)
2. Migration runs in background after 2 seconds
3. Retries up to 3 times if it fails
4. Server continues even if migration fails (can retry later)

## 🎯 Key Points

1. **PostgreSQL is REQUIRED in production** - Server will exit if not set
2. **No volumes needed** - PostgreSQL is managed by Railway
3. **No DB_PATH needed** - PostgreSQL uses connection strings
4. **Migrations are automatic** - Run on every deployment
5. **SQLite is dev-only** - Never used in production

## 📝 Checklist

Before deploying to production:

- [ ] PostgreSQL service added in Railway
- [ ] `DATABASE_URL` appears in Railway Variables (auto-set)
- [ ] `NODE_ENV=production` is set
- [ ] `FRONTEND_URL` is set correctly
- [ ] `JWT_SECRET` is set (32+ characters)
- [ ] No `DB_PATH` variable (not needed)
- [ ] No Railway volumes configured (not needed)
- [ ] Tested locally with PostgreSQL (optional but recommended)

## 🆘 Support

If you encounter issues:

1. Check Railway logs first
2. Verify all required environment variables
3. Ensure PostgreSQL service is running
4. Check migration logs for schema errors
5. Verify `DATABASE_URL` format is correct

---

**Last Updated:** PostgreSQL-only setup
**Status:** ✅ Production-ready





















