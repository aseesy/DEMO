/**
 * User Entity Tests
 *
 * Tests for User domain entity business rules and methods.
 */

const User = require('../User');
const Email = require('../../valueObjects/Email');
const Username = require('../../valueObjects/Username');

describe('User Entity', () => {
  describe('Constructor', () => {
    it('should create a User with required fields', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.id).toBe(1);
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.toString()).toBe('test@example.com');
      expect(user.username).toBeInstanceOf(Username);
      expect(user.username.toString()).toBe('testuser');
    });

    it('should throw error if id is missing', () => {
      expect(() => {
        new User({
          email: 'test@example.com',
          username: 'testuser',
        });
      }).toThrow('User ID is required');
    });

    it('should accept Email and Username value objects', () => {
      const email = new Email('test@example.com');
      const username = new Username('testuser');

      const user = new User({
        id: 1,
        email,
        username,
      });

      expect(user.email).toBe(email);
      expect(user.username).toBe(username);
    });

    it('should normalize email to lowercase', () => {
      const user = new User({
        id: 1,
        email: 'TEST@EXAMPLE.COM',
        username: 'testuser',
      });

      expect(user.email.toString()).toBe('test@example.com');
    });

    it('should handle optional fields', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed',
        googleId: 'google123',
      });

      expect(user.displayName).toBe('Test User');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.passwordHash).toBe('hashed');
      expect(user.googleId).toBe('google123');
    });

    it('should make entity immutable', () => {
      'use strict';
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(() => {
        user.id = 2;
      }).toThrow(TypeError);
    });
  });

  describe('getFullName', () => {
    it('should return full name when first and last name exist', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(user.getFullName()).toBe('John Doe');
    });

    it('should return display name when no first/last name', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Johnny',
      });

      expect(user.getFullName()).toBe('Johnny');
    });

    it('should return email when no name fields', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.getFullName()).toBe('test@example.com');
    });
  });

  describe('hasPassword', () => {
    it('should return true when password hash exists', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed',
      });

      expect(user.hasPassword()).toBe(true);
    });

    it('should return false when no password hash', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.hasPassword()).toBe(false);
    });
  });

  describe('isOAuthOnly', () => {
    it('should return true when has googleId but no password', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        googleId: 'google123',
      });

      expect(user.isOAuthOnly()).toBe(true);
    });

    it('should return false when has password', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        googleId: 'google123',
        passwordHash: 'hashed',
      });

      expect(user.isOAuthOnly()).toBe(false);
    });

    it('should return false when no googleId', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(user.isOAuthOnly()).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should create new User with updated lastLogin', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
      });

      const updated = user.updateLastLogin();

      expect(updated).not.toBe(user); // New instance
      expect(updated.lastLogin).toBeInstanceOf(Date);
      // Allow for small timing differences (use >= instead of >)
      expect(updated.lastLogin.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime());
    });
  });

  describe('fromDatabaseRow', () => {
    it('should create User from database row', () => {
      const row = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashed',
        google_id: 'google123',
        created_at: new Date('2024-01-01'),
        last_login: new Date('2024-01-02'),
      };

      const user = User.fromDatabaseRow(row);

      expect(user.id).toBe(1);
      expect(user.email.toString()).toBe('test@example.com');
      expect(user.username.toString()).toBe('testuser');
      expect(user.displayName).toBe('Test User');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
      expect(user.passwordHash).toBe('hashed');
      expect(user.googleId).toBe('google123');
    });
  });

  describe('fromApiData', () => {
    it('should create User from API data', () => {
      const data = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = User.fromApiData(data);

      expect(user.id).toBe(1);
      expect(user.email.toString()).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
    });

    it('should handle snake_case API data', () => {
      const data = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
      };

      const user = User.fromApiData(data);

      expect(user.displayName).toBe('Test User');
      expect(user.firstName).toBe('Test');
      expect(user.lastName).toBe('User');
    });
  });

  describe('toPlainObject', () => {
    it('should convert to plain object', () => {
      const user = new User({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
      });

      const plain = user.toPlainObject();

      expect(plain).toEqual({
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        firstName: null,
        lastName: null,
        passwordHash: null,
        googleId: null,
        createdAt: expect.any(Date),
        lastLogin: null,
      });
    });
  });
});
