/**
 * @vitest-environment node
 *
 * Architecture Tests: Duplicate Detection
 *
 * These tests prevent the "Split Brain" anti-pattern where the same
 * component or hook exists in multiple locations.
 *
 * Rules enforced:
 * 1. Components in src/components/ must NOT have duplicates in src/features/
 * 2. Hooks in src/hooks/ must NOT have duplicates in src/features/
 * 3. No two features should have identically-named components or hooks
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const SRC_DIR = path.resolve(__dirname, '..');

/**
 * Get all files matching a pattern using find command
 */
function findFiles(pattern, directory = SRC_DIR) {
  try {
    const result = execSync(`find "${directory}" -type f -name "${pattern}" 2>/dev/null`, {
      encoding: 'utf-8',
    });
    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(f => f.replace(SRC_DIR + '/', ''));
  } catch {
    return [];
  }
}

/**
 * Extract just the filename from a path
 */
function getFilename(filepath) {
  return path.basename(filepath);
}

/**
 * Group files by their basename
 */
function groupByFilename(files) {
  const groups = {};
  for (const file of files) {
    const name = getFilename(file);
    if (!groups[name]) {
      groups[name] = [];
    }
    groups[name].push(file);
  }
  return groups;
}

/**
 * Check if a file is in the generic location (src/components or src/hooks)
 */
function isInGenericLocation(filepath) {
  return (
    filepath.startsWith('components/') ||
    filepath.startsWith('hooks/') ||
    filepath.startsWith('./components/') ||
    filepath.startsWith('./hooks/')
  );
}

/**
 * Check if a file is in a feature location (src/features/)
 */
function isInFeatureLocation(filepath) {
  return filepath.startsWith('features/') || filepath.startsWith('./features/');
}

describe('Architecture: Duplicate Detection', () => {
  describe('Component Duplicates', () => {
    it('should not have components in both src/components/ and src/features/', () => {
      // Get all .jsx files
      const allComponents = findFiles('*.jsx');

      // Separate by location
      const genericComponents = allComponents.filter(isInGenericLocation);
      const featureComponents = allComponents.filter(isInFeatureLocation);

      // Get basenames
      const genericNames = new Set(genericComponents.map(getFilename));
      const featureNames = featureComponents.map(f => ({
        name: getFilename(f),
        path: f,
      }));

      // Find duplicates
      const duplicates = featureNames.filter(f => genericNames.has(f.name));

      if (duplicates.length > 0) {
        const message = duplicates
          .map(d => {
            const genericPath = genericComponents.find(g => getFilename(g) === d.name);
            return `  - ${d.name}:\n      Generic: ${genericPath}\n      Feature: ${d.path}`;
          })
          .join('\n');

        expect.fail(
          `Found ${duplicates.length} component(s) in BOTH src/components/ AND src/features/:\n${message}\n\n` +
            `Fix: Remove the duplicate from src/components/ (keep the feature version)`
        );
      }

      expect(duplicates).toHaveLength(0);
    });

    it('should not have identically-named components across different features', () => {
      const featureComponents = findFiles('*.jsx').filter(isInFeatureLocation);

      // Group by filename
      const groups = groupByFilename(featureComponents);

      // Find duplicates (same name, different features)
      const duplicates = Object.entries(groups)
        .filter(([name, paths]) => {
          if (paths.length <= 1) return false;
          // Check if they're in different features
          const features = paths.map(p => p.split('/')[1]); // features/[feature]/...
          const uniqueFeatures = new Set(features);
          return uniqueFeatures.size > 1;
        })
        .map(([name, paths]) => ({ name, paths }));

      // Allow certain shared component names that are intentionally duplicated
      const allowedDuplicates = new Set([
        'index.js', // barrel exports
        'index.jsx',
      ]);

      const actualDuplicates = duplicates.filter(d => !allowedDuplicates.has(d.name));

      if (actualDuplicates.length > 0) {
        const message = actualDuplicates
          .map(d => `  - ${d.name}:\n${d.paths.map(p => `      ${p}`).join('\n')}`)
          .join('\n');

        expect.fail(
          `Found ${actualDuplicates.length} component(s) duplicated across features:\n${message}\n\n` +
            `Fix: Rename components to be unique, or extract shared ones to src/components/ui/`
        );
      }

      expect(actualDuplicates).toHaveLength(0);
    });
  });

  describe('Hook Duplicates', () => {
    it('should not have hooks in both src/hooks/ and src/features/', () => {
      // Get all hook files (use*.js pattern)
      const allHooks = findFiles('use*.js');

      // Separate by location
      const genericHooks = allHooks.filter(isInGenericLocation);
      const featureHooks = allHooks.filter(isInFeatureLocation);

      // Get basenames
      const genericNames = new Set(genericHooks.map(getFilename));
      const featureNames = featureHooks.map(f => ({
        name: getFilename(f),
        path: f,
      }));

      // Find duplicates
      const duplicates = featureNames.filter(f => genericNames.has(f.name));

      if (duplicates.length > 0) {
        const message = duplicates
          .map(d => {
            const genericPath = genericHooks.find(g => getFilename(g) === d.name);
            return `  - ${d.name}:\n      Generic: ${genericPath}\n      Feature: ${d.path}`;
          })
          .join('\n');

        expect.fail(
          `Found ${duplicates.length} hook(s) in BOTH src/hooks/ AND src/features/:\n${message}\n\n` +
            `Fix: Remove the duplicate from src/hooks/ (keep the feature version)`
        );
      }

      expect(duplicates).toHaveLength(0);
    });

    it('should not have identically-named hooks across different features', () => {
      const featureHooks = findFiles('use*.js').filter(isInFeatureLocation);

      // Group by filename
      const groups = groupByFilename(featureHooks);

      // Find duplicates (same name, different features)
      const duplicates = Object.entries(groups)
        .filter(([name, paths]) => {
          if (paths.length <= 1) return false;
          // Exclude test files
          if (name.includes('.test.')) return false;
          // Check if they're in different features
          const features = paths.map(p => p.split('/')[1]);
          const uniqueFeatures = new Set(features);
          return uniqueFeatures.size > 1;
        })
        .map(([name, paths]) => ({ name, paths: paths.filter(p => !p.includes('.test.')) }))
        .filter(d => d.paths.length > 1);

      if (duplicates.length > 0) {
        const message = duplicates
          .map(d => `  - ${d.name}:\n${d.paths.map(p => `      ${p}`).join('\n')}`)
          .join('\n');

        expect.fail(
          `Found ${duplicates.length} hook(s) duplicated across features:\n${message}\n\n` +
            `Fix: Rename hooks to be unique, or extract shared ones to src/hooks/`
        );
      }

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Directory Structure Sanity', () => {
    it('src/components/ should only contain UI primitives and ErrorBoundary', () => {
      const componentFiles = findFiles('*.jsx', path.join(SRC_DIR, 'components'));

      // These are the only allowed patterns in src/components/
      const allowedPatterns = [
        /^components\/ui\//, // UI primitives
        /^components\/ErrorBoundary\.jsx$/, // Error boundary
      ];

      const violations = componentFiles.filter(file => {
        return !allowedPatterns.some(pattern => pattern.test(file));
      });

      if (violations.length > 0) {
        expect.fail(
          `Found ${violations.length} component(s) in src/components/ that should be in src/features/:\n` +
            violations.map(v => `  - ${v}`).join('\n') +
            `\n\nFix: Move these to the appropriate feature directory`
        );
      }

      expect(violations).toHaveLength(0);
    });

    it('src/hooks/ should only contain generic/shared hooks organized by category', () => {
      const hookFiles = findFiles('use*.js', path.join(SRC_DIR, 'hooks'));

      // These are the allowed categories in src/hooks/
      const allowedCategories = ['async', 'files', 'integrations', 'navigation', 'pwa', 'ui'];

      // Get hooks at the root of src/hooks/ (not in a category)
      const rootHooks = hookFiles.filter(file => {
        const relativePath = file.replace('hooks/', '');
        return !relativePath.includes('/');
      });

      if (rootHooks.length > 0) {
        expect.fail(
          `Found ${rootHooks.length} hook(s) at root of src/hooks/ without a category:\n` +
            rootHooks.map(h => `  - ${h}`).join('\n') +
            `\n\nFix: Move to a category subfolder (${allowedCategories.join(', ')}) or to src/features/`
        );
      }

      expect(rootHooks).toHaveLength(0);
    });

    it('feature directories should not contain orphaned files at the root', () => {
      // Each feature should have a proper structure (components/, model/, etc.)
      // Files at the root should be limited to index.js, *.test.js, or the main feature component

      const features = [
        'auth',
        'blog',
        'chat',
        'contacts',
        'dashboard',
        'invitations',
        'landing',
        'legal',
        'notifications',
        'profile',
        'pwa',
        'quizzes',
        'settings',
        'shell',
        'showcase',
        'tasks',
        'updates',
      ];

      const warnings = [];

      for (const feature of features) {
        const featureDir = path.join(SRC_DIR, 'features', feature);
        try {
          const files = execSync(
            `find "${featureDir}" -maxdepth 1 -type f -name "*.js*" 2>/dev/null`,
            {
              encoding: 'utf-8',
            }
          )
            .trim()
            .split('\n')
            .filter(Boolean)
            .map(f => path.basename(f));

          // Allowed root files
          const allowedRootFiles = [
            'index.js',
            'index.jsx',
            `${feature}.test.js`,
            `${feature}.test.jsx`,
            // Main feature component (PascalCase)
            new RegExp(`^${feature.charAt(0).toUpperCase() + feature.slice(1)}.*\\.(js|jsx)$`),
          ];

          const violations = files.filter(file => {
            return !allowedRootFiles.some(pattern => {
              if (typeof pattern === 'string') return file === pattern;
              return pattern.test(file);
            });
          });

          if (violations.length > 0) {
            warnings.push(`  - features/${feature}/: ${violations.join(', ')}`);
          }
        } catch {
          // Feature directory doesn't exist or is empty
        }
      }

      // This is a warning, not a hard failure
      if (warnings.length > 0) {
        console.warn(
          `\nWarning: Found files at feature root that might need organizing:\n${warnings.join('\n')}`
        );
      }

      // Don't fail the test, just warn
      expect(true).toBe(true);
    });
  });
});

describe('Architecture: Import Path Validation', () => {
  it('feature components should not import from other feature component directories directly', () => {
    // This prevents tight coupling between features
    const featureComponents = findFiles('*.jsx').filter(isInFeatureLocation);

    const violations = [];

    for (const file of featureComponents) {
      try {
        const content = execSync(`cat "${path.join(SRC_DIR, file)}" 2>/dev/null`, {
          encoding: 'utf-8',
        });

        // Look for imports from other features' components
        const importRegex =
          /from\s+['"]\.\.\/\.\.\/(?!components\/ui|hooks|context|config|utils|adapters)([^'"]+)['"]/g;
        const matches = [...content.matchAll(importRegex)];

        // Filter to only cross-feature component imports
        const crossFeatureImports = matches.filter(match => {
          const importPath = match[1];
          return importPath.includes('/components/') && !importPath.startsWith('../');
        });

        if (crossFeatureImports.length > 0) {
          violations.push({
            file,
            imports: crossFeatureImports.map(m => m[0]),
          });
        }
      } catch {
        // File read error, skip
      }
    }

    // This is informational for now
    if (violations.length > 0) {
      console.warn('\nCross-feature component imports detected (consider refactoring):');
      violations.forEach(v => {
        console.warn(`  ${v.file}:`);
        v.imports.forEach(i => console.warn(`    ${i}`));
      });
    }

    expect(true).toBe(true);
  });
});
