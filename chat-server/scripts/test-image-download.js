#!/usr/bin/env node

/**
 * Test script to verify image download from Azure Blob Storage URLs
 */

require('dotenv').config();
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');
const path = require('path');
const fs = require('fs').promises;

async function testDownload() {
  console.log('🧪 Testing Image Download from Azure Blob Storage');
  console.log('='.repeat(60));

  // Test with a sample Azure Blob Storage URL format
  // Note: This URL will be expired, but we can test the URL parsing
  const testUrl = process.argv[2] || 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-WIoYOthxMHcQeW5yKKYizrVL/user-7eruVIg5p32BCtGyorRjIXTu/img-test.png?st=2025-12-24T06%3A29%3A31Z&se=2025-12-24T08%3A29%3A31Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&sig=test';

  console.log(`\n📥 Testing download from: ${testUrl.substring(0, 80)}...`);

  const testFilePath = path.join(__dirname, '../test-download.png');

  try {
    // Test URL parsing
    const { URL } = require('url');
    const url = new URL(testUrl);
    console.log('\n✅ URL Parsed Successfully:');
    console.log(`   Hostname: ${url.hostname}`);
    console.log(`   Path: ${url.pathname}`);
    console.log(`   Query params: ${url.search.substring(0, 50)}...`);
    console.log(`   Full path: ${url.pathname + url.search}`);

    // Try to download (will fail if URL is expired, but we can see the error)
    console.log('\n📥 Attempting download...');
    await blogImageGenerator.generateHeaderImage(
      {
        title: 'Test Article',
        subtitle: 'Test subtitle',
      },
      'dall-e-3',
      path.join(__dirname, '../test-output')
    );

    console.log('\n✅ Download test completed');
  } catch (error) {
    console.error('\n❌ Download test failed:');
    console.error(`   Error: ${error.message}`);
    
    // Check if it's the Azure Blob Storage error
    if (error.message.includes('InvalidQueryParameterValue') || 
        error.message.includes('comp') ||
        error.message.includes('400') ||
        error.message.includes('403')) {
      console.error('\n⚠️  This appears to be an Azure Blob Storage URL issue.');
      console.error('   Possible causes:');
      console.error('   1. URL has expired (SAS tokens expire after 2 hours)');
      console.error('   2. Query parameters not being preserved correctly');
      console.error('   3. URL encoding issues');
    }
  } finally {
    // Cleanup
    try {
      await fs.unlink(testFilePath);
    } catch (e) {
      // File doesn't exist, that's fine
    }
  }
}

if (require.main === module) {
  testDownload().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

