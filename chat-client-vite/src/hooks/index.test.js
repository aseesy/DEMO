/**
 * Infrastructure Hooks Barrel Export Tests
 *
 * Ensures all infrastructure hooks are properly exported from their
 * categorized subdirectories and the main hooks barrel.
 */

import { describe, it, expect } from 'vitest';

describe('Hooks Infrastructure Exports', () => {
  describe('UI Hooks (hooks/ui/)', () => {
    it('exports useModalController', async () => {
      const { useModalController } = await import('./ui/index.js');
      expect(useModalController).toBeDefined();
      expect(typeof useModalController).toBe('function');
    });

    it('exports useSimpleModals', async () => {
      const { useSimpleModals } = await import('./ui/index.js');
      expect(useSimpleModals).toBeDefined();
      expect(typeof useSimpleModals).toBe('function');
    });

    it('exports modalRegistry utilities', async () => {
      const { registerModalHook, getRegisteredModals, clearRegistry } = await import('./ui/index.js');
      expect(registerModalHook).toBeDefined();
      expect(getRegisteredModals).toBeDefined();
      expect(clearRegistry).toBeDefined();
    });

    it('exports useToast', async () => {
      const { useToast } = await import('./ui/index.js');
      expect(useToast).toBeDefined();
      expect(typeof useToast).toBe('function');
    });

    it('exports registerAllModalHooks', async () => {
      const { registerAllModalHooks } = await import('./ui/index.js');
      expect(registerAllModalHooks).toBeDefined();
    });
  });

  describe('Async Hooks (hooks/async/)', () => {
    it('exports useAsyncOperation', async () => {
      const { useAsyncOperation } = await import('./async/index.js');
      expect(useAsyncOperation).toBeDefined();
      expect(typeof useAsyncOperation).toBe('function');
    });

    it('exports useMultipleAsyncOperations', async () => {
      const { useMultipleAsyncOperations } = await import('./async/index.js');
      expect(useMultipleAsyncOperations).toBeDefined();
      expect(typeof useMultipleAsyncOperations).toBe('function');
    });
  });

  describe('Integration Hooks (hooks/integrations/)', () => {
    it('exports useGooglePlaces', async () => {
      const { useGooglePlaces } = await import('./integrations/index.js');
      expect(useGooglePlaces).toBeDefined();
      expect(typeof useGooglePlaces).toBe('function');
    });

    it('exports useGooglePlacesSchool', async () => {
      const { useGooglePlacesSchool } = await import('./integrations/index.js');
      expect(useGooglePlacesSchool).toBeDefined();
      expect(typeof useGooglePlacesSchool).toBe('function');
    });
  });

  describe('File Hooks (hooks/files/)', () => {
    it('exports useImageUpload', async () => {
      const { useImageUpload } = await import('./files/index.js');
      expect(useImageUpload).toBeDefined();
      expect(typeof useImageUpload).toBe('function');
    });
  });

  describe('Navigation Hooks (hooks/navigation/)', () => {
    it('exports useViewNavigation', async () => {
      const { useViewNavigation } = await import('./navigation/index.js');
      expect(useViewNavigation).toBeDefined();
      expect(typeof useViewNavigation).toBe('function');
    });
  });

  describe('PWA Hooks (hooks/pwa/)', () => {
    it('exports usePWA', async () => {
      const { usePWA } = await import('./pwa/index.js');
      expect(usePWA).toBeDefined();
      expect(typeof usePWA).toBe('function');
    });
  });

  describe('Main Barrel (hooks/index.js)', () => {
    it('re-exports all UI hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.useModalController).toBeDefined();
      expect(hooks.useSimpleModals).toBeDefined();
      expect(hooks.useToast).toBeDefined();
    });

    it('re-exports all async hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.useAsyncOperation).toBeDefined();
      expect(hooks.useMultipleAsyncOperations).toBeDefined();
    });

    it('re-exports all integration hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.useGooglePlaces).toBeDefined();
      expect(hooks.useGooglePlacesSchool).toBeDefined();
    });

    it('re-exports all file hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.useImageUpload).toBeDefined();
    });

    it('re-exports all navigation hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.useViewNavigation).toBeDefined();
    });

    it('re-exports all PWA hooks', async () => {
      const hooks = await import('./index.js');
      expect(hooks.usePWA).toBeDefined();
    });
  });
});
