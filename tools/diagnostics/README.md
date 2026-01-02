# Socket Connection Diagnostic Tool

## Purpose

Helps diagnose socket connection issues by analyzing logs and identifying common failure patterns.

## Usage

### Analyze a log file:

```bash
python3 tools/diagnostics/socket_connection.py --file path/to/logs.txt
```

### Analyze from stdin (paste logs):

```bash
cat logs.txt | python3 tools/diagnostics/socket_connection.py --stdin
```

### Save report to file:

```bash
python3 tools/diagnostics/socket_connection.py --file logs.txt --output report.txt
```

## What It Detects

1. **connect() called but io() never initialized**
   - Indicates connect() is failing silently before io() runs
   - Common issue: socketService.connect() returns but socket.io() never executes

2. **Token Missing**
   - Authentication token not available when connect() is called

3. **Transport Errors**
   - Network connectivity issues
   - Server unavailable
   - URL configuration problems

4. **Invalid State Transitions**
   - State machine violations
   - Race conditions in connection lifecycle

## Integration with SocketDiagnostic Component

You can export logs from the browser's SocketDiagnostic component and analyze them:

1. Open SocketDiagnostic page (`/socket-diagnostic`)
2. Copy the Event Log output
3. Save to a file or pipe to this tool

## Example Output

```
======================================================================
Socket Connection Diagnostic Report
======================================================================
Generated: 2025-01-02T12:00:00
Total Events Analyzed: 15

ISSUES DETECTED:
----------------------------------------------------------------------
[HIGH] io_not_initialized
  Message: socketService.connect() was called but socket.io() was never initialized
  Recommendation: Check if socket.io() runs after connect() call. This indicates connect() is failing silently before io() runs.

STATE SEQUENCE:
----------------------------------------------------------------------
disconnected -> connecting -> disconnected

EVENT TIMELINE (first 10 events):
----------------------------------------------------------------------
  [2025-01-02T12:00:00] connect_called: {'message': 'socketService.connect() was called'}
  [2025-01-02T12:00:01] connection_state_change: {'state': 'connecting'}
  ...
======================================================================
```
