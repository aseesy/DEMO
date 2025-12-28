# Local Database Connection Setup

## Quick Start for Local Development

### Option 1: Docker (Easiest - Recommended)

```bash
# Start PostgreSQL in Docker
docker run --name postgres-liaizen \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=liaizen_dev \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps | grep postgres

# Test connection
docker exec -it postgres-liaizen psql -U postgres -d liaizen_dev -c "SELECT version();"
```

Then set in `.env` file (create if it doesn't exist):

```
DATABASE_URL=postgresql://postgres:devpass@localhost:5432/liaizen_dev
```

### Option 2: Local PostgreSQL Installation

If you have PostgreSQL installed locally:

1. **Start PostgreSQL service:**

   ```bash
   # macOS (Homebrew)
   brew services start postgresql@15

   # Linux (systemd)
   sudo systemctl start postgresql
   ```

2. **Create database:**

   ```bash
   createdb liaizen_dev
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE liaizen_dev;"
   ```

3. **Set DATABASE_URL in .env:**

   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/liaizen_dev
   ```

   Or if no password (trust authentication):

   ```
   DATABASE_URL=postgresql://postgres@localhost:5432/liaizen_dev
   ```

### Option 3: Use Existing PostgreSQL Connection

If you have a PostgreSQL database already running:

1. Get your connection string:

   ```
   postgresql://username:password@host:port/database
   ```

2. Add to `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

---

## Verify Connection

After setting `DATABASE_URL`, test the connection:

```bash
cd chat-server
node test-postgres-connection.js
```

Or start the server and check logs:

```bash
npm start
# Look for: ✅ PostgreSQL connection test passed
```

---

## Troubleshooting "localhost is not connected"

### Issue: Connection refused (ECONNREFUSED)

**Causes:**

- PostgreSQL is not running
- Wrong port (default is 5432)
- Firewall blocking connection

**Solutions:**

1. **Check if PostgreSQL is running:**

   ```bash
   # macOS/Linux
   pg_isready -h localhost -p 5432

   # Or check process
   ps aux | grep postgres
   ```

2. **Start PostgreSQL:**

   ```bash
   # macOS (Homebrew)
   brew services start postgresql@15

   # Docker
   docker start postgres-liaizen

   # Linux
   sudo systemctl start postgresql
   ```

3. **Check port:**
   ```bash
   # Verify port 5432 is listening
   lsof -i :5432
   # Or
   netstat -an | grep 5432
   ```

### Issue: Authentication failed

**Causes:**

- Wrong password
- Wrong username
- Database doesn't exist

**Solutions:**

1. **Verify credentials in DATABASE_URL:**

   ```
   postgresql://username:password@localhost:5432/database
   ```

2. **Test connection manually:**

   ```bash
   psql -h localhost -U postgres -d liaizen_dev
   ```

3. **Reset password (if needed):**
   ```bash
   psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
   ```

### Issue: Database does not exist

**Solution:**

```bash
createdb liaizen_dev
# Or
psql -U postgres -c "CREATE DATABASE liaizen_dev;"
```

---

## .env File Location

Create `.env` file in the **chat-server** directory:

```
chat-server/.env
```

Example `.env` file:

```env
DATABASE_URL=postgresql://postgres:devpass@localhost:5432/liaizen_dev
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-here
```

**Note:** Add `.env` to `.gitignore` to avoid committing credentials.

---

## Next Steps

After connecting:

1. **Run migrations:**

   ```bash
   cd chat-server
   npm run migrate
   # Or
   node run-migration.js
   ```

2. **Verify tables exist:**

   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

---

## Quick Reference

### Default PostgreSQL Connection Info (Local)

- **Host:** localhost
- **Port:** 5432
- **Username:** postgres (default)
- **Database:** liaizen_dev (create this)
- **Password:** (set when installing PostgreSQL, or use Docker with password above)

### Docker Quick Commands

```bash
# Start
docker start postgres-liaizen

# Stop
docker stop postgres-liaizen

# Remove
docker rm postgres-liaizen

# View logs
docker logs postgres-liaizen

# Connect to database
docker exec -it postgres-liaizen psql -U postgres -d liaizen_dev
```
