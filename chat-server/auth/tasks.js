/**
 * Auth-related Task Management
 */
const dbSafe = require('../dbSafe');

async function createWelcomeAndOnboardingTasks(userId, userEmail) {
  const now = new Date().toISOString();

  // Welcome task - check for existing task first to prevent duplicates
  try {
    const existing = await dbSafe.safeSelect(
      'tasks',
      { user_id: userId, title: 'Welcome to LiaiZen' },
      { limit: 1 }
    );
    if (existing.length === 0) {
      const welcomeTaskDescription = `To get the best experience from this app, you can download the app to your phone. If you run into any issues, please submit them by going to settings.`;

      await dbSafe.safeInsert('tasks', {
        user_id: userId,
        title: 'Welcome to LiaiZen',
        description: welcomeTaskDescription,
        status: 'open',
        created_at: now,
        updated_at: now,
      });
    }
  } catch (err) {
    console.error('Error creating welcome task:', err);
  }

  // Onboarding tasks
  const tasks = [
    {
      title: 'Complete Your Profile',
      description: 'Help LiaiZen understand the dynamics of your co-parenting situation.',
    },
    {
      title: 'Add Your Co-parent',
      description: 'Add your co-parent as a contact to enable communication features.',
    },
    {
      title: 'Add Your Children',
      description: 'Add your children as contacts so LiaiZen can help coordinate.',
    },
  ];

  for (const task of tasks) {
    try {
      const existing = await dbSafe.safeSelect(
        'tasks',
        { user_id: userId, title: task.title },
        { limit: 1 }
      );
      if (existing.length === 0) {
        await dbSafe.safeInsert('tasks', {
          user_id: userId,
          title: task.title,
          description: task.description,
          status: 'open',
          type: 'onboarding',
          created_at: now,
          updated_at: now,
        });
      }
    } catch (err) {
      console.error(`Error creating onboarding task ${task.title}:`, err);
    }
  }
}

module.exports = { createWelcomeAndOnboardingTasks };
