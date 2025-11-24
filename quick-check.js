// Quick deployment configuration check
const https = require('https');
const http = require('http');

const RAILWAY_URL = 'https://demo-production-6dcd.up.railway.app';
const VERCEL_URL = 'https://www.coparentliaizen.com';

console.log('🔍 Deployment Configuration Check\n');
console.log('=====================================\n');

// Check backend health
console.log('🏥 Testing Railway Backend...');
const railwayReq = https.get(`${RAILWAY_URL}/health`, { timeout: 5000 }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`✅ Backend responding: ${data.substring(0, 100)}`);
    console.log(`   Status: ${res.statusCode}\n`);
    
    // Check frontend
    console.log('🌐 Testing Vercel Frontend...');
    const vercelReq = https.get(VERCEL_URL, { timeout: 5000 }, (vercelRes) => {
      console.log(`✅ Frontend accessible: Status ${vercelRes.statusCode}\n`);
      
      // Check local env
      console.log('📁 Local Environment Files:');
      const fs = require('fs');
      const path = require('path');
      
      const envPath = path.join(__dirname, 'chat-client-vite', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('VITE_API_URL')) {
          const match = envContent.match(/VITE_API_URL=(.+)/);
          if (match) {
            console.log(`   VITE_API_URL=${match[1]}`);
            if (match[1].includes('localhost')) {
              console.log('   ✅ Correct for local development\n');
            } else {
              console.log('   ⚠️  Using production URL in local .env\n');
            }
          }
        }
      } else {
        console.log('   ⚠️  .env file not found\n');
      }
      
      console.log('💡 Next Steps:');
      console.log('1. Check Railway variables: railway variables');
      console.log('2. Check Vercel env vars: cd chat-client-vite && vercel env ls');
      console.log('3. Check Railway logs: railway logs');
      console.log('\n✅ Basic connectivity checks passed!');
    });
    
    vercelReq.on('error', (err) => {
      console.log(`❌ Frontend not accessible: ${err.message}\n`);
    });
    
    vercelReq.on('timeout', () => {
      vercelReq.destroy();
      console.log('❌ Frontend request timed out\n');
    });
  });
});

railwayReq.on('error', (err) => {
  console.log(`❌ Backend not responding: ${err.message}\n`);
  console.log('💡 Check Railway logs: railway logs');
});

railwayReq.on('timeout', () => {
  railwayReq.destroy();
  console.log('❌ Backend request timed out\n');
  console.log('💡 This might indicate:');
  console.log('   - Server is down');
  console.log('   - PostgreSQL connection issues');
  console.log('   - Health check timeout too short');
});



