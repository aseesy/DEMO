# Production Database Wipe Instructions

## ⚠️ CRITICAL WARNING ⚠️

This will **permanently delete ALL user data** from the production database:
- All users
- All messages
- All conversation history
- All emails and names
- All contacts, tasks, activities, etc.

**The schema will be preserved** - all tables will remain intact.

## Prerequisites

1. **Backup First** (if needed):
   ```bash
   # Create a backup before wiping (optional but recommended)
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify DATABASE_URL**:
   ```bash
   echo $DATABASE_URL
   # Make sure this points to the correct database!
   ```

## Execution Steps

### Option 1: Run from Local Machine

```bash
# 1. SSH into production server or set DATABASE_URL locally
export DATABASE_URL="your_production_database_url"

# 2. Navigate to server directory
cd chat-server

# 3. Run the wipe script
node scripts/wipe_all_data.js
```

### Option 2: Run on Railway/Production Server

```bash
# 1. SSH into Railway or use Railway CLI
railway shell

# 2. Navigate to directory
cd chat-server

# 3. Run the wipe script
node scripts/wipe_all_data.js
```

## What the Script Does

1. Connects to PostgreSQL database using `DATABASE_URL`
2. Lists all existing tables
3. Truncates only tables that exist (skips missing ones)
4. Uses `CASCADE` to handle foreign key constraints
5. Verifies schema is preserved

## Expected Output

```
🗑️  Wiping all user data from database...
⚠️  This will delete ALL data but keep the schema intact
📊 Found 34 tables: [list of tables]
⚠️  Skipping 3 tables that don't exist: [missing tables]
✅ Will truncate 19 tables: [tables to wipe]
✅ All user data wiped successfully!
✅ Schema preserved - all tables still exist
✅ Verified: 34 tables still exist
```

## Verification

After running the script:

```bash
# Check that tables still exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Verify users table is empty
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# Should return: 0

# Verify messages table is empty
psql $DATABASE_URL -c "SELECT COUNT(*) FROM messages;"
# Should return: 0
```

## Post-Wipe Steps

1. **Restart Server**: The server should continue running normally
2. **Test Signup**: Create a new user to verify everything works
3. **Monitor Logs**: Check for any errors

## Rollback (if backup was created)

```bash
# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## Safety Notes

- ✅ Script checks for table existence before truncating
- ✅ Uses CASCADE to handle foreign keys properly
- ✅ Preserves all schema and table structure
- ✅ Does NOT drop tables
- ✅ Does NOT modify schema
- ❌ **CANNOT BE UNDONE** without a backup

## Development vs Production

The same script works for both:
- **Development**: Uses local `DATABASE_URL` from `.env`
- **Production**: Uses production `DATABASE_URL` from environment

**Always double-check which database you're connected to!**
