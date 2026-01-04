#!/usr/bin/env node
/**
 * Command Discovery - Show all canonical commands
 * 
 * Usage: npm run help
 */

const commands = {
  'Development': [
    { cmd: 'npm run dev', desc: 'Start all development servers (frontend + backend)' },
    { cmd: 'npm run dev:all', desc: 'Alias for dev (start all servers)' },
    { cmd: 'npm run dev:backend', desc: 'Start backend server only' },
    { cmd: 'npm run dev:frontend', desc: 'Start frontend server only' },
    { cmd: 'npm run dev:safe', desc: 'Start with CPU watchdog (optional safety)' },
  ],
  'Production': [
    { cmd: 'npm start', desc: 'Start production server (Railway/Vercel compatible)' },
  ],
  'Stop & Restart': [
    { cmd: 'npm stop', desc: 'Stop all development servers' },
    { cmd: 'npm run restart', desc: 'Restart all development servers' },
    { cmd: 'npm run restart:backend', desc: 'Restart backend server only' },
    { cmd: 'npm run restart:frontend', desc: 'Restart frontend server only' },
  ],
  'Testing': [
    { cmd: 'npm test', desc: 'Run all tests (backend + frontend)' },
    { cmd: 'npm run test:backend', desc: 'Run backend tests only' },
    { cmd: 'npm run test:frontend', desc: 'Run frontend tests only' },
    { cmd: 'npm run test:coverage', desc: 'Run all tests with coverage' },
  ],
  'Code Quality': [
    { cmd: 'npm run lint', desc: 'Run ESLint (frontend)' },
    { cmd: 'npm run lint:fix', desc: 'Auto-fix linting issues' },
    { cmd: 'npm run format', desc: 'Format code with Prettier' },
    { cmd: 'npm run format:check', desc: 'Check formatting without fixing' },
    { cmd: 'npm run secrets:scan', desc: 'Scan for secrets in codebase' },
  ],
  'Build': [
    { cmd: 'npm run build', desc: 'Build frontend client for production' },
    { cmd: 'npm run build:client', desc: 'Alias for build' },
  ],
  'Database': [
    { cmd: 'npm run migrate', desc: 'Run database migrations (from chat-server)' },
    { cmd: 'npm run migrate:status', desc: 'Check migration status' },
    { cmd: 'npm run db:validate', desc: 'Validate database schema' },
    { cmd: 'npm run db:backup', desc: 'Backup database' },
  ],
  'Utilities': [
    { cmd: 'npm run help', desc: 'Show this help message' },
    { cmd: 'npm run doctor', desc: 'Validate environment, ports, and dependencies' },
    { cmd: 'npm run preflight', desc: 'Run pre-deployment checks' },
    { cmd: 'npm run preflight:quick', desc: 'Quick preflight (skip build)' },
    { cmd: 'npm run preflight:full', desc: 'Full preflight with health check' },
  ],
};

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

console.log(`${colors.bold}${colors.cyan}LiaiZen - Canonical Commands${colors.reset}`);
console.log(`${colors.gray}═══════════════════════════════════════════════════════════${colors.reset}\n`);

for (const [category, cmds] of Object.entries(commands)) {
  console.log(`${colors.bold}${colors.blue}${category}${colors.reset}`);
  for (const { cmd, desc } of cmds) {
    console.log(`  ${colors.green}${cmd.padEnd(30)}${colors.reset} ${desc}`);
  }
  console.log('');
}

console.log(`${colors.gray}═══════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.yellow}💡 Tip:${colors.reset} Use ${colors.green}npm run doctor${colors.reset} to validate your setup\n`);

