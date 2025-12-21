# Railway Volume Setup Guide

## Quick Setup

1. **In Railway Dashboard:**
   - Go to your service
   - Click on "Volumes" tab
   - Create a new volume (e.g., name it `data`)
   - Mount it to a path like `/data`

2. **Set Environment Variable:**
   - In Railway service settings → Variables
   - Add: `DB_PATH=/data/chat.db`
   - (Replace `/data` with your actual volume mount path)

3. **Redeploy:**
   - Railway will automatically redeploy
   - Check logs for: `✅ Database directory exists: /data`
   - Check logs for: `✅ Database directory is writable: /data`

## Verify It's Working

After deployment, check your Railway logs for:

✅ **Good signs:**

```
📁 Database path: /data/chat.db
📁 DB_PATH env var: /data/chat.db
✅ Database directory exists: /data
✅ Database directory is writable: /data
✅ Database loaded from file: /data/chat.db (X KB)
📊 Database contains X messages
```

❌ **Bad signs:**

```
⚠️  DB_PATH not set - using default path (ephemeral on Railway/Vercel)
❌ Failed to create database directory
❌ Database directory is NOT writable
❌ Error saving database
```

## Common Issues

### Issue: DB_PATH not set

**Solution:** Add `DB_PATH=/data/chat.db` environment variable (replace `/data` with your volume mount path)

### Issue: Permission denied

**Solution:** Railway volumes should have correct permissions automatically. If not, check volume mount path.

### Issue: Directory doesn't exist

**Solution:** The code will create it automatically, but verify the volume is mounted correctly.

### Issue: Database still not persisting

**Solution:**

1. Verify volume is actually mounted (check Railway dashboard)
2. Check logs for save errors
3. Verify DB_PATH matches volume mount path exactly
4. Check if volume has enough space

## Testing Persistence

1. Send a few messages
2. Check logs for: `💾 Saved new message X to database`
3. Restart/redeploy the service
4. Check logs on startup: `📊 Database contains X messages`
5. If message count is 0 after restart, volume isn't working

## Volume Path Examples

- `/data/chat.db` - Standard Railway volume mount
- `/persistent/chat.db` - Custom volume name
- `/mnt/data/chat.db` - Alternative mount point

**Important:** The path must match exactly what Railway shows in the volume mount configuration.
