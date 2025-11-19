const crypto = require('crypto');
const dbModule = require('./db');
const dbSafe = require('./dbSafe');
const roomManager = require('./roomManager');
const auth = require('./auth');

/**
 * Get database instance
 */
async function getDb() {
  return await dbModule.getDb();
}

/**
 * Generate a secure, unique token for invitations
 */
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Check if email exists in database
 */
async function emailExists(email) {
  if (!validateEmail(email)) {
    return false;
  }
  
  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  return dbSafe.parseResult(result).length > 0;
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  if (!validateEmail(email)) {
    return null;
  }
  
  const emailLower = email.trim().toLowerCase();
  const result = await dbSafe.safeSelect('users', { email: emailLower }, { limit: 1 });
  const users = dbSafe.parseResult(result);
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0];
  return {
    id: user.id,
    username: user.username,
    email: user.email
  };
}

/**
 * Create a pending connection invitation
 * Returns the token and connection record
 */
async function createPendingConnection(inviterId, inviteeEmail) {
  if (!validateEmail(inviteeEmail)) {
    throw new Error('Invalid email format');
  }
  
  const token = generateInviteToken();
  const now = new Date().toISOString();
  // Token expires in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const emailLower = inviteeEmail.trim().toLowerCase();
  
  try {
    // Check if there's already a pending connection from this inviter to this email
    // Use safeExec for complex query with datetime comparison
    const db = await getDb();
    const existingQuery = `SELECT * FROM pending_connections 
      WHERE inviter_id = ${parseInt(inviterId)} 
      AND invitee_email = ${dbSafe.escapeSQL(emailLower)}
      AND status = 'pending'
      AND datetime(expires_at) > datetime('now')
      LIMIT 1`;
    
    const existing = db.exec(existingQuery);
    
    if (existing.length > 0 && existing[0].values.length > 0) {
      // Return existing pending connection
      const connections = dbSafe.parseResult(existing);
      const connection = connections[0];
      
      return {
        id: connection.id,
        token: connection.token,
        inviterId: connection.inviter_id,
        inviteeEmail: connection.invitee_email,
        status: connection.status,
        expiresAt: connection.expires_at,
        createdAt: connection.created_at,
        isNew: false
      };
    }
    
    // Create new pending connection using safe insert
    const connectionId = await dbSafe.safeInsert('pending_connections', {
      inviter_id: inviterId,
      invitee_email: emailLower,
      token: token,
      status: 'pending',
      expires_at: expiresAt,
      created_at: now
    });
    
    return {
      id: connectionId,
      token,
      inviterId,
      inviteeEmail: emailLower,
      status: 'pending',
      expiresAt,
      createdAt: now,
      isNew: true
    };
  } catch (error) {
    console.error('Error creating pending connection:', error);
    throw error;
  }
}

/**
 * Validate a connection token
 */
async function validateConnectionToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  
  // Use safeExec for complex query with datetime comparison
  const db = await getDb();
  const query = `SELECT * FROM pending_connections
    WHERE token = ${dbSafe.escapeSQL(token)}
    AND status = 'pending'
    AND datetime(expires_at) > datetime('now')
    LIMIT 1`;
  
  const result = db.exec(query);
  const connections = dbSafe.parseResult(result);
  
  if (connections.length === 0) {
    return null;
  }
  
  const connection = connections[0];
  
  return {
    id: connection.id,
    token: connection.token,
    inviterId: connection.inviter_id,
    inviteeEmail: connection.invitee_email,
    status: connection.status,
    expiresAt: connection.expires_at,
    createdAt: connection.created_at
  };
}

/**
 * Accept a pending connection and create the co-parent relationship
 * This creates a connection by adding both users to each other's rooms
 */
async function acceptPendingConnection(token, userId) {
  const connection = await validateConnectionToken(token);
  if (!connection) {
    throw new Error('Invalid or expired invitation token');
  }
  
  const now = new Date().toISOString();
  
  try {
    // Get inviter's room
    const inviterRoom = await roomManager.getUserRoom(connection.inviterId);
    if (!inviterRoom) {
      throw new Error('Inviter does not have a room');
    }
    
    // Get invitee's room (may not exist yet for new users)
    let inviteeRoom = await roomManager.getUserRoom(userId);
    
    // Add invitee to inviter's room (if not already a member) using safe queries
    const existingMember = await dbSafe.safeSelect('room_members', {
      room_id: inviterRoom.roomId,
      user_id: userId
    }, { limit: 1 });
    
    if (dbSafe.parseResult(existingMember).length === 0) {
      await dbSafe.safeInsert('room_members', {
        room_id: inviterRoom.roomId,
        user_id: userId,
        role: 'member',
        joined_at: now
      });
    }
    
    // If invitee has a room, add inviter to invitee's room
    if (inviteeRoom) {
      const inviterExisting = await dbSafe.safeSelect('room_members', {
        room_id: inviteeRoom.roomId,
        user_id: connection.inviterId
      }, { limit: 1 });
      
      if (dbSafe.parseResult(inviterExisting).length === 0) {
        await dbSafe.safeInsert('room_members', {
          room_id: inviteeRoom.roomId,
          user_id: connection.inviterId,
          role: 'member',
          joined_at: now
        });
      }
    }
    
    // Mark connection as accepted using safe update
    await dbSafe.safeUpdate('pending_connections', {
      status: 'accepted',
      accepted_at: now
    }, { token: token });
    
    // Create co-parent contacts for both users
    try {
      // Get inviter user info
      const inviterResult = await dbSafe.safeSelect('users', { id: connection.inviterId }, { limit: 1 });
      const inviterUsers = dbSafe.parseResult(inviterResult);
      
      // Get invitee user info
      const inviteeResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      const inviteeUsers = dbSafe.parseResult(inviteeResult);
      
      if (inviterUsers.length > 0 && inviteeUsers.length > 0) {
        const inviter = inviterUsers[0];
        const invitee = inviteeUsers[0];
        
        // Check if contact already exists for inviter (by name or email)
        const inviterContactCheck = await dbSafe.safeSelect('contacts', {
          user_id: connection.inviterId,
          contact_name: invitee.username
        }, { limit: 1 });
        
        const inviterContacts = dbSafe.parseResult(inviterContactCheck);
        const inviterHasContact = inviterContacts.length > 0 && 
          inviterContacts.some(c => c.relationship === 'co-parent');
        
        if (!inviterHasContact) {
          // Create contact for inviter (invitee is their co-parent)
          await dbSafe.safeInsert('contacts', {
            user_id: connection.inviterId,
            contact_name: invitee.username,
            contact_email: invitee.email || connection.inviteeEmail || null,
            relationship: 'co-parent',
            notes: `Connected via invitation on ${new Date().toLocaleDateString()}`,
            separation_date: null,
            address: null,
            difficult_aspects: null,
            friction_situations: null,
            legal_matters: null,
            safety_concerns: null,
            substance_mental_health: null,
            neglect_abuse_concerns: null,
            additional_thoughts: null,
            created_at: now,
            updated_at: now
          });
          console.log(`✅ Created co-parent contact for ${inviter.username}: ${invitee.username}`);
        }
        
        // Check if contact already exists for invitee (by name or email)
        const inviteeContactCheck = await dbSafe.safeSelect('contacts', {
          user_id: userId,
          contact_name: inviter.username
        }, { limit: 1 });
        
        const inviteeContacts = dbSafe.parseResult(inviteeContactCheck);
        const inviteeHasContact = inviteeContacts.length > 0 && 
          inviteeContacts.some(c => c.relationship === 'co-parent');
        
        if (!inviteeHasContact) {
          // Create contact for invitee (inviter is their co-parent)
          await dbSafe.safeInsert('contacts', {
            user_id: userId,
            contact_name: inviter.username,
            contact_email: inviter.email || null,
            relationship: 'co-parent',
            notes: `Connected via invitation on ${new Date().toLocaleDateString()}`,
            separation_date: null,
            address: null,
            difficult_aspects: null,
            friction_situations: null,
            legal_matters: null,
            safety_concerns: null,
            substance_mental_health: null,
            neglect_abuse_concerns: null,
            additional_thoughts: null,
            created_at: now,
            updated_at: now
          });
          console.log(`✅ Created co-parent contact for ${invitee.username}: ${inviter.username}`);
        }
        
        // Save database after creating contacts
        require('./db').saveDatabase();
        
        // Note: Auto-complete onboarding tasks will be called from the server endpoint
        // that calls this function, to avoid circular dependencies
      }
    } catch (contactError) {
      // Log error but don't fail the connection if contact creation fails
      console.error('Error creating co-parent contacts:', contactError);
    }
    
    return {
      success: true,
      inviterRoom: inviterRoom.roomId,
      inviteeRoom: inviteeRoom ? inviteeRoom.roomId : null
    };
  } catch (error) {
    console.error('Error accepting pending connection:', error);
    throw error;
  }
}

/**
 * Get pending connections for a user (as inviter or invitee)
 */
async function getPendingConnections(userId, includeInviter = true, includeInvitee = true) {
  const results = [];
  
  // Get connections where user is inviter
  if (includeInviter) {
    const db = await getDb();
    const query = `SELECT * FROM pending_connections 
      WHERE inviter_id = ${parseInt(userId)}
      AND status = 'pending' 
      AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC`;
    
    const inviterResult = db.exec(query);
    const connections = dbSafe.parseResult(inviterResult);
    results.push(...connections);
  }
  
  // Get connections where user is invitee
  if (includeInvitee) {
    // Get user's email first using safe select
    const userResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
    const users = dbSafe.parseResult(userResult);
    
    if (users.length > 0 && users[0].email) {
      const userEmail = users[0].email.toLowerCase();
      const db = await getDb();
      const query = `SELECT * FROM pending_connections 
        WHERE invitee_email = ${dbSafe.escapeSQL(userEmail)}
        AND status = 'pending' 
        AND datetime(expires_at) > datetime('now')
        ORDER BY created_at DESC`;
      
      const inviteeResult = db.exec(query);
      const connections = dbSafe.parseResult(inviteeResult);
      results.push(...connections);
    }
  }
  
  // Remove duplicates and format
  const uniqueConnections = new Map();
  results.forEach(conn => {
    if (!uniqueConnections.has(conn.id)) {
      uniqueConnections.set(conn.id, {
        id: conn.id,
        token: conn.token,
        inviterId: conn.inviter_id,
        inviteeEmail: conn.invitee_email,
        status: conn.status,
        expiresAt: conn.expires_at,
        createdAt: conn.created_at
      });
    }
  });
  
  return Array.from(uniqueConnections.values());
}

module.exports = {
  validateEmail,
  emailExists,
  getUserByEmail,
  createPendingConnection,
  validateConnectionToken,
  acceptPendingConnection,
  getPendingConnections
};

