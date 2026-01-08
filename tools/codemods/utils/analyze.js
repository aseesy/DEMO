#!/usr/bin/env node
/**
 * Pre-analysis script for codemods
 * Analyzes codebase to identify files needing transformation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

function findFiles(dir, pattern, exclude = []) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);

      // Skip excluded paths
      if (exclude.some(ex => relativePath.includes(ex))) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function countConsoleCalls(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const consoleLog = (content.match(/console\.log\(/g) || []).length;
  const consoleError = (content.match(/console\.error\(/g) || []).length;
  const consoleWarn = (content.match(/console\.warn\(/g) || []).length;
  const consoleDebug = (content.match(/console\.debug\(/g) || []).length;

  const total = consoleLog + consoleError + consoleWarn + consoleDebug;

  return {
    file: path.relative(PROJECT_ROOT, filePath),
    consoleLog,
    consoleError,
    consoleWarn,
    consoleDebug,
    total,
  };
}

function analyze(targetDir) {
  const targetPath = path.join(PROJECT_ROOT, targetDir);

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Path not found: ${targetPath}`);
    process.exit(1);
  }

  console.log(`\n📊 Analyzing: ${targetDir}\n`);

  let files = [];
  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    // Single file
    files = [targetPath];
  } else if (stat.isDirectory()) {
    // Directory - find all JS files
    files = findFiles(targetPath, /\.(js|jsx)$/, [
      'node_modules',
      '__tests__',
      '.git',
      'dist',
      'build',
    ]);
  } else {
    console.error(`Error: Path is not a file or directory: ${targetPath}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} JavaScript files\n`);

  const results = files
    .map(countConsoleCalls)
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);

  if (results.length === 0) {
    console.log('✅ No console.* calls found!');
    return;
  }

  const totalCalls = results.reduce((sum, r) => sum + r.total, 0);

  console.log(`Found ${totalCalls} console.* calls across ${results.length} files:\n`);

  // Show top 20 files
  results.slice(0, 20).forEach(r => {
    const parts = [];
    if (r.consoleLog > 0) parts.push(`${r.consoleLog} log`);
    if (r.consoleError > 0) parts.push(`${r.consoleError} error`);
    if (r.consoleWarn > 0) parts.push(`${r.consoleWarn} warn`);
    if (r.consoleDebug > 0) parts.push(`${r.consoleDebug} debug`);

    console.log(`  ${r.file}: ${r.total} (${parts.join(', ')})`);
  });

  if (results.length > 20) {
    console.log(`  ... and ${results.length - 20} more files`);
  }

  console.log(`\n📈 Summary:`);
  console.log(`  Total files: ${results.length}`);
  console.log(`  Total console calls: ${totalCalls}`);
  console.log(`  Average per file: ${(totalCalls / results.length).toFixed(1)}`);
}

// CLI
if (require.main === module) {
  const targetDir = process.argv[2];

  if (!targetDir) {
    console.error('Usage: node analyze.js <target-directory>');
    console.error('Example: node analyze.js chat-server/src/core/engine');
    process.exit(1);
  }

  analyze(targetDir);
}

module.exports = { analyze, findFiles, countConsoleCalls };
