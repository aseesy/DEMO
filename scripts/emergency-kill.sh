#!/bin/bash
#
# Emergency Kill - Nuclear option for frozen development
#
# Run this when your computer is freezing due to runaway Node processes.
# It kills ALL Node-related processes for this project.
#
# Usage:
#   ./scripts/emergency-kill.sh
#   npm run kill:emergency
#

echo "🚨 EMERGENCY KILL - Terminating all Node processes..."

# Kill by process name
killall -9 node 2>/dev/null && echo "✓ Killed node processes" || echo "- No node processes"
killall -9 npm 2>/dev/null && echo "✓ Killed npm processes" || echo "- No npm processes"
killall -9 vite 2>/dev/null && echo "✓ Killed vite processes" || echo "- No vite processes"
killall -9 esbuild 2>/dev/null && echo "✓ Killed esbuild processes" || echo "- No esbuild processes"
killall -9 vitest 2>/dev/null && echo "✓ Killed vitest processes" || echo "- No vitest processes"
killall -9 jest 2>/dev/null && echo "✓ Killed jest processes" || echo "- No jest processes"

# Kill by port (dev ports)
for port in 3000 5173 8080; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        kill -9 $pid 2>/dev/null && echo "✓ Killed process on port $port (PID: $pid)"
    fi
done

# Clean up watchdog
if [ -f /tmp/cpu-watchdog.pid ]; then
    rm -f /tmp/cpu-watchdog.pid
    echo "✓ Cleaned up watchdog PID file"
fi

echo ""
echo "✅ Emergency kill complete. Your system should recover shortly."
echo ""
echo "If still frozen, try: sudo purge (clears disk cache)"
