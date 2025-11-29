#!/usr/bin/env node
/**
 * Test script to verify mediator functionality
 * 
 * Tests the Observer/Mediator framework with various message types
 */

require('dotenv').config();
const aiMediator = require('../aiMediator');

async function testMediator() {
  console.log('🧪 Testing LiaiZen Mediator Functionality\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test cases
  const testCases = [
    {
      name: 'Clean Message (Should PASS)',
      message: { text: 'Can you pick up the kids at 3pm?', username: 'testuser', timestamp: new Date().toISOString() },
      expected: 'STAY_SILENT',
    },
    {
      name: 'Positive Message (Should PASS)',
      message: { text: 'I really appreciate how you handled that situation.', username: 'testuser', timestamp: new Date().toISOString() },
      expected: 'STAY_SILENT',
    },
    {
      name: 'Direct Insult (Should INTERVENE)',
      message: { text: 'You\'re such an idiot', username: 'testuser', timestamp: new Date().toISOString() },
      expected: 'INTERVENE',
    },
    {
      name: 'Indirect Accusation (Should INTERVENE)',
      message: { text: 'I just think it\'s confusing for her to be around your new friend so soon.', username: 'testuser', timestamp: new Date().toISOString() },
      expected: 'INTERVENE',
    },
    {
      name: 'Blame Attack (Should INTERVENE)',
      message: { text: 'It\'s YOUR fault she\'s failing in school', username: 'testuser', timestamp: new Date().toISOString() },
      expected: 'INTERVENE',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Message: "${testCase.message.text}"`);
    console.log(`   Expected: ${testCase.expected}`);

    try {
      const result = await aiMediator.analyzeMessage(
        testCase.message,
        [], // recentMessages
        ['testuser', 'coparent'], // participantUsernames
        [], // existingContacts
        null, // contactContextForAI
        null, // roomId
        null, // taskContextForAI
        null, // flaggedMessagesContext
        null  // roleContext
      );

      const actual = result ? result.action : 'STAY_SILENT';
      const match = actual === testCase.expected;

      if (match) {
        console.log(`   ✅ PASS - Got ${actual}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Got ${actual}, expected ${testCase.expected}`);
        failed++;
      }

      if (result && result.type === 'ai_intervention') {
        console.log(`   📊 Intervention Details:`);
        console.log(`      - Risk Level: ${result.escalation?.riskLevel || 'unknown'}`);
        console.log(`      - Personal Message: ${result.personalMessage?.substring(0, 60) || 'N/A'}...`);
        console.log(`      - Tip: ${result.tip1 || 'N/A'}`);
        console.log(`      - Rewrite 1: ${result.rewrite1?.substring(0, 50) || 'N/A'}...`);
        console.log(`      - Rewrite 2: ${result.rewrite2?.substring(0, 50) || 'N/A'}...`);
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      console.error(error);
      failed++;
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All tests passed! Mediator is working correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the mediator implementation.\n');
    process.exit(1);
  }
}

// Check if OpenAI is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not set!');
  console.error('Set it with: export OPENAI_API_KEY=your_key_here');
  process.exit(1);
}

testMediator().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

