#!/usr/bin/env node
/**
 * PID Manager Utility
 *
 * Manages process ID files for tracking running processes.
 * Single Responsibility: PID file operations only.
 *
 * @module lib/pid-manager
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';

/**
 * PID Manager class
 *
 * Handles creating, reading, and cleaning up PID files.
 * Thread-safe operations.
 */
export class PidManager {
  /**
   * @param {string} pidFile - Path to PID file
   */
  constructor(pidFile) {
    this.pidFile = pidFile;
    this._ensureDirectory();
  }

  /**
   * Ensure PID file directory exists
   * @private
   */
  _ensureDirectory() {
    try {
      const dir = dirname(this.pidFile);
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
  }

  /**
   * Check if PID file exists
   * @returns {boolean}
   */
  exists() {
    return existsSync(this.pidFile);
  }

  /**
   * Read PID from file
   * @returns {number|null} PID or null if file doesn't exist
   */
  read() {
    if (!this.exists()) {
      return null;
    }

    try {
      const content = readFileSync(this.pidFile, 'utf8').trim();
      const pid = parseInt(content, 10);
      return isNaN(pid) ? null : pid;
    } catch (error) {
      return null;
    }
  }

  /**
   * Write PID to file
   * @param {number} pid - Process ID
   * @throws {Error} If PID is invalid
   */
  write(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new Error(`Invalid PID: ${pid}`);
    }

    try {
      writeFileSync(this.pidFile, `${pid}\n`, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write PID file: ${error.message}`);
    }
  }

  /**
   * Remove PID file
   * @returns {boolean} True if file was removed, false if it didn't exist
   */
  remove() {
    if (!this.exists()) {
      return false;
    }

    try {
      unlinkSync(this.pidFile);
      return true;
    } catch (error) {
      // File might have been removed by another process
      return false;
    }
  }
}
