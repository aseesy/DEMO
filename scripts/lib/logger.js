#!/usr/bin/env node
/**
 * Logger Utility
 *
 * Provides consistent, structured logging across all scripts.
 * Single Responsibility: Logging only.
 *
 * @module lib/logger
 */

import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Log levels
 */
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Color mapping for log levels
 */
const levelColors = {
  [LogLevel.ERROR]: 'red',
  [LogLevel.WARN]: 'yellow',
  [LogLevel.INFO]: 'green',
  [LogLevel.DEBUG]: 'blue',
};

/**
 * Logger class
 *
 * Handles both console output and file logging.
 * Thread-safe operations for file writes.
 */
export class Logger {
  /**
   * @param {Object} options - Logger configuration
   * @param {string} options.logFile - Path to log file (optional)
   * @param {number} options.level - Minimum log level (default: INFO)
   * @param {boolean} options.color - Enable colored output (default: true)
   */
  constructor({ logFile = null, level = LogLevel.INFO, color = true } = {}) {
    this.logFile = logFile;
    this.level = level;
    this.color = color;

    // Ensure log directory exists
    if (this.logFile) {
      try {
        mkdirSync(dirname(this.logFile), { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore
      }
    }
  }

  /**
   * Format timestamp for logs
   * @private
   */
  _timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Write to log file if configured
   * @private
   */
  _writeToFile(level, message) {
    if (!this.logFile) return;

    try {
      const logLine = `[${this._timestamp()}] [${level}] ${message}\n`;
      appendFileSync(this.logFile, logLine, 'utf8');
    } catch (error) {
      // Silently fail if file write fails (non-critical)
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Format console output
   * @private
   */
  _format(level, message) {
    const colorCode = this.color ? colors[levelColors[level]] : '';
    const resetCode = this.color ? colors.reset : '';
    const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level);

    return `${colorCode}[${levelName}]${resetCode} ${message}`;
  }

  /**
   * Log a message at specified level
   * @private
   */
  _log(level, message) {
    if (level > this.level) return;

    const formatted = this._format(level, message);
    console.log(formatted);
    this._writeToFile(
      Object.keys(LogLevel).find(key => LogLevel[key] === level),
      message
    );
  }

  /**
   * Log error message
   */
  error(message) {
    this._log(LogLevel.ERROR, message);
  }

  /**
   * Log warning message
   */
  warn(message) {
    this._log(LogLevel.WARN, message);
  }

  /**
   * Log info message
   */
  info(message) {
    this._log(LogLevel.INFO, message);
  }

  /**
   * Log debug message
   */
  debug(message) {
    this._log(LogLevel.DEBUG, message);
  }
}

/**
 * Create a logger instance with default configuration
 * @param {Object} options - Logger options
 * @returns {Logger}
 */
export function createLogger(options = {}) {
  return new Logger(options);
}
