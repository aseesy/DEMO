# Socket Connection Issues - Root Cause Analysis

## Problems Identified

### 1. Client-Side Issues (SocketService.v2.js)
- **`forceNew: true`** - Creates new connection every time, causing connection churn
- **Redundant token passing** - Both `auth: { token }` and `query: { token }` 
- **Aggressive cleanup** - Disconnects and nulls socket too quickly
- **No connection state protection** - Multiple connect() calls can create race conditions

### 2. Server-Side Issues
- **Test middleware** - Unnecessary pass-through middleware in sockets.js
- **Token validation** - Multiple token sources but no clear priority

### 3. Connection Flow Issues
- Socket connects but immediately disconnects
- No retry logic with backoff
- No connection state persistence

## Surgical Fixes Needed

1. Remove `forceNew: true` - only create new connection when truly needed
2. Improve connection state management - prevent multiple simultaneous connections
3. Add connection retry with exponential backoff
4. Simplify token passing - use only `auth` object
5. Add connection state guards
6. Improve error handling and logging

