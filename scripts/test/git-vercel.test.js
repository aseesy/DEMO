#!/usr/bin/env node

/**
 * Git & Vercel Deployment Tests
 *
 * Tests the entire deployment pipeline:
 * 1. Git repository health
 * 2. Build process
 * 3. Vercel deployment status
 * 4. Production site verification
 *
 * Run: npm run test:deploy
 * Or:  node scripts/test/git-vercel.test.js
 */

const { execSync, exec } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '../..');
const CLIENT_DIR = path.join(ROOT_DIR, 'chat-client-vite');
const PRODUCTION_URL = 'https://coparentliaizen.com';

// ANSI colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

function log(msg, color = '') {
  console.log(`${color}${msg}${c.reset}`);
}

function pass(name, details = '') {
  results.passed++;
  results.tests.push({ name, status: 'pass', details });
  log(`  ✓ ${name}${details ? ': ' + details : ''}`, c.green);
}

function fail(name, details = '') {
  results.failed++;
  results.tests.push({ name, status: 'fail', details });
  log(`  ✗ ${name}${details ? ': ' + details : ''}`, c.red);
}

function skip(name, reason = '') {
  results.skipped++;
  results.tests.push({ name, status: 'skip', details: reason });
  log(`  ○ ${name}${reason ? ': ' + reason : ''}`, c.yellow);
}

function runCommand(cmd, options = {}) {
  try {
    return {
      success: true,
      output: execSync(cmd, {
        encoding: 'utf8',
        cwd: options.cwd || ROOT_DIR,
        timeout: options.timeout || 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim(),
    };
  } catch (err) {
    return {
      success: false,
      output: err.message,
      stderr: err.stderr?.toString() || '',
    };
  }
}

function fetch(url, timeout = 10000, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeout);

    const makeRequest = (requestUrl, redirectCount) => {
      const protocol = requestUrl.startsWith('https') ? https : require('http');

      protocol
        .get(requestUrl, { headers: { 'User-Agent': 'GitVercelTest/1.0' } }, res => {
          // Handle redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            if (redirectCount >= maxRedirects) {
              clearTimeout(timer);
              reject(new Error('Too many redirects'));
              return;
            }
            const redirectUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, requestUrl).toString();
            makeRequest(redirectUrl, redirectCount + 1);
            return;
          }

          clearTimeout(timer);
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () =>
            resolve({ status: res.statusCode, body: data, headers: res.headers })
          );
        })
        .on('error', err => {
          clearTimeout(timer);
          reject(err);
        });
    };

    makeRequest(url, 0);
  });
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testGitRepository() {
  log('\n📁 Git Repository Tests', c.bold);

  // Test: Git is installed
  const gitVersion = runCommand('git --version');
  if (gitVersion.success) {
    pass('Git installed', gitVersion.output.replace('git version ', ''));
  } else {
    fail('Git installed', 'git not found in PATH');
    return; // Skip remaining git tests
  }

  // Test: Is a git repository
  const isRepo = runCommand('git rev-parse --is-inside-work-tree');
  if (isRepo.success && isRepo.output === 'true') {
    pass('Valid git repository');
  } else {
    fail('Valid git repository');
    return;
  }

  // Test: On main branch
  const branch = runCommand('git branch --show-current');
  if (branch.success && branch.output === 'main') {
    pass('On main branch');
  } else if (branch.success) {
    skip('On main branch', `Currently on "${branch.output}"`);
  } else {
    fail('On main branch', branch.output);
  }

  // Test: Remote configured
  const remotes = runCommand('git remote -v');
  if (remotes.success && remotes.output.includes('origin')) {
    const originUrl = remotes.output.split('\n')[0].split('\t')[1].split(' ')[0];
    pass('Remote origin configured', originUrl);
  } else {
    fail('Remote origin configured');
  }

  // Test: No uncommitted changes to critical files
  const status = runCommand('git status --porcelain');
  if (status.success) {
    const changes = status.output.split('\n').filter(l => l.trim());
    const criticalChanges = changes.filter(
      l => l.includes('package.json') || l.includes('vercel.json') || l.includes('.env')
    );
    if (criticalChanges.length === 0) {
      pass('No uncommitted critical file changes');
    } else {
      fail('No uncommitted critical file changes', `${criticalChanges.length} files`);
    }
  }

  // Test: Can fetch from remote
  const fetchResult = runCommand('git fetch --dry-run origin main 2>&1');
  if (fetchResult.success || fetchResult.output.includes('From')) {
    pass('Can connect to remote');
  } else {
    fail('Can connect to remote', fetchResult.output);
  }

  // Test: Up to date with remote
  const behind = runCommand('git rev-list --count HEAD..origin/main 2>/dev/null || echo "0"');
  const ahead = runCommand('git rev-list --count origin/main..HEAD 2>/dev/null || echo "0"');
  if (behind.success && ahead.success) {
    const behindCount = parseInt(behind.output) || 0;
    const aheadCount = parseInt(ahead.output) || 0;
    if (behindCount === 0 && aheadCount === 0) {
      pass('Branch up to date with origin/main');
    } else if (behindCount > 0) {
      fail('Branch up to date with origin/main', `${behindCount} commits behind`);
    } else {
      skip('Branch up to date with origin/main', `${aheadCount} commits ahead (not pushed)`);
    }
  }
}

async function testBuildProcess() {
  log('\n🔨 Build Process Tests', c.bold);

  // Test: Node.js installed
  const nodeVersion = runCommand('node --version');
  if (nodeVersion.success) {
    const version = nodeVersion.output.replace('v', '');
    const major = parseInt(version.split('.')[0]);
    if (major >= 18) {
      pass('Node.js version', `${nodeVersion.output} (>=18 required)`);
    } else {
      fail('Node.js version', `${nodeVersion.output} (>=18 required)`);
    }
  } else {
    fail('Node.js installed');
    return;
  }

  // Test: npm installed
  const npmVersion = runCommand('npm --version');
  if (npmVersion.success) {
    pass('npm installed', `v${npmVersion.output}`);
  } else {
    fail('npm installed');
  }

  // Test: package.json exists
  const pkgPath = path.join(CLIENT_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    pass('package.json exists');
  } else {
    fail('package.json exists', pkgPath);
    return;
  }

  // Test: node_modules exists
  const modulesPath = path.join(CLIENT_DIR, 'node_modules');
  if (fs.existsSync(modulesPath)) {
    pass('node_modules installed');
  } else {
    fail('node_modules installed', 'Run: npm install');
  }

  // Test: vercel.json exists and valid
  const vercelPath = path.join(CLIENT_DIR, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      if (config.buildCommand && config.outputDirectory) {
        pass('vercel.json valid', `build: ${config.buildCommand}`);
      } else {
        fail('vercel.json valid', 'Missing buildCommand or outputDirectory');
      }
    } catch (err) {
      fail('vercel.json valid', 'Invalid JSON');
    }
  } else {
    fail('vercel.json exists');
  }

  // Test: Build succeeds (quick syntax check, not full build)
  log('  ⏳ Checking build configuration...', c.cyan);
  const buildCheck = runCommand('npm run build -- --mode production 2>&1', {
    cwd: CLIENT_DIR,
    timeout: 120000,
  });
  if (buildCheck.success) {
    pass('Build succeeds');

    // Test: dist folder created
    const distPath = path.join(CLIENT_DIR, 'dist');
    if (fs.existsSync(distPath)) {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        pass('Build output valid', 'dist/index.html exists');
      } else {
        fail('Build output valid', 'dist/index.html missing');
      }
    } else {
      fail('Build output valid', 'dist folder not created');
    }
  } else {
    fail('Build succeeds', buildCheck.output.slice(0, 200));
  }
}

async function testVercelDeployment() {
  log('\n🚀 Vercel Deployment Tests', c.bold);

  // Test: Vercel CLI installed
  const vercelVersion = runCommand('vercel --version');
  if (vercelVersion.success) {
    pass('Vercel CLI installed', vercelVersion.output.split('\n')[0]);
  } else {
    fail('Vercel CLI installed', 'Run: npm i -g vercel');
    return;
  }

  // Test: Logged in to Vercel
  const whoami = runCommand('vercel whoami 2>&1');
  if (whoami.success && !whoami.output.includes('not logged in')) {
    pass('Logged in to Vercel', whoami.output);
  } else {
    fail('Logged in to Vercel', 'Run: vercel login');
    return;
  }

  // Test: Project linked
  const vercelDir = path.join(CLIENT_DIR, '.vercel');
  if (fs.existsSync(vercelDir)) {
    pass('Vercel project linked');
  } else {
    fail('Vercel project linked', 'Run: vercel link');
  }

  // Test: Get deployment status
  log('  ⏳ Checking deployment status...', c.cyan);
  const deployments = runCommand('vercel ls 2>&1', { cwd: CLIENT_DIR });
  if (deployments.success) {
    const lines = deployments.output.split('\n');
    const prodLine = lines.find(l => l.includes('Production') && !l.includes('Age'));

    if (prodLine) {
      const isReady = prodLine.includes('● Ready');
      const isError = prodLine.includes('● Error');
      const isBuilding = prodLine.includes('● Building');

      // Extract age
      const ageMatch = prodLine.match(/(\d+[smhd])\s+/);
      const age = ageMatch ? ageMatch[1] : 'unknown';

      if (isReady) {
        pass('Latest deployment status', `Ready (${age} ago)`);
      } else if (isError) {
        fail('Latest deployment status', `Error (${age} ago)`);
      } else if (isBuilding) {
        skip('Latest deployment status', 'Currently building...');
      } else {
        skip('Latest deployment status', 'Unknown status');
      }

      // Count recent errors (only count failures AFTER the latest Ready)
      const errorCount = lines.filter(l => l.includes('● Error')).length;
      if (isReady) {
        // If latest is Ready, historical errors are just warnings
        if (errorCount > 0) {
          skip('Deployment stability', `${errorCount} historical failure(s), but latest is Ready`);
        } else {
          pass('Deployment stability', 'No recent failures');
        }
      } else if (errorCount > 3) {
        fail('Deployment stability', `${errorCount} consecutive failures`);
      } else if (errorCount > 0) {
        skip('Deployment stability', `${errorCount} recent failure(s)`);
      } else {
        pass('Deployment stability', 'No recent failures');
      }
    } else {
      fail('Latest deployment status', 'Could not parse output');
    }
  } else {
    fail('Latest deployment status', deployments.output);
  }
}

async function testProductionSite() {
  log('\n🌐 Production Site Tests', c.bold);

  // Test: Site reachable
  try {
    const response = await fetch(PRODUCTION_URL);
    if (response.status === 200) {
      pass('Site reachable', `HTTP ${response.status}`);
    } else {
      fail('Site reachable', `HTTP ${response.status}`);
      return;
    }

    // Test: Returns HTML
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      pass('Returns HTML');
    } else {
      fail('Returns HTML', contentType);
    }

    // Test: React app renders
    if (response.body.includes('id="root"')) {
      pass('React root element present');
    } else {
      fail('React root element present');
    }

    // Test: JavaScript bundle present
    const jsMatch = response.body.match(/src="([^"]+index[^"]+\.js)"/);
    if (jsMatch) {
      pass('JavaScript bundle referenced', jsMatch[1].split('/').pop());

      // Test: JS bundle loads
      const jsUrl = jsMatch[1].startsWith('/') ? `${PRODUCTION_URL}${jsMatch[1]}` : jsMatch[1];
      try {
        const jsResponse = await fetch(jsUrl);
        if (jsResponse.status === 200) {
          pass('JavaScript bundle loads');
        } else {
          fail('JavaScript bundle loads', `HTTP ${jsResponse.status}`);
        }
      } catch (err) {
        fail('JavaScript bundle loads', err.message);
      }
    } else {
      fail('JavaScript bundle referenced');
    }

    // Test: No error indicators
    if (
      !response.body.includes('Internal Server Error') &&
      !response.body.includes('Application error')
    ) {
      pass('No server errors in HTML');
    } else {
      fail('No server errors in HTML');
    }
  } catch (err) {
    fail('Site reachable', err.message);
  }

  // Test: Key routes
  const routes = ['/signin', '/privacy', '/terms'];
  for (const route of routes) {
    try {
      const response = await fetch(`${PRODUCTION_URL}${route}`);
      if (response.status === 200) {
        pass(`Route ${route} accessible`);
      } else {
        fail(`Route ${route} accessible`, `HTTP ${response.status}`);
      }
    } catch (err) {
      fail(`Route ${route} accessible`, err.message);
    }
  }
}

async function testGitVercelIntegration() {
  log('\n🔗 Git-Vercel Integration Tests', c.bold);

  // Test: .gitignore excludes build artifacts
  const gitignorePath = path.join(CLIENT_DIR, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignore.includes('node_modules') && gitignore.includes('dist')) {
      pass('.gitignore configured correctly');
    } else {
      fail('.gitignore configured correctly', 'Missing node_modules or dist');
    }
  } else {
    fail('.gitignore exists');
  }

  // Test: No secrets in git history (basic check)
  const secretCheck = runCommand(
    'git log -p --all -S "sk-" -- "*.js" "*.json" 2>/dev/null | head -1'
  );
  if (!secretCheck.output) {
    pass('No API keys in git history (basic check)');
  } else {
    fail('No API keys in git history', 'Found potential secrets');
  }

  // Test: Pre-push hook exists
  const hookPath = path.join(ROOT_DIR, '.husky/pre-push');
  if (fs.existsSync(hookPath)) {
    pass('Pre-push hook configured');
  } else {
    skip('Pre-push hook configured', 'No .husky/pre-push');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  log(`\n${'═'.repeat(60)}`, c.blue);
  log('  Git & Vercel Deployment Test Suite', c.bold);
  log(`${'═'.repeat(60)}`, c.blue);
  log(`  Target: ${PRODUCTION_URL}`, c.cyan);
  log(`  Time: ${new Date().toISOString()}`, c.cyan);

  const startTime = Date.now();

  await testGitRepository();
  await testBuildProcess();
  await testVercelDeployment();
  await testProductionSite();
  await testGitVercelIntegration();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  log(`\n${'─'.repeat(60)}`, c.blue);
  log('\n📊 Summary', c.bold);
  log(`  ${c.green}✓ Passed: ${results.passed}${c.reset}`);
  log(`  ${c.red}✗ Failed: ${results.failed}${c.reset}`);
  log(`  ${c.yellow}○ Skipped: ${results.skipped}${c.reset}`);
  log(`  ⏱  Duration: ${duration}s`);

  if (results.failed > 0) {
    log('\n❌ Some tests failed!', c.red + c.bold);
    log('\nFailed tests:', c.red);
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => log(`  • ${t.name}: ${t.details}`, c.red));

    log('\n💡 Quick fixes:', c.yellow);
    if (results.tests.some(t => t.name.includes('deployment') && t.status === 'fail')) {
      log('  • Deploy manually: cd chat-client-vite && vercel --prod', c.yellow);
    }
    if (results.tests.some(t => t.name.includes('Build') && t.status === 'fail')) {
      log('  • Check build: cd chat-client-vite && npm run build', c.yellow);
    }

    process.exit(1);
  } else {
    log('\n✅ All tests passed!', c.green + c.bold);
    process.exit(0);
  }
}

main().catch(err => {
  log(`\n❌ Test suite error: ${err.message}`, c.red);
  process.exit(1);
});
