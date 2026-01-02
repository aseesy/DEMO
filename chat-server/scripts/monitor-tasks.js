/**
 * Monitor TaskManager - View active background tasks
 * 
 * Queries the running server's health endpoint to get real task data
 */

require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1'; // Use IPv4 explicitly

console.log('📊 TaskManager Monitor\n');

// Try to get tasks from running server
const getTasksFromServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve(health.tasks || { active: 0, details: [] });
        } catch (err) {
          reject(new Error('Invalid health check response'));
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        reject(new Error('Server not running'));
      } else {
        reject(err);
      }
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
};

// Main
(async () => {
  try {
    const tasks = await getTasksFromServer();
    
    console.log('Active Tasks:', tasks.active || 0);

    if (!tasks.active || tasks.active === 0) {
      console.log('\n   No active tasks');
      console.log('\n💡 Tasks are created when:');
      console.log('   - Server starts (schema validation, migrations, Neo4j init)');
      console.log('   - Database is connected');
      console.log('\n   Tasks may have already completed (they run once)');
    } else {
      console.log('\nTask Details:');
      (tasks.details || []).forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.name} (${task.type})`);
        console.log(`      Created: ${task.createdAt}`);
      });
    }
  } catch (err) {
    if (err.message === 'Server not running') {
      console.log('❌ Server is not running');
      console.log('\n   Start the server first: npm run dev');
      console.log('   Then run this script again');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
})();

