# Quality Enforcement Setup Guide

This guide will help you set up the quality enforcement system to ensure code quality and prevent technical debt.

## Quick Start

1. **Install dependencies and set up hooks:**

   ```bash
   chmod +x scripts/setup-quality-enforcement.sh
   ./scripts/setup-quality-enforcement.sh
   ```

2. **Format existing code:**

   ```bash
   npm run format
   ```

3. **Run tests to ensure everything works:**
   ```bash
   npm test
   ```

## What Gets Enforced

### Pre-Commit Hooks

When you commit code, these checks run automatically:

- ✅ **ESLint**: Lints your code and auto-fixes issues
- ✅ **Prettier**: Formats your code consistently
- ✅ **Console.log check**: Warns about console.log statements
- ✅ **TODO check**: Warns about TODO/FIXME comments

### Pre-Push Hooks

Before pushing to remote, these checks run:

- ✅ **All tests pass**: Both frontend and backend tests
- ✅ **No skipped tests**: Ensures test quality

### CI/CD Quality Gates

On every PR, these checks run:

- ✅ **Linting**: ESLint passes
- ✅ **Formatting**: Code is properly formatted
- ✅ **Tests**: All tests pass
- ✅ **Coverage**: Test coverage meets threshold (≥80%)
- ✅ **Security**: No known vulnerabilities
- ✅ **Build**: Project builds successfully

## Configuration Files

### `.prettierrc.json`

Prettier configuration for code formatting.

### `.lintstagedrc.js`

Configuration for lint-staged (runs linters on staged files only).

### `.husky/pre-commit`

Pre-commit hook script.

### `.husky/pre-push`

Pre-push hook script.

### `.github/workflows/quality-gates.yml`

CI/CD workflow for quality checks.

## Manual Commands

### Format Code

```bash
# Format all code
npm run format

# Check formatting (CI mode)
npm run format:check
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run frontend tests only
cd chat-client-vite && npm test

# Run backend tests only
cd chat-server && npm test
```

### Lint Code

```bash
# Lint frontend
cd chat-client-vite && npm run lint

# Fix linting issues
cd chat-client-vite && npm run lint:fix
```

## Bypassing Hooks (Not Recommended)

If you absolutely must bypass hooks (emergency only):

```bash
# Skip pre-commit hook
git commit --no-verify

# Skip pre-push hook
git push --no-verify
```

**⚠️ Warning**: Only use `--no-verify` in emergencies. Quality gates will still run in CI/CD.

## Troubleshooting

### Hooks Not Running

1. **Check Husky is installed:**

   ```bash
   ls -la .husky
   ```

2. **Reinstall Husky:**

   ```bash
   npx husky install
   ```

3. **Check hook permissions:**
   ```bash
   chmod +x .husky/pre-commit
   chmod +x .husky/pre-push
   ```

### Tests Failing

1. **Run tests locally:**

   ```bash
   npm test
   ```

2. **Check test output for errors**

3. **Fix failing tests before committing**

### Formatting Issues

1. **Auto-format code:**

   ```bash
   npm run format
   ```

2. **Check what would be formatted:**
   ```bash
   npm run format:check
   ```

## Best Practices

1. **Run tests before committing:**

   ```bash
   npm test
   ```

2. **Format code regularly:**

   ```bash
   npm run format
   ```

3. **Fix linting issues:**

   ```bash
   npm run lint:fix
   ```

4. **Keep test coverage high:**
   - Aim for ≥80% coverage
   - Add tests for new code
   - Don't delete tests without replacement

5. **Review PR checklist:**
   - Use the PR template
   - Ensure all checks pass
   - Get code review approval

## Quality Metrics

Track these metrics to ensure code health:

- **Test Coverage**: Should be ≥80% and increasing
- **Code Complexity**: Should be decreasing or stable
- **Build Time**: Should be < 10 minutes
- **Test Execution Time**: Should be < 5 minutes
- **Flaky Test Rate**: Should be < 5%

## Getting Help

If you encounter issues:

1. Check this guide
2. Review `.docs/policies/quality-enforcement-strategy.md`
3. Check CI/CD logs for errors
4. Ask the team for help

---

**Last Updated**: 2025-12-19






