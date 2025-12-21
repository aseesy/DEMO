#!/usr/bin/env node

/**
 * Production Verification Script
 *
 * Tests that the Vercel deployment is successful by:
 * 1. Checking the site is reachable
 * 2. Verifying critical assets load
 * 3. Checking for JavaScript errors in the HTML
 * 4. Verifying the app renders (not a blank page)
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://coparentliaizen.com';
const TIMEOUT_MS = 30000;

// ANSI colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logResult(test, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  log(`  ${icon} ${test}${details ? ': ' + details : ''}`, color);
  return passed;
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'LiaiZen-Production-Verifier/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }, (res) => {
      clearTimeout(timeout);
      let data = '';

      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve).catch(reject);
        return;
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function runTests() {
  log('\n🔍 Vercel Production Deployment Verification', 'bold');
  log(`   Testing: ${PRODUCTION_URL}\n`, 'blue');

  const results = [];
  let startTime = Date.now();

  // Test 1: Site is reachable
  log('1. Connectivity Tests:', 'bold');
  try {
    const response = await fetch(PRODUCTION_URL);
    results.push(logResult('Site reachable', response.status === 200, `HTTP ${response.status}`));

    // Test 2: Response time
    const responseTime = Date.now() - startTime;
    results.push(logResult('Response time acceptable', responseTime < 5000, `${responseTime}ms`));

    // Test 3: Content type is HTML
    const contentType = response.headers['content-type'] || '';
    results.push(logResult('Returns HTML', contentType.includes('text/html'), contentType));

    // Test 4: HTML structure tests
    log('\n2. HTML Structure Tests:', 'bold');
    const html = response.body;

    // Check for React root
    const hasRoot = html.includes('id="root"') || html.includes("id='root'");
    results.push(logResult('React root element present', hasRoot));

    // Check for critical scripts
    const hasScripts = html.includes('<script') && html.includes('type="module"');
    results.push(logResult('JavaScript modules present', hasScripts));

    // Check for CSS
    const hasStyles = html.includes('<link') && html.includes('.css');
    results.push(logResult('CSS stylesheets linked', hasStyles));

    // Test 5: No obvious errors in HTML
    log('\n3. Error Detection:', 'bold');

    const hasErrorPage = html.includes('404') && html.includes('not found');
    results.push(logResult('No 404 error page', !hasErrorPage));

    const has500Error = html.includes('500') && html.includes('Internal Server Error');
    results.push(logResult('No 500 error', !has500Error));

    const hasModuleError = html.includes('Failed to load module') ||
                          html.includes('Module not found') ||
                          html.includes('Cannot find module');
    results.push(logResult('No module loading errors', !hasModuleError));

    // Test 6: Critical assets
    log('\n4. Asset Verification:', 'bold');

    // Extract JS bundle URL from HTML
    const jsMatch = html.match(/src="([^"]+\.js)"/);
    if (jsMatch) {
      const jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `${PRODUCTION_URL}${jsMatch[1]}`;
      try {
        const jsResponse = await fetch(jsUrl);
        results.push(logResult('Main JS bundle loads', jsResponse.status === 200, jsUrl.split('/').pop()));
      } catch (err) {
        results.push(logResult('Main JS bundle loads', false, err.message));
      }
    } else {
      results.push(logResult('Main JS bundle found in HTML', false, 'No script tag found'));
    }

    // Test logo asset
    try {
      const logoResponse = await fetch(`${PRODUCTION_URL}/assets/Logo.svg`);
      results.push(logResult('Logo asset accessible', logoResponse.status === 200));
    } catch (err) {
      results.push(logResult('Logo asset accessible', false, err.message));
    }

    // Test 7: Critical routes
    log('\n5. Route Tests:', 'bold');

    const routes = [
      { path: '/signin', name: 'Sign in page' },
      { path: '/privacy', name: 'Privacy page' },
      { path: '/terms', name: 'Terms page' },
    ];

    for (const route of routes) {
      try {
        const routeResponse = await fetch(`${PRODUCTION_URL}${route.path}`);
        results.push(logResult(route.name, routeResponse.status === 200));
      } catch (err) {
        results.push(logResult(route.name, false, err.message));
      }
    }

  } catch (err) {
    results.push(logResult('Site reachable', false, err.message));
  }

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const allPassed = passed === total;

  log('\n' + '─'.repeat(50), 'blue');
  log(`\n📊 Results: ${passed}/${total} tests passed`, allPassed ? 'green' : 'red');

  if (allPassed) {
    log('\n✅ Vercel deployment verified successfully!', 'green');
  } else {
    log('\n❌ Some tests failed - check deployment', 'red');
  }

  log(`\n⏱️  Total time: ${Date.now() - startTime}ms\n`);

  process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runTests().catch(err => {
    log(`\n❌ Verification failed: ${err.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, fetch };
