/**
 * Waitlist Routes
 *
 * Handles pre-launch waitlist email collection.
 * Simple email-only signup for building interest before launch.
 */

const express = require('express');
const router = express.Router();
const db = require('../dbPostgres');

/**
 * POST /api/waitlist
 * Add email to waitlist
 *
 * Body: { email: string, source?: string }
 * Response: { success: true, position: number } or { error: string }
 */
router.post('/', async (req, res) => {
  try {
    const { email, source = 'landing_page' } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await db.query('SELECT id, created_at FROM waitlist WHERE email = $1', [
      cleanEmail,
    ]);

    if (existing.rows.length > 0) {
      // Already on waitlist - get their position
      const position = await db.query(
        'SELECT COUNT(*) as pos FROM waitlist WHERE created_at <= $1',
        [existing.rows[0].created_at]
      );

      return res.status(200).json({
        success: true,
        alreadyOnList: true,
        position: parseInt(position.rows[0].pos, 10),
        message: "You're already on the waitlist!",
      });
    }

    // Insert new waitlist entry
    const result = await db.query(
      `INSERT INTO waitlist (email, source, created_at)
       VALUES ($1, $2, NOW())
       RETURNING id, created_at`,
      [cleanEmail, source]
    );

    // Get position (total count)
    const countResult = await db.query('SELECT COUNT(*) as total FROM waitlist');
    const position = parseInt(countResult.rows[0].total, 10);

    console.log(`✅ Waitlist signup: ${cleanEmail} (position #${position})`);

    res.status(201).json({
      success: true,
      position: position,
      message: "You're on the list!",
    });
  } catch (error) {
    console.error('Waitlist signup error:', error);

    // Handle unique constraint violation (duplicate email)
    if (error.code === '23505') {
      return res.status(200).json({
        success: true,
        alreadyOnList: true,
        message: "You're already on the waitlist!",
      });
    }

    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

/**
 * GET /api/waitlist/count
 * Get total waitlist count (for social proof)
 */
router.get('/count', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) as total FROM waitlist');
    const count = parseInt(result.rows[0].total, 10);

    res.json({ count });
  } catch (error) {
    console.error('Waitlist count error:', error);
    res.status(500).json({ error: 'Unable to fetch count' });
  }
});

/**
 * GET /api/waitlist/position/:email
 * Check waitlist position for an email
 */
router.get('/position/:email', async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();

    const entry = await db.query('SELECT created_at FROM waitlist WHERE email = $1', [email]);

    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found on waitlist' });
    }

    const position = await db.query('SELECT COUNT(*) as pos FROM waitlist WHERE created_at <= $1', [
      entry.rows[0].created_at,
    ]);

    res.json({
      position: parseInt(position.rows[0].pos, 10),
      email: email,
    });
  } catch (error) {
    console.error('Waitlist position error:', error);
    res.status(500).json({ error: 'Unable to check position' });
  }
});

module.exports = router;
