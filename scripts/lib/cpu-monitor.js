#!/usr/bin/env node
/**
 * CPU Monitor
 *
 * Monitors CPU usage of processes and tracks violations.
 * Single Responsibility: CPU monitoring logic only.
 *
 * @module lib/cpu-monitor
 */

import { getProcessesByPattern, killProcess } from './process-utils.js';

/**
 * CPU Monitor class
 *
 * Tracks high-CPU processes and manages grace periods.
 */
export class CpuMonitor {
  /**
   * @param {Object} config - Monitor configuration
   * @param {number} config.threshold - CPU threshold percentage (default: 80)
   * @param {number} config.gracePeriod - Consecutive violations before kill (default: 3)
   * @param {string[]} config.patterns - Process name patterns to monitor (default: node-related)
   */
  constructor({
    threshold = 80,
    gracePeriod = 3,
    patterns = ['node', 'npm', 'vitest', 'jest', 'esbuild', 'vite'],
  } = {}) {
    this.threshold = threshold;
    this.gracePeriod = gracePeriod;
    this.patterns = patterns;

    // Track violation counts per PID
    this.violationCounts = new Map();
  }

  /**
   * Check all monitored processes
   *
   * @returns {Promise<Array<{pid: number, cpu: number, name: string, violations: number}>>}
   *   Array of processes exceeding threshold
   */
  async check() {
    const processes = await getProcessesByPattern(this.patterns);
    const violations = [];

    for (const proc of processes) {
      const cpuPercent = Math.floor(proc.cpu); // Integer part

      if (cpuPercent >= this.threshold) {
        // Increment violation count
        const currentCount = this.violationCounts.get(proc.pid) || 0;
        const newCount = currentCount + 1;
        this.violationCounts.set(proc.pid, newCount);

        violations.push({
          pid: proc.pid,
          cpu: cpuPercent,
          name: proc.name,
          violations: newCount,
        });
      } else {
        // Process is below threshold, reset counter
        this.violationCounts.delete(proc.pid);
      }
    }

    return violations;
  }

  /**
   * Check if a process should be killed
   *
   * @param {number} violations - Number of consecutive violations
   * @returns {boolean}
   */
  shouldKill(violations) {
    return violations >= this.gracePeriod;
  }

  /**
   * Kill a process that exceeded grace period
   *
   * @param {number} pid - Process ID
   * @returns {Promise<boolean>} True if process was killed
   */
  async killViolator(pid) {
    const killed = await killProcess(pid, { timeout: 1000 });
    if (killed) {
      this.violationCounts.delete(pid);
    }
    return killed;
  }

  /**
   * Clear violation tracking for a process
   *
   * @param {number} pid - Process ID
   */
  clearViolations(pid) {
    this.violationCounts.delete(pid);
  }

  /**
   * Reset all violation tracking
   */
  reset() {
    this.violationCounts.clear();
  }
}
