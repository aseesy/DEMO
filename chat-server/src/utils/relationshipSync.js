/**
 * Relationship Metadata Sync Job
 * 
 * Periodically syncs relationship metadata from PostgreSQL to Neo4j.
 * This strengthens Neo4j with activity data from PostgreSQL.
 * 
 * Runs as a background job to keep Neo4j relationship metadata up-to-date.
 */

const path = require('path');
const dbSyncValidator = require('./dbSyncValidator');
const dbSafe = require(path.join(__dirname, '../../dbSafe'));
const neo4jClient = require('./neo4jClient');

let syncInterval = null;
let isRunning = false;

/**
 * Sync metadata for a specific room
 * Called after messages are saved to keep Neo4j up-to-date
 * 
 * @param {string} roomId - Room ID to sync
 */
async function syncRoomMetadata(roomId) {
  if (!neo4jClient.isAvailable() || isRunning) {
    return;
  }

  try {
    await dbSyncValidator.syncRelationshipMetadata(roomId);
  } catch (error) {
    console.error(`❌ Error syncing room metadata for ${roomId}:`, error.message);
  }
}

/**
 * Sync all active co-parent relationships
 * Runs periodically to keep all relationships in sync
 */
async function syncAllRelationships() {
  if (!neo4jClient.isAvailable() || isRunning) {
    return;
  }

  isRunning = true;
  console.log('🔄 Starting relationship metadata sync...');

  try {
    // Get all co-parent rooms (rooms with exactly 2 members)
    const dbPostgres = require(path.join(__dirname, '../../dbPostgres'));
    const roomsQuery = `
      SELECT r.id as room_id
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id
      HAVING COUNT(rm.user_id) = 2
    `;

    const roomsResult = await dbPostgres.query(roomsQuery);
    const roomIds = roomsResult.rows.map(row => row.room_id);

    console.log(`📊 Syncing ${roomIds.length} co-parent relationships...`);

    // Sync each room (with rate limiting to avoid overwhelming Neo4j)
    let synced = 0;
    for (const roomId of roomIds) {
      try {
        await dbSyncValidator.syncRelationshipMetadata(roomId);
        synced++;
        
        // Small delay to avoid overwhelming Neo4j
        if (synced % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`⚠️  Failed to sync room ${roomId}:`, error.message);
      }
    }

    console.log(`✅ Relationship metadata sync complete: ${synced}/${roomIds.length} rooms synced`);
  } catch (error) {
    console.error('❌ Error during relationship metadata sync:', error.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Start periodic sync job
 * 
 * @param {number} intervalMinutes - Sync interval in minutes (default: 60)
 */
function startSyncJob(intervalMinutes = 60) {
  if (syncInterval) {
    console.log('⚠️  Sync job already running');
    return;
  }

  if (!neo4jClient.isAvailable()) {
    console.log('ℹ️  Neo4j not configured - sync job not started');
    return;
  }

  console.log(`🔄 Starting relationship metadata sync job (every ${intervalMinutes} minutes)`);

  // Run initial sync after 30 seconds
  setTimeout(() => {
    syncAllRelationships().catch(err => {
      console.error('⚠️  Initial sync failed:', err.message);
    });
  }, 30000);

  // Then run periodically
  syncInterval = setInterval(() => {
    syncAllRelationships().catch(err => {
      console.error('⚠️  Periodic sync failed:', err.message);
    });
  }, intervalMinutes * 60 * 1000);
}

/**
 * Stop periodic sync job
 */
function stopSyncJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('🛑 Relationship metadata sync job stopped');
  }
}

module.exports = {
  syncRoomMetadata,
  syncAllRelationships,
  startSyncJob,
  stopSyncJob
};

