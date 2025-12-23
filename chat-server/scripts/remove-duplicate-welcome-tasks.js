/**
 * Script to remove duplicate "Welcome to LiaiZen" tasks
 * Keeps only the most recent one (or completed if one exists) per user
 */

const dbSafe = require('../dbSafe');

async function removeDuplicateWelcomeTasks() {
  try {
    console.log('🔄 Starting duplicate welcome task cleanup...');

    // Get all users
    const usersResult = await dbSafe.safeSelect('users', {}, {});
    const users = dbSafe.parseResult(usersResult);

    console.log(`Found ${users.length} users`);

    let totalRemoved = 0;
    let usersAffected = 0;

    for (const user of users) {
      // Get all welcome tasks for this user
      const tasksResult = await dbSafe.safeSelect(
        'tasks',
        { user_id: user.id, title: 'Welcome to LiaiZen' },
        {}
      );
      const allTasks = dbSafe.parseResult(tasksResult);
      
      // Sort: completed first, then by created_at DESC
      const tasks = allTasks.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        const aDate = new Date(a.created_at || 0);
        const bDate = new Date(b.created_at || 0);
        return bDate - aDate; // Most recent first
      });

      if (tasks.length <= 1) {
        continue; // No duplicates
      }

      console.log(`\nUser ${user.username} (ID: ${user.id}) has ${tasks.length} welcome tasks`);

      // Keep the first one (most recent, or completed if exists)
      const keepTask = tasks[0];
      const tasksToDelete = tasks.slice(1);

      console.log(`  Keeping task ID ${keepTask.id} (status: ${keepTask.status}, created: ${keepTask.created_at})`);

      // Delete the duplicates
      for (const task of tasksToDelete) {
        await dbSafe.safeDelete('tasks', { id: task.id });
        console.log(`  Deleted duplicate task ID ${task.id} (status: ${task.status}, created: ${task.created_at})`);
        totalRemoved++;
      }

      usersAffected++;
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Users affected: ${usersAffected}`);
    console.log(`   Duplicate tasks removed: ${totalRemoved}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
removeDuplicateWelcomeTasks()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

