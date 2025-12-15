/**
 * Neo4j Graph Database Client
 * 
 * Creates and manages user nodes in Neo4j graph database.
 * Uses Neo4j HTTP API for compatibility without requiring additional dependencies.
 * 
 * Environment Variables:
 * - NEO4J_URI: Neo4j database URI (e.g., http://localhost:7474 or https://neo4j.example.com)
 * - NEO4J_USER: Neo4j username (default: neo4j)
 * - NEO4J_PASSWORD: Neo4j password (required if NEO4J_URI is set)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration from environment
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;

// Check if Neo4j is configured
const isNeo4jConfigured = !!(NEO4J_URI && NEO4J_PASSWORD);

/**
 * Make HTTP request to Neo4j
 * @private
 */
async function neo4jRequest(method, path, body = null) {
  if (!isNeo4jConfigured) {
    throw new Error('Neo4j is not configured. Set NEO4J_URI and NEO4J_PASSWORD environment variables.');
  }

  const url = new URL(NEO4J_URI);
  const auth = Buffer.from(`${NEO4J_USER}:${NEO4J_PASSWORD}`).toString('base64');

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 7474),
    path: path,
    method: method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // Use https for secure connections
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`Neo4j request failed: ${res.statusCode} - ${JSON.stringify(json)}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse Neo4j response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Neo4j request error: ${err.message}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Execute a Cypher query using Neo4j HTTP API
 * Supports both Neo4j 3.x and 4.x/5.x formats
 * @private
 */
async function executeCypher(query, params = {}) {
  const url = new URL(NEO4J_URI);
  const database = process.env.NEO4J_DATABASE || 'neo4j';
  
  // Try Neo4j 4.x/5.x format first (modern)
  let path = `/db/${database}/tx/commit`;
  let body = {
    statements: [{
      statement: query,
      parameters: params
    }]
  };

  try {
    const response = await neo4jRequest('POST', path, body);
    
    // Extract results from Neo4j 4.x/5.x response format
    if (response.results && response.results.length > 0) {
      return response.results[0];
    }
    
    return null;
  } catch (error) {
    // Fallback to Neo4j 3.x format if modern format fails
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.log('⚠️  Trying Neo4j 3.x API format...');
      path = '/db/data/transaction/commit';
      body = {
        statements: [{
          statement: query,
          parameters: params
        }]
      };
      
      const response = await neo4jRequest('POST', path, body);
      
      if (response.results && response.results.length > 0) {
        return response.results[0];
      }
    }
    
    throw error;
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
    // - Email: Stored in PostgreSQL only (data minimization)
    // - DisplayName: Not stored in Neo4j (anonymity - display names are identifying)
    // Display names can be retrieved from PostgreSQL when needed for queries
    const query = `
      CREATE (u:User {
        userId: $userId,
        username: $username,
        createdAt: datetime()
      })
      RETURN u
    `;

    const params = {
      userId: userId,
      username: username
    };

    const result = await executeCypher(query, params);

    if (result && result.data && result.data.length > 0) {
      console.log(`✅ Created Neo4j user node for userId: ${userId}, username: ${username}`);
      return result.data[0].row[0];
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
 * Room names (e.g., "Mom A & Dad A") are identifying and not stored in Neo4j.
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
    // Create bidirectional CO_PARENT_WITH relationships
    // Create room node and memberships
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
      // ANONYMITY: Don't store room name (e.g., "Mom A & Dad A" is identifying)
      // Room names can be retrieved from PostgreSQL when needed
      MERGE (r:Room {roomId: $roomId})
      SET r.type = "co-parent",
          r.createdAt = datetime()
      
      // Create room memberships
      MERGE (u1)-[m1:MEMBER_OF {role: "owner", joinedAt: datetime()}]->(r)
      MERGE (u2)-[m2:MEMBER_OF {role: "member", joinedAt: datetime()}]->(r)
      
      RETURN r1, r2, r, m1, m2
    `;

    const params = {
      userId1: userId1,
      userId2: userId2,
      roomId: roomId
      // roomName not included - not stored for anonymity
    };

    const result = await executeCypher(query, params);

    if (result && result.data && result.data.length > 0) {
      console.log(`✅ Created Neo4j co-parent relationship: User ${userId1} <-> User ${userId2} (Room: ${roomId})`);
      return result.data[0].row;
    }

    throw new Error('Neo4j query returned no results');
  } catch (error) {
    // Log error but don't throw - room creation should succeed even if Neo4j fails
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
      userId1: userId1,
      userId2: userId2
    };

    const result = await executeCypher(query, params);

    if (result && result.data && result.data.length > 0) {
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
 * Callers must verify authentication before calling this function.
 * 
 * ANONYMITY: Returns username (pseudonymized) instead of displayName (identifying).
 * Display names can be retrieved from PostgreSQL when needed.
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
    // PRIVACY: Query scoped to specific user - only returns relationships where user is a participant
    // ANONYMITY: Don't return displayName (not stored in Neo4j for anonymity)
    // Display names can be retrieved from PostgreSQL when needed
    const query = `
      MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->(coParent:User)
      RETURN coParent.userId as userId, coParent.username as username, r.roomId as roomId
    `;

    const params = { userId: userId };
    const result = await executeCypher(query, params);

    if (result && result.data) {
      return result.data.map(row => ({
        userId: row.row[0],
        username: row.row[1],  // Return username instead of displayName (anonymity)
        roomId: row.row[2]
      }));
    }

    return [];
  } catch (error) {
    console.error(`❌ Failed to query co-parents for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get all active co-parents for the authenticated user
 * SECURE VERSION: Automatically enforces authentication
 * 
 * Use this function from API routes where req.user is available.
 * This ensures users can only query their own relationships.
 * 
 * @param {number} authenticatedUserId - Authenticated user's ID from req.user.id
 * @returns {Promise<Array>} Array of co-parent user information
 */
async function getCoParentsSecure(authenticatedUserId) {
  if (!authenticatedUserId) {
    throw new Error('Authentication required: authenticatedUserId must be provided');
  }
  
  // Automatically use authenticated user's ID (privacy enforced)
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
    const userIndexQuery = `
      CREATE INDEX user_userId_index IF NOT EXISTS FOR (u:User) ON (u.userId);
      CREATE INDEX user_username_index IF NOT EXISTS FOR (u:User) ON (u.username);
    `;

    // Create indexes for Room nodes
    const roomIndexQuery = `
      CREATE INDEX room_roomId_index IF NOT EXISTS FOR (r:Room) ON (r.roomId);
    `;

    await executeCypher(userIndexQuery);
    await executeCypher(roomIndexQuery);

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
 * Strengthens Neo4j with data from PostgreSQL (message counts, activity)
 * 
 * @param {number} userId1 - First user's PostgreSQL ID
 * @param {number} userId2 - Second user's PostgreSQL ID
 * @param {string} roomId - Room ID
 * @param {Object} metadata - Relationship metadata from PostgreSQL
 * @param {number} [metadata.messageCount] - Total messages in room
 * @param {Date} [metadata.lastInteraction] - Last message timestamp
 * @param {number} [metadata.interventionCount] - Number of AI interventions
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
      userId1,
      userId2,
      roomId,
      messageCount: metadata.messageCount || 0,
      lastInteraction: metadata.lastInteraction ? new Date(metadata.lastInteraction).toISOString() : null,
      interventionCount: metadata.interventionCount || 0
    };

    const result = await executeCypher(query, params);
    return result && result.data && result.data.length > 0;
  } catch (error) {
    console.error(`❌ Failed to update relationship metadata:`, error.message);
    return false;
  }
}

/**
 * Get co-parents with relationship strength metrics
 * Enhanced version that includes activity and interaction data
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
      ORDER BY r.lastInteraction DESC NULLS LAST
    `;

    const params = { userId };
    const result = await executeCypher(query, params);

    if (result && result.data) {
      return result.data.map(row => ({
        userId: row.row[0],
        username: row.row[1],
        roomId: row.row[2],
        messageCount: row.row[3] || 0,
        lastInteraction: row.row[4],
        interventionCount: row.row[5] || 0,
        relationshipCreatedAt: row.row[6]
      }));
    }

    return [];
  } catch (error) {
    console.error(`❌ Failed to query co-parents with metrics for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get relationship network analysis
 * Finds users connected through co-parent relationships (1-2 degrees)
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
      WHERE r.active = true AND other.userId <> $userId
      WITH other, length(path) as distance, path
      RETURN DISTINCT other.userId as userId, 
             other.username as username,
             distance,
             [rel in relationships(path) | rel.roomId] as roomIds
      ORDER BY distance, other.username
      LIMIT 20
    `;

    const params = { userId };
    const result = await executeCypher(query, params);

    if (result && result.data) {
      return result.data.map(row => ({
        userId: row.row[0],
        username: row.row[1],
        distance: row.row[2],
        roomIds: row.row[3] || []
      }));
    }

    return [];
  } catch (error) {
    console.error(`❌ Failed to query relationship network for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Get active relationships with high activity
 * Useful for identifying most active co-parenting relationships
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
      ORDER BY r.messageCount DESC, r.lastInteraction DESC NULLS LAST
    `;

    const params = { userId, minMessages };
    const result = await executeCypher(query, params);

    if (result && result.data) {
      return result.data.map(row => ({
        userId: row.row[0],
        username: row.row[1],
        roomId: row.row[2],
        messageCount: row.row[3] || 0,
        lastInteraction: row.row[4]
      }));
    }

    return [];
  } catch (error) {
    console.error(`❌ Failed to query active relationships for user ${userId}:`, error.message);
    return [];
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
  getCoParentsSecure, // Use this from API routes for automatic privacy enforcement
  getCoParentsWithMetrics, // Enhanced version with relationship metrics
  getRelationshipNetwork, // Network analysis
  getActiveRelationships, // Active relationship queries
  updateRelationshipMetadata, // Update relationship stats from PostgreSQL
  initializeIndexes, // Initialize Neo4j indexes
  isAvailable,
  isNeo4jConfigured
};

