# Phase 2 Testing Guide

## Overview
This guide helps you test and verify the Phase 2 reliability improvements:
- Event-Driven Architecture
- Task Manager
- Graceful Shutdown

## Prerequisites
1. Run migration: `npm run migrate` (creates `active_sessions` table)
2. Start server: `npm run dev`

## Testing Tasks

### 1. Test Task Manager

**View Active Tasks:**
```bash
npm run monitor:tasks
```

**Expected Output:**
- List of active background tasks
- Task names, types, and creation times
- Task IDs for reference

**What to Check:**
- Tasks are properly tracked
- Task names are descriptive
- Tasks are created during server startup

### 2. Test Event Bus

**View Recent Events:**
```bash
npm run monitor:events
```

**Expected Output:**
- List of recent events (if any)
- Event timestamps and data

**What to Check:**
- Events are being emitted (if services use EventBus)
- Event history is maintained
- Events have proper data

### 3. Test Graceful Shutdown

**Option A: Manual Test**
1. Start server: `npm run dev`
2. In another terminal, find the process:
   ```bash
   lsof -ti:3000
   ```
3. Send SIGTERM:
   ```bash
   kill -SIGTERM <pid>
   ```

**Option B: Automated Test**
```bash
npm run test:shutdown:kill
```

**Expected Shutdown Sequence:**
```
[Shutdown] Cancelled X background tasks
[Shutdown] Socket.io server closed
[Shutdown] HTTP server closed
[Shutdown] Database connections closed
```

**What to Check:**
- All tasks are cancelled
- Socket.io closes gracefully
- HTTP server closes
- Database connections close
- No hanging processes
- Exit code is 0 (success)

### 4. Test Session Persistence (Phase 1)

**Test Session Recovery:**
1. Start server and connect a client
2. Verify user is in `active_sessions` table:
   ```sql
   SELECT * FROM active_sessions;
   ```
3. Restart server
4. Verify sessions are loaded on startup:
   ```
   [UserSessionService] Loaded X sessions from database
   ```

**What to Check:**
- Sessions persist to database
- Sessions recover on restart
- In-memory cache is populated

### 5. Test Connection Pool Monitoring (Phase 1)

**Check Pool Stats:**
```bash
curl http://localhost:3000/health | jq .database.pool
```

**Expected Output:**
```json
{
  "total": 2,
  "idle": 1,
  "waiting": 0,
  "max": 10,
  "healthy": true
}
```

**What to Check:**
- Pool stats are available
- Pool is healthy (total < max)
- Stats update correctly

## Troubleshooting

### Tasks Not Cancelling
- Check TaskManager is imported correctly
- Verify tasks are registered with TaskManager
- Check shutdown logs for errors

### Database Not Closing
- Verify `dbPostgres` has `.end()` method
- Check for connection pool errors
- Ensure no active queries blocking shutdown

### Events Not Appearing
- Services may not be using EventBus yet
- Check if services emit events
- Verify EventBus is imported correctly

## Next Steps

1. **Integrate EventBus**: Start using EventBus for cross-service communication
2. **Add More Monitoring**: Create dashboards for task/event monitoring
3. **Load Testing**: Test graceful shutdown under load
4. **Documentation**: Document EventBus usage patterns

## Scripts Reference

- `npm run test:shutdown` - Test shutdown instructions
- `npm run test:shutdown:kill` - Automatically test shutdown
- `npm run monitor:tasks` - View active tasks
- `npm run monitor:events` - View recent events

