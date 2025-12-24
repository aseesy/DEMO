#!/usr/bin/env node

/**
 * Test script for blog image generation
 * Verifies all components work correctly
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

async function testImageGeneration() {
  console.log('🧪 Testing Blog Image Generation');
  console.log('='.repeat(60));

  const tests = {
    moduleLoad: false,
    apiKey: false,
    imageGeneration: false,
    imageDownload: false,
    fileExists: false,
  };

  // Test 1: Module loads
  try {
    const gen = require('../src/services/blog/blogImageGenerator');
    console.log('✅ Test 1: Module loads successfully');
    tests.moduleLoad = true;
  } catch (error) {
    console.error('❌ Test 1: Module load failed:', error.message);
    return tests;
  }

  // Test 2: API Key
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ Test 2: OpenAI API key is set');
    tests.apiKey = true;
  } else {
    console.error('❌ Test 2: OPENAI_API_KEY not set');
    return tests;
  }

  // Test 3: Image Generation
  try {
    console.log('\n📸 Test 3: Generating test image...');
    const outputDir = path.join(__dirname, '../../chat-client-vite/public/assets/blog-images');
    await fs.mkdir(outputDir, { recursive: true });

    const result = await blogImageGenerator.generateHeaderImage(
      {
        title: 'Test Article for Image Generation',
        subtitle: 'This is a test to verify image generation works',
        category: 'Co-Parenting Communication',
        imageFileName: 'test-generation-header.png',
      },
      'dall-e-3',
      outputDir
    );

    if (result.url) {
      console.log('✅ Test 3: Image generated successfully');
      console.log(`   URL: ${result.url.substring(0, 60)}...`);
      tests.imageGeneration = true;
    } else {
      console.error('❌ Test 3: No URL returned');
      return tests;
    }

    // Test 4: Image Download
    if (result.localPath) {
      console.log('✅ Test 4: Image download initiated');
      tests.imageDownload = true;

      // Test 5: File Exists
      try {
        await fs.access(result.localPath);
        const stats = await fs.stat(result.localPath);
        console.log('✅ Test 5: Image file exists and is saved');
        console.log(`   Path: ${result.localPath}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
        tests.fileExists = true;
      } catch (error) {
        console.error('❌ Test 5: File not found at:', result.localPath);
      }
    } else {
      console.warn('⚠️  Test 4: No local path returned (download may have failed)');
    }
  } catch (error) {
    console.error('❌ Test 3: Image generation failed:', error.message);
    return tests;
  }

  return tests;
}

async function testScriptParsing() {
  console.log('\n📚 Testing Article Extraction');
  console.log('='.repeat(60));

  try {
    const blogDataPath = path.join(__dirname, '../../chat-client-vite/src/features/blog/blogData.js');
    const content = await fs.readFile(blogDataPath, 'utf-8');

    // Count articles
    const articlePattern = /title:\s*['"`]([^'"`]+)['"`],\s*excerpt:\s*['"`]([^'"`]+)['"`],\s*path:\s*['"`]([^'"`]+)['"`]/g;
    const matches = [...content.matchAll(articlePattern)];
    
    console.log(`✅ Found ${matches.length} articles in blogData.js`);
    
    if (matches.length > 0) {
      console.log('\n📋 Sample articles:');
      matches.slice(0, 3).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match[1].substring(0, 50)}...`);
      });
    }

    return { success: true, count: matches.length };
  } catch (error) {
    console.error('❌ Article extraction failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 Blog Image Generation - Test Suite');
  console.log('='.repeat(60));

  // Test image generation
  const imageTests = await testImageGeneration();

  // Test script parsing
  const parsingTests = await testScriptParsing();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const allImageTestsPassed = Object.values(imageTests).every(v => v === true);
  const parsingPassed = parsingTests.success;

  console.log('\nImage Generation Tests:');
  console.log(`  Module Load: ${imageTests.moduleLoad ? '✅' : '❌'}`);
  console.log(`  API Key: ${imageTests.apiKey ? '✅' : '❌'}`);
  console.log(`  Image Generation: ${imageTests.imageGeneration ? '✅' : '❌'}`);
  console.log(`  Image Download: ${imageTests.imageDownload ? '✅' : '❌'}`);
  console.log(`  File Exists: ${imageTests.fileExists ? '✅' : '❌'}`);

  console.log('\nScript Parsing Tests:');
  console.log(`  Article Extraction: ${parsingPassed ? '✅' : '❌'}`);
  if (parsingPassed) {
    console.log(`  Articles Found: ${parsingTests.count}`);
  }

  const allPassed = allImageTestsPassed && parsingPassed;

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: node scripts/generate-all-blog-images.js --dry-run');
    console.log('   2. Review the articles that will get images');
    console.log('   3. Run: node scripts/generate-all-blog-images.js');
    console.log('   4. Images will be saved to: chat-client-vite/public/assets/blog-images/');
  } else {
    console.log('⚠️  Some tests failed - check errors above');
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

