#!/usr/bin/env node

/**
 * Optimize a single blog image
 * Usage: node scripts/optimize-single-image.js <image-path>
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

async function optimizeImage(imagePath) {
  try {
    // Check if file exists
    await fs.access(imagePath);
    
    const stats = await fs.stat(imagePath);
    const originalSize = stats.size;
    const ext = path.extname(imagePath).toLowerCase();
    
    console.log(`📸 Optimizing: ${path.basename(imagePath)}`);
    console.log(`   Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (ext === '.png') {
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
      
      console.log(`   ✅ Optimized size: ${(newSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   ✅ Reduction: ${savings}% (${((originalSize - newSize) / 1024).toFixed(0)}KB saved)`);
      
      return { success: true, originalSize, newSize, savings };
    } else {
      console.log(`   ⚠️  File is not PNG, skipping optimization`);
      return { success: false, reason: 'not-png' };
    }
  } catch (error) {
    console.error(`   ❌ Optimization failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.error('Usage: node scripts/optimize-single-image.js <image-path>');
    console.error('Example: node scripts/optimize-single-image.js ../chat-client-vite/public/assets/blog-images/emotional-triggers-header.png');
    process.exit(1);
  }
  
  const fullPath = path.resolve(imagePath);
  
  try {
    await optimizeImage(fullPath);
    console.log('\n✅ Image optimization complete!');
  } catch (error) {
    console.error('\n❌ Failed to optimize image:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

