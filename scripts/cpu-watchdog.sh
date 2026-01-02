#!/usr/bin/env bash
#
# CPU Watchdog - Monitors CPU usage and kills runaway Node processes
#
# Usage:
#   ./scripts/cpu-watchdog.sh        # Run in foreground
#   ./scripts/cpu-watchdog.sh &      # Run in background
#   npm run dev:safe                 # Run dev with watchdog
#
# Configuration via environment variables:
#   CPU_THRESHOLD=80      # Kill processes above this % (default: 80)
#   CHECK_INTERVAL=5      # Seconds between checks (default: 5)
#   GRACE_PERIOD=3        # Consecutive checks before kill (default: 3)
#

# Configuration
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
CHECK_INTERVAL="${CHECK_INTERVAL:-5}"
GRACE_PERIOD="${GRACE_PERIOD:-3}"
LOG_FILE="/tmp/cpu-watchdog.log"
PID_FILE="/tmp/cpu-watchdog.pid"
COUNTS_FILE="/tmp/cpu-watchdog-counts"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"

    case "$level" in
        ERROR)   echo -e "${RED}[$level]${NC} $message" ;;
        WARN)    echo -e "${YELLOW}[$level]${NC} $message" ;;
        INFO)    echo -e "${GREEN}[$level]${NC} $message" ;;
        DEBUG)   echo -e "${BLUE}[$level]${NC} $message" ;;
    esac
}

get_count() {
    local pid="$1"
    if [ -f "$COUNTS_FILE" ]; then
        grep "^${pid}:" "$COUNTS_FILE" 2>/dev/null | cut -d: -f2 || echo "0"
    else
        echo "0"
    fi
}

set_count() {
    local pid="$1"
    local count="$2"
    if [ -f "$COUNTS_FILE" ]; then
        grep -v "^${pid}:" "$COUNTS_FILE" > "${COUNTS_FILE}.tmp" 2>/dev/null || true
        mv "${COUNTS_FILE}.tmp" "$COUNTS_FILE"
    fi
    echo "${pid}:${count}" >> "$COUNTS_FILE"
}

clear_count() {
    local pid="$1"
    if [ -f "$COUNTS_FILE" ]; then
        grep -v "^${pid}:" "$COUNTS_FILE" > "${COUNTS_FILE}.tmp" 2>/dev/null || true
        mv "${COUNTS_FILE}.tmp" "$COUNTS_FILE"
    fi
}

cleanup() {
    log "INFO" "CPU Watchdog shutting down..."
    rm -f "$PID_FILE" "$COUNTS_FILE" "${COUNTS_FILE}.tmp"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if already running
if [ -f "$PID_FILE" ]; then
    old_pid=$(cat "$PID_FILE")
    if ps -p "$old_pid" > /dev/null 2>&1; then
        log "WARN" "Watchdog already running (PID: $old_pid). Use 'kill $old_pid' to stop it."
        exit 1
    fi
fi

# Save our PID and clean counts file
echo $$ > "$PID_FILE"
rm -f "$COUNTS_FILE"
touch "$COUNTS_FILE"

log "INFO" "CPU Watchdog started (PID: $$)"
log "INFO" "Settings: threshold=${CPU_THRESHOLD}%, interval=${CHECK_INTERVAL}s, grace=${GRACE_PERIOD} checks"
log "INFO" "Monitoring node, npm, vitest, jest, esbuild, vite processes..."

# Main monitoring loop
while true; do
    # Get CPU-intensive Node-related processes
    # Format: PID CPU_PERCENT COMMAND
    processes=$(ps -eo pid,%cpu,comm 2>/dev/null | grep -E 'node|npm|vitest|jest|esbuild|vite' | grep -v grep || true)

    if [ -n "$processes" ]; then
        echo "$processes" | while IFS= read -r line; do
            pid=$(echo "$line" | awk '{print $1}')
            cpu=$(echo "$line" | awk '{print $2}' | cut -d'.' -f1)  # Integer part
            cmd=$(echo "$line" | awk '{print $3}')

            # Skip empty lines
            [ -z "$pid" ] && continue

            # Skip if CPU is below threshold
            if [ "$cpu" -lt "$CPU_THRESHOLD" ] 2>/dev/null; then
                # Reset counter if process calmed down
                current=$(get_count "$pid")
                if [ "$current" != "0" ] && [ -n "$current" ]; then
                    clear_count "$pid"
                fi
                continue
            fi

            # Increment high-CPU counter
            current_count=$(get_count "$pid")
            [ -z "$current_count" ] && current_count=0
            new_count=$((current_count + 1))
            set_count "$pid" "$new_count"

            log "WARN" "High CPU detected: PID $pid ($cmd) at ${cpu}% [$new_count/$GRACE_PERIOD]"

            # Kill if exceeded grace period
            if [ "$new_count" -ge "$GRACE_PERIOD" ]; then
                log "ERROR" "KILLING runaway process: PID $pid ($cmd) - sustained ${cpu}% CPU"

                # Try graceful termination first
                kill -TERM "$pid" 2>/dev/null || true
                sleep 1

                # Force kill if still running
                if ps -p "$pid" > /dev/null 2>&1; then
                    log "ERROR" "Process $pid didn't respond to SIGTERM, sending SIGKILL"
                    kill -9 "$pid" 2>/dev/null || true
                fi

                clear_count "$pid"

                # Send notification (macOS)
                if command -v osascript &> /dev/null; then
                    osascript -e "display notification \"Killed runaway process: $cmd (PID $pid)\" with title \"CPU Watchdog\" sound name \"Basso\"" 2>/dev/null || true
                fi
            fi
        done
    fi

    sleep "$CHECK_INTERVAL"
done
