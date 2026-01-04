#!/usr/bin/env node
/**
 * Cross-Platform Utilities
 *
 * Provides cross-platform abstractions for common operations.
 * Single Responsibility: Platform abstraction layer.
 *
 * @module lib/cross-platform
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);
const IS_WINDOWS = platform() === 'win32';

/**
 * Execute a command and return output
 * Works on Windows, macOS, and Linux
 *
 * @param {string} command - Command to execute
 * @param {Object} options - Execution options
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
export async function execCommand(command, options = {}) {
  try {
    return await execAsync(command, {
      shell: IS_WINDOWS ? 'cmd.exe' : '/bin/sh',
      ...options,
    });
  } catch (error) {
    // Return error output for inspection
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      code: error.code,
    };
  }
}

/**
 * Check if a command exists in PATH
 *
 * @param {string} command - Command name
 * @returns {Promise<boolean>}
 */
export async function commandExists(command) {
  try {
    if (IS_WINDOWS) {
      const { stdout } = await execAsync(`where ${command}`, { timeout: 5000 });
      return stdout.trim().length > 0;
    } else {
      const { stdout } = await execAsync(`which ${command}`, { timeout: 5000 });
      return stdout.trim().length > 0;
    }
  } catch {
    return false;
  }
}

/**
 * Find files using cross-platform method
 *
 * @param {string} pattern - Glob pattern
 * @param {string} cwd - Working directory
 * @returns {Promise<string[]>}
 */
export async function findFiles(pattern, cwd = process.cwd()) {
  try {
    // Use Node.js built-in or npm package glob
    // For now, simple implementation
    if (IS_WINDOWS) {
      const { stdout } = await execAsync(`dir /s /b ${pattern}`, { cwd, timeout: 10000 });
      return stdout.split('\n').filter(Boolean);
    } else {
      const { stdout } = await execAsync(`find . -name "${pattern}" -type f`, {
        cwd,
        timeout: 10000,
      });
      return stdout.split('\n').filter(Boolean);
    }
  } catch {
    return [];
  }
}

/**
 * Get file size in human-readable format (cross-platform)
 *
 * @param {string} filePath - Path to file or directory
 * @returns {Promise<string>} Human-readable size (e.g., "1.2 MB")
 */
export async function getFileSize(filePath) {
  try {
    if (IS_WINDOWS) {
      // PowerShell command for Windows
      const { stdout } = await execAsync(
        `powershell -Command "(Get-Item '${filePath}').Length / 1MB"`,
        { timeout: 5000 }
      );
      const mb = parseFloat(stdout.trim());
      return `${mb.toFixed(2)} MB`;
    } else {
      // Unix-like systems
      const { stdout } = await execAsync(`du -sh "${filePath}"`, { timeout: 5000 });
      return stdout.split('\t')[0].trim();
    }
  } catch (error) {
    return 'unknown size';
  }
}

/**
 * Process stdin through xargs (cross-platform)
 * Falls back to Node.js implementation on Windows
 *
 * @param {string[]} stdinLines - Lines from stdin
 * @param {string} command - Command to execute for each line
 * @returns {Promise<Array<{input: string, output: string, error?: string}>>}
 */
export async function xargs(stdinLines, command) {
  const results = [];

  if (!IS_WINDOWS && (await commandExists('xargs'))) {
    // Use native xargs on Unix-like systems
    try {
      const input = stdinLines.join('\n');
      const { stdout, stderr } = await execAsync(`echo "${input}" | xargs -I {} ${command}`, {
        timeout: 30000,
      });
      return stdinLines.map(line => ({
        input: line,
        output: stdout,
        error: stderr || undefined,
      }));
    } catch (error) {
      // Fall through to Node.js implementation
    }
  }

  // Node.js implementation (works everywhere)
  for (const line of stdinLines) {
    if (!line.trim()) continue;

    try {
      const cmd = command.replace('{}', line.trim());
      const { stdout, stderr } = await execAsync(cmd, { timeout: 10000 });
      results.push({
        input: line,
        output: stdout,
        error: stderr || undefined,
      });
    } catch (error) {
      results.push({
        input: line,
        output: '',
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Check if Python is available
 *
 * @param {number} minVersion - Minimum Python version (default: 3)
 * @returns {Promise<{available: boolean, version?: string, path?: string}>}
 */
export async function checkPython(minVersion = 3) {
  const commands = IS_WINDOWS ? ['python', 'py', 'python3'] : ['python3', 'python'];

  for (const cmd of commands) {
    if (await commandExists(cmd)) {
      try {
        const { stdout } = await execAsync(`${cmd} --version`, { timeout: 5000 });
        const versionMatch = stdout.match(/Python (\d+)/);
        if (versionMatch) {
          const version = parseInt(versionMatch[1]);
          if (version >= minVersion) {
            return {
              available: true,
              version: stdout.trim(),
              path: cmd,
            };
          }
        }
      } catch {
        continue;
      }
    }
  }

  return { available: false };
}

/**
 * Platform-specific path separator
 */
export const PATH_SEP = IS_WINDOWS ? ';' : ':';

/**
 * Platform-specific newline
 */
export const NEWLINE = IS_WINDOWS ? '\r\n' : '\n';
