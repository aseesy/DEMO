/**
 * Jest Setup - Sets environment variables for tests
 * This runs before each test file
 */

// Set a mock DATABASE_URL for tests that require database modules
// Tests should mock the actual database calls, this just prevents
// the module from throwing on import
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

// Set JWT_SECRET for tests that require auth middleware
// Must be at least 32 characters long
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-characters-long-for-jest-tests';
