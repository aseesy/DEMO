/**
 * Email Invitation Creator
 *
 * Creates email-based pairing invitations.
 *
 * @module pairing-manager/creators/EmailInvitationCreator
 */

const { InvitationCreator } = require('./InvitationCreator');
const {
  getActivePairing,
  createUniquePairingCode,
  generateToken,
  hashToken,
  logPairingAction,
  PAIRING_STATUS,
  INVITE_TYPE,
} = require('../pairingCreator');
const { calculateExpiration } = require('../config/invitationConfig');

/**
 * Creator for email-based pairing invitations
 */
class EmailInvitationCreator extends InvitationCreator {
  getType() {
    return INVITE_TYPE.EMAIL;
  }

  async create(params, db) {
    const { initiatorId, inviteeEmail, initiatorUsername } = params;

    // Validation
    if (!initiatorId) throw new Error('initiatorId is required');
    if (!inviteeEmail) throw new Error('inviteeEmail is required');
    if (!db) throw new Error('database connection is required');

    // Check if already paired
    const activePairing = await getActivePairing(initiatorId, db);
    if (activePairing) {
      throw new Error('You already have an active co-parent connection');
    }

    // Generate unique code and token
    const pairingCode = await createUniquePairingCode(db);
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = calculateExpiration(INVITE_TYPE.EMAIL);

    // Insert pairing session
    const result = await db.query(
      `INSERT INTO pairing_sessions (
        pairing_code, parent_a_id, parent_b_email, status, invite_type,
        invite_token, invited_by_username, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        pairingCode,
        initiatorId,
        inviteeEmail.toLowerCase().trim(),
        PAIRING_STATUS.PENDING,
        INVITE_TYPE.EMAIL,
        tokenHash,
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
      metadata: { invite_type: INVITE_TYPE.EMAIL, invitee_email: inviteeEmail },
    });

    return {
      pairing,
      pairingCode,
      token: rawToken, // Raw token for URL (not the hash)
      expiresAt,
    };
  }
}

module.exports = { EmailInvitationCreator };

