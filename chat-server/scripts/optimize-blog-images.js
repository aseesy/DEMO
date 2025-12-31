#!/usr/bin/env node

/**
 * Optimize blog images
 *
 * Usage:
 *   node scripts/optimize-blog-images.js <image-path>  - Optimize single image
 *   node scripts/optimize-blog-images.js --all         - Optimize all blog images
 */

const path = require('path');
const fs = require('fs').promises;
let sharp = null;

try {
  sharp = require('sharp');
} catch (error) {
  console.error('sharp not installed. Install with: npm install sharp');
  process.exit(1);
}

const blogImagesDir = path.join(__dirname, '../../chat-client-vite/public/assets/blog-images');

async function optimizeImage(imagePath) {
  try {
    await fs.access(imagePath);

    const stats = await fs.stat(imagePath);
    const originalSize = stats.size;
    const ext = path.extname(imagePath).toLowerCase();

    if (ext !== '.png') {
      return { success: false, reason: 'not-png', skipped: true, fileName: path.basename(imagePath) };
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
    return { success: false, error: error.message, fileName: path.basename(imagePath) };
  }
}

async function optimizeSingle(imagePath) {
  const fullPath = path.resolve(imagePath);

  console.log(`Optimizing: ${path.basename(fullPath)}`);

  const result = await optimizeImage(fullPath);

  if (result.success) {
    console.log(`   Original: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Optimized: ${(result.newSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Reduction: ${result.savings}%`);
  } else if (result.skipped) {
    console.log(`   Skipped: not a PNG file`);
  } else {
    console.error(`   Failed: ${result.error}`);
    process.exit(1);
  }
}

async function optimizeAll() {
  console.log('Blog Image Optimization');
  console.log('='.repeat(60));
  console.log(`Directory: ${blogImagesDir}\n`);

  try {
    await fs.access(blogImagesDir);
  } catch (error) {
    console.error(`Directory not found: ${blogImagesDir}`);
    process.exit(1);
  }

  const files = await fs.readdir(blogImagesDir);
  const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log('No PNG files found');
    process.exit(0);
  }

  console.log(`Found ${pngFiles.length} PNG image(s)\n`);

  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < pngFiles.length; i++) {
    const fileName = pngFiles[i];
    const filePath = path.join(blogImagesDir, fileName);

    console.log(`[${i + 1}/${pngFiles.length}] ${fileName}`);

    const result = await optimizeImage(filePath);

    if (result.success) {
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      successful++;
      console.log(`   ${(result.originalSize / 1024 / 1024).toFixed(2)}MB -> ${(result.newSize / 1024 / 1024).toFixed(2)}MB (${result.savings}%)`);
    } else {
      failed++;
      console.log(`   Failed: ${result.error || 'Unknown'}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`Optimized: ${successful}/${pngFiles.length}`);

  if (successful > 0) {
    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);
    console.log(`Total saved: ${totalSavings}% (${((totalOriginalSize - totalNewSize) / 1024).toFixed(0)}KB)`);
  }
}

async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.error('Usage:');
    console.error('  node scripts/optimize-blog-images.js <image-path>  - Single image');
    console.error('  node scripts/optimize-blog-images.js --all         - All images');
    process.exit(1);
  }

  if (arg === '--all') {
    await optimizeAll();
  } else {
    await optimizeSingle(arg);
  }

  console.log('\nDone!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
