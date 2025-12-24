#!/usr/bin/env node

/**
 * Script to generate blog images for articles
 * 
 * Usage:
 *   node scripts/generate-blog-images.js <article-slug>
 *   node scripts/generate-blog-images.js all
 * 
 * Environment variables:
 *   OPENAI_API_KEY - Required for DALL-E 3
 *   FLUX_API_KEY - Optional, for Flux API
 *   IMAGE_PROVIDER - 'dall-e-3' or 'flux' (default: 'dall-e-3')
 */

require('dotenv').config();
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');
const path = require('path');
const fs = require('fs').promises;

// Blog articles metadata
const blogArticles = {
  'why-arguments-repeat': {
    title: 'The Co-Parent\'s Dilemma: Why Negotiation Feels Like War (And How to Find Peace)',
    subtitle: 'Discover why simple conversations turn into emotional tug-of-wars, the psychological traps keeping you stuck, and five powerful reframes to find your way back to win-win.',
    category: 'Co-Parenting Communication',
  },
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
  // Add more articles as needed
};

async function generateImagesForArticle(articleSlug, provider = 'dall-e-3') {
  const article = blogArticles[articleSlug];
  if (!article) {
    console.error(`❌ Article "${articleSlug}" not found`);
    console.log('Available articles:', Object.keys(blogArticles).join(', '));
    process.exit(1);
  }

  console.log(`\n🎨 Generating images for: ${article.title}`);
  console.log('='.repeat(60));

  const outputDir = path.join(__dirname, '../generated-images/blog', articleSlug);
  
  try {
    const result = await blogImageGenerator.generateAllImages(article, provider, outputDir);

    console.log('\n✅ Images generated successfully!');
    console.log('\n📸 Generated Images:');
    console.log(`   Header: ${result.header.url}`);
    if (result.header.localPath) {
      console.log(`   Local: ${result.header.localPath}`);
    }
    console.log(`   Instagram: ${result.social.instagram.url}`);
    console.log(`   Twitter: ${result.social.twitter.url}`);
    console.log(`   Facebook: ${result.social.facebook.url}`);

    // Save metadata
    const metadataPath = path.join(outputDir, 'metadata.json');
    await fs.writeFile(
      metadataPath,
      JSON.stringify({
        article: articleSlug,
        title: article.title,
        generated: new Date().toISOString(),
        provider,
        images: {
          header: result.header.url,
          social: {
            instagram: result.social.instagram.url,
            twitter: result.social.twitter.url,
            facebook: result.social.facebook.url,
          },
        },
      }, null, 2)
    );

    console.log(`\n💾 Metadata saved to: ${metadataPath}`);
  } catch (error) {
    console.error('\n❌ Error generating images:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function generateAllArticles(provider = 'dall-e-3') {
  console.log(`\n🎨 Generating images for all articles (${Object.keys(blogArticles).length} articles)`);
  console.log('='.repeat(60));

  for (const [slug, article] of Object.entries(blogArticles)) {
    try {
      await generateImagesForArticle(slug, provider);
      console.log('\n'); // Add spacing between articles
    } catch (error) {
      console.error(`\n❌ Failed to generate images for "${slug}":`, error.message);
      // Continue with next article
    }
  }

  console.log('\n✅ All images generated!');
}

// Main execution
async function main() {
  const articleSlug = process.argv[2];
  const provider = process.env.IMAGE_PROVIDER || 'dall-e-3';

  if (!articleSlug) {
    console.error('Usage: node scripts/generate-blog-images.js <article-slug>');
    console.error('   or: node scripts/generate-blog-images.js all');
    console.error('\nAvailable articles:', Object.keys(blogArticles).join(', '));
    process.exit(1);
  }

  // Check API key
  if (provider === 'dall-e-3' && !process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not configured');
    process.exit(1);
  }

  if (provider === 'flux' && !process.env.FLUX_API_KEY) {
    console.error('❌ FLUX_API_KEY not configured');
    process.exit(1);
  }

  if (articleSlug === 'all') {
    await generateAllArticles(provider);
  } else {
    await generateImagesForArticle(articleSlug, provider);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateImagesForArticle, generateAllArticles };

