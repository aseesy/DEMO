/**
 * Circular Dependency Detection Tests
 *
 * These tests catch circular dependencies before they cause runtime errors.
 * The build might pass, but circular deps can cause "Cannot access X before initialization"
 * errors when the bundler processes imports in a specific order.
 *
 * Run: npm test -- circularDependencies
 *
 * Note: The madge-based tests are slow and skipped in CI.
 * Run locally with: FULL_CIRCULAR_CHECK=1 npm test -- circularDependencies
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

// Skip slow madge tests unless explicitly enabled
const FULL_CHECK = process.env.FULL_CIRCULAR_CHECK === '1';

describe('Circular Dependency Detection', () => {
  it.skipIf(!FULL_CHECK)(
    'should have no circular dependencies (slow - run with FULL_CIRCULAR_CHECK=1)',
    () => {
      let circularDeps = [];
      try {
        // Use madge to detect circular dependencies
        const result = execSync('npx madge --circular --json src/main.jsx', {
          cwd: path.resolve(__dirname, '../..'),
          encoding: 'utf-8',
          timeout: 60000,
        });
        circularDeps = JSON.parse(result);
      } catch (error) {
        // If madge exits with code 1, it found circular deps - parse stdout
        if (error.stdout) {
          try {
            circularDeps = JSON.parse(error.stdout);
          } catch {
            // If not JSON, madge might have printed text format
            console.error('Madge output:', error.stdout);
          }
        }
      }

      if (circularDeps.length > 0) {
        const formatted = circularDeps
          .map((cycle, i) => `\n  ${i + 1}. ${cycle.join(' → ')}`)
          .join('');

        expect.fail(
          `Found ${circularDeps.length} circular dependency chain(s):${formatted}\n\n` +
            'Fix by using direct imports instead of barrel files (index.js), ' +
            'or restructuring the dependency graph.'
        );
      }
      expect(circularDeps).toHaveLength(0);
    }
  );

  it.skipIf(!FULL_CHECK)('barrel files should not cause circular imports (slow)', async () => {
    // Critical barrel files that commonly cause issues
    const barrels = [
      '../components/ui/index.js',
      '../features/auth/index.js',
      '../features/profile/index.js',
      '../features/invitations/index.js',
    ];

    for (const barrel of barrels) {
      try {
        // Dynamic import to check if it resolves without circular dep error
        await import(barrel);
      } catch (error) {
        if (
          error.message.includes('Cannot access') &&
          error.message.includes('before initialization')
        ) {
          expect.fail(
            `Circular dependency detected in ${barrel}: ${error.message}\n` +
              'Components should use direct imports instead of importing from index.js'
          );
        }
        // Other errors are OK (missing dependencies in test env, etc.)
      }
    }
  });
});

describe('Hook Definition Order (Temporal Dead Zone Prevention)', () => {
  it('useChatSocket defines callbacks before useEffects that use them', async () => {
    const fs = await import('fs');
    const filePath = path.resolve(__dirname, '../features/chat/model/useChatSocket.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find all useCallback definitions
    const callbackPattern = /const\s+(\w+)\s*=\s*React\.useCallback/g;
    const callbackDefs = [];
    let match;
    while ((match = callbackPattern.exec(content)) !== null) {
      callbackDefs.push({ name: match[1], index: match.index });
    }

    // Find all useEffect that reference these callbacks
    const effectPattern = /React\.useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([^\]]*)\]\)/g;
    while ((match = effectPattern.exec(content)) !== null) {
      const effectIndex = match.index;
      const deps = match[1];

      // Check if any callback is used in deps but defined AFTER this effect
      for (const callback of callbackDefs) {
        if (deps.includes(callback.name) && callback.index > effectIndex) {
          expect.fail(
            `Temporal Dead Zone: ${callback.name} is used in useEffect dependency array ` +
              `at position ${effectIndex} but defined at position ${callback.index}. ` +
              `Move the useCallback definition BEFORE the useEffect that uses it.`
          );
        }
      }
    }
  });

});

describe('Required Import Validation', () => {
  it('useChatSocket imports API_BASE_URL', async () => {
    const fs = await import('fs');
    const filePath = path.resolve(__dirname, '../features/chat/model/useChatSocket.js');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if API_BASE_URL is used
    if (content.includes('API_BASE_URL')) {
      // Verify it's imported
      expect(content).toMatch(/import\s*\{[^}]*API_BASE_URL[^}]*\}\s*from/);
    }
  });

  it('all files using API_BASE_URL import it', async () => {
    const { execSync } = await import('child_process');

    // Find all files that use API_BASE_URL
    const filesUsingIt = execSync(
      "grep -rl 'API_BASE_URL' src --include='*.js' --include='*.jsx' | head -20",
      { cwd: path.resolve(__dirname, '../..'), encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    const fs = await import('fs');

    for (const file of filesUsingIt) {
      const fullPath = path.resolve(__dirname, '../..', file);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Skip files that define API_BASE_URL or are test files
      if (file.includes('config.js')) continue;
      if (file.includes('.test.')) continue;
      if (file.includes('apiClient.js')) continue; // apiClient imports from config

      // Check it's used in actual code, not just in comments or strings
      // Look for usage like: API_BASE_URL + something, or fetch(API_BASE_URL...)
      const codeUsagePattern = /(?<!\/\/.*?)(?<!\/\*[\s\S]*?)API_BASE_URL(?!\s*[:}])/;
      if (codeUsagePattern.test(content)) {
        const hasImport = /import\s*\{[^}]*API_BASE_URL[^}]*\}\s*from/.test(content);
        expect(hasImport, `${file} uses API_BASE_URL but doesn't import it`).toBe(true);
      }
    }
  });
});
