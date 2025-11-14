#!/usr/bin/env node

const http = require('http');

const users = ['mom', 'dad'];

async function backfillContacts(username) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/room/backfill-contacts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔄 Backfilling contacts for shared rooms...\n');
  
  for (const username of users) {
    try {
      console.log(`Processing ${username}...`);
      const result = await backfillContacts(username);
      console.log(`✅ ${username}:`, result);
      console.log('');
    } catch (error) {
      console.error(`❌ Error for ${username}:`, error.message);
      console.log('');
    }
  }
  
  console.log('✨ Done! Check the server logs for contact creation details.');
}

main();

