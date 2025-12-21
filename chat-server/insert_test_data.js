const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function insertTestData() {
  try {
    // Get the user 'athenasees'
    const userRes = await pool.query("SELECT id FROM users WHERE username = 'athenasees'");
    if (userRes.rows.length === 0) {
      console.error('User not found');
      return;
    }
    const userId = userRes.rows[0].id;

    // Get the user's room
    const roomRes = await pool.query(
      'SELECT room_id FROM room_members WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    if (roomRes.rows.length === 0) {
      console.error('Room not found');
      return;
    }
    const roomId = roomRes.rows[0].room_id;

    console.log(`Inserting data for User ID: ${userId}, Room ID: ${roomId}`);

    // Insert an expense
    await pool.query(
      `
      INSERT INTO expenses (room_id, requested_by, amount, description, status, updated_at)
      VALUES ($1, $2, 50.00, 'School Supplies', 'pending', NOW())
    `,
      [roomId, userId]
    );
    console.log('Inserted expense');

    // Insert an agreement
    await pool.query(
      `
      INSERT INTO agreements (room_id, proposed_by, title, details, status, updated_at)
      VALUES ($1, $2, 'Summer Schedule', 'Agreed to swap weeks in July', 'agreed', NOW())
    `,
      [roomId, userId]
    );
    console.log('Inserted agreement');

    // Insert another expense (declined)
    await pool.query(
      `
      INSERT INTO expenses (room_id, requested_by, amount, description, status, updated_at)
      VALUES ($1, $2, 120.00, 'New Video Game', 'declined', NOW() - INTERVAL '1 hour')
    `,
      [roomId, userId]
    );
    console.log('Inserted declined expense');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

insertTestData();
