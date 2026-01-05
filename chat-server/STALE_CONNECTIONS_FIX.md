# Stale Connections and Cached Data - Diagnostic Results

## Issues Found

### 1. Multiple Server Processes

**Problem**: 3 server processes were running simultaneously (PIDs 73760, 17684, 16692)

**Impact**:

- Socket connections can connect to different processes
- Logs are split across processes (hard to debug)
- Race conditions in database operations
- Stale connections from old processes

**Solution**: Kill old processes and restart cleanly

```bash
# Kill old processes
kill <old_pid>

# Restart server
cd chat-server && npm start
```

### 2. Stale server.log File

**Problem**: `server.log` file is from December 22, 2025 (old)

**Impact**:

- Backend logs to stdout/stderr (console.log), not to server.log
- server.log is not being updated
- Need to check process stdout/stderr directly

**Solution**:

- Use `server-output.log` for redirected output
- Or check process stdout/stderr directly
- Or use `pm2` or similar process manager for log management

### 3. No Threads Exist (Analysis Should Run)

**Status**:

- 0 threads in database
- 5,326 messages in room (all unthreaded)
- Analysis should trigger on next join

**Why Analysis Might Not Run**:

1. `maybeAnalyzeRoomOnJoin` might not be called (check if `services.threadManager` exists)
2. Function might be failing silently before first console.log
3. Socket connection might be going to wrong server process

### 4. Message Store (No Cache Issue)

**Status**: ✅ No in-memory cache

- `messageStore.js` queries database directly
- No stale cache to worry about
- Messages are always fresh from database

## Diagnostic Script

Created `check-stale-connections.js` to diagnose:

- Thread count and status
- Message count per room
- Server process count
- Analysis readiness

Usage:

```bash
cd chat-server
node check-stale-connections.js <roomId>
```

## Next Steps

1. ✅ Kill old server processes
2. ✅ Restart server cleanly
3. ⏳ Monitor logs for `maybeAnalyzeRoomOnJoin` debug output
4. ⏳ Verify socket connects to correct process
5. ⏳ Check if analysis runs on next user join

## Prevention

1. Use process manager (pm2, forever, systemd) to prevent multiple instances
2. Add health check endpoint to detect multiple processes
3. Add startup check to kill old processes automatically
4. Use structured logging (winston, pino) instead of console.log
