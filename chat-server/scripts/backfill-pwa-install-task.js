/**
 * Backfill script to add "Install LiaiZen on Your Phone" task
 * to existing users who don't have it yet.
 *
 * Run: DATABASE_URL="..." node scripts/backfill-pwa-install-task.js
 */

const dbSafe = require('../dbSafe');

const PWA_TASK = {
  title: 'Install LiaiZen on Your Phone',
  description:
    'Access LiaiZen anytime from your home screen. On iOS: tap Share > Add to Home Screen. On Android: tap the menu > Install app.',
};

async function backfillPWAInstallTask() {
  try {
    console.log('🔄 Starting PWA install task backfill...');

    // Get all users
    const usersResult = await dbSafe.safeSelect('users', {}, {});
    const users = dbSafe.parseResult(usersResult);

    console.log(`Found ${users.length} users`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if user already has this task
      const tasksResult = await dbSafe.safeSelect(
        'tasks',
        {
          user_id: user.id,
          title: PWA_TASK.title,
        },
        { limit: 1 }
      );

      const existingTasks = dbSafe.parseResult(tasksResult);

      // Use email as primary identifier (username is legacy, may be null)
      const userIdentifier = user.email || user.username || `user_${user.id}`;

      if (existingTasks.length > 0) {
        console.log(`✓ User ${userIdentifier} already has PWA install task`);
        skippedCount++;
        continue;
      }

      // Create the task
      const now = new Date().toISOString();

      await dbSafe.safeInsert('tasks', {
        user_id: user.id,
        title: PWA_TASK.title,
        description: PWA_TASK.description,
        status: 'open',
        type: 'onboarding',
        priority: 'low',
        due_date: null,
        created_at: now,
        updated_at: now,
        completed_at: null,
      });

      console.log(`✅ Created PWA install task for user: ${userIdentifier}`);
      createdCount++;
    }

    console.log(`\n✅ Backfill complete!`);
    console.log(`   Created: ${createdCount} PWA install tasks`);
    console.log(`   Skipped: ${skippedCount} users (already had task)`);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillPWAInstallTask()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
