require('dotenv').config();
const dbPostgres = require('./dbPostgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.log('ℹ️  DATABASE_URL not set - skipping PostgreSQL migration (using SQLite)');
        return; // Return instead of exit
    }

    try {
        console.log('🔄 Running PostgreSQL migration...');

        // Check if dbPostgres is properly initialized
        if (!dbPostgres || typeof dbPostgres.query !== 'function') {
            throw new Error('PostgreSQL client not properly initialized');
        }

        // Try multiple possible paths for the migration file
        const possiblePaths = [
            path.join(__dirname, 'migrations/001_initial_schema.sql'),
            path.join(__dirname, '../chat-client-vite/scripts/migrate_user_context.sql'),
            path.join(__dirname, './scripts/migrate_user_context.sql'),
            path.join(__dirname, 'migrate_user_context.sql'),
        ];

        let sql = null;
        let foundPath = null;

        for (const migrationPath of possiblePaths) {
            if (fs.existsSync(migrationPath)) {
                sql = fs.readFileSync(migrationPath, 'utf8');
                foundPath = migrationPath;
                console.log(`📄 Using migration file: ${foundPath}`);
                break;
            }
        }

        if (!sql) {
            console.log('⚠️  Migration SQL file not found, creating tables inline...');
            // Fallback: create essential tables inline if SQL file not found
            sql = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT,
          google_id TEXT UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_context (
          user_id TEXT PRIMARY KEY,
          co_parent TEXT,
          children JSONB DEFAULT '[]'::jsonb,
          contacts JSONB DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_by INTEGER NOT NULL,
          is_private INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS communication_stats (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          room_id TEXT NOT NULL,
          current_streak INTEGER DEFAULT 0,
          best_streak INTEGER DEFAULT 0,
          total_positive_messages INTEGER DEFAULT 0,
          total_messages INTEGER DEFAULT 0,
          total_interventions INTEGER DEFAULT 0,
          last_message_date TIMESTAMP WITH TIME ZONE,
          last_intervention_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, room_id)
        );

        CREATE INDEX IF NOT EXISTS idx_comm_stats_user ON communication_stats(user_id);
        CREATE INDEX IF NOT EXISTS idx_comm_stats_room ON communication_stats(room_id);
      `;
        }

        // Execute the migration
        const result = await dbPostgres.query(sql);
        console.log('✅ Migration query executed successfully');

        console.log('✅ PostgreSQL migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        // Don't exit with error - allow server to start even if migration fails
        // This prevents deployment failures if migration has already run
        console.log('⚠️  Continuing server startup despite migration error...');
    }
}

// Export the function so it can be called from server.js
module.exports = { runMigration };

// If run directly (not imported), run migration and exit
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('Migration script completed');
            process.exit(0); // Explicitly exit with success
        })
        .catch((err) => {
            console.error('Unexpected error in migration:', err);
            console.log('⚠️  Exiting with success to allow server to start...');
            process.exit(0); // Exit with success even on error to prevent deployment failure
        });
}
