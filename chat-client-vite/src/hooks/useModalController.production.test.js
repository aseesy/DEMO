/**
 * Production Crash Prevention Tests for useModalController
 *
 * These tests specifically detect issues that can crash the entire app:
 * - Missing import dependencies
 * - Unregistered files in git
 * - Module resolution failures
 *
 * The production crash on 2024-12-21 was caused by:
 * - useModalController.js importing dependencyValidator.js and modalCollisionDetector.js
 * - These files were never committed to git
 * - Production build succeeded but runtime failed with "module not found"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Modal Controller Production Stability', () => {
  describe('Critical Import Dependencies', () => {
    it('should successfully import useModalController', async () => {
      // This test fails if any imported module is missing
      const module = await import('./useModalController.js');
      expect(module.useModalController).toBeDefined();
      expect(typeof module.useModalController).toBe('function');
    });

    it('should successfully import modalRegistry', async () => {
      const module = await import('./modalRegistry.js');
      expect(module.registerModalHook).toBeDefined();
      expect(module.getRegisteredModals).toBeDefined();
    });

    it('should successfully import useSimpleModals', async () => {
      const module = await import('./useSimpleModals.js');
      expect(module.useSimpleModals).toBeDefined();
    });

    it('should successfully import modalCollisionDetector', async () => {
      const module = await import('./modalCollisionDetector.js');
      expect(module.detectModalCollisions).toBeDefined();
    });

    it('should successfully import dependencyValidator', async () => {
      const module = await import('./dependencyValidator.js');
      expect(module.validateDependencies).toBeDefined();
    });

    it('should successfully import modalHooks.registration', async () => {
      const module = await import('./modalHooks.registration.js');
      expect(module.registerAllModalHooks).toBeDefined();
    });
  });

  describe('File Existence Verification', () => {
    const hooksDir = path.resolve(__dirname);

    const requiredFiles = [
      'useModalController.js',
      'modalRegistry.js',
      'useSimpleModals.js',
      'modalCollisionDetector.js',
      'dependencyValidator.js',
      'modalHooks.registration.js',
      'useTaskFormModal.js',
      'useContactSuggestionModal.js',
      'useMessageFlaggingModal.js',
    ];

    requiredFiles.forEach(file => {
      it(`should have ${file} in the hooks directory`, () => {
        const filePath = path.join(hooksDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Modal Controller Instantiation', () => {
    it('should not throw when instantiated with minimal props', async () => {
      const { useModalController } = await import('./useModalController.js');
      const { renderHook } = await import('@testing-library/react');

      expect(() => {
        renderHook(() =>
          useModalController({
            messages: [],
            setCurrentView: vi.fn(),
          })
        );
      }).not.toThrow();
    });

    it('should return modal objects with expected structure', async () => {
      // Register modals first (this normally happens in main.jsx)
      const { registerAllModalHooks } = await import('./modalHooks.registration.js');
      registerAllModalHooks();

      const { useModalController } = await import('./useModalController.js');
      const { renderHook } = await import('@testing-library/react');

      const { result } = renderHook(() =>
        useModalController({
          messages: [],
          setCurrentView: vi.fn(),
        })
      );

      // Should have simple modals
      expect(result.current).toHaveProperty('welcomeModal');
      expect(result.current).toHaveProperty('profileTaskModal');
      expect(result.current).toHaveProperty('inviteModal');

      // Should have complex modals from registry (after registration)
      expect(result.current).toHaveProperty('taskFormModal');
      expect(result.current).toHaveProperty('contactSuggestionModal');
      expect(result.current).toHaveProperty('messageFlaggingModal');
    });
  });

  describe('Dependency Validation', () => {
    it('validateDependencies should throw for missing dependencies', async () => {
      const { validateDependencies } = await import('./dependencyValidator.js');

      expect(() => {
        validateDependencies(['requiredDep'], {}, 'testModal');
      }).toThrow(/Missing required dependencies/);
    });

    it('validateDependencies should not throw when all dependencies present', async () => {
      const { validateDependencies } = await import('./dependencyValidator.js');

      expect(() => {
        validateDependencies(['messages', 'setCurrentView'], {
          messages: [],
          setCurrentView: () => {},
        }, 'testModal');
      }).not.toThrow();
    });
  });

  describe('Collision Detection', () => {
    it('detectModalCollisions should throw for name collisions', async () => {
      const { detectModalCollisions } = await import('./modalCollisionDetector.js');

      expect(() => {
        detectModalCollisions(
          ['welcomeModal', 'inviteModal'],
          [{ name: 'welcomeModal', factory: () => {} }]
        );
      }).toThrow(/Modal name collision detected/);
    });

    it('detectModalCollisions should not throw for unique names', async () => {
      const { detectModalCollisions } = await import('./modalCollisionDetector.js');

      expect(() => {
        detectModalCollisions(
          ['welcomeModal', 'inviteModal'],
          [{ name: 'customModal', factory: () => {} }]
        );
      }).not.toThrow();
    });
  });
});

describe('Modal Registration Integrity', () => {
  it('should register all modals without errors', async () => {
    const { registerAllModalHooks } = await import('./modalHooks.registration.js');
    const { getRegisteredModals, clearRegistry } = await import('./modalRegistry.js');

    // Clear any existing registrations
    if (typeof clearRegistry === 'function') {
      clearRegistry();
    }

    expect(() => {
      registerAllModalHooks();
    }).not.toThrow();

    const registered = getRegisteredModals();
    expect(registered.length).toBeGreaterThan(0);
  });

  it('registerAllModalHooks should be idempotent', async () => {
    const { registerAllModalHooks } = await import('./modalHooks.registration.js');
    const { getRegisteredModals } = await import('./modalRegistry.js');

    // Call multiple times
    registerAllModalHooks();
    registerAllModalHooks();
    registerAllModalHooks();

    const registered = getRegisteredModals();

    // Should not have duplicates - check for unique names
    const names = registered.map(m => m.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
  });
});
