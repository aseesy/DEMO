# Socket.IO Integration Tests

## Overview

Comprehensive integration tests for Socket.IO connections, reconnection logic, and error handling. These tests verify fixes for known issues:

- ✅ Socket.IO connection failures
- ✅ Reconnection loops
- ✅ Connection error handling
- ✅ Multiple client connections
- ✅ Room joining/leaving
- ✅ Message handling

## Test Coverage

### Connection Tests
- Successful connection
- Connection error handling
- Polling fallback when websocket fails

### Reconnection Logic Tests
- Respects `reconnectionAttempts` limit
- Respects `reconnectionDelayMax` cap
- Stops reconnecting after max attempts

### Room Joining Tests
- Successful room join
- Error handling for invalid join data

### Message Handling Tests
- Send and receive messages
- Message persistence

### Disconnection Tests
- Graceful disconnection
- No reconnection after manual disconnect

### Multiple Clients Tests
- Concurrent connections
- Room isolation

### Error Handling Tests
- Verbose error suppression
- Graceful error recovery

## Running Tests

### Prerequisites

1. **Start the server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Set environment variables** (optional):
   ```bash
   export TEST_SERVER_URL=http://localhost:3000
   export TEST_EMAIL=test@example.com
   ```

### Run Tests

```bash
# Run all socket integration tests
npm test -- socket.integration.test.js

# Run with coverage
npm test -- --coverage socket.integration.test.js

# Skip socket tests (if server not available)
SKIP_SOCKET_TESTS=true npm test -- socket.integration.test.js
```

## Test Configuration

Tests can be configured via environment variables:

- `TEST_SERVER_URL` - Server URL (default: `http://localhost:3000`)
- `TEST_EMAIL` - Test user email (default: `test@example.com`)
- `SKIP_SOCKET_TESTS` - Skip tests if server unavailable (default: `false`)

## Known Issues Tested

### 1. Reconnection Loops
Tests verify that:
- Reconnection stops after `reconnectionAttempts` limit
- `reconnectionDelayMax` caps the exponential backoff
- Manual disconnects don't trigger reconnection

### 2. Connection Failures
Tests verify that:
- Connection errors are handled gracefully
- Polling fallback works when websocket fails
- Timeouts are respected

### 3. Error Suppression
Tests verify that:
- Verbose Socket.IO errors don't crash the client
- Reconnection errors are handled without console spam

## Integration with CI/CD

To run in CI/CD:

```yaml
# Example GitHub Actions
- name: Start server
  run: npm start &
  
- name: Wait for server
  run: sleep 5
  
- name: Run socket tests
  run: npm test -- socket.integration.test.js
```

## Troubleshooting

### Tests fail with "Connection timeout"
- Ensure server is running on `TEST_SERVER_URL`
- Check server logs for errors
- Verify CORS settings allow test connections

### Tests fail with "Join timeout"
- Verify test user exists in database
- Check authentication requirements
- Review server logs for join errors

### Tests hang indefinitely
- Check for socket leaks (not disconnecting)
- Verify timeout settings are appropriate
- Review server connection limits

## Related Files

- `socketHandlers/` - Socket handler implementations
- `scripts/test-message-sending.js` - Manual test script
- `scripts/test-message-persistence-e2e.js` - E2E test script
- `config.js` - Socket.IO configuration

