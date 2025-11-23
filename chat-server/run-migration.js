require('dotenv').config();
const { query } = require('./dbPostgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.log('ℹ️  DATABASE_URL not set - skipping PostgreSQL migration (using SQLite)');
        return;
    }

    try {
        console.log('🔄 Running PostgreSQL migration...');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../chat-client-vite/scripts/migrate_user_context.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await query(sql);

        console.log('✅ PostgreSQL migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        // Don't exit with error - allow server to start even if migration fails
        // This prevents deployment failures if migration has already run
        console.log('⚠️  Continuing server startup despite migration error...');
    }
}

runMigration();
