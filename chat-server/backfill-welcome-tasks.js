const { getDb, saveDatabase } = require('./db');
const dbSafe = require('./dbSafe');

async function backfillWelcomeTasks() {
  try {
    console.log('🔄 Starting welcome task backfill...');
    
    const db = await getDb();
    
    // Get all users
    const usersResult = await dbSafe.safeSelect('users', {}, {});
    const users = dbSafe.parseResult(usersResult);
    
    console.log(`Found ${users.length} users`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      // Check if user already has a welcome task
      const tasksResult = await dbSafe.safeSelect('tasks', {
        user_id: user.id,
        title: 'Welcome to LiaiZen'
      }, { limit: 1 });
      
      const existingTasks = dbSafe.parseResult(tasksResult);
      
      if (existingTasks.length > 0) {
        console.log(`✓ User ${user.username} already has welcome task`);
        skippedCount++;
        continue;
      }
      
      // Create welcome task
      const welcomeTaskDescription = `LiaiZen is contextual and adapts to your unique situation over time as it learns from your interactions.

We hope you enjoy the platform, but feedback is golden. Let us know what you like and don't like. Stay tuned for new features like calendar, expense sharing, and document sharing.`;

      const now = new Date().toISOString();
      
      await dbSafe.safeInsert('tasks', {
        user_id: user.id,
        title: 'Welcome to LiaiZen',
        description: welcomeTaskDescription,
        status: 'open',
        priority: 'medium',
        due_date: null,
        created_at: now,
        updated_at: now,
        completed_at: null
      });
      
      console.log(`✅ Created welcome task for user: ${user.username}`);
      createdCount++;
    }
    
    // Save database
    saveDatabase();
    
    console.log(`\n✅ Backfill complete!`);
    console.log(`   Created: ${createdCount} welcome tasks`);
    console.log(`   Skipped: ${skippedCount} users (already had welcome task)`);
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillWelcomeTasks().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

