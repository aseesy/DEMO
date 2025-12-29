/**
 * Jest Setup - Sets environment variables for tests
 * This runs before each test file
 */

// Set a mock DATABASE_URL for tests that require database modules
// Tests should mock the actual database calls, this just prevents
// the module from throwing on import
// Only set default if in test environment and DATABASE_URL not already set
// Use 'postgres' role which exists by default in PostgreSQL installations
if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/test';
}

// Set JWT_SECRET for tests that require auth middleware
// Must be at least 32 characters long
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jest-tests';
