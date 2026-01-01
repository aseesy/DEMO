/**
 * Jest Configuration for chat-server
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/libs/language-analyzer/', // Stale duplicate - real code is in src/liaizen/analysis/
    '.*\\.integration\\.test\\.js$', // Integration tests require running server
  ],
  collectCoverageFrom: [
    'auth.js',
    'middleware/auth.js',
    'routes/auth.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: [],
};
