/**
 * Import Routes
 *
 * Single Responsibility: Handle message import and cleanup operations.
 *
 * Handles:
 * - Message import from external sources
 * - Message cleanup operations
 * - Admin authentication (Bearer token)
 */

const express = require('express');
const router = express.Router();

/**
 * Verify admin authentication
 *
 * @param {Object} req - Express request
 * @returns {boolean} True if authenticated
 */
function verifyAdminAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader === `Bearer ${process.env.JWT_SECRET}`;
}

/**
 * Import messages endpoint
 *
 * POST /api/import/messages
 * Body: { messages: Array, roomId: string }
 */
router.post('/import/messages', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messages, roomId } = req.body;
    if (!messages || !Array.isArray(messages) || !roomId) {
      return res.status(400).json({ error: 'messages array and roomId required' });
    }

    const dbPostgres = require('../../dbPostgres');
    let imported = 0;

    for (const msg of messages) {
      const messageId = `${Date.now()}-import-${Math.random().toString(36).substr(2, 9)}`;
      await dbPostgres.query(
        `INSERT INTO messages (id, type, username, text, timestamp, room_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [messageId, 'message', msg.username, msg.text, msg.timestamp, roomId]
      );
      imported++;
    }

    res.json({ success: true, imported, total: messages.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cleanup messages endpoint
 *
 * POST /api/import/cleanup
 * Body: { roomId: string, patterns?: Array<string> }
 */
router.post('/import/cleanup', express.json(), async (req, res) => {
  try {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roomId, patterns } = req.body;
    if (!roomId) {
      return res.status(400).json({ error: 'roomId required' });
    }

    const dbPostgres = require('../../dbPostgres');
    const cleanupPatterns = patterns || [
      '__kIMMessagePartAttributeName',
      '__kIMFileTransferGUIDAttributeName',
      '__kIMDataDetectedAttributeName',
    ];

    let totalDeleted = 0;
    for (const pattern of cleanupPatterns) {
      const result = await dbPostgres.query(
        `DELETE FROM messages WHERE room_id = $1 AND text = $2`,
        [roomId, pattern]
      );
      totalDeleted += result.rowCount || 0;
    }

    const stripResult = await dbPostgres.query(
      `UPDATE messages SET text = SUBSTRING(text FROM 3) WHERE room_id = $1 AND text LIKE '+#%'`,
      [roomId]
    );

    res.json({
      success: true,
      deleted: totalDeleted,
      prefixesStripped: stripResult.rowCount || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
