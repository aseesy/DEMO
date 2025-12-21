/**
 * Runtime Verification Tests for Repository Pattern
 * 
 * Tests that all repositories and services can be loaded and instantiated correctly
 * Run with: npm test -- runtime-verification
 */

describe('Repository Pattern Runtime Verification', () => {
  describe('Repository Interfaces', () => {
    test('IGenericRepository interface loads', () => {
      const { IGenericRepository } = require('../interfaces/IGenericRepository');
      expect(IGenericRepository).toBeDefined();
    });

    test('IUserRepository interface loads', () => {
      const { IUserRepository } = require('../interfaces/IUserRepository');
      expect(IUserRepository).toBeDefined();
    });
  });

  describe('Repository Implementations', () => {
    test('PostgresGenericRepository loads', () => {
      const { PostgresGenericRepository } = require('../postgres/PostgresGenericRepository');
      expect(PostgresGenericRepository).toBeDefined();
    });

    test('PostgresUserRepository loads', () => {
      const { PostgresUserRepository } = require('../postgres/PostgresUserRepository');
      expect(PostgresUserRepository).toBeDefined();
    });

    test('PostgresGenericRepository can be instantiated', () => {
      const { PostgresGenericRepository } = require('../postgres/PostgresGenericRepository');
      const repo = new PostgresGenericRepository('test_table');
      expect(repo.tableName).toBe('test_table');
    });

    test('PostgresUserRepository can be instantiated', () => {
      const { PostgresUserRepository } = require('../postgres/PostgresUserRepository');
      const repo = new PostgresUserRepository();
      expect(repo).toBeDefined();
    });
  });

  describe('Repository Index', () => {
    test('Repository index exports interfaces and implementations', () => {
      const repos = require('../index');
      expect(repos.IGenericRepository).toBeDefined();
      expect(repos.PostgresUserRepository).toBeDefined();
    });
  });

  describe('BaseService', () => {
    test('BaseService can be instantiated with repository', () => {
      const { BaseService } = require('../../services/BaseService');
      const { PostgresGenericRepository } = require('../postgres/PostgresGenericRepository');
      const repo = new PostgresGenericRepository('test_table');
      const service = new BaseService(null, repo);
      expect(service.repository).toBe(repo);
    });

    test('BaseService can be instantiated with tableName (backward compat)', () => {
      const { BaseService } = require('../../services/BaseService');
      const service = new BaseService('test_table');
      expect(service.repository).toBeDefined();
      expect(service.repository.constructor.name).toBe('PostgresGenericRepository');
    });
  });

  describe('Services', () => {
    test('ProfileService can be loaded and instantiated', () => {
      const { ProfileService } = require('../../services/profile/profileService');
      const service = new ProfileService();
      expect(service.repository).toBeDefined();
      expect(service.userRepository).toBeDefined();
      expect(service.contactRepository).toBeDefined();
    });

    test('TaskService can be loaded and instantiated', () => {
      const { TaskService } = require('../../services/task/taskService');
      const service = new TaskService();
      expect(service.repository).toBeDefined();
      expect(service.taskRepository).toBeDefined();
      expect(service.userRepository).toBeDefined();
    });

    test('RoomService can be loaded and instantiated', () => {
      const { RoomService } = require('../../services/room/roomService');
      const service = new RoomService();
      expect(service.repository).toBeDefined();
      expect(service.roomRepository).toBeDefined();
    });

    test('PairingService can be loaded and instantiated', () => {
      const { PairingService } = require('../../services/pairing/pairingService');
      const service = new PairingService();
      expect(service.userRepository).toBeDefined();
    });

    test('InvitationService can be loaded and instantiated', () => {
      const { InvitationService } = require('../../services/invitation/invitationService');
      const service = new InvitationService();
      expect(service.userRepository).toBeDefined();
    });
  });

  describe('Service Index', () => {
    test('Core services can be loaded from services index', () => {
      const services = require('../../services');
      expect(services.profileService).toBeDefined();
      expect(services.taskService).toBeDefined();
      expect(services.roomService).toBeDefined();
      expect(services.pairingService).toBeDefined();
      expect(services.invitationService).toBeDefined();
    });
  });

  describe('Type Checking', () => {
    test('Repository instanceof IGenericRepository works', () => {
      const { IGenericRepository } = require('../interfaces/IGenericRepository');
      const { PostgresGenericRepository } = require('../postgres/PostgresGenericRepository');
      const repo = new PostgresGenericRepository('test_table');
      expect(repo instanceof IGenericRepository).toBe(true);
    });

    test('UserRepository instanceof IGenericRepository works', () => {
      const { IGenericRepository } = require('../interfaces/IGenericRepository');
      const { PostgresUserRepository } = require('../postgres/PostgresUserRepository');
      const repo = new PostgresUserRepository();
      expect(repo instanceof IGenericRepository).toBe(true);
    });
  });
});

