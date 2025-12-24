#!/usr/bin/env node

/**
 * Regenerate a single blog image with improved prompts
 * Usage: node scripts/regenerate-single-image.js <article-slug>
 * Example: node scripts/regenerate-single-image.js emotional-triggers
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

// Article metadata - you can add more articles here
const articles = {
  'emotional-triggers': {
    title: 'Why Co-Parenting Messages Feel More Hurtful Than They Are',
    subtitle: 'Understanding the psychology behind emotional triggers and why neutral texts can feel like attacks.',
    category: 'Co-Parenting Communication',
  },
  'emotional-regulation': {
    title: 'How Emotional Regulation Changes Co-Parenting Outcomes',
    subtitle: 'Why managing your own nervous system is the most powerful move you can make in a co-parenting dynamic.',
    category: 'Co-Parenting Communication',
  },
  'reaction-vs-response': {
    title: 'From Reaction to Response: The Most Important Co-Parenting Skill',
    subtitle: 'Learn the pause technique that stops escalation in its tracks.',
    category: 'Co-Parenting Communication',
  },
  'pause-before-reacting': {
    title: 'How to Pause Before Sending a Heated Message',
    subtitle: 'Practical strategies for hitting the brakes when you really want to hit send.',
    category: 'Co-Parenting Communication',
  },
  'defensiveness-strategies': {
    title: 'How to Communicate With a Defensive Co-Parent',
    subtitle: 'Strategies for getting your point across without triggering their defense mechanisms.',
    category: 'Co-Parenting Communication',
  },
};

async function regenerateImage(articleSlug, provider = 'dall-e-3') {
  const article = articles[articleSlug];
  
  if (!article) {
    console.error(`❌ Article "${articleSlug}" not found. Available: ${Object.keys(articles).join(', ')}`);
    process.exit(1);
  }

  const outputDir = path.join(__dirname, '../../chat-client-vite/public/assets/blog-images');
  const fileName = `${articleSlug}-header.png`;
  const filePath = path.join(outputDir, fileName);

  console.log(`🎨 Regenerating image for: "${article.title}"`);
  console.log(`   Slug: ${articleSlug}`);
  console.log(`   Output: ${filePath}`);
  console.log(`   Provider: ${provider}\n`);

  try {
    // Generate with improved prompts
    const result = await blogImageGenerator.generateHeaderImage(
      {
        title: article.title,
        subtitle: article.subtitle,
        category: article.category,
        imageFileName: fileName,
      },
      provider,
      outputDir
    );

    if (result.localPath) {
      console.log(`\n✅ Image regenerated and saved: ${result.localPath}`);
      console.log(`   URL: ${result.url?.substring(0, 80)}...`);
      
      // Check file size
      const stats = await fs.stat(result.localPath);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Verify it's optimized
      if (stats.size < 1024 * 1024) {
        console.log(`   ✅ Image is optimized (< 1MB)`);
      }
    } else {
      console.warn(`\n⚠️  Image generated but not saved locally`);
      console.warn(`   URL: ${result.url}`);
      console.warn(`   ⚠️  Download manually before URL expires (~2 hours)`);
    }

    console.log(`\n💡 The new image uses improved prompts with:`);
    console.log(`   - Article-specific visual metaphors`);
    console.log(`   - Subtitle context for better relevance`);
    console.log(`   - More detailed instructions for DALL-E 3`);
    
    return result;
  } catch (error) {
    console.error(`\n❌ Failed to regenerate image: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function main() {
  const articleSlug = process.argv[2];
  const provider = process.argv[3] || 'dall-e-3';

  if (!articleSlug) {
    console.error('Usage: node scripts/regenerate-single-image.js <article-slug> [provider]');
    console.error('\nAvailable articles:');
    Object.keys(articles).forEach(slug => {
      console.error(`  - ${slug}: ${articles[slug].title}`);
    });
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY && provider === 'dall-e-3') {
    console.error('❌ OPENAI_API_KEY not set in environment');
    process.exit(1);
  }

  await regenerateImage(articleSlug, provider);
}

if (require.main === module) {
  main();
}

