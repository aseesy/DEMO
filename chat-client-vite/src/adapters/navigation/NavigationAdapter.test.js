/**
 * NavigationAdapter Tests
 *
 * Tests the navigation abstraction layer to ensure:
 * - NavigationPaths constants are correct
 * - Path builders work correctly
 * - Query string handling works
 */

import { describe, it, expect } from 'vitest';
import { NavigationPaths } from './NavigationAdapter.js';

describe('NavigationPaths', () => {
  describe('Auth Routes', () => {
    it('should have correct auth paths', () => {
      expect(NavigationPaths.HOME).toBe('/');
      expect(NavigationPaths.SIGN_IN).toBe('/signin');
      expect(NavigationPaths.SIGN_UP).toBe('/signup');
      expect(NavigationPaths.FORGOT_PASSWORD).toBe('/forgot-password');
      expect(NavigationPaths.RESET_PASSWORD).toBe('/reset-password');
    });
  });

  describe('App Routes', () => {
    it('should have correct app paths', () => {
      expect(NavigationPaths.DASHBOARD).toBe('/dashboard');
      expect(NavigationPaths.CHAT).toBe('/chat');
      expect(NavigationPaths.CONTACTS).toBe('/contacts');
      expect(NavigationPaths.PROFILE).toBe('/profile');
      expect(NavigationPaths.SETTINGS).toBe('/settings');
      expect(NavigationPaths.ACCOUNT).toBe('/account');
    });
  });

  describe('Content Routes', () => {
    it('should have correct content paths', () => {
      expect(NavigationPaths.PRIVACY).toBe('/privacy');
      expect(NavigationPaths.TERMS).toBe('/terms');
      expect(NavigationPaths.BLOG).toBe('/blog');
      expect(NavigationPaths.QUIZZES).toBe('/quizzes');
    });
  });

  describe('Invitation Routes', () => {
    it('should have correct invitation paths', () => {
      expect(NavigationPaths.ACCEPT_INVITE).toBe('/accept-invite');
      expect(NavigationPaths.INVITE_COPARENT).toBe('/invite-coparent');
    });
  });

  describe('OAuth Routes', () => {
    it('should have correct OAuth callback path', () => {
      expect(NavigationPaths.GOOGLE_CALLBACK).toBe('/auth/google/callback');
    });
  });

  describe('withParams helper', () => {
    it('should replace single parameter', () => {
      const result = NavigationPaths.withParams('/users/:id', { id: '123' });
      expect(result).toBe('/users/123');
    });

    it('should replace multiple parameters', () => {
      const result = NavigationPaths.withParams('/rooms/:roomId/messages/:msgId', {
        roomId: 'room-1',
        msgId: 'msg-42',
      });
      expect(result).toBe('/rooms/room-1/messages/msg-42');
    });

    it('should leave path unchanged if no matching params', () => {
      const result = NavigationPaths.withParams('/static/path', { unused: 'value' });
      expect(result).toBe('/static/path');
    });

    it('should handle empty params object', () => {
      const result = NavigationPaths.withParams('/path/:id', {});
      expect(result).toBe('/path/:id');
    });
  });

  describe('withQuery helper', () => {
    it('should add single query parameter', () => {
      const result = NavigationPaths.withQuery('/search', { q: 'test' });
      expect(result).toBe('/search?q=test');
    });

    it('should add multiple query parameters', () => {
      const result = NavigationPaths.withQuery('/search', {
        q: 'test',
        page: '1',
        sort: 'date',
      });
      // URLSearchParams may order differently, so check contains
      expect(result).toContain('/search?');
      expect(result).toContain('q=test');
      expect(result).toContain('page=1');
      expect(result).toContain('sort=date');
    });

    it('should handle empty query object', () => {
      const result = NavigationPaths.withQuery('/path', {});
      expect(result).toBe('/path');
    });

    it('should encode special characters', () => {
      const result = NavigationPaths.withQuery('/search', { q: 'hello world' });
      expect(result).toBe('/search?q=hello+world');
    });

    it('should work with invitation token', () => {
      const result = NavigationPaths.withQuery(NavigationPaths.ACCEPT_INVITE, {
        token: 'abc123xyz',
      });
      expect(result).toBe('/accept-invite?token=abc123xyz');
    });

    it('should handle complex invitation code', () => {
      const result = NavigationPaths.withQuery(NavigationPaths.ACCEPT_INVITE, {
        code: 'LZ-ABC123',
      });
      expect(result).toBe('/accept-invite?code=LZ-ABC123');
    });
  });

  describe('Route Consistency', () => {
    it('should not have trailing slashes', () => {
      const paths = Object.entries(NavigationPaths).filter(
        ([key, value]) => typeof value === 'string' && key !== 'HOME'
      );

      paths.forEach(([key, path]) => {
        expect(path.endsWith('/')).toBe(false);
      });
    });

    it('should all start with forward slash', () => {
      const paths = Object.entries(NavigationPaths).filter(
        ([, value]) => typeof value === 'string'
      );

      paths.forEach(([key, path]) => {
        expect(path.startsWith('/')).toBe(true);
      });
    });

    it('should use lowercase paths', () => {
      const paths = Object.entries(NavigationPaths).filter(
        ([, value]) => typeof value === 'string'
      );

      paths.forEach(([key, path]) => {
        expect(path).toBe(path.toLowerCase());
      });
    });
  });
});
