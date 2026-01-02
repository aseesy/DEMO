import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    exclude: ['**/node_modules/**', '**/*.integration.test.{js,jsx}', '**/*.network.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        'dist/',
        '**/__mocks__/**',
        // Exclude files that are difficult to unit test
        'src/utils/analytics*.js', // Analytics integration code
        'src/utils/errorHandlers/**', // Error handler implementations
        'src/services/socket/**', // Socket.io integration (tested via integration tests)
        'src/services/message/**', // Message queue (tested via integration tests)
        '**/index.js', // Barrel exports
      ],
      thresholds: {
        // Realistic thresholds based on current coverage
        // Target: Gradually increase these as coverage improves
        lines: 25,
        functions: 22,
        branches: 18,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
