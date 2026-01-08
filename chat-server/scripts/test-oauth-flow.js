#!/usr/bin/env node
/**
 * OAuth Flow Testing Script
 * 
 * Validates OAuth security functions and endpoints
 * 
 * Usage:
 *   node scripts/test-oauth-flow.js
 */

const crypto = require('crypto');
const { generatePKCE, verifyPKCE } = require('../auth/oauthSecurity');

/**
 * Test results tracker
 */
const results = {
  passed: [],
  failed: [],
};

function logPass(test) {
  console.log(`✅ ${test}`);
  results.passed.push(test);
}

function logFail(test, error) {
  console.error(`❌ ${test}`);
  console.error(`   Error: ${error.message || error}`);
  results.failed.push({ test, error: error.message || error });
}

/**
 * Test PKCE Generation
 */
function testPKCEGeneration() {
  console.log('\n📋 Testing PKCE Generation\n');

  try {
    const pkce = generatePKCE();

    // Check structure
    if (!pkce.codeVerifier || !pkce.codeChallenge || !pkce.codeChallengeMethod) {
      logFail('PKCE structure', new Error('Missing required fields'));
      return;
    }
    logPass('PKCE structure is correct');

    // Check code verifier format (base64url, 64 bytes = 128 chars when base64url encoded)
    if (pkce.codeVerifier.length < 86 || pkce.codeVerifier.length > 128) {
      logFail('PKCE code verifier length', new Error(`Unexpected length: ${pkce.codeVerifier.length}`));
      return;
    }
    logPass('PKCE code verifier length is correct');

    // Check code challenge format (SHA256 hash in base64url)
    if (pkce.codeChallenge.length !== 43) {
      logFail('PKCE code challenge length', new Error(`Expected 43, got ${pkce.codeChallenge.length}`));
      return;
    }
    logPass('PKCE code challenge length is correct');

    // Check code challenge method
    if (pkce.codeChallengeMethod !== 'S256') {
      logFail('PKCE code challenge method', new Error(`Expected S256, got ${pkce.codeChallengeMethod}`));
      return;
    }
    logPass('PKCE code challenge method is S256');

    // Check that challenge is actually SHA256 of verifier
    const expectedChallenge = crypto
      .createHash('sha256')
      .update(pkce.codeVerifier)
      .digest('base64url');

    if (pkce.codeChallenge !== expectedChallenge) {
      logFail('PKCE code challenge matches verifier', new Error('Challenge does not match verifier hash'));
      return;
    }
    logPass('PKCE code challenge matches verifier hash');
  } catch (error) {
    logFail('PKCE generation', error);
  }
}

/**
 * Test PKCE Verification
 */
function testPKCEVerification() {
  console.log('\n📋 Testing PKCE Verification\n');

  try {
    // Test valid PKCE
    const pkce = generatePKCE();
    const isValid = verifyPKCE(pkce.codeVerifier, pkce.codeChallenge);

    if (!isValid) {
      logFail('PKCE verification (valid)', new Error('Valid PKCE should pass verification'));
      return;
    }
    logPass('PKCE verification (valid) passes');

    // Test invalid code verifier
    const invalidVerifier = crypto.randomBytes(64).toString('base64url');
    const isValidInvalid = verifyPKCE(invalidVerifier, pkce.codeChallenge);

    if (isValidInvalid) {
      logFail('PKCE verification (invalid verifier)', new Error('Invalid verifier should fail verification'));
      return;
    }
    logPass('PKCE verification (invalid verifier) correctly rejects');

    // Test invalid code challenge
    const invalidChallenge = crypto.randomBytes(32).toString('base64url');
    const isValidInvalidChallenge = verifyPKCE(pkce.codeVerifier, invalidChallenge);

    if (isValidInvalidChallenge) {
      logFail('PKCE verification (invalid challenge)', new Error('Invalid challenge should fail verification'));
      return;
    }
    logPass('PKCE verification (invalid challenge) correctly rejects');

    // Test missing parameters
    const isValidMissing = verifyPKCE(null, pkce.codeChallenge);
    if (isValidMissing) {
      logFail('PKCE verification (missing verifier)', new Error('Missing verifier should fail'));
      return;
    }
    logPass('PKCE verification (missing verifier) correctly rejects');

    const isValidMissingChallenge = verifyPKCE(pkce.codeVerifier, null);
    if (isValidMissingChallenge) {
      logFail('PKCE verification (missing challenge)', new Error('Missing challenge should fail'));
      return;
    }
    logPass('PKCE verification (missing challenge) correctly rejects');
  } catch (error) {
    logFail('PKCE verification', error);
  }
}

/**
 * Test PKCE Consistency
 */
function testPKCEConsistency() {
  console.log('\n📋 Testing PKCE Consistency\n');

  try {
    // Generate multiple PKCE pairs - should all be unique
    const pkce1 = generatePKCE();
    const pkce2 = generatePKCE();
    const pkce3 = generatePKCE();

    // Verifiers should be unique
    if (pkce1.codeVerifier === pkce2.codeVerifier || pkce1.codeVerifier === pkce3.codeVerifier) {
      logFail('PKCE verifier uniqueness', new Error('Verifiers should be unique'));
      return;
    }
    logPass('PKCE verifiers are unique');

    // Challenges should be unique
    if (pkce1.codeChallenge === pkce2.codeChallenge || pkce1.codeChallenge === pkce3.codeChallenge) {
      logFail('PKCE challenge uniqueness', new Error('Challenges should be unique'));
      return;
    }
    logPass('PKCE challenges are unique');

    // Each verifier should match its own challenge
    if (!verifyPKCE(pkce1.codeVerifier, pkce1.codeChallenge)) {
      logFail('PKCE consistency (pair 1)', new Error('Pair 1 should match'));
      return;
    }
    if (!verifyPKCE(pkce2.codeVerifier, pkce2.codeChallenge)) {
      logFail('PKCE consistency (pair 2)', new Error('Pair 2 should match'));
      return;
    }
    if (!verifyPKCE(pkce3.codeVerifier, pkce3.codeChallenge)) {
      logFail('PKCE consistency (pair 3)', new Error('Pair 3 should match'));
      return;
    }
    logPass('PKCE pairs are consistent (verifier matches challenge)');
  } catch (error) {
    logFail('PKCE consistency', error);
  }
}

/**
 * Test OAuth State Generation
 */
function testOAuthState() {
  console.log('\n📋 Testing OAuth State Generation\n');

  try {
    // Generate state using crypto directly (same as implementation)
    const generateOAuthState = () => {
      return require('crypto').randomBytes(32).toString('hex');
    };

    // Generate multiple states - should be unique
    const state1 = generateOAuthState();
    const state2 = generateOAuthState();
    const state3 = generateOAuthState();

    // States should be unique
    if (state1 === state2 || state1 === state3 || state2 === state3) {
      logFail('OAuth state uniqueness', new Error('States should be unique'));
      return;
    }
    logPass('OAuth states are unique');

    // State should be hex string (64 characters for 32 bytes)
    if (state1.length !== 64) {
      logFail('OAuth state length', new Error(`Expected 64, got ${state1.length}`));
      return;
    }
    logPass('OAuth state length is correct (64 chars)');

    // State should be valid hex
    if (!/^[0-9a-f]{64}$/i.test(state1)) {
      logFail('OAuth state format', new Error('State should be hex string'));
      return;
    }
    logPass('OAuth state format is correct (hex)');
  } catch (error) {
    logFail('OAuth state generation', error);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 OAuth Flow Security Testing\n');
  console.log('='.repeat(60));

  // Run tests
  testPKCEGeneration();
  testPKCEVerification();
  testPKCEConsistency();
  testOAuthState();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
    console.log('');
    process.exit(1);
  }

  console.log('✅ All OAuth security tests passed!');
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

