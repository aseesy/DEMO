#!/usr/bin/env node

/**
 * Test script for blog image generation
 * Tests the actual API integration without generating real images (unless --generate flag is used)
 */

require('dotenv').config();
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

async function testPromptGeneration() {
  console.log('\n🧪 Testing Prompt Generation');
  console.log('='.repeat(60));

  const testArticle = {
    title: 'Why Co-Parenting Arguments Repeat (And How to Break the Cycle)',
    subtitle: 'Understanding the psychological traps that keep you stuck in conflict patterns.',
    category: 'Co-Parenting Communication',
  };

  // Test header prompt
  const headerPrompt = blogImageGenerator.createHeaderImagePrompt(testArticle);
  console.log('\n✅ Header Image Prompt Generated:');
  console.log(headerPrompt.substring(0, 200) + '...\n');

  // Test social media prompts
  const instagramPrompt = blogImageGenerator.createSocialMediaPrompt(testArticle, 'instagram');
  console.log('✅ Instagram Prompt Generated:');
  console.log(instagramPrompt.substring(0, 200) + '...\n');

  const twitterPrompt = blogImageGenerator.createSocialMediaPrompt(testArticle, 'twitter');
  console.log('✅ Twitter Prompt Generated:');
  console.log(twitterPrompt.substring(0, 200) + '...\n');

  return true;
}

async function testAPIKeyValidation() {
  console.log('\n🔑 Testing API Key Validation');
  console.log('='.repeat(60));

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasFlux = !!process.env.FLUX_API_KEY;

  console.log(`OpenAI API Key: ${hasOpenAI ? '✅ Set' : '❌ Not set'}`);
  console.log(`Flux API Key: ${hasFlux ? '✅ Set' : '❌ Not set'}`);

  if (!hasOpenAI && !hasFlux) {
    console.log('\n⚠️  No API keys configured. Image generation will fail.');
    console.log('   Set OPENAI_API_KEY or FLUX_API_KEY to test actual generation.');
    return false;
  }

  return true;
}

async function testActualGeneration(generate = false) {
  if (!generate) {
    console.log('\n⏭️  Skipping actual image generation (use --generate flag to test)');
    return;
  }

  console.log('\n🎨 Testing Actual Image Generation');
  console.log('='.repeat(60));
  console.log('⚠️  This will make real API calls and may incur costs!\n');

  const testArticle = {
    title: 'Test Article: Co-Parenting Communication',
    subtitle: 'A test article for image generation',
    category: 'Co-Parenting Communication',
  };

  const provider = process.env.IMAGE_PROVIDER || 'dall-e-3';

  try {
    console.log(`Generating header image with ${provider}...`);
    const result = await blogImageGenerator.generateHeaderImage(
      testArticle,
      provider,
      null // Don't save locally for test
    );

    console.log('\n✅ Image Generated Successfully!');
    console.log(`   URL: ${result.url}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Revised Prompt: ${result.revised_prompt.substring(0, 100)}...`);

    return true;
  } catch (error) {
    console.error('\n❌ Image Generation Failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n')[0]}`);
    }
    return false;
  }
}

async function testRouteRegistration() {
  console.log('\n🔌 Testing Route Registration');
  console.log('='.repeat(60));

  try {
    const blogImagesRoutes = require('../routes/blogImages');
    
    if (blogImagesRoutes && typeof blogImagesRoutes === 'function') {
      console.log('✅ Blog images route module loaded successfully');
      return true;
    } else {
      console.log('❌ Blog images route module not properly exported');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to load blog images route:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldGenerate = args.includes('--generate');

  console.log('🧪 Blog Image Generation Test Suite');
  console.log('='.repeat(60));

  const results = {
    prompts: false,
    apiKeys: false,
    routes: false,
    generation: null,
  };

  // Test 1: Prompt generation
  try {
    results.prompts = await testPromptGeneration();
  } catch (error) {
    console.error('❌ Prompt generation test failed:', error.message);
  }

  // Test 2: API key validation
  try {
    results.apiKeys = await testAPIKeyValidation();
  } catch (error) {
    console.error('❌ API key validation failed:', error.message);
  }

  // Test 3: Route registration
  try {
    results.routes = await testRouteRegistration();
  } catch (error) {
    console.error('❌ Route registration test failed:', error.message);
  }

  // Test 4: Actual generation (optional)
  if (shouldGenerate) {
    try {
      results.generation = await testActualGeneration(true);
    } catch (error) {
      console.error('❌ Image generation test failed:', error.message);
      results.generation = false;
    }
  } else {
    await testActualGeneration(false);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Prompt Generation: ${results.prompts ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Key Validation: ${results.apiKeys ? '✅ PASS' : '⚠️  WARN'}`);
  console.log(`Route Registration: ${results.routes ? '✅ PASS' : '❌ FAIL'}`);
  if (results.generation !== null) {
    console.log(`Image Generation: ${results.generation ? '✅ PASS' : '❌ FAIL'}`);
  } else {
    console.log(`Image Generation: ⏭️  SKIPPED (use --generate to test)`);
  }

  const allPassed = results.prompts && results.routes && 
                   (results.generation === null || results.generation);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('⚠️  Some tests failed or were skipped');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testPromptGeneration, testAPIKeyValidation, testActualGeneration };

