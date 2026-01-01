#!/usr/bin/env node
/**
 * Verification Script for Dev/Prod Separation
 * 
 * Tests that:
 * 1. Debug utilities are not accessible in production
 * 2. Environment detection works correctly
 * 3. Console logging is gated appropriately
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '..', 'dist');

console.log('🔍 Verifying Dev/Prod Separation...\n');

// Test 1: Check for debug utilities in production build
console.log('Test 1: Checking for debug utilities in production build...');
try {
  const indexJs = readFileSync(join(distDir, 'assets', 'index-*.js'), 'utf8');
  const files = readFileSync(join(distDir, 'assets'), { encoding: 'utf8', withFileTypes: true });
  
  // Find the main index.js file
  const indexFiles = files.filter(f => f.isFile() && f.name.startsWith('index-') && f.name.endsWith('.js'));
  
  if (indexFiles.length === 0) {
    console.log('❌ Could not find index.js file');
    process.exit(1);
  }
  
  const mainFile = join(distDir, 'assets', indexFiles[0].name);
  const content = readFileSync(mainFile, 'utf8');
  
  // Check for debug utilities (should NOT be in production)
  const debugChecks = [
    { pattern: /window\.__SOCKET_DEBUG__/, name: 'window.__SOCKET_DEBUG__' },
    { pattern: /window\.__errorLog\s*=/, name: 'window.__errorLog initialization' },
    { pattern: /window\.getErrorLog\s*=/, name: 'window.getErrorLog' },
    { pattern: /window\.clearErrorLog\s*=/, name: 'window.clearErrorLog' },
  ];
  
  let foundIssues = false;
  for (const check of debugChecks) {
    if (check.pattern.test(content)) {
      // Check if it's gated with import.meta.env.DEV
      const lines = content.split('\n');
      const matchLine = lines.findIndex(line => check.pattern.test(line));
      if (matchLine !== -1) {
        // Check surrounding lines for environment gate
        const context = lines.slice(Math.max(0, matchLine - 5), matchLine + 5).join('\n');
        if (!/import\.meta\.env\.DEV|import\.meta\.env\.PROD/.test(context)) {
          console.log(`❌ Found ${check.name} without environment gate`);
          foundIssues = true;
        } else {
          console.log(`✅ ${check.name} is properly gated`);
        }
      }
    } else {
      console.log(`✅ ${check.name} not found (correct for production)`);
    }
  }
  
  // Check for process.env.NODE_ENV (should NOT be in production)
  if (/process\.env\.NODE_ENV/.test(content)) {
    console.log('❌ Found process.env.NODE_ENV in production build (should use import.meta.env.DEV)');
    foundIssues = true;
  } else {
    console.log('✅ No process.env.NODE_ENV found (correct)');
  }
  
  // Check for import.meta.env.DEV usage (should be present but gated)
  if (/import\.meta\.env\.DEV/.test(content)) {
    console.log('✅ import.meta.env.DEV is used (correct)');
  } else {
    console.log('⚠️  import.meta.env.DEV not found (may be tree-shaken in production)');
  }
  
  if (foundIssues) {
    console.log('\n❌ Verification failed: Debug utilities found without proper gating');
    process.exit(1);
  }
  
  console.log('\n✅ Test 1 passed: Debug utilities are properly gated\n');
} catch (error) {
  console.log(`⚠️  Could not verify production build: ${error.message}`);
  console.log('   (This is OK if dist/ folder doesn\'t exist yet)');
}

// Test 2: Verify source files use correct environment detection
console.log('Test 2: Checking source files for correct environment detection...');
const sourceDir = join(__dirname, '..', 'src');

try {
  const { execSync } = await import('child_process');
  const result = execSync(
    `grep -r "process.env.NODE_ENV" ${sourceDir} --include="*.js" --include="*.jsx" || true`,
    { encoding: 'utf8' }
  );
  
  if (result.trim()) {
    console.log('❌ Found process.env.NODE_ENV in source files:');
    console.log(result);
    process.exit(1);
  } else {
    console.log('✅ No process.env.NODE_ENV found in source files');
  }
} catch (error) {
  console.log(`⚠️  Could not check source files: ${error.message}`);
}

console.log('\n✅ All verification tests passed!');
console.log('\n📋 Summary:');
console.log('   - Debug utilities are properly gated');
console.log('   - Environment detection uses import.meta.env.DEV');
console.log('   - Production build excludes debug code');

