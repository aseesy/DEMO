# Restart Servers Script

Automated script to kill and restart development servers with automatic import issue detection and fixing.

## Usage

### Restart Both Servers
```bash
./restart-servers.sh
# or
npm run restart
```

### Restart Only Backend
```bash
./restart-servers.sh backend
# or
npm run restart:backend
```

### Restart Only Frontend
```bash
./restart-servers.sh frontend
# or
npm run restart:frontend
```

## Automatic Fixes

The script automatically detects and fixes common issues:

### ✅ Import Path Fixes
- **errorHandler.js → errorHandler.jsx**: Automatically corrects imports when the file contains JSX
- **Double extensions (.jsxx)**: Fixes cases where replacements created invalid extensions
- **Missing file detection**: Warns about potentially missing imported files

### ✅ Pre-Startup Checks
- **Syntax validation**: Checks for JavaScript syntax errors before starting
- **Environment validation**: Verifies .env file exists for backend
- **Dependency check**: Installs npm packages if node_modules is missing

### ✅ Build Error Detection
- **Vite errors**: Monitors build logs for import resolution errors
- **Error reporting**: Shows recent errors from build logs
- **Health verification**: Confirms servers started successfully

## What Gets Fixed Automatically

1. **File Extension Mismatches**
   - Detects when `.jsx` files are imported as `.js`
   - Automatically updates imports to correct extensions
   - Prevents double-extension issues (`.jsxx`)

2. **Missing File Detection**
   - Scans all import statements
   - Warns about files that don't exist
   - Helps catch typos and missing files early

3. **Common Import Patterns**
   - Fixes `errorHandler.js` → `errorHandler.jsx`
   - Handles relative import paths correctly
   - Preserves existing correct imports

## Server Ports

- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

## Logs

View server logs in real-time:
```bash
# Backend logs
tail -f /tmp/chat-server.log

# Frontend logs
tail -f /tmp/vite-dev.log
```

## Example Output

```
🔄 Restarting Development Servers
==================================

🛑 Stopping Backend server (port 3001)...
✅ Backend server stopped

🚀 Starting backend server...
   Waiting for server to start...
✅ Backend server started on port 3001 (PID: 12345)

🚀 Starting frontend server...
🔍 Checking for common import issues...
   Fixing: Updating errorHandler.js imports to errorHandler.jsx
   ✅ Fixed 1 import issue(s)
   ✅ No import issues found
   Waiting for Vite to start...
✅ Frontend server started on port 5173 (PID: 12346)

✅ Server restart complete!
```

## When to Use

Use this script when:
- ✅ You've made backend code changes
- ✅ You've changed environment variables
- ✅ You see import resolution errors
- ✅ Servers are stuck or not responding
- ✅ You want a fresh restart with automatic fixes

**Note**: Frontend changes (React components) are usually picked up automatically by Vite's Hot Module Replacement (HMR), so you typically only need to restart the backend.

## Troubleshooting

### Import Errors Still Appear
1. Check the logs: `tail -f /tmp/vite-dev.log`
2. Verify the file exists: `ls -la chat-client-vite/src/utils/errorHandler.jsx`
3. Check import syntax: Ensure quotes match (`'` vs `"`)
4. Run the script again - it will attempt to fix issues

### Server Won't Start
1. Check syntax: The script validates syntax before starting
2. Check logs: `tail -f /tmp/chat-server.log` or `/tmp/vite-dev.log`
3. Verify ports are free: `lsof -ti:3001 -ti:5173`
4. Check environment: Ensure `.env` file exists in `chat-server/`

### Build Errors
1. The script detects build errors automatically
2. Check the output for "Potential build errors detected"
3. Review the error messages shown
4. Fix the issues and restart

## Features

- ✅ Automatic import path correction
- ✅ Missing file detection
- ✅ Syntax validation
- ✅ Build error monitoring
- ✅ Health verification
- ✅ Clear status messages
- ✅ Log file management
