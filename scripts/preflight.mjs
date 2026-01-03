#!/usr/bin/env node
/**
 * Preflight Check Script
 *
 * Run before deploy to catch 80% of issues:
 * 1. Print resolved socket URLs for each environment
 * 2. Validate env vars (no quotes/newlines, valid URLs)
 * 3. Run npm ci && npm run build for Vercel subdirs
 * 4. Optional: HTTP health check to Railway
 *
 * Usage:
 *   node scripts/preflight.mjs           # Full check (no deploy)
 *   node scripts/preflight.mjs --quick   # Skip build, just validate
 *   node scripts/preflight.mjs --health  # Include Railway health check
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ============================================================================
// COLORS
// ============================================================================
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  info: (msg) => console.log(`${c.cyan}ℹ${c.reset} ${msg}`),
  success: (msg) => console.log(`${c.green}✓${c.reset} ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset} ${msg}`),
  error: (msg) => console.log(`${c.red}✗${c.reset} ${msg}`),
  header: (msg) => console.log(`\n${c.bold}${c.cyan}═══ ${msg} ═══${c.reset}\n`),
  subheader: (msg) => console.log(`${c.gray}─── ${msg} ───${c.reset}`),
};

// ============================================================================
// ENV FILE PARSING
// ============================================================================
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const env = {};
  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2];

      // Don't trim value yet - we want to detect trailing whitespace
      env[key] = { raw: value, trimmed: value.trim() };
    }
  }
  return env;
}

// ============================================================================
// URL VALIDATION
// ============================================================================
function stripQuotes(value) {
  // Vite strips quotes from env values, so we should too
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function validateUrl(name, value, issues) {
  if (!value) {
    issues.push({ type: 'missing', name, message: `${name} is not set` });
    return false;
  }

  // Strip quotes (Vite does this automatically)
  const cleanValue = stripQuotes(value).trim();

  // Check for newlines/whitespace AFTER quote stripping
  if (cleanValue !== stripQuotes(value)) {
    issues.push({
      type: 'whitespace',
      name,
      message: `${name} has leading/trailing whitespace (breaks Socket.io)`,
      value: JSON.stringify(value.substring(0, 50))
    });
    return false;
  }

  // Check for valid URL format
  try {
    new URL(cleanValue);
  } catch {
    issues.push({
      type: 'invalid',
      name,
      message: `${name} is not a valid URL`,
      value: cleanValue.substring(0, 50)
    });
    return false;
  }

  return true;
}

// ============================================================================
// 1. SOCKET URL RESOLUTION
// ============================================================================
function checkSocketUrls() {
  log.header('Socket URL Resolution');

  const issues = [];

  // Client env files
  const clientEnvFiles = [
    { name: 'chat-client-vite/.env', path: resolve(ROOT, 'chat-client-vite/.env') },
    { name: 'chat-client-vite/.env.local', path: resolve(ROOT, 'chat-client-vite/.env.local') },
    { name: 'chat-client-vite/.env.production', path: resolve(ROOT, 'chat-client-vite/.env.production') },
  ];

  const PRODUCTION_API_URL = 'https://demo-production-6dcd.up.railway.app';

  for (const { name, path } of clientEnvFiles) {
    if (!existsSync(path)) {
      log.info(`${c.gray}${name}${c.reset} - not found (will use defaults)`);
      continue;
    }

    const env = loadEnvFile(path);
    const apiUrl = env.VITE_API_URL;

    if (apiUrl) {
      const cleanUrl = stripQuotes(apiUrl.raw).trim();
      const isValid = validateUrl(`${name} VITE_API_URL`, apiUrl.raw, issues);
      if (isValid) {
        log.success(`${c.gray}${name}${c.reset} → ${c.green}${cleanUrl}${c.reset}`);
      }
    } else {
      log.info(`${c.gray}${name}${c.reset} - VITE_API_URL not set`);
    }
  }

  // Show what production will resolve to
  log.subheader('Production Resolution');
  console.log(`  If VITE_API_URL not set → ${c.cyan}${PRODUCTION_API_URL}${c.reset} (hardcoded fallback)`);

  // Server env
  log.subheader('Server CORS Configuration');
  const serverEnv = loadEnvFile(resolve(ROOT, 'chat-server/.env'));
  if (serverEnv.FRONTEND_URL) {
    log.success(`FRONTEND_URL = ${c.green}${serverEnv.FRONTEND_URL.trimmed}${c.reset}`);
  } else {
    log.warn(`FRONTEND_URL not set - CORS may reject requests`);
  }

  return issues;
}

// ============================================================================
// 2. ENV VAR VALIDATION
// ============================================================================
function validateEnvVars() {
  log.header('Environment Variable Validation');

  const issues = [];

  // Critical server vars
  const serverEnv = loadEnvFile(resolve(ROOT, 'chat-server/.env'));

  const criticalServerVars = ['DATABASE_URL', 'JWT_SECRET'];
  for (const varName of criticalServerVars) {
    if (!serverEnv[varName]) {
      issues.push({ type: 'missing', name: varName, message: `Server ${varName} is required` });
      log.error(`${varName} is ${c.red}MISSING${c.reset}`);
    } else {
      log.success(`${varName} is set`);
    }
  }

  // Check for common mistakes in URL vars
  const urlVars = ['DATABASE_URL', 'FRONTEND_URL', 'APP_URL'];
  for (const varName of urlVars) {
    if (serverEnv[varName]) {
      const val = serverEnv[varName];
      if (val.raw !== val.trimmed) {
        issues.push({
          type: 'whitespace',
          name: varName,
          message: `${varName} has whitespace`
        });
        log.warn(`${varName} has trailing whitespace`);
      }
    }
  }

  // Client URL validation already done in checkSocketUrls()

  return issues;
}

// ============================================================================
// 3. BUILD TEST
// ============================================================================
function testBuild(quick = false) {
  if (quick) {
    log.header('Build Test (SKIPPED - quick mode)');
    return [];
  }

  log.header('Build Test');

  const issues = [];
  const clientDir = resolve(ROOT, 'chat-client-vite');

  try {
    log.info('Running npm ci...');
    execSync('npm ci', { cwd: clientDir, stdio: 'pipe' });
    log.success('npm ci completed');
  } catch (error) {
    issues.push({ type: 'build', name: 'npm ci', message: error.message });
    log.error(`npm ci failed: ${error.message}`);
    return issues;
  }

  try {
    log.info('Running npm run build...');
    execSync('npm run build', { cwd: clientDir, stdio: 'pipe' });
    log.success('Build completed successfully');

    // Check output exists
    const distIndex = resolve(clientDir, 'dist/index.html');
    if (existsSync(distIndex)) {
      log.success('dist/index.html exists');
    } else {
      issues.push({ type: 'build', name: 'output', message: 'dist/index.html not found' });
      log.error('dist/index.html not found after build');
    }
  } catch (error) {
    issues.push({ type: 'build', name: 'build', message: error.stderr?.toString() || error.message });
    log.error(`Build failed`);
    console.log(error.stderr?.toString() || error.message);
  }

  return issues;
}

// ============================================================================
// 4. RAILWAY HEALTH CHECK
// ============================================================================
async function healthCheck(enabled = false) {
  if (!enabled) {
    log.header('Railway Health Check (SKIPPED - use --health to enable)');
    return [];
  }

  log.header('Railway Health Check');

  const issues = [];
  const railwayUrl = 'https://demo-production-6dcd.up.railway.app';

  // Health endpoint
  try {
    log.info(`Checking ${railwayUrl}/health ...`);
    const healthRes = await fetch(`${railwayUrl}/health`);
    if (healthRes.ok) {
      const data = await healthRes.json();
      log.success(`/health returned ${healthRes.status}: ${JSON.stringify(data)}`);
    } else {
      issues.push({ type: 'health', name: '/health', message: `Status ${healthRes.status}` });
      log.error(`/health returned ${healthRes.status}`);
    }
  } catch (error) {
    issues.push({ type: 'health', name: '/health', message: error.message });
    log.error(`/health failed: ${error.message}`);
  }

  // Socket.io polling endpoint
  try {
    log.info(`Checking Socket.io handshake...`);
    const socketRes = await fetch(`${railwayUrl}/socket.io/?EIO=4&transport=polling`);
    if (socketRes.ok) {
      log.success(`Socket.io handshake returned ${socketRes.status}`);
    } else {
      issues.push({ type: 'health', name: 'socket.io', message: `Status ${socketRes.status}` });
      log.error(`Socket.io handshake returned ${socketRes.status}`);
    }
  } catch (error) {
    issues.push({ type: 'health', name: 'socket.io', message: error.message });
    log.error(`Socket.io check failed: ${error.message}`);
  }

  // CORS preflight check
  try {
    log.info(`Checking CORS from Vercel origin...`);
    const corsRes = await fetch(`${railwayUrl}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://coparentliaizen.com',
        'Access-Control-Request-Method': 'GET',
      }
    });
    const corsHeader = corsRes.headers.get('access-control-allow-origin');
    if (corsHeader) {
      log.success(`CORS allows origin: ${corsHeader}`);
    } else {
      issues.push({ type: 'cors', name: 'CORS', message: 'No access-control-allow-origin header' });
      log.warn(`CORS header not present in response`);
    }
  } catch (error) {
    log.warn(`CORS check failed: ${error.message}`);
  }

  return issues;
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');
  const health = args.includes('--health');

  console.log(`\n${c.bold}${c.cyan}🚀 PREFLIGHT CHECK${c.reset}`);
  console.log(`${c.gray}Run before deploy to catch issues early${c.reset}\n`);

  const allIssues = [];

  // 1. Socket URL resolution
  allIssues.push(...checkSocketUrls());

  // 2. Env var validation
  allIssues.push(...validateEnvVars());

  // 3. Build test
  allIssues.push(...testBuild(quick));

  // 4. Health check (optional)
  allIssues.push(...await healthCheck(health));

  // Summary
  log.header('Summary');

  if (allIssues.length === 0) {
    console.log(`${c.green}${c.bold}✓ All preflight checks passed!${c.reset}`);
    console.log(`${c.gray}Safe to deploy.${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.red}${c.bold}✗ Found ${allIssues.length} issue(s):${c.reset}\n`);

    for (const issue of allIssues) {
      console.log(`  ${c.red}•${c.reset} [${issue.type}] ${issue.name}: ${issue.message}`);
      if (issue.value) {
        console.log(`    ${c.gray}Value: ${issue.value}${c.reset}`);
      }
    }

    console.log(`\n${c.yellow}Fix these issues before deploying.${c.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  log.error(`Preflight failed: ${err.message}`);
  process.exit(1);
});
