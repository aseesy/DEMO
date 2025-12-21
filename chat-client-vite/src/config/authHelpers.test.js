/**
 * Tests for authHelpers pure functions
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorActionType,
  getErrorAction,
  getErrorActionLabel,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  validateEmail,
  validateUsername,
  validateSignupForm,
  validateLoginForm,
} from './authHelpers.js';

describe('authHelpers', () => {
  describe('ErrorActionType', () => {
    it('has all expected action types', () => {
      expect(ErrorActionType.SIGN_IN).toBe('sign_in');
      expect(ErrorActionType.CREATE_ACCOUNT).toBe('create_account');
      expect(ErrorActionType.GOOGLE_SIGNIN).toBe('google_signin');
      expect(ErrorActionType.NONE).toBe('none');
    });
  });

  describe('getErrorAction', () => {
    it('returns SIGN_IN for "already registered" error', () => {
      expect(getErrorAction('Email is already registered')).toBe(ErrorActionType.SIGN_IN);
      expect(getErrorAction('This account is already registered')).toBe(ErrorActionType.SIGN_IN);
    });

    it('returns CREATE_ACCOUNT for "no account found" error', () => {
      expect(getErrorAction('No account found with this email')).toBe(ErrorActionType.CREATE_ACCOUNT);
      expect(getErrorAction('No account found')).toBe(ErrorActionType.CREATE_ACCOUNT);
    });

    it('returns CREATE_ACCOUNT for "account found" error', () => {
      expect(getErrorAction("Couldn't find account found for this email")).toBe(ErrorActionType.CREATE_ACCOUNT);
    });

    it('returns GOOGLE_SIGNIN for "google sign-in" error', () => {
      expect(getErrorAction('Please use Google sign-in')).toBe(ErrorActionType.GOOGLE_SIGNIN);
      expect(getErrorAction('This account uses Google sign-in')).toBe(ErrorActionType.GOOGLE_SIGNIN);
    });

    it('returns NONE for generic errors', () => {
      expect(getErrorAction('Something went wrong')).toBe(ErrorActionType.NONE);
      expect(getErrorAction('Invalid password')).toBe(ErrorActionType.NONE);
      expect(getErrorAction('Network error')).toBe(ErrorActionType.NONE);
    });

    it('returns NONE for empty string', () => {
      expect(getErrorAction('')).toBe(ErrorActionType.NONE);
    });

    it('returns NONE for null', () => {
      expect(getErrorAction(null)).toBe(ErrorActionType.NONE);
    });

    it('returns NONE for undefined', () => {
      expect(getErrorAction(undefined)).toBe(ErrorActionType.NONE);
    });

    it('returns NONE for non-string input', () => {
      expect(getErrorAction(123)).toBe(ErrorActionType.NONE);
      expect(getErrorAction({})).toBe(ErrorActionType.NONE);
      expect(getErrorAction([])).toBe(ErrorActionType.NONE);
    });

    it('is case-insensitive', () => {
      expect(getErrorAction('ALREADY REGISTERED')).toBe(ErrorActionType.SIGN_IN);
      expect(getErrorAction('Already Registered')).toBe(ErrorActionType.SIGN_IN);
      expect(getErrorAction('NO ACCOUNT FOUND')).toBe(ErrorActionType.CREATE_ACCOUNT);
    });
  });

  describe('getErrorActionLabel', () => {
    it('returns correct label for SIGN_IN', () => {
      expect(getErrorActionLabel(ErrorActionType.SIGN_IN)).toBe('Sign in instead');
    });

    it('returns correct label for CREATE_ACCOUNT', () => {
      expect(getErrorActionLabel(ErrorActionType.CREATE_ACCOUNT)).toBe('Create account');
    });

    it('returns correct label for GOOGLE_SIGNIN', () => {
      expect(getErrorActionLabel(ErrorActionType.GOOGLE_SIGNIN)).toBe('Sign in with Google');
    });

    it('returns empty string for NONE', () => {
      expect(getErrorActionLabel(ErrorActionType.NONE)).toBe('');
    });

    it('returns empty string for unknown action type', () => {
      expect(getErrorActionLabel('unknown')).toBe('');
      expect(getErrorActionLabel(null)).toBe('');
      expect(getErrorActionLabel(undefined)).toBe('');
    });
  });

  describe('PASSWORD_MIN_LENGTH', () => {
    it('is 10 characters', () => {
      expect(PASSWORD_MIN_LENGTH).toBe(10);
    });
  });

  describe('validatePassword', () => {
    it('returns valid for password meeting minimum length', () => {
      const result = validatePassword('1234567890');
      expect(result.valid).toBe(true);
      expect(result.message).toBeNull();
    });

    it('returns valid for password exceeding minimum length', () => {
      const result = validatePassword('this is a very long password');
      expect(result.valid).toBe(true);
      expect(result.message).toBeNull();
    });

    it('returns invalid for password below minimum length', () => {
      const result = validatePassword('123456789');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('10 characters');
    });

    it('returns invalid for empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('returns invalid for null password', () => {
      const result = validatePassword(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('returns invalid for undefined password', () => {
      const result = validatePassword(undefined);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });
  });

  describe('validateEmail', () => {
    it('returns valid for correct email format', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
      expect(validateEmail('user.name@domain.org').valid).toBe(true);
      expect(validateEmail('user+tag@example.co.uk').valid).toBe(true);
    });

    it('returns invalid for missing @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('returns invalid for missing domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('returns invalid for missing TLD', () => {
      const result = validateEmail('test@example');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('valid email');
    });

    it('returns invalid for empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Email is required');
    });

    it('returns invalid for null email', () => {
      const result = validateEmail(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Email is required');
    });

    it('returns invalid for email with spaces', () => {
      const result = validateEmail('test @example.com');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('returns valid for username with 2+ characters', () => {
      expect(validateUsername('Jo').valid).toBe(true);
      expect(validateUsername('John Doe').valid).toBe(true);
      expect(validateUsername('A very long name').valid).toBe(true);
    });

    it('returns invalid for single character', () => {
      const result = validateUsername('J');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('2 characters');
    });

    it('returns invalid for whitespace-only input', () => {
      const result = validateUsername('   ');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('2 characters');
    });

    it('returns invalid for empty string', () => {
      const result = validateUsername('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Name is required');
    });

    it('returns invalid for null', () => {
      const result = validateUsername(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Name is required');
    });

    it('returns invalid for undefined', () => {
      const result = validateUsername(undefined);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Name is required');
    });

    it('trims whitespace before checking length', () => {
      const result = validateUsername(' J ');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('2 characters');
    });
  });

  describe('validateSignupForm', () => {
    it('returns valid for complete valid form', () => {
      const result = validateSignupForm({
        email: 'test@example.com',
        password: '1234567890',
        username: 'John Doe',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns all errors for completely invalid form', () => {
      const result = validateSignupForm({
        email: '',
        password: '',
        username: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.username).toBeDefined();
    });

    it('returns only email error for invalid email', () => {
      const result = validateSignupForm({
        email: 'invalid',
        password: '1234567890',
        username: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeUndefined();
      expect(result.errors.username).toBeUndefined();
    });

    it('returns only password error for invalid password', () => {
      const result = validateSignupForm({
        email: 'test@example.com',
        password: 'short',
        username: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeUndefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.username).toBeUndefined();
    });

    it('returns only username error for invalid username', () => {
      const result = validateSignupForm({
        email: 'test@example.com',
        password: '1234567890',
        username: 'J',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeUndefined();
      expect(result.errors.password).toBeUndefined();
      expect(result.errors.username).toBeDefined();
    });

    it('returns multiple errors when multiple fields are invalid', () => {
      const result = validateSignupForm({
        email: 'invalid',
        password: 'short',
        username: 'John Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
      expect(result.errors.username).toBeUndefined();
    });
  });

  describe('validateLoginForm', () => {
    it('returns valid for complete valid form', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns all errors for completely invalid form', () => {
      const result = validateLoginForm({
        email: '',
        password: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeDefined();
    });

    it('returns only email error for invalid email', () => {
      const result = validateLoginForm({
        email: 'invalid',
        password: 'anypassword',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeDefined();
      expect(result.errors.password).toBeUndefined();
    });

    it('returns only password error for missing password', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeUndefined();
      expect(result.errors.password).toBeDefined();
    });

    it('does not validate password length for login', () => {
      // Login only requires password to be present, not meet minimum length
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'short',
      });
      expect(result.valid).toBe(true);
    });
  });
});
