#!/usr/bin/env node
/**
 * AI Mediation Regression Tests
 * 
 * Runs sample conversations through the mediation system to ensure:
 * - Toxic message rewrites work correctly
 * - Safety rules are enforced
 * - Mediation quality is maintained
 * 
 * Usage: npm run ai:test
 */

const { mediator } = require('../src/liaizen');

// Test cases: message -> expected behavior
const TEST_CASES = [
  {
    name: 'Toxic message - should trigger intervention',
    message: 'you suck',
    sender: 'user1',
    receiver: 'user2',
    roomId: 'test-room-1',
    expected: {
      shouldIntervene: true,
      hasRewrites: true,
      hasTip: true,
    }
  },
  {
    name: 'Neutral message - should pass through',
    message: 'Can we schedule pickup for Friday?',
    sender: 'user1',
    receiver: 'user2',
    roomId: 'test-room-2',
    expected: {
      shouldIntervene: false,
    }
  },
  {
    name: 'Blaming language - should trigger intervention',
    message: 'You never pick up the kids on time',
    sender: 'user1',
    receiver: 'user2',
    roomId: 'test-room-3',
    expected: {
      shouldIntervene: true,
      hasRewrites: true,
    }
  },
  {
    name: 'Child-focused message - should be preserved',
    message: 'The kids need new shoes for school',
    sender: 'user1',
    receiver: 'user2',
    roomId: 'test-room-4',
    expected: {
      shouldIntervene: false,
    }
  },
];

async function runAITests() {
  console.log('🤖 Running AI mediation regression tests...\n');

  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set - skipping AI tests');
    console.log('💡 Set OPENAI_API_KEY to run full test suite\n');
    process.exit(0);
  }

  const results = {
    passed: 0,
    failed: 0,
    errors: 0,
  };

  for (const testCase of TEST_CASES) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);

    try {
      // Create message object in the format expected by analyzeMessage
      const message = {
        text: testCase.message,
        username: testCase.sender,
        room_id: testCase.roomId,
        timestamp: Date.now()
      };

      const intervention = await mediator.analyzeMessage(
        message,
        [], // recentMessages
        [testCase.sender, testCase.receiver], // participantUsernames
        [], // existingContacts
        null, // contactContextForAI
        testCase.roomId, // roomId
        null, // taskContextForAI
        null, // flaggedMessagesContext
        { senderId: testCase.sender, receiverId: testCase.receiver } // roleContext
      );

      // Validate results
      const issues = [];

      if (testCase.expected.shouldIntervene) {
        if (!intervention || intervention.action !== 'INTERVENE') {
          issues.push('Expected intervention but got none');
        }
      } else {
        if (intervention && intervention.action === 'INTERVENE') {
          issues.push('Unexpected intervention for neutral message');
        }
      }

      if (testCase.expected.hasRewrites) {
        if (!intervention?.rewrite1 || !intervention?.rewrite2) {
          issues.push('Missing required rewrites');
        }
      }

      if (testCase.expected.hasTip) {
        if (!intervention?.tip1) {
          issues.push('Missing required tip');
        }
      }

      // Check for sender perspective in rewrites
      if (intervention?.rewrite1) {
        const receiverPatterns = [
          /i understand you're/i,
          /that hurt me/i,
          /when you said that/i,
          /i don't appreciate/i,
        ];
        
        receiverPatterns.forEach(pattern => {
          if (pattern.test(intervention.rewrite1)) {
            issues.push('Rewrite uses receiver perspective (should be sender perspective)');
          }
        });
      }

      if (issues.length > 0) {
        console.log(`   ❌ FAILED`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        results.failed++;
      } else {
        console.log(`   ✅ PASSED`);
        results.passed++;
      }

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.errors++;
    }

    console.log('');
  }

  // Summary
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Errors: ${results.errors}`);
  console.log('');

  if (results.failed > 0 || results.errors > 0) {
    console.log('❌ Some tests failed. Review AI mediation quality.');
    process.exit(1);
  } else {
    console.log('✅ All AI tests passed!');
    process.exit(0);
  }
}

// Run tests
runAITests();

