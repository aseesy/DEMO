/**
 * Integration Tests for Thread Manager
 * Tests thread operations with actual database (test database)
 * 
 * Framework: Jest
 * Coverage: Database operations, foreign keys, indexes
 * 
 * Note: These tests require a test database connection
 * Set TEST_DATABASE_URL environment variable to run
 */

const dbPostgres = require('../dbPostgres');
const threadManager = require('../threadManager');

// Skip integration tests if no test database configured
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const shouldSkip = !TEST_DATABASE_URL;

describe('ThreadManager Integration Tests', () => {
  let testRoomId;
  let testUserId;
  let createdThreadIds = [];

  beforeAll(async () => {
    if (shouldSkip) {
      console.log('⚠️  Skipping integration tests - TEST_DATABASE_URL not set');
      return;
    }

    // Create test room and user for testing
    try {
      // Create test user
      const userResult = await dbPostgres.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['test_user_thread', 'test_thread@example.com', 'hashed_password']
      );
      testUserId = userResult.rows[0].id;

      // Create test room
      testRoomId = `test_room_${Date.now()}`;
      await dbPostgres.query(
        'INSERT INTO rooms (id, name, created_by, is_private) VALUES ($1, $2, $3, $4)',
        [testRoomId, 'Test Room', testUserId, 1]
      );
    } catch (error) {
      // If database connection fails, mark tests to skip
      if (error.code === '28000' || error.message.includes('does not exist')) {
        console.log('⚠️  Skipping integration tests - database not available');
        return;
      }
      console.error('Error setting up test data:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (shouldSkip) return;

    // Cleanup: Delete test threads, messages, room, and user
    try {
      // Delete threads (cascade will handle messages)
      if (createdThreadIds.length > 0) {
        await dbPostgres.query(
          `DELETE FROM threads WHERE id = ANY($1::text[])`,
          [createdThreadIds]
        );
      }

      // Delete test room and user
      if (testRoomId) {
        await dbPostgres.query('DELETE FROM rooms WHERE id = $1', [testRoomId]);
      }
      if (testUserId) {
        await dbPostgres.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  });

  describe('Database Schema', () => {
    it('should have threads table with required columns', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const result = await dbPostgres.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'threads'
        ORDER BY column_name
      `);

      const columns = result.rows.map(r => r.column_name);
      
      expect(columns).toContain('id');
      expect(columns).toContain('room_id');
      expect(columns).toContain('title');
      expect(columns).toContain('created_by');
      expect(columns).toContain('message_count');
      expect(columns).toContain('is_archived');
    });

    it('should have foreign key constraint on messages.thread_id', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const result = await dbPostgres.query(`
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'messages'::regclass
        AND conname = 'fk_messages_thread_id'
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].contype).toBe('f'); // Foreign key constraint
    });

    it('should have index on threads.room_id', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const result = await dbPostgres.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'threads'
        AND indexname = 'idx_threads_room_id'
      `);

      expect(result.rows.length).toBe(1);
    });

    it('should have index on threads.updated_at', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const result = await dbPostgres.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'threads'
        AND indexname = 'idx_threads_updated_at'
      `);

      expect(result.rows.length).toBe(1);
    });
  });

  describe('Thread CRUD Operations', () => {
    it('should create a thread in database', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const title = 'Integration Test Thread';
      const createdBy = 'test_user';

      const threadId = await threadManager.createThread(testRoomId, title, createdBy);
      createdThreadIds.push(threadId);

      // Verify thread exists in database
      const result = await dbPostgres.query(
        'SELECT * FROM threads WHERE id = $1',
        [threadId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].title).toBe(title);
      expect(result.rows[0].room_id).toBe(testRoomId);
      expect(result.rows[0].created_by).toBe(createdBy);
      expect(result.rows[0].message_count).toBe(0);
    });

    it('should retrieve threads for a room', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      // Create multiple threads
      const thread1 = await threadManager.createThread(testRoomId, 'Thread 1', 'user1');
      const thread2 = await threadManager.createThread(testRoomId, 'Thread 2', 'user2');
      createdThreadIds.push(thread1, thread2);

      const threads = await threadManager.getThreadsForRoom(testRoomId);

      expect(threads.length).toBeGreaterThanOrEqual(2);
      const threadIds = threads.map(t => t.id);
      expect(threadIds).toContain(thread1);
      expect(threadIds).toContain(thread2);
    });

    it('should update thread title', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const threadId = await threadManager.createThread(testRoomId, 'Original Title', 'user1');
      createdThreadIds.push(threadId);

      await threadManager.updateThreadTitle(threadId, 'Updated Title');

      const result = await dbPostgres.query(
        'SELECT title FROM threads WHERE id = $1',
        [threadId]
      );

      expect(result.rows[0].title).toBe('Updated Title');
    });

    it('should archive and unarchive thread', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const threadId = await threadManager.createThread(testRoomId, 'Archive Test', 'user1');
      createdThreadIds.push(threadId);

      // Archive
      await threadManager.archiveThread(threadId, true);
      let result = await dbPostgres.query(
        'SELECT is_archived FROM threads WHERE id = $1',
        [threadId]
      );
      expect(result.rows[0].is_archived).toBe(1);

      // Unarchive
      await threadManager.archiveThread(threadId, false);
      result = await dbPostgres.query(
        'SELECT is_archived FROM threads WHERE id = $1',
        [threadId]
      );
      expect(result.rows[0].is_archived).toBe(0);
    });
  });

  describe('Message-Thread Associations', () => {
    it('should add message to thread and update message_count', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const threadId = await threadManager.createThread(testRoomId, 'Message Test', 'user1');
      createdThreadIds.push(threadId);

      // Create a test message
      const messageId = `test_msg_${Date.now()}`;
      await dbPostgres.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [messageId, 'user', 'test_user', 'Test message', new Date().toISOString(), testRoomId]
      );

      // Add message to thread
      await threadManager.addMessageToThread(messageId, threadId);

      // Verify message has thread_id
      const messageResult = await dbPostgres.query(
        'SELECT thread_id FROM messages WHERE id = $1',
        [messageId]
      );
      expect(messageResult.rows[0].thread_id).toBe(threadId);

      // Verify thread message_count updated
      const threadResult = await dbPostgres.query(
        'SELECT message_count FROM threads WHERE id = $1',
        [threadId]
      );
      expect(threadResult.rows[0].message_count).toBe(1);

      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [messageId]);
    });

    it('should enforce foreign key constraint (cannot reference non-existent thread)', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const messageId = `test_msg_fk_${Date.now()}`;
      await dbPostgres.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [messageId, 'user', 'test_user', 'Test', new Date().toISOString(), testRoomId]
      );

      // Try to set thread_id to non-existent thread (should fail)
      await expect(
        dbPostgres.query(
          'UPDATE messages SET thread_id = $1 WHERE id = $2',
          ['non_existent_thread', messageId]
        )
      ).rejects.toThrow();

      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [messageId]);
    });

    it('should set thread_id to NULL when thread is deleted (ON DELETE SET NULL)', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      const threadId = await threadManager.createThread(testRoomId, 'Delete Test', 'user1');
      
      // Create message and add to thread
      const messageId = `test_msg_delete_${Date.now()}`;
      await dbPostgres.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id, thread_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [messageId, 'user', 'test_user', 'Test', new Date().toISOString(), testRoomId, threadId]
      );

      // Delete thread
      await dbPostgres.query('DELETE FROM threads WHERE id = $1', [threadId]);

      // Verify message.thread_id is set to NULL
      const result = await dbPostgres.query(
        'SELECT thread_id FROM messages WHERE id = $1',
        [messageId]
      );
      expect(result.rows[0].thread_id).toBeNull();

      // Cleanup
      await dbPostgres.query('DELETE FROM messages WHERE id = $1', [messageId]);
    });
  });

  describe('Query Performance', () => {
    it('should use index for room_id queries', async () => {
      if (shouldSkip || !testRoomId) {
        console.log('⏭️  Skipping - test database not available');
        return;
      }

      // Create multiple threads
      for (let i = 0; i < 3; i++) {
        const threadId = await threadManager.createThread(testRoomId, `Perf Test ${i}`, 'user1');
        createdThreadIds.push(threadId);
      }

      // Query should use index (check execution plan)
      const result = await dbPostgres.query(`
        EXPLAIN ANALYZE
        SELECT * FROM threads WHERE room_id = $1
      `, [testRoomId]);

      const plan = result.rows.map(r => r['QUERY PLAN']).join('\n');
      // Index scan should be used (not sequential scan)
      expect(plan.toLowerCase()).toContain('index');
    });
  });
});

