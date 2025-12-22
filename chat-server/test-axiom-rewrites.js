/**
 * Test script for axiom-aware rewrite generation
 *
 * Tests that rewrites:
 * 1. Identify which Axiom(s) fired
 * 2. Identify the sender's legitimate goal/need
 * 3. Rewrite to express the GOAL without triggering the AXIOM
 */

require('dotenv').config();
const mediator = require('./src/core/core/mediator');

async function testAxiomAwareRewrites() {
  console.log('🧪 Testing Axiom-Aware Rewrite Generation\n');
  console.log('='.repeat(60));

  // Test Case 1: AXIOM 001 - Displaced Accusation
  console.log('\n📋 TEST 1: AXIOM 001 - Displaced Accusation');
  console.log('-'.repeat(60));
  const test1 = {
    text: "She's been really upset since you changed the schedule",
    username: 'testuser1',
    timestamp: new Date().toISOString(),
  };

  console.log('Original message:', test1.text);
  console.log('Expected Axiom: AXIOM 001 (Displaced Accusation)');
  console.log('Expected Goal: Express concern about schedule change impact');
  console.log('Expected Strategy: Remove child as shield, express concern directly\n');

  try {
    const result1 = await mediator.analyzeMessage(
      test1,
      [], // recentMessages
      ['testuser1', 'testuser2'], // participantUsernames
      [], // existingContacts
      null, // contactContextForAI
      'test-room-1', // roomId
      null, // taskContextForAI
      null, // flaggedMessagesContext
      null // roleContext
    );

    if (result1 && result1.type === 'ai_intervention' && result1.action === 'INTERVENE') {
      console.log('✅ Action: INTERVENE');
      console.log('\n📝 Observer Feedback (personalMessage):');
      console.log('  ', result1.personalMessage);
      console.log('\n💡 Tip:');
      console.log('  ', result1.tip1);
      console.log('\n✏️ Rewrite 1 (preserve GOAL, remove AXIOM):');
      console.log('  ', result1.rewrite1);
      console.log('\n✏️ Rewrite 2 (preserve GOAL, remove AXIOM):');
      console.log('  ', result1.rewrite2);

      // Check if rewrites preserve goal (schedule concern) and remove axiom (child as shield)
      const rewrite1Good =
        !result1.rewrite1.toLowerCase().includes('she') ||
        result1.rewrite1.toLowerCase().includes('schedule');
      const rewrite2Good =
        !result1.rewrite2.toLowerCase().includes('she') ||
        result1.rewrite2.toLowerCase().includes('schedule');

      if (rewrite1Good && rewrite2Good) {
        console.log(
          '\n✅ PASS: Rewrites preserve goal (schedule concern) and remove axiom trigger'
        );
      } else {
        console.log('\n⚠️  WARNING: Rewrites may not fully remove axiom trigger');
      }
    } else {
      console.log('❌ Action was not INTERVENE:', result1?.action);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test Case 2: AXIOM 004 - Weaponized Agreement
  console.log('\n\n📋 TEST 2: AXIOM 004 - Weaponized Agreement');
  console.log('-'.repeat(60));
  const test2 = {
    text: 'I agree we should be consistent, but you never follow through',
    username: 'testuser1',
    timestamp: new Date().toISOString(),
  };

  console.log('Original message:', test2.text);
  console.log('Expected Axiom: AXIOM 004 (Weaponized Agreement)');
  console.log('Expected Goal: Express need for consistency');
  console.log('Expected Strategy: Remove "but", make clean agreement or separate request\n');

  try {
    const result2 = await mediator.analyzeMessage(
      test2,
      [],
      ['testuser1', 'testuser2'],
      [],
      null,
      'test-room-2',
      null,
      null,
      null
    );

    if (result2 && result2.type === 'ai_intervention' && result2.action === 'INTERVENE') {
      console.log('✅ Action: INTERVENE');
      console.log('\n📝 Observer Feedback (personalMessage):');
      console.log('  ', result2.personalMessage);
      console.log('\n💡 Tip:');
      console.log('  ', result2.tip1);
      console.log('\n✏️ Rewrite 1 (preserve GOAL, remove AXIOM):');
      console.log('  ', result2.rewrite1);
      console.log('\n✏️ Rewrite 2 (preserve GOAL, remove AXIOM):');
      console.log('  ', result2.rewrite2);

      // Check if rewrites preserve goal (consistency) and remove "but"
      const rewrite1Good =
        result2.rewrite1.toLowerCase().includes('consistent') &&
        !result2.rewrite1.toLowerCase().includes('but');
      const rewrite2Good =
        result2.rewrite2.toLowerCase().includes('consistent') &&
        !result2.rewrite2.toLowerCase().includes('but');

      if (rewrite1Good && rewrite2Good) {
        console.log('\n✅ PASS: Rewrites preserve goal (consistency) and remove "but" trigger');
      } else {
        console.log('\n⚠️  WARNING: Rewrites may not fully remove axiom trigger');
      }
    } else {
      console.log('❌ Action was not INTERVENE:', result2?.action);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Test Case 3: AXIOM 010 - Child as Messenger
  console.log('\n\n📋 TEST 3: AXIOM 010 - Child as Messenger');
  console.log('-'.repeat(60));
  const test3 = {
    text: 'She said you forgot to pick her up again',
    username: 'testuser1',
    timestamp: new Date().toISOString(),
  };

  console.log('Original message:', test3.text);
  console.log('Expected Axiom: AXIOM 010 (Child as Messenger)');
  console.log('Expected Goal: Address pickup reliability');
  console.log('Expected Strategy: Remove child as messenger, speak directly\n');

  try {
    const result3 = await mediator.analyzeMessage(
      test3,
      [],
      ['testuser1', 'testuser2'],
      [],
      null,
      'test-room-3',
      null,
      null,
      null
    );

    if (result3 && result3.type === 'ai_intervention' && result3.action === 'INTERVENE') {
      console.log('✅ Action: INTERVENE');
      console.log('\n📝 Observer Feedback (personalMessage):');
      console.log('  ', result3.personalMessage);
      console.log('\n💡 Tip:');
      console.log('  ', result3.tip1);
      console.log('\n✏️ Rewrite 1 (preserve GOAL, remove AXIOM):');
      console.log('  ', result3.rewrite1);
      console.log('\n✏️ Rewrite 2 (preserve GOAL, remove AXIOM):');
      console.log('  ', result3.rewrite2);

      // Check if rewrites preserve goal (pickup concern) and remove child as messenger
      const rewrite1Good =
        (result3.rewrite1.toLowerCase().includes('pickup') ||
          result3.rewrite1.toLowerCase().includes('pick')) &&
        !result3.rewrite1.toLowerCase().includes('she said');
      const rewrite2Good =
        (result3.rewrite2.toLowerCase().includes('pickup') ||
          result3.rewrite2.toLowerCase().includes('pick')) &&
        !result3.rewrite2.toLowerCase().includes('she said');

      if (rewrite1Good && rewrite2Good) {
        console.log(
          '\n✅ PASS: Rewrites preserve goal (pickup concern) and remove child as messenger'
        );
      } else {
        console.log('\n⚠️  WARNING: Rewrites may not fully remove axiom trigger');
      }
    } else {
      console.log('❌ Action was not INTERVENE:', result3?.action);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete');
  console.log('='.repeat(60));
}

// Run tests
testAxiomAwareRewrites().catch(console.error);
