#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 *
 * Checks that all required environment variables are set for both
 * server and client applications.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Required environment variables
const REQUIRED_SERVER_VARS = {
  // Critical - Server won't start without these
  DATABASE_URL: {
    required: true,
    description: 'PostgreSQL database connection string',
    example: 'postgresql://user:password@localhost:5432/dbname',
  },
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token signing',
    example: 'your-secret-key-change-in-production',
  },
  // Optional but recommended
  PORT: {
    required: false,
    description: 'Server port (defaults to 3001)',
    example: '3000',
    default: '3001',
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment (development/production)',
    example: 'development',
    default: 'development',
  },
  FRONTEND_URL: {
    required: false,
    description: 'Comma-separated list of allowed frontend URLs for CORS',
    example: 'http://localhost:5173,http://localhost:3000',
    default: 'http://localhost:5173,http://localhost:3000',
  },
  // Optional - Feature-specific
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API key (if using OpenAI features)',
    example: 'sk-...',
  },
  ANTHROPIC_API_KEY: {
    required: false,
    description: 'Anthropic API key (if using Anthropic features)',
    example: 'sk-ant-...',
  },
  EMAIL_SERVICE: {
    required: false,
    description: 'Email service provider',
    example: 'gmail',
    default: 'gmail',
  },
  GMAIL_USER: {
    required: false,
    description: 'Gmail address for sending emails',
    example: 'your-email@gmail.com',
  },
  GMAIL_APP_PASSWORD: {
    required: false,
    description: 'Gmail app password (not regular password)',
    example: 'xxxx xxxx xxxx xxxx',
  },
  NEO4J_URI: {
    required: false,
    description: 'Neo4j database URI (if using Neo4j)',
    example: 'bolt://localhost:7687',
  },
  NEO4J_USER: {
    required: false,
    description: 'Neo4j username',
    example: 'neo4j',
  },
  NEO4J_PASSWORD: {
    required: false,
    description: 'Neo4j password',
    example: 'password',
  },
};

const REQUIRED_CLIENT_VARS = {
  // Critical for development
  VITE_API_URL: {
    required: false,
    description: 'Backend API URL (defaults to http://localhost:3000)',
    example: 'http://localhost:3000',
    default: 'http://localhost:3000',
  },
  // Optional - Feature-specific
  VITE_WS_URL: {
    required: false,
    description: 'WebSocket URL (defaults to VITE_API_URL)',
    example: 'ws://localhost:3000',
  },
  VITE_GOOGLE_TAG: {
    required: false,
    description: 'Google Tag Manager/Analytics script',
    example: '<script>...</script>',
  },
  VITE_GA_MEASUREMENT_ID: {
    required: false,
    description: 'Google Analytics Measurement ID',
    example: 'G-XXXXXXXXXX',
  },
  VITE_GOOGLE_PLACES_API_KEY: {
    required: false,
    description: 'Google Places API key',
    example: 'AIza...',
  },
  VITE_VAPID_PUBLIC_KEY: {
    required: false,
    description: 'VAPID public key for push notifications',
    example: 'BG...',
  },
  VITE_DEBUG_AUTH: {
    required: false,
    description: 'Enable auth debugging',
    example: 'true',
  },
};

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  }

  return env;
}

function validateEnv(env, requiredVars, name) {
  console.log(`\n${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize(`Validating ${name} Environment Variables`, 'cyan')}`);
  console.log(`${colorize('═'.repeat(60), 'cyan')}\n`);

  let allValid = true;
  const missing = [];
  const present = [];
  const optional = [];

  for (const [key, config] of Object.entries(requiredVars)) {
    const value = env[key];
    const isSet = value !== undefined && value !== '';

    if (config.required) {
      if (!isSet) {
        missing.push({ key, config });
        allValid = false;
        console.log(`${colorize('❌ MISSING', 'red')} ${colorize(key, 'yellow')}`);
        console.log(`   ${config.description}`);
        if (config.example) {
          console.log(`   Example: ${config.example}`);
        }
        console.log();
      } else {
        present.push({ key, config, value });
        console.log(`${colorize('✅ SET', 'green')} ${colorize(key, 'yellow')}`);
        console.log(
          `   Value: ${colorize(value.substring(0, 50) + (value.length > 50 ? '...' : ''), 'green')}`
        );
        console.log();
      }
    } else {
      if (isSet) {
        present.push({ key, config, value });
        console.log(`${colorize('✓ SET (optional)', 'blue')} ${colorize(key, 'yellow')}`);
        console.log(
          `   Value: ${colorize(value.substring(0, 50) + (value.length > 50 ? '...' : ''), 'blue')}`
        );
        console.log();
      } else {
        optional.push({ key, config });
        const defaultVal = config.default || 'not set';
        console.log(
          `${colorize('○ OPTIONAL', 'cyan')} ${colorize(key, 'yellow')} (default: ${defaultVal})`
        );
        console.log(`   ${config.description}`);
        if (config.example) {
          console.log(`   Example: ${config.example}`);
        }
        console.log();
      }
    }
  }

  // Summary
  console.log(`${colorize('─'.repeat(60), 'cyan')}`);
  console.log(`Summary:`);
  console.log(
    `  ${colorize('✅ Required (set)', 'green')}: ${present.filter(p => p.config.required).length}`
  );
  console.log(`  ${colorize('❌ Required (missing)', 'red')}: ${missing.length}`);
  console.log(
    `  ${colorize('✓ Optional (set)', 'blue')}: ${present.filter(p => !p.config.required).length}`
  );
  console.log(`  ${colorize('○ Optional (not set)', 'cyan')}: ${optional.length}`);
  console.log();

  return { allValid, missing, present, optional };
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const serverEnvPath = path.join(rootDir, 'chat-server', '.env');
  const clientEnvPath = path.join(rootDir, 'chat-client-vite', '.env');
  const clientEnvLocalPath = path.join(rootDir, 'chat-client-vite', '.env.local');

  console.log(colorize('\n🔍 Environment Variable Validation\n', 'cyan'));

  // Load environment files
  const serverEnv = loadEnvFile(serverEnvPath);
  const clientEnv = { ...loadEnvFile(clientEnvPath), ...loadEnvFile(clientEnvLocalPath) };

  // Validate server
  const serverResult = validateEnv(serverEnv, REQUIRED_SERVER_VARS, 'Server');

  // Validate client
  const clientResult = validateEnv(clientEnv, REQUIRED_CLIENT_VARS, 'Client');

  // Final summary
  console.log(`${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize('Final Summary', 'cyan')}`);
  console.log(`${colorize('═'.repeat(60), 'cyan')}\n`);

  if (serverResult.allValid && clientResult.allValid) {
    console.log(colorize('✅ All required environment variables are set!', 'green'));
    process.exit(0);
  } else {
    console.log(colorize('❌ Some required environment variables are missing!', 'red'));
    console.log();
    console.log('Please set the missing variables in:');
    if (!serverResult.allValid) {
      console.log(`  ${colorize('chat-server/.env', 'yellow')}`);
    }
    if (!clientResult.allValid) {
      console.log(`  ${colorize('chat-client-vite/.env', 'yellow')}`);
    }
    console.log();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnv, loadEnvFile, REQUIRED_SERVER_VARS, REQUIRED_CLIENT_VARS };
