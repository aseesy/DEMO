/**
 * Test script for Transformation Templates
 *
 * Tests that rewrites apply the transformation templates correctly:
 * 1. Accusation -> Observation + Need
 * 2. Always/Never -> Specific Instance
 * 3. Character Attack -> Behavior Focus
 * 4. Demand -> Request
 * 5. New Partner Threat -> Boundary Focus
 * 6. Softener Removal
 * 7. Weaponized Agreement Removal
 */

require('dotenv').config();
const mediator = require('./src/core/core/mediator');

async function testTransformationTemplates() {
  console.log('🧪 Testing Transformation Templates\n');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Accusation -> Observation + Need',
      message: 'You never tell me anything about school.',
      expectedTransform: 'Remove blame, express need directly',
      checkRewrite: rewrite => {
        const hasNeed = /I'd like|I want|I need|Can we|Can you/i.test(rewrite);
        const noBlame = !/you never|you don't|you always/i.test(rewrite);
        return hasNeed && noBlame;
      },
    },
    {
      name: 'Always/Never -> Specific Instance',
      message: "You're always late.",
      expectedTransform: 'Replace absolutes with concrete examples',
      checkRewrite: rewrite => {
        const noAlways = !/\balways\b/i.test(rewrite);
        const hasSpecific =
          /\b(Tuesday|Wednesday|Monday|Friday|last|recent|specific|20 minutes|delayed)\b/i.test(
            rewrite
          );
        return noAlways && hasSpecific;
      },
    },
    {
      name: 'Character Attack -> Behavior Focus',
      message: "You're so irresponsible.",
      expectedTransform: 'Remove character judgment, focus on specific behavior',
      checkRewrite: rewrite => {
        const noCharacter = !/\b(irresponsible|lazy|selfish|mean|bad)\b/i.test(rewrite);
        const hasBehavior = /\b(permission slip|signed|completed|handle|discuss)\b/i.test(rewrite);
        return noCharacter && hasBehavior;
      },
    },
    {
      name: 'Demand -> Request',
      message: 'You need to call me before making plans.',
      expectedTransform: 'Replace command with collaborative request',
      checkRewrite: rewrite => {
        const noCommand = !/\b(you need to|you must|you have to)\b/i.test(rewrite);
        const hasRequest = /\b(I'd appreciate|Can we|Would that work|coordinate)\b/i.test(rewrite);
        return noCommand && hasRequest;
      },
    },
    {
      name: 'New Partner Threat -> Boundary Focus',
      message: "It's confusing for her to meet your new friend.",
      expectedTransform: 'Remove judgment, express boundary/concern directly',
      checkRewrite: rewrite => {
        const noJudgment = !/\b(confusing|wrong|bad|inappropriate)\b/i.test(rewrite);
        const hasBoundary = /\b(pace|digest|timing|introductions|ensure|discuss)\b/i.test(rewrite);
        return noJudgment && hasBoundary;
      },
    },
    {
      name: 'Softener Removal',
      message: "I'm just worried about the schedule change.",
      expectedTransform: 'Remove "just", "only", "simply" that disguise attacks',
      checkRewrite: rewrite => {
        const noSoftener = !/\b(just|only|simply)\b/i.test(rewrite);
        const hasConcern = /\b(concerned|worried|thinking|discuss)\b/i.test(rewrite);
        return noSoftener && hasConcern;
      },
    },
    {
      name: 'Weaponized Agreement Removal',
      message: 'I agree we should be consistent, but you never follow through.',
      expectedTransform: 'Remove "but", "however" - make clean agreement or separate request',
      checkRewrite: rewrite => {
        const noBut = !/\b(but|however)\b/i.test(rewrite);
        const hasConsistency = /\b(consistent|consistency)\b/i.test(rewrite);
        return noBut && hasConsistency;
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 TEST: ${testCase.name}`);
    console.log('-'.repeat(60));
    console.log('Original message:', testCase.message);
    console.log('Expected transformation:', testCase.expectedTransform);

    try {
      const message = {
        text: testCase.message,
        username: 'testuser1',
        timestamp: new Date().toISOString(),
      };

      const result = await mediator.analyzeMessage(
        message,
        [],
        ['testuser1', 'testuser2'],
        [],
        null,
        `test-room-${Date.now()}`,
        null,
        null,
        null
      );

      if (result && result.type === 'ai_intervention' && result.action === 'INTERVENE') {
        console.log('\n✅ Action: INTERVENE');
        console.log('\n📝 Observer Feedback:');
        console.log('  ', result.personalMessage);
        console.log('\n💡 Tip:');
        console.log('  ', result.tip1);
        console.log('\n✏️ Rewrite 1:');
        console.log('  ', result.rewrite1);
        console.log('\n✏️ Rewrite 2:');
        console.log('  ', result.rewrite2);

        // Check if rewrites apply transformation
        const rewrite1Good = testCase.checkRewrite(result.rewrite1);
        const rewrite2Good = testCase.checkRewrite(result.rewrite2);

        if (rewrite1Good && rewrite2Good) {
          console.log('\n✅ PASS: Both rewrites apply transformation template correctly');
          passed++;
        } else {
          console.log('\n⚠️  PARTIAL: Some rewrites may not fully apply transformation');
          console.log(`   Rewrite 1: ${rewrite1Good ? '✅' : '❌'}`);
          console.log(`   Rewrite 2: ${rewrite2Good ? '✅' : '❌'}`);
          if (rewrite1Good || rewrite2Good) {
            passed++;
          } else {
            failed++;
          }
        }
      } else {
        console.log(`\n❌ FAIL: Action was not INTERVENE (got: ${result?.action || 'null'})`);
        failed++;
      }
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
}

// Run tests
testTransformationTemplates().catch(console.error);
