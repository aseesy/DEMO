#!/usr/bin/env node

/**
 * Generate and save images for all existing blog posts
 * 
 * This script:
 * 1. Reads all blog articles from blogData.js
 * 2. Generates header images using DALL-E 3
 * 3. Downloads and saves them immediately to prevent expiration
 * 4. Creates a mapping file for easy reference
 * 
 * Usage:
 *   node scripts/generate-all-blog-images.js [--provider=dall-e-3] [--dry-run]
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

// Import blog data (we'll need to read it as a string and parse it, or use a different approach)
const blogDataPath = path.join(__dirname, '../../chat-client-vite/src/features/blog/blogData.js');
const outputDir = path.join(__dirname, '../../chat-client-vite/public/assets/blog-images');
const mappingFilePath = path.join(__dirname, '../../chat-client-vite/src/features/blog/blogImageMap.js');

// Extract article metadata from blogData.js
async function extractArticlesFromBlogData() {
  // Read and parse blogData.js
  // Since it's an ES module, we'll need to extract the data manually
  const content = await fs.readFile(blogDataPath, 'utf-8');
  
  const articles = [];
  
  // Extract all articles from all pillars
  // Match article objects with title, excerpt, and path
  const articlePattern = /title:\s*['"`]([^'"`]+)['"`],\s*excerpt:\s*['"`]([^'"`]+)['"`],\s*path:\s*['"`]([^'"`]+)['"`]/g;
  
  let match;
  const seenPaths = new Set();
  
  while ((match = articlePattern.exec(content)) !== null) {
    const title = match[1];
    const excerpt = match[2];
    const articlePath = match[3];
    
    // Skip duplicates
    if (seenPaths.has(articlePath)) continue;
    seenPaths.add(articlePath);
    
    // Extract slug from path
    const pathParts = articlePath.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1] || 
                 title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Determine category from path
    let category = 'Co-Parenting Communication';
    if (articlePath.includes('/high-conflict/')) {
      category = 'High-Conflict Co-Parenting';
    } else if (articlePath.includes('/child-impact/')) {
      category = 'Child-Centered Co-Parenting';
    } else if (articlePath.includes('/liaizen/')) {
      category = 'AI + Co-Parenting Tools';
    }
    
    articles.push({
      title,
      excerpt,
      path: articlePath,
      slug,
      category,
    });
  }
  
  // If parsing found articles, return them
  if (articles.length > 0) {
    console.log(`✅ Extracted ${articles.length} articles from blogData.js`);
    return articles;
  }
  
  // Fallback: manually defined articles if parsing fails
  console.log(`⚠️  Could not parse blogData.js, using known articles`);
  const knownArticles = [
    {
      title: 'Why Co-Parenting Arguments Repeat (And How to Break the Communication Cycle)',
      excerpt: 'Stuck in the same fights? Learn why conflict patterns repeat and how to break the cycle with calmer, more effective tools.',
      path: '/break-co-parenting-argument-cycle-game-theory',
      slug: 'why-arguments-repeat',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Why Co-Parenting Messages Feel More Hurtful Than They Are',
      excerpt: 'Understanding the psychology behind emotional triggers and why neutral texts can feel like attacks.',
      path: '/co-parenting-communication/emotional-triggers',
      slug: 'emotional-triggers',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'How Emotional Regulation Changes Co-Parenting Outcomes',
      excerpt: 'Why managing your own nervous system is the most powerful move you can make in a co-parenting dynamic.',
      path: '/co-parenting-communication/emotional-regulation',
      slug: 'emotional-regulation',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'From Reaction to Response: The Most Important Co-Parenting Skill',
      excerpt: 'Learn the pause technique that stops escalation in its tracks.',
      path: '/co-parenting-communication/reaction-vs-response',
      slug: 'reaction-vs-response',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'How to Pause Before Sending a Heated Message',
      excerpt: 'A step-by-step guide to creating space between trigger and response.',
      path: '/co-parenting-communication/pause-before-reacting',
      slug: 'pause-before-reacting',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'What Kids Really Need: Stability Over Perfect Communication',
      excerpt: 'Understanding what actually matters most for your children\'s wellbeing.',
      path: '/co-parenting-communication/what-kids-need',
      slug: 'what-kids-need',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'The Long-Term Effects of Co-Parenting Conflict on Children',
      excerpt: 'Research-backed insights into how ongoing conflict impacts children and what you can do.',
      path: '/co-parenting-communication/long-term-effects',
      slug: 'long-term-effects',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Protecting Your Mental Health in High-Conflict Co-Parenting',
      excerpt: 'Strategies to maintain your wellbeing while navigating difficult co-parenting dynamics.',
      path: '/co-parenting-communication/mental-health-protection',
      slug: 'mental-health-protection',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Modeling Healthy Communication: What Your Kids Are Learning',
      excerpt: 'How your communication patterns shape your children\'s future relationships.',
      path: '/co-parenting-communication/modeling-communication',
      slug: 'modeling-communication',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'De-Escalation Techniques That Actually Work',
      excerpt: 'Proven strategies to reduce tension and create space for productive dialogue.',
      path: '/co-parenting-communication/de-escalation-techniques',
      slug: 'de-escalation-techniques',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Handling Defensiveness: Yours and Theirs',
      excerpt: 'Understanding defensive responses and how to navigate them constructively.',
      path: '/co-parenting-communication/defensiveness-strategies',
      slug: 'defensiveness-strategies',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Preventing Escalation Before It Starts',
      excerpt: 'Early warning signs and proactive strategies to keep conversations productive.',
      path: '/co-parenting-communication/escalation-prevention',
      slug: 'escalation-prevention',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Calm Communication in High-Stress Moments',
      excerpt: 'Practical tools for maintaining composure when emotions run high.',
      path: '/co-parenting-communication/calm-communication',
      slug: 'calm-communication',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Gaslighting, Guilt, and Blame: Recognizing Manipulation',
      excerpt: 'How to identify and respond to manipulative communication patterns.',
      path: '/co-parenting-communication/gaslighting-guilt-blame',
      slug: 'gaslighting-guilt-blame',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Why Every Conversation Feels Like a Fight',
      excerpt: 'Understanding the psychological dynamics that turn simple exchanges into conflicts.',
      path: '/co-parenting-communication/every-conversation-fight',
      slug: 'every-conversation-fight',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Stability and Stress: The Impact on Children',
      excerpt: 'How parental stress and instability affect children and what you can do about it.',
      path: '/co-parenting-communication/stability-stress',
      slug: 'stability-stress',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'Why Co-Parenting Feels Impossible (And Why It\'s Not)',
      excerpt: 'The psychological barriers that make co-parenting feel overwhelming and how to overcome them.',
      path: '/co-parenting-communication/why-it-feels-impossible',
      slug: 'why-it-feels-impossible',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'AI-Guided Mediation: How Technology Can Help',
      excerpt: 'Exploring how AI tools can support healthier co-parenting communication.',
      path: '/co-parenting-communication/ai-guided-mediation',
      slug: 'ai-guided-mediation',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'AI vs. Impulse: Making Better Communication Decisions',
      excerpt: 'How AI assistance can help you pause and respond more thoughtfully.',
      path: '/co-parenting-communication/ai-vs-impulse',
      slug: 'ai-vs-impulse',
      category: 'Co-Parenting Communication',
    },
    {
      title: 'AI Safety and Privacy in Co-Parenting Tools',
      excerpt: 'Understanding how your data is protected when using AI communication tools.',
      path: '/co-parenting-communication/ai-safety',
      slug: 'ai-safety',
      category: 'Co-Parenting Communication',
    },
  ];

  return knownArticles;
}

/**
 * Generate slug from article path or title
 */
function generateSlug(article) {
  if (article.slug) return article.slug;
  
  // Extract from path
  const pathParts = article.path.split('/').filter(Boolean);
  return pathParts[pathParts.length - 1] || 
         article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Generate and save image for a single article
 */
async function generateImageForArticle(article, provider = 'dall-e-3', dryRun = false) {
  const slug = generateSlug(article);
  const fileName = `${slug}-header.png`;
  const filePath = path.join(outputDir, fileName);
  
  console.log(`\n📸 Generating image for: "${article.title}"`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Output: ${filePath}`);

  if (dryRun) {
    console.log(`   [DRY RUN] Would generate and save image`);
    return {
      slug,
      fileName,
      filePath: `/assets/blog-images/${fileName}`,
      status: 'dry-run',
    };
  }

  try {
    // Generate header image with custom filename
    const result = await blogImageGenerator.generateHeaderImage(
      {
        title: article.title,
        subtitle: article.excerpt,
        category: article.category || 'Co-Parenting Communication',
        imageFileName: fileName, // Pass custom filename
      },
      provider,
      outputDir // This will save the image locally
    );

    // The generateHeaderImage function should have saved the image
    // But let's verify and potentially rename it
    if (result.localPath) {
      // Check if the file exists
      try {
        await fs.access(result.localPath);
        console.log(`   ✅ Image saved: ${result.localPath}`);
        
        // Rename to our desired filename if different
        if (result.localPath !== filePath) {
          await fs.rename(result.localPath, filePath);
          console.log(`   ✅ Renamed to: ${filePath}`);
        }
      } catch (error) {
        console.error(`   ⚠️  Image file not found at: ${result.localPath}`);
        console.error(`   ⚠️  But URL is available: ${result.url}`);
        console.error(`   ⚠️  You may need to download manually before URL expires`);
      }
    } else {
      console.warn(`   ⚠️  No local path returned - image URL: ${result.url}`);
      console.warn(`   ⚠️  URL expires in ~2 hours - download immediately!`);
    }

    return {
      slug,
      fileName,
      filePath: `/assets/blog-images/${fileName}`,
      url: result.url,
      localPath: result.localPath || filePath,
      status: result.localPath ? 'saved' : 'url-only',
      revisedPrompt: result.revised_prompt,
    };
  } catch (error) {
    console.error(`   ❌ Failed to generate image: ${error.message}`);
    return {
      slug,
      fileName,
      filePath: `/assets/blog-images/${fileName}`,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Generate mapping file for easy import in React components
 */
async function generateMappingFile(imageResults) {
  const mappingContent = `/**
 * Blog Image Mapping
 * 
 * Auto-generated mapping of blog article slugs to their header images.
 * Generated by: scripts/generate-all-blog-images.js
 * Generated at: ${new Date().toISOString()}
 * 
 * Usage in components:
 *   import { blogImageMap } from './blogImageMap';
 *   const imagePath = blogImageMap['article-slug'];
 */

export const blogImageMap = {
${imageResults
  .filter(r => r.status === 'saved' || r.status === 'url-only')
  .map(r => `  '${r.slug}': '${r.filePath}',`)
  .join('\n')}
};

// Helper function to get image path for an article
export function getBlogImage(slug) {
  return blogImageMap[slug] || null;
}
`;

  await fs.writeFile(mappingFilePath, mappingContent, 'utf-8');
  console.log(`\n✅ Mapping file generated: ${mappingFilePath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const provider = args.find(arg => arg.startsWith('--provider='))?.split('=')[1] || 'dall-e-3';
  const dryRun = args.includes('--dry-run');

  console.log('🎨 Blog Image Generation Script');
  console.log('='.repeat(60));
  console.log(`Provider: ${provider}`);
  console.log(`Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`Output Directory: ${outputDir}`);

  // Check API key
  if (!process.env.OPENAI_API_KEY && provider === 'dall-e-3') {
    console.error('\n❌ OPENAI_API_KEY not set in environment');
    process.exit(1);
  }

  // Create output directory
  if (!dryRun) {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`✅ Output directory ready: ${outputDir}`);
  }

  // Extract articles
  console.log('\n📚 Extracting articles from blog data...');
  const articles = await extractArticlesFromBlogData();
  console.log(`✅ Found ${articles.length} articles`);

  // Generate images
  console.log(`\n🎨 Generating images for ${articles.length} articles...`);
  const imageResults = [];
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] Processing: ${article.title}`);
    
    const result = await generateImageForArticle(article, provider, dryRun);
    imageResults.push(result);

    // Add delay between requests to avoid rate limiting
    if (!dryRun && i < articles.length - 1) {
      console.log('   ⏳ Waiting 2 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Summary');
  console.log('='.repeat(60));
  
  const saved = imageResults.filter(r => r.status === 'saved').length;
  const urlOnly = imageResults.filter(r => r.status === 'url-only').length;
  const errors = imageResults.filter(r => r.status === 'error').length;
  const dryRuns = imageResults.filter(r => r.status === 'dry-run').length;

  console.log(`Total articles: ${articles.length}`);
  console.log(`✅ Saved locally: ${saved}`);
  console.log(`⚠️  URL only (need download): ${urlOnly}`);
  console.log(`❌ Errors: ${errors}`);
  if (dryRun) {
    console.log(`🔍 Dry run: ${dryRuns}`);
  }

  // Generate mapping file
  if (!dryRun && (saved > 0 || urlOnly > 0)) {
    await generateMappingFile(imageResults);
  }

  // Show errors if any
  if (errors > 0) {
    console.log('\n❌ Articles with errors:');
    imageResults
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`   - ${r.slug}: ${r.error}`);
      });
  }

  // Show URL-only images that need immediate download
  if (urlOnly > 0) {
    console.log('\n⚠️  Images with URLs only (expire in ~2 hours):');
    imageResults
      .filter(r => r.status === 'url-only')
      .forEach(r => {
        console.log(`   - ${r.slug}: ${r.url}`);
      });
    console.log('\n💡 Download these immediately or regenerate with saveLocally=true');
  }

  console.log('\n✅ Script completed!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

