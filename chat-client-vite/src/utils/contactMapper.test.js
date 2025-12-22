/**
 * Contact Mapper Unit Tests
 *
 * Tests the mapContactToFormData and mapFormDataToContact functions
 * to ensure they correctly handle missing, null, and undefined fields.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mapContactToFormData,
  mapFormDataToContact,
  getContactFormFields,
} from './contactMapper.js';
import { DEFAULT_CONTACT_FORM_DATA } from './contactFormDefaults.js';

describe('contactMapper', () => {
  describe('mapContactToFormData', () => {
    describe('null/undefined contact handling', () => {
      it('returns default form data when contact is null', () => {
        const result = mapContactToFormData(null);

        expect(result).toEqual(DEFAULT_CONTACT_FORM_DATA);
      });

      it('returns default form data when contact is undefined', () => {
        const result = mapContactToFormData(undefined);

        expect(result).toEqual(DEFAULT_CONTACT_FORM_DATA);
      });

      it('returns a new object (not reference to defaults)', () => {
        const result = mapContactToFormData(null);

        expect(result).not.toBe(DEFAULT_CONTACT_FORM_DATA);
        result.contact_name = 'Modified';
        expect(DEFAULT_CONTACT_FORM_DATA.contact_name).toBe('');
      });
    });

    describe('complete contact mapping', () => {
      it('maps all fields from a complete contact object', () => {
        const contact = {
          contact_name: 'Jane Doe',
          contact_email: 'jane@example.com',
          relationship: 'co-parent',
          phone: '555-1234',
          address: '123 Main St',
          school: 'Lincoln Elementary',
          child_age: '8',
          child_birthdate: '2016-03-15',
          custody_arrangement: 'Week on/week off',
          notes: 'Some notes',
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Jane Doe');
        expect(result.contact_email).toBe('jane@example.com');
        expect(result.relationship).toBe('My Co-Parent'); // Transformed via toDisplayRelationship
        expect(result.phone).toBe('555-1234');
        expect(result.address).toBe('123 Main St');
        expect(result.school).toBe('Lincoln Elementary');
        expect(result.child_age).toBe('8');
        expect(result.child_birthdate).toBe('2016-03-15');
        expect(result.custody_arrangement).toBe('Week on/week off');
      });

      it('maps child health fields correctly', () => {
        const contact = {
          contact_name: 'Child Name',
          child_health_physical_conditions: 'Asthma',
          child_health_allergies: 'Peanuts',
          child_health_medications: 'Inhaler',
          child_health_doctor: 'Dr. Smith',
          child_health_mental_conditions: 'None',
          child_health_mental_diagnosis: '',
          child_health_mental_treatment: '',
          child_health_therapist: '',
          child_health_developmental_delays: 'No',
          child_health_developmental_supports: '',
        };

        const result = mapContactToFormData(contact);

        expect(result.child_health_physical_conditions).toBe('Asthma');
        expect(result.child_health_allergies).toBe('Peanuts');
        expect(result.child_health_medications).toBe('Inhaler');
        expect(result.child_health_doctor).toBe('Dr. Smith');
        expect(result.child_health_developmental_delays).toBe('No');
      });

      it('maps co-parent financial fields correctly', () => {
        const contact = {
          contact_name: 'Co-Parent',
          coparent_pays_child_support: 'Yes',
          coparent_receives_child_support: 'No',
          coparent_work_schedule: '9-5 weekdays',
          coparent_work_flexibility: 'Limited',
        };

        const result = mapContactToFormData(contact);

        expect(result.coparent_pays_child_support).toBe('Yes');
        expect(result.coparent_receives_child_support).toBe('No');
        expect(result.coparent_work_schedule).toBe('9-5 weekdays');
        expect(result.coparent_work_flexibility).toBe('Limited');
      });
    });

    describe('missing field handling', () => {
      it('uses default empty string for missing fields', () => {
        const contact = {
          contact_name: 'Partial Contact',
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Partial Contact');
        expect(result.contact_email).toBe('');
        expect(result.phone).toBe('');
        expect(result.address).toBe('');
        expect(result.relationship).toBe('');
        expect(result.custody_arrangement).toBe('');
        expect(result.child_health_allergies).toBe('');
      });

      it('handles empty contact object', () => {
        const result = mapContactToFormData({});

        expect(result).toEqual(DEFAULT_CONTACT_FORM_DATA);
      });
    });

    describe('null field handling', () => {
      it('uses default empty string when field is null', () => {
        const contact = {
          contact_name: 'Test Contact',
          contact_email: null,
          phone: null,
          address: null,
          child_health_allergies: null,
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Test Contact');
        expect(result.contact_email).toBe('');
        expect(result.phone).toBe('');
        expect(result.address).toBe('');
        expect(result.child_health_allergies).toBe('');
      });

      it('handles all fields being null', () => {
        const contact = {
          contact_name: null,
          contact_email: null,
          relationship: null,
          phone: null,
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('');
        expect(result.contact_email).toBe('');
        expect(result.relationship).toBe('');
        expect(result.phone).toBe('');
      });
    });

    describe('undefined field handling', () => {
      it('uses default empty string when field is undefined', () => {
        const contact = {
          contact_name: 'Test Contact',
          contact_email: undefined,
          phone: undefined,
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Test Contact');
        expect(result.contact_email).toBe('');
        expect(result.phone).toBe('');
      });
    });

    describe('relationship transformation', () => {
      it('transforms backend relationship to display format', () => {
        const contact = {
          contact_name: 'Co-Parent Name',
          relationship: 'co-parent',
        };

        const result = mapContactToFormData(contact);

        expect(result.relationship).toBe('My Co-Parent');
      });

      it('transforms various backend relationship formats', () => {
        const relationships = [
          { input: 'co-parent', expected: 'My Co-Parent' },
          { input: 'my child', expected: 'My Child' },
          { input: 'my partner', expected: 'My Partner' },
          { input: 'my family', expected: 'My Family' },
          { input: 'other', expected: 'Other' },
        ];

        relationships.forEach(({ input, expected }) => {
          const result = mapContactToFormData({ relationship: input });
          expect(result.relationship).toBe(expected);
        });
      });

      it('handles null relationship gracefully', () => {
        const contact = {
          contact_name: 'Test',
          relationship: null,
        };

        const result = mapContactToFormData(contact);

        expect(result.relationship).toBe('');
      });

      it('handles empty string relationship', () => {
        const contact = {
          contact_name: 'Test',
          relationship: '',
        };

        const result = mapContactToFormData(contact);

        expect(result.relationship).toBe('');
      });
    });

    describe('mixed valid and invalid fields', () => {
      it('handles mix of valid values, nulls, and missing fields', () => {
        const contact = {
          contact_name: 'Mixed Contact',
          contact_email: null,
          relationship: 'my child',
          phone: undefined,
          // address is missing
          school: 'Test School',
          child_age: null,
          custody_arrangement: '',
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Mixed Contact');
        expect(result.contact_email).toBe('');
        expect(result.relationship).toBe('My Child');
        expect(result.phone).toBe('');
        expect(result.address).toBe('');
        expect(result.school).toBe('Test School');
        expect(result.child_age).toBe('');
        expect(result.custody_arrangement).toBe('');
      });
    });

    describe('extra fields handling', () => {
      it('ignores fields not in the mapping', () => {
        const contact = {
          contact_name: 'Test',
          unknown_field: 'should be ignored',
          another_random_field: 123,
        };

        const result = mapContactToFormData(contact);

        expect(result.contact_name).toBe('Test');
        expect(result.unknown_field).toBeUndefined();
        expect(result.another_random_field).toBeUndefined();
      });
    });
  });

  describe('mapFormDataToContact', () => {
    describe('null/undefined formData handling', () => {
      it('returns empty object when formData is null', () => {
        const result = mapFormDataToContact(null);

        expect(result).toEqual({});
      });

      it('returns empty object when formData is undefined', () => {
        const result = mapFormDataToContact(undefined);

        expect(result).toEqual({});
      });
    });

    describe('relationship transformation', () => {
      it('transforms display relationship to backend format', () => {
        const toBackendRelationship = vi.fn().mockReturnValue('co-parent');
        const formData = {
          contact_name: 'Test',
          relationship: 'My Co-Parent',
        };

        const result = mapFormDataToContact(formData, toBackendRelationship);

        expect(toBackendRelationship).toHaveBeenCalledWith('My Co-Parent');
        expect(result.relationship).toBe('co-parent');
      });

      it('does not transform if no transformer provided', () => {
        const formData = {
          contact_name: 'Test',
          relationship: 'My Co-Parent',
        };

        const result = mapFormDataToContact(formData);

        expect(result.relationship).toBe('My Co-Parent');
      });

      it('handles null relationship', () => {
        const toBackendRelationship = vi.fn();
        const formData = {
          contact_name: 'Test',
          relationship: null,
        };

        const result = mapFormDataToContact(formData, toBackendRelationship);

        expect(toBackendRelationship).not.toHaveBeenCalled();
        expect(result.relationship).toBeUndefined();
      });
    });

    describe('null/undefined value cleanup', () => {
      it('removes null values from result', () => {
        const formData = {
          contact_name: 'Test',
          contact_email: null,
          phone: 'valid',
        };

        const result = mapFormDataToContact(formData);

        expect(result.contact_name).toBe('Test');
        expect(result.phone).toBe('valid');
        expect('contact_email' in result).toBe(false);
      });

      it('removes undefined values from result', () => {
        const formData = {
          contact_name: 'Test',
          contact_email: undefined,
          phone: 'valid',
        };

        const result = mapFormDataToContact(formData);

        expect(result.contact_name).toBe('Test');
        expect(result.phone).toBe('valid');
        expect('contact_email' in result).toBe(false);
      });

      it('keeps empty string values', () => {
        const formData = {
          contact_name: 'Test',
          contact_email: '',
          phone: '',
        };

        const result = mapFormDataToContact(formData);

        expect(result.contact_name).toBe('Test');
        expect(result.contact_email).toBe('');
        expect(result.phone).toBe('');
      });
    });

    describe('round-trip consistency', () => {
      it('maintains data integrity through form -> API -> form cycle', () => {
        const originalContact = {
          contact_name: 'Round Trip Test',
          contact_email: 'test@example.com',
          relationship: 'co-parent',
          phone: '555-0000',
          school: 'Test School',
        };

        // Contact -> Form
        const formData = mapContactToFormData(originalContact);

        // Form -> Contact (with transformer)
        const toBackend = value => {
          if (value === 'My Co-Parent') return 'co-parent';
          return value.toLowerCase();
        };
        const contactData = mapFormDataToContact(formData, toBackend);

        // Verify key fields survived the round trip
        expect(contactData.contact_name).toBe('Round Trip Test');
        expect(contactData.contact_email).toBe('test@example.com');
        expect(contactData.relationship).toBe('co-parent');
        expect(contactData.phone).toBe('555-0000');
        expect(contactData.school).toBe('Test School');
      });
    });
  });

  describe('getContactFormFields', () => {
    it('returns array of all field names', () => {
      const fields = getContactFormFields();

      expect(Array.isArray(fields)).toBe(true);
      expect(fields).toContain('contact_name');
      expect(fields).toContain('contact_email');
      expect(fields).toContain('relationship');
      expect(fields).toContain('child_health_allergies');
      expect(fields).toContain('coparent_work_schedule');
    });

    it('returns same fields as DEFAULT_CONTACT_FORM_DATA keys', () => {
      const fields = getContactFormFields();
      const defaultKeys = Object.keys(DEFAULT_CONTACT_FORM_DATA);

      expect(fields).toEqual(defaultKeys);
    });
  });
});
