/**
 * Infrastructure Module Export Tests
 *
 * Ensures all infrastructure modules are properly exported and accessible.
 * Catches issues with require paths after refactoring.
 */

const { describe, it, expect } = require('@jest/globals');

describe('Infrastructure Module Exports', () => {
  describe('Utils (infrastructure/utils)', () => {
    it('exports date utilities', () => {
      const utils = require('../../infrastructure/utils/index');
      expect(utils).toBeDefined();
    });
  });

  describe('Logging (infrastructure/logging)', () => {
    it('exports logger', () => {
      const logger = require('../../infrastructure/logging/index');
      expect(logger).toBeDefined();
    });
  });

  describe('Errors (infrastructure/errors)', () => {
    it('exports error classes', () => {
      const errors = require('../../infrastructure/errors/index');
      expect(errors).toBeDefined();
    });
  });

  describe('Security (infrastructure/security)', () => {
    it('exports crypto utilities', () => {
      const security = require('../../infrastructure/security/index');
      expect(security).toBeDefined();
      expect(typeof security.generateToken).toBe('function');
    });
  });

  describe('Config (infrastructure/config)', () => {
    it('exports constants', () => {
      const config = require('../../infrastructure/config/index');
      expect(config).toBeDefined();
    });
  });

  describe('Validation (infrastructure/validation)', () => {
    it('exports validators', () => {
      const validation = require('../../infrastructure/validation/index');
      expect(validation).toBeDefined();
    });
  });

  describe('Database (infrastructure/database)', () => {
    it('exports neo4jClient', () => {
      const database = require('../../infrastructure/database/index');
      expect(database).toBeDefined();
      expect(database.neo4jClient).toBeDefined();
    });
  });

  describe('Main Infrastructure Barrel', () => {
    it('exports all infrastructure modules', () => {
      const infra = require('../../infrastructure/index');

      expect(infra.utils).toBeDefined();
      expect(infra.logging).toBeDefined();
      expect(infra.errors).toBeDefined();
      expect(infra.security).toBeDefined();
      expect(infra.config).toBeDefined();
      expect(infra.validation).toBeDefined();
      expect(infra.database).toBeDefined();
    });
  });
});
