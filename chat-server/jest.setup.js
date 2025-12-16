/**
 * Jest Setup - Sets environment variables for tests
 * This runs before each test file
 */

// Set a mock DATABASE_URL for tests that require database modules
// Tests should mock the actual database calls, this just prevents
// the module from throwing on import
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
