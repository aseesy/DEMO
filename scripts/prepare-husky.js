#!/usr/bin/env node
/**
 * Conditional Husky installation
 * Only runs in local development, skips in CI/build environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Skip in CI/build environments
if (process.env.CI || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT) {
  console.log('⏭️  Skipping Husky installation (CI/build environment detected)');
  process.exit(0);
}

// Check if husky is installed
const huskyPath = path.join(__dirname, '..', 'node_modules', 'husky');
if (!fs.existsSync(huskyPath)) {
  console.log('⏭️  Skipping Husky installation (not installed)');
  process.exit(0);
}

// Check if husky binary exists
try {
  execSync('husky --version', { stdio: 'ignore' });
} catch (error) {
  console.log('⏭️  Skipping Husky installation (husky command not found)');
  process.exit(0);
}

// Run husky install
try {
  console.log('🐕 Installing Husky git hooks...');
  execSync('husky install', { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️  Husky installation failed (non-fatal):', error.message);
  process.exit(0); // Don't fail the build
}
