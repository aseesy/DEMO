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
    throw new Error(
      'Neo4j is not configured. Set NEO4J_URI and NEO4J_PASSWORD environment variables.'
    );
  }

  if (!driver) {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD), {
      maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      disableLosslessIntegers: true, // Return integers as JavaScript numbers
    });
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
      username: username,
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
    // First, ensure user nodes exist with proper data
    // Fetch usernames from PostgreSQL to ensure complete nodes
    const dbPostgres = require('../../../dbPostgres');
    const usersResult = await dbPostgres.query(
      'SELECT id, username FROM users WHERE id = $1 OR id = $2',
      [userId1, userId2]
    );

    const userMap = new Map();
    usersResult.rows.forEach(row => {
      userMap.set(row.id, row.username);
    });

    const username1 = userMap.get(userId1) || `user_${userId1}`;
    const username2 = userMap.get(userId2) || `user_${userId2}`;

    // MERGE user nodes with username (required for queries and privacy model)
    const ensureUsersQuery = `
      MERGE (u1:User {userId: $userId1})
      ON CREATE SET u1.username = $username1, u1.createdAt = datetime()
      ON MATCH SET u1.username = COALESCE(u1.username, $username1)
      MERGE (u2:User {userId: $userId2})
      ON CREATE SET u2.username = $username2, u2.createdAt = datetime()
      ON MATCH SET u2.username = COALESCE(u2.username, $username2)
      RETURN u1, u2
    `;

    await executeCypher(ensureUsersQuery, {
      userId1: neo4j.int(userId1),
      userId2: neo4j.int(userId2),
      username1: username1,
      username2: username2,
    });

    // Now create the relationship (user nodes are guaranteed to exist)
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
      roomId: roomId,
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      console.log(
        `✅ Created Neo4j co-parent relationship: User ${userId1} <-> User ${userId2} (Room: ${roomId})`
      );
      return result.records[0].toObject();
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    console.error(
      `❌ Failed to create Neo4j co-parent relationship for users ${userId1} and ${userId2}:`,
      error.message
    );
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
      userId2: neo4j.int(userId2),
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      console.log(
        `✅ Deactivated Neo4j co-parent relationship: User ${userId1} <-> User ${userId2}`
      );
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
    console.error(
      `❌ PRIVACY VIOLATION: User ${authenticatedUserId} attempted to query relationships for user ${userId}`
    );
    throw new Error("Unauthorized: Cannot query other users' relationships");
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
      roomId: record.get('roomId'),
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
 * Generate embedding for text using OpenAI
 * @private
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<Array<number>>} Embedding vector
 */
async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text must be a non-empty string');
  }

  try {
    const openaiClient = require('../../core/core/client');
    const client = openaiClient.getClient();

    if (!client) {
      throw new Error('OpenAI client not configured');
    }

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective, 1536 dimensions
      input: text.trim(),
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      throw new Error('Invalid embedding response from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error.message);
    throw error;
  }
}

/**
 * Create or update a Message node in Neo4j with embedding
 * @param {string} messageId - Message ID from PostgreSQL
 * @param {string} roomId - Room ID
 * @param {string} text - Message text
 * @param {string} username - Username
 * @param {string} timestamp - ISO timestamp
 * @param {Array<number>} [embedding] - Optional pre-computed embedding
 * @returns {Promise<Object>} Created/updated node information
 */
async function createOrUpdateMessageNode(
  messageId,
  roomId,
  text,
  username,
  timestamp,
  embedding = null
) {
  if (!isNeo4jConfigured) {
    return null;
  }

  try {
    // Generate embedding if not provided
    let messageEmbedding = embedding;
    if (!messageEmbedding && text) {
      messageEmbedding = await generateEmbedding(text);
    }

    const query = `
      // Ensure Room node exists first
      MERGE (r:Room {roomId: $roomId})
      ON CREATE SET r.type = "co-parent", r.createdAt = datetime()

      WITH r

      // Create or update Message node
      MERGE (m:Message {messageId: $messageId})
      ON CREATE SET m.createdAt = datetime()
      SET m.roomId = $roomId,
          m.text = $text,
          m.username = $username,
          m.timestamp = $timestamp,
          m.embedding = $embedding,
          m.updatedAt = datetime()

      // Link message to Room
      WITH m, r
      MERGE (m)-[:IN_ROOM]->(r)

      RETURN m
    `;

    // Convert timestamp to ISO string if it's a Date object (from PostgreSQL)
    const timestampStr =
      timestamp instanceof Date ? timestamp.toISOString() : timestamp || new Date().toISOString();

    const params = {
      messageId,
      roomId,
      text: text || '',
      username: username || '',
      timestamp: timestampStr,
      embedding: messageEmbedding || [],
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      return result.records[0].get('m').properties;
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    console.error(
      `❌ Failed to create/update message node for messageId ${messageId}:`,
      error.message
    );
    return null;
  }
}

/**
 * Create or update a Thread node in Neo4j
 * @param {string} threadId - Thread ID from PostgreSQL
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 * @param {Array<number>} [embedding] - Optional embedding for thread title
 * @returns {Promise<Object>} Created/updated node information
 */
async function createOrUpdateThreadNode(threadId, roomId, title, embedding = null) {
  if (!isNeo4jConfigured) {
    return null;
  }

  try {
    // Generate embedding for thread title if not provided
    let threadEmbedding = embedding;
    if (!threadEmbedding && title) {
      threadEmbedding = await generateEmbedding(title);
    }

    const query = `
      // Ensure Room node exists first
      MERGE (r:Room {roomId: $roomId})
      ON CREATE SET r.type = "co-parent", r.createdAt = datetime()

      WITH r

      // Create or update Thread node
      MERGE (t:Thread {threadId: $threadId})
      ON CREATE SET t.createdAt = datetime()
      SET t.roomId = $roomId,
          t.title = $title,
          t.embedding = $embedding,
          t.updatedAt = datetime()

      // Link thread to Room
      WITH t, r
      MERGE (t)-[:IN_ROOM]->(r)

      RETURN t
    `;

    const params = {
      threadId,
      roomId,
      title,
      embedding: threadEmbedding || [],
    };

    const result = await executeCypher(query, params);

    if (result.records.length > 0) {
      return result.records[0].get('t').properties;
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    console.error(
      `❌ Failed to create/update thread node for threadId ${threadId}:`,
      error.message
    );
    return null;
  }
}

/**
 * Link a message to a thread in Neo4j
 * @param {string} messageId - Message ID
 * @param {string} threadId - Thread ID
 * @returns {Promise<boolean>} Success status
 */
async function linkMessageToThread(messageId, threadId) {
  if (!isNeo4jConfigured) {
    return false;
  }

  try {
    const query = `
      MATCH (m:Message {messageId: $messageId})
      MATCH (t:Thread {threadId: $threadId})
      MERGE (m)-[:BELONGS_TO_THREAD]->(t)
      RETURN m, t
    `;

    const params = { messageId, threadId };
    const result = await executeCypher(query, params);

    return result.records.length > 0;
  } catch (error) {
    console.error(`❌ Failed to link message ${messageId} to thread ${threadId}:`, error.message);
    return false;
  }
}

/**
 * Find semantically similar messages using cosine similarity
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {string} roomId - Room ID to search within
 * @param {number} [limit=10] - Maximum number of results
 * @param {number} [minSimilarity=0.7] - Minimum similarity threshold
 * @returns {Promise<Array>} Array of similar messages with similarity scores
 */
async function findSimilarMessages(queryEmbedding, roomId, limit = 10, minSimilarity = 0.7) {
  if (!isNeo4jConfigured) {
    return [];
  }

  if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  try {
    // Calculate cosine similarity in Cypher
    // Cosine similarity = dot(a,b) / (norm(a) * norm(b))
    const query = `
      MATCH (m:Message)-[:IN_ROOM]->(r:Room {roomId: $roomId})
      WHERE m.embedding IS NOT NULL AND size(m.embedding) > 0
      
      // Calculate cosine similarity
      WITH m, 
           reduce(dot = 0.0, i IN range(0, size($queryEmbedding) - 1) | 
             dot + m.embedding[i] * $queryEmbedding[i]
           ) AS dotProduct,
           sqrt(reduce(sum = 0.0, val IN m.embedding | sum + val * val)) AS normM,
           sqrt(reduce(sum = 0.0, val IN $queryEmbedding | sum + val * val)) AS normQ
      
      WHERE normM > 0 AND normQ > 0
      WITH m, (dotProduct / (normM * normQ)) AS similarity
      WHERE similarity >= $minSimilarity
      
      RETURN m.messageId AS messageId,
             m.text AS text,
             m.username AS username,
             m.timestamp AS timestamp,
             similarity
      ORDER BY similarity DESC
      LIMIT $limit
    `;

    const params = {
      queryEmbedding,
      roomId,
      limit: neo4j.int(Math.floor(limit)),
      minSimilarity,
    };

    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      messageId: record.get('messageId'),
      text: record.get('text'),
      username: record.get('username'),
      timestamp: record.get('timestamp'),
      similarity: record.get('similarity'),
    }));
  } catch (error) {
    console.error(`❌ Failed to find similar messages:`, error.message);
    return [];
  }
}

/**
 * Find semantically similar threads using cosine similarity
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {string} roomId - Room ID to search within
 * @param {number} [limit=5] - Maximum number of results
 * @param {number} [minSimilarity=0.6] - Minimum similarity threshold
 * @returns {Promise<Array>} Array of similar threads with similarity scores
 */
async function findSimilarThreads(queryEmbedding, roomId, limit = 5, minSimilarity = 0.6) {
  if (!isNeo4jConfigured) {
    return [];
  }

  if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  try {
    const query = `
      MATCH (t:Thread)-[:IN_ROOM]->(r:Room {roomId: $roomId})
      WHERE t.embedding IS NOT NULL AND size(t.embedding) > 0
      
      // Calculate cosine similarity
      WITH t,
           reduce(dot = 0.0, i IN range(0, size($queryEmbedding) - 1) | 
             dot + t.embedding[i] * $queryEmbedding[i]
           ) AS dotProduct,
           sqrt(reduce(sum = 0.0, val IN t.embedding | sum + val * val)) AS normT,
           sqrt(reduce(sum = 0.0, val IN $queryEmbedding | sum + val * val)) AS normQ
      
      WHERE normT > 0 AND normQ > 0
      WITH t, (dotProduct / (normT * normQ)) AS similarity
      WHERE similarity >= $minSimilarity
      
      RETURN t.threadId AS threadId,
             t.title AS title,
             similarity
      ORDER BY similarity DESC
      LIMIT $limit
    `;

    const params = {
      queryEmbedding,
      roomId,
      limit: neo4j.int(Math.floor(limit)),
      minSimilarity,
    };

    const result = await executeCypher(query, params);

    return result.records.map(record => ({
      threadId: record.get('threadId'),
      title: record.get('title'),
      similarity: record.get('similarity'),
    }));
  } catch (error) {
    console.error(`❌ Failed to find similar threads:`, error.message);
    return [];
  }
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

    // Create indexes for Message nodes
    await executeCypher(`
      CREATE INDEX message_messageId_index IF NOT EXISTS FOR (m:Message) ON (m.messageId)
    `);

    await executeCypher(`
      CREATE INDEX message_roomId_index IF NOT EXISTS FOR (m:Message) ON (m.roomId)
    `);

    // Create indexes for Thread nodes
    await executeCypher(`
      CREATE INDEX thread_threadId_index IF NOT EXISTS FOR (t:Thread) ON (t.threadId)
    `);

    await executeCypher(`
      CREATE INDEX thread_roomId_index IF NOT EXISTS FOR (t:Thread) ON (t.roomId)
    `);

    // Note: Neo4j 5.x+ supports vector indexes, but for compatibility we'll use
    // cosine similarity calculation in Cypher queries
    // If using Neo4j 5.11+, you can create vector indexes like:
    // CREATE VECTOR INDEX message_embedding_index IF NOT EXISTS
    // FOR (m:Message) ON m.embedding
    // OPTIONS {indexConfig: {`vector.dimensions`: 1536, `vector.similarity_function`: 'cosine'}}

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
      lastInteraction: metadata.lastInteraction
        ? new Date(metadata.lastInteraction).toISOString()
        : null,
      interventionCount: metadata.interventionCount || 0,
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
    console.error(
      `❌ PRIVACY VIOLATION: User ${authenticatedUserId} attempted to query relationships for user ${userId}`
    );
    throw new Error("Unauthorized: Cannot query other users' relationships");
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
      relationshipCreatedAt: record.get('relationshipCreatedAt'),
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
    throw new Error("Unauthorized: Cannot query other users' networks");
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
      roomIds: record.get('roomIds') || [],
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
    throw new Error("Unauthorized: Cannot query other users' relationships");
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
      lastInteraction: record.get('lastInteraction'),
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
  // Semantic threading functions
  createOrUpdateMessageNode,
  createOrUpdateThreadNode,
  linkMessageToThread,
  findSimilarMessages,
  findSimilarThreads,
  // Internal - exported for testing only
  _executeCypher: executeCypher,
};
