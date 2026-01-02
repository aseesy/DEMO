#!/bin/bash
#
# Start development servers with CPU watchdog protection
#
# This script starts:
#   1. CPU watchdog in background (monitors and kills runaway processes)
#   2. Normal dev servers (frontend + backend)
#
# On exit, both watchdog and dev servers are cleaned up.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🛡️  Starting development with CPU watchdog protection${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"

    # Stop watchdog
    if [ -f /tmp/cpu-watchdog.pid ]; then
        watchdog_pid=$(cat /tmp/cpu-watchdog.pid)
        if ps -p "$watchdog_pid" > /dev/null 2>&1; then
            echo "Stopping CPU watchdog (PID: $watchdog_pid)..."
            kill "$watchdog_pid" 2>/dev/null || true
        fi
    fi

    # Stop dev servers
    "$SCRIPT_DIR/stop-dev.sh" 2>/dev/null || true

    echo -e "${GREEN}Cleanup complete${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start watchdog in background
echo -e "${YELLOW}Starting CPU watchdog...${NC}"
"$SCRIPT_DIR/cpu-watchdog.sh" &
WATCHDOG_PID=$!
sleep 1

if ps -p "$WATCHDOG_PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ CPU watchdog running (PID: $WATCHDOG_PID)${NC}"
    echo -e "  Settings: CPU threshold 80%, check every 5s, kill after 3 consecutive high readings"
    echo -e "  Log file: /tmp/cpu-watchdog.log"
else
    echo -e "${YELLOW}⚠ CPU watchdog failed to start, continuing without protection${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Starting dev servers...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Start dev servers (this blocks)
"$SCRIPT_DIR/start-dev.sh"
