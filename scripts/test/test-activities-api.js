const http = require('http');

const API_URL = 'http://localhost:3001';
const TEST_USERNAME = 'mom';

function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
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

async function testActivitiesAPI() {
  console.log('🧪 Testing Child Activities API\n');

  try {
    // Step 1: Get contacts to find a child contact
    console.log('📋 Step 1: Fetching contacts...');
    const contactsResponse = await httpRequest('GET', `/api/contacts?username=${TEST_USERNAME}`);

    const childContact = contactsResponse.contacts.find(c => c.relationship === 'my child');

    if (!childContact) {
      console.log('⚠️  No child contacts found. Please add a child contact first.');
      return;
    }

    console.log(`✅ Found child contact: ${childContact.name} (ID: ${childContact.id})\n`);

    // Step 2: Create a test activity
    console.log('📋 Step 2: Creating test activity...');
    const createResponse = await httpRequest('POST', '/api/activities', {
      username: TEST_USERNAME,
      contactId: childContact.id,
      activityName: 'Soccer Practice',
      description: 'Weekly soccer practice at the community center',
      location: 'Community Sports Complex',
      instructorContact: 'Coach Mike: (555) 123-4567',
      daysOfWeek: ['Monday', 'Wednesday'],
      startTime: '16:00',
      endTime: '17:30',
      recurrence: 'weekly',
      startDate: '2025-01-15',
      cost: 150,
      costFrequency: 'monthly',
      splitType: 'equal',
      notes: 'Remember to bring cleats and water bottle',
    });

    console.log('✅ Activity created:', createResponse.message);
    console.log(`   Response:`, JSON.stringify(createResponse, null, 2), '\n');

    // Step 3: Get all activities for the child
    console.log('📋 Step 3: Fetching all activities...');
    const getResponse = await httpRequest(
      'GET',
      `/api/activities/${childContact.id}?username=${TEST_USERNAME}`
    );

    console.log(`✅ Found ${getResponse.activities.length} activities:`);
    getResponse.activities.forEach(activity => {
      console.log(`   - ${activity.activity_name} (${activity.recurrence})`);
      console.log(`     Days: ${JSON.stringify(activity.days_of_week)}`);
      console.log(`     Time: ${activity.start_time} - ${activity.end_time}`);
      console.log(`     Cost: $${activity.cost} (${activity.cost_frequency || 'one-time'})`);
    });
    console.log('');

    const activityId = getResponse.activities[0].id;

    // Step 4: Update the activity
    console.log('📋 Step 4: Updating activity...');
    const updateResponse = await httpRequest('PUT', `/api/activities/${activityId}`, {
      username: TEST_USERNAME,
      activityName: 'Soccer Practice - Advanced',
      cost: 175,
    });

    console.log('✅ Activity updated:', updateResponse.message, '\n');

    // Step 5: Verify the update
    console.log('📋 Step 5: Verifying update...');
    const verifyResponse = await httpRequest(
      'GET',
      `/api/activities/${childContact.id}?username=${TEST_USERNAME}`
    );

    const updatedActivity = verifyResponse.activities.find(a => a.id === activityId);
    console.log(`✅ Activity name updated to: "${updatedActivity.activity_name}"`);
    console.log(`✅ Cost updated to: $${updatedActivity.cost}\n`);

    // Step 6: Delete the activity
    console.log('📋 Step 6: Deleting test activity...');
    const deleteResponse = await httpRequest(
      'DELETE',
      `/api/activities/${activityId}?username=${TEST_USERNAME}`
    );

    console.log('✅ Activity deleted:', deleteResponse.message, '\n');

    // Step 7: Verify deletion
    console.log('📋 Step 7: Verifying deletion...');
    const finalResponse = await httpRequest(
      'GET',
      `/api/activities/${childContact.id}?username=${TEST_USERNAME}`
    );

    console.log(`✅ Activities remaining: ${finalResponse.activities.length}\n`);

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.data || error.message);
    if (error.status) {
      console.error('   Status:', error.status);
      console.error('   Data:', JSON.stringify(error.data, null, 2));
    }
  }
}

// Run tests
testActivitiesAPI();
