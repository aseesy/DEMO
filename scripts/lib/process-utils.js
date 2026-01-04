#!/usr/bin/env node
/**
 * Process Utilities
 *
 * Cross-platform process management utilities.
 * Single Responsibility: Process operations only.
 *
 * @module lib/process-utils
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a process is running
 *
 * @param {number} pid - Process ID
 * @returns {Promise<boolean>} True if process is running
 */
export async function isProcessRunning(pid) {
  try {
    if (process.platform === 'win32') {
      // Windows: Use tasklist
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}"`);
      return stdout.includes(`${pid}`);
    } else {
      // Unix-like: Use ps
      await execAsync(`ps -p ${pid} > /dev/null 2>&1`);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get process CPU usage percentage
 *
 * @param {number} pid - Process ID
 * @returns {Promise<number|null>} CPU percentage or null if unavailable
 */
export async function getProcessCpuUsage(pid) {
  try {
    if (process.platform === 'win32') {
      // Windows: Use wmic
      const { stdout } = await execAsync(
        `wmic process where processid=${pid} get PercentProcessorTime /format:value`
      );
      const match = stdout.match(/PercentProcessorTime=(\d+)/);
      return match ? parseFloat(match[1]) : null;
    } else {
      // Unix-like: Use ps
      const { stdout } = await execAsync(`ps -p ${pid} -o %cpu=`);
      const cpu = parseFloat(stdout.trim());
      return isNaN(cpu) ? null : cpu;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Get all processes matching a pattern
 *
 * @param {string[]} patterns - Process name patterns (e.g., ['node', 'npm'])
 * @returns {Promise<Array<{pid: number, cpu: number, name: string}>>} Array of processes
 */
export async function getProcessesByPattern(patterns) {
  try {
    if (process.platform === 'win32') {
      // Windows implementation
      const { stdout } = await execAsync('tasklist /FO CSV /NH');
      const lines = stdout.split('\n').filter(line => line.trim());

      return lines
        .map(line => {
          // Parse CSV format: "process.exe","PID","Session Name","Session#","Mem Usage"
          const match = line.match(/^"([^"]+)","(\d+)"/);
          if (!match) return null;

          const name = match[1].toLowerCase().replace('.exe', '');
          const pid = parseInt(match[2], 10);

          if (!patterns.some(p => name.includes(p.toLowerCase()))) {
            return null;
          }

          return { pid, name, cpu: 0 }; // CPU would require additional query
        })
        .filter(Boolean);
    } else {
      // Unix-like: Use ps
      const pattern = patterns.join('|');
      const { stdout } = await execAsync(
        `ps -eo pid,%cpu,comm | grep -E '${pattern}' | grep -v grep || true`
      );

      if (!stdout.trim()) {
        return [];
      }

      return stdout
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[0], 10);
          const cpu = parseFloat(parts[1]) || 0;
          const name = parts.slice(2).join(' ');

          return { pid, cpu, name };
        })
        .filter(p => !isNaN(p.pid));
    }
  } catch (error) {
    return [];
  }
}

/**
 * Kill a process gracefully, then forcefully if needed
 *
 * @param {number} pid - Process ID
 * @param {Object} options - Kill options
 * @param {number} options.timeout - Grace period in ms (default: 1000)
 * @param {Function} options.signal - Signal to send first (default: SIGTERM)
 * @returns {Promise<boolean>} True if process was killed
 */
export async function killProcess(pid, { timeout = 1000, signal = 'SIGTERM' } = {}) {
  try {
    if (!(await isProcessRunning(pid))) {
      return false; // Already dead
    }

    // Try graceful termination
    process.kill(pid, signal);

    // Wait for process to die
    await new Promise(resolve => setTimeout(resolve, timeout));

    // Check if still running
    if (await isProcessRunning(pid)) {
      // Force kill
      process.kill(pid, 'SIGKILL');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return !(await isProcessRunning(pid));
  } catch (error) {
    // Process might not exist or we don't have permission
    return false;
  }
}

/**
 * Kill all processes matching patterns
 *
 * @param {string[]} patterns - Process name patterns
 * @param {Object} options - Kill options
 * @returns {Promise<number>} Number of processes killed
 */
export async function killProcessesByPattern(patterns, options = {}) {
  const processes = await getProcessesByPattern(patterns);
  let killed = 0;

  for (const proc of processes) {
    if (await killProcess(proc.pid, options)) {
      killed++;
    }
  }

  return killed;
}

/**
 * Get process on a specific port
 *
 * @param {number} port - Port number
 * @returns {Promise<number|null>} PID of process using port, or null
 */
export async function getProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows: Use netstat
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const match = stdout.match(/\s+(\d+)\s*$/);
      return match ? parseInt(match[1], 10) : null;
    } else {
      // Unix-like: Use lsof
      const { stdout } = await execAsync(`lsof -ti:${port} 2>/dev/null || true`);
      const pid = parseInt(stdout.trim(), 10);
      return isNaN(pid) ? null : pid;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Kill process on a specific port
 *
 * @param {number} port - Port number
 * @returns {Promise<boolean>} True if process was killed
 */
export async function killProcessOnPort(port) {
  const pid = await getProcessOnPort(port);
  if (!pid) {
    return false;
  }
  return await killProcess(pid);
}
