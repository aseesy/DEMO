#!/usr/bin/env node

/**
 * Optimize all blog images
 * Finds all PNG images in the blog-images directory and optimizes them
 */

const path = require('path');
const fs = require('fs').promises;
let sharp = null;

try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ sharp not installed. Install with: npm install sharp');
  process.exit(1);
}

const blogImagesDir = path.join(__dirname, '../../chat-client-vite/public/assets/blog-images');

async function optimizeImage(imagePath) {
  try {
    const stats = await fs.stat(imagePath);
    const originalSize = stats.size;
    const ext = path.extname(imagePath).toLowerCase();
    
    if (ext !== '.png') {
      return { success: false, reason: 'not-png', skipped: true };
    }
    
    // Create optimized version
    const tempPath = imagePath + '.tmp';
    
    await sharp(imagePath)
      .png({ 
        quality: 85, 
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toFile(tempPath);
    
    // Replace original with optimized
    await fs.rename(tempPath, imagePath);
    
    const newStats = await fs.stat(imagePath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    return { 
      success: true, 
      originalSize, 
      newSize, 
      savings: parseFloat(savings),
      fileName: path.basename(imagePath),
    };
  } catch (error) {
    console.error(`   ❌ Optimization failed: ${error.message}`);
    return { success: false, error: error.message, fileName: path.basename(imagePath) };
  }
}

async function main() {
  console.log('🎨 Blog Image Optimization');
  console.log('='.repeat(60));
  console.log(`Directory: ${blogImagesDir}\n`);

  try {
    // Check if directory exists
    await fs.access(blogImagesDir);
  } catch (error) {
    console.error(`❌ Directory not found: ${blogImagesDir}`);
    process.exit(1);
  }

  // Find all PNG files
  const files = await fs.readdir(blogImagesDir);
  const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
  
  if (pngFiles.length === 0) {
    console.log('⚠️  No PNG files found in blog-images directory');
    process.exit(0);
  }

  console.log(`Found ${pngFiles.length} PNG image(s) to optimize\n`);

  const results = [];
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  // Optimize each image
  for (let i = 0; i < pngFiles.length; i++) {
    const fileName = pngFiles[i];
    const filePath = path.join(blogImagesDir, fileName);
    
    console.log(`[${i + 1}/${pngFiles.length}] ${fileName}`);
    
    const result = await optimizeImage(filePath);
    results.push(result);
    
    if (result.success) {
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      console.log(`   ✅ ${(result.originalSize / 1024 / 1024).toFixed(2)}MB → ${(result.newSize / 1024 / 1024).toFixed(2)}MB (${result.savings}% reduction)`);
    } else if (result.skipped) {
      console.log(`   ⏭️  Skipped (not PNG)`);
    } else {
      console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Optimization Summary');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success && !r.skipped);
  const skipped = results.filter(r => r.skipped);
  
  console.log(`Total images: ${pngFiles.length}`);
  console.log(`✅ Optimized: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);
  
  if (successful.length > 0) {
    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);
    const totalSavingsKB = ((totalOriginalSize - totalNewSize) / 1024).toFixed(0);
    
    console.log(`\n💾 Total size reduction:`);
    console.log(`   Before: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   After: ${(totalNewSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Saved: ${totalSavings}% (${totalSavingsKB}KB)`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed images:`);
    failed.forEach(r => {
      console.log(`   - ${r.fileName}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n✅ Optimization complete!');
  console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

