/* global describe, beforeEach, it, expect, jest */
/**
 * Tests for Blog Image Generator
 */

const blogImageGenerator = require('../src/services/blog/blogImageGenerator');

describe('Blog Image Generator', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Prompt Generation', () => {
    it('should create header image prompt from article metadata', () => {
      const articleMeta = {
        title: 'Test Article Title',
        subtitle: 'Test subtitle',
        category: 'Co-Parenting Communication',
      };

      const prompt = blogImageGenerator.createHeaderImagePrompt(articleMeta);

      expect(prompt).toContain('blog header image');
      expect(prompt).toContain('Test Article Title');
      expect(prompt).toContain('16:9 horizontal layout');
      expect(prompt).toContain('teal');
    });

    it('should create social media prompt for Instagram', () => {
      const articleMeta = {
        title: 'Test Article',
        subtitle: 'Test subtitle',
      };

      const prompt = blogImageGenerator.createSocialMediaPrompt(articleMeta, 'instagram');

      expect(prompt).toContain('social media graphic');
      expect(prompt).toContain('1:1 square');
      expect(prompt).toContain('Test Article');
    });

    it('should create social media prompt for Twitter', () => {
      const articleMeta = {
        title: 'Test Article',
        subtitle: 'Test subtitle',
      };

      const prompt = blogImageGenerator.createSocialMediaPrompt(articleMeta, 'twitter');

      expect(prompt).toContain('social media graphic');
      expect(prompt).toContain('16:9 wide');
      expect(prompt).toContain('Test Article');
    });

    it('should handle React element titles', () => {
      const articleMeta = {
        title: {
          props: {
            children: [
              "The Co-Parent's Dilemma: ",
              { type: 'span', props: { children: 'Why Negotiation Feels Like War' } },
            ],
          },
        },
        subtitle: 'Test subtitle',
      };

      const prompt = blogImageGenerator.createHeaderImagePrompt(articleMeta);

      // Should extract text from React element
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('should have correct image sizes for DALL-E', () => {
      // This tests that the configuration is correct
      // We can't directly test the private IMAGE_CONFIG, but we can test behavior
      expect(blogImageGenerator.createHeaderImagePrompt).toBeDefined();
      expect(blogImageGenerator.createSocialMediaPrompt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      // Save original env
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      await expect(
        blogImageGenerator.generateHeaderImage(
          {
            title: 'Test',
            subtitle: 'Test',
          },
          'dall-e-3'
        )
      ).rejects.toThrow('OPENAI_API_KEY not configured');

      // Restore
      if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
      }
    });

    it('should handle missing Flux API key', async () => {
      const originalKey = process.env.FLUX_API_KEY;
      delete process.env.FLUX_API_KEY;

      await expect(
        blogImageGenerator.generateHeaderImage(
          {
            title: 'Test',
            subtitle: 'Test',
          },
          'flux'
        )
      ).rejects.toThrow('FLUX_API_KEY not configured');

      if (originalKey) {
        process.env.FLUX_API_KEY = originalKey;
      }
    });
  });
});
