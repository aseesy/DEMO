/**
 * Signup Schema Validation
 * 
 * Uses Zod for type-safe validation with coercion and max length constraints.
 * Middleware validates + coerces, so route handlers only see clean data.
 */

const { z } = require('zod');

// Email schema: string, trim, lower, max 254 (RFC 5321)
const emailSchema = z
  .string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .trim()
  .toLowerCase()
  .max(254, 'Email must be at most 254 characters')
  .email('Invalid email address');

// Name schema: string, trim, max 60
const nameSchema = z
  .string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  })
  .trim()
  .max(60, 'Name must be at most 60 characters');

// Password schema: string, min 10 (policy), max 128 (already enforced)
const passwordSchema = z
  .string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters');

/**
 * Signup schema
 * Validates: email, password, firstName, lastName
 */
const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  // Optional fields
  context: z.record(z.unknown()).optional(),
  website: z.string().optional(), // Honeypot field
});

/**
 * Register schema (signup with co-parent invitation)
 * Validates: email, password, firstName, lastName, coParentEmail
 */
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  coParentEmail: emailSchema,
  // Optional fields
  context: z.record(z.unknown()).optional(),
  website: z.string().optional(), // Honeypot field
});

module.exports = {
  signupSchema,
  registerSchema,
};
