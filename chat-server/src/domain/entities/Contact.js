/**
 * Contact Domain Entity
 *
 * Represents a shared person (child, teacher, doctor, family member)
 * related to co-parenting. Encapsulates business rules for contact operations.
 *
 * @module domain/entities/Contact
 */

'use strict';

class Contact {
  /**
   * Create a Contact entity
   * @param {Object} params - Contact properties
   * @param {number} params.id - Contact ID
   * @param {number} params.userId - User ID (owner)
   * @param {string} params.contactName - Contact name
   * @param {string} [params.relationship] - Relationship type
   * @param {string} [params.contactEmail] - Contact email
   * @param {string} [params.phone] - Contact phone
   * @param {string} [params.notes] - Additional notes
   * @param {Date} [params.createdAt] - Creation timestamp
   * @param {Date} [params.updatedAt] - Last update timestamp
   */
  constructor({
    id,
    userId,
    contactName,
    relationship = null,
    contactEmail = null,
    phone = null,
    notes = null,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    if (!id && id !== 0) {
      throw new Error('Contact ID is required');
    }
    if (!userId) {
      throw new Error('Contact userId is required');
    }
    if (!contactName || typeof contactName !== 'string' || contactName.trim().length === 0) {
      throw new Error('Contact name is required');
    }

    this.id = id;
    this.userId = userId;
    this.contactName = contactName.trim();
    this.relationship = relationship;
    this.contactEmail = contactEmail ? contactEmail.trim().toLowerCase() : null;
    this.phone = phone ? phone.trim() : null;
    this.notes = notes ? notes.trim() : null;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);

    // Business rule: Contact must have at least one way to reach them
    if (!this.contactEmail && !this.phone) {
      // Allow contacts without contact info (e.g., children)
    }

    // Make immutable
    Object.freeze(this);
  }

  /**
   * Check if contact is a child
   * @returns {boolean} True if relationship indicates child
   */
  isChild() {
    return this.relationship === 'child' || this.relationship === 'children';
  }

  /**
   * Check if contact has email
   * @returns {boolean} True if has email
   */
  hasEmail() {
    return !!this.contactEmail;
  }

  /**
   * Check if contact has phone
   * @returns {boolean} True if has phone
   */
  hasPhone() {
    return !!this.phone;
  }

  /**
   * Update contact name
   * @param {string} newName - New contact name
   * @returns {Contact} New Contact instance with updated name
   */
  updateName(newName) {
    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      throw new Error('Contact name cannot be empty');
    }

    return new Contact({
      ...this.toPlainObject(),
      contactName: newName.trim(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update contact email
   * @param {string} newEmail - New contact email
   * @returns {Contact} New Contact instance with updated email
   */
  updateEmail(newEmail) {
    return new Contact({
      ...this.toPlainObject(),
      contactEmail: newEmail ? newEmail.trim().toLowerCase() : null,
      updatedAt: new Date(),
    });
  }

  /**
   * Update contact phone
   * @param {string} newPhone - New contact phone
   * @returns {Contact} New Contact instance with updated phone
   */
  updatePhone(newPhone) {
    return new Contact({
      ...this.toPlainObject(),
      phone: newPhone ? newPhone.trim() : null,
      updatedAt: new Date(),
    });
  }

  /**
   * Update contact relationship
   * @param {string} newRelationship - New relationship
   * @returns {Contact} New Contact instance with updated relationship
   */
  updateRelationship(newRelationship) {
    return new Contact({
      ...this.toPlainObject(),
      relationship: newRelationship,
      updatedAt: new Date(),
    });
  }

  /**
   * Update contact notes
   * @param {string} newNotes - New notes
   * @returns {Contact} New Contact instance with updated notes
   */
  updateNotes(newNotes) {
    return new Contact({
      ...this.toPlainObject(),
      notes: newNotes ? newNotes.trim() : null,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object (for serialization)
   * @returns {Object} Plain object representation
   */
  toPlainObject() {
    return {
      id: this.id,
      userId: this.userId,
      contactName: this.contactName,
      relationship: this.relationship,
      contactEmail: this.contactEmail,
      phone: this.phone,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Contact from database row
   * @param {Object} row - Database row
   * @returns {Contact} Contact entity
   */
  static fromDatabaseRow(row) {
    return new Contact({
      id: row.id,
      userId: row.user_id,
      contactName: row.contact_name,
      relationship: row.relationship,
      contactEmail: row.contact_email,
      phone: row.phone,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Create Contact from API data
   * @param {Object} data - API data
   * @returns {Contact} Contact entity
   */
  static fromApiData(data) {
    return new Contact({
      id: data.id,
      userId: data.userId || data.user_id,
      contactName: data.contactName || data.contact_name,
      relationship: data.relationship,
      contactEmail: data.contactEmail || data.contact_email,
      phone: data.phone,
      notes: data.notes,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at,
    });
  }
}

module.exports = Contact;

