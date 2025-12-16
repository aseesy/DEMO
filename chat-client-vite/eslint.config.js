import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // Service worker files - need ServiceWorker globals
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        clients: 'readonly',
        self: 'readonly',
        caches: 'readonly',
      },
    },
  },
  // Node.js scripts - need process global
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        process: 'readonly', // Vite replaces process.env at build time
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow intentionally-unused values by prefixing with "_"
      // (common when destructuring hook return values during feature development).
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[_A-Z]',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      // We consume many snake_case API fields directly (and GA4 expects snake_case keys).
      // Enforce camelCase for identifiers, but don't flag object keys or destructuring patterns.
      'camelcase': ['error', {
        properties: 'never',
        ignoreDestructuring: true,
        ignoreImports: true,
        ignoreGlobals: true,
      }],
      // This rule is too aggressive for typical React patterns (setting state in effects is normal).
      'react-hooks/set-state-in-effect': 'off',
      // Allow contexts/hooks/constants to live alongside components without breaking lint.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
