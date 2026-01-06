/**
 * Contact Entity Tests
 *
 * Tests for Contact domain entity business rules and methods.
 */

const Contact = require('../Contact');

describe('Contact Entity', () => {
  describe('Constructor', () => {
    it('should create a Contact with required fields', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      expect(contact.id).toBe(1);
      expect(contact.userId).toBe(1);
      expect(contact.contactName).toBe('John Doe');
    });

    it('should throw error if id is missing', () => {
      expect(() => {
        new Contact({
          userId: 1,
          contactName: 'John Doe',
        });
      }).toThrow('Contact ID is required');
    });

    it('should throw error if userId is missing', () => {
      expect(() => {
        new Contact({
          id: 1,
          contactName: 'John Doe',
        });
      }).toThrow('Contact userId is required');
    });

    it('should throw error if contactName is missing', () => {
      expect(() => {
        new Contact({
          id: 1,
          userId: 1,
        });
      }).toThrow('Contact name is required');
    });

    it('should throw error if contactName is empty', () => {
      expect(() => {
        new Contact({
          id: 1,
          userId: 1,
          contactName: '   ',
        });
      }).toThrow('Contact name is required');
    });

    it('should trim contact name', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: '  John Doe  ',
      });

      expect(contact.contactName).toBe('John Doe');
    });

    it('should normalize email to lowercase', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
        contactEmail: 'JOHN@EXAMPLE.COM',
      });

      expect(contact.contactEmail).toBe('john@example.com');
    });

    it('should make entity immutable', () => {
      'use strict';
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      expect(() => {
        contact.contactName = 'New Name';
      }).toThrow(TypeError);
    });
  });

  describe('isChild', () => {
    it('should return true if relationship is child', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'Child',
        relationship: 'child',
      });

      expect(contact.isChild()).toBe(true);
    });

    it('should return true if relationship is children', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'Children',
        relationship: 'children',
      });

      expect(contact.isChild()).toBe(true);
    });

    it('should return false for other relationships', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'Teacher',
        relationship: 'teacher',
      });

      expect(contact.isChild()).toBe(false);
    });
  });

  describe('hasEmail', () => {
    it('should return true if contact has email', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
      });

      expect(contact.hasEmail()).toBe(true);
    });

    it('should return false if contact has no email', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      expect(contact.hasEmail()).toBe(false);
    });
  });

  describe('hasPhone', () => {
    it('should return true if contact has phone', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
        phone: '555-1234',
      });

      expect(contact.hasPhone()).toBe(true);
    });

    it('should return false if contact has no phone', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      expect(contact.hasPhone()).toBe(false);
    });
  });

  describe('updateName', () => {
    it('should create new Contact with updated name', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'Old Name',
      });

      const updated = contact.updateName('New Name');

      expect(updated).not.toBe(contact); // New instance
      expect(updated.contactName).toBe('New Name');
    });

    it('should throw error if new name is empty', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      expect(() => {
        contact.updateName('');
      }).toThrow('Contact name cannot be empty');
    });
  });

  describe('updateEmail', () => {
    it('should create new Contact with updated email', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      const updated = contact.updateEmail('new@example.com');

      expect(updated).not.toBe(contact); // New instance
      expect(updated.contactEmail).toBe('new@example.com');
    });

    it('should normalize email to lowercase', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      const updated = contact.updateEmail('NEW@EXAMPLE.COM');

      expect(updated.contactEmail).toBe('new@example.com');
    });
  });

  describe('updatePhone', () => {
    it('should create new Contact with updated phone', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
      });

      const updated = contact.updatePhone('555-5678');

      expect(updated).not.toBe(contact); // New instance
      expect(updated.phone).toBe('555-5678');
    });
  });

  describe('updateRelationship', () => {
    it('should create new Contact with updated relationship', () => {
      const contact = new Contact({
        id: 1,
        userId: 1,
        contactName: 'John Doe',
        relationship: 'teacher',
      });

      const updated = contact.updateRelationship('doctor');

      expect(updated).not.toBe(contact); // New instance
      expect(updated.relationship).toBe('doctor');
    });
  });

  describe('fromDatabaseRow', () => {
    it('should create Contact from database row', () => {
      const row = {
        id: 1,
        user_id: 1,
        contact_name: 'John Doe',
        relationship: 'teacher',
        contact_email: 'john@example.com',
        phone: '555-1234',
        notes: 'Notes',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
      };

      const contact = Contact.fromDatabaseRow(row);

      expect(contact.id).toBe(1);
      expect(contact.userId).toBe(1);
      expect(contact.contactName).toBe('John Doe');
      expect(contact.relationship).toBe('teacher');
      expect(contact.contactEmail).toBe('john@example.com');
      expect(contact.phone).toBe('555-1234');
    });
  });

  describe('fromApiData', () => {
    it('should create Contact from API data', () => {
      const data = {
        id: 1,
        userId: 1,
        contactName: 'John Doe',
        relationship: 'teacher',
      };

      const contact = Contact.fromApiData(data);

      expect(contact.id).toBe(1);
      expect(contact.userId).toBe(1);
      expect(contact.contactName).toBe('John Doe');
    });

    it('should handle snake_case API data', () => {
      const data = {
        id: 1,
        user_id: 1,
        contact_name: 'John Doe',
        contact_email: 'john@example.com',
        created_at: '2024-01-01',
      };

      const contact = Contact.fromApiData(data);

      expect(contact.userId).toBe(1);
      expect(contact.contactName).toBe('John Doe');
      expect(contact.contactEmail).toBe('john@example.com');
    });
  });
});
