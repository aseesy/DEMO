/**
 * Auth-related Task Management
 */
const dbSafe = require('../dbSafe');

async function createWelcomeAndOnboardingTasks(userId, username) {
  const now = new Date().toISOString();

  // Welcome task
  try {
    const welcomeTaskDescription = `LiaiZen is contextual and adapts to your unique situation over time as it learns from your interactions.
We hope you enjoy the platform, but feedback is golden. Let us know what you like and don't like.`;

    await dbSafe.safeInsert('tasks', {
      user_id: userId,
      title: 'Welcome to LiaiZen',
      description: welcomeTaskDescription,
      status: 'open',
      created_at: now,
      updated_at: now,
    });
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
          category: 'onboarding',
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
