#!/usr/bin/env node
/**
 * Architecture Boundary Checker
 *
 * Enforces Clean Architecture boundaries:
 * 1. Domain core (src/liaizen) must NOT import from routes, socketHandlers, or infrastructure
 * 2. Routes should use services/controllers, not direct domain imports
 * 3. Infrastructure details should not leak into domain
 *
 * Usage: node scripts/check-boundaries.js
 */

const fs = require('fs');
const path = require('path');

const SERVER_ROOT = path.join(__dirname, '..', 'chat-server');

// Boundary rules: [source pattern, forbidden import patterns, description]
const BOUNDARY_RULES = [
  {
    name: 'Domain Core Isolation',
    source: 'src/core/**/*.js',
    forbidden: [
      /require\(['"]\.\.\/\.\.\/\.\.\/routes/,
      /require\(['"]\.\.\/\.\.\/\.\.\/socketHandlers/,
      /require\(['"]\.\.\/\.\.\/\.\.\/server/,
      /require\(['"]express['"]\)/,
      /require\(['"]socket\.io['"]\)/,
    ],
    description: 'Domain core must not depend on delivery mechanisms (routes, sockets, express)',
  },
  {
    name: 'Domain Entity Isolation',
    source: 'src/domain/**/*.js',
    forbidden: [
      /require\(['"]\.\.\/\.\.\/routes/,
      /require\(['"]\.\.\/\.\.\/socketHandlers/,
      /require\(['"]express['"]\)/,
    ],
    description: 'Domain entities must not depend on delivery mechanisms',
  },
  {
    name: 'Route Layer Abstraction',
    source: 'routes/**/*.js',
    forbidden: [/require\(['"]\.\.\/src\/liaizen\/core\/mediator['"]\)/],
    allowed: [
      /require\(['"]\.\.\/socketHandlers\/aiHelper['"]\)/, // OK - goes through handler
      /require\(['"]\.\.\/services\//, // OK - service layer
    ],
    description: 'Routes should use services/handlers, not direct domain core imports',
  },
  {
    name: 'Socket Handler Boundaries',
    source: 'socketHandlers/**/*.js',
    forbidden: [/require\(['"]\.\.\/dbPostgres['"]\)(?!.*\/\/\s*boundary-ok)/],
    description:
      'Socket handlers should use repositories, not direct DB access (add // boundary-ok to override)',
  },
];

function getFiles(dir, pattern) {
  const files = [];
  const regex = new RegExp(pattern.replace('**/', '.*').replace('*.js', '.*\\.js$'));

  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory() && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        const relativePath = path.relative(SERVER_ROOT, fullPath);
        if (regex.test(relativePath)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(path.join(SERVER_ROOT, pattern.split('/')[0]));
  return files;
}

function checkFile(filePath, rule) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const pattern of rule.forbidden) {
    const matches = content.match(pattern);
    if (matches) {
      // Find line number
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          violations.push({
            file: path.relative(SERVER_ROOT, filePath),
            line: i + 1,
            match: lines[i].trim().substring(0, 80),
            rule: rule.name,
          });
        }
      }
    }
  }

  return violations;
}

function main() {
  console.log('\n🔍 Architecture Boundary Check\n' + '='.repeat(50) + '\n');

  let totalViolations = 0;
  const allViolations = [];

  for (const rule of BOUNDARY_RULES) {
    const files = getFiles(SERVER_ROOT, rule.source);
    console.log(`📁 ${rule.name}: Checking ${files.length} files...`);

    for (const file of files) {
      const violations = checkFile(file, rule);
      if (violations.length > 0) {
        allViolations.push(...violations);
        totalViolations += violations.length;
      }
    }
  }

  console.log('\n' + '='.repeat(50));

  if (totalViolations === 0) {
    console.log('\n✅ No boundary violations found!\n');
    console.log('Architecture boundaries are being respected:');
    console.log('  - Domain core is isolated from delivery mechanisms');
    console.log('  - Routes use appropriate abstraction layers');
    console.log('  - Socket handlers follow repository patterns\n');
    process.exit(0);
  } else {
    console.log(`\n❌ Found ${totalViolations} boundary violation(s):\n`);

    for (const v of allViolations) {
      console.log(`  ${v.file}:${v.line}`);
      console.log(`    Rule: ${v.rule}`);
      console.log(`    Code: ${v.match}`);
      console.log('');
    }

    console.log('💡 To fix:');
    console.log('  - Move infrastructure dependencies to outer layers');
    console.log('  - Use dependency injection or service locators');
    console.log('  - Add // boundary-ok comment for intentional exceptions\n');
    process.exit(1);
  }
}

main();
