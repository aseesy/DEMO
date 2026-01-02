#!/usr/bin/env node
/**
 * Railway Environment Variable Validation Script
 *
 * Checks that all required environment variables are set in Railway.
 * Requires Railway CLI to be installed and authenticated.
 */

const { execSync } = require('child_process');
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

// Required environment variables for Railway
const REQUIRED_RAILWAY_VARS = {
  // Critical - Server won't start without these
  DATABASE_URL: {
    required: true,
    description:
      'PostgreSQL database connection string (auto-injected by Railway PostgreSQL addon)',
    note: 'Railway automatically provides this when PostgreSQL is connected',
  },
  JWT_SECRET: {
    required: true,
    description: 'Secret key for JWT token signing',
    example: 'your-super-secret-jwt-key-min-32-chars',
  },
  // Required for production
  NODE_ENV: {
    required: true,
    description: 'Node environment',
    example: 'production',
    default: 'production',
  },
  PORT: {
    required: true,
    description: 'Server port (Railway sets this automatically, but can override)',
    example: '3000',
    default: 'Railway auto-assigns',
  },
  FRONTEND_URL: {
    required: true,
    description: 'Comma-separated list of allowed frontend URLs for CORS',
    example: 'https://coparentliaizen.com,https://www.coparentliaizen.com,https://*.vercel.app',
  },
  // Optional but recommended
  APP_NAME: {
    required: false,
    description: 'Application name',
    example: 'LiaiZen',
  },
  APP_URL: {
    required: false,
    description: 'Application URL',
    example: 'https://coparentliaizen.com',
  },
  // Email Configuration
  EMAIL_SERVICE: {
    required: false,
    description: 'Email service provider',
    example: 'gmail',
    default: 'gmail',
  },
  GMAIL_USER: {
    required: false,
    description: 'Gmail address for sending emails',
    example: 'info@liaizen.com',
  },
  GMAIL_APP_PASSWORD: {
    required: false,
    description: 'Gmail app password (not regular password)',
    example: 'xxxx xxxx xxxx xxxx',
  },
  EMAIL_FROM: {
    required: false,
    description: 'Email sender address',
    example: 'info@liaizen.com',
  },
  // AI/ML Services
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
  // Neo4j
  NEO4J_URI: {
    required: false,
    description: 'Neo4j database URI',
    example: 'neo4j+s://xxxxx.databases.neo4j.io',
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
  NEO4J_DATABASE: {
    required: false,
    description: 'Neo4j database name',
    example: 'neo4j',
    default: 'neo4j',
  },
  // OAuth
  GOOGLE_CLIENT_ID: {
    required: false,
    description: 'Google OAuth client ID',
    example: 'xxxxx.apps.googleusercontent.com',
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    description: 'Google OAuth client secret',
    example: 'GOCSPX-...',
  },
  OAUTH_CLIENT_ID: {
    required: false,
    description: 'OAuth client ID (may be same as GOOGLE_CLIENT_ID)',
    example: 'xxxxx.apps.googleusercontent.com',
  },
  OAUTH_CLIENT_SECRET: {
    required: false,
    description: 'OAuth client secret (may be same as GOOGLE_CLIENT_SECRET)',
    example: 'GOCSPX-...',
  },
  // Other
  GITHUB_TOKEN: {
    required: false,
    description: 'GitHub token for API access',
    example: 'ghp_...',
  },
  MCP_SERVICE_TOKEN: {
    required: false,
    description: 'MCP service token',
    example: 'ghp_...',
  },
};

function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkRailwayAuth() {
  try {
    execSync('railway whoami', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

function getRailwayVariables() {
  try {
    const output = execSync('railway variables', { encoding: 'utf8' });
    const vars = {};

    // Parse Railway CLI output
    // Format is typically: KEY=VALUE or KEY (if secret)
    const lines = output.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        !trimmed ||
        trimmed.startsWith('║') ||
        trimmed.startsWith('═') ||
        trimmed.startsWith('─')
      ) {
        continue;
      }

      // Match KEY=VALUE or just KEY (for secrets)
      const match =
        trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i) ||
        trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*$/);

      if (match) {
        const key = match[1];
        const value = match[2] || '[SECRET]';
        vars[key] = value;
      }
    }

    return vars;
  } catch (error) {
    console.error(colorize('❌ Error fetching Railway variables', 'red'));
    console.error(error.message);
    return null;
  }
}

function validateRailwayEnv(railwayVars) {
  console.log(`\n${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize('Validating Railway Environment Variables', 'cyan')}`);
  console.log(`${colorize('═'.repeat(60), 'cyan')}\n`);

  let allValid = true;
  const missing = [];
  const present = [];
  const optional = [];

  for (const [key, config] of Object.entries(REQUIRED_RAILWAY_VARS)) {
    const value = railwayVars[key];
    const isSet = value !== undefined && value !== '' && value !== '[SECRET]';

    if (config.required) {
      if (!isSet) {
        missing.push({ key, config });
        allValid = false;
        console.log(`${colorize('❌ MISSING', 'red')} ${colorize(key, 'yellow')}`);
        console.log(`   ${config.description}`);
        if (config.example) {
          console.log(`   Example: ${config.example}`);
        }
        if (config.note) {
          console.log(`   ${colorize('Note:', 'blue')} ${config.note}`);
        }
        console.log();
      } else {
        present.push({ key, config, value });
        const displayValue =
          value === '[SECRET]'
            ? '[SECRET]'
            : value.length > 50
              ? value.substring(0, 50) + '...'
              : value;
        console.log(`${colorize('✅ SET', 'green')} ${colorize(key, 'yellow')}`);
        console.log(`   Value: ${colorize(displayValue, 'green')}`);
        if (config.note) {
          console.log(`   ${colorize('Note:', 'blue')} ${config.note}`);
        }
        console.log();
      }
    } else {
      if (isSet) {
        present.push({ key, config, value });
        const displayValue =
          value === '[SECRET]'
            ? '[SECRET]'
            : value.length > 50
              ? value.substring(0, 50) + '...'
              : value;
        console.log(`${colorize('✓ SET (optional)', 'blue')} ${colorize(key, 'yellow')}`);
        console.log(`   Value: ${colorize(displayValue, 'blue')}`);
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
  console.log(colorize('\n🔍 Railway Environment Variable Validation\n', 'cyan'));

  // Check Railway CLI
  if (!checkRailwayCLI()) {
    console.error(colorize('❌ Railway CLI not found!', 'red'));
    console.error('Install with: npm i -g @railway/cli');
    console.error('Or: brew install railway');
    process.exit(1);
  }

  console.log(colorize('✅ Railway CLI found', 'green'));

  // Check authentication
  if (!checkRailwayAuth()) {
    console.error(colorize('❌ Not authenticated with Railway!', 'red'));
    console.error('Run: railway login');
    process.exit(1);
  }

  console.log(colorize('✅ Authenticated with Railway', 'green'));

  // Get Railway variables
  console.log(colorize('\n📥 Fetching Railway variables...', 'cyan'));
  const railwayVars = getRailwayVariables();

  if (!railwayVars) {
    process.exit(1);
  }

  console.log(
    colorize(`✅ Found ${Object.keys(railwayVars).length} variables in Railway\n`, 'green')
  );

  // Validate
  const result = validateRailwayEnv(railwayVars);

  // Final summary
  console.log(`${colorize('═'.repeat(60), 'cyan')}`);
  console.log(`${colorize('Final Summary', 'cyan')}`);
  console.log(`${colorize('═'.repeat(60), 'cyan')}\n`);

  if (result.allValid) {
    console.log(colorize('✅ All required Railway environment variables are set!', 'green'));
    console.log();
    console.log('📝 To set missing optional variables, use:');
    console.log('   railway variables set KEY=value');
    console.log();
    console.log('📝 Or use the setup script:');
    console.log('   ./scripts/set-railway-vars.sh');
    process.exit(0);
  } else {
    console.log(colorize('❌ Some required Railway environment variables are missing!', 'red'));
    console.log();
    console.log('📝 Set missing variables using:');
    for (const { key, config } of result.missing) {
      console.log(`   railway variables set ${key}='<value>'`);
    }
    console.log();
    console.log('📝 Or use the setup script:');
    console.log('   ./scripts/set-railway-vars.sh');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateRailwayEnv, getRailwayVariables, REQUIRED_RAILWAY_VARS };
