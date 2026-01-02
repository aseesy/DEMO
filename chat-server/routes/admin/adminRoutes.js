/**
 * Admin Routes
 *
 * Single Responsibility: Handle admin operations.
 *
 * Handles:
 * - Admin page serving
 * - Display name updates
 * - Admin authentication (Bearer token)
 */

const express = require('express');
const path = require('path');
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
 * Admin page endpoint
 *
 * GET /admin
 */
router.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../../admin.html');
  res.sendFile(adminPath, err => {
    if (err) res.status(500).send('Error loading admin page');
  });
});

/**
 * Update display names endpoint
 *
 * POST /api/admin/update-display-names
 * Body: { updates: Array<{ username, displayName?, firstName?, preferredName? }> }
 */
router.post('/admin/update-display-names', express.json(), async (req, res) => {
  try {
    if (!verifyAdminAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { updates } = req.body;
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates array required' });
    }

    const dbPostgres = require('../../dbPostgres');
    let updated = 0;

    for (const { username, displayName, firstName, preferredName } of updates) {
      if (!username) continue;

      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (displayName !== undefined) {
        fields.push(`display_name = $${paramIndex++}`);
        values.push(displayName);
      }
      if (firstName !== undefined) {
        fields.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
      }
      if (preferredName !== undefined) {
        fields.push(`preferred_name = $${paramIndex++}`);
        values.push(preferredName);
      }

      if (fields.length === 0) continue;

      values.push(username);
      const query = `UPDATE users SET ${fields.join(', ')} WHERE LOWER(username) = LOWER($${paramIndex})`;
      const result = await dbPostgres.query(query, values);
      if (result.rowCount > 0) updated++;
    }

    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
