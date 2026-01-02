/**
 * Monitor EventBus - View recent events and subscribers
 * 
 * Queries the running server's health endpoint to get real event data
 */

require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1'; // Use IPv4 explicitly

console.log('📡 EventBus Monitor\n');

// Try to get events from running server
const getEventsFromServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve(health.events || { recent: 0, subscribers: 0, recentEvents: [] });
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
    const events = await getEventsFromServer();
    
    console.log('Recent Events:', events.recent || 0);
    console.log('Subscribers:', events.subscribers || 0);

    if (!events.recent || events.recent === 0) {
      console.log('\n   No events yet');
      console.log('\n💡 Events are emitted when services use EventBus:');
      console.log('   - Currently, EventBus is available but not actively used');
      console.log('   - Services can emit events: eventBus.emit("eventName", data)');
      console.log('   - Other services can subscribe: eventBus.subscribe("eventName", handler)');
      console.log('\n   To see events:');
      console.log('   1. Services need to emit events via EventBus');
      console.log('   2. Trigger actions that emit events');
    } else {
      console.log('\nRecent Event Details:');
      (events.recentEvents || []).forEach((event, index) => {
        console.log(`   ${index + 1}. [${event.timestamp}] ${event.event}`);
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

