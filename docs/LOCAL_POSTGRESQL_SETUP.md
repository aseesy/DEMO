# 💻 Local PostgreSQL Setup Guide

## Quick Setup Options

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

# Create user (optional, or use default 'postgres' user)
createuser -s liaizen_user

# Your DATABASE_URL will be:
# postgresql://postgres@localhost:5432/liaizen_dev
# or
# postgresql://liaizen_user@localhost:5432/liaizen_dev
```

### Option C: Use SQLite for Local Dev (No PostgreSQL needed)

If you don't want to set up PostgreSQL locally:

1. **Don't set DATABASE_URL** in your `.env` file
2. The app will automatically use SQLite
3. You'll see: `💾 SQLite mode: DATABASE_URL not set (development only)`

## Setting Up DATABASE_URL

### Step 1: Create .env file

In `chat-server/` directory, create `.env` file:

```bash
cd chat-server
touch .env
```

### Step 2: Add DATABASE_URL

**For Docker:**

```env
DATABASE_URL=postgresql://postgres:devpass@localhost:5432/liaizen_dev
```

**For Homebrew (default user):**

```env
DATABASE_URL=postgresql://postgres@localhost:5432/liaizen_dev
```

**For Homebrew (custom user):**

```env
DATABASE_URL=postgresql://liaizen_user:password@localhost:5432/liaizen_dev
```

**Format:**

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

### Step 3: Test Connection

```bash
cd chat-server
node test-postgres-connection.js
```

You should see:

```
✅ Connection successful!
📊 Database Info:
   Current Time: ...
   PostgreSQL Version: ...
```

## Troubleshooting

### Error: "Connection refused" (ECONNREFUSED)

**Problem:** PostgreSQL is not running

**Solutions:**

1. **Docker:**

   ```bash
   docker ps | grep postgres
   # If not running:
   docker start postgres-liaizen
   ```

2. **Homebrew:**

   ```bash
   brew services list | grep postgresql
   # If not running:
   brew services start postgresql@15
   ```

3. **Check if PostgreSQL is listening:**
   ```bash
   lsof -i :5432
   # Should show postgres process
   ```

### Error: "Authentication failed" (28P01)

**Problem:** Wrong username/password

**Solutions:**

1. **Check your DATABASE_URL:**

   ```bash
   # In chat-server/.env
   # Verify username and password match PostgreSQL setup
   ```

2. **Reset PostgreSQL password:**
   ```bash
   # Docker: Use the password you set with -e POSTGRES_PASSWORD
   # Homebrew: Default user 'postgres' might not have password
   # Try: DATABASE_URL=postgresql://postgres@localhost:5432/liaizen_dev
   ```

### Error: "Database does not exist" (3D000)

**Problem:** Database hasn't been created

**Solutions:**

1. **Create database:**

   ```bash
   # Docker (auto-creates if POSTGRES_DB is set)
   # Homebrew:
   createdb liaizen_dev

   # Or via psql:
   psql -U postgres -c "CREATE DATABASE liaizen_dev;"
   ```

### Error: "Invalid DATABASE_URL format"

**Problem:** Connection string format is wrong

**Correct format:**

```
postgresql://username:password@host:port/database
```

**Examples:**

- `postgresql://postgres:devpass@localhost:5432/liaizen_dev`
- `postgresql://postgres@localhost:5432/liaizen_dev` (no password)
- `postgresql://user:pass@127.0.0.1:5432/dbname`

### Error: "Connection timeout"

**Problem:** PostgreSQL is not accessible

**Solutions:**

1. **Check PostgreSQL is running:**

   ```bash
   # Docker
   docker ps

   # Homebrew
   brew services list
   ```

2. **Check port:**

   ```bash
   lsof -i :5432
   ```

3. **Check firewall:**
   - macOS: Usually not an issue
   - Linux: Check `sudo ufw status`

## Running the Server

Once DATABASE_URL is set:

```bash
cd chat-server
npm start
```

You should see:

```
🐘 PostgreSQL mode: DATABASE_URL detected
📊 Using PostgreSQL database (production)
🔄 Initializing PostgreSQL connection pool...
✅ PostgreSQL pool connected
✅ PostgreSQL connection test passed
```

## Running Migrations

After setting up the database:

```bash
cd chat-server
node run-migration.js
```

You should see:

```
✅ PostgreSQL migration completed successfully
```

## Quick Test Script

Use the test script to verify everything works:

```bash
cd chat-server
node test-postgres-connection.js
```

This will:

- ✅ Verify DATABASE_URL is set
- ✅ Test connection
- ✅ Show database info
- ✅ List existing tables
- ✅ Provide helpful error messages

## Common Issues

### Issue: "DATABASE_URL not set"

**Solution:** Create `.env` file in `chat-server/` with DATABASE_URL

### Issue: "Module 'pg' not found"

**Solution:** Install dependencies:

```bash
cd chat-server
npm install
```

### Issue: "Port 5432 already in use"

**Solution:**

1. Find what's using it: `lsof -i :5432`
2. Stop the other PostgreSQL instance
3. Or use a different port in DATABASE_URL

## Using SQLite Instead (No PostgreSQL)

If you don't want to set up PostgreSQL locally:

1. **Don't create .env file** (or don't set DATABASE_URL)
2. **Don't set NODE_ENV=production**
3. Run server: `npm start`

You'll see:

```
💾 SQLite mode: DATABASE_URL not set (development only)
📊 Using SQLite database (local development)
```

This is fine for local development!

## Next Steps

1. ✅ Set up PostgreSQL (Docker or Homebrew)
2. ✅ Create `.env` file with DATABASE_URL
3. ✅ Test connection: `node test-postgres-connection.js`
4. ✅ Run migration: `node run-migration.js`
5. ✅ Start server: `npm start`

---

**Need help?** Run `node test-postgres-connection.js` for detailed error messages!
