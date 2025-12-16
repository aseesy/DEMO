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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Enforce camelCase naming conventions
      'camelcase': ['error', {
        properties: 'always',
        ignoreDestructuring: false,
        ignoreImports: false,
        ignoreGlobals: false,
        // Allow snake_case for database column names in destructuring
        allow: [
          '^user_id$',
          '^created_at$',
          '^updated_at$',
          '^room_id$',
          '^message_id$',
          '^sender_id$',
          '^receiver_id$',
          '^feedback_type$',
          '^context_json$',
          '^field_overrides$',
          '^personal_visibility$',
          '^work_visibility$',
          '^health_visibility$',
          '^financial_visibility$',
          '^background_visibility$',
        ]
      }],
    },
  },
])
