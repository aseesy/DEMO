/**
 * Connection Schema Validation
 *
 * Uses Zod for type-safe validation of connection/invitation requests.
 */

const { z } = require('zod');

/**
 * Contact form schema
 */
const contactFormSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters'),
  subject: z
    .string({
      required_error: 'Subject is required',
    })
    .trim()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be at most 200 characters'),
  message: z
    .string({
      required_error: 'Message is required',
    })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be at most 5000 characters'),
  website: z.string().optional(), // Honeypot field
});

/**
 * Send invitation schema
 */
const inviteSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
    })
    .trim()
    .min(1, 'Username is required'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(254, 'Email must be at most 254 characters'),
});

/**
 * Join token validation schema (query params)
 */
const joinTokenSchema = z.object({
  token: z
    .string({
      required_error: 'Token is required',
    })
    .trim()
    .min(1, 'Token is required'),
});

/**
 * Accept invitation schema
 */
const acceptInvitationSchema = z.object({
  token: z
    .string({
      required_error: 'Token is required',
    })
    .trim()
    .min(1, 'Token is required'),
  username: z
    .string({
      required_error: 'Username is required',
    })
    .trim()
    .min(1, 'Username is required'),
});

/**
 * Signup with token schema
 * Note: Uses username instead of firstName/lastName (legacy endpoint)
 */
const signupWithTokenSchema = z.object({
  token: z
    .string({
      required_error: 'Token is required',
    })
    .trim()
    .min(1, 'Token is required'),
  username: z
    .string({
      required_error: 'Username is required',
    })
    .trim()
    .min(2, 'Username must be at least 2 characters')
    .max(20, 'Username must be at most 20 characters'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(10, 'Password must be at least 10 characters')
    .max(128, 'Password must be at most 128 characters'),
  context: z.record(z.unknown()).optional(),
});

module.exports = {
  contactFormSchema,
  inviteSchema,
  joinTokenSchema,
  acceptInvitationSchema,
  signupWithTokenSchema,
};
