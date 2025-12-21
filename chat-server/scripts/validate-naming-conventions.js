#!/usr/bin/env node

/**
 * Naming Conventions Validator
 *
 * Validates that code follows naming conventions:
 * - JavaScript: camelCase for variables/functions, PascalCase for classes
 * - Database: snake_case for columns (allowed in destructuring)
 * - localStorage: camelCase keys
 *
 * Usage: node scripts/validate-naming-conventions.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ERRORS = [];
const WARNINGS = [];

// Patterns to check
const PATTERNS = {
  // JavaScript snake_case variables (should be camelCase)
  snakeCaseVar: /\b[a-z]+_[a-z]+(?:\.[a-z]+_[a-z]+)*\s*=/g,
  // localStorage snake_case keys (should use STORAGE_KEYS constants)
  localStorageSnake: /localStorage\.(getItem|setItem|removeItem)\(['"]([a-z_]+)['"]\)/g,
  // Object properties with snake_case (excluding known API/database fields)
  snakeCaseProperty: /\.([a-z]+_[a-z]+)\b/g,
};

// Allowed snake_case patterns (database columns, API responses that come from backend)
const ALLOWED_SNAKE_CASE = new Set([
  'user_id',
  'created_at',
  'updated_at',
  'room_id',
  'message_id',
  'sender_id',
  'receiver_id',
  'feedback_type',
  'context_json',
  'personal_visibility',
  'work_visibility',
  'health_visibility',
  'financial_visibility',
  'background_visibility',
  'field_overrides',
  'has_coparent',
  'room_status', // Legacy - should be migrated
]);

// Files to check
const JS_FILES = [];
const JSX_FILES = [];

function findFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build, .git
      if (!['node_modules', 'dist', 'build', '.git', '.next', 'coverage'].includes(file)) {
        findFiles(filePath, extensions, fileList);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check localStorage usage
  const localStorageMatches = [...content.matchAll(PATTERNS.localStorageSnake)];
  localStorageMatches.forEach(match => {
    const key = match[2];
    if (key.includes('_') && !key.startsWith('liaizen')) {
      WARNINGS.push({
        file: relativePath,
        line: lines.findIndex(l => l.includes(match[0])) + 1,
        message: `localStorage key "${key}" should use camelCase. Use STORAGE_KEYS constants from utils/storageKeys.js`,
        code: match[0],
      });
    }
  });

  // Check for snake_case object properties (excluding allowed ones)
  lines.forEach((line, index) => {
    const propertyMatches = [...line.matchAll(PATTERNS.snakeCaseProperty)];
    propertyMatches.forEach(match => {
      const property = match[1];
      // Skip if it's an allowed database/API field
      if (
        !ALLOWED_SNAKE_CASE.has(property) &&
        !line.includes('// ALLOWED') &&
        !line.includes('transformPrivacySettings') &&
        !line.includes('transformPrivacySettingsForAPI')
      ) {
        ERRORS.push({
          file: relativePath,
          line: index + 1,
          message: `Object property "${property}" should use camelCase. Use transformation utility if this comes from API.`,
          code: line.trim(),
        });
      }
    });
  });
}

function main() {
  console.log('🔍 Validating naming conventions...\n');

  const serverDir = path.join(__dirname, '..', 'src');
  const clientDir = path.join(__dirname, '..', '..', 'chat-client-vite', 'src');

  // Find JavaScript files
  if (fs.existsSync(serverDir)) {
    findFiles(serverDir, ['.js'], JS_FILES);
  }
  if (fs.existsSync(clientDir)) {
    findFiles(clientDir, ['.js', '.jsx'], JS_FILES);
  }

  // Check each file
  JS_FILES.forEach(file => {
    try {
      checkFile(file);
    } catch (error) {
      console.error(`Error checking ${file}:`, error.message);
    }
  });

  // Report results
  if (ERRORS.length > 0) {
    console.error(`\n❌ Found ${ERRORS.length} naming convention error(s):\n`);
    ERRORS.forEach(({ file, line, message, code }) => {
      console.error(`  ${file}:${line}`);
      console.error(`    ${message}`);
      console.error(`    ${code}\n`);
    });
  }

  if (WARNINGS.length > 0) {
    console.warn(`\n⚠️  Found ${WARNINGS.length} naming convention warning(s):\n`);
    WARNINGS.forEach(({ file, line, message, code }) => {
      console.warn(`  ${file}:${line}`);
      console.warn(`    ${message}`);
      console.warn(`    ${code}\n`);
    });
  }

  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✅ All naming conventions validated!\n');
    process.exit(0);
  } else if (ERRORS.length > 0) {
    console.error('\n💡 Fix errors by:');
    console.error('   - Using camelCase for JavaScript variables/properties');
    console.error('   - Using STORAGE_KEYS constants for localStorage');
    console.error('   - Using apiTransform utilities for API responses\n');
    process.exit(1);
  } else {
    console.warn('\n💡 Consider fixing warnings to maintain consistency\n');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, findFiles };
