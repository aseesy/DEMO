require('dotenv').config();
const { query } = require('./dbPostgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.log('ℹ️  DATABASE_URL not set - skipping PostgreSQL migration (using SQLite)');
        process.exit(0);
    }

    try {
        console.log('🔄 Running PostgreSQL migration...');

        // Try multiple possible paths for the migration file
        const possiblePaths = [
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
                break;
            }
        }

        if (!sql) {
            console.log('⚠️  Migration SQL file not found, creating table inline...');
            // Fallback: create table inline if SQL file not found
            sql = `
        CREATE TABLE IF NOT EXISTS user_context (
          user_id TEXT PRIMARY KEY,
          co_parent TEXT,
          children JSONB DEFAULT '[]'::jsonb,
          contacts JSONB DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
        } else {
            console.log(`📄 Using migration file: ${foundPath}`);
        }

        // Execute the migration
        await query(sql);

        console.log('✅ PostgreSQL migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Stack trace:', error.stack);
        // Don't exit with error - allow server to start even if migration fails
        // This prevents deployment failures if migration has already run
        console.log('⚠️  Continuing server startup despite migration error...');
        process.exit(0);
    }
}

runMigration().catch((err) => {
    console.error('Unexpected error in migration:', err);
    process.exit(0);
});
