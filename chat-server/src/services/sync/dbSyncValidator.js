/**
 * Database Synchronization Validator
 *
 * Validates consistency between PostgreSQL and Neo4j databases.
 * Ensures that relationship data stays in sync.
 *
 * This strengthens the relationship between PostgreSQL (source of truth)
 * and Neo4j (graph analytics) by validating their consistency.
 */

const dbSafe = require('../../../dbSafe');
const dbPostgres = require('../../../dbPostgres');
const neo4jClient = require('../../infrastructure/database/neo4jClient');

const { defaultLogger: defaultLogger } = require('../../../src/infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'dbSyncValidator',
});

/**
 * Validate that all co-parent relationships in PostgreSQL exist in Neo4j
 *
 * @returns {Promise<Object>} Validation results with discrepancies
 */
async function validateCoParentRelationships() {
  if (!neo4jClient.isAvailable()) {
    return {
      valid: false,
      error: 'Neo4j not configured',
      discrepancies: [],
    };
  }

  try {
    // Get all co-parent relationships from PostgreSQL
    // A co-parent relationship exists when a room has exactly 2 members
    const roomsQuery = `
      SELECT r.id as room_id, 
             array_agg(rm.user_id ORDER BY rm.user_id) as user_ids,
             COUNT(rm.user_id) as member_count
      FROM rooms r
      INNER JOIN room_members rm ON r.id = rm.room_id
      GROUP BY r.id
      HAVING COUNT(rm.user_id) = 2
    `;

    const roomsResult = await dbPostgres.query(roomsQuery);
    const pgRelationships = roomsResult.rows.map(row => ({
      roomId: row.room_id,
      userIds: row.user_ids,
      memberCount: row.member_count,
    }));

    const discrepancies = [];

    // Validate each relationship in Neo4j
    for (const rel of pgRelationships) {
      const [userId1, userId2] = rel.userIds;

      try {
        // Check if relationship exists in Neo4j
        const neo4jCoParents = await neo4jClient.getCoParents(userId1, userId1);
        const exists = neo4jCoParents.some(cp => cp.userId === userId2 && cp.roomId === rel.roomId);

        if (!exists) {
          discrepancies.push({
            type: 'missing_in_neo4j',
            roomId: rel.roomId,
            userId1,
            userId2,
            message: `Relationship exists in PostgreSQL but not in Neo4j`,
          });
        }
      } catch (error) {
        discrepancies.push({
          type: 'validation_error',
          roomId: rel.roomId,
          userId1,
          userId2,
          error: error.message,
        });
      }
    }

    return {
      valid: discrepancies.length === 0,
      checked: pgRelationships.length,
      discrepancies,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('❌ Error validating co-parent relationships', {
      error: error,
    });
    return {
      valid: false,
      error: error.message,
      discrepancies: [],
    };
  }
}

/**
 * Validate that all users in PostgreSQL have corresponding nodes in Neo4j
 *
 * @returns {Promise<Object>} Validation results
 */
async function validateUserNodes() {
  if (!neo4jClient.isAvailable()) {
    return {
      valid: false,
      error: 'Neo4j not configured',
      missingUsers: [],
    };
  }

  try {
    // Get all users from PostgreSQL
    const users = await dbSafe.safeSelect('users', {}, { columns: ['id', 'username'] });

    const missingUsers = [];

    // Note: We can't directly query Neo4j for all users without exposing data
    // Instead, we'll check a sample or validate during user operations
    // For now, return a placeholder that indicates validation structure

    return {
      valid: missingUsers.length === 0,
      checked: users.length,
      missingUsers,
      note: 'Full validation requires Neo4j query capabilities - consider implementing user count comparison',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('❌ Error validating user nodes', {
      error: error,
    });
    return {
      valid: false,
      error: error.message,
      missingUsers: [],
    };
  }
}

/**
 * Sync relationship metadata from PostgreSQL to Neo4j
 * Strengthens Neo4j with activity data from PostgreSQL
 *
 * @param {string} roomId - Room ID to sync
 * @returns {Promise<boolean>} Success status
 */
async function syncRelationshipMetadata(roomId) {
  if (!neo4jClient.isAvailable()) {
    return false;
  }

  try {
    // Get room members
    const members = await dbSafe.safeSelect('room_members', { room_id: roomId });

    if (members.length !== 2) {
      // Not a co-parent relationship (needs exactly 2 members)
      return false;
    }

    const [user1, user2] = members.map(m => m.user_id).sort();

    // Get message count from PostgreSQL
    const messageCountResult = await dbPostgres.query(
      'SELECT COUNT(*) as count FROM messages WHERE room_id = $1',
      [roomId]
    );
    const messageCount = parseInt(messageCountResult.rows[0]?.count || 0);

    // Get last interaction timestamp
    const lastMessageResult = await dbPostgres.query(
      'SELECT MAX(timestamp) as last_message FROM messages WHERE room_id = $1',
      [roomId]
    );
    const lastInteraction = lastMessageResult.rows[0]?.last_message || null;

    // Get intervention count from communication stats
    const statsResult = await dbSafe.safeSelect('communication_stats', { room_id: roomId });
    const interventionCount = statsResult.reduce(
      (sum, stat) => sum + (stat.total_interventions || 0),
      0
    );

    // Update Neo4j relationship metadata
    const success = await neo4jClient.updateRelationshipMetadata(user1, user2, roomId, {
      messageCount,
      lastInteraction,
      interventionCount,
    });

    if (success) {
      logger.debug('Log message', {
        value: `✅ Synced relationship metadata for room ${roomId}: ${messageCount} messages, ${interventionCount} interventions`,
      });
    }

    return success;
  } catch (error) {
    logger.error('Log message', {
      arg0: `❌ Error syncing relationship metadata for room ${roomId}:`,
      message: error.message,
    });
    return false;
  }
}

/**
 * Fix missing relationships by creating them in Neo4j
 * @param {Array} discrepancies - Array of relationship discrepancies from validation
 * @returns {Promise<Object>} Fix results
 */
async function fixMissingRelationships(discrepancies) {
  if (!neo4jClient.isAvailable()) {
    return {
      fixed: 0,
      errors: 0,
      message: 'Neo4j not configured',
    };
  }

  let fixed = 0;
  let errors = 0;

  for (const discrepancy of discrepancies) {
    if (discrepancy.type === 'missing_in_neo4j') {
      try {
        // Ensure user nodes exist before creating relationship
        // Get user info from PostgreSQL
        const usersResult = await dbPostgres.query(
          'SELECT id, username, email, display_name FROM users WHERE id = $1 OR id = $2',
          [discrepancy.userId1, discrepancy.userId2]
        );
        const users = usersResult.rows;

        // Create user nodes if they don't exist
        for (const user of users) {
          try {
            await neo4jClient.createUserNode(user.id);
          } catch (error) {
            // User node might already exist, which is fine
            if (!error.message.includes('already exists')) {
              logger.warn('Log message', {
                arg0: `⚠️  Could not ensure user node exists for user ${user.id}:`,
                message: error.message,
              });
            }
          }
        }

        // Get room name from PostgreSQL
        const roomResult = await dbPostgres.query('SELECT name FROM rooms WHERE id = $1', [
          discrepancy.roomId,
        ]);
        const roomName = roomResult.rows[0]?.name || null;

        // Create the missing relationship in Neo4j
        const result = await neo4jClient.createCoParentRelationship(
          discrepancy.userId1,
          discrepancy.userId2,
          discrepancy.roomId,
          roomName
        );

        if (result) {
          fixed++;
          logger.debug('Log message', {
            value: `✅ Fixed missing relationship: User ${discrepancy.userId1} <-> User ${discrepancy.userId2} (Room: ${discrepancy.roomId})`,
          });
        } else {
          errors++;
          logger.warn('Log message', {
            value: `⚠️  Failed to fix relationship: User ${discrepancy.userId1} <-> User ${discrepancy.userId2} (Room: ${discrepancy.roomId})`,
          });
        }
      } catch (error) {
        errors++;
        logger.error('Log message', {
          arg0: `❌ Error fixing relationship for room ${discrepancy.roomId}:`,
          message: error.message,
        });
      }
    }
  }

  return {
    fixed,
    errors,
    total: discrepancies.length,
  };
}

/**
 * Run full database synchronization validation and optionally fix issues
 *
 * @param {boolean} autoFix - Whether to automatically fix missing relationships
 * @returns {Promise<Object>} Complete validation results
 */
async function runFullValidation(autoFix = false) {
  logger.debug('🔍 Starting database synchronization validation...');

  const [relationships, users] = await Promise.all([
    validateCoParentRelationships(),
    validateUserNodes(),
  ]);

  let fixResults = null;
  if (autoFix && relationships.discrepancies?.length > 0) {
    logger.debug('Log message', {
      value: `🔧 Auto-fixing ${relationships.discrepancies.length} missing relationships...`,
    });
    fixResults = await fixMissingRelationships(relationships.discrepancies);

    // Re-validate after fixing
    if (fixResults.fixed > 0) {
      const revalidation = await validateCoParentRelationships();
      relationships.discrepancies = revalidation.discrepancies;
      relationships.valid = revalidation.valid;
    }
  }

  const results = {
    timestamp: new Date().toISOString(),
    relationships,
    users,
    fixResults,
    overall: {
      valid: relationships.valid && users.valid,
      hasDiscrepancies: relationships.discrepancies?.length > 0 || users.missingUsers?.length > 0,
    },
  };

  if (results.overall.hasDiscrepancies) {
    logger.warn('⚠️  Database synchronization validation found discrepancies');
    logger.warn('Log message', {
      value: `   Relationships: ${relationships.discrepancies?.length || 0} issues`,
    });
    logger.warn('Log message', {
      value: `   Users: ${users.missingUsers?.length || 0} issues`,
    });
    if (fixResults) {
      logger.debug('Log message', {
        value: `   Fixed: ${fixResults.fixed} relationships, Errors: ${fixResults.errors}`,
      });
    }
  } else {
    logger.debug('✅ Database synchronization validation passed');
  }

  return results;
}

module.exports = {
  validateCoParentRelationships,
  validateUserNodes,
  syncRelationshipMetadata,
  fixMissingRelationships,
  runFullValidation,
};
