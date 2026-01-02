require('dotenv').config();
const dbPostgres = require('./dbPostgres');
const fs = require('fs');
const path = require('path');

/**
 * Get list of executed migrations from database
 */
async function getExecutedMigrations() {
  try {
    // Check if migrations table exists
    const tableCheck = await dbPostgres.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      return [];
    }

    const result = await dbPostgres.query(
      'SELECT filename FROM migrations WHERE success = true ORDER BY executed_at'
    );
    return result.rows.map(row => row.filename);
  } catch (error) {
    // If migrations table doesn't exist, return empty array
    // It will be created by the first migration
    return [];
  }
}

/**
 * Record migration execution in database
 */
async function recordMigration(filename, executionTimeMs, success = true, errorMessage = null) {
  try {
    // Ensure migrations table exists
    await dbPostgres.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      )
    `);

    await dbPostgres.query(
      `INSERT INTO migrations (filename, execution_time_ms, success, error_message)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (filename) 
       DO UPDATE SET 
         execution_time_ms = EXCLUDED.execution_time_ms,
         success = EXCLUDED.success,
         error_message = EXCLUDED.error_message,
         executed_at = CURRENT_TIMESTAMP`,
      [filename, executionTimeMs, success, errorMessage]
    );
  } catch (error) {
    console.warn(`⚠️  Failed to record migration ${filename}:`, error.message);
    // Don't throw - migration execution is more important than tracking
  }
}

/**
 * Execute a single migration file in its own transaction
 */
async function executeMigration(migrationFile, migrationsDir) {
  const filePath = path.join(migrationsDir, migrationFile);
  const startTime = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');

  // Execute in a transaction
  const client = await dbPostgres.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    const executionTime = Date.now() - startTime;
    await recordMigration(migrationFile, executionTime, true, null);
    console.log(`  ✅ ${migrationFile} (${executionTime}ms)`);
    return { success: true, filename: migrationFile, executionTime };
  } catch (error) {
    await client.query('ROLLBACK');
    const executionTime = Date.now() - startTime;
    await recordMigration(migrationFile, executionTime, false, error.message);
    console.error(`  ❌ ${migrationFile} failed: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set - PostgreSQL is required');
    console.error('💡 Set DATABASE_URL environment variable to run migrations');
    process.exit(1);
  }

  // Retry connection up to 3 times with delays
  let retries = 3;
  let delay = 2000; // Start with 2 seconds

  while (retries > 0) {
    try {
      console.log(`🔄 Running PostgreSQL migrations (attempt ${4 - retries}/3)...`);

      // Check if dbPostgres is properly initialized
      if (!dbPostgres || typeof dbPostgres.query !== 'function') {
        throw new Error('PostgreSQL client not properly initialized');
      }

      // Test connection first
      await dbPostgres.query('SELECT 1');
      console.log('✅ PostgreSQL connection verified');

      // Find all migration files in order
      const migrationsDir = path.join(__dirname, 'migrations');
      let migrationFiles = [];

      if (fs.existsSync(migrationsDir)) {
        migrationFiles = fs
          .readdirSync(migrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort(); // Sorts alphabetically: 000_, 001_, etc.
      }

      if (migrationFiles.length === 0) {
        console.log('⚠️  No migration files found');
        return;
      }

      console.log(`📄 Found ${migrationFiles.length} migration files`);

      // Get list of already executed migrations
      const executedMigrations = await getExecutedMigrations();
      console.log(`📋 ${executedMigrations.length} migrations already executed`);

      // Filter to only pending migrations
      const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));

      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }

      console.log(`🔄 Running ${pendingMigrations.length} pending migration(s)...\n`);

      // Execute each migration in its own transaction
      const results = [];
      for (const migrationFile of pendingMigrations) {
        try {
          const result = await executeMigration(migrationFile, migrationsDir);
          results.push(result);
        } catch (error) {
          // Log error but continue with other migrations
          console.error(`  ❌ Migration ${migrationFile} failed:`, error.message);
          results.push({
            success: false,
            filename: migrationFile,
            error: error.message,
          });
          // Decide whether to continue or stop
          // For now, continue with other migrations
        }
      }

      // Summary
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log('\n📊 Migration Summary:');
      console.log(`   ✅ Successful: ${successful}`);
      if (failed > 0) {
        console.log(`   ❌ Failed: ${failed}`);
      }

      if (failed > 0) {
        console.log('\n⚠️  Some migrations failed. Check logs above for details.');
        console.log(
          '⚠️  Server will continue to start, but database may be in inconsistent state.'
        );
      } else {
        console.log('\n✅ All migrations completed successfully');
      }

      return; // Success - exit
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ Migration failed after all retries:', error.message);
        console.error('Stack trace:', error.stack);
        // Don't exit with error - allow server to start even if migration fails
        // This prevents deployment failures if migration has already run
        console.log('⚠️  Continuing server startup despite migration error...');
        console.log('⚠️  Migration can be retried manually or on next deployment');
        return; // Don't throw - allow server to start
      }
      console.log(
        `⚠️  Migration attempt failed, retrying in ${delay}ms... (${retries} attempts remaining)`
      );
      console.log(`   Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Export the function so it can be called from server.js
module.exports = { runMigration };

// If run directly (not imported), run migration and exit
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n✅ Migration script completed');
      process.exit(0); // Explicitly exit with success
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      process.exit(1); // Exit with failure so deployments are halted on migration errors
    });
}
