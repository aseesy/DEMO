const http = require('http');

function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:3001');
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const responseData = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseData);
          } else {
            reject({ status: res.statusCode, data: responseData });
          }
        } catch (e) {
          reject({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function createTestChild() {
  console.log('📝 Creating test child contact...\n');

  try {
    const response = await httpRequest('POST', '/api/contacts', {
      username: 'mom',
      contact_name: 'Emma',
      relationship: 'my child',
      child_age: '8',
      child_birthdate: '2016-03-15',
      school: 'Lincoln Elementary',
      notes: 'Loves soccer and art class'
    });

    console.log('✅ Child contact created successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('❌ Failed to create child contact:', error.data || error.message);
  }
}

createTestChild();
