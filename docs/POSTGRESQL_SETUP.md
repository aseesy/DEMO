# 🐘 PostgreSQL Setup Guide

Complete guide for setting up PostgreSQL in development and production.

## 📋 Overview

LiaiZen uses **PostgreSQL-only** in production. SQLite is available as a dev-only fallback when `DATABASE_URL` is not set.

---

## 🚀 Production Setup (Railway)

### Step 1: Add PostgreSQL Service

1. Go to Railway Dashboard: https://railway.app/dashboard
2. Open your project
3. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
4. Railway automatically:
   - Creates a PostgreSQL database
   - Injects `DATABASE_URL` environment variable
   - Connects it to your chat-server service

### Step 2: Verify DATABASE_URL

**Automatic Connection (Recommended):**
- Railway automatically shares `DATABASE_URL` with connected services
- Check your **chat-server** service → **Variables** → **Connected Variables**
- Should see: `DATABASE_URL=postgresql://...`

**Manual Setup (If needed):**
1. Click PostgreSQL service → **Connect** tab
2. Copy **Connection URL**
3. Add to chat-server service → **Variables**:
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres:PASSWORD@HOST:PORT/railway`

### Step 3: Verify Connection

After setting `DATABASE_URL`, check Railway logs. You should see:
```
✅ PostgreSQL pool connected
🔄 Running PostgreSQL migration...
✅ PostgreSQL migration completed successfully
```

### Connection String Format

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

---

## 💻 Local Development Setup

### Option A: Docker (Easiest - Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name postgres-liaizen \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=liaizen_dev \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep postgres

# Your DATABASE_URL will be:
# postgresql://postgres:devpass@localhost:5432/liaizen_dev
```

**Stop when done:**
```bash
docker stop postgres-liaizen
docker rm postgres-liaizen
```

### Option B: Homebrew (macOS)

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb liaizen_dev

# Your DATABASE_URL will be:
# postgresql://postgres@localhost:5432/liaizen_dev
```

### Option C: Use SQLite for Local Dev (No PostgreSQL needed)

If you don't want to run PostgreSQL locally:

1. **Don't set `DATABASE_URL`** in your local `.env` file
2. The app will automatically use SQLite (`chat.db`)
3. SQLite is fine for local development
4. **Note**: Production requires PostgreSQL

### Setting DATABASE_URL Locally

Create or update `.env` file in `chat-server/`:

```env
# For Docker PostgreSQL
DATABASE_URL=postgresql://postgres:devpass@localhost:5432/liaizen_dev

# For Homebrew PostgreSQL
DATABASE_URL=postgresql://postgres@localhost:5432/liaizen_dev

# Or leave unset to use SQLite (dev only)
```

---

## 🔄 Migration: SQLite → PostgreSQL

If you have existing SQLite data to migrate:

### Step 1: Export SQLite Data

```bash
cd chat-server
sqlite3 chat.db .dump > backup.sql
```

### Step 2: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgresql://postgres:devpass@localhost:5432/liaizen_dev

# Create tables (run migrations)
# The app will auto-create tables on first run
```

### Step 3: Import Data (if needed)

You may need to write a custom migration script to convert SQLite data to PostgreSQL format.

---

## ✅ Verification

### Check Database Connection

**In Production (Railway):**
- Check Railway logs for: `✅ PostgreSQL pool connected`
- Test API endpoints that use database

**In Development:**
```bash
# Test connection
psql $DATABASE_URL

# Should connect successfully
# Type \q to exit
```

### Verify Tables Created

The app automatically runs migrations on startup. Check logs for:
```
🔄 Running PostgreSQL migration...
✅ Migration: 001_initial_schema.sql
✅ Migration: 002_communication_profiles.sql
✅ PostgreSQL migration completed successfully
```

---

## 🐛 Troubleshooting

### DATABASE_URL Not Set

**Problem:** `DATABASE_URL is not set` error

**Solution:**
- **Production**: Verify PostgreSQL service is connected to chat-server in Railway
- **Development**: Either set `DATABASE_URL` or leave unset to use SQLite

### Connection Fails

**Problem:** Can't connect to PostgreSQL

**Solution:**
1. Verify PostgreSQL service is running (not stopped)
2. Check connection string format is correct
3. Verify password in connection string
4. Check firewall/network settings

### Migration Errors

**Problem:** Migrations fail

**Solution:**
1. Check Railway logs for specific error
2. Verify database user has CREATE TABLE permissions
3. Check if tables already exist (may need to drop and recreate)

### Local PostgreSQL Not Starting

**Problem:** Can't start PostgreSQL locally

**Solution:**
```bash
# Check if PostgreSQL is running
brew services list  # macOS
systemctl status postgresql  # Linux

# Restart PostgreSQL
brew services restart postgresql@15  # macOS
sudo systemctl restart postgresql  # Linux
```

---

## 📚 Additional Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Railway PostgreSQL**: https://docs.railway.app/databases/postgresql
- **Docker PostgreSQL**: https://hub.docker.com/_/postgres

---

## 🎯 Quick Reference

### Connection Strings

**Railway Production:**
```
postgresql://postgres:PASSWORD@HOST:PORT/railway
```

**Local Docker:**
```
postgresql://postgres:devpass@localhost:5432/liaizen_dev
```

**Local Homebrew:**
```
postgresql://postgres@localhost:5432/liaizen_dev
```

### Common Commands

```bash
# Connect to database
psql $DATABASE_URL

# List databases
psql $DATABASE_URL -c "\l"

# List tables
psql $DATABASE_URL -c "\dt"

# View table structure
psql $DATABASE_URL -c "\d table_name"
```

---

**PostgreSQL is now set up!** The app will automatically use it when `DATABASE_URL` is set. 🐘

