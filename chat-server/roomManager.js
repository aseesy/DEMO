const crypto = require('crypto');
const dbModule = require('./db');
const dbSafe = require('./dbSafe');

/**
 * Get database instance
 */
async function getDb() {
  return await dbModule.getDb();
}

/**
 * Generate a unique room ID
 */
function generateRoomId() {
  return `room_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Generate a secure invite code (9 characters)
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(9);
  for (let i = 0; i < 9; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    code += chars[randomIndex];
  }
  return code;
}

/**
 * Create a private room for a user (called during signup)
 */
async function createPrivateRoom(userId, username) {
  const roomId = generateRoomId();
  const roomName = `${username}'s Co-Parenting Room`;
  const now = new Date().toISOString();

  try {
    // Create the room using safe insert
    await dbSafe.safeInsert('rooms', {
      id: roomId,
      name: roomName,
      created_by: userId,
      is_private: 1,
      created_at: now
    });

    // Add creator as owner using safe insert
    await dbSafe.safeInsert('room_members', {
      room_id: roomId,
      user_id: userId,
      role: 'owner',
      joined_at: now
    });

    return {
      roomId,
      roomName,
      createdBy: userId,
      isPrivate: true
    };
  } catch (error) {
    console.error('Error creating private room:', error);
    throw error;
  }
}

/**
 * Get user's room (either owned or member of)
 * Prioritizes rooms with multiple members (shared rooms) over solo rooms
 */
async function getUserRoom(userId) {
  const db = await getDb();

  // First, try to find a room with multiple members (shared room)
  // This ensures co-parents end up in the same room after connection
  // Use safeExec for complex query - userId is already validated as integer
  const sharedRoomQuery = `
    SELECT r.*, rm.role, COUNT(rm2.user_id) as member_count
    FROM rooms r
    INNER JOIN room_members rm ON r.id = rm.room_id
    LEFT JOIN room_members rm2 ON r.id = rm2.room_id
    WHERE rm.user_id = ${parseInt(userId)}
    GROUP BY r.id, rm.role
    HAVING member_count > 1
    ORDER BY datetime(rm.joined_at) DESC
    LIMIT 1
  `;

  const sharedRoomResult = db.exec(sharedRoomQuery);

  if (sharedRoomResult.length > 0 && sharedRoomResult[0].values.length > 0) {
    const rooms = dbSafe.parseResult(sharedRoomResult);
    const room = rooms[0];

    return {
      roomId: room.id,
      roomName: room.name,
      createdBy: room.created_by,
      isPrivate: room.is_private === 1,
      role: room.role,
      createdAt: room.created_at
    };
  }

  // Fallback: return any room the user belongs to (for solo users)
  // Use safeExec for complex query - userId is already validated as integer
  const fallbackQuery = `
    SELECT r.*, rm.role
    FROM rooms r
    INNER JOIN room_members rm ON r.id = rm.room_id
    WHERE rm.user_id = ${parseInt(userId)}
    ORDER BY datetime(rm.joined_at) DESC
    LIMIT 1
  `;

  const result = db.exec(fallbackQuery);
  const rooms = dbSafe.parseResult(result);

  if (rooms.length === 0) {
    return null;
  }

  const room = rooms[0];

  return {
    roomId: room.id,
    roomName: room.name,
    createdBy: room.created_by,
    isPrivate: room.is_private === 1,
    role: room.role,
    createdAt: room.created_at
  };
}

/**
 * Get room members
 */
async function getRoomMembers(roomId) {
  const db = await getDb();

  // Use safeExec for complex JOIN query - roomId is generated internally, but escape for safety
  const query = `
    SELECT u.id, u.username, rm.role, rm.joined_at
    FROM users u
    INNER JOIN room_members rm ON u.id = rm.user_id
    WHERE rm.room_id = ${dbSafe.escapeSQL(roomId)}
  `;

  const result = db.exec(query);
  const members = dbSafe.parseResult(result);

  return members;
}

/**
 * Create an invite for a room
 */
async function createInvite(roomId, invitedBy) {
  const inviteId = `invite_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const inviteCode = generateInviteCode();
  console.log(`Generated invite code: ${inviteCode} (length: ${inviteCode.length})`);
  const now = new Date().toISOString();

  // Expire in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Use safe insert
    await dbSafe.safeInsert('room_invites', {
      id: inviteId,
      room_id: roomId,
      invited_by: invitedBy,
      invite_code: inviteCode,
      expires_at: expiresAt,
      created_at: now
    });

    return {
      inviteId,
      inviteCode,
      roomId,
      invitedBy,
      expiresAt
    };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
}

/**
 * Validate and use an invite code
 */
async function validateInvite(inviteCode) {
  const db = await getDb();

  // Use safeExec for complex query with datetime comparison
  const query = `
    SELECT *
    FROM room_invites
    WHERE invite_code = ${dbSafe.escapeSQL(inviteCode)}
    AND used_by IS NULL
    AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    LIMIT 1
  `;

  const result = db.exec(query);
  const invites = dbSafe.parseResult(result);

  if (invites.length === 0) {
    return null;
  }

  const invite = invites[0];

  return {
    inviteId: invite.id,
    roomId: invite.room_id,
    invitedBy: invite.invited_by,
    inviteCode: invite.invite_code,
    expiresAt: invite.expires_at
  };
}

/**
 * Use an invite (mark as used and add user to room)
 */
async function useInvite(inviteCode, userId) {
  const now = new Date().toISOString();

  try {
    // Get invite details
    const invite = await validateInvite(inviteCode);
    if (!invite) {
      throw new Error('Invalid or expired invite code');
    }

    // Check if user is already a member using safe select
    const existingMember = await dbSafe.safeSelect('room_members', {
      room_id: invite.roomId,
      user_id: userId
    }, { limit: 1 });

    if (dbSafe.parseResult(existingMember).length > 0) {
      throw new Error('User is already a member of this room');
    }

    // Add user to room using safe insert
    await dbSafe.safeInsert('room_members', {
      room_id: invite.roomId,
      user_id: userId,
      role: 'member',
      joined_at: now
    });

    // Mark invite as used using safe update
    await dbSafe.safeUpdate('room_invites', {
      used_by: userId,
      used_at: now
    }, { invite_code: inviteCode });

    // Create contacts for all users in the room
    try {
      // Get all members of the room
      const roomMembers = await getRoomMembers(invite.roomId);
      
      if (roomMembers.length > 1) {
        // Get the user who just joined
        const newUserResult = await dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
        const newUsers = dbSafe.parseResult(newUserResult);
        
        if (newUsers.length > 0) {
          const newUser = newUsers[0];
          
          // Create contacts between the new user and all existing room members
          for (const member of roomMembers) {
            // Skip if it's the same user
            if (member.id === userId) continue;
            
            // Get the other member's user info
            const otherUserResult = await dbSafe.safeSelect('users', { id: member.id }, { limit: 1 });
            const otherUsers = dbSafe.parseResult(otherUserResult);
            
            if (otherUsers.length > 0) {
              const otherUser = otherUsers[0];
              
              // Check if contact already exists for new user -> other user
              const existingContact1 = await dbSafe.safeSelect('contacts', {
                user_id: userId,
                contact_name: otherUser.username,
                relationship: 'co-parent'
              }, { limit: 1 });
              
              if (dbSafe.parseResult(existingContact1).length === 0) {
                await dbSafe.safeInsert('contacts', {
                  user_id: userId,
                  contact_name: otherUser.username,
                  contact_email: otherUser.email || null,
                  relationship: 'co-parent',
                  notes: `Connected via invite code on ${new Date().toLocaleDateString()}`,
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
                console.log(`✅ Created co-parent contact for ${newUser.username}: ${otherUser.username}`);
              }
              
              // Check if contact already exists for other user -> new user
              const existingContact2 = await dbSafe.safeSelect('contacts', {
                user_id: member.id,
                contact_name: newUser.username,
                relationship: 'co-parent'
              }, { limit: 1 });
              
              if (dbSafe.parseResult(existingContact2).length === 0) {
                await dbSafe.safeInsert('contacts', {
                  user_id: member.id,
                  contact_name: newUser.username,
                  contact_email: newUser.email || null,
                  relationship: 'co-parent',
                  notes: `Connected via invite code on ${new Date().toLocaleDateString()}`,
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
                console.log(`✅ Created co-parent contact for ${otherUser.username}: ${newUser.username}`);
              }
            }
          }
          
          // Save database after creating contacts
          require('./db').saveDatabase();
          
          // Note: Auto-complete onboarding tasks will be called from the server endpoint
          // that calls useInvite, to avoid circular dependencies
          
          // Share contacts (names only) between users
          // This allows each user to see the other's contacts but add their own context
          try {
            // Get new user's contacts (excluding co-parent contacts)
            const newUserContactsResult = await dbSafe.safeSelect('contacts', {
              user_id: userId
            });
            const newUserContacts = dbSafe.parseResult(newUserContactsResult);
            const newUserContactNames = newUserContacts
              .filter(c => c.relationship !== 'co-parent')
              .map(c => c.contact_name);
            
            // Get other user's contacts (excluding co-parent contacts)
            const otherUserContactsResult = await dbSafe.safeSelect('contacts', {
              user_id: member.id
            });
            const otherUserContacts = dbSafe.parseResult(otherUserContactsResult);
            const otherUserContactNames = otherUserContacts
              .filter(c => c.relationship !== 'co-parent')
              .map(c => c.contact_name);
            
            // Share new user's contacts with other user (names only)
            for (const contactName of newUserContactNames) {
              // Check if other user already has this contact
              const existingCheck = await dbSafe.safeSelect('contacts', {
                user_id: member.id,
                contact_name: contactName
              }, { limit: 1 });
              
              if (dbSafe.parseResult(existingCheck).length === 0) {
                // Create contact with just the name - user can add their own context
                await dbSafe.safeInsert('contacts', {
                  user_id: member.id,
                  contact_name: contactName,
                  contact_email: null,
                  relationship: null, // User can set their own relationship
                  notes: `Shared from ${newUser.username}`,
                  separation_date: null,
                  address: null,
                  difficult_aspects: null,
                  friction_situations: null,
                  legal_matters: null,
                  safety_concerns: null,
                  substance_mental_health: null,
                  neglect_abuse_concerns: null,
                  additional_thoughts: null,
                  other_parent: null,
                  created_at: now,
                  updated_at: now
                });
                console.log(`📋 Shared contact "${contactName}" from ${newUser.username} to ${otherUser.username}`);
              }
            }
            
            // Share other user's contacts with new user (names only)
            for (const contactName of otherUserContactNames) {
              // Check if new user already has this contact
              const existingCheck = await dbSafe.safeSelect('contacts', {
                user_id: userId,
                contact_name: contactName
              }, { limit: 1 });
              
              if (dbSafe.parseResult(existingCheck).length === 0) {
                // Create contact with just the name - user can add their own context
                await dbSafe.safeInsert('contacts', {
                  user_id: userId,
                  contact_name: contactName,
                  contact_email: null,
                  relationship: null, // User can set their own relationship
                  notes: `Shared from ${otherUser.username}`,
                  separation_date: null,
                  address: null,
                  difficult_aspects: null,
                  friction_situations: null,
                  legal_matters: null,
                  safety_concerns: null,
                  substance_mental_health: null,
                  neglect_abuse_concerns: null,
                  additional_thoughts: null,
                  other_parent: null,
                  created_at: now,
                  updated_at: now
                });
                console.log(`📋 Shared contact "${contactName}" from ${otherUser.username} to ${newUser.username}`);
              }
            }
            
            // Save database after sharing contacts
            require('./db').saveDatabase();
          } catch (shareError) {
            // Log error but don't fail the invite if contact sharing fails
            console.error('Error sharing contacts when joining room:', shareError);
          }
        }
      }
    } catch (contactError) {
      // Log error but don't fail the invite if contact creation fails
      console.error('Error creating contacts when joining room:', contactError);
    }

    return {
      success: true,
      roomId: invite.roomId
    };
  } catch (error) {
    console.error('Error using invite:', error);
    throw error;
  }
}

/**
 * Check if user has access to a room
 */
async function hasRoomAccess(userId, roomId) {
  const result = await dbSafe.safeSelect('room_members', {
    room_id: roomId,
    user_id: userId
  }, { limit: 1 });

  return dbSafe.parseResult(result).length > 0;
}

/**
 * Ensure contacts exist for all users in a shared room
 * Called when users join to make sure contacts are created
 */
async function ensureContactsForRoomMembers(roomId) {
  const now = new Date().toISOString();
  
  try {
    console.log(`🔍 ensureContactsForRoomMembers called for room: ${roomId}`);
    const roomMembers = await getRoomMembers(roomId);
    console.log(`📋 Room has ${roomMembers.length} members:`, roomMembers.map(m => ({ id: m.id, username: m.username })));
    
    if (roomMembers.length < 2) {
      // Need at least 2 members to create contacts
      console.log(`⚠️ Room has less than 2 members, skipping contact creation`);
      return;
    }
    
    // Create contacts for all pairs of users in the room
    for (let i = 0; i < roomMembers.length; i++) {
      for (let j = i + 1; j < roomMembers.length; j++) {
        const user1 = roomMembers[i];
        const user2 = roomMembers[j];
        
        // Get user info for both
        const user1Result = await dbSafe.safeSelect('users', { id: user1.id }, { limit: 1 });
        const user2Result = await dbSafe.safeSelect('users', { id: user2.id }, { limit: 1 });
        
        const user1Data = dbSafe.parseResult(user1Result);
        const user2Data = dbSafe.parseResult(user2Result);
        
        if (user1Data.length > 0 && user2Data.length > 0) {
          const u1 = user1Data[0];
          const u2 = user2Data[0];
          
          console.log(`🔎 Checking contacts between ${u1.username} (${user1.id}) and ${u2.username} (${user2.id})`);
          
          // Check if contact exists for user1 -> user2
          // Note: We check by contact_name (username) to avoid case sensitivity issues
          const check1 = await dbSafe.safeSelect('contacts', {
            user_id: user1.id,
            relationship: 'co-parent'
          }, { limit: 100 }); // Get all co-parent contacts to check
          
          const existing1 = dbSafe.parseResult(check1);
          // Check if contact with this name already exists
          const contactExists1 = existing1.some(c => c.contact_name && c.contact_name.toLowerCase() === u2.username.toLowerCase());
          console.log(`   ${u1.username} -> ${u2.username}: ${contactExists1 ? 'EXISTS' : 'NOT FOUND'} (checked ${existing1.length} contacts)`);
          
          if (!contactExists1) {
            await dbSafe.safeInsert('contacts', {
              user_id: user1.id,
              contact_name: u2.username,
              contact_email: u2.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
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
            console.log(`✅ Created co-parent contact for ${u1.username}: ${u2.username}`);
          }
          
          // Check if contact exists for user2 -> user1
          const check2 = await dbSafe.safeSelect('contacts', {
            user_id: user2.id,
            relationship: 'co-parent'
          }, { limit: 100 }); // Get all co-parent contacts to check
          
          const existing2 = dbSafe.parseResult(check2);
          // Check if contact with this name already exists
          const contactExists2 = existing2.some(c => c.contact_name && c.contact_name.toLowerCase() === u1.username.toLowerCase());
          console.log(`   ${u2.username} -> ${u1.username}: ${contactExists2 ? 'EXISTS' : 'NOT FOUND'} (checked ${existing2.length} contacts)`);
          
          if (!contactExists2) {
            await dbSafe.safeInsert('contacts', {
              user_id: user2.id,
              contact_name: u1.username,
              contact_email: u1.email || null,
              relationship: 'co-parent',
              notes: `Connected via shared room`,
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
            console.log(`✅ Created co-parent contact for ${u2.username}: ${u1.username}`);
          }
        }
      }
    }
    
    // Save database after creating contacts
    require('./db').saveDatabase();
  } catch (error) {
    console.error('Error ensuring contacts for room members:', error);
    // Don't throw - this is a helper function
  }
}

/**
 * Get active invites for a room
 */
async function getRoomInvites(roomId) {
  const db = await getDb();

  // Use safeExec for complex query with datetime comparison
  const query = `
    SELECT *
    FROM room_invites
    WHERE room_id = ${dbSafe.escapeSQL(roomId)}
    AND used_by IS NULL
    AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    ORDER BY created_at DESC
  `;

  const result = db.exec(query);
  const invites = dbSafe.parseResult(result);

  return invites.map(invite => ({
    inviteId: invite.id,
    inviteCode: invite.invite_code,
    invitedBy: invite.invited_by,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at
  }));
}

module.exports = {
  createPrivateRoom,
  getUserRoom,
  getRoomMembers,
  createInvite,
  validateInvite,
  useInvite,
  hasRoomAccess,
  getRoomInvites,
  ensureContactsForRoomMembers
};
