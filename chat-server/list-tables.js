const db = require('./dbPostgres.js');

async function listTables() {
  if (!db.isReady()) {
    console.log('Database not ready, waiting...');
    setTimeout(listTables, 1000);
    return;
  }

  try {
    const res = await db.query(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND
            schemaname != 'information_schema';
    `);
    console.log(
      'Tables:',
      res.rows.map(r => r.tablename)
    );
  } catch (err) {
    console.error('Error listing tables:', err);
  } finally {
    db.end();
  }
}

listTables();
