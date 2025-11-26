const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function wipeAllData() {
    let client;
    try {
        client = await pool.connect();
        console.log('🗑️  Wiping all user data from database...');
        console.log('⚠️  This will delete ALL data but keep the schema intact');

        // Get list of all tables that exist
        const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

        const existingTables = tablesResult.rows.map(row => row.tablename);
        console.log(`📊 Found ${existingTables.length} tables:`, existingTables.join(', '));

        // Tables to truncate (in order to respect foreign key constraints)
        const tablesToWipe = [
            'notifications',
            'child_activities',
            'activities',
            'contacts',
            'tasks',
            'expenses',
            'agreements',
            'message_flags',
            'messages',
            'threads',
            'communication_stats',
            'escalation_tracking',
            'user_intervention_preferences',
            'user_feedback',
            'relationship_insights',
            'room_invites',
            'room_members',
            'rooms',
            'invitations',
            'pending_connections',
            'user_context',
            'users'
        ];

        // Filter to only tables that exist
        const tablesToTruncate = tablesToWipe.filter(table => existingTables.includes(table));
        const missingTables = tablesToWipe.filter(table => !existingTables.includes(table));

        if (missingTables.length > 0) {
            console.log(`⚠️  Skipping ${missingTables.length} tables that don't exist:`, missingTables.join(', '));
        }

        if (tablesToTruncate.length === 0) {
            console.log('⚠️  No tables to truncate!');
            return;
        }

        console.log(`✅ Will truncate ${tablesToTruncate.length} tables:`, tablesToTruncate.join(', '));

        // Truncate all tables with CASCADE to handle foreign keys
        const query = `TRUNCATE TABLE ${tablesToTruncate.join(', ')} CASCADE;`;

        await client.query(query);

        console.log('✅ All user data wiped successfully!');
        console.log('✅ Schema preserved - all tables still exist');

        // Verify tables still exist
        const verifyResult = await client.query(`
      SELECT COUNT(*) as table_count 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
        console.log(`✅ Verified: ${verifyResult.rows[0].table_count} tables still exist`);

    } catch (err) {
        console.error('❌ Error wiping database:', err);
        throw err;
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

// Run the wipe
wipeAllData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
