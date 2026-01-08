/**
 * Onboarding Service
 *
 * Actor: Product/UX (onboarding task management)
 * Responsibility: Onboarding task auto-completion, backfill, and co-parent detection
 *
 * Extracted from routeManager.js to follow the services pattern.
 */

const { BaseService } = require('../BaseService');

const { defaultLogger: defaultLogger } = require('../../infrastructure/logging/logger');

const logger = defaultLogger.child({
  module: 'onboardingService',
});

class OnboardingService extends BaseService {
  constructor() {
    super(null, null);
    this.dbSafe = null;
  }

  /**
   * Set database access (injected from server initialization)
   * @param {Object} dbSafe - Database safe access module
   */
  setDbSafe(dbSafe) {
    this.dbSafe = dbSafe;
  }

  /**
   * Check if user has a connected co-parent
   * @param {number} userId - User ID to check
   * @returns {Promise<boolean>} True if user has a co-parent connection
   */
  async checkUserHasCoParent(userId) {
    if (!this.dbSafe) {
      logger.error('OnboardingService: dbSafe not initialized');
      return false;
    }

    try {
      // Check pairing_sessions for completed pairings
      const pairings = await this.dbSafe.safeSelect('pairing_sessions', { status: 'completed' });
      for (const pairing of pairings) {
        if (pairing.initiator_id === userId || pairing.invitee_id === userId) {
          return true;
        }
      }

      // Check room_members for 2-person rooms (co-parent rooms)
      const roomMembers = await this.dbSafe.safeSelect('room_members', { user_id: userId });
      for (const member of roomMembers) {
        const otherMembers = await this.dbSafe.safeSelect('room_members', {
          room_id: member.room_id,
        });
        if (otherMembers.length === 2) {
          return true;
        }
      }

      // Check contacts for co-parent relationship
      const contacts = await this.dbSafe.safeSelect('contacts', { user_id: userId });
      const hasCoparentContact = contacts.some(
        c =>
          c.relationship === 'My Co-Parent' ||
          c.relationship === 'co-parent' ||
          c.relationship === "My Partner's Co-Parent"
      );

      return hasCoparentContact;
    } catch (error) {
      logger.error('Error checking co-parent status', {
        error: error,
      });
      return false;
    }
  }

  /**
   * Auto-complete onboarding tasks when conditions are met
   * @param {number} userId - User ID to check tasks for
   */
  async autoCompleteOnboardingTasks(userId) {
    if (!this.dbSafe) {
      logger.error('OnboardingService: dbSafe not initialized');
      return;
    }

    try {
      const users = await this.dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      if (users.length === 0) return;

      const user = users[0];
      const now = new Date().toISOString();

      // Check profile completion (at least 2 fields filled)
      const filledFields = [
        user.first_name,
        user.last_name,
        user.address,
        user.communication_style,
        user.communication_triggers,
        user.communication_goals,
        user.email,
      ].filter(field => field && field.trim().length > 0).length;

      const profileComplete = filledFields >= 2;

      // Check for co-parent and children contacts
      const coparentResult = await this.dbSafe.safeSelect('contacts', { user_id: userId });
      const allContacts = this.dbSafe.parseResult(coparentResult);

      const hasCoparent = allContacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my co-parent' || rel === 'co-parent' || rel === "my partner's co-parent";
      });

      const hasChildren = allContacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my child' || rel === "my partner's child" || rel === "my co-parent's child";
      });

      // Get open onboarding tasks and auto-complete if conditions met
      const tasks = await this.dbSafe.safeSelect('tasks', { user_id: userId, status: 'open' });

      for (const task of tasks) {
        let shouldComplete = false;

        if (task.title === 'Complete Your Profile' && profileComplete) {
          shouldComplete = true;
        }
        if (
          (task.title === 'Add Your Co-parent' || task.title === 'Invite Your Co-Parent') &&
          hasCoparent
        ) {
          shouldComplete = true;
        }
        if (task.title === 'Add Your Children' && hasChildren) {
          shouldComplete = true;
        }

        if (shouldComplete) {
          await this.dbSafe.safeUpdate(
            'tasks',
            { status: 'completed', completed_at: now, updated_at: now },
            { id: task.id }
          );
          logger.debug('Log message', {
            value: `[OnboardingService] Auto-completed task "${task.title}" for user ${userId}`,
          });
        }
      }
    } catch (error) {
      logger.error('Error in autoCompleteOnboardingTasks', {
        error: error,
      });
    }
  }

  /**
   * Backfill onboarding tasks for users who don't have them
   * @param {number} userId - User ID to backfill tasks for
   */
  async backfillOnboardingTasks(userId) {
    if (!this.dbSafe) {
      logger.error('OnboardingService: dbSafe not initialized');
      return;
    }

    const now = new Date().toISOString();

    try {
      const users = await this.dbSafe.safeSelect('users', { id: userId }, { limit: 1 });
      if (users.length === 0) return;

      // Check current co-parent and children status
      const hasCoParent = await this.checkUserHasCoParent(userId);
      const contacts = await this.dbSafe.safeSelect('contacts', { user_id: userId });
      const hasChildren = contacts.some(c => {
        const rel = (c.relationship || '').toLowerCase();
        return rel === 'my child' || rel === "my partner's child" || rel === "my co-parent's child";
      });

      // Get existing tasks to avoid duplicates
      const existingTasks = await this.dbSafe.safeSelect('tasks', { user_id: userId });
      const existingTitles = existingTasks.map(t => t.title);

      // Define onboarding tasks
      const onboardingTasks = [
        {
          title: 'Complete Your Profile',
          description: 'Fill out your communication preferences and goals.',
          status: 'open',
        },
        {
          title: 'Invite Your Co-Parent',
          description: 'Connect with your co-parent to start mediating messages.',
          status: hasCoParent ? 'completed' : 'open',
        },
        {
          title: 'Add Your Children',
          description: 'Add your children to the contacts list for context.',
          status: hasChildren ? 'completed' : 'open',
        },
      ];

      // Create missing onboarding tasks
      for (const taskData of onboardingTasks) {
        if (!existingTitles.includes(taskData.title)) {
          await this.dbSafe.safeInsert('tasks', {
            user_id: userId,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: 'medium',
            category: 'onboarding',
            created_at: now,
            updated_at: now,
            completed_at: taskData.status === 'completed' ? now : null,
          });
        }
      }
    } catch (error) {
      logger.error('Error in backfillOnboardingTasks', {
        error: error,
      });
    }
  }
}

// Export singleton instance
const onboardingService = new OnboardingService();

module.exports = { onboardingService, OnboardingService };
