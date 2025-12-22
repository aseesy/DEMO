/**
 * Statistics Service
 *
 * Actor: Operations
 * Responsibility: Calculate and return system statistics
 *
 * This service is a proof-of-concept for the service layer pattern.
 * It demonstrates how to extend BaseService and use its methods.
 */

const { BaseService } = require('../BaseService');
const { PostgresGenericRepository } = require('../../repositories');

class StatisticsService extends BaseService {
  constructor() {
    // No primary table - this service queries multiple tables
    // Use a generic repository with 'users' as the base table for query access
    super('users');
    // Set repository explicitly to enable query methods
    this.setRepository(new PostgresGenericRepository('users'));
  }

  /**
   * Get total user count
   */
  async getUserCount() {
    const result = await this.queryOne('SELECT COUNT(*) as count FROM users');
    return parseInt(result.count, 10);
  }

  /**
   * Get user count by status
   */
  async getUserCountByStatus() {
    const rows = await this.query(`
      SELECT
        COUNT(*) FILTER (WHERE email_verified = true) as verified,
        COUNT(*) FILTER (WHERE email_verified = false OR email_verified IS NULL) as unverified,
        COUNT(*) as total
      FROM users
    `);
    return rows[0];
  }

  /**
   * Get room statistics
   */
  async getRoomStats() {
    const rows = await this.query(`
      SELECT
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(DISTINCT rm.user_id) as users_in_rooms,
        ROUND(AVG(member_count), 2) as avg_members_per_room
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      LEFT JOIN (
        SELECT room_id, COUNT(*) as member_count
        FROM room_members
        GROUP BY room_id
      ) mc ON r.id = mc.room_id
    `);
    return rows[0];
  }

  /**
   * Get message statistics
   */
  async getMessageStats() {
    const rows = await this.query(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
        COUNT(DISTINCT sender_id) as unique_senders
      FROM messages
    `);
    return rows[0];
  }

  /**
   * Get AI intervention statistics
   */
  async getInterventionStats() {
    const rows = await this.query(`
      SELECT
        COUNT(*) as total_interventions,
        COUNT(*) FILTER (WHERE action_taken = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE action_taken = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE action_taken = 'edited') as edited,
        COUNT(*) FILTER (WHERE action_taken IS NULL) as pending
      FROM intervention_learning
    `);
    return rows[0];
  }

  /**
   * Get all statistics in one call
   */
  async getAll() {
    const [users, rooms, messages, interventions] = await Promise.all([
      this.getUserCountByStatus(),
      this.getRoomStats(),
      this.getMessageStats(),
      this.getInterventionStats().catch(() => null), // Table may not exist
    ]);

    return {
      users,
      rooms,
      messages,
      interventions,
      generatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton instance
const statisticsService = new StatisticsService();

module.exports = { statisticsService, StatisticsService };
