/**
 * Neo4j Graph Database Client
 *
 * Creates and manages user nodes in Neo4j graph database.
 * Uses official neo4j-driver with Bolt protocol for Neo4j Aura compatibility.
 *
 * Environment Variables:
 * - NEO4J_URI: Neo4j database URI (e.g., neo4j+s://xxxx.databases.neo4j.io)
 * - NEO4J_USER: Neo4j username (default: neo4j)
 * - NEO4J_PASSWORD: Neo4j password (required if NEO4J_URI is set)
 * - NEO4J_DATABASE: Neo4j database name (default: neo4j)
 */

const neo4j = require('neo4j-driver');

console.log('🔷 Neo4j Client v2.0 (Bolt driver) loaded');

// Configuration from environment
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

// Check if Neo4j is configured
const isNeo4jConfigured = !!(NEO4J_URI && NEO4J_PASSWORD);

// Create driver instance (lazy initialization)
let driver = null;

/**
 * Get or create the Neo4j driver instance
 * @private
 */
function getDriver() {
  if (!isNeo4jConfigured) {
    throw new Error('Neo4j is not configured. Set NEO4J_URI and NEO4J_PASSWORD environment variables.');
  }

  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        disableLosslessIntegers: true // Return integers as JavaScript numbers
      }
    );
  }

  return driver;
}

/**
 * Execute a Cypher query using Neo4j Bolt driver
 * @private
 */
async function executeCypher(query, params = {}) {
  if (!isNeo4jConfigured) {
    throw new Error('Neo4j is not configured');
  }

  const session = getDriver().session({ database: NEO4J_DATABASE });

  try {
    const result = await session.run(query, params);
    return result;
  } finally {
    await session.close();
  }
}

/**
 * Create a User node in Neo4j graph database
 *
 * PRIVACY & ANONYMITY:
 * - Email: NOT stored (data minimization - stored in PostgreSQL only)
 * - DisplayName: NOT stored (anonymity - display names are identifying)
 * - Only stores: userId, username (pseudonymized identifiers)
 *
 * Display names can be retrieved from PostgreSQL when needed for queries.
 *
 * @param {number} userId - PostgreSQL user ID
 * @param {string} username - Database username (unique identifier, already pseudonymized)
 * @param {string} email - User email address (not stored in Neo4j for privacy)
 * @param {string} [displayName] - User display name (not stored in Neo4j for anonymity)
 * @returns {Promise<Object>} Created node information
 */
async function createUserNode(userId, username, email, displayName = null) {
  if (!isNeo4jConfigured) {
    console.log('⚠️  Neo4j not configured - skipping user node creation');
    return null;
  }

  try {
    // PRIVACY & ANONYMITY: Create User node WITHOUT email and displayName
    const query = `
      CREATE (u:User {
        userId: $userId,
        username: $username,
        createdAt: datetime()
      })
      RETURN u
    `;

    const params = {
      userId: neo4j.int(userId),
      username: username
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      const node = result.records[0].get('u').properties;
      console.log(`✅ Created Neo4j user node for userId: ${userId}, username: ${username}`);
      return node;
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    // Log error but don't throw - user creation should succeed even if Neo4j fails
    console.error(`❌ Failed to create Neo4j user node for userId ${userId}:`, error.message);
    return null;
  }
}

/**
 * Create a co-parenting relationship between two users
 * Creates bidirectional relationship and room structure
 *
 * ANONYMITY: roomName parameter is accepted for backward compatibility but not stored.
 *
 * @param {number} userId1 - First user's PostgreSQL ID
 * @param {number} userId2 - Second user's PostgreSQL ID
 * @param {string} roomId - Room ID from PostgreSQL
 * @param {string} [roomName] - Room name (not stored in Neo4j for anonymity)
 * @returns {Promise<Object>} Created relationship information
 */
async function createCoParentRelationship(userId1, userId2, roomId, roomName = null) {
  if (!isNeo4jConfigured) {
    console.log('⚠️  Neo4j not configured - skipping relationship creation');
    return null;
  }

  try {
    const query = `
      MATCH (u1:User {userId: $userId1})
      MATCH (u2:User {userId: $userId2})

      // Create bidirectional co-parent relationships
      MERGE (u1)-[r1:CO_PARENT_WITH {
        roomId: $roomId,
        active: true,
        createdAt: datetime(),
        relationshipType: "co-parent"
      }]->(u2)
      MERGE (u2)-[r2:CO_PARENT_WITH {
        roomId: $roomId,
        active: true,
        createdAt: datetime(),
        relationshipType: "co-parent"
      }]->(u1)

      // Create or update room node
      MERGE (r:Room {roomId: $roomId})
      SET r.type = "co-parent",
          r.createdAt = datetime()

      // Create room memberships
      MERGE (u1)-[m1:MEMBER_OF {role: "owner", joinedAt: datetime()}]->(r)
      MERGE (u2)-[m2:MEMBER_OF {role: "member", joinedAt: datetime()}]->(r)

      RETURN r1, r2, r, m1, m2
    `;

    const params = {
      userId1: neo4j.int(userId1),
      userId2: neo4j.int(userId2),
      roomId: roomId
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      console.log(`✅ Created Neo4j co-parent relationship: User ${userId1} <-> User ${userId2} (Room: ${roomId})`);
      return result.records[0].toObject();
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    console.error(`❌ Failed to create Neo4j co-parent relationship for users ${userId1} and ${userId2}:`, error.message);
    return null;
  }
}

/**
 * End/deactivate a co-parenting relationship
 * Marks relationship as inactive but preserves history
 *
 * @param {number} userId1 - First user's PostgreSQL ID
 * @param {number} userId2 - Second user's PostgreSQL ID
 * @returns {Promise<boolean>} Success status
 */
async function endCoParentRelationship(userId1, userId2) {
  if (!isNeo4jConfigured) {
    console.log('⚠️  Neo4j not configured - skipping relationship deactivation');
    return false;
  }

  try {
    const query = `
      MATCH (u1:User {userId: $userId1})-[r:CO_PARENT_WITH]->(u2:User {userId: $userId2})
      SET r.active = false, r.endedAt = datetime()
      RETURN r
    `;

    const params = {
      userId1: neo4j.int(userId1),
      userId2: neo4j.int(userId2)
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      console.log(`✅ Deactivated Neo4j co-parent relationship: User ${userId1} <-> User ${userId2}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to deactivate Neo4j co-parent relationship:`, error.message);
    return false;
  }
}

/**
 * Get all active co-parents for a user
 *
 * PRIVACY: This function should only be called with authenticated user's own userId.
 *
 * @param {number} userId - User's PostgreSQL ID (must be authenticated user's ID)
 * @param {number} [authenticatedUserId] - Authenticated user's ID for privacy verification
 * @returns {Promise<Array>} Array of co-parent info: {userId, username, roomId}
 */
async function getCoParents(userId, authenticatedUserId = null) {
  if (!isNeo4jConfigured) {
    console.log('⚠️  Neo4j not configured - cannot query co-parents');
    return [];
  }

  // PRIVACY: Verify user can only query their own relationships
  if (authenticatedUserId !== null && userId !== authenticatedUserId) {
    console.error(`❌ PRIVACY VIOLATION: User ${authenticatedUserId} attempted to query relationships for user ${userId}`);
    throw new Error('Unauthorized: Cannot query other users\' relationships');
  }

  try {
    const query = `
      MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->(coParent:User)
      RETURN coParent.userId as userId, coParent.username as username, r.roomId as roomId
    `;

    const params = { userId: neo4j.int(userId) };
    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
      roomId: record.get('roomId')
    }));
  } catch (error) {
    console.error(`❌ Failed to query co-parents for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get all active co-parents for the authenticated user
 * SECURE VERSION: Automatically enforces authentication
 *
 * @param {number} authenticatedUserId - Authenticated user's ID from req.user.id
 * @returns {Promise<Array>} Array of co-parent user information
 */
async function getCoParentsSecure(authenticatedUserId) {
  if (!authenticatedUserId) {
    throw new Error('Authentication required: authenticatedUserId must be provided');
  }

  return await getCoParents(authenticatedUserId, authenticatedUserId);
}

/**
 * Initialize Neo4j indexes for optimal performance
 * Should be called once on application startup
 * @returns {Promise<boolean>} Success status
 */
async function initializeIndexes() {
  if (!isNeo4jConfigured) {
    console.log('⚠️  Neo4j not configured - skipping index initialization');
    return false;
  }

  try {
    // Create indexes for User nodes
    await executeCypher(`
      CREATE INDEX user_userId_index IF NOT EXISTS FOR (u:User) ON (u.userId)
    `);

    await executeCypher(`
      CREATE INDEX user_username_index IF NOT EXISTS FOR (u:User) ON (u.username)
    `);

    // Create indexes for Room nodes
    await executeCypher(`
      CREATE INDEX room_roomId_index IF NOT EXISTS FOR (r:Room) ON (r.roomId)
    `);

    console.log('✅ Neo4j indexes initialized successfully');
    return true;
  } catch (error) {
    // Indexes might already exist, which is fine
    if (error.message.includes('already exists') || error.message.includes('equivalent')) {
      console.log('ℹ️  Neo4j indexes already exist');
      return true;
    }
    console.error(`❌ Failed to initialize Neo4j indexes:`, error.message);
    return false;
  }
}

/**
 * Update relationship metadata from PostgreSQL
 *
 * @param {number} userId1 - First user's PostgreSQL ID
 * @param {number} userId2 - Second user's PostgreSQL ID
 * @param {string} roomId - Room ID
 * @param {Object} metadata - Relationship metadata from PostgreSQL
 * @returns {Promise<boolean>} Success status
 */
async function updateRelationshipMetadata(userId1, userId2, roomId, metadata = {}) {
  if (!isNeo4jConfigured) {
    return false;
  }

  try {
    const query = `
      MATCH (u1:User {userId: $userId1})-[r:CO_PARENT_WITH]->(u2:User {userId: $userId2})
      WHERE r.roomId = $roomId AND r.active = true
      SET r.messageCount = $messageCount,
          r.lastInteraction = $lastInteraction,
          r.interventionCount = $interventionCount,
          r.updatedAt = datetime()
      RETURN r
    `;

    const params = {
      userId1: neo4j.int(userId1),
      userId2: neo4j.int(userId2),
      roomId,
      messageCount: metadata.messageCount || 0,
      lastInteraction: metadata.lastInteraction ? new Date(metadata.lastInteraction).toISOString() : null,
      interventionCount: metadata.interventionCount || 0
    };

    const result = await executeCypher(query, params);
    return result.records.length > 0;
  } catch (error) {
    console.error(`❌ Failed to update relationship metadata:`, error.message);
    return false;
  }
}

/**
 * Get co-parents with relationship strength metrics
 *
 * @param {number} userId - User's PostgreSQL ID
 * @param {number} [authenticatedUserId] - Authenticated user's ID for privacy verification
 * @returns {Promise<Array>} Array of co-parent info with metrics
 */
async function getCoParentsWithMetrics(userId, authenticatedUserId = null) {
  if (!isNeo4jConfigured) {
    return [];
  }

  // PRIVACY: Verify user can only query their own relationships
  if (authenticatedUserId !== null && userId !== authenticatedUserId) {
    console.error(`❌ PRIVACY VIOLATION: User ${authenticatedUserId} attempted to query relationships for user ${userId}`);
    throw new Error('Unauthorized: Cannot query other users\' relationships');
  }

  try {
    const query = `
      MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->(coParent:User)
      RETURN coParent.userId as userId,
             coParent.username as username,
             r.roomId as roomId,
             r.messageCount as messageCount,
             r.lastInteraction as lastInteraction,
             r.interventionCount as interventionCount,
             r.createdAt as relationshipCreatedAt
      ORDER BY r.lastInteraction DESC
    `;

    const params = { userId: neo4j.int(userId) };
    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
      roomId: record.get('roomId'),
      messageCount: record.get('messageCount') || 0,
      lastInteraction: record.get('lastInteraction'),
      interventionCount: record.get('interventionCount') || 0,
      relationshipCreatedAt: record.get('relationshipCreatedAt')
    }));
  } catch (error) {
    console.error(`❌ Failed to query co-parents with metrics for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get relationship network analysis
 *
 * @param {number} userId - User's PostgreSQL ID
 * @param {number} [maxDepth=2] - Maximum relationship depth
 * @param {number} [authenticatedUserId] - Authenticated user's ID for privacy verification
 * @returns {Promise<Array>} Array of connected users with relationship paths
 */
async function getRelationshipNetwork(userId, maxDepth = 2, authenticatedUserId = null) {
  if (!isNeo4jConfigured) {
    return [];
  }

  // PRIVACY: Verify user can only query their own network
  if (authenticatedUserId !== null && userId !== authenticatedUserId) {
    throw new Error('Unauthorized: Cannot query other users\' networks');
  }

  try {
    const query = `
      MATCH path = (u:User {userId: $userId})-[r:CO_PARENT_WITH*1..${maxDepth}]-(other:User)
      WHERE ALL(rel IN relationships(path) WHERE rel.active = true) AND other.userId <> $userId
      WITH other, length(path) as distance, path
      RETURN DISTINCT other.userId as userId,
             other.username as username,
             distance,
             [rel in relationships(path) | rel.roomId] as roomIds
      ORDER BY distance, other.username
      LIMIT 20
    `;

    const params = { userId: neo4j.int(userId) };
    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
      distance: record.get('distance'),
      roomIds: record.get('roomIds') || []
    }));
  } catch (error) {
    console.error(`❌ Failed to query relationship network for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get active relationships with high activity
 *
 * @param {number} userId - User's PostgreSQL ID
 * @param {number} [minMessages=10] - Minimum message count threshold
 * @param {number} [authenticatedUserId] - Authenticated user's ID for privacy verification
 * @returns {Promise<Array>} Array of active relationships
 */
async function getActiveRelationships(userId, minMessages = 10, authenticatedUserId = null) {
  if (!isNeo4jConfigured) {
    return [];
  }

  // PRIVACY: Verify user can only query their own relationships
  if (authenticatedUserId !== null && userId !== authenticatedUserId) {
    throw new Error('Unauthorized: Cannot query other users\' relationships');
  }

  try {
    const query = `
      MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->(coParent:User)
      WHERE r.messageCount >= $minMessages
      RETURN coParent.userId as userId,
             coParent.username as username,
             r.roomId as roomId,
             r.messageCount as messageCount,
             r.lastInteraction as lastInteraction
      ORDER BY r.messageCount DESC, r.lastInteraction DESC
    `;

    const params = { userId: neo4j.int(userId), minMessages };
    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      userId: record.get('userId'),
      username: record.get('username'),
      roomId: record.get('roomId'),
      messageCount: record.get('messageCount') || 0,
      lastInteraction: record.get('lastInteraction')
    }));
  } catch (error) {
    console.error(`❌ Failed to query active relationships for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Test Neo4j connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  if (!isNeo4jConfigured) {
    return false;
  }

  try {
    const result = await executeCypher('RETURN 1 as test');
    return result.records.length > 0;
  } catch (error) {
    console.error('❌ Neo4j connection test failed:', error.message);
    return false;
  }
}

/**
 * Close the driver connection (for graceful shutdown)
 */
async function close() {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('✅ Neo4j driver closed');
  }
}

/**
 * Check if Neo4j is available and configured
 * @returns {boolean}
 */
function isAvailable() {
  return isNeo4jConfigured;
}

module.exports = {
  createUserNode,
  createCoParentRelationship,
  endCoParentRelationship,
  getCoParents,
  getCoParentsSecure,
  getCoParentsWithMetrics,
  getRelationshipNetwork,
  getActiveRelationships,
  updateRelationshipMetadata,
  initializeIndexes,
  testConnection,
  close,
  isAvailable,
  isNeo4jConfigured,
  // Internal - exported for testing only
  _executeCypher: executeCypher
};
