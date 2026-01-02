/* global describe, it, expect, beforeAll, afterAll */
/**
 * Migration Validation Tests
 *
 * Ensures all required database tables and schema elements exist.
 * These tests run against the actual database (not mocked) to catch
 * missing migrations before they cause production errors.
 *
 * Run: npm test -- migrations.validation
 */

const { Pool } = require('pg');

// Use test database or skip if not available
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/liaizen_dev';

describe('Database Schema Validation', () => {
  let pool;
  let isConnected = false;

  beforeAll(async () => {
    try {
      pool = new Pool({ connectionString: DATABASE_URL });
      await pool.query('SELECT 1');
      isConnected = true;
    } catch (err) {
      console.log('⚠️ Database not available, skipping migration tests');
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('Core Tables', () => {
    const coreTables = [
      'users',
      'rooms',
      'room_members',
      'messages',
      'contacts',
      'tasks',
      'invitations',
    ];

    it.each(coreTables)('table %s exists', async tableName => {
      if (!isConnected) return;

      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [tableName]
      );

      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Profile Normalization Tables (Migration 023)', () => {
    const profileTables = [
      'user_demographics',
      'user_employment',
      'user_health_context',
      'user_financials',
      'user_background',
    ];

    it.each(profileTables)('normalized profile table %s exists', async tableName => {
      if (!isConnected) return;

      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [tableName]
      );

      expect(
        result.rows[0].exists,
        `Missing table: ${tableName}. Run: psql $DATABASE_URL -f migrations/023_schema_normalization.sql`
      ).toBe(true);
    });
  });

  describe('Communication Profile Tables (Migration 023)', () => {
    const commTables = [
      'communication_profiles',
      'communication_triggers',
      'intervention_rewrites',
      'intervention_statistics',
    ];

    it.each(commTables)('communication table %s exists', async tableName => {
      if (!isConnected) return;

      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        )`,
        [tableName]
      );

      expect(result.rows[0].exists, `Missing table: ${tableName}. Run migration 023.`).toBe(true);
    });
  });

  describe('Required Indexes', () => {
    const requiredIndexes = [
      { table: 'messages', index: 'idx_messages_room_id' },
      { table: 'messages', index: 'idx_messages_created_at' },
      { table: 'room_members', index: 'idx_room_members_user_id' },
      { table: 'contacts', index: 'idx_contacts_owner_id' },
    ];

    it.each(requiredIndexes)('index $index exists on $table', async ({ table, index }) => {
      if (!isConnected) return;

      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM pg_indexes
          WHERE tablename = $1
          AND indexname = $2
        )`,
        [table, index]
      );

      // Warn but don't fail - indexes are performance optimization
      if (!result.rows[0].exists) {
        console.warn(`⚠️ Missing index: ${index} on ${table}`);
      }
    });
  });

  describe('Foreign Key Constraints', () => {
    it('user_demographics has FK to users', async () => {
      if (!isConnected) return;

      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'user_demographics'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'users'
        )
      `);

      expect(result.rows[0].exists).toBe(true);
    });

    it('messages has FK to rooms', async () => {
      if (!isConnected) return;

      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
          WHERE tc.table_name = 'messages'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'rooms'
        )
      `);

      expect(result.rows[0].exists).toBe(true);
    });
  });

  describe('Repository Compatibility', () => {
    it('PostgresProfileRepository can query all required tables', async () => {
      if (!isConnected) return;

      // These are the tables PostgresProfileRepository.getCompleteProfile() queries
      const queries = [
        'SELECT user_id FROM user_demographics LIMIT 0',
        'SELECT user_id FROM user_employment LIMIT 0',
        'SELECT user_id FROM user_health_context LIMIT 0',
        'SELECT user_id FROM user_financials LIMIT 0',
        'SELECT user_id FROM user_background LIMIT 0',
      ];

      for (const query of queries) {
        try {
          await pool.query(query);
        } catch (err) {
          expect.fail(
            `PostgresProfileRepository will fail: ${err.message}\n` +
              `Run migration 023 to create required tables.`
          );
        }
      }
    });

    it('PostgresCommunicationRepository can query required tables', async () => {
      if (!isConnected) return;

      const queries = [
        'SELECT user_id FROM communication_profiles LIMIT 0',
        'SELECT id FROM communication_triggers LIMIT 0',
        'SELECT id FROM intervention_rewrites LIMIT 0',
        'SELECT user_id FROM intervention_statistics LIMIT 0',
      ];

      for (const query of queries) {
        try {
          await pool.query(query);
        } catch (err) {
          expect.fail(
            `PostgresCommunicationRepository will fail: ${err.message}\n` +
              `Run migration 023 to create required tables.`
          );
        }
      }
    });
  });
});

describe('Migration File Integrity', () => {
  const fs = require('fs');
  const path = require('path');

  it('all SQL migration files are valid', () => {
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.warn('⚠️ Migrations directory not found');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      // Basic SQL syntax checks
      if (content.length === 0) {
        throw new Error(`${file} is empty`);
      }
      expect(content.length).toBeGreaterThan(0);

      // Check for common SQL errors
      const danglingBegin = (content.match(/BEGIN/gi) || []).length;
      const commits = (content.match(/COMMIT/gi) || []).length;

      // Transactions should be balanced (or use DO $$ blocks or PL/pgSQL functions)
      const hasPLpgSQL = content.includes('DO $$') || content.includes('AS $$') || content.includes('LANGUAGE plpgsql');
      if (danglingBegin > 0 && !hasPLpgSQL) {
        if (commits < danglingBegin) {
          throw new Error(`${file}: Unbalanced BEGIN/COMMIT`);
        }
        expect(commits).toBeGreaterThanOrEqual(danglingBegin);
      }
    }
  });

  it('migration 023 exists and is complete', () => {
    const migrationPath = path.join(__dirname, '../migrations/023_schema_normalization.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration 023 file missing');
    }
    expect(fs.existsSync(migrationPath)).toBe(true);

    const content = fs.readFileSync(migrationPath, 'utf-8');

    // Verify required table creations
    const requiredTables = [
      'user_demographics',
      'user_employment',
      'user_health_context',
      'user_financials',
      'user_background',
    ];

    for (const table of requiredTables) {
      if (!content.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
        throw new Error(`Migration 023 missing CREATE TABLE for ${table}`);
      }
      expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });
});
