/**
 * Code Invitation Creator
 *
 * Creates code-based pairing invitations (quick codes for existing users).
 *
 * @module pairing-manager/creators/CodeInvitationCreator
 */

const { InvitationCreator } = require('./InvitationCreator');
const {
  getActivePairing,
  createUniquePairingCode,
  logPairingAction,
  PAIRING_STATUS,
  INVITE_TYPE,
} = require('../pairingCreator');
const { calculateExpiration } = require('../config/invitationConfig');

/**
 * Creator for code-based pairing invitations
 */
class CodeInvitationCreator extends InvitationCreator {
  getType() {
    return INVITE_TYPE.CODE;
  }

  async create(params, db) {
    const { initiatorId, initiatorUsername } = params;

    // Validation
    if (!initiatorId) throw new Error('initiatorId is required');
    if (!db) throw new Error('database connection is required');

    // Check if already paired
    const activePairing = await getActivePairing(initiatorId, db);
    if (activePairing) {
      throw new Error('You already have an active co-parent connection');
    }

    // Check for existing pending code and expire it
    await db.query(
      `UPDATE pairing_sessions
       SET status = $1
       WHERE parent_a_id = $2 AND status = $3 AND invite_type = $4`,
      [PAIRING_STATUS.EXPIRED, initiatorId, PAIRING_STATUS.PENDING, INVITE_TYPE.CODE]
    );

    // Generate unique code (no token needed for code-based pairing)
    const pairingCode = await createUniquePairingCode(db);
    const expiresAt = calculateExpiration(INVITE_TYPE.CODE);

    // Insert pairing session
    const result = await db.query(
      `INSERT INTO pairing_sessions (
        pairing_code, parent_a_id, status, invite_type,
        invited_by_username, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        pairingCode,
        initiatorId,
        PAIRING_STATUS.PENDING,
        INVITE_TYPE.CODE,
        initiatorUsername || null,
        expiresAt.toISOString(),
      ]
    );

    const pairing = result.rows[0];

    // Log to audit trail
    await logPairingAction(db, {
      pairingSessionId: pairing.id,
      action: 'created',
      actorUserId: initiatorId,
      metadata: { invite_type: INVITE_TYPE.CODE },
    });

    return {
      pairing,
      pairingCode,
      expiresAt,
    };
  }
}

module.exports = { CodeInvitationCreator };

